chrome.action.onClicked.addListener(async tab=>{if(tab.id)try{await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});}catch{await chrome.action.setBadgeText({tabId:tab.id,text:'!'});}});

import {appOrigin,linkMessage,linkBindingSchema,credentialSchema,trustedSender} from './link.js';
const ready=Promise.all([
 chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}),
 chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'})
]);
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
let busy=false;
chrome.runtime.onMessage.addListener((input:unknown,sender,reply)=>{
 if(!trustedSender(sender))return false;
 const parsed=linkMessage.safeParse(input);if(!parsed.success)return false;
 if(busy){reply({error:'Another linking request is pending.'});return false;}
 const message=parsed.data;
 busy=true;
 async function run(){
  await ready;
  if(message.kind==='forget'){await chrome.storage.session.remove('device');await chrome.storage.local.remove('binding');return {message:'Local credential removed. Revoke the device in your account too.'};}
  const stored=await chrome.storage.local.get('binding');
  let binding=linkBindingSchema.safeParse(stored.binding);
  if(!binding.success){const value={extensionId:chrome.runtime.id,installationId:random(),nonce:random()};await chrome.storage.local.set({binding:value});binding=linkBindingSchema.safeParse(value);}
  if(!binding.success)throw Error('Installation identity unavailable.');
  if(message.kind==='binding')return {binding:binding.data};
  if(!await chrome.permissions.contains({origins:[appOrigin+'/*']}))throw Error('Grant the account origin permission first.');
  const response=await fetch(appOrigin+'/api/extension/exchange',{method:'POST',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json','x-clearcheckout':'1'},body:JSON.stringify({...binding.data,code:message.code}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Link rejected, expired or already used.');
  const device=credentialSchema.parse(await response.json());
  await chrome.storage.session.set({device});
  await chrome.storage.local.remove('binding');
  return {message:'Linked until '+new Date(device.expires).toISOString()+'. Scope: '+device.scope+'. Image suggestions unavailable pending privacy evaluation.'};
 }
 void run().then(reply,()=>reply({error:'Link unavailable. Check permission, account approval and code expiry.'})).finally(()=>{busy=false;});
 return true;
});

import {labelAdvice,labelFingerprint,fixturePngSha} from '../shared/label-suggestion.js';
import {z} from 'zod';
const previews=new Map<number,{nonce:string;png:string;fingerprint:string}>();
import {cropRequest,fixtureUrl,inspectFixture} from './crop.js';
let capturing=false;
chrome.runtime.onMessage.addListener((input:unknown,sender,reply)=>{
 const parsed=cropRequest.safeParse(input);
 if(!parsed.success||sender.id!==chrome.runtime.id||sender.frameId!==0||sender.url!==fixtureUrl||sender.tab?.url!==fixtureUrl||sender.tab.id===undefined)return false;
 if(capturing){reply({error:'Capture already pending.'});return false;}
 const nonce=parsed.data.nonce;
 const tabId=sender.tab.id;
 const windowId=sender.tab.windowId;
 capturing=true;
 async function run(){
  const tab=await chrome.tabs.get(tabId);
  if(!tab.active||tab.url!==fixtureUrl)throw Error('Tab changed.');
  const [before]=await chrome.scripting.executeScript({target:{tabId},func:inspectFixture});
  if(!before?.result)throw Error('Unsafe fixture.');
  const screenshot=await chrome.tabs.captureVisibleTab(windowId,{format:'png'});
  const active=await chrome.tabs.query({active:true,windowId});
  if(active.length!==1||active[0]?.id!==tabId||active[0].url!==fixtureUrl)throw Error('Tab changed.');
  const [after]=await chrome.scripting.executeScript({target:{tabId},func:inspectFixture});
  if(JSON.stringify(before.result)!==JSON.stringify(after?.result))throw Error('Fixture changed.');
  const blob=await (await fetch(screenshot)).blob();
  const bitmap=await createImageBitmap(blob);
  try{
   if(bitmap.width!==before.result.width||bitmap.height!==before.result.height)throw Error('Viewport changed.');
   const canvas=new OffscreenCanvas(64,64);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable.');
   ctx.drawImage(bitmap,32,32,64,64,0,0,64,64);
   const pngBlob=await canvas.convertToBlob({type:'image/png'});
   const bytes=new Uint8Array(await pngBlob.arrayBuffer());
   if(bytes.length!==502)throw Error('Unexpected fixture bytes.');
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
   if(digest!==fixturePngSha)throw Error('Fixture pixels changed.');
   const png='data:image/png;base64,'+btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join(''));
   previews.set(tabId,{nonce,png,fingerprint:before.result.fingerprint});
   return {kind:'local-preview',nonce,png,width:64,height:64};
  }finally{bitmap.close();}
 }
 void run().then(reply,()=>reply({error:'Local capture refused. Use the unchanged synthetic fixture at 100% scale.'})).finally(()=>{capturing=false;});
 return true;
});

const uploadMessage=z.object({kind:z.literal('suggest-fixture'),nonce:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
let uploading=false;
chrome.runtime.onMessage.addListener((input:unknown,sender,reply)=>{
 const parsed=uploadMessage.safeParse(input);
 if(!parsed.success||sender.id!==chrome.runtime.id||sender.frameId!==0||sender.url!==fixtureUrl||sender.tab?.url!==fixtureUrl||sender.tab.id===undefined)return false;
 const tabId=sender.tab.id;const preview=previews.get(tabId);previews.delete(tabId);
 if(!preview||preview.nonce!==parsed.data.nonce||uploading){reply({error:'Preview expired.'});return false;}
 const approvedPreview=preview;
 uploading=true;
 async function current(){const tab=await chrome.tabs.get(tabId);const [inspection]=await chrome.scripting.executeScript({target:{tabId},func:inspectFixture});if(!tab.active||tab.url!==fixtureUrl||inspection?.result?.fingerprint!==approvedPreview.fingerprint)throw Error('Fixture changed.');}
 async function run(){
  await ready;await current();
  const stored=await chrome.storage.session.get('device');const device=credentialSchema.parse(stored.device);
  const response=await fetch(appOrigin+'/api/extension/labels/suggest',{method:'POST',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer '+device.credential,'x-clearcheckout':'1'},body:JSON.stringify({origin:appOrigin,fingerprint:labelFingerprint,nonce:approvedPreview.nonce,width:64,height:64,bounds:{x:32,y:32,width:64,height:64},png:approvedPreview.png}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Suggestion refused.');
  const advice=labelAdvice.parse(await response.json());await current();return advice;
 }
 void run().then(reply,()=>reply({error:'Suggestion unavailable. Keep the label unknown.'})).finally(()=>{uploading=false;});return true;
});
chrome.tabs.onRemoved.addListener(id=>previews.delete(id));
chrome.tabs.onUpdated.addListener((id,change)=>{if(change.status==='loading'||change.url)previews.delete(id);});
