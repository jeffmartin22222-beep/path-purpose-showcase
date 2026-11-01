import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { safeImportDestination } from '../scripts/safe-import-path.mjs';

function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-safe-import-'));
  const checkout = path.join(root, 'checkout');
  const outside = path.join(root, 'private');
  fs.mkdirSync(checkout);
  fs.mkdirSync(outside);
  try { fn({ checkout, outside }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('allows a new, nested import destination inside the checkout', () => fixture(({ checkout }) => {
  const target = safeImportDestination(checkout, 'lessons/inside-the-cell/index.html');
  assert.equal(target, path.join(checkout, 'lessons/inside-the-cell/index.html'));
  assert.equal(fs.existsSync(target), false);
}));

test('rejects traversal, absolute and ambiguous import paths', () => fixture(({ checkout }) => {
  for (const relative of ['../private/key', '/etc/passwd', 'lessons//demo.html',
    'lessons/./demo.html', 'lessons/../private.txt', 'lessons/a\\b.html']) {
    assert.throws(() => safeImportDestination(checkout, relative), /Unsafe import path/);
  }
}));

test('rejects a symlinked parent that would write outside the checkout', () => fixture(({ checkout, outside }) => {
  fs.mkdirSync(path.join(checkout, 'lessons'));
  fs.symlinkSync(outside, path.join(checkout, 'lessons', 'inside-the-cell'), 'dir');
  assert.throws(() => safeImportDestination(checkout, 'lessons/inside-the-cell/index.html'),
    /Symlink in public import destination/);
  assert.equal(fs.existsSync(path.join(outside, 'index.html')), false);
}));

test('rejects dangling symlink and pre-existing destination leaf', () => fixture(({ checkout, outside }) => {
  fs.mkdirSync(path.join(checkout, 'lessons'));
  fs.symlinkSync(path.join(outside, 'not-created'), path.join(checkout, 'lessons', 'index.html'));
  assert.throws(() => safeImportDestination(checkout, 'lessons/index.html'),
    /Symlink in public import destination/);
  fs.unlinkSync(path.join(checkout, 'lessons', 'index.html'));
  fs.writeFileSync(path.join(checkout, 'lessons', 'index.html'), 'already present');
  assert.throws(() => safeImportDestination(checkout, 'lessons/index.html'),
    /Refusing to overwrite existing import path/);
}));

test('rejects a regular file used as an import parent directory', () => fixture(({ checkout }) => {
  fs.writeFileSync(path.join(checkout, 'evidence'), 'not a directory');
  assert.throws(() => safeImportDestination(checkout, 'evidence/demo/content/report.json'),
    /Non-directory import ancestor/);
}));
