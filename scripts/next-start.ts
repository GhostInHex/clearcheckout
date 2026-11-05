import {createServer} from 'node:http';
import {createHmac,randomBytes} from 'node:crypto';
import {isIP} from 'node:net';
import next from 'next';
import {createService} from '../server/service.js';
import path from 'node:path';
import {writerLock,validateDatabase} from '../server/operations.js';
const unlock=writerLock(process.env.DB_PATH||'data/clearcheckout.sqlite');
const initial=createService({dbPath:process.env.DB_PATH||'data/clearcheckout.sqlite',mediaOptions:{dataDir:path.join(path.dirname(process.env.DB_PATH||'data/clearcheckout.sqlite'),'media')}});initial.db.close();
const secret=randomBytes(32).toString('hex');
process.env.CC_TRANSPORT_SECRET=secret;
const loopback=(ip:string)=>ip==='::1'||ip.startsWith('127.')||ip.startsWith('::ffff:127.');
const app=next({webpack:true,dev:process.argv.includes('--dev'),hostname:process.env.HOSTNAME||'127.0.0.1',port:Number(process.env.PORT||3000)});
await app.prepare();
const handler=app.getRequestHandler();
const server=createServer((req,res)=>{
 if(req.url==='/readyz'){
  try{validateDatabase(process.env.DB_PATH||'data/clearcheckout.sqlite');res.writeHead(200,{'Cache-Control':'no-store'});res.end('ready');}
  catch{res.writeHead(503,{'Cache-Control':'no-store'});res.end('unavailable');}return;
 }
 let ip=req.socket.remoteAddress||'unknown';
 if(process.env.TRUST_PROXY==='loopback'&&loopback(ip)){
  const forwarded=req.headers['x-forwarded-for'];
  const chain=(typeof forwarded==='string'?forwarded:'').split(',').map(value=>value.trim()).filter(Boolean);
  for(const candidate of chain.reverse()){if(!loopback(ip))break;if(!isIP(candidate))break;ip=candidate;}
 }
 req.headers['x-cc-client']=ip;
 req.headers['x-cc-client-signature']=createHmac('sha256',secret).update(ip).digest('hex');
 void handler(req,res);
}).listen(Number(process.env.PORT||3000),process.env.HOSTNAME||'127.0.0.1');

let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
 if(stopping)return;stopping=true;
 server.close(()=>{void app.close().finally(()=>{unlock();process.exit(0);});});
 setTimeout(()=>process.exit(1),25000).unref();
});
