import {createService,ServiceError} from './service.js';
import type {Request,Response,NextFunction,ErrorRequestHandler} from 'express';
import {preferencesSchema,statusErrorSchema,json,type User} from './contracts.js';
import type {ProviderOptions} from './contracts.js';
declare global { namespace Express { interface Request { user?:User } } }
type AppOptions={dbPath?:string;production?:boolean;aiOptions?:ProviderOptions;mediaOptions?:ProviderOptions & {dataDir?:string};publicOrigin?:string|undefined;publicOrigins?:string|undefined;trustProxy?:false|'loopback'};
import {checkoutEventSchema} from '../shared/checkout-schema.js';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import {z} from 'zod';
export function createApp({dbPath='data/clearcheckout.sqlite', production=false,aiOptions,mediaOptions,publicOrigin=process.env.PUBLIC_ORIGIN,publicOrigins=process.env.PUBLIC_ORIGINS,trustProxy=false}:AppOptions={}) {
  const service=createService({dbPath,...(aiOptions?{aiOptions}:{}),...(mediaOptions?{mediaOptions}:{})});
  const {db,ai,media}=service;
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
  const token=(req:Request)=>req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('cc_session='))?.slice(11);
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    const user=service.authenticate(token(req));
    if(user)req.user=user;
    next();
  });
  function session(res:Response,id:string) {
    res.cookie('cc_session',service.issueSession(id),{httpOnly:true,sameSite:'strict',secure:production,maxAge:7*86400000,path:'/'});
  }
  const authLimit=rateLimit({windowMs:15*60000,limit:30,legacyHeaders:false,standardHeaders:'draft-8'});
  app.post('/api/signup',authLimit,(req,res)=>{
    const user=service.signup(req.body);
    session(res,user.id);res.status(201).json(user);
  });
  app.post('/api/login',authLimit,(req,res)=>{
    const user=service.login(req.body);
    session(res,user.id);res.json(user);
  });
  app.post('/api/logout',(req,res)=>{
    service.logout(token(req));
    res.clearCookie('cc_session',{path:'/'}).json({ok:true});
  });
  app.use('/api',(req,res,next)=>req.user ? next() : res.status(401).json({error:'Sign in to continue.'}));
  app.get('/api/ai/status',(req,res)=>res.json({configured:ai.configured,model:'muse-spark-1.3-contributor'}));
  app.post('/api/ai/explain',async(req,res,next)=>{
    try {
      const {orderId}=z.object({orderId:z.string().regex(/^[a-f0-9]{24}$/)}).strict().parse(req.body);
      res.json(await ai.explain(currentUser(req).id,service.order(currentUser(req),orderId),preferencesSchema.parse(json(currentUser(req).preferences)).guidance));
    } catch(error) {const parsed=statusErrorSchema.safeParse(error);if(parsed.success) return res.status(parsed.data.status).json({error:parsed.data.message});next(error);}
  });
  const mediaRoute=(fn:(req:Request)=>Promise<unknown>)=>async(req:Request,res:Response,next:NextFunction)=>{try {res.json(await fn(req));}catch(e){const parsed=statusErrorSchema.safeParse(e);if(parsed.success) res.status(parsed.data.status).json({error:parsed.data.message});else next(e);}};
  app.get('/api/media/scene',(req,res)=>{const image=media.scene();if(!image)return res.status(404).json({error:'Scene is not generated yet.'});res.type('png').send(image);});
  app.post('/api/media/scene',mediaRoute(req=>media.generate(currentUser(req).id)));
  app.post('/api/media/locate',mediaRoute(req=>media.locate(currentUser(req).id,z.object({object:z.unknown().optional()}).parse(req.body).object)));
  app.post('/api/media/transcribe',express.raw({type:'audio/wav',limit:'500kb'}),mediaRoute(req=>{if(!Buffer.isBuffer(req.body))throw Object.assign(new Error('Upload a WAV file.'),{status:400});return media.transcribe(currentUser(req).id,req.body);}));
  app.get('/api/me',(req,res)=>res.json(service.publicUser(currentUser(req))));
  app.put('/api/preferences',(req,res)=>res.json(service.setPreferences(currentUser(req),req.body)));
  app.get('/api/orders',(req,res)=>res.json(service.orders(currentUser(req))));
  app.post('/api/orders',(req,res)=>res.status(201).json(service.createOrder(currentUser(req))));
  app.post('/api/orders/:id',(req,res)=>{
    const id=z.string().parse(req.params.id);
    service.order(currentUser(req),id);
    res.json(service.updateOrder(currentUser(req),id,checkoutEventSchema.parse(req.body)));
  });
  app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint not found.'}));
  app.get('/clearcheckout-extension.zip',(req,res)=>res.sendFile('clearcheckout-extension.zip',{root:path.resolve('build')}));
  app.use('/extension',express.static(path.resolve('build/extension')));
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));
  const errorHandler:ErrorRequestHandler=(error:unknown,req,res,next)=>{
    if(error instanceof ServiceError)return res.status(error.status).json({error:error.message});
    if(error instanceof z.ZodError) return res.status(400).json({error:error.issues.map(i=>i.message).join(' ')});
    const parsed=statusErrorSchema.safeParse(error);
    res.status(parsed.success ? parsed.data.status : 500).json({error:parsed.success && parsed.data.status===413 ? 'Request is too large.' : 'Request could not be processed.'});
  };
  app.use(errorHandler);
  return {app,db};
}

function currentUser(req:Request):User {if(!req.user)throw new Error('Missing authenticated user');return req.user;}
