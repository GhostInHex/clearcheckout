import {inspectFixture} from '../extension/crop.js';
import {chromium,expect} from '@playwright/test';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,cpSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {z} from 'zod';
const folder=mkdtempSync(tmpdir()+'/cc-installed-link-');
const ext=folder+'/extension';cpSync(resolve('build/extension'),ext,{recursive:true});
const manifest=z.object({host_permissions:z.array(z.string()).optional()}).passthrough().parse(JSON.parse(readFileSync(ext+'/manifest.json','utf8')));manifest.host_permissions=['http://localhost:4319/*'];writeFileSync(ext+'/manifest.json',JSON.stringify(manifest));
const context=await chromium.launchPersistentContext(folder+'/browser',{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
let server:ReturnType<typeof spawn>|undefined;
try{
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
 const id=new URL(worker.url()).host;
 server=spawn(process.execPath,['--import','tsx','scripts/next-start.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',CLEARCHECKOUT_SKIP_ENV_FILE:'1',PORT:'4319',HOSTNAME:'127.0.0.1',DB_PATH:folder+'/db.sqlite',COOKIE_SECURE:'false',CC_APPROVED_EXTENSION_ID:id},stdio:'ignore'});
 const base='http://localhost:4319';
 for(let n=0;n<300;n++){try{if((await fetch(base+'/readyz')).ok)break;}catch{}if(n===299)throw Error('Next readiness timeout');await new Promise(resolve=>setTimeout(resolve,100));}
 const page=await context.newPage();await page.goto(base+'/fixtures/label-crop.html');
 assert.notEqual(await page.evaluate(inspectFixture),null);
 await page.evaluate(()=>{const input=document.createElement('input');input.value='synthetic private value';document.body.append(input);});
 assert.equal(await page.evaluate(inspectFixture),null);
 await page.evaluate(()=>document.querySelector('input')?.remove());
 await page.evaluate(()=>{const overlay=document.createElement('div');overlay.id='overlap';overlay.style.cssText='position:absolute;left:30px;top:30px;width:70px;height:70px';document.body.append(overlay);});
 assert.equal(await page.evaluate(inspectFixture),null);
 await page.evaluate(()=>document.getElementById('overlap')?.remove());
 assert.notEqual(await page.evaluate(inspectFixture),null);

 await worker.evaluate(async()=>{const tabs=await chrome.tabs.query({active:true});const tab=tabs[0];if(tab?.id===undefined)throw Error('Missing active fixture');await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});});
 let uploads=0;page.on('request',request=>{if(request.method()==='POST')uploads++;});
 await page.getByRole('button',{name:'Preview synthetic crop locally'}).click();
 await expect(page.getByRole('status')).toHaveText(/Local preview ready|Local capture refused/);
 const result=await page.getByRole('status').textContent();
 const captureProbe=await worker.evaluate(async()=>{try{const tabs=await chrome.tabs.query({active:true});const tab=tabs[0];if(!tab)throw Error('Missing tab');const data=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});return {ok:data.startsWith('data:image/png')};}catch(error){return {ok:false,error:error instanceof Error?error.message:String(error)};}});

 assert.equal(uploads,0);
 mkdirSync('artifacts/program/P09/crop-recovery',{recursive:true});
 await page.screenshot({path:'artifacts/program/P09/crop-recovery/probe.png'});
 writeFileSync('artifacts/program/P09/crop-recovery/probe.json',JSON.stringify({installed:true,actualNext:true,result,captureProbe,uploads,permission:'fixed localhost host only; no automated toolbar gesture',providerCalls:0},null,2));
 await page.getByRole('button',{name:'Close assistance'}).click();assert.equal(await page.locator('#clearcheckout-host').count(),0);

}finally{await context.close();if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}rmSync(folder,{recursive:true,force:true});}
