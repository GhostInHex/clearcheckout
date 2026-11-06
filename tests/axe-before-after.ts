import {chromium,expect,type Page,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {nextFixture} from './next-fixture.js';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const output=`artifacts/program/P08/${sha}-${Date.now()}`;
mkdirSync(output,{recursive:true});
const fixture=await nextFixture(false,{CLEARCHECKOUT_SKIP_ENV_FILE:'1'});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({recordVideo:{dir:output},viewport:{width:1280,height:900}});
const page=await context.newPage();
const rules=['button-name','label','select-name'];
async function audit(page:Page){
 const result=await new AxeBuilder({page}).withRules(rules).analyze();
 return result.violations.map(rule=>({id:rule.id,nodes:rule.nodes.map(node=>({target:node.target,html:node.html,failureSummary:node.failureSummary})),count:rule.nodes.length}));
}
async function tabTo(target:Locator){
 for(let index=0;index<100;index++){
  if(await target.evaluate(element=>element===document.activeElement))return;
  await page.keyboard.press('Tab');
 }
 throw Error('Keyboard could not reach target');
}
async function keyboard(name:string){
 for(let index=0;index<100;index++){
  const target=page.getByRole('button',{name,exact:true});
  if(await target.evaluate(element=>element===document.activeElement)){await page.keyboard.press('Enter');return;}
  await page.keyboard.press('Tab');
 }
 throw Error(`Keyboard could not reach ${name}`);
}
const records=[];
try{
 await page.goto(fixture.base);
 await page.getByRole('button',{name:'Create your free account'}).waitFor();
 await keyboard('Create your free account');
 await tabTo(page.getByLabel('Email address'));await page.keyboard.type('p08@test.example');
 await page.keyboard.press('Tab');await page.keyboard.type('correctpassword123');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Save and enter my space'}).waitFor();await keyboard('Save and enter my space');
 await page.getByRole('button',{name:'Open the demo store'}).waitFor();await keyboard('Open the demo store');
 await page.locator('[data-checkout-label="Read cart summary"]').waitFor();
 for(const store of ['A','B']){
  if(store==='B'){await page.goto(fixture.base+'/demo/store-b');await page.getByRole('heading',{name:'Store B · Trail supplies'}).waitFor();}
  const before=await audit(page);
  const countBefore=await page.locator('button,input,select,textarea').count();
  await page.screenshot({path:`${output}/store-${store}-before.png`,fullPage:true});
  await keyboard('Repair reliable labels');
  await expect(page.locator('[data-checkout-label]').first()).toHaveAttribute('aria-label',store==='A'?'Read cart summary':'Delivery instructions');
  const after=await audit(page);
  assert.equal(await page.locator('button,input,select,textarea').count(),countBefore,'Repair preserves controls');
  assert(before.some(rule=>rule.id==='button-name'&&rule.count>0));
  assert.deepEqual(after,[]);
  await page.screenshot({path:`${output}/store-${store}-after.png`,fullPage:true});
  records.push({store,rules,before,after,countBefore});
  if(store==='A'){await keyboard('Read cart summary');await page.keyboard.press('Alt+Shift+c');await expect(page.locator('[data-checkout-cart]')).toBeFocused();}
  else {
   await keyboard('Show promo (keyboard alternative)');await expect(page.getByText('Promo TRAIL saves on a future demo order.')).toBeVisible();
   await tabTo(page.getByLabel('Quantity (keyboard alternative)'));await page.keyboard.press('ArrowUp');await expect(page.getByText('Total $24',{exact:true})).toBeVisible();
  }
 }
 writeFileSync(`${output}/receipt.json`,JSON.stringify({sha,dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),records,keyboard:'passed',limitations:['Selected name rules only','axe does not establish screen reader usability','No manual toolbar or real AT verification']},null,2));
 console.log(output);
}finally{await context.close();await browser.close();await fixture.close();}
