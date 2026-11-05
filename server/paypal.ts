import type Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {PaymentAttempt} from '../shared/payment.js';
import type {PaymentProvider} from './orders.js';

const origin='https://api-m.sandbox.paypal.com';
const identifier=z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const binding=z.object({attempt_id:z.string(),provider_id:identifier.nullable(),create_key:z.string(),capture_key:z.string(),capture_started:z.number()});
const money=z.object({currency_code:z.literal('USD'),value:z.string().regex(/^\d+\.\d{2}$/)});
const orderSchema=z.object({id:identifier,intent:z.literal('CAPTURE'),status:z.string(),purchase_units:z.array(z.object({custom_id:z.string(),invoice_id:z.string(),payee:z.object({merchant_id:z.string()}),amount:money,payments:z.object({captures:z.array(z.object({id:identifier,status:z.string(),amount:money,final_capture:z.literal(true)}))}).optional()})).length(1),links:z.array(z.object({rel:z.string(),href:z.string()})).optional()});
export type SandboxTransport=(url:string,init:RequestInit)=>Promise<Response>;
export type SandboxConfig={clientId:string;clientSecret:string;merchantId:string;webhookId:string;returnUrl:string;cancelUrl:string};
export function createSandboxPayPal(db:Database.Database,config:SandboxConfig,transport:SandboxTransport=fetch):PaymentProvider & {begin:(attempt:PaymentAttempt)=>Promise<{providerId:string;url:string}>;verifyWebhook:(headers:Headers,event:unknown)=>Promise<string|undefined>} {
  for(const value of [config.clientId,config.clientSecret,config.merchantId,config.webhookId])z.string().min(1).parse(value);
  for(const value of [config.returnUrl,config.cancelUrl]){const url=new URL(value);if(url.protocol!=='https:' && !(url.protocol==='http:'&&url.hostname==='127.0.0.1'))throw Error('Secure callback origin required.');}
  async function request(path:string,method:string,body?:unknown,key?:string){
    const tokenResponse=await transport(`${origin}/v1/oauth2/token`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:`Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
    if(!tokenResponse.ok)throw Error('Sandbox authentication unavailable.');
    const token=z.object({access_token:z.string().min(1)}).parse(await tokenResponse.json());
    const response=await transport(`${origin}${path}`,{method,redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json',Prefer:'return=representation',...(key?{'PayPal-Request-Id':key}:{})},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
    if(!response.ok)throw Error('Sandbox request outcome unavailable.');
    return response.json();
  }
  const reserve=db.transaction((attempt:PaymentAttempt)=>{
    db.prepare('INSERT OR IGNORE INTO paypal_requests(attempt_id,create_key,capture_key,capture_started) VALUES(?,?,?,0)').run(attempt.id,randomUUID(),randomUUID());
    return read(attempt);
  });
  function read(attempt:PaymentAttempt){return binding.parse(db.prepare('SELECT * FROM paypal_requests WHERE attempt_id=?').get(attempt.id));}
  function parse(attempt:PaymentAttempt,input:unknown){
    const value=orderSchema.parse(input),unit=value.purchase_units[0];
    const saved=read(attempt),snapshot=attempt.snapshot;
    if(!unit || value.id!==saved.provider_id || unit.custom_id!==attempt.id || unit.invoice_id!==`${snapshot.orderId}-${snapshot.revision}` || unit.payee.merchant_id!==config.merchantId || unit.amount.value!==(snapshot.amount/100).toFixed(2) || snapshot.merchant!=='clearcheckout-demo-merchant')throw Error('Sandbox order binding mismatch.');
    const captures=unit.payments?.captures??[];
    if(captures.length>1)throw Error('Unexpected captures.');
    const capture=captures[0];
    if(capture && (capture.amount.value!==unit.amount.value || capture.amount.currency_code!==unit.amount.currency_code))throw Error('Sandbox capture amount mismatch.');
    return {...snapshot,providerId:value.id,status:value.status==='COMPLETED'&&capture?.status==='COMPLETED'?'paid':value.status==='APPROVED'?'approved':'pending'};
  }
  async function lookup(attempt:PaymentAttempt){const saved=read(attempt);if(!saved.provider_id)throw Error('Sandbox creation outcome requires operator reconciliation.');return parse(attempt,await request(`/v2/checkout/orders/${identifier.parse(saved.provider_id)}`,'GET'));}
  async function begin(attempt:PaymentAttempt){
    const saved=reserve.immediate(attempt);if(saved.provider_id)throw Error('Sandbox approval already started.');
    const callback=new URL(config.returnUrl);callback.searchParams.set('attempt',attempt.id);
    const result=orderSchema.parse(await request('/v2/checkout/orders','POST',{intent:'CAPTURE',purchase_units:[{custom_id:attempt.id,invoice_id:`${attempt.snapshot.orderId}-${attempt.snapshot.revision}`,payee:{merchant_id:config.merchantId},amount:{currency_code:'USD',value:(attempt.snapshot.amount/100).toFixed(2)}}],payment_source:{paypal:{experience_context:{return_url:callback.href,cancel_url:config.cancelUrl,user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING'}}}},saved.create_key));
    db.prepare('UPDATE paypal_requests SET provider_id=? WHERE attempt_id=? AND provider_id IS NULL').run(result.id,attempt.id);
    parse(attempt,result);
    const link=result.links?.find(link=>link.rel==='payer-action'||link.rel==='approve');if(!link)throw Error('Sandbox approval link missing.');
    const url=new URL(link.href);if(url.origin!=='https://www.sandbox.paypal.com'||url.pathname!=='/checkoutnow'||url.searchParams.get('token')!==result.id)throw Error('Invalid sandbox approval destination.');
    return {providerId:result.id,url:url.href};
  }
  async function capture(attempt:PaymentAttempt){
    const saved=read(attempt);
    if(!saved.provider_id)throw Error('Sandbox order missing.');
    const approved=await lookup(attempt);if(approved.status!=='approved')return approved;
    const claimed=db.prepare('UPDATE paypal_requests SET capture_started=1 WHERE attempt_id=? AND capture_started=0').run(attempt.id);
    if(claimed.changes!==1)return lookup(attempt);
    return parse(attempt,await request(`/v2/checkout/orders/${identifier.parse(saved.provider_id)}/capture`,'POST',{},saved.capture_key));
  }
  async function verifyWebhook(headers:Headers,event:unknown){
    const raw=typeof event==='string'?event:JSON.stringify(event);
    const parsed=z.object({id:identifier,resource:z.object({supplementary_data:z.object({related_ids:z.object({order_id:identifier})}).optional(),id:identifier})}).parse(JSON.parse(raw));
    const input={auth_algo:headers.get('paypal-auth-algo'),cert_url:headers.get('paypal-cert-url'),transmission_id:headers.get('paypal-transmission-id'),transmission_sig:headers.get('paypal-transmission-sig'),transmission_time:headers.get('paypal-transmission-time'),webhook_id:config.webhookId,webhook_event:event};
    for(const field of [input.auth_algo,input.cert_url,input.transmission_id,input.transmission_sig,input.transmission_time])z.string().min(1).max(4096).parse(field);
    const verification=z.object({verification_status:z.literal('SUCCESS')}).safeParse(await request('/v1/notifications/verify-webhook-signature','POST',JSON.stringify({...input,webhook_event:undefined}).slice(0,-1)+',"webhook_event":'+raw+'}'));if(!verification.success)throw Error('Webhook signature rejected.');
    if(db.prepare('SELECT id FROM paypal_webhooks WHERE id=?').get(parsed.id))return undefined;
    const providerId=parsed.resource.supplementary_data?.related_ids.order_id??parsed.resource.id;
    const row=db.prepare('SELECT attempt_id FROM paypal_requests WHERE provider_id=?').get(providerId);if(!row)return undefined;
    return z.object({attempt_id:z.string()}).parse(row).attempt_id;
  }
  return {begin,approve:lookup,capture,lookup,verifyWebhook};
}

export function sandboxConfiguration(environment:NodeJS.ProcessEnv):SandboxConfig|undefined {
  if(environment.PAYPAL_SANDBOX_ENABLED!=='true')return undefined;
  if(environment.PAYPAL_MODE!=='sandbox')throw Error('Only sandbox mode is supported.');
  const values=z.object({PAYPAL_SANDBOX_CLIENT_ID:z.string().min(1),PAYPAL_SANDBOX_CLIENT_SECRET:z.string().min(1),PAYPAL_SANDBOX_MERCHANT_ID:z.string().min(1),PAYPAL_SANDBOX_WEBHOOK_ID:z.string().min(1),PUBLIC_ORIGIN:z.string().url()}).parse(environment);
  return {clientId:values.PAYPAL_SANDBOX_CLIENT_ID,clientSecret:values.PAYPAL_SANDBOX_CLIENT_SECRET,merchantId:values.PAYPAL_SANDBOX_MERCHANT_ID,webhookId:values.PAYPAL_SANDBOX_WEBHOOK_ID,returnUrl:`${values.PUBLIC_ORIGIN}/payment`,cancelUrl:`${values.PUBLIC_ORIGIN}/payment`};
}
