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
export function createApp({dbPath='data/clearcheckout.sqlite', production=false,aiOptions,mediaOptions,publicOrigin=process.env.PUBLIC_ORIGIN,publicOrigins=process.env.PUBLIC_ORIGINS,trustProxy=false}={}) {
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
  app.use(helmet({contentSecurityPolicy:production ? undefined : false}));
  app.use(express.json({limit:'8kb'}));
  app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-8',legacyHeaders:false}));
  app.use('/api',(req,res,next)=>{
    let verifiedOrigin=true;
    if(req.get('origin')) {
      try {verifiedOrigin=allowedOrigins.size ? allowedOrigins.has(req.get('origin')) : new URL(req.get('origin')).host===req.get('host');}
      catch {verifiedOrigin=false;}
    }
    if (!['GET','HEAD'].includes(req.method) && (req.get('x-clearcheckout') !== '1' || !verifiedOrigin)) return res.status(403).json({error:'Request origin could not be verified.'});
    next();
  });
  const digest = value=>createHash('sha256').update(value).digest('hex');
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('cc_session='))?.slice(11);
    if(token) {
      const session=db.prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?').get(digest(token),Date.now());
      if(session) req.user=db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);
    }
    next();
  });
  const publicUser=u=>({id:u.id,email:u.email,preferences:JSON.parse(u.preferences),onboarded:Boolean(u.onboarded)});
  function session(res,id) {
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
    session(res,id);res.status(201).json(publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)));
  });
  app.post('/api/login',authLimit,(req,res)=>{
    const {email,password}=credentials.parse(req.body);
    const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const [salt,hash]=(user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
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
      const row=db.prepare('SELECT body FROM orders WHERE id=? AND user_id=?').get(orderId,req.user.id);
      if(!row) return res.status(404).json({error:'Order not found.'});
      res.json(await ai.explain(req.user.id,JSON.parse(row.body),JSON.parse(req.user.preferences).guidance));
    } catch(error) {if(error.status) return res.status(error.status).json({error:error.message});next(error);}
  });
  const mediaRoute=fn=>async(req,res,next)=>{try {res.json(await fn(req));}catch(e){if(e.status) res.status(e.status).json({error:e.message});else next(e);}};
  app.get('/api/media/scene',(req,res)=>{const image=media.scene();if(!image)return res.status(404).json({error:'Scene is not generated yet.'});res.type('png').send(image);});
  app.post('/api/media/scene',mediaRoute(req=>media.generate(req.user.id)));
  app.post('/api/media/locate',mediaRoute(req=>media.locate(req.user.id,req.body.object)));
  app.post('/api/media/transcribe',express.raw({type:'audio/wav',limit:'500kb'}),mediaRoute(req=>{if(!Buffer.isBuffer(req.body))throw Object.assign(new Error('Upload a WAV file.'),{status:400});return media.transcribe(req.user.id,req.body);}));
  app.get('/api/me',(req,res)=>res.json(publicUser(req.user)));
  const preferences=z.object({textSize:z.enum(['standard','large','larger']),contrast:z.boolean(),guidance:z.enum(['detailed','brief'])}).strict();
  app.put('/api/preferences',(req,res)=>{
    const prefs=preferences.parse(req.body.preferences);
    db.prepare('UPDATE users SET preferences=?,onboarded=1 WHERE id=?').run(JSON.stringify(prefs),req.user.id);
    res.json(publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)));
  });
  app.get('/api/orders',(req,res)=>res.json(db.prepare('SELECT body FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 20').all(req.user.id).map(row=>JSON.parse(row.body))));
  function save(order,userId) {db.prepare('UPDATE orders SET body=? WHERE id=? AND user_id=?').run(JSON.stringify(order),order.id,userId);return {...order,quote:quote(order.cart,order.delivery),phrase:confirmationPhrase(order)};}
  app.post('/api/orders',(req,res)=>{
    const count=db.prepare('SELECT COUNT(*) AS count FROM orders WHERE user_id=? AND created>?').get(req.user.id,Date.now()-86400000).count;
    if(count>=50) return res.status(429).json({error:'Daily demo limit reached. Try again tomorrow.'});
    const order={id:randomBytes(12).toString('hex'),cart:{tea:1,mug:1},delivery:'standard',state:'draft',revision:1,reviewedRevision:null};
    db.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(order.id,req.user.id,JSON.stringify(order),Date.now());
    res.status(201).json(save(order,req.user.id));
  });
  const event=checkoutEventSchema;
  app.post('/api/orders/:id',(req,res)=>{
    const row=db.prepare('SELECT body FROM orders WHERE id=? AND user_id=?').get(req.params.id,req.user.id);
    if(!row) return res.status(404).json({error:'Order not found.'});
    const action=event.parse(req.body);
    try {res.json(save(transition(JSON.parse(row.body),action),req.user.id));} catch(error) {res.status(409).json({error:error.message});}
  });
  app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint not found.'}));
  app.use(express.static(path.resolve('build')));
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));
  app.use((error,req,res,next)=>{
    if(error instanceof z.ZodError) return res.status(400).json({error:error.issues.map(i=>i.message).join(' ')});
    res.status(error.status || 500).json({error:error.status===413 ? 'Request is too large.' : 'Request could not be processed.'});
  });
  return {app,db};
}
