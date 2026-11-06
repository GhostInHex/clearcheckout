import type Database from 'better-sqlite3';
import {createHash,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {extensionIdSchema,linkBindingSchema,exchangeSchema,deviceScopeSchema} from '../shared/extension-link.js';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const secret=()=>randomBytes(32).toString('hex');
const linkRow=z.object({user_id:z.string(),extension_id:extensionIdSchema,installation_id:z.string(),nonce:z.string(),expires:z.number()});
const deviceRow=z.object({id:z.string(),user_id:z.string(),extension_id:extensionIdSchema,installation_id:z.string(),expires:z.number(),revoked:z.number(),scope:deviceScopeSchema});
export function createExtensionDevices(db:Database.Database,{approvedId,now=Date.now,fail}:{approvedId:string|undefined;now?:()=>number;fail:(status:number,message:string)=>never}){
 const approved=extensionIdSchema.optional().parse(approvedId);
 function origin(origin:string|null){if(!approved||origin!==`chrome-extension://${approved}`)fail(403,'Extension origin is not approved.');}
 function approve(userId:string,input:unknown){
  const binding=linkBindingSchema.parse(input);
  if(!approved||binding.extensionId!==approved)fail(403,'Extension is not approved.');
  const code=secret();const expires=now()+120000;
  db.transaction(()=>{
   db.prepare('DELETE FROM extension_links WHERE user_id=? OR expires<=?').run(userId,now());
   db.prepare('INSERT INTO extension_links VALUES(?,?,?,?,?,?)').run(hash(code),userId,binding.extensionId,binding.installationId,binding.nonce,expires);
  }).immediate();
  return {code,expires,scope:deviceScopeSchema.value};
 }
 function exchange(input:unknown,requestOrigin:string|null){
  origin(requestOrigin);const binding=exchangeSchema.parse(input);
  return db.transaction(()=>{
   const raw=db.prepare('SELECT l.* FROM extension_links l JOIN users u ON u.id=l.user_id WHERE l.hash=?').get(hash(binding.code));
   if(!raw)fail(401,'Link is invalid or expired.');
   const link=linkRow.parse(raw);
   if(link.expires<=now()||link.extension_id!==binding.extensionId||link.installation_id!==binding.installationId||link.nonce!==binding.nonce)fail(401,'Link is invalid or expired.');
   db.prepare('DELETE FROM extension_links WHERE hash=?').run(hash(binding.code));
   const credential=secret(),id=secret(),expires=now()+7*86400000;
   db.prepare('INSERT INTO extension_devices(id,hash,user_id,extension_id,installation_id,expires,scope) VALUES(?,?,?,?,?,?,?)').run(id,hash(credential),link.user_id,link.extension_id,link.installation_id,expires,deviceScopeSchema.value);
   return {credential,id,expires,scope:deviceScopeSchema.value};
  }).immediate();
 }
 function authenticate(credential:string,requestOrigin:string|null){
  origin(requestOrigin);
  if(!/^[a-f0-9]{64}$/.test(credential))fail(401,'Device credential is invalid.');
  const raw=db.prepare('SELECT d.* FROM extension_devices d JOIN users u ON u.id=d.user_id WHERE d.hash=?').get(hash(credential));
  if(!raw)fail(401,'Device credential is invalid.');
  const device=deviceRow.parse(raw);
  if(device.revoked||device.expires<=now()||requestOrigin!==`chrome-extension://${device.extension_id}`)fail(401,'Device credential is invalid.');
  return device;
 }
 function list(userId:string){return db.prepare('SELECT id,user_id,extension_id,installation_id,expires,revoked,scope FROM extension_devices WHERE user_id=?').all(userId).map(row=>deviceRow.parse(row));}
 function revoke(userId:string,input:unknown){const {id}=z.object({id:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(input);db.prepare('UPDATE extension_devices SET revoked=1 WHERE id=? AND user_id=?').run(id,userId);return {message:'Device access revoked.'};}
 return {origin,approve,exchange,authenticate,list,revoke};
}
