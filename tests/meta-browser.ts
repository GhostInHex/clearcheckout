import {readFileSync} from 'node:fs';
import {z} from 'zod';
declare global { interface Window { aiUnsafe?: unknown; } }
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {nextFixture} from './next-fixture.js';
const browser=await chromium.launch({headless:true});
try {
 for(const configured of [false,true]) {
  const fixture=await nextFixture(configured);const context=await browser.newContext();const page=await context.newPage();const base=fixture.base;
  try {
   await page.goto(base);
   const setup=await page.evaluate(async()=>{const client={request(path: string,body: unknown){return fetch('/api'+path,{method:path==='/preferences'?'PUT':'POST',headers:{'content-type':'application/json','x-clearcheckout':'1'},body:JSON.stringify(body)});}};const signup=await client.request('/signup',{email:'browser@test.com',password:'correctpassword'});const preferences=await client.request('/preferences',{preferences:{textSize:'standard',contrast:false,guidance:'brief'}});return {signup:signup.status,preferences:preferences.status};});assert.deepEqual(setup,{signup:201,preferences:200});
   await page.goto(base+'/dashboard');await page.getByRole('button',{name:'Open the demo store'}).click();
   if(!configured) {await page.getByText('Meta AI is not configured. Local checkout guidance is still available.').waitFor();}
   else {
    const button=page.getByRole('button',{name:'Explain with Meta AI'});await button.waitFor();assert.equal(await button.isDisabled(),true);
    await page.getByLabel('I approve sending this order summary to Meta.').check();
    const requestPromise=page.waitForRequest(r=>r.url().endsWith('/api/ai/explain'));
    await button.click();const sent=z.object({orderId:z.string()}).strict().parse((await requestPromise).postDataJSON());assert.deepEqual(Object.keys(sent),['orderId']);
    await page.getByText('<script>window.aiUnsafe=true</script> Review your tea and mug. No money moves.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.aiUnsafe),undefined);assert.equal(readFileSync(fixture.dir+'/db.sqlite.provider','utf8').trim().split('\n').length,1);
    await button.click();await page.getByText('Meta AI guidance (saved explanation)',{exact:true}).waitFor();assert.equal(readFileSync(fixture.dir+'/db.sqlite.provider','utf8').trim().split('\n').length,1);
    await page.getByLabel('Quantity of Stoneware morning mug').selectOption('2');await page.getByText('Trusted app total: $60.00 USD',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Explain with Meta AI'}).isDisabled(),true);assert.equal(await page.getByText('Meta AI guidance (saved explanation)',{exact:true}).count(),0);
   }
   console.log(`Meta browser ${configured?'mocked provider consent, plain text, cache, invalidation':'unconfigured'} passed`);
  } finally {await context.close();await fixture.close();}
 }
} finally {await browser.close();}
