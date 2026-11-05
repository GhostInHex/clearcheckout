import type Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {quote,type Order} from '../shared/checkout.js';
import {paymentCommandSchema,paymentAttemptSchema,paymentSnapshotSchema,paymentTransition,type PaymentAttempt,type PaymentCommand,type PaymentState} from '../shared/payment.js';

const evidenceSchema=paymentSnapshotSchema.unwrap().extend({providerId:z.string().min(1),status:z.enum(['approved','paid','failed','pending'])}).strict();
// Only a server-owned adapter may implement these methods. No route accepts evidence.
export type PaymentProvider={begin?:(attempt:PaymentAttempt)=>Promise<{providerId:string;url:string}>;verifyWebhook?:(headers:Headers,event:unknown)=>Promise<string|undefined>;approve:(attempt:PaymentAttempt)=>Promise<unknown>;capture:(attempt:PaymentAttempt)=>Promise<unknown>;lookup:(attempt:PaymentAttempt)=>Promise<unknown>};
const requestSchema=z.string().min(1).max(160);
export function createPayments(db:Database.Database,readOrder:(userId:string,id:string)=>Order & {id:string},provider?:PaymentProvider){
  function read(userId:string,id:string){
    const row=db.prepare('SELECT body FROM payment_attempts WHERE id=? AND user_id=?').get(id,userId);
    if(!row)throw Error('Payment attempt not found.');
    return paymentAttemptSchema.parse(JSON.parse(z.object({body:z.string()}).parse(row).body));
  }
  function write(attempt:PaymentAttempt,state:PaymentState){
    const next={...attempt,state};
    db.prepare('UPDATE payment_attempts SET state=?,body=? WHERE id=?').run(state.kind,JSON.stringify(next),attempt.id);
    return next;
  }
  function evidence(attempt:PaymentAttempt,input:unknown){
    const value=evidenceSchema.parse(input);
    const snapshot=attempt.snapshot;
    if(value.orderId!==snapshot.orderId || value.revision!==snapshot.revision || value.amount!==snapshot.amount || value.currency!==snapshot.currency || value.merchant!==snapshot.merchant)throw Error('Provider evidence does not match the payment snapshot.');
    if('providerId' in attempt.state && attempt.state.providerId!==null && value.providerId!==attempt.state.providerId)throw Error('Provider identity does not match.');
    return value;
  }
  const review=db.transaction((userId:string,orderId:string,requestKey:string)=>{
    requestSchema.parse(requestKey);
    const existing=db.prepare('SELECT id,user_id,order_id FROM payment_attempts WHERE request_key=?').get(requestKey);
    if(existing){const row=z.object({id:z.string(),user_id:z.string(),order_id:z.string()}).parse(existing);if(row.user_id!==userId || row.order_id!==orderId)throw Error('Request key already used.');return read(userId,row.id);}
    const order=readOrder(userId,orderId);
    if(order.state==='completed_demo')throw Error('Completed demo orders cannot be paid.');
    const snapshot=paymentSnapshotSchema.parse({orderId,revision:order.revision,amount:quote(order.cart,order.delivery).total,currency:'USD',merchant:'clearcheckout-demo-merchant'});
    const attempt:PaymentAttempt={id:randomUUID(),requestKey,snapshot,state:{kind:'reviewed'}};
    db.prepare('INSERT INTO payment_attempts VALUES(?,?,?,?,?,?)').run(attempt.id,orderId,userId,requestKey,attempt.state.kind,JSON.stringify(attempt));
    return attempt;
  });
  const command=db.transaction((userId:string,id:string,input:PaymentCommand)=>{
    const attempt=read(userId,id);
    if(input.type!=='cancel' && (readOrder(userId,attempt.snapshot.orderId).revision!==attempt.snapshot.revision || readOrder(userId,attempt.snapshot.orderId).state==='completed_demo'))throw Error('Review the changed order.');
    return write(attempt,paymentTransition(attempt,input));
  });
  function invalidate(orderId:string){
    const rows=db.prepare("SELECT body FROM payment_attempts WHERE order_id=? AND state IN ('reviewed','awaitingGesture','approving')").all(orderId);
    for(const row of rows){const attempt=paymentAttemptSchema.parse(JSON.parse(z.object({body:z.string()}).parse(row).body));write(attempt,attempt.state.kind==='approving'?{kind:'unknown',providerId:null}:{kind:'cancelled'});}
  }
  async function begin(userId:string,id:string){
    if(!provider?.begin)throw Error('Sandbox provider is not configured.');
    const attempt=command.immediate(userId,id,{type:'gesture'});
    try{return await provider.begin(attempt);}catch{write(read(userId,id),{kind:'unknown',providerId:null});throw Error('Sandbox creation outcome unknown. Reconcile before continuing.');}
  }
  async function webhook(headers:Headers,input:unknown){
    if(!provider?.verifyWebhook)throw Error('Sandbox provider is not configured.');
    const id=await provider.verifyWebhook(headers,input);if(!id)return;
    const row=z.object({user_id:z.string()}).parse(db.prepare('SELECT user_id FROM payment_attempts WHERE id=?').get(id));
    await reconcile(row.user_id,id);
    const event=z.object({id:z.string()}).parse(typeof input==='string'?JSON.parse(input):input);
    db.prepare('INSERT OR IGNORE INTO paypal_webhooks VALUES(?)').run(event.id);
  }
  async function approve(userId:string,id:string,token?:string){
    if(!provider)throw Error('Payment provider is not configured.');
    const attempt=provider.begin?read(userId,id):command.immediate(userId,id,{type:'gesture'});
    if(provider.begin && attempt.state.kind!=='approving')throw Error('Approval no longer active.');
    try{
      const approved=evidence(attempt,await provider.approve(attempt));
      if(provider.begin && approved.providerId!==token)throw Error('Callback order mismatch.');
      const capturing=db.transaction(()=>{
        const current=read(userId,id);
        if(current.state.kind!=='approving')throw Error('Approval no longer active.');
        const order=readOrder(userId,current.snapshot.orderId);
        if(order.revision!==current.snapshot.revision || (order.state==='cancelled' || order.state==='completed_demo'))return write(current,{kind:'cancelled'});
        if(approved.status!=='approved')throw Error('Provider did not approve.');
        return write(current,{kind:'capturing',providerId:approved.providerId});
      }).immediate();
      if(capturing.state.kind!=='capturing')return capturing;
      const result=evidence(capturing,await provider.capture(capturing));
      return settle(userId,id,result);
    }catch{
      return db.transaction(()=>{const current=read(userId,id);if(current.state.kind==='paid' || current.state.kind==='cancelled' || current.state.kind==='failed')return current;return write(current,{kind:'unknown',providerId:'providerId' in current.state?current.state.providerId:null});}).immediate();
    }
  }
  function settle(userId:string,id:string,result:z.infer<typeof evidenceSchema>){
    return db.transaction(()=>{
      const current=read(userId,id);
      if(current.state.kind==='paid' || current.state.kind==='failed')return current;
      if(current.state.kind!=='capturing' && current.state.kind!=='unknown' && current.state.kind!=='approving')throw Error('No provider work to reconcile.');
      evidence(current,result);
      return write(current,result.status==='paid'?{kind:'paid',providerId:result.providerId}:result.status==='failed'?{kind:'failed',providerId:result.providerId}:{kind:'unknown',providerId:result.providerId});
    }).immediate();
  }
  async function reconcile(userId:string,id:string){
    if(!provider)throw Error('Payment provider is not configured.');
    const attempt=read(userId,id);
    if(attempt.state.kind==='paid' || attempt.state.kind==='failed')return attempt;
    if(attempt.state.kind!=='unknown' && attempt.state.kind!=='capturing' && attempt.state.kind!=='approving')throw Error('No provider work to reconcile.');
    try{const result=evidence(attempt,await provider.lookup(attempt));return settle(userId,id,result);}catch{return read(userId,id);}
  }
  // A process restart cannot establish whether the last provider call completed.
  db.transaction(()=>{
    const rows=db.prepare("SELECT body FROM payment_attempts WHERE state IN ('approving','capturing')").all();
    for(const row of rows){const attempt=paymentAttemptSchema.parse(JSON.parse(z.object({body:z.string()}).parse(row).body));write(attempt,{kind:'unknown',providerId:'providerId' in attempt.state?attempt.state.providerId:null});}
  }).immediate();
  return {read,begin,webhook,configured:Boolean(provider?.begin),review:(userId:string,orderId:string,key:string)=>review.immediate(userId,orderId,key),command:(userId:string,id:string,input:unknown)=>command.immediate(userId,id,paymentCommandSchema.parse(input)),invalidate,approve,reconcile};
}
