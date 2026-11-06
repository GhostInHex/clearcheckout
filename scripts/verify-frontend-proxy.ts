import assert from 'node:assert/strict';
import {spawn,type ChildProcess,execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer as createHttpsServer} from 'node:https';
import {request as httpRequest,createServer} from 'node:http';
import {once} from 'node:events';
import {z} from 'zod';

const dir=mkdtempSync(tmpdir()+'/cc-proxy-');
const children=new Set<ChildProcess>();
const env={PATH:process.env.PATH,HOME:dir,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',CLEARCHECKOUT_SKIP_ENV_FILE:'1'};
async function port(){const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert(address&&typeof address!=='string');await new Promise<void>(resolve=>server.close(()=>resolve()));return address.port;}
const backendPort=await port(),frontendPort=await port();
const base=`http://127.0.0.1:${frontendPort}`;
function launch(args:string[],extra:NodeJS.ProcessEnv={}){const child=spawn(process.execPath,args,{env:{...env,...extra},stdio:['ignore','pipe','pipe'],detached:true});children.add(child);child.stderr?.on('data',chunk=>process.stderr.write(chunk));return child;}
async function stop(child:ChildProcess){if(child.exitCode!==null||child.signalCode!==null)return;assert(child.pid);const closed=once(child,'close');process.kill(-child.pid,'SIGTERM');const timer=setTimeout(()=>{if(child.exitCode===null&&child.signalCode===null&&child.pid)process.kill(-child.pid,'SIGKILL');},10000);await closed;clearTimeout(timer);}
async function ready(url:string,child:ChildProcess){for(let n=0;n<300;n++){assert.equal(child.exitCode,null,'Server exited before readiness');try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Server readiness timed out');}
let backend:ChildProcess|undefined;
async function bootBackend(){backend=launch(['node_modules/tsx/dist/cli.mjs','scripts/next-start.ts'],{HOSTNAME:'127.0.0.1',PORT:String(backendPort),DB_PATH:dir+'/db.sqlite',PUBLIC_ORIGIN:base});await ready(`http://127.0.0.1:${backendPort}/readyz`,backend);}
let cookie='';
async function request(path:string,body?:unknown,method=body===undefined?'GET':'POST',origin=base){return fetch(base+path,{method,signal:AbortSignal.timeout(10000),headers:{Origin:origin,'x-clearcheckout':'1','Content-Type':'application/json',Cookie:cookie,'x-cc-client':'forged','x-cc-client-signature':'forged','x-forwarded-for':'203.0.113.1'},...(body===undefined?{}:{body:JSON.stringify(body)})});}
let tls:ReturnType<typeof createHttpsServer>|undefined;
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',dir+'/key.pem','-out',dir+'/cert.pem','-days','1','-subj','/CN=backend.localtest.me','-addext','subjectAltName=DNS:backend.localtest.me'],{stdio:'ignore'});
 await bootBackend();
 tls=createHttpsServer({key:readFileSync(dir+'/key.pem'),cert:readFileSync(dir+'/cert.pem')},(req,res)=>{const upstream=httpRequest({hostname:'127.0.0.1',port:backendPort,path:req.url,method:req.method,headers:req.headers},reply=>{res.writeHead(reply.statusCode||502,reply.headers);reply.pipe(res);});upstream.on('error',()=>{res.writeHead(502);res.end();});req.pipe(upstream);});
 tls.listen(0,'::');await once(tls,'listening');const address=tls.address();assert(address&&typeof address!=='string');
 const frontendEnv={VERCEL:'1',CC_BACKEND_ORIGIN:`https://backend.localtest.me:${address.port}`,CC_FRONTEND_ORIGIN:'https://frontend.example.test',NODE_EXTRA_CA_CERTS:dir+'/cert.pem'};
 const build=launch(['node_modules/next/dist/bin/next','build','--webpack'],frontendEnv);const [code]=await once(build,'close');assert.equal(code,0,'Frontend build must pass');
 const frontend=launch(['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(frontendPort)],frontendEnv);await ready(base,frontend);
 assert.equal((await request('/api/signup',{},'POST','https://evil.example')).status,403,'Unapproved origin must be refused through proxy');
 const signup=await request('/api/signup',{email:'proxy@example.invalid',password:'proxy-test-password'});assert.equal(signup.status,201,'Signup must reach signed backend instead of local unsigned catchall');
 assert.equal(signup.headers.get('cache-control'),'no-store');cookie=z.string().parse(signup.headers.get('set-cookie')?.split(';')[0]);
 assert.equal((await request('/api/me')).status,200);
 const me=z.object({preferences:z.unknown()}).parse(await (await request('/api/me')).json());
 assert.equal((await request('/api/preferences',{preferences:me.preferences},'PUT')).status,200);
 assert.equal((await request('/api/orders',{})).status,201);
 assert(backend);await stop(backend);await bootBackend();
 assert.equal((await request('/api/me')).status,200,'Session must persist after backend restart');
 const orders=z.array(z.object({id:z.string()})).parse(await (await request('/api/orders')).json());assert.equal(orders.length,1,'Order must persist after backend restart');
 assert.deepEqual(z.object({preferences:z.unknown()}).parse(await (await request('/api/me')).json()).preferences,me.preferences);
 assert.equal((await request('/api/logout',{})).status,200);assert.equal((await request('/api/me')).status,401);
 assert.equal((await request('/api/login',{email:'proxy@example.invalid',password:'proxy-test-password'})).status,200);
 console.log('Built Next frontend proxy: signup, session, preferences, order, restart persistence, origin rejection and overwritten forged identity passed.');
}finally{await Promise.all([...children].map(stop));if(tls)await new Promise<void>(resolve=>tls?.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});}
