import {test} from 'node:test';
import assert from 'node:assert/strict';
import {z} from 'zod';
import Database from 'better-sqlite3';
import {migrate} from '../server/migrations/index.js';
import {createSandboxPayPal,sandboxConfiguration} from '../server/paypal.js';
import type {PaymentAttempt} from '../shared/payment.js';
const attempt:PaymentAttempt={id:'attempt',requestKey:'request',snapshot:{orderId:'order',revision:1,amount:1200,currency:'USD',merchant:'clearcheckout-demo-merchant'},state:{kind:'approving'}};
function fixture(){
 const db=new Database(':memory:');migrate(db);let status='CREATED',captureStatus='COMPLETED',captureCalls=0,timeout=false,signature=true;
 let amount='12.00',currency='USD',payee='merchant',custom='attempt';
 const keys:string[]=[];
 const order=()=>({id:'PAYPAL1',intent:'CAPTURE',status,purchase_units:[{custom_id:custom,invoice_id:'order-1',payee:{merchant_id:payee},amount:{currency_code:currency,value:amount},...(status==='COMPLETED'?{payments:{captures:[{id:'CAPTURE1',status:captureStatus,amount:{currency_code:currency,value:amount},final_capture:true}]}}:{})}],links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL1'}]});
 const provider=createSandboxPayPal(db,{clientId:'synthetic',clientSecret:'synthetic',merchantId:'merchant',webhookId:'webhook',returnUrl:'http://127.0.0.1/payment',cancelUrl:'http://127.0.0.1/payment'},async(url,init)=>{
 assert.equal(new URL(url).origin,'https://api-m.sandbox.paypal.com');
 if(url.endsWith('/token'))return Response.json({access_token:'synthetic'});
 if(url.endsWith('verify-webhook-signature'))return Response.json({verification_status:signature?'SUCCESS':'FAILURE'});
 if(init.method==='POST'){const key=new Headers(init.headers).get('PayPal-Request-Id');assert.ok(key);keys.push(key);assert.ok(db.prepare('SELECT create_key FROM paypal_requests WHERE create_key=? OR capture_key=?').get(key,key));}
 if(url.endsWith('/capture')){captureCalls++;status='COMPLETED';if(timeout)throw Error('Synthetic timeout');}
 return Response.json(order());
 });
 return {db,provider,keys,get calls(){return captureCalls;},approve(){status='APPROVED';},timeout(){timeout=true;},mismatch(field:string){if(field==='amount')amount='13.00';if(field==='currency')currency='EUR';if(field==='payee')payee='other';if(field==='order')custom='other';if(field==='capture')captureStatus='PENDING';},forge(value=true){signature=!value;}};
}
test('sandbox disabled is honest and enabled live mode is rejected',()=>{assert.equal(sandboxConfiguration({}),undefined);assert.throws(()=>sandboxConfiguration({PAYPAL_SANDBOX_ENABLED:'true',PAYPAL_MODE:'live'}));});
test('persisted keys, concurrent capture and retrieval after timeout never repeat capture',async()=>{const f=fixture();try{await f.provider.begin(attempt);f.approve();f.timeout();await Promise.allSettled([f.provider.capture(attempt),f.provider.capture(attempt)]);assert.equal(f.calls,1);assert.equal(z.object({status:z.string()}).parse(await f.provider.lookup(attempt)).status,'paid');await f.provider.capture(attempt);assert.equal(f.calls,1);assert.equal(new Set(f.keys).size,2);}finally{f.db.close();}});
for(const field of ['amount','currency','payee','order'])test(`reject ${field} mismatch`,async()=>{const f=fixture();try{await f.provider.begin(attempt);f.approve();f.mismatch(field);await assert.rejects(()=>f.provider.capture(attempt));assert.equal(f.calls,0);}finally{f.db.close();}});
test('only completed captures establish paid',async()=>{const f=fixture();try{await f.provider.begin(attempt);f.approve();f.mismatch('capture');assert.equal(z.object({status:z.string()}).parse(await f.provider.capture(attempt)).status,'pending');}finally{f.db.close();}});
test('forged webhook rejected and durable duplicate ignored',async()=>{const f=fixture();try{await f.provider.begin(attempt);const headers=new Headers(Object.fromEntries(['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'].map(key=>[`paypal-${key}`,'synthetic'])));const event={id:'EVENT1',resource:{id:'PAYPAL1'}};f.forge();await assert.rejects(()=>f.provider.verifyWebhook(headers,event));f.forge(false);assert.equal(await f.provider.verifyWebhook(headers,event),'attempt');f.db.prepare('INSERT INTO paypal_webhooks VALUES(?)').run('EVENT1');assert.equal(await f.provider.verifyWebhook(headers,event),undefined);}finally{f.db.close();}});
