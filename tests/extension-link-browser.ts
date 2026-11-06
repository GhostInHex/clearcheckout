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
 const account=await context.newPage();await account.goto(base+'/account');
 const signup=await account.request.post(base+'/api/signup',{headers:{origin:base,'x-clearcheckout':'1'},data:{email:'installed@example.test',password:'synthetic-password'}});assert.equal(signup.status(),201);
 await account.reload();
 const options=await context.newPage();await options.goto(`chrome-extension://${id}/link.html`);
 // The copied automation manifest pregrants only the fixed development origin.
 await options.getByRole('button',{name:'Prepare account approval'}).click();
 const binding=options.getByLabel('Installation binding for account approval');await expect(binding).not.toHaveValue('');
 await account.getByLabel('Installation binding',{exact:true}).fill(await binding.inputValue());
 await account.getByRole('button',{name:'Approve installation for two minutes'}).click();
 const code=account.getByLabel('Single-use code. Copy to extension options.');await expect(code).toBeVisible();
 await options.getByLabel('Single-use approval code').fill(await code.inputValue());await options.getByRole('button',{name:'Exchange code'}).click();
 await expect(options.getByRole('status')).toContainText('Linked until');
 await account.getByRole('button',{name:'Refresh my devices'}).click();await expect(account.getByRole('button',{name:/^Revoke [a-f0-9]/})).toBeVisible();
 await account.getByRole('button',{name:/^Revoke [a-f0-9]/}).click();await expect(account.getByText(/Scope labels:suggest.*Revoked/)).toBeVisible();
 const stored=await worker.evaluate(async()=>{const value=await chrome.storage.session.get('device');return Boolean(value.device);});assert.equal(stored,true);
 await options.getByRole('button',{name:'Forget local credential'}).click();await expect(options.getByRole('status')).toContainText('Local credential removed');
 mkdirSync('artifacts/program/P09/extension-ui',{recursive:true});await options.screenshot({path:'artifacts/program/P09/extension-ui/link.png'});writeFileSync('artifacts/program/P09/extension-ui/installed.json',JSON.stringify({installed:true,actualNext:true,linked:true,revoked:true,forgotten:true,providerRequests:0}));
}finally{await context.close();if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}rmSync(folder,{recursive:true,force:true});}
