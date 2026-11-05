import {createPayments,type PaymentProvider} from './orders.js';
import {migrate} from './migrations/index.js';
import Database from 'better-sqlite3';
import {randomBytes, scryptSync, timingSafeEqual, createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {createMetaGuidance} from './meta-ai.js';
import {createMedia} from './media-ai.js';
import {preferencesSchema,userSchema,orderSchema,bodySchema,json,type User,type ProviderOptions} from './contracts.js';
import {credentialsSchema,publicUserSchema,checkoutResponseSchema} from '../shared/api-schema.js';
import {quote,transition,confirmationPhrase,type Order} from '../shared/checkout.js';
import type {CheckoutRequest} from '../shared/checkout-schema.js';
export class ServiceError extends Error {
  constructor(readonly status:number,message:string){super(message);}
}
function fail(status:number,message:string):never {throw new ServiceError(status,message);}
export type ServiceOptions={paymentProvider?:PaymentProvider;dbPath?:string;aiOptions?:ProviderOptions;mediaOptions?:ProviderOptions & {dataDir?:string}};
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function createService({dbPath='data/clearcheckout.sqlite',aiOptions,mediaOptions,paymentProvider}:ServiceOptions={}) {
  if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath),{recursive:true});
  const db = new Database(dbPath);
  try {
    migrate(db);
    db.pragma('journal_mode = WAL');
  } catch(error) {
    db.close();
    throw error;
  }
  const ai=createMetaGuidance(db,aiOptions);
  const media=createMedia(db,mediaOptions || aiOptions);

  const publicUser=(u:User)=>publicUserSchema.parse({id:u.id,email:u.email,preferences:preferencesSchema.parse(json(u.preferences)),onboarded:Boolean(u.onboarded)});
  function findUser(id:string) {return userSchema.parse(db.prepare('SELECT * FROM users WHERE id=?').get(id));}
  function authenticate(token:string|undefined) {
    if(!token)return undefined;
    const row=db.prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?').get(digest(token),Date.now());
    if(!row)return undefined;
    const user=db.prepare('SELECT * FROM users WHERE id=?').get(z.object({user_id:z.string()}).parse(row).user_id);
    return user ? userSchema.parse(user) : undefined;
  }
  function issueSession(id:string) {
    const token=randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),id,Date.now()+7*86400000);
    return token;
  }
  function signup(input:unknown) {
    const {email,password}=credentialsSchema.parse(input);
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'An account already exists. Sign in instead.');
    const salt=randomBytes(16).toString('hex');
    const hash=scryptSync(password,salt,64).toString('hex');
    const id=randomBytes(16).toString('hex');
    db.prepare('INSERT INTO users(id,email,password,preferences) VALUES(?,?,?,?)').run(id,email,`${salt}:${hash}`,JSON.stringify({textSize:'standard',contrast:false,guidance:'detailed'}));
    return publicUser(findUser(id));
  }
  function login(input:unknown) {
    const {email,password}=credentialsSchema.parse(input);
    const row=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const user=row ? userSchema.parse(row) : undefined;
    const [salt='',hash='']=(user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const valid=timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hash,'hex'));
    if(!user || !valid)fail(401,'Email or password is incorrect.');
    return publicUser(user);
  }
  function logout(token:string|undefined) {if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));}
  function setPreferences(user:User,input:unknown) {
    const prefs=preferencesSchema.parse(z.object({preferences:z.unknown()}).parse(input).preferences);
    db.prepare('UPDATE users SET preferences=?,onboarded=1 WHERE id=?').run(JSON.stringify(prefs),user.id);
    return publicUser(findUser(user.id));
  }
  function orders(user:User) {return db.prepare('SELECT body FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 20').all(user.id).map(row=>orderSchema.parse(json(bodySchema.parse(row).body)));}
  function order(user:User,id:string) {
    const row=db.prepare('SELECT body FROM orders WHERE id=? AND user_id=?').get(id,user.id);
    if(!row)fail(404,'Order not found.');
    return orderSchema.parse(json(bodySchema.parse(row).body));
  }
  function save(value:Order & {id:string},user:User) {
    db.prepare('UPDATE orders SET body=? WHERE id=? AND user_id=?').run(JSON.stringify(value),value.id,user.id);
    return checkoutResponseSchema.parse({...value,quote:quote(value.cart,value.delivery),phrase:confirmationPhrase(value)});
  }
  function createOrder(user:User) {
    const count=z.object({count:z.number()}).parse(db.prepare('SELECT COUNT(*) AS count FROM orders WHERE user_id=? AND created>?').get(user.id,Date.now()-86400000)).count;
    if(count>=50)fail(429,'Daily demo limit reached. Try again tomorrow.');
    const value:Order & {id:string}={id:randomBytes(12).toString('hex'),cart:{tea:1,mug:1},delivery:'standard',state:'draft',revision:1,reviewedRevision:null};
    db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(value.id,user.id,JSON.stringify(value),Date.now());
    return save(value,user);
  }
  const payments=createPayments(db,(userId,id)=>order(findUser(userId),id),paymentProvider);
  const updateOrder=db.transaction((user:User,id:string,action:CheckoutRequest) => {
    const value=order(user,id);
    try {const next=transition(value,action);if(action.type==='change' || action.type==='cancel' || action.type==='confirm')payments.invalidate(id);return save({...next,id:value.id},user);}catch(error){fail(409,error instanceof Error ? error.message : String(error));}
  });
  return {db,ai,media,payments,publicUser,authenticate,issueSession,signup,login,logout,setPreferences,orders,order,createOrder,updateOrder};
}
