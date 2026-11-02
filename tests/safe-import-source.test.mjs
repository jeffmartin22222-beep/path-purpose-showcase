import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { safeImportSource } from '../scripts/safe-import-source.mjs';

function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-source-'));
  const source = path.join(root, 'reviewed');
  const outside = path.join(root, 'private');
  fs.mkdirSync(source);
  fs.mkdirSync(outside);
  fs.mkdirSync(path.join(source, 'lessons'));
  fs.mkdirSync(path.join(source, 'lessons', 'demo'));
  fs.writeFileSync(path.join(source, 'lessons', 'demo', 'index.html'), 'reviewed');
  try { fn({ source, outside }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('accepts a regular reviewed source file', () => fixture(({ source }) => {
  assert.equal(safeImportSource(source, 'lessons/demo/index.html'),
    path.join(source, 'lessons', 'demo', 'index.html'));
}));
test('rejects traversal, ambiguous and absolute paths', () => fixture(({ source }) => {
  for (const p of ['../private/secret', '/etc/passwd', 'lessons//demo/index.html',
    'lessons/./demo/index.html', 'lessons/../demo/index.html', 'lessons\\demo']) {
    assert.throws(() => safeImportSource(source, p), /Unsafe private import source path/);
  }
}));
test('rejects a symlinked ancestor pointing outside the reviewed bundle', () => fixture(({ source, outside }) => {
  fs.symlinkSync(outside, path.join(source, 'evidence'), 'dir');
  fs.writeFileSync(path.join(outside, 'private.txt'), 'private');
  assert.throws(() => safeImportSource(source, 'evidence/private.txt'), /Symlink in private import source/);
}));
test('rejects a symlinked ancestor pointing inside the reviewed bundle', () => fixture(({ source }) => {
  fs.symlinkSync(path.join(source, 'lessons', 'demo'), path.join(source, 'alias'), 'dir');
  assert.throws(() => safeImportSource(source, 'alias/index.html'), /Symlink in private import source/);
}));
test('rejects dangling symlink and symlinked source leaf', () => fixture(({ source, outside }) => {
  fs.symlinkSync(path.join(outside, 'missing'), path.join(source, 'dangling'));
  assert.throws(() => safeImportSource(source, 'dangling'), /Symlink in private import source/);
  fs.symlinkSync(path.join(source, 'lessons', 'demo', 'index.html'), path.join(source, 'alias.html'));
  assert.throws(() => safeImportSource(source, 'alias.html'), /Symlink in private import source/);
}));
test('rejects a hardlinked private source file', () => fixture(({ source }) => {
  fs.linkSync(path.join(source, 'lessons', 'demo', 'index.html'), path.join(source, 'duplicate.html'));
  assert.throws(() => safeImportSource(source, 'lessons/demo/index.html'), /independent regular file/);
}));
test('rejects directory leaf and non-directory ancestor', () => fixture(({ source }) => {
  assert.throws(() => safeImportSource(source, 'lessons/demo'), /independent regular file/);
  assert.throws(() => safeImportSource(source, 'lessons/demo/index.html/extra'), /Non-directory/);
}));
