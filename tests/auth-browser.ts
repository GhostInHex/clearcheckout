import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {readFileSync,existsSync,mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {z} from 'zod';
import Database from 'better-sqlite3';
const dir=mkdtempSync(`${tmpdir()}/cc-p05-`);const listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.1',resolve));const address=listener.address();if(!address||typeof address==='string')throw Error('No port');await new Promise<void>(resolve=>listener.close(()=>resolve()));const base=`http://127.0.0.1:${address.port}`;
writeFileSync(`${dir}/mail-preload.cjs`, `if(process.env.NODE_ENV!=="test")throw Error("Test fixture requires test mode");globalThis.clearcheckoutTestMail={available:true,async send(message){require("node:fs").appendFileSync(${JSON.stringify(`${dir}/inbox.jsonl`)},JSON.stringify(message)+"\\n");}};`);
const server=spawn(process.execPath,['--require',`${dir}/mail-preload.cjs`,'--import','tsx','scripts/next-start.ts'],{env:{PATH:process.env.PATH,NODE_ENV:'test',HOSTNAME:'127.0.0.1',PORT:String(address.port),HOME:process.env.HOME,DB_PATH:`${dir}/db.sqlite`,PUBLIC_ORIGIN:base},stdio:'ignore'});
const browser=await chromium.launch({headless:true});mkdirSync('artifacts/program/P05/review',{recursive:true});mkdirSync('artifacts/program/P05/recovery-continuation',{recursive:true});
try{
 const context=await browser.newContext();const page=await context.newPage();let ready=false;for(let i=0;i<100;i++){try{await page.goto(`${base}/account/recover`);ready=true;break;}catch{if(server.exitCode!==null)throw Error('Server exited');}}assert.ok(ready);
 const signup=await page.request.post(`${base}/api/signup`,{headers:{'x-clearcheckout':'1',origin:base},data:{email:'synthetic@example.test',password:'synthetic-password'}});assert.equal(signup.status(),201);
 const headers={'x-clearcheckout':'1',origin:base};
 await page.goto(`${base}/account/recover`);
 await page.getByLabel('Email',{exact:true}).fill('synthetic@example.test');await page.getByLabel('Email',{exact:true}).press('Tab');await page.keyboard.press('Enter');await page.getByRole('status').filter({hasText:'If eligible'}).waitFor();
 const inbox=async(count=1)=>{for(let i=0;i<100;i++){if(existsSync(`${dir}/inbox.jsonl`)&&readFileSync(`${dir}/inbox.jsonl`,'utf8').trim().split('\n').length>=count)return readFileSync(`${dir}/inbox.jsonl`,'utf8').trim().split('\n').map(line=>z.object({url:z.string()}).parse(JSON.parse(line)));await new Promise(resolve=>setTimeout(resolve,20));}throw Error('No fixture mail');};
 const messages=await inbox();const resetUrl=messages[0]?.url;if(typeof resetUrl!=='string')throw Error('Missing reset URL');
 await page.goto(resetUrl);await page.getByLabel('New password',{exact:true}).fill('reset-password');await page.getByLabel('New password',{exact:true}).press('Tab');await page.keyboard.press('Enter');await page.getByRole('status').filter({hasText:'Password reset.'}).waitFor();assert.equal(new URL(page.url()).hash,'');
 assert.equal((await page.request.get(`${base}/api/me`)).status(),401);
 await page.goto(resetUrl);await page.getByLabel('New password',{exact:true}).fill('another-password');await page.getByRole('button',{name:'Reset password',exact:true}).click();await page.getByRole('status').filter({hasText:'invalid or expired'}).waitFor();
 const audits=[];for(const route of ['recover','reset','verify','']){await page.goto(`${base}/account/${route}`);const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);audits.push({route,violations:axe.violations.length});}
 assert.equal((await page.request.post(`${base}/api/login`,{headers,data:{email:'synthetic@example.test',password:'reset-password'}})).status(),200);
 assert.equal((await page.request.post(`${base}/api/account/verification-request`,{headers,data:{}})).status(),429);
 const fixture=new Database(`${dir}/db.sqlite`);
 try{
 fixture.prepare('DELETE FROM account_mail_limits').run();
 assert.equal((await page.request.post(`${base}/api/account/verification-request`,{headers,data:{}})).status(),200);
 const verification=(await inbox(2))[1];assert.ok(verification);
 await page.goto(verification.url);await page.getByRole('button',{name:'Verify email',exact:true}).press('Enter');await page.getByRole('status').filter({hasText:'Email verified.'}).waitFor();
 assert.equal((await page.request.post(`${base}/api/account/verification-request`,{headers,data:{}})).status(),429);
 fixture.prepare('DELETE FROM account_mail_limits').run();
 assert.equal((await page.request.post(`${base}/api/account/reset-request`,{headers,data:{email:'synthetic@example.test'}})).status(),200);
 const expired=(await inbox(3))[2];assert.ok(expired);fixture.prepare("UPDATE account_tokens SET expires=0 WHERE purpose='reset'").run();
 await page.goto(expired.url);await page.getByLabel('New password',{exact:true}).fill('expired-password');await page.getByRole('button',{name:'Reset password',exact:true}).press('Enter');await page.getByRole('status').filter({hasText:'invalid or expired'}).waitFor();
 }finally{fixture.close();}
 assert.equal((await page.request.post(`${base}/api/account/password`,{data:{currentPassword:'reset-password',password:'replacement-password'}})).status(),403);
 const exported=await page.request.get(`${base}/api/account/export`);assert.equal(exported.status(),200);assert.equal((await exported.text()).includes('password'),false);
 await page.goto(`${base}/account`);await page.getByLabel('Current password',{exact:true}).fill('reset-password');await page.getByLabel('New password',{exact:true}).fill('replacement-password');await page.getByRole('button',{name:'Change password and sign out everywhere'}).click();await page.getByRole('status').filter({hasText:'Password changed'}).waitFor();assert.equal((await page.request.get(`${base}/api/me`)).status(),401);
 await page.screenshot({path:'artifacts/program/P05/review/password-changed.png',fullPage:true});
 assert.equal((await page.request.post(`${base}/api/login`,{headers,data:{email:'synthetic@example.test',password:'replacement-password'}})).status(),200);
 await page.goto(`${base}/account`);await page.getByLabel('Confirm current password').fill('replacement-password');await page.getByLabel('Type DELETE MY ACCOUNT').fill('DELETE MY ACCOUNT');await page.getByRole('button',{name:'Permanently delete account'}).click();await page.getByRole('status').filter({hasText:'Account deleted'}).waitFor();assert.equal((await page.request.get(`${base}/api/me`)).status(),401);
 writeFileSync('artifacts/program/P05/recovery-continuation/browser.json',JSON.stringify({framework:'Next production build with isolated test-only preload',keyboardRecovery:true,resetReuseRejected:true,passwordChangeRevokes:true,deletion:true,audits}));
}finally{await browser.close();server.kill('SIGTERM');await new Promise<void>(resolve=>server.once('exit',()=>resolve()));rmSync(dir,{recursive:true,force:true});}
