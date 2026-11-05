import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {fail,json,type Db,type User} from './contracts.js';

export type MailMessage=Readonly<{to:string;purpose:'reset'|'verify';url:string}>;
export type MailAdapter=Readonly<{available:boolean;send:(message:MailMessage)=>Promise<void>}>;
export function localInbox(){const messages:MailMessage[]=[];return {messages,available:true,async send(message:MailMessage){messages.push(message);}};}
const disabledMail:MailAdapter={available:false,async send(){throw Error('Mail unavailable');}};
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
let active=0;
const waiting:Array<()=>void>=[];
async function derive(password:string,salt:string):Promise<Buffer>{
 if(active>=2){if(waiting.length>=16)fail(503,'Password service is busy. Try again.');await new Promise<void>(resolve=>waiting.push(resolve));}
 else active++;
 try{return await new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,(error,key)=>error?reject(error):resolve(key)));}
 finally{const next=waiting.shift();if(next)next();else active--;}
}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${(await derive(password,salt)).toString('hex')}`;}
export async function checkPassword(password:string,stored:string){const [salt='',hash='']=stored.split(':');const key=await derive(password,salt);const expected=Buffer.from(hash,'hex');return expected.length===key.length&&timingSafeEqual(key,expected);}
const passwordSchema=z.string().min(10).max(128);
const tokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
const rowSchema=z.object({user_id:z.string(),expires:z.number()});
export function createAuth(db:Db,{mail=disabledMail,origin,now=Date.now}:{mail?:MailAdapter|undefined;origin?:string|undefined;now?:()=>number}={}){
 const trusted=origin?new URL(origin):undefined;
 if(trusted&&(trusted.origin!==origin||!['https:','http:'].includes(trusted.protocol)||trusted.username||trusted.password))throw Error('Invalid trusted app origin');
 const available=Boolean(mail.available&&trusted);
 async function request(purpose:'reset'|'verify',input:unknown,user?:User){
  const email=purpose==='verify'&&user?user.email:z.object({email:z.email().max(254).transform(v=>v.toLowerCase())}).parse(input).email;
  if(!available)fail(503,'Account email is unavailable. Local shopping assistance remains available.');
  const key=digest(email);
  const allowed=db.transaction(()=>{
   const row=db.prepare('SELECT next_at FROM account_mail_limits WHERE key=?').get(key);
   if(row&&z.object({next_at:z.number()}).parse(row).next_at>now())return false;
   db.prepare('INSERT OR REPLACE INTO account_mail_limits VALUES(?,?)').run(key,now()+60000);return true;
  }).immediate();
  if(!allowed)fail(429,'Please wait before requesting another account email.');
  const account=db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if(account){
   const id=z.object({id:z.string()}).parse(account).id;const token=randomBytes(32).toString('hex');
   db.transaction(()=>{db.prepare('DELETE FROM account_tokens WHERE user_id=? AND purpose=?').run(id,purpose);db.prepare('INSERT INTO account_tokens VALUES(?,?,?,?,?)').run(digest(token),id,purpose,now()+30*60000,now());}).immediate();
   try{await mail.send({to:email,purpose,url:`${origin}/account/${purpose}#${token}`});}
   catch{db.prepare('DELETE FROM account_tokens WHERE hash=?').run(digest(token));}
  }
  return {message:'If eligible, an account email will arrive. Delivery may be unavailable. Request a new link if needed.'};
 }
 function consume(purpose:'reset'|'verify',token:string,apply:(id:string)=>void){
  db.transaction(()=>{const raw=db.prepare('SELECT user_id,expires FROM account_tokens WHERE hash=? AND purpose=?').get(digest(token),purpose);if(!raw)fail(400,'Link is invalid or expired. Request a new link.');const row=rowSchema.parse(raw);if(row.expires<=now())fail(400,'Link is invalid or expired. Request a new link.');apply(row.user_id);db.prepare('DELETE FROM account_tokens WHERE user_id=? AND purpose=?').run(row.user_id,purpose);}).immediate();
 }
 async function reset(input:unknown){const {token,password}=z.object({token:tokenSchema,password:passwordSchema}).strict().parse(input);const hash=await hashPassword(password);consume('reset',token,id=>{db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);});return {message:'Password reset. Sign in with your new password.'};}
 function verify(input:unknown){const {token}=z.object({token:tokenSchema}).strict().parse(input);consume('verify',token,id=>db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(id));return {message:'Email verified.'};}
 async function reauthenticate(user:User,password:string){const raw=db.prepare('SELECT password FROM users WHERE id=?').get(user.id);if(!raw||!await checkPassword(password,z.object({password:z.string()}).parse(raw).password))fail(401,'Password is incorrect.');}
 async function changePassword(user:User,input:unknown){const {currentPassword,password}=z.object({currentPassword:passwordSchema,password:passwordSchema}).strict().parse(input);await reauthenticate(user,currentPassword);const hash=await hashPassword(password);db.transaction(()=>{const result=db.prepare('UPDATE users SET password=? WHERE id=? AND password=?').run(hash,user.id,user.password);if(!result.changes)fail(409,'Account changed. Sign in again.');db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);db.prepare('DELETE FROM account_tokens WHERE user_id=?').run(user.id);}).immediate();return {message:'Password changed. Sign in again.'};}
 function revoke(user:User,token:string|undefined,input:unknown){const {scope}=z.object({scope:z.enum(['other','all'])}).strict().parse(input);if(scope==='all')db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);else db.prepare('DELETE FROM sessions WHERE user_id=? AND token<>?').run(user.id,digest(token||''));return {message:'Sessions revoked.'};}
 function exportAccount(user:User){return {account:{email:user.email,preferences:json(user.preferences),onboarded:Boolean(user.onboarded)},orders:db.prepare('SELECT body FROM orders WHERE user_id=?').all(user.id).map(row=>json(z.object({body:z.string()}).parse(row).body)),retention:'Payment evidence and unresolved captures remain for reconciliation. Global AI spend reservations remain.'};}
 async function deleteAccount(user:User,input:unknown){const {password,confirmation}=z.object({password:passwordSchema,confirmation:z.literal('DELETE MY ACCOUNT')}).strict().parse(input);void confirmation;await reauthenticate(user,password);db.transaction(()=>{const result=db.prepare('DELETE FROM users WHERE id=? AND password=?').run(user.id,user.password);if(!result.changes)fail(409,'Account changed. Sign in again.');for(const table of ['sessions','account_tokens','orders'])db.prepare(`DELETE FROM ${table} WHERE user_id=?`).run(user.id);}).immediate();return {message:'Account deleted. Payment reconciliation evidence and global spend reservations are retained.'};}
 return {available,request,reset,verify,changePassword,revoke,exportAccount,deleteAccount};
}
