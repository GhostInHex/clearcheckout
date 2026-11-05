import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {Worker} from 'node:worker_threads';
import {createService} from '../server/service.js';
import type {PaymentProvider} from '../server/orders.js';
import {paymentPhrase,type PaymentAttempt} from '../shared/payment.js';

async function fixture(provider?:PaymentProvider,dbPath=':memory:'){
 const service=createService({dbPath,...(provider?{paymentProvider:provider}:{})});
 const account=await service.signup({email:`${Math.random()}@example.test`,password:'synthetic-password'});
 const user=service.authenticate(service.issueSession(account.id));
 assert.ok(user);
 const order=service.createOrder(user);
 return {service,user,order};
}
function evidence(a:PaymentAttempt,status:string){return {...a.snapshot,providerId:'synthetic-provider',status};}
function confirm(f:Awaited<ReturnType<typeof fixture>>,a:PaymentAttempt){return f.service.payments.command(f.user.id,a.id,{type:'confirm',revision:a.snapshot.revision,phrase:paymentPhrase(a.snapshot)});}

test('snapshot approval is exact, revision bound, gesture distinct, and delivery edits invalidate',async()=>{
 const f=await fixture();try{
 const p=f.service.payments;const a=p.review(f.user.id,f.order.id,'review-key');
 assert.deepEqual(p.review(f.user.id,f.order.id,'review-key'),a);
 assert.throws(()=>p.review(f.user.id,f.order.id,'another-key'));
 assert.throws(()=>p.command(f.user.id,a.id,{type:'gesture'}));
 assert.throws(()=>p.command(f.user.id,a.id,{type:'confirm',revision:2,phrase:paymentPhrase(a.snapshot)}));
 assert.throws(()=>p.command(f.user.id,a.id,{type:'confirm',revision:1,phrase:'confirm $42.00'}));
 assert.equal(confirm(f,a).state.kind,'awaitingGesture');assert.equal(confirm(f,a).state.kind,'awaitingGesture');
 f.service.updateOrder(f.user,f.order.id,{type:'change',cart:{tea:1,mug:1},delivery:'express'});
 assert.equal(p.read(f.user.id,a.id).state.kind,'cancelled');
 assert.throws(()=>confirm(f,a));
 const b=p.review(f.user.id,f.order.id,'new-revision');assert.equal(b.snapshot.amount,5000);
 assert.equal(p.command(f.user.id,b.id,{type:'cancel'}).state.kind,'cancelled');
 assert.equal(p.command(f.user.id,b.id,{type:'cancel'}).state.kind,'cancelled');
 }finally{f.service.db.close();}
});

test('single capture, immutable settlement across cart edits and duplicate approval',async()=>{
 let captures=0;let release:()=>void=()=>{};
 const barrier=new Promise<void>(resolve=>{release=resolve;});
 const f=await fixture({approve:async a=>evidence(a,'approved'),capture:async a=>{captures++;await barrier;return evidence(a,'paid');},lookup:async a=>evidence(a,'paid')});
 try{
 const p=f.service.payments;const a=p.review(f.user.id,f.order.id,'capture-key');confirm(f,a);
 const result=p.approve(f.user.id,a.id);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(p.read(f.user.id,a.id).state.kind,'capturing');
 await assert.rejects(p.approve(f.user.id,a.id));
 f.service.updateOrder(f.user,f.order.id,{type:'change',cart:{tea:2,mug:1},delivery:'express'});
 assert.equal(p.read(f.user.id,a.id).snapshot.amount,4200);
 assert.throws(()=>p.review(f.user.id,f.order.id,'second-capture'));
 assert.throws(()=>p.command(f.user.id,a.id,{type:'cancel'}));
 release();assert.equal((await result).state.kind,'paid');assert.equal(captures,1);
 assert.equal((await p.reconcile(f.user.id,a.id)).state.kind,'paid');assert.equal(captures,1);
 assert.equal(f.service.order(f.user,f.order.id).state,'draft');
 }finally{release();f.service.db.close();}
});

test('timeouts stay unknown across restart until matching trusted evidence reconciles',async()=>{
 const dir=mkdtempSync(`${tmpdir()}/cc-payment-`);const file=`${dir}/test.sqlite`;
 const provider:PaymentProvider={approve:async a=>evidence(a,'approved'),capture:async()=>{throw Error('raw-secret-receipt');},lookup:async a=>({...evidence(a,'paid'),amount:1})};
 const f=await fixture(provider,file);let closed=false;
 try{
 const p=f.service.payments;const a=p.review(f.user.id,f.order.id,'timeout-key');confirm(f,a);
 assert.equal((await p.approve(f.user.id,a.id)).state.kind,'unknown');
 assert.equal((await p.reconcile(f.user.id,a.id)).state.kind,'unknown');
 assert.throws(()=>p.command(f.user.id,a.id,{type:'cancel'}));
 f.service.db.close();closed=true;
 const reopened=createService({dbPath:file,paymentProvider:{...provider,lookup:async value=>evidence(value,'paid')}});
 try{assert.equal(reopened.payments.read(f.user.id,a.id).state.kind,'unknown');assert.throws(()=>reopened.payments.review(f.user.id,f.order.id,'retry-key'));assert.equal((await reopened.payments.reconcile(f.user.id,a.id)).state.kind,'paid');}finally{reopened.db.close();}
 }finally{if(!closed)f.service.db.close();rmSync(dir,{recursive:true,force:true});}
});

test('ordinary demo success and forged outcomes cannot produce real paid',async()=>{
 const f=await fixture();try{
 const a=f.service.payments.review(f.user.id,f.order.id,'demo-key');
 f.service.updateOrder(f.user,f.order.id,{type:'review'});
 const result=f.service.updateOrder(f.user,f.order.id,{type:'confirm',revision:1,phrase:'CONFIRM $42.00',outcome:'success'});
 assert.equal(result.state,'completed_demo');assert.equal(f.service.payments.read(f.user.id,a.id).state.kind,'cancelled');
 assert.throws(()=>f.service.payments.review(f.user.id,f.order.id,'new-demo-key'));
 }finally{f.service.db.close();}
});

test('untrusted commands cannot supply paid or a provider receipt',async()=>{
 const f=await fixture();try{
 const a=f.service.payments.review(f.user.id,f.order.id,'forgery');
 for(const payload of [{type:'paid'},{type:'confirm',revision:1,phrase:paymentPhrase(a.snapshot),outcome:'paid'},{type:'gesture',evidence:{status:'paid'}}])assert.throws(()=>f.service.payments.command(f.user.id,a.id,payload));
 assert.equal(f.service.payments.read(f.user.id,a.id).state.kind,'reviewed');
 }finally{f.service.db.close();}
});

test('an edit during provider approval prevents capture',async()=>{
 let release:()=>void=()=>{};let captures=0;
 const barrier=new Promise<void>(resolve=>{release=resolve;});
 const f=await fixture({approve:async a=>{await barrier;return evidence(a,'approved');},capture:async a=>{captures++;return evidence(a,'paid');},lookup:async a=>evidence(a,'pending')});
 try{
 const a=f.service.payments.review(f.user.id,f.order.id,'approval-edit');confirm(f,a);
 const promise=f.service.payments.approve(f.user.id,a.id);
 f.service.updateOrder(f.user,f.order.id,{type:'change',cart:{tea:2,mug:1},delivery:'standard'});
 release();assert.equal((await promise).state.kind,'unknown');assert.equal(captures,0);
 }finally{release();f.service.db.close();}
});

test('provider identity and each snapshot field must match before settlement',async()=>{
 for(const mismatch of [{amount:1},{currency:'EUR'},{merchant:'other'},{orderId:'other'},{revision:2},{providerId:'other'}]){
 const f=await fixture({approve:async a=>evidence(a,'approved'),capture:async a=>({...evidence(a,'paid'),...mismatch}),lookup:async a=>({...evidence(a,'paid'),...mismatch})});
 try{const a=f.service.payments.review(f.user.id,f.order.id,'mismatch');confirm(f,a);assert.equal((await f.service.payments.approve(f.user.id,a.id)).state.kind,'unknown');assert.equal((await f.service.payments.reconcile(f.user.id,a.id)).state.kind,'unknown');}finally{f.service.db.close();}
 }
});

test('restart recovers interrupted provider work without granting another gesture',async()=>{
 const dir=mkdtempSync(`${tmpdir()}/cc-payment-restart-`);const file=`${dir}/test.sqlite`;
 const f=await fixture(undefined,file);const a=f.service.payments.review(f.user.id,f.order.id,'interrupted');confirm(f,a);
 f.service.payments.command(f.user.id,a.id,{type:'gesture'});f.service.db.close();
 try{const reopened=createService({dbPath:file});try{assert.equal(reopened.payments.read(f.user.id,a.id).state.kind,'unknown');assert.throws(()=>reopened.payments.command(f.user.id,a.id,{type:'gesture'}));}finally{reopened.db.close();}}finally{rmSync(dir,{recursive:true,force:true});}
});

test('concurrent database connections cannot create two active attempts',async()=>{
 const dir=mkdtempSync(`${tmpdir()}/cc-payment-race-`);const file=`${dir}/test.sqlite`;
 const f=await fixture(undefined,file);f.service.db.close();
 try{
 const results=await Promise.all([1,2].map(key=>new Promise<unknown>((resolve,reject)=>{
 const worker=new Worker(`require('tsx/cjs');const {parentPort,workerData}=require('node:worker_threads');const {createService}=require(workerData.module);const service=createService({dbPath:workerData.file});try{service.payments.review(workerData.userId,workerData.orderId,workerData.key);parentPort.postMessage('created');}catch{parentPort.postMessage('blocked');}finally{service.db.close();}`,{eval:true,workerData:{module:`${process.cwd()}/server/service.ts`,file,userId:f.user.id,orderId:f.order.id,key:`race-${key}`}});
 let outcome:unknown;worker.once('message',value=>{outcome=value;});worker.once('error',reject);worker.once('exit',code=>code===0?resolve(outcome):reject(Error(`worker exited ${code}`)));
 })));
 assert.deepEqual(results.sort(),['blocked','created']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('trusted definitive failure releases the order while retaining provider identity',async()=>{
 const f=await fixture({approve:async a=>evidence(a,'approved'),capture:async a=>evidence(a,'failed'),lookup:async a=>evidence(a,'failed')});
 try{const a=f.service.payments.review(f.user.id,f.order.id,'failed');confirm(f,a);assert.deepEqual((await f.service.payments.approve(f.user.id,a.id)).state,{kind:'failed',providerId:'synthetic-provider'});assert.equal(f.service.payments.review(f.user.id,f.order.id,'after-failure').state.kind,'reviewed');}finally{f.service.db.close();}
});
