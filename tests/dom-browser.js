import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const domBuild = await build({entryPoints:['shared/dom.ts'],bundle:true,format:'esm',write:false});

const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage();
  await page.setContent(`<button id="action" data-checkout-label="Place order"></button>
    <select id="shipping"><option>Standard</option><option>Express</option></select>
    <label for="empty"></label><input id="empty">
    <label for="named">Email</label><input id="named">
    <button id="merchant" aria-label="Merchant label"></button>`);
  await page.evaluate(async source => {
    window.dom = await import(`data:text/javascript;base64,${btoa(source)}`);
  }, domBuild.outputFiles[0].text);
  assert.deepEqual(await page.evaluate(() => window.dom.scan(document).map(item => item.element.id)), ['action', 'shipping', 'empty']);
  await page.evaluate(() => {
    window.dom.repair(document);
    window.stopRepairs = window.dom.observeRepairs(document);
  });
  await expect(page.locator('#action')).toHaveAccessibleName('Place order');
  await page.locator('#action').evaluate(element => {element.textContent = 'Cancel order';});
  await expect(page.locator('#action')).toHaveAccessibleName('Cancel order');
  await expect(page.locator('#action')).not.toHaveAttribute('aria-label');
  await page.locator('#action').evaluate(element => {element.textContent = ''; element.dataset.checkoutLabel = 'Read total';});
  await expect(page.locator('#action')).toHaveAccessibleName('Read total');
  await page.locator('#action').evaluate(element => element.removeAttribute('aria-label'));
  await expect(page.locator('#action')).toHaveAccessibleName('Read total');
  await page.locator('#action').evaluate(element => {element.dataset.checkoutLabel = 'Review delivery';});
  await expect(page.locator('#action')).toHaveAccessibleName('Review delivery');
  await page.locator('#action').evaluate(element => {element.setAttribute('aria-label', 'Merchant override');});
  await expect(page.locator('#action')).toHaveAccessibleName('Merchant override');
  await page.evaluate(() => {
    const replacement = document.createElement('button');
    replacement.id = 'replacement';
    replacement.dataset.checkoutLabel = 'New action';
    document.getElementById('action').replaceWith(replacement);
  });
  await expect(page.locator('#replacement')).toHaveAccessibleName('New action');
  await expect(page.locator('#merchant')).toHaveAccessibleName('Merchant label');
  const mutationCount = await page.evaluate(async () => {
    let count = 0;
    const observer = new MutationObserver(records => {count += records.length;});
    observer.observe(document, {attributes: true, subtree: true});
    await new Promise(resolve => setTimeout(resolve, 100));
    observer.disconnect();
    window.stopRepairs();
    return count;
  });
  assert.equal(mutationCount, 0, 'Repairs must become idle instead of triggering themselves');
  process.stdout.write('DOM browser regressions passed: unnamed forms, changed actions, attributes, merchant overrides, replacements, and idle observation.\n');
} finally {
  await browser.close();
}
