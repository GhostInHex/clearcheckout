import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';

const audioPath = process.argv[2];
if (!audioPath) throw new Error('Supply a nonprivate WAV fixture. This test makes paid Meta calls.');
const browser = await chromium.launch({headless: true});
const report: {verifiedAt:string; voice?: {model:string;status:number;transcript:string|null;appliedCommand?:string|null}; image?:{model:string;status:number}; sam?:{model:string;status:number;highlightedRegions:number}} = {verifiedAt: new Date().toISOString()};
async function shopper(label: string) {
  const page = await browser.newPage();
  await page.goto(process.env.BROWSER_BASE_URL || 'http://localhost:3000');
  await page.evaluate(async label => {
    const client={request(path: string, body: unknown){return fetch('/api' + path, {method: path === '/preferences' ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json', 'X-ClearCheckout': '1'}, body: JSON.stringify(body)});}};
    await client.request('/signup', {email: `${label}-${Date.now()}@example.test`, password: 'local-media-browser1234'});
    await client.request('/preferences', {preferences: {textSize: 'standard', contrast: false, guidance: 'brief'}});
  }, label);
  await page.reload();
  await page.getByRole('button', {name: 'Open the demo store'}).click();
  return page;
}
try {
  mkdirSync('artifacts', {recursive: true});
  const voice = await shopper('voice');
  await voice.locator('input[type=file]').setInputFiles(audioPath);
  const transcriptionPromise = voice.waitForResponse(response => response.url().endsWith('/api/media/transcribe'));
  await voice.getByRole('button', {name: 'Send audio to Meta', exact: true}).click();
  const transcription = await transcriptionPromise;
  assert.equal(transcription.status(), 200);
  report.voice = {model: 'muse-voice-transcribe-1.0', status: transcription.status(), transcript: await voice.getByText(/^Transcript:/).textContent()};
  process.stdout.write(JSON.stringify(report.voice) + '\n');
  const apply = voice.getByRole('button', {name: /^Apply /});
  if (await apply.count()) {
    const label = await apply.textContent();
    await apply.click();
    report.voice.appliedCommand = label;
    if (label?.trim() === 'Apply go to cart') assert.equal(await voice.evaluate(() => document.activeElement?.id), 'cart-heading');
  } else {
    await expect(voice.getByText('No supported command recognized. No action taken.', {exact: true})).toBeVisible();
    report.voice.appliedCommand = null;
  }
  await expect(voice.getByText('Status: draft', {exact: true})).toBeVisible();
  await voice.locator('.media-tool').filter({has: voice.getByRole('heading', {name: 'Voice navigation'})}).screenshot({path: 'artifacts/voice-live.png'});
  const visual = await shopper('visual');
  const scenePromise = visual.waitForResponse(response => response.url().endsWith('/api/media/scene') && response.request().method() === 'POST');
  await visual.getByRole('button', {name: 'Load or generate illustration', exact: true}).click();
  const scene = await scenePromise;
  assert.equal(scene.status(), 200);
  report.image = {model: 'muse-image-1.0', status: scene.status()};
  const segmentationPromise = visual.waitForResponse(response => response.url().endsWith('/api/media/locate'));
  await visual.getByRole('button', {name: 'Locate with SAM 3.1', exact: true}).click();
  const segmentation = await segmentationPromise;
  assert.equal(segmentation.status(), 200);
  await expect(visual.locator('.scene-box').first()).toBeVisible();
  report.sam = {model: 'sam-3.1', status: segmentation.status(), highlightedRegions: await visual.locator('.scene-box').count()};
  assert.ok(report.sam.highlightedRegions > 0);
  await expect(visual.getByRole('img', {name: 'Magnified SAM region for mug. Illustrative generated art.', exact: true})).toBeVisible();
  await visual.locator('.media-tool').filter({has: visual.getByRole('heading', {name: 'Explore an illustrative product scene'})}).screenshot({path: 'artifacts/visual-live.png'});
  writeFileSync('artifacts/media-live-verification.json', JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(report) + '\n');
} finally {
  await browser.close();
}
