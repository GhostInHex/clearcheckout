import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtempSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {z} from 'zod';
const dir=mkdtempSync(`${tmpdir()}/cc-p07-`),listener=createServer();await new Promise<void>(resolve=>listener.listen(0,'127.0.0.1',resolve));const address=listener.address();if(!address||typeof address==='string')throw Error('No port');await new Promise<void>(resolve=>listener.close(()=>resolve()));const base=`http://127.0.0.1:${address.port}`;
writeFileSync(`${dir}/preload.cjs`, `if(process.env.NODE_ENV!=="test"||process.env.DB_PATH!==${JSON.stringify(`${dir}/db.sqlite`)}||process.env.HOSTNAME!=="127.0.0.1")throw Error("Fixture refused");globalThis.clearcheckoutTestPayment={begin:async a=>({providerId:'MOCK1',url:${JSON.stringify(base)}+'/payment?attempt='+a.id+'&token=MOCK1'}),approve:async a=>({...a.snapshot,providerId:'MOCK1',status:'approved'}),capture:async a=>({...a.snapshot,providerId:'MOCK1',status:'paid'}),lookup:async a=>({...a.snapshot,providerId:'MOCK1',status:'paid'})};`);
const server=spawn(process.execPath,['--require',`${dir}/preload.cjs`,'--import','tsx','scripts/next-start.ts'],{env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'test',CLEARCHECKOUT_SKIP_ENV_FILE:'1',HOSTNAME:'127.0.0.1',PORT:String(address.port),DB_PATH:`${dir}/db.sqlite`,PUBLIC_ORIGIN:base},stdio:'inherit'});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();for(let i=0;i<300;i++){try{await page.goto(`${base}/payment`);break;}catch{if(server.exitCode!==null)throw Error('Server exited');await new Promise(resolve=>setTimeout(resolve,100));}}
 const headers={'x-clearcheckout':'1',origin:base};assert.equal((await page.request.post(`${base}/api/signup`,{headers,data:{email:'payment@example.test',password:'synthetic-password'}})).status(),201);
 const created=await page.request.post(`${base}/api/orders`,{headers,data:{}});assert.equal(created.status(),201);const order=z.object({id:z.string()}).parse(await created.json());
 await page.getByLabel('Order ID').fill(order.id);await page.getByRole('button',{name:'Review sandbox payment'}).click();await page.getByRole('region',{name:'Payment review'}).waitFor();
 const confirmation=page.getByLabel(/^Type CONFIRM/);const label=await confirmation.evaluate(element=>element.closest('label')?.textContent);assert.ok(label);await confirmation.fill(label.replace('Type ',''));await page.getByRole('button',{name:'Confirm exact amount'}).click();await page.getByRole('button',{name:'Prepare sandbox approval'}).click();
 const link=page.getByRole('link',{name:'Open PayPal sandbox approval'});await link.waitFor();assert.equal(new URL(await link.getAttribute('href')||'').origin,base);await link.click();await page.getByRole('region',{name:'Payment review'}).waitFor();await page.getByRole('button',{name:'Verify approval and capture'}).click();await page.getByText('State paid.').waitFor();
 mkdirSync('artifacts/program/P07/review',{recursive:true});await page.screenshot({path:'artifacts/program/P07/review/mocked-paid.png',fullPage:true});writeFileSync('artifacts/program/P07/mocked-browser.json',JSON.stringify({mocked:true,realSandbox:false,framework:'Next production',manualConfirmation:true,localApprovalFixture:true,serverCapture:true}));
}finally{await browser.close();server.kill('SIGTERM');await new Promise<void>(resolve=>server.once('exit',()=>resolve()));rmSync(dir,{recursive:true,force:true});}
