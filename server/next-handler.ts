import 'server-only';
import {sandboxConfiguration} from './paypal.js';
import {env as runtimeEnvironment} from 'node:process';
import type {PaymentProvider} from './orders.js';
import type {MailAdapter} from './auth.js';
declare global {var clearcheckoutTestPayment:PaymentProvider|undefined;var clearcheckoutTestMail:MailAdapter|undefined;}
import {createService,ServiceError} from './service.js';
import {preferencesSchema,statusErrorSchema,json} from './contracts.js';
import {checkoutEventSchema} from '../shared/checkout-schema.js';
import {z} from 'zod';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {ipKeyGenerator} from './client-ip.js';
import {readBody,readJson} from './request-body.js';
import {createLimiter} from './rate-limit.js';
import nodePath from 'node:path';
let service:ReturnType<typeof createService>|undefined;
const limit=createLimiter();
export async function handle(request:Request){
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer'});
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 try{
 const path=new URL(request.url).pathname;const method=request.method;
 let body:unknown;
 const contentType=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
 if(contentType==='application/json'){
  body=path==='/api/payments/webhook'?(await readBody(request,100000)).toString('utf8'):await readJson(request);
 }
 const peer=request.headers.get('x-cc-client')||'';const signature=request.headers.get('x-cc-client-signature')||'';
 const secret=process.env.CC_TRANSPORT_SECRET;
 if(!secret)throw new ServiceError(503,'Request transport is unavailable.');
 const expected=createHmac('sha256',secret).update(peer).digest('hex');
 if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw new ServiceError(503,'Request transport is unavailable.');
 const ip=ipKeyGenerator(peer);
 if(limit(ip,180,60000,headers))return new Response('Too many requests, please try again later.',{status:429,headers:new Headers([...headers,['Content-Type','text/html; charset=utf-8']])});
 const extensionExchange=path==='/api/extension/exchange';
 const extensionOrigin=process.env.CC_APPROVED_EXTENSION_ID?`chrome-extension://${process.env.CC_APPROVED_EXTENSION_ID}`:undefined;
 const extensionRequest=extensionExchange&&extensionOrigin!==undefined&&request.headers.get('origin')===extensionOrigin;
 if(extensionRequest){headers.set('Access-Control-Allow-Origin',extensionOrigin);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type, x-clearcheckout');if(method==='OPTIONS')return new Response(null,{status:204,headers});}
 const webhook=path==='/api/payments/webhook'&&method==='POST';
 const origin=request.headers.get('origin');const allowed=[process.env.PUBLIC_ORIGIN,...(process.env.PUBLIC_ORIGINS||'').split(',')].map(value=>value?.trim()).filter(Boolean);
 let verified=true;
 if(origin)try{const parsed=new URL(origin);verified=parsed.origin===origin&&(allowed.length?allowed.includes(origin):parsed.host===request.headers.get('host'));}catch{verified=false;}
 if(!webhook&&!extensionRequest&&!['GET','HEAD'].includes(method)&&(request.headers.get('x-clearcheckout')!=='1'||!verified))return reply({error:'Request origin could not be verified.'},403);
 service??=createService({approvedExtensionId:process.env.CC_APPROVED_EXTENSION_ID,sandbox:sandboxConfiguration(runtimeEnvironment),paymentProvider:runtimeEnvironment.NODE_ENV==='test'?globalThis.clearcheckoutTestPayment:undefined,mail:runtimeEnvironment.NODE_ENV==='test'?globalThis.clearcheckoutTestMail:undefined,appOrigin:process.env.PUBLIC_ORIGIN,dbPath:process.env.DB_PATH||'data/clearcheckout.sqlite',mediaOptions:{dataDir:nodePath.join(nodePath.dirname(process.env.DB_PATH||'data/clearcheckout.sqlite'),'media')}});
 if(extensionExchange&&method==='POST')return reply(service.devices.exchange(body,request.headers.get('origin')));
 if(webhook){await service.payments.webhook(request.headers,body);return reply({ok:true});}
 const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('cc_session='))?.slice(11);
 const user=service.authenticate(token);
 if(method==='POST'&&(path==='/api/signup'||path==='/api/login')){
 if(limit('auth:'+ip,30,900000,headers))return new Response('Too many requests, please try again later.',{status:429,headers:new Headers([...headers,['Content-Type','text/html; charset=utf-8']])});
 const result=path==='/api/signup'?await service.signup(body):await service.login(body);
 headers.append('Set-Cookie',`cc_session=${service.issueSession(result.id)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return reply(result,path==='/api/signup'?201:200);
 }
 if(path==='/api/logout'&&method==='POST'){service.logout(token);headers.append('Set-Cookie',`cc_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return reply({ok:true});}
 if(path==='/api/account/mail'&&method==='GET')return reply({available:service.auth.available});
 if(path==='/api/account/reset-request'&&method==='POST')return reply(await service.auth.request('reset',body));
 if(path==='/api/account/reset'&&method==='POST')return reply(await service.auth.reset(body));
 if(path==='/api/account/verify'&&method==='POST')return reply(service.auth.verify(body));
 if(!user)return reply({error:'Sign in to continue.'},401);
 if(path==='/api/account/devices'&&method==='GET')return reply(service.devices.list(user.id));
 if(path==='/api/account/devices/approve'&&method==='POST')return reply(service.devices.approve(user.id,body));
 if(path==='/api/account/devices/revoke'&&method==='POST')return reply(service.devices.revoke(user.id,body));
 if(path==='/api/account/verification-request'&&method==='POST')return reply(await service.auth.request('verify',body,user));
 if(path==='/api/account/password'&&method==='POST')return reply(await service.auth.changePassword(user,body));
 if(path==='/api/account/sessions'&&method==='POST')return reply(service.auth.revoke(user,token,body));
 if(path==='/api/account/export'&&method==='GET')return reply(service.auth.exportAccount(user));
 if(path==='/api/account/delete'&&method==='POST')return reply(await service.auth.deleteAccount(user,body));
 if(path==='/api/payments/status'&&method==='GET')return reply({configured:service.payments.configured,sandboxOnly:true});
 if(path==='/api/payments/review'&&method==='POST'){const input=z.object({orderId:z.string(),requestKey:z.string()}).strict().parse(body);return reply(service.payments.review(user.id,input.orderId,input.requestKey));}
 const paymentPath=/^\/api\/payments\/([^/]+)(?:\/(confirm|begin|capture|reconcile|cancel))?$/.exec(path);
 if(paymentPath){const id=z.string().parse(paymentPath[1]),operation=paymentPath[2];if(method==='GET'&&!operation)return reply(service.payments.read(user.id,id));if(method==='POST'){
 if(operation==='confirm')return reply(service.payments.command(user.id,id,z.object({type:z.literal('confirm'),revision:z.number().int().positive(),phrase:z.string().max(80)}).strict().parse(body)));
 if(operation==='cancel')return reply(service.payments.command(user.id,id,z.object({type:z.literal('cancel')}).strict().parse(body)));
 if(operation==='begin')return reply(await service.payments.begin(user.id,id));
 if(operation==='capture'){const callback=z.object({token:z.string()}).strict().parse(body);return reply(await service.payments.approve(user.id,id,callback.token));}
 if(operation==='reconcile')return reply(await service.payments.reconcile(user.id,id));
 }}
 if(path==='/api/me'&&method==='GET')return reply(service.publicUser(user));
 if(path==='/api/preferences'&&method==='PUT')return reply(service.setPreferences(user,body));
 if(path==='/api/orders'&&method==='GET')return reply(service.orders(user));
 if(path==='/api/orders'&&method==='POST')return reply(service.createOrder(user),201);
 if(path.startsWith('/api/orders/')&&method==='POST'){const id=path.slice('/api/orders/'.length);service.order(user,id);return reply(service.updateOrder(user,id,checkoutEventSchema.parse(body)));}
 if(path==='/api/ai/status'&&method==='GET')return reply({configured:service.ai.configured,model:'muse-spark-1.3-contributor'});
 if(path==='/api/ai/explain'&&method==='POST'){const {orderId}=z.object({orderId:z.string().regex(/^[a-f0-9]{24}$/)}).strict().parse(body);return reply(await service.ai.explain(user.id,service.order(user,orderId),preferencesSchema.parse(json(user.preferences)).guidance));}
 if(path==='/api/media/scene'&&method==='GET'){const image=service.media.scene();if(!image)return reply({error:'Scene is not generated yet.'},404);headers.set('Content-Type','image/png');return new Response(new Uint8Array(image),{headers});}
 if(path==='/api/media/scene'&&method==='POST')return reply(await service.media.generate(user.id));
 if(path==='/api/media/locate'&&method==='POST')return reply(await service.media.locate(user.id,z.object({object:z.unknown().optional()}).parse(body).object));
 if(path==='/api/media/transcribe'&&method==='POST'){if(contentType==='audio/wav')body=await readBody(request,500*1024);if(!Buffer.isBuffer(body))return reply({error:'Upload a WAV file.'},400);return reply(await service.media.transcribe(user.id,body));}
 return reply({error:'Endpoint not found.'},404);
 }catch(error){if(error instanceof ServiceError)return reply({error:error.message},error.status);if(error instanceof z.ZodError)return reply({error:error.issues.map(i=>i.message).join(' ')},400);const parsed=statusErrorSchema.safeParse(error);return reply({error:parsed.success?parsed.data.message:'Request could not be processed.'},parsed.success?parsed.data.status:500);}
}
