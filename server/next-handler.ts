import 'server-only';
import {createService,ServiceError} from './service.js';
import {preferencesSchema,statusErrorSchema,json} from './contracts.js';
import {checkoutEventSchema} from '../shared/checkout-schema.js';
import {z} from 'zod';
import {createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {ipKeyGenerator} from 'express-rate-limit';
import nodePath from 'node:path';
let service:ReturnType<typeof createService>|undefined;
const limits=new Map<string,{count:number;expires:number}>();
function limit(key:string,max:number,window:number,headers:Headers){
 const now=Date.now();
 for(const [k,v] of limits)if(v.expires<=now)limits.delete(k);
 let value=limits.get(key);
 if(!value){
  if(limits.size>=10000)throw new ServiceError(503,'Request capacity reached. Try again later.');
  value={count:0,expires:now+window};limits.set(key,value);
 }
 value.count++;
 const reset=Math.ceil((value.expires-now)/1000);const name=`${max}-in-${window/60000}min`;
 headers.append('RateLimit',`"${name}"; r=${Math.max(0,max-value.count)}; t=${reset}`);
 headers.append('RateLimit-Policy',`"${name}"; q=${max}; w=${window/1000}; pk=:${Buffer.from(createHash('sha256').update(key.replace(/^auth:/,'')).digest('hex').slice(0,12)).toString('base64')}:`);
 if(value.count>max)headers.set('Retry-After',String(reset));
 return value.count>max;
}
async function readBody(request:Request,max:number){
 const chunks:Uint8Array[]=[];let size=0;const reader=request.body?.getReader();
 if(reader)try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw new ServiceError(413,'Request is too large.');}chunks.push(part.value);}}finally{reader.releaseLock();}
 return Buffer.concat(chunks);
}
export async function handle(request:Request){
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer'});
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 try{
 const path=new URL(request.url).pathname;const method=request.method;
 let body:unknown;
 const contentType=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
 if(contentType==='application/json'){
  const buffer=await readBody(request,8192);
  if(buffer.length){try{body=JSON.parse(buffer.toString());if(typeof body!=='object'||body===null)throw new Error();}catch{throw new ServiceError(400,'Request could not be processed.');}}
 }
 const peer=request.headers.get('x-cc-client')||'';const signature=request.headers.get('x-cc-client-signature')||'';
 const secret=process.env.CC_TRANSPORT_SECRET;
 if(!secret)throw new ServiceError(503,'Request transport is unavailable.');
 const expected=createHmac('sha256',secret).update(peer).digest('hex');
 if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw new ServiceError(503,'Request transport is unavailable.');
 const ip=ipKeyGenerator(peer);
 if(limit(ip,180,60000,headers))return new Response('Too many requests, please try again later.',{status:429,headers:new Headers([...headers,['Content-Type','text/html; charset=utf-8']])});
 const origin=request.headers.get('origin');const allowed=[process.env.PUBLIC_ORIGIN,...(process.env.PUBLIC_ORIGINS||'').split(',')].map(value=>value?.trim()).filter(Boolean);
 let verified=true;
 if(origin)try{const parsed=new URL(origin);verified=parsed.origin===origin&&(allowed.length?allowed.includes(origin):parsed.host===request.headers.get('host'));}catch{verified=false;}
 if(!['GET','HEAD'].includes(method)&&(request.headers.get('x-clearcheckout')!=='1'||!verified))return reply({error:'Request origin could not be verified.'},403);
 service??=createService({dbPath:process.env.DB_PATH||'data/clearcheckout.sqlite',mediaOptions:{dataDir:nodePath.join(nodePath.dirname(process.env.DB_PATH||'data/clearcheckout.sqlite'),'media')}});
 const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('cc_session='))?.slice(11);
 const user=service.authenticate(token);
 if(method==='POST'&&(path==='/api/signup'||path==='/api/login')){
 if(limit('auth:'+ip,30,900000,headers))return new Response('Too many requests, please try again later.',{status:429,headers:new Headers([...headers,['Content-Type','text/html; charset=utf-8']])});
 const result=path==='/api/signup'?service.signup(body):service.login(body);
 headers.append('Set-Cookie',`cc_session=${service.issueSession(result.id)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return reply(result,path==='/api/signup'?201:200);
 }
 if(path==='/api/logout'&&method==='POST'){service.logout(token);headers.append('Set-Cookie',`cc_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return reply({ok:true});}
 if(!user)return reply({error:'Sign in to continue.'},401);
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
