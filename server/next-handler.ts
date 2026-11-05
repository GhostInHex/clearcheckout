import 'server-only';
import {createService,ServiceError} from './service.js';
import {preferencesSchema,statusErrorSchema,json} from './contracts.js';
import {checkoutEventSchema} from '../shared/checkout-schema.js';
import {z} from 'zod';
import nodePath from 'node:path';
let service:ReturnType<typeof createService>|undefined;
const limits=new Map<string,{count:number;expires:number}>();
function limit(key:string,max:number,window:number){const now=Date.now();for(const [k,v] of limits)if(v.expires<=now)limits.delete(k);const value=limits.get(key)||{count:0,expires:now+window};value.count++;limits.set(key,value);return value.count>max;}
export async function handle(request:Request){
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'no-referrer'});
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 try{
 const path=new URL(request.url).pathname;const method=request.method;
 const ip='local';
 if(limit(ip,180,60000))return reply({error:'Too many requests, please try again later.'},429);
 const origin=request.headers.get('origin');const allowed=[process.env.PUBLIC_ORIGIN,...(process.env.PUBLIC_ORIGINS||'').split(',')].filter(Boolean);
 if(!['GET','HEAD'].includes(method)&&(request.headers.get('x-clearcheckout')!=='1'||(origin&&(allowed.length?!allowed.includes(origin):new URL(origin).host!==request.headers.get('host')))))return reply({error:'Request origin could not be verified.'},403);
 service??=createService({dbPath:process.env.DB_PATH||'data/clearcheckout.sqlite',mediaOptions:{dataDir:nodePath.join(nodePath.dirname(process.env.DB_PATH||'data/clearcheckout.sqlite'),'media')}});
 const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('cc_session='))?.slice(11);
 const user=service.authenticate(token);
 let body:unknown;
 if(!['GET','HEAD'].includes(method)){
 const wav=request.headers.get('content-type')?.split(';')[0]==='audio/wav';const max=wav?500*1024:8192;const chunks:Uint8Array[]=[];let size=0;const reader=request.body?.getReader();
 if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();return reply({error:'Request is too large.'},413);}chunks.push(part.value);}
 const buffer=Buffer.concat(chunks);if(wav)body=buffer;else if(buffer.length){try{body=JSON.parse(buffer.toString());}catch{return reply({error:'Request could not be processed.'},400);}}
 }
 if(method==='POST'&&(path==='/api/signup'||path==='/api/login')){
 if(limit('auth:'+ip,30,900000))return reply({error:'Too many requests, please try again later.'},429);
 const result=path==='/api/signup'?service.signup(body):service.login(body);
 headers.append('Set-Cookie',`cc_session=${service.issueSession(result.id)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return reply(result,path==='/api/signup'?201:200);
 }
 if(path==='/api/logout'&&method==='POST'){service.logout(token);headers.append('Set-Cookie','cc_session=; Path=/; Max-Age=0');return reply({ok:true});}
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
 if(path==='/api/media/transcribe'&&method==='POST'){if(!Buffer.isBuffer(body))return reply({error:'Upload a WAV file.'},400);return reply(await service.media.transcribe(user.id,body));}
 return reply({error:'Endpoint not found.'},404);
 }catch(error){if(error instanceof ServiceError)return reply({error:error.message},error.status);if(error instanceof z.ZodError)return reply({error:error.issues.map(i=>i.message).join(' ')},400);const parsed=statusErrorSchema.safeParse(error);return reply({error:parsed.success?parsed.data.message:'Request could not be processed.'},parsed.success?parsed.data.status:500);}
}
