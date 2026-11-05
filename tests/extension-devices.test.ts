import {z} from 'zod';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../server/service.js';
import {createExtensionDevices} from '../server/extension-devices.js';
const extensionId='a'.repeat(32),origin=`chrome-extension://${extensionId}`;
const binding={extensionId,installationId:'b'.repeat(64),nonce:'c'.repeat(64)};
test('device approval binds single-use code, nonce, installation, origin, expiry and ownership',async()=>{
 const service=createService({dbPath:':memory:'});let clock=1000;
 const devices=createExtensionDevices(service.db,{approvedId:extensionId,now:()=>clock,fail:(_status,message)=>{throw Error(message);}});
 try{
  const user=await service.signup({email:'device@example.test',password:'synthetic-password'});
  const approval=devices.approve(user.id,binding);
  assert.ok(!JSON.stringify(service.db.prepare('SELECT * FROM extension_links').all()).includes(approval.code));
  for(const invalid of [{...binding,nonce:'d'.repeat(64)},{...binding,installationId:'d'.repeat(64)},{...binding,extensionId:'d'.repeat(32)}])assert.throws(()=>devices.exchange({...invalid,code:approval.code},origin));
  for(const invalid of [null,'https://example.test',origin+'/','chrome-extension://'+'b'.repeat(32)])assert.throws(()=>devices.exchange({...binding,code:approval.code},invalid));
  const result=devices.exchange({...binding,code:approval.code},origin);
  assert.equal(result.scope,'labels:suggest');
  assert.throws(()=>devices.exchange({...binding,code:approval.code},origin));
  assert.ok(!JSON.stringify(service.db.prepare('SELECT * FROM extension_devices').all()).includes(result.credential));
  assert.ok(!JSON.stringify(devices.list(user.id)).includes(result.credential));
  assert.equal(devices.authenticate(result.credential,origin).user_id,user.id);
  devices.revoke('another-user',{id:result.id});assert.equal(devices.authenticate(result.credential,origin).id,result.id);
  devices.revoke(user.id,{id:result.id});devices.revoke(user.id,{id:result.id});assert.throws(()=>devices.authenticate(result.credential,origin));
  const expired=devices.approve(user.id,binding);clock+=120000;assert.throws(()=>devices.exchange({...binding,code:expired.code},origin));
  const replacement=devices.approve(user.id,binding);const device=devices.exchange({...binding,code:replacement.code},origin);clock+=7*86400000;assert.throws(()=>devices.authenticate(device.credential,origin));
  const deleted=devices.approve(user.id,binding);service.db.prepare('DELETE FROM users WHERE id=?').run(user.id);assert.throws(()=>devices.exchange({...binding,code:deleted.code},origin));assert.throws(()=>devices.authenticate(device.credential,origin));
 }finally{service.db.close();}
});
test('unconfigured extensions and malformed approval cannot mint access',async()=>{
 const service=createService({dbPath:':memory:'});
 try{assert.throws(()=>service.devices.approve('user',binding));assert.throws(()=>service.devices.approve('user',{...binding,scope:'payments'}));assert.throws(()=>service.devices.exchange({...binding,code:'d'.repeat(64)},origin));}finally{service.db.close();}
});

test('actual Next linking routes require account session and exact extension CORS without cookie credentials',async()=>{
 const {nextFixture}=await import('./next-fixture.js');
 const fixture=await nextFixture(false,{CC_APPROVED_EXTENSION_ID:extensionId});
 try{
  const headers={'content-type':'application/json','x-clearcheckout':'1',origin:fixture.base};
  const post=(path:string,data:unknown,extra:Record<string,string>={})=>fetch(fixture.base+path,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(data)});
  assert.equal((await post('/api/account/devices/approve',binding)).status,401);
  const signup=await post('/api/signup',{email:'http-device@example.test',password:'synthetic-password'});assert.equal(signup.status,201);
  const cookie=signup.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
  const approved=await post('/api/account/devices/approve',binding,{cookie});assert.equal(approved.status,200);
  const {code}=z.object({code:z.string()}).parse(await approved.json());
  assert.equal((await post('/api/extension/exchange',{...binding,code},{origin:'chrome-extension://'+'b'.repeat(32)})).status,403);
  const preflight=await fetch(fixture.base+'/api/extension/exchange',{method:'OPTIONS',headers:{origin,'access-control-request-method':'POST','access-control-request-headers':'content-type'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);assert.equal(preflight.headers.get('access-control-allow-credentials'),null);
  const exchange=await post('/api/extension/exchange',{...binding,code},{origin});assert.equal(exchange.status,200);
  const device=z.object({id:z.string(),credential:z.string(),scope:z.literal('labels:suggest')}).parse(await exchange.json());
  assert.equal((await post('/api/extension/exchange',{...binding,code},{origin})).status,401);
  const list=await fetch(fixture.base+'/api/account/devices',{headers:{cookie}});assert.equal(list.status,200);const listed=await list.text();assert.ok(listed.includes(device.id));assert.ok(!listed.includes(device.credential));
  assert.equal((await post('/api/account/devices/revoke',{id:device.id},{cookie})).status,200);
  const after=await fetch(fixture.base+'/api/account/devices',{headers:{cookie}});assert.ok((await after.text()).includes('"revoked":1'));
  assert.equal((await post('/api/labels/suggest',{image:'not accepted'},{origin})).status,403);
 }finally{await fixture.close();}
});
