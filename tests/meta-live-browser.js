import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';

const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage();
  await page.goto(process.env.BROWSER_BASE_URL || 'http://localhost:3000');
  await page.getByRole('button', {name: 'Create your free account'}).click();
  await page.getByLabel('Email address').fill(`live-check-${Date.now()}@example.test`);
  await page.getByLabel('Password', {exact: true}).fill('local-test-password-1234');
  await page.getByRole('button', {name: 'Create account', exact: true}).click();
  await page.getByRole('button', {name: 'Save and enter my space'}).click();
  await page.getByRole('button', {name: 'Open the demo store'}).click();
  await page.getByLabel('I approve sending this order summary to Meta.').check();
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/ai/explain'));
  await page.getByRole('button', {name: 'Explain with Meta AI'}).click();
  const response = await responsePromise;
  const result = await response.json();
  assert.equal(response.status(), 200, result.error || 'Live Meta request failed');
  assert.equal(result.model, 'muse-spark-1.3-contributor');
  assert.equal(result.cached, false);
  assert.ok(result.text.length > 0);
  await expect(page.getByText('Meta AI guidance', {exact: true})).toBeVisible();
  await expect(page.getByText('Trusted app total: $42.00 USD', {exact: true})).toBeVisible();
  mkdirSync('artifacts', {recursive: true});
  await page.screenshot({path: 'artifacts/meta-live.png', fullPage: true});
  const report = {verifiedAt: new Date().toISOString(), model: result.model, status: response.status(), cached: result.cached, responseCharacters: result.text.length, payments: 'simulated'};
  writeFileSync('artifacts/meta-live-verification.json', JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report)}\n`);
} finally {
  await browser.close();
}
