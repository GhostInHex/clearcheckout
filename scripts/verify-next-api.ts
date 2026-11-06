import assert from 'node:assert/strict';
import {publicUserSchema,checkoutResponseSchema} from '../shared/api-schema.js';
const base=process.env.BROWSER_BASE_URL;
if(!base)throw new Error('BROWSER_BASE_URL must point to an isolated Next production process');
let cookie='';
async function call(path:string,method='GET',body?:unknown){const response=await fetch(base+path,{method,headers:{'X-ClearCheckout':'1','Content-Type':'application/json',Cookie:cookie},...(body===undefined?{}:{body:JSON.stringify(body)})});assert.equal(response.headers.get('cache-control'),'no-store');const set=response.headers.get('set-cookie');if(set)cookie=set.split(';')[0]||'';return {status:response.status,body:await response.json()};}
assert.equal((await call('/api/me')).status,401);
const signup=await call('/api/signup','POST',{email:`next-${Date.now()}@test.com`,password:'correctpassword123'});assert.equal(signup.status,201);publicUserSchema.parse(signup.body);
assert.equal((await call('/api/me')).status,200);
const created=await call('/api/orders','POST');assert.equal(created.status,201);const order=checkoutResponseSchema.parse(created.body);
assert.equal((await call(`/api/orders/${order.id}`,'POST',{type:'confirm',phrase:'wrong',revision:0,outcome:'success'})).status,409);
assert.equal((await call('/api/preferences','PUT',{preferences:{textSize:'large',contrast:true,guidance:'detailed'}})).status,200);
assert.equal((await call('/api/orders/missing','POST',{type:'review'})).status,404);
assert.equal((await call('/api/preferences','PUT',{padding:'x'.repeat(9000)})).status,413);
assert.equal((await fetch(base+'/api/orders',{method:'POST'})).status,403);
console.log('Next API signup/session/preferences/order guards/ownership/body bound/origin checks passed');
