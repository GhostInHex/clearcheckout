import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.js';
const {app,db}=createApp({dbPath:':memory:',aiOptions:{config:{key:'',budgetMicros:5000000,callLimit:100}}});
const server=app.listen(0),browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();await page.goto(`http://localhost:${server.address().port}`);
 await page.evaluate(async()=>{const post=(p,b)=>fetch('/api'+p,{method:p==='/preferences'?'PUT':'POST',headers:{'Content-Type':'application/json','X-ClearCheckout':'1'},body:JSON.stringify(b)});await post('/signup',{email:'media@test.com',password:'correctpassword123'});await post('/preferences',{preferences:{textSize:'standard',contrast:false,guidance:'brief'}});});await page.reload();await page.getByRole('button',{name:'Open the demo store'}).click();
 let transcript='Go to review.';await page.route('**/api/media/transcribe',route=>route.fulfill({json:{transcript}}));
 await page.locator('input[type=file]').setInputFiles({name:'command.wav',mimeType:'audio/wav',buffer:Buffer.alloc(44)});
 await page.getByRole('button',{name:'Send audio to Meta',exact:true}).click();await page.getByRole('button',{name:'Apply go to review'}).click();assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Review and confirm');await expect(page.getByText('Status: draft',{exact:true})).toBeVisible();
 transcript='Confirm payment.';await page.getByRole('button',{name:'Send audio to Meta',exact:true}).click();await expect(page.getByText('No supported command recognized. No action taken.')).toBeVisible();assert.equal(await page.getByRole('button',{name:/^Apply /}).count(),0);
 await page.route('**/api/media/scene',route=>route.request().method()==='POST'?route.fulfill({json:{ready:true,cached:true}}):route.fulfill({status:404}));await page.route('**/api/media/locate',route=>route.fulfill({json:{boxes:[{id:'1',x1:10,y1:10,x2:50,y2:80,w:100,h:100}]}}));
 await page.getByRole('button',{name:'Load or generate illustration'}).click();await page.getByRole('button',{name:'Locate with SAM 3.1'}).click();await expect(page.getByRole('img',{name:'Magnified SAM region for mug. Illustrative generated art.',exact:true})).toBeVisible();assert.equal(await page.locator('.scene-box').count(),1);
 console.log('Mock media browser passed. Voice review only focuses heading; unsafe transcript does nothing; SAM geometry drives highlight and magnified view.');
}finally{await browser.close();server.close();db.close();}
