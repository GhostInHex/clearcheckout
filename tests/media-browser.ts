import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {nextFixture} from './next-fixture.js';
const wav=Buffer.alloc(46);wav.write('RIFF');wav.writeUInt32LE(38,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(2,40);
const fixture=await nextFixture(true),browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();await page.goto(fixture.base);
 await page.evaluate(async()=>{const client={post(p: string,b: unknown){return fetch('/api'+p,{method:p==='/preferences'?'PUT':'POST',headers:{'Content-Type':'application/json','X-ClearCheckout':'1'},body:JSON.stringify(b)});}};await client.post('/signup',{email:'media@test.com',password:'correctpassword123'});await client.post('/preferences',{preferences:{textSize:'standard',contrast:false,guidance:'brief'}});});await page.goto(fixture.base+'/dashboard');await page.getByRole('button',{name:'Open the demo store'}).click();

 await page.locator('input[type=file]').setInputFiles({name:'command.wav',mimeType:'audio/wav',buffer:wav});
 await page.getByRole('button',{name:'Send audio to Meta',exact:true}).click();await page.getByRole('button',{name:'Apply go to review'}).click();assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Review and confirm');await expect(page.getByText('Status: draft',{exact:true})).toBeVisible();
 await page.waitForTimeout(31000);await page.getByRole('button',{name:'Send audio to Meta',exact:true}).click();await expect(page.getByText('No supported command recognized. No action taken.')).toBeVisible();assert.equal(await page.getByRole('button',{name:/^Apply /}).count(),0);
 await page.waitForTimeout(31000);await page.getByRole('button',{name:'Load or generate illustration'}).click();await page.waitForTimeout(31000);await page.getByRole('button',{name:'Locate with SAM 3.1'}).click();await expect(page.getByRole('img',{name:'Magnified SAM region for mug. Illustrative generated art.',exact:true})).toBeVisible();assert.equal(await page.locator('.scene-box').count(),1);
 console.log('Mock media browser passed. Voice review only focuses heading; unsafe transcript does nothing; SAM geometry drives highlight and magnified view.');
}finally{await browser.close();await fixture.close();}
