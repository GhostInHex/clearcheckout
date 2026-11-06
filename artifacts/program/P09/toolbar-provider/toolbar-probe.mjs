import {chromium} from '@playwright/test';
import {mkdtempSync,cpSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
const folder=mkdtempSync(tmpdir()+'/cc-toolbar-');
const ext=folder+'/extension';cpSync(resolve('build/extension'),ext,{recursive:true});
const context=await chromium.launchPersistentContext(folder+'/profile',{channel:'chromium',headless:false,viewport:null,env:{...process.env,DISPLAY:':1'},args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
const server=spawn(process.execPath,['--import','tsx','scripts/next-start.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',CLEARCHECKOUT_SKIP_ENV_FILE:'1',PORT:'4319',HOSTNAME:'127.0.0.1',DB_PATH:folder+'/db.sqlite',COOKIE_SECURE:'false'},stdio:'ignore'});
for(let n=0;n<300;n++){try{if((await fetch('http://localhost:4319/readyz')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
const page=await context.newPage();await page.goto('http://localhost:4319/fixtures/label-crop.html');await page.bringToFront();
writeFileSync('artifacts/program/P09/toolbar-provider/runtime.json',JSON.stringify({folder,id:new URL(worker.url()).host}));
execFileSync('scrot',['artifacts/program/P09/toolbar-provider/chrome-before.png'],{env:{...process.env,DISPLAY:':1'}});
console.log('READY');
await new Promise(r=>setTimeout(r,45000));
console.log('panel',await page.locator('#clearcheckout-host').count());
if(await page.locator('#clearcheckout-host').count()){
 await page.getByRole('button',{name:'Preview synthetic crop locally'}).click();
 await page.waitForTimeout(1500);
 const status=await page.getByRole('status').textContent();console.log(status);
 const png=await page.locator('#clearcheckout-host').locator('img').getAttribute('src');
 if(png){writeFileSync('artifacts/program/P09/toolbar-provider/crop.png',Buffer.from(png.split(',')[1],'base64'));}
 writeFileSync('artifacts/program/P09/toolbar-provider/result.json',JSON.stringify({status,pngBytes:png?Buffer.from(png.split(',')[1],'base64').length:0,permissions:await worker.evaluate(()=>chrome.permissions.getAll())},null,2));
 await page.screenshot({path:'artifacts/program/P09/toolbar-provider/preview.png'});
}
await context.close();server.kill();
