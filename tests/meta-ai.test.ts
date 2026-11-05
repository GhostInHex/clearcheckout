import {z} from 'zod';
import {statusErrorSchema} from '../server/contracts.js';
import {port,cookie as sessionCookie,stringBody,audioRequest,scalarRow} from './node-helpers.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {createMetaGuidance,metaConfig} from '../server/meta-ai.js';
import {createApp} from '../server/app.js';
const order:Pick<import('../shared/checkout.js').Order,'cart'|'delivery'|'state'|'revision'> & {id:string}={id:'a'.repeat(24),cart:{tea:1,mug:1},delivery:'standard',state:'draft',revision:1};
const config={key:'test-only-key',budgetMicros:5000000,callLimit:100};
const reply=(usage:{input_tokens:number;output_tokens:number}|null={input_tokens:400,output_tokens:100})=>new Response(JSON.stringify({status:'completed',output:[{type:'reasoning'},{type:'message',role:'assistant',content:[{type:'output_text',text:'Review your tea and mug. No money moves.'}]}],usage}));
test('official HTTP shape, bounded input, safe summary, parsing and revision/mode cache',async()=>{
 const db=new Database(':memory:');let calls=0;
 const ai=createMetaGuidance(db,{config,transport:async(url,options)=>{calls++;assert.equal(url,'https://api.meta.ai/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-only-key');assert.equal(options.redirect,'error');const body=z.object({model:z.string(),max_output_tokens:z.number(),store:z.boolean(),input:z.string(),instructions:z.string(),tools:z.unknown().optional()}).parse(JSON.parse(stringBody(options.body)));assert.equal(body.model,'muse-spark-1.3-contributor');assert.equal(body.max_output_tokens,2048);assert.equal(body.store,false);const summary=z.object({totals:z.object({total:z.string(),shipping:z.string()}),items:z.array(z.object({unitPrice:z.string(),lineTotal:z.string()}))}).parse(JSON.parse(body.input));assert.equal(summary.totals.total,'$42.00');assert.equal(summary.totals.shipping,'$0.00');assert.equal(summary.items[0]?.unitPrice,'$24.00');assert.equal(summary.items[1]?.lineTotal,'$18.00');assert.ok(!body.input.includes('4200'));assert.match(body.instructions,/not cents/);assert.ok(!body.input.includes('private@example.com'));assert.ok(!body.tools);return reply();}});
 try {const first=await ai.explain('u',order,'brief');assert.match(first.text,/tea/);assert.equal((await ai.explain('u',order,'brief')).cached,true);assert.equal(calls,1);await assert.rejects(ai.explain('u',{...order,revision:2},'brief'),/30 seconds/);db.prepare('UPDATE ai_calls SET created=0').run();assert.equal((await ai.explain('u',order,'detailed')).cached,false);assert.equal(calls,2);await ai.explain('other',order,'brief');assert.equal(calls,3);} finally {db.close();}
});
test('atomic concurrent reservations, permanent cap and persisted call limit',async()=>{
 const db=new Database(':memory:');let release:()=>void=()=>assert.fail('transport not started');let calls=0;
 const transport=async()=>{calls++;await new Promise<void>(r=>release=r);return reply();};
 const ai=createMetaGuidance(db,{config:{...config,budgetMicros:50000},transport});
 try {const pending=ai.explain('u',order,'brief');await assert.rejects(ai.explain('v',order,'brief'),/allowance/);release();await pending;assert.equal(calls,1);const reopened=createMetaGuidance(db,{config:{...config,callLimit:1},transport});await assert.rejects(reopened.explain('w',order,'brief'),/allowance/);assert.equal(scalarRow.parse(db.prepare('SELECT SUM(reserved) AS total FROM ai_calls').get()).total,50000);} finally {db.close();}
});
test('missing usage fails closed, errors hide provider secrets and no automatic retry',async()=>{
 for(const transport of [async()=>reply(null),async()=>{throw new Error('secret provider body');},async()=>new Response('secret provider body',{status:401})]){
 const db=new Database(':memory:');let calls=0;const ai=createMetaGuidance(db,{config,transport:async(...args)=>{calls++;return transport();}});
 await assert.rejects(ai.explain('u',order,'brief'),e=>!statusErrorSchema.parse(e).message.includes('secret')&&statusErrorSchema.parse(e).status===502);assert.equal(calls,1);assert.equal(scalarRow.parse(db.prepare('SELECT reserved FROM ai_calls').get()).reserved,50000);db.close();
 }
 const db=new Database(':memory:');const ai=createMetaGuidance(db,{config,transport:async()=>reply(null)});await assert.rejects(ai.explain('u',order,'brief'));await assert.rejects(ai.explain('v',order,'brief'),/paused/);db.close();
});
test('timeout retains reservation and makes no retry',async()=>{
 const db=new Database(':memory:');let calls=0;
 const ai=createMetaGuidance(db,{config,timeoutMs:10,transport:async(_,options)=>{calls++;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))));}});
 await assert.rejects(ai.explain('u',order,'brief'),/No automatic retry/);assert.equal(calls,1);assert.equal(scalarRow.parse(db.prepare('SELECT reserved FROM ai_calls').get()).reserved,50000);db.close();
});
test('unconfigured never calls transport; invalid config fails closed',async()=>{
 const db=new Database(':memory:');const ai=createMetaGuidance(db,{config:{...config,key:''},transport:()=>assert.fail('must not call')});await assert.rejects(ai.explain('u',order,'brief'),/not configured/);assert.equal(metaConfig({META_AI_BUDGET_USD:'invalid'}).budgetMicros,0);assert.equal(metaConfig({META_AI_BUDGET_USD:'500'}).budgetMicros,5000000);db.close();
});
test('authenticated endpoint accepts only order ID and isolates user orders',async()=>{
 const {app,db}=createApp({dbPath:':memory:',aiOptions:{config,transport:async()=>reply()}});const server=app.listen(0);const base=`http://localhost:${port(server)}/api`;let cookie='';
 const request=async(path:string,body:unknown)=>{const response=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-clearcheckout':'1',cookie},body:JSON.stringify(body)});return {response,data:z.object({id:z.string().optional()}).parse(await response.json())};};
 try {assert.equal((await request('/ai/explain',{orderId:order.id})).response.status,401);let signup=await request('/signup',{email:'one@test.com',password:'correctpassword'});cookie=sessionCookie(signup.response);const saved=(await request('/orders',{})).data;assert.equal((await request('/ai/explain',{orderId:saved.id,prompt:'arbitrary text'})).response.status,400);assert.equal((await request('/ai/explain',{orderId:saved.id})).response.status,200);signup=await request('/signup',{email:'two@test.com',password:'correctpassword'});cookie=sessionCookie(signup.response);assert.equal((await request('/ai/explain',{orderId:saved.id})).response.status,404);}finally{await new Promise(r=>server.close(r));db.close();}
});
test('reservations survive database reopen and concurrent SQLite connections',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const folder=mkdtempSync(`${tmpdir()}/cc-ai-`);const file=`${folder}/ledger.sqlite`;let db=new Database(file);let second;
 try {
  let release:()=>void=()=>assert.fail('transport not started');const ai=createMetaGuidance(db,{config:{...config,budgetMicros:50000},transport:async()=>{await new Promise<void>(r=>release=r);return reply();}});
  const pending=ai.explain('u',order,'brief');second=new Database(file);
  const other=createMetaGuidance(second,{config:{...config,budgetMicros:50000},transport:()=>assert.fail('budget must reject before provider')});
  await assert.rejects(other.explain('v',order,'brief'),/allowance/);release();await pending;second.close();second=null;db.close();db=new Database(file);
  const reopened=createMetaGuidance(db,{config:{...config,budgetMicros:50000},transport:()=>assert.fail('persisted budget')});assert.equal((await reopened.explain('u',order,'brief')).cached,true);await assert.rejects(reopened.explain('v',order,'brief'),/allowance/);
 } finally {second?.close();db.close();rmSync(folder,{recursive:true,force:true});}
});
