#!/usr/bin/env node
// Synthetic browser regression tests. These fixtures are never copied to the
// real approved catalog, committed as lessons, or represented as QA evidence.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'showcase-browser-fixture-'));
const lessonPath = path.join(temp, 'lessons/synthetic/index.html');
const catalogPath = path.join(temp, 'catalog/approved.json');
const smoke = path.join(repoRoot, 'tests/browser-smoke.mjs');
const run = () => spawnSync(process.execPath, [smoke], {
  env: { ...process.env, SHOWCASE_TEST_ROOT: temp },
  encoding: 'utf8', timeout: 120000
});
const syntheticLesson = {
  id: 'synthetic', title: 'Synthetic browser fixture only', grade: '8',
  subject: 'Science', course: 'Biology', unit: 'Browser tests',
  entry: 'lessons/synthetic/index.html', rights: { status: 'cleared' },
  qa: Object.fromEntries(['content', 'pedagogy', 'technical', 'experience']
    .map(gate => [gate, { status: 'passed' }]))
};
try {
  fs.mkdirSync(path.dirname(lessonPath), { recursive: true });
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'index.html'), path.join(temp, 'index.html'));
  const writeCatalog = () => fs.writeFileSync(catalogPath, JSON.stringify({
    schemaVersion: '1.0.0', generatedAt: null, lessons: [syntheticLesson]
  }));
  writeCatalog();
  const html = '<!doctype html><html lang="en"><head><title>Fixture</title>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body><h1>Synthetic fixture lesson</h1><p>Testing a nonempty approved catalog ' +
    'in Chromium without ever publishing this fixture.</p></body></html>';
  fs.writeFileSync(lessonPath, html);
  const positive = run();
  assert.equal(positive.status, 0, positive.stderr || positive.stdout || positive.error?.message);
  assert.match(positive.stdout, /Approved lesson browser checks: 1 lesson/);
  console.log('PASS: nonempty catalog renders and its synthetic lesson loads at phone/tablet sizes.');

  fs.writeFileSync(lessonPath, html.replace('</body>',
    '<img src="https://example.invalid/never-fetch.png" alt="External dependency"></body>'));
  const external = run();
  assert.notEqual(external.status, 0, 'External resource must fail browser smoke checks');
  assert.match(external.stderr, /depends on external network resources/);
  console.log('PASS: external lesson network dependency is rejected.');

  // Explicitly list the absent file so the manifest isolation check allows
  // its request and the HTTP 404 check is independently exercised.
  syntheticLesson.assets = [{ path: 'lessons/synthetic/missing.png' }];
  writeCatalog();
  fs.writeFileSync(lessonPath, html.replace('</body>',
    '<img src="/lessons/synthetic/missing.png" alt="Missing local asset"></body>'));
  const missing = run();
  assert.notEqual(missing.status, 0, 'Missing local asset must fail browser smoke checks');
  assert.match(missing.stderr, /has missing local assets/);
  console.log('PASS: missing local lesson asset is rejected.');
  syntheticLesson.assets = [];
  writeCatalog();

  // The public root index exists, so a normal 200 response would otherwise
  // mask this unapproved dependency. The lesson may load ONLY hashed files
  // explicitly listed in its own manifest, never other repository content.
  fs.writeFileSync(lessonPath, html.replace('</body>',
    '<img src="/index.html" alt="Unreviewed same-origin file"></body>'));
  const unlisted = run();
  assert.notEqual(unlisted.status, 0,
    'Unlisted same-origin file must fail even if it exists and returns HTTP 200');
  assert.match(unlisted.stderr, /requested unlisted same-origin assets/);
  console.log('PASS: unlisted same-origin lesson dependencies are rejected.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
