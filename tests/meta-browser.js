import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.js';
const browser=await chromium.launch({headless:true});
try {
 for(const configured of [false,true]) {
  let calls=0;
  const {app,db}=createApp({dbPath:':memory:',aiOptions:{config:{key:configured?'local-test-key':'',budgetMicros:5000000,callLimit:100},transport:async()=>{calls++;return new Response(JSON.stringify({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'<script>window.aiUnsafe=true</script> Review your tea and mug. No money moves.'}]}],usage:{input_tokens:400,output_tokens:100}}));}}});
  const server=app.listen(0);const context=await browser.newContext();const page=await context.newPage();const base=`http://localhost:${server.address().port}`;
  try {
   await page.goto(base);
   await page.evaluate(async()=>{const request=(path,body)=>fetch('/api'+path,{method:path==='/preferences'?'PUT':'POST',headers:{'content-type':'application/json','x-clearcheckout':'1'},body:JSON.stringify(body)});await request('/signup',{email:'browser@test.com',password:'correctpassword'});await request('/preferences',{preferences:{textSize:'standard',contrast:false,guidance:'brief'}});});
   await page.reload();await page.getByRole('button',{name:'Open the demo store'}).click();
   if(!configured) {await page.getByText('Meta AI is not configured. Local checkout guidance is still available.').waitFor();assert.equal(calls,0);}
   else {
    const button=page.getByRole('button',{name:'Explain with Meta AI'});await button.waitFor();assert.equal(await button.isDisabled(),true);
    await page.getByLabel('I approve sending this order summary to Meta.').check();
    const requestPromise=page.waitForRequest(r=>r.url().endsWith('/api/ai/explain'));
    await button.click();const sent=(await requestPromise).postDataJSON();assert.deepEqual(Object.keys(sent),['orderId']);
    await page.getByText('<script>window.aiUnsafe=true</script> Review your tea and mug. No money moves.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.aiUnsafe),undefined);assert.equal(calls,1);
    await button.click();await page.getByText('Meta AI guidance (saved explanation)',{exact:true}).waitFor();assert.equal(calls,1);
    await page.getByLabel('Quantity of Stoneware morning mug').selectOption('2');await page.getByText('Trusted app total: $60.00 USD',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Explain with Meta AI'}).isDisabled(),true);assert.equal(await page.getByText('Meta AI guidance (saved explanation)',{exact:true}).count(),0);
   }
   console.log(`Meta browser ${configured?'mocked provider consent, plain text, cache, invalidation':'unconfigured'} passed`);
  } finally {await context.close();await new Promise(r=>server.close(r));db.close();}
 }
} finally {await browser.close();}
