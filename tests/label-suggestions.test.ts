import {z} from 'zod';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createService} from '../server/service.js';
import {labelModel,labelFingerprint} from '../shared/label-suggestion.js';
import type {Transport} from '../server/contracts.js';
const extensionId='a'.repeat(32),origin=`chrome-extension://${extensionId}`;
const png='data:image/png;base64,'+readFileSync('artifacts/program/P09/toolbar-provider/crop.png').toString('base64');
const upload={origin:'http://localhost:4319',fingerprint:labelFingerprint,nonce:'b'.repeat(64),width:64,height:64,bounds:{x:32,y:32,width:64,height:64},png};
const output=(text='Shopping cart')=>Response.json({status:'completed',usage:{input_tokens:1000,output_tokens:20},output:[{type:'message',role:'assistant',content:[{type:'output_text',text}]}]});
async function setup(transport:Transport,budgetMicros=50000){
 const service=createService({dbPath:':memory:',approvedExtensionId:extensionId,aiOptions:{config:{key:'synthetic-not-a-key',budgetMicros,callLimit:1},transport,timeoutMs:20}});
 const user=await service.signup({email:'labels@example.test',password:'synthetic-password'});
 const binding={extensionId,installationId:'c'.repeat(64),nonce:'d'.repeat(64)};
 const approval=service.devices.approve(user.id,binding);const device=service.devices.exchange({...binding,code:approval.code},origin);
 return {service,user,device,suggest:(input:unknown=upload,credential=device.credential,requestOrigin:string|null=origin)=>service.labels.suggest(credential,requestOrigin,input)};
}
test('fixture-only provider payload, reservation before transport, cache scoped auth and revoke',async()=>{
 let calls=0;
 const fixture=await setup(async(url,options)=>{calls++;assert.equal(url,'https://api.meta.ai/v1/responses');assert.equal(z.object({reserved:z.number()}).parse(fixture.service.db.prepare('SELECT reserved FROM ai_calls').get()).reserved,50000);const body=JSON.parse(String(options.body));assert.equal(body.model,labelModel);assert.equal(body.input[0].content[1].image_url,png);assert.ok(!String(options.body).includes('credential'));return output();});
 try{
  for(const invalid of [{...upload,width:65},{...upload,png:png+'a'},{...upload,origin:'https://merchant.test'},{...upload,fields:'secret'}])await assert.rejects(fixture.suggest(invalid));
  await assert.rejects(fixture.suggest(upload,'e'.repeat(64)));await assert.rejects(fixture.suggest(upload,fixture.device.credential,'https://merchant.test'));assert.equal(calls,0);
  assert.equal((await fixture.suggest()).text,'Shopping cart');assert.equal((await fixture.suggest()).cached,true);assert.equal(calls,1);
  fixture.service.devices.revoke(fixture.user.id,{id:fixture.device.id});await assert.rejects(fixture.suggest());assert.equal(calls,1);
 }finally{fixture.service.db.close();}
});
for(const mode of ['failure','malformed','injection','timeout','cap'])test('label provider '+mode+' fails closed without retry or refund',async()=>{
 let calls=0;
 const fixture=await setup(async(_url,options)=>{calls++;if(mode==='failure')return new Response('',{status:503});if(mode==='malformed')return Response.json({});if(mode==='injection')return output('<script>pay()</script>');if(mode==='timeout')return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout')),{once:true}));return output();},mode==='cap'?0:50000);
 try{await assert.rejects(fixture.suggest());assert.equal(calls,mode==='cap'?0:1);await assert.rejects(fixture.suggest());assert.equal(calls,mode==='cap'?0:1);if(mode!=='cap')assert.equal(z.object({reserved:z.number()}).parse(fixture.service.db.prepare('SELECT reserved,status FROM ai_calls').get()).reserved,50000);}finally{fixture.service.db.close();}
});
