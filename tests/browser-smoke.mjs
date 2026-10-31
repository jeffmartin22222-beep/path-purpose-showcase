#!/usr/bin/env node
// Browser-level smoke checks run in Chromium emulation. NOT a substitute for physical iOS Safari/iPad tests.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.html':'text/html; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8' };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const absolute = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!absolute.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const bytes = fs.readFileSync(absolute);
    res.writeHead(200, { 'Content-Type': types[path.extname(absolute)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    res.end(bytes);
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', err => err ? reject(err) : resolve()));
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const base = 'http://127.0.0.1:' + server.address().port;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true, reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByText('No lessons have passed all four QA reviews yet').waitFor();
  assert.equal(await page.locator('#catalog-entries article').count(), 0,
    'An empty approved catalog must not display any released lessons');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }));
    assert.ok(overflow.scroll <= overflow.client + 1,
      'Horizontal overflow at ' + width + 'px: ' + JSON.stringify(overflow));
  }
  await page.locator('[data-answer="wrong"]').first().click();
  assert.match(await page.locator('#feedback').innerText(), /Try again/);
  await page.locator('[data-answer="correct"]').click();
  assert.match(await page.locator('#feedback').innerText(), /Correct/);
  await page.locator('#oxygen').evaluate(element => {
    element.value = '30';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  assert.equal(await page.locator('#aLabel').innerText(), '24 / 80');
  assert.equal(await page.locator('#meter').getAttribute('aria-valuenow'), '24');
  await page.getByRole('button', { name: 'Reset investigation' }).click();
  assert.equal(await page.locator('#aLabel').innerText(), '80 / 80');
  assert.ok(await page.locator('#feedback').evaluate(element => element.classList.contains('hidden')));
  assert.deepEqual(errors, [], 'No uncaught JavaScript errors');

  const tablet = await browser.newContext({
    viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true
  });
  const tabletPage = await tablet.newPage();
  await tabletPage.goto(base, { waitUntil: 'networkidle' });
  await tabletPage.getByText('No lessons have passed all four QA reviews yet').waitFor();
  const tabletWidth = await tabletPage.evaluate(() =>
    [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert.ok(tabletWidth[0] <= tabletWidth[1] + 1, 'Tablet horizontal overflow');
  await tablet.close();
  await context.close();
  console.log('PASS: Chromium emulated phone/tablet layout, catalog fail-closed, and interactive behavior.');
  console.log('Physical iPhone/iPad Safari, video playback, captions and screen-reader QA remain REQUIRED.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
