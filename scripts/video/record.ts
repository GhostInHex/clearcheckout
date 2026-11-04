import {z} from 'zod';
import type {Locator} from '@playwright/test';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'artifacts/submission';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, recordVideo: { dir: out, size: { width: 1280, height: 900 } } });
const page = await context.newPage();
const origin = process.env.DEMO_URL || 'https://3000-agqyztfyd4yxdgroczmx5ozzdu.instabox.tech';
const started = Date.now();
const chapters: {name: string; narration: string; start: number; end: number}[] = [];
const pause = (ms: number) => page.waitForTimeout(ms);
async function chapter(name: string, narration: string, action: () => Promise<void>) {
  const start = (Date.now() - started) / 1000;
  await action();
  await pause(1800);
  await page.screenshot({ path: `${out}/${name}.png` });
  chapters.push({ name, narration, start, end: (Date.now() - started) / 1000 });
  writeFileSync(`${out}/chapters.json`, JSON.stringify(chapters, null, 2));
  console.log(name);
}
async function show(locator: Locator) { await locator.scrollIntoViewIfNeeded(); await pause(400); }
try {
  await page.goto(origin);
  await chapter('01-purpose', 'ClearCheckout helps people navigate a checkout at their own pace. This is the real public app. Local label repair and optional Meta assistance keep the shopper in control. All payments in this demo are simulated.', async () => {});
  await chapter('02-signup', 'A synthetic demo account starts with personal reading preferences. No payment details are requested. Here we choose large text, then save our preferences to our own space.', async () => {
    await page.getByRole('button', { name: 'Create your free account' }).click();
    await page.getByLabel('Email address').fill(`video-${Date.now()}@example.test`);
    await page.getByLabel('Password', { exact: true }).fill('Synthetic-demo-only-2026');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByRole('radio', { name: /^Large Aa/ }).check();
  });
  await chapter('03-dashboard', 'The dashboard brings the demo store and saved preferences together. This prototype demonstrates a focused shopping journey. It does not claim support for every store, or completed testing with screen reader users.', async () => {
    await page.getByRole('button', { name: 'Save and enter my space' }).click();
    await page.getByRole('button', { name: 'Open the demo store' }).waitFor();
  });
  await chapter('04-repair', 'The clarity panel scans demo controls and repairs reliable labels locally. The previously unnamed cart button now has a useful name. Unknown controls still need human judgment. Field values are not uploaded by this scan.', async () => {
    await page.getByRole('button', { name: 'Open the demo store' }).click();
    await page.getByRole('button', { name: 'Scan demo controls' }).click();
    await pause(1000);
    await page.getByRole('button', { name: 'Repair reliable labels' }).click();
    await page.getByRole('button', { name: 'Read cart summary', exact: true }).click();
    await show(page.locator('.panel-status'));
  });
  await chapter('05-spark-approval', 'Muse Spark explains an approved order summary. The screen discloses that Contributor prompts and responses may be used for training. I explicitly approve this request. The trusted app total remains the source to verify.', async () => {
    await show(page.locator('.meta-guidance'));
    await page.getByLabel('I approve sending this order summary to Meta.').check();
  });
  const sparkResponse = page.waitForResponse(r => r.url().endsWith('/api/ai/explain'), { timeout: 180000 });
  await page.getByRole('button', { name: 'Explain with Meta AI', exact: true }).click();
  const spark = await sparkResponse;
  if (!spark.ok()) throw Error(`Spark HTTP ${spark.status()}`);
  await chapter('06-spark-result', 'Muse Spark explains the items, delivery and next step in plain language. The app sends prices already formatted in dollars. The trusted total remains forty two dollars. AI guidance cannot change or confirm the order.', async () => {
    await page.getByText('Meta AI guidance', { exact: true }).waitFor();
    await show(page.locator('.meta-guidance'));
  });
  await pause(31000);
  await chapter('07-voice-approval', 'Voice navigation uses Muse Voice Transcribe. This nonprivate synthetic recording says, go to cart. Selecting a file stays local until I choose Send audio to Meta. A transcript must be reviewed before applying a supported command.', async () => {
    await page.locator('input[type=file]').setInputFiles(process.env.VOICE_FIXTURE || '/tmp/clearcheckout-command.wav');
    await show(page.getByRole('heading', { name: 'Voice navigation' }));
  });
  const voiceResponse = page.waitForResponse(r => r.url().endsWith('/api/media/transcribe'), { timeout: 180000 });
  await page.getByRole('button', { name: 'Send audio to Meta', exact: true }).click();
  const voice = await voiceResponse;
  if (!voice.ok()) throw Error(`Voice HTTP ${voice.status()}`);
  await chapter('08-voice-review', 'The real transcript is ready for review. I apply go to cart, which moves navigation to the cart. Voice commands cannot edit quantities or confirm payment. The final decision remains manual.', async () => {
    await page.getByRole('button', { name: 'Apply go to cart', exact: true }).waitFor();
    await show(page.getByText(/^Transcript:/));
    await pause(2000);
    await page.getByRole('button', { name: 'Apply go to cart', exact: true }).click();
    if (await page.evaluate(() => document.activeElement?.id) !== 'cart-heading') throw Error('Voice did not focus cart');
  });
  await pause(31000);
  const sceneResponse = page.waitForResponse(r => r.url().endsWith('/api/media/scene') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Load or generate illustration', exact: true }).click();
  const scene = await sceneResponse;
  const sceneData = z.object({cached:z.boolean().optional()}).parse(await scene.json());
  if (!scene.ok() || !sceneData.cached) throw Error('Expected globally cached illustration');
  await chapter('09-visual-approval', 'Muse Image supplies a saved illustrative scene, not a product photograph. I select the mug and explicitly request SAM localization. No checkout fields or page images are sent for this step.', async () => {
    await show(page.getByRole('button', { name: 'Locate with SAM 3.1', exact: true }));
  });
  const samResponse = page.waitForResponse(r => r.url().endsWith('/api/media/locate'), { timeout: 180000 });
  await page.getByRole('button', { name: 'Locate with SAM 3.1', exact: true }).click();
  const sam = await samResponse;
  if (!sam.ok()) throw Error(`SAM HTTP ${sam.status()}`);
  await chapter('10-visual-result', 'SAM returns actual highlighted regions and a magnified view. This helps inspect the illustration. A box is an object region, not arbitrary checkout understanding, and SAM does not verify the product details.', async () => {
    await page.locator('.scene-box').first().waitFor();
    await show(page.locator('.scene'));
    await pause(1500);
    await show(page.getByRole('img', { name: 'Magnified SAM region for mug. Illustrative generated art.', exact: true }));
  });
  await chapter('11-confirm', 'Finally, I review the items, delivery and total. I type the exact phrase shown by the app, then press Confirm simulated payment myself. Neither the explanation nor voice navigation can perform this confirmation.', async () => {
    await page.getByRole('button', { name: 'Review my order' }).click();
    const field = page.getByLabel('Type exactly');
    await show(page.locator('.order-review'));
    await pause(2000);
    const label = await page.locator('label[for=confirm] strong').textContent();
    if (label === null) throw Error('Confirmation phrase is missing');
    await field.pressSequentially(label, { delay: 120 });
    await pause(1000);
    await page.getByRole('button', { name: 'Confirm simulated payment' }).click();
    await page.getByRole('heading', { name: 'Demo completed.', exact: true }).waitFor();
  });
  await chapter('12-completed', 'The demo is complete. No money moved and no real order was placed. ClearCheckout combines local control repair, plain language guidance, reviewed voice navigation and visual exploration, with a deliberate human confirmation at the end.', async () => { await show(page.locator('.completed')); });
} finally {
  const video = page.video();
  await context.close();
  if (video === null) throw Error('Video recording is unavailable');
  await video.saveAs(`${out}/raw.webm`);
  await browser.close();
}
