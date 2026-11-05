import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtempSync,readFileSync,appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
import {once} from 'node:events';
import Database from 'better-sqlite3';
import {z} from 'zod';
import {orderSchema} from '../server/contracts.js';
import {publicUserSchema,checkoutResponseSchema} from '../shared/api-schema.js';
const dir=mkdtempSync(path.join(tmpdir(),'cc-next-security-'));const dbPath=path.join(dir,'test.sqlite');
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const address=probe.address();if(!address||typeof address==='string')throw Error('No port');const port=address.port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
const base=`http://127.0.0.1:${port}`;const receipt=path.resolve('artifacts/program/P02/security-parity');
let server:ChildProcess|undefined;
async function start(fake=true,trustProxy='loopback'){
 server=spawn(process.execPath,['--import','tsx',...(fake?['--import','./tests/next-provider-fixture.ts']:[]),'./scripts/next-start.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:fake?'test':'production',HOSTNAME:'127.0.0.1',PORT:String(port),DB_PATH:dbPath,MODEL_API_KEY:fake?'isolated-fake-key':'',COOKIE_SECURE:'true',TRUST_PROXY:trustProxy},stdio:['ignore','pipe','pipe']});
 server.stdout?.on('data',chunk=>appendFileSync(path.join(receipt,'start.log'),chunk));server.stderr?.on('data',chunk=>appendFileSync(path.join(receipt,'start.log'),chunk));
 for(let n=0;n<200;n++){if(server.exitCode!==null)throw Error('Next exited');try{await fetch(base);return;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
 throw Error('Next not ready');
}
async function stop(){if(server){server.kill('SIGTERM');await once(server,'exit');server=undefined;}}
let client=1;
async function call(route:string,{method='GET',body,cookie='',headers={}}:{method?:string;body?:string|Uint8Array;cookie?:string;headers?:Record<string,string>}={}){
 const response=await fetch(base+route,{method,headers:{'X-ClearCheckout':'1','Content-Type':'application/json','X-Forwarded-For':`192.0.2.${client}`,Cookie:cookie,...headers},...(body===undefined?{}:{body:typeof body==='string'?body:new Blob([new Uint8Array(body)])})});
 assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('content-security-policy')||'',/object-src 'none'/);return response;
}
async function signup(){client++;const response=await call('/api/signup',{method:'POST',body:JSON.stringify({email:`user${client}@test.com`,password:'correctpassword123'})});assert.equal(response.status,201);publicUserSchema.parse(await response.json());const cookie=response.headers.get('set-cookie')||'';assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Secure/);assert.match(cookie,/Max-Age=604800/);return cookie.split(';')[0]||'';}
async function order(cookie:string){const response=await call('/api/orders',{method:'POST',cookie});assert.equal(response.status,201);return checkoutResponseSchema.parse(await response.json());}
try{
 await start();
 assert.equal((await call('/api/me')).status,401);
 assert.equal((await call('/api/signup',{method:'POST',body:'{',headers:{Origin:'bad'}})).status,400);
 assert.equal((await call('/api/signup',{method:'POST',body:'{}',headers:{Origin:'bad'}})).status,403);
 assert.equal((await call('/api/signup',{method:'POST',body:'{}',headers:{Origin:'https://foreign.test'}})).status,403);
 assert.equal((await call('/api/signup',{method:'POST',body:'x'.repeat(8193)})).status,413);
 assert.equal((await call('/api/media/transcribe',{method:'POST',body:new Uint8Array(512001),headers:{'Content-Type':'audio/wav'}})).status,401);
 const cookie=await signup();const original=await order(cookie);
 assert.equal((await call('/api/preferences',{method:'PUT',cookie,body:JSON.stringify({preferences:{textSize:'large',contrast:true,guidance:'detailed'}})})).status,200);
 assert.equal((await call('/api/media/transcribe',{method:'POST',cookie,body:new Uint8Array(512001),headers:{'Content-Type':'audio/wav'}})).status,413);
 assert.equal((await call('/api/media/transcribe',{method:'POST',cookie,body:new Uint8Array(44),headers:{'Content-Type':'audio/wav'}})).status,400);
 assert.equal((await call('/api/media/scene',{method:'POST',cookie})).status,200);
 const image=Buffer.from(await (await call('/api/media/scene',{cookie})).arrayBuffer());assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const audioCookie=await signup();const wav=Buffer.alloc(46);wav.write('RIFF');wav.writeUInt32LE(38,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(2,40);
 assert.equal((await call('/api/media/transcribe',{method:'POST',cookie:audioCookie,body:wav,headers:{'Content-Type':'audio/wav'}})).status,200);
 const second=await signup();assert.equal((await call(`/api/orders/${original.id}`,{method:'POST',cookie:second,body:'{"type":"review"}'})).status,404);
 const aiOrder=await order(second);const explain=()=>call('/api/ai/explain',{method:'POST',cookie:second,body:JSON.stringify({orderId:aiOrder.id})});assert.equal((await explain()).status,200);assert.equal(z.object({cached:z.boolean()}).parse(await (await explain()).json()).cached,true);
 assert.equal((await call('/api/media/scene',{method:'POST',cookie:second})).status,200);
 const third=await signup();const thirdOrder=await order(third);assert.equal((await call('/api/ai/explain',{method:'POST',cookie:third,body:JSON.stringify({orderId:thirdOrder.id})})).status,502);
 assert.equal((await call('/api/ai/explain',{method:'POST',cookie:third,body:JSON.stringify({orderId:thirdOrder.id})})).status,429);
 const fourth=await signup();const fourthOrder=await order(fourth);assert.equal((await call('/api/ai/explain',{method:'POST',cookie:fourth,body:JSON.stringify({orderId:fourthOrder.id})})).status,502);
 const db=new Database(dbPath);const reservations=z.array(z.object({reserved:z.number()})).parse(db.prepare('SELECT reserved FROM ai_calls').all());assert.equal(reservations.length,5);assert.ok(reservations.every(row=>row.reserved===50000));db.close();
 const callsBefore=readFileSync(dbPath+'.provider','utf8');assert.equal(callsBefore.trim().split('\n').length,5);
 await stop();await start();
 const me=publicUserSchema.parse(await (await call('/api/me',{cookie})).json());assert.equal(me.preferences.textSize,'large');assert.equal((await call('/api/orders',{cookie})).status,200);assert.equal(orderSchema.array().parse(await (await call('/api/orders',{cookie})).json())[0]?.id,original.id);
 assert.deepEqual(Buffer.from(await (await call('/api/media/scene',{cookie})).arrayBuffer()),image);
 const reopened=new Database(dbPath);assert.equal(z.object({n:z.number()}).parse(reopened.prepare('SELECT COUNT(*) n FROM ai_calls').get()).n,5);reopened.close();assert.equal(readFileSync(dbPath+'.provider','utf8'),callsBefore);
 for(const route of ['/server/service.ts','/server/next-handler.ts','/.env']){const response=await fetch(base+route);assert.equal(response.status,404);}
 const home=await (await fetch(base)).text();const asset=home.match(/src="([^\"]*\/_next\/static\/[^\"]+)"/);assert.ok(asset?.[1]);assert.equal((await fetch(base+asset[1])).status,200);
 assert.equal((await fetch(base+'/clearcheckout-extension.zip')).status,200);
 const source=await fetch(base+'/clearcheckout-source.zip',{redirect:'manual'});assert.equal(source.status,307);assert.equal(source.headers.get('location'),'https://github.com/GhostInHex/clearcheckout/archive/refs/heads/main.zip');
 for(const route of ['/extension/manifest.json','/clearcheckout-submission.mp4','/clearcheckout-captions.srt'])assert.equal((await fetch(base+route)).status,200);
 for(let n=1;n<50;n++)await order(cookie);assert.equal((await call('/api/orders',{method:'POST',cookie})).status,429);
 const expired=new Database(dbPath);expired.prepare('UPDATE sessions SET expires=0').run();expired.close();assert.equal((await call('/api/me',{cookie})).status,401);

 client=200;for(let n=0;n<180;n++)assert.equal((await call('/api/me')).status,401);const rate=await call('/api/me');assert.equal(rate.status,429);assert.match(rate.headers.get('ratelimit')||'',/r=0/);assert.ok(rate.headers.get('ratelimit-policy'));client=201;assert.equal((await call('/api/me')).status,401);
 for(let n=0;n<30;n++)assert.equal((await call('/api/login',{method:'POST',body:'{}'})).status,400);assert.equal((await call('/api/login',{method:'POST',body:'{}'})).status,429);
 await stop();await start(false,'false');
 for(let n=0;n<180;n++){client=1+n;assert.equal((await call('/api/me',{headers:{'x-cc-client':'forged','x-cc-client-signature':'forged'}})).status,401);}
 client=250;assert.equal((await call('/api/me')).status,429);
 await stop();await start(false);
 const browser=spawn(process.execPath,['--import','tsx','tests/browser.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'test',BROWSER_BASE_URL:base},stdio:['ignore','pipe','pipe']});
 browser.stdout?.on('data',chunk=>appendFileSync(path.join(receipt,'browser.log'),chunk));browser.stderr?.on('data',chunk=>appendFileSync(path.join(receipt,'browser.log'),chunk));assert.deepEqual(await once(browser,'exit'),[0,null]);
 console.log(JSON.stringify({result:'passed',dbPath,checks:'Next security, raw WAV bounds, origin/parser order, secure cookie, account isolation, provider cache/fault/malformed/cooldown/no retries, 50000 reservations, restart session/preferences/media/ledger, source isolation, static assets, independent client limits'}));
}finally{await stop();}
