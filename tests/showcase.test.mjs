import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('showcase JavaScript parses without errors', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
});
test('approved catalog is fetched and rendered with safe DOM APIs', () => {
  assert.match(html, /id="catalog-status"/);
  assert.match(html, /id="catalog-entries"/);
  assert.match(html, /fetch\('catalog\/approved\.json'/);
  assert.match(html, /document\.createElement\('article'\)/);
  assert.match(html, /title\.textContent=lesson\.title/);
  assert.doesNotMatch(html, /innerHTML\s*=/);
});
test('phone layout has narrow-screen and reduced-motion support', () => {
  assert.match(html, /name="viewport"/);
  assert.match(html, /@media\(max-width:480px\)/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /min-height:44px/);
});
test('prototype and approved curriculum are explicitly distinguished', () => {
  assert.match(html, /unapproved prototype/);
  assert.match(html, /No lessons have passed all four QA reviews yet/);
});

test('catalog renderer requires benchmark and four-pass evidence metadata', () => {
  assert.match(html, /lesson\\.benchmark\\?\\.path/);
  assert.match(html, /review\\.evidence\\.length>0/);
  assert.match(html, /lesson\\.packageSha256/);
});
