import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const dir=mkdtempSync(`${tmpdir()}/cc-p05-`);const listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.1',resolve));const address=listener.address();if(!address||typeof address==='string')throw Error('No port');await new Promise<void>(resolve=>listener.close(()=>resolve()));const base=`http://127.0.0.1:${address.port}`;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(address.port)],{env:{PATH:process.env.PATH,NODE_ENV:'production',HOME:process.env.HOME,DB_PATH:`${dir}/db.sqlite`,PUBLIC_ORIGIN:base},stdio:'ignore'});
const browser=await chromium.launch({headless:true});mkdirSync('artifacts/program/P05/review',{recursive:true});
try{
 const context=await browser.newContext();const page=await context.newPage();let ready=false;for(let i=0;i<100;i++){try{await page.goto(`${base}/account/recover`);ready=true;break;}catch{if(server.exitCode!==null)throw Error('Server exited');}}assert.ok(ready);
 await page.getByLabel('Email',{exact:true}).fill('synthetic@example.test');await page.getByLabel('Email',{exact:true}).press('Tab');await page.keyboard.press('Enter');await page.getByRole('status').filter({hasText:'Account email is unavailable'}).waitFor();
 const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);await page.screenshot({path:'artifacts/program/P05/review/mail-unavailable.png',fullPage:true});
 const signup=await page.request.post(`${base}/api/signup`,{headers:{'x-clearcheckout':'1',origin:base},data:{email:'synthetic@example.test',password:'synthetic-password'}});assert.equal(signup.status(),201);
 await page.goto(`${base}/account`);await page.getByLabel('Current password',{exact:true}).fill('synthetic-password');await page.getByLabel('New password',{exact:true}).fill('replacement-password');await page.getByRole('button',{name:'Change password and sign out everywhere'}).click();await page.getByRole('status').filter({hasText:'Password changed'}).waitFor();assert.equal((await page.request.get(`${base}/api/me`)).status(),401);
 await page.screenshot({path:'artifacts/program/P05/review/password-changed.png',fullPage:true});writeFileSync('artifacts/program/P05/browser.json',JSON.stringify({framework:'Next production',mailDisabled:true,keyboardRecovery:true,passwordChangeRevokes:true,axeViolations:axe.violations.length}));
}finally{await browser.close();server.kill('SIGTERM');await new Promise<void>(resolve=>server.once('exit',()=>resolve()));rmSync(dir,{recursive:true,force:true});}
