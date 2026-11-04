declare global { interface Window { capturedTracks: MediaStreamTrack[]; } }
import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']});
try {
  const context = await browser.newContext({permissions: ['microphone']});
  await context.addInitScript(() => {
    window.capturedTracks = [];
    const capture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async options => {
      const stream = await capture(options);
      window.capturedTracks.push(...stream.getTracks());
      return stream;
    };
  });
  const page = await context.newPage();
  let uploads = 0;
  page.on('request', request => {if (request.url().endsWith('/api/media/transcribe')) uploads++;});
  await page.goto(process.env.BROWSER_BASE_URL || 'http://localhost:3000');
  await page.evaluate(async () => {
    const client={request(path: string, body: unknown){return fetch('/api' + path, {method: path === '/preferences' ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json', 'X-ClearCheckout': '1'}, body: JSON.stringify(body)});}};
    await client.request('/signup', {email: `mic-${Date.now()}@example.test`, password: 'local-microphone-test123'});
    await client.request('/preferences', {preferences: {textSize: 'standard', contrast: false, guidance: 'brief'}});
  });
  await page.reload();
  await page.getByRole('button', {name: 'Open the demo store'}).click();
  await page.getByRole('button', {name: 'Record a command', exact: true}).click();
  await page.getByRole('button', {name: 'Stop recording', exact: true}).waitFor();
  await page.getByRole('button', {name: 'Stop recording', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Send audio to Meta', exact: true})).toBeEnabled();
  assert.equal(await page.evaluate(() => window.capturedTracks.every(track => track.readyState === 'ended')), true);
  await page.getByRole('button', {name: 'Record a command', exact: true}).click();
  await page.getByRole('button', {name: 'Stop recording', exact: true}).waitFor();
  await page.getByRole('button', {name: 'Preferences', exact: true}).click();
  assert.equal(await page.evaluate(() => window.capturedTracks.every(track => track.readyState === 'ended')), true);
  await page.getByRole('button', {name: 'Demo store', exact: true}).click();
  await page.getByRole('button', {name: 'Record a command', exact: true}).click();
  await page.getByRole('button', {name: 'Stop recording', exact: true}).waitFor();
  await expect(page.getByRole('button', {name: 'Record a command', exact: true})).toBeVisible({timeout: 15000});
  assert.equal(await page.evaluate(() => window.capturedTracks.every(track => track.readyState === 'ended')), true);
  assert.equal(uploads, 0, 'Microphone capture must not upload audio before approval');
  process.stdout.write('Microphone lifecycle passed with Chromium fake devices: stop, unmount, automatic time limit, and no unapproved upload.\n');
} finally {
  await browser.close();
}
