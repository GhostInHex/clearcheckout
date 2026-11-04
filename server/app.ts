import type {Request,Response,NextFunction,ErrorRequestHandler} from 'express';
import {preferencesSchema,userSchema,orderSchema,bodySchema,statusErrorSchema,json,type User} from './contracts.js';
import type {ProviderOptions} from './contracts.js';
import type {Order} from '../shared/checkout.js';
declare global { namespace Express { interface Request { user?:User } } }
type AppOptions={dbPath?:string;production?:boolean;aiOptions?:ProviderOptions;mediaOptions?:ProviderOptions & {dataDir?:string};publicOrigin?:string|undefined;publicOrigins?:string|undefined;trustProxy?:false|'loopback'};
import {checkoutEventSchema} from '../shared/checkout-schema.js';
import {createMedia} from './media-ai.js';
import express from 'express';
import {createMetaGuidance} from './meta-ai.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import {randomBytes, scryptSync, timingSafeEqual, createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {quote, transition, confirmationPhrase} from '../shared/checkout.js';
export function createApp({dbPath='data/clearcheckout.sqlite', production=false,aiOptions,mediaOptions,publicOrigin=process.env.PUBLIC_ORIGIN,publicOrigins=process.env.PUBLIC_ORIGINS,trustProxy=false}:AppOptions={}) {
  if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath),{recursive:true});
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,preferences TEXT NOT NULL,onboarded INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,body TEXT NOT NULL,created INTEGER NOT NULL);
    PRAGMA user_version = 1;`);
  const ai=createMetaGuidance(db,aiOptions);
  const media=createMedia(db,mediaOptions || aiOptions);
  const app=express();
  app.disable('x-powered-by');
  app.set('trust proxy',trustProxy);
  const allowedOrigins=new Set([...(publicOrigin?[publicOrigin]:[]),...(publicOrigins||'').split(',').map(value=>value.trim()).filter(Boolean)].map(value=>new URL(value).origin));
  app.use(helmet(production ? {} : {contentSecurityPolicy:false}));
  app.use(express.json({limit:'8kb'}));
  app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-8',legacyHeaders:false}));
  app.use('/api',(req,res,next)=>{
    let verifiedOrigin=true;
    const origin=req.get('origin');
    if(origin) {
      try {verifiedOrigin=allowedOrigins.size ? allowedOrigins.has(origin) : new URL(origin).host===req.get('host');}
      catch {verifiedOrigin=false;}
    }
    if (!['GET','HEAD'].includes(req.method) && (req.get('x-clearcheckout') !== '1' || !verifiedOrigin)) return res.status(403).json({error:'Request origin could not be verified.'});
    next();
  });
  const digest = (value:string)=>createHash('sha256').update(value).digest('hex');
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('cc_session='))?.slice(11);
    if(token) {
      const session=db.prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?').get(digest(token),Date.now());
      if(session) {const row=db.prepare('SELECT * FROM users WHERE id=?').get(z.object({user_id:z.string()}).parse(session).user_id);if(row)req.user=userSchema.parse(row);}
    }
    next();
  });
  const publicUser=(u:User)=>({id:u.id,email:u.email,preferences:preferencesSchema.parse(json(u.preferences)),onboarded:Boolean(u.onboarded)});
  function session(res:Response,id:string) {
    const token=randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),id,Date.now()+7*86400000);
    res.cookie('cc_session',token,{httpOnly:true,sameSite:'strict',secure:production,maxAge:7*86400000,path:'/'});
  }
  const authLimit=rateLimit({windowMs:15*60000,limit:30,legacyHeaders:false,standardHeaders:'draft-8'});
  const credentials=z.object({email:z.email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(10).max(128)});
  app.post('/api/signup',authLimit,(req,res)=>{
    const {email,password}=credentials.parse(req.body);
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({error:'An account already exists. Sign in instead.'});
    const salt=randomBytes(16).toString('hex');
    const hash=scryptSync(password,salt,64).toString('hex');
    const id=randomBytes(16).toString('hex');
    db.prepare('INSERT INTO users(id,email,password,preferences) VALUES(?,?,?,?)').run(id,email,`${salt}:${hash}`,JSON.stringify({textSize:'standard',contrast:false,guidance:'detailed'}));
    session(res,id);res.status(201).json(publicUser(userSchema.parse(db.prepare('SELECT * FROM users WHERE id=?').get(id))));
  });
  app.post('/api/login',authLimit,(req,res)=>{
    const {email,password}=credentials.parse(req.body);
    const row=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const user=row ? userSchema.parse(row) : undefined;
    const [salt='',hash='']=(user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const valid=timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hash,'hex'));
    if(!user || !valid) return res.status(401).json({error:'Email or password is incorrect.'});
    session(res,user.id);res.json(publicUser(user));
  });
  app.post('/api/logout',(req,res)=>{
    const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('cc_session='))?.slice(11);
    if(token) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
    res.clearCookie('cc_session',{path:'/'}).json({ok:true});
  });
  app.use('/api',(req,res,next)=>req.user ? next() : res.status(401).json({error:'Sign in to continue.'}));
  app.get('/api/ai/status',(req,res)=>res.json({configured:ai.configured,model:'muse-spark-1.3-contributor'}));
  app.post('/api/ai/explain',async(req,res,next)=>{
    try {
      const {orderId}=z.object({orderId:z.string().regex(/^[a-f0-9]{24}$/)}).strict().parse(req.body);
      const row=db.prepare('SELECT body FROM orders WHERE id=? AND user_id=?').get(orderId,currentUser(req).id);
      if(!row) return res.status(404).json({error:'Order not found.'});
      res.json(await ai.explain(currentUser(req).id,orderSchema.parse(json(bodySchema.parse(row).body)),preferencesSchema.parse(json(currentUser(req).preferences)).guidance));
    } catch(error) {const parsed=statusErrorSchema.safeParse(error);if(parsed.success) return res.status(parsed.data.status).json({error:parsed.data.message});next(error);}
  });
  const mediaRoute=(fn:(req:Request)=>Promise<unknown>)=>async(req:Request,res:Response,next:NextFunction)=>{try {res.json(await fn(req));}catch(e){const parsed=statusErrorSchema.safeParse(e);if(parsed.success) res.status(parsed.data.status).json({error:parsed.data.message});else next(e);}};
  app.get('/api/media/scene',(req,res)=>{const image=media.scene();if(!image)return res.status(404).json({error:'Scene is not generated yet.'});res.type('png').send(image);});
  app.post('/api/media/scene',mediaRoute(req=>media.generate(currentUser(req).id)));
  app.post('/api/media/locate',mediaRoute(req=>media.locate(currentUser(req).id,z.object({object:z.unknown().optional()}).parse(req.body).object)));
  app.post('/api/media/transcribe',express.raw({type:'audio/wav',limit:'500kb'}),mediaRoute(req=>{if(!Buffer.isBuffer(req.body))throw Object.assign(new Error('Upload a WAV file.'),{status:400});return media.transcribe(currentUser(req).id,req.body);}));
  app.get('/api/me',(req,res)=>res.json(publicUser(currentUser(req))));
  const preferences=preferencesSchema;
  app.put('/api/preferences',(req,res)=>{
    const prefs=preferences.parse(z.object({preferences:z.unknown()}).parse(req.body).preferences);
    db.prepare('UPDATE users SET preferences=?,onboarded=1 WHERE id=?').run(JSON.stringify(prefs),currentUser(req).id);
    res.json(publicUser(userSchema.parse(db.prepare('SELECT * FROM users WHERE id=?').get(currentUser(req).id))));
  });
  app.get('/api/orders',(req,res)=>res.json(db.prepare('SELECT body FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 20').all(currentUser(req).id).map(row=>orderSchema.parse(json(bodySchema.parse(row).body)))));
  function save(order:Order & {id:string},userId:string) {db.prepare('UPDATE orders SET body=? WHERE id=? AND user_id=?').run(JSON.stringify(order),order.id,userId);return {...order,quote:quote(order.cart,order.delivery),phrase:confirmationPhrase(order)};}
  app.post('/api/orders',(req,res)=>{
    const count=z.object({count:z.number()}).parse(db.prepare('SELECT COUNT(*) AS count FROM orders WHERE user_id=? AND created>?').get(currentUser(req).id,Date.now()-86400000)).count;
    if(count>=50) return res.status(429).json({error:'Daily demo limit reached. Try again tomorrow.'});
    const order:Order & {id:string}={id:randomBytes(12).toString('hex'),cart:{tea:1,mug:1},delivery:'standard',state:'draft',revision:1,reviewedRevision:null};
    db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(order.id,currentUser(req).id,JSON.stringify(order),Date.now());
    res.status(201).json(save(order,currentUser(req).id));
  });
  const event=checkoutEventSchema;
  app.post('/api/orders/:id',(req,res)=>{
    const row=db.prepare('SELECT body FROM orders WHERE id=? AND user_id=?').get(req.params.id,currentUser(req).id);
    if(!row) return res.status(404).json({error:'Order not found.'});
    const action=event.parse(req.body);
    const order=orderSchema.parse(json(bodySchema.parse(row).body));
    try {res.json(save({...transition(order,action),id:order.id},currentUser(req).id));} catch(error) {res.status(409).json({error:error instanceof Error ? error.message : String(error)});}
  });
  app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint not found.'}));
  app.get('/clearcheckout-extension.zip',(req,res)=>res.sendFile('clearcheckout-extension.zip',{root:path.resolve('build')}));
  app.use('/extension',express.static(path.resolve('build/extension')));
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));
  const errorHandler:ErrorRequestHandler=(error:unknown,req,res,next)=>{
    if(error instanceof z.ZodError) return res.status(400).json({error:error.issues.map(i=>i.message).join(' ')});
    const parsed=statusErrorSchema.safeParse(error);
    res.status(parsed.success ? parsed.data.status : 500).json({error:parsed.success && parsed.data.status===413 ? 'Request is too large.' : 'Request could not be processed.'});
  };
  app.use(errorHandler);
  return {app,db};
}

function currentUser(req:Request):User {if(!req.user)throw new Error('Missing authenticated user');return req.user;}
