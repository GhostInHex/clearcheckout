import {z} from 'zod';
import {orderSchema} from '../server/contracts.js';
import type {ChildProcess} from 'node:child_process';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
const dir=mkdtempSync(tmpdir()+'/cc-compiled-');
let child:ChildProcess|undefined;
async function boot(){child=spawn('npm',['start'],{env:{CLEARCHECKOUT_SKIP_ENV_FILE:'1',PATH:process.env.PATH,HOME:dir,PORT:String(process.env.COMPILED_TEST_PORT || 3487),DB_PATH:dir+'/db.sqlite',MODEL_API_KEY:'',META_AI_CALL_LIMIT:'0'},detached:true,stdio:['ignore','pipe','pipe']});const running=child;await new Promise<void>((resolve,reject)=>{running.stdout?.on('data',b=>{if(b.toString().includes('ClearCheckout ready'))resolve();});running.stderr?.on('data',b=>process.stderr.write(b));running.once('exit',code=>reject(Error('Startup exit '+code)));setTimeout(()=>reject(Error('Startup timeout')),5000).unref();});}
async function stop(){assert(child?.pid);const running=child;const exited=new Promise<void>(resolve=>running.once('exit',()=>resolve()));process.kill(-child.pid,'SIGTERM');await exited;}
let cookie='';const base='http://localhost:'+String(process.env.COMPILED_TEST_PORT || 3487);
async function request(path:string,body:unknown=undefined,method=body===undefined?'GET':'POST'){return fetch(base+path,{method,headers:{'x-clearcheckout':'1','content-type':'application/json',cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});}
try {await boot();let r=await request('/api/signup',{email:'compiled@test.com',password:'compiledpassword'});assert.equal(r.status,201);const header=r.headers.get('set-cookie');assert(header);cookie=z.string().parse(header.split(';')[0]);assert.equal(r.headers.get('cache-control'),'no-store');
 r=await request('/api/orders',{});assert.equal(r.status,201);let order=orderSchema.and(z.object({phrase:z.string()})).parse(await r.json());r=await request('/api/orders/'+order.id,{type:'confirm',phrase:order.phrase,revision:1,outcome:'success'});assert.equal(r.status,409);
 r=await request('/api/orders/'+order.id,{type:'review'});order=orderSchema.and(z.object({phrase:z.string()})).parse(await r.json());r=await request('/api/orders/'+order.id,{type:'confirm',phrase:order.phrase,revision:order.revision,outcome:'success'});assert.equal(orderSchema.parse(await r.json()).state,'completed_demo');
 assert.equal((await request('/api/ai/explain',{orderId:order.id})).status,503);assert.equal((await request('/api/preferences',{preferences:{}},'PUT')).status,400);
 for(const path of ['/','/clearcheckout-extension.zip','/extension/manifest.json']){const asset=await request(path);console.log(path,asset.status,asset.status===200?'ok':await asset.text());assert.equal(asset.status,200,path);};
 const exposed=await request('/server/server/app.js');assert(!(await exposed.text()).includes('createApp'));
 const large=await request('/api/signup',{padding:'x'.repeat(9000)});assert.equal(large.status,413);assert.equal(z.object({error:z.string()}).parse(await large.json()).error,'Request is too large.');
 await stop();await boot();assert.equal((await request('/api/me')).status,200);const orders=z.array(orderSchema).parse(await (await request('/api/orders')).json());assert.equal(orders[0]?.state,'completed_demo');
 const db=new Database(dir+'/db.sqlite');assert.equal(db.pragma('user_version',{simple:true}),1);db.close();console.log('Compiled npm start: signup/session, no-store, exact payment transition, isolated persistence/restart, v1 schema, 400/409/413/503 contracts, downloads and private server output passed.');
} finally {if(child?.exitCode===null && child?.signalCode===null)await stop();rmSync(dir,{recursive:true,force:true});}
