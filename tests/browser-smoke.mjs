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
  // The catalog starts empty, but this smoke test must also pass when a real
  // approved lesson is added. Never hard-code "zero approved lessons" as a release rule.
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog/approved.json'), 'utf8'));
  await page.waitForFunction(expected => {
    const status = document.getElementById('catalog-status')?.textContent || '';
    return expected === 0 ? status.includes('No lessons have passed all four QA reviews yet')
      : status.includes(expected + ' approved lesson');
  }, catalog.lessons.length);
  const cards = page.locator('#catalog-entries article');
  assert.equal(await cards.count(), catalog.lessons.length,
    'Showcase must render exactly the approved catalog entries');
  const visibleLinks = await page.locator('#catalog-entries a.catalog-link').evaluateAll(
    links => links.map(link => new URL(link.href).pathname)
  );
  assert.deepEqual(visibleLinks, catalog.lessons.map(lesson => '/' + lesson.entry),
    'Catalog links must match the reviewed lesson entry paths exactly');

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
  await tabletPage.waitForFunction(expected => {
    const status = document.getElementById('catalog-status')?.textContent || '';
    return expected === 0 ? status.includes('No lessons have passed all four QA reviews yet')
      : status.includes(expected + ' approved lesson');
  }, catalog.lessons.length);
  const tabletWidth = await tabletPage.evaluate(() =>
    [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert.ok(tabletWidth[0] <= tabletWidth[1] + 1, 'Tablet horizontal overflow');
  // Exercise each real approved entry on both viewport sizes. This is browser
  // emulation, NOT a substitute for physical iOS Safari, reviewer QA, or licensing.
  // Block external network dependencies: student lessons must work self-contained.
  for (const lesson of catalog.lessons) {
    for (const device of [
      { name: 'phone', width: 390, height: 844 },
      { name: 'tablet', width: 820, height: 1180 }
    ]) {
      const lessonContext = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        isMobile: true, hasTouch: true, reducedMotion: 'reduce'
      });
      try {
        const external = [];
        await lessonContext.route('**/*', route => {
          const url = route.request().url();
          if (/^https?:/.test(url) && new URL(url).origin !== new URL(base).origin) {
            external.push(url);
            return route.abort();
          }
          return route.continue();
        });
        const lessonPage = await lessonContext.newPage();
        const lessonErrors = [];
        const failedLocal = [];
        lessonPage.on('pageerror', error => lessonErrors.push(error.message));
        lessonPage.on('response', response => {
          if (response.url().startsWith(base) && response.status() >= 400)
            failedLocal.push(response.status() + ' ' + response.url());
        });
        const response = await lessonPage.goto(base + '/' + lesson.entry, {
          waitUntil: 'load', timeout: 30000
        });
        assert.equal(response?.status(), 200, lesson.id + ' entry HTTP status');
        await lessonPage.waitForTimeout(250);
        const snapshot = await lessonPage.evaluate(() => ({
          title: document.title,
          textLength: document.body?.innerText?.trim().length || 0,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        }));
        assert.ok(snapshot.textLength >= 20, lesson.id + ' has insufficient visible content');
        assert.ok(snapshot.scrollWidth <= snapshot.clientWidth + 1,
          lesson.id + ' horizontal overflow on ' + device.name + ': ' + JSON.stringify(snapshot));
        assert.deepEqual(external, [], lesson.id + ' depends on external network resources');
        assert.deepEqual(failedLocal, [], lesson.id + ' has missing local assets');
        assert.deepEqual(lessonErrors, [], lesson.id + ' has uncaught browser errors');
      } finally {
        await lessonContext.close();
      }
    }
  }
  await tablet.close();
  await context.close();
  console.log('PASS: Chromium emulated phone/tablet layout, catalog rendering, and interactive behavior.');
  console.log('Approved lesson browser checks: ' + catalog.lessons.length +
    ' lesson(s) on phone and tablet. Empty catalog means no lesson runtime was exercised.');
  console.log('Physical iPhone/iPad Safari, video playback, captions and screen-reader QA remain REQUIRED.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
