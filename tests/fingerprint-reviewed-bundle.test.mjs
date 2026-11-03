import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fingerprintReviewedBundle } from '../scripts/fingerprint-reviewed-bundle.mjs';

function fixture(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-fingerprint-'));
  const bundle = path.join(parent, 'bundle');
  const put = (relative, bytes) => {
    const file = path.join(bundle, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
    return file;
  };
  put('catalog/approved.json', JSON.stringify({
    schemaVersion: '1.0.0', lessons: [{ id: 'demo' }]
  }));
  put('lessons/demo/index.html', '<main>synthetic only</main>');
  put('evidence/demo/note.txt', 'synthetic QA placeholder, not actual approval');
  try { fn({ bundle, parent, put }); }
  finally { fs.rmSync(parent, { recursive: true, force: true }); }
}

test('private bundle fingerprint is stable for an unchanged synthetic package', () => fixture(({ bundle }) => {
  const first = fingerprintReviewedBundle(bundle);
  const second = fingerprintReviewedBundle(bundle);
  assert.match(first.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(first, second);
  assert.equal(first.fileCount, 3);
}));

test('changing same-length reviewed content changes the bundle digest', () => fixture(({ bundle, put }) => {
  const before = fingerprintReviewedBundle(bundle).sha256;
  put('lessons/demo/index.html', '<main>synthetic test</main>');
  assert.notEqual(fingerprintReviewedBundle(bundle).sha256, before);
}));

test('private fingerprint refuses a symlinked file or directory', () => fixture(({ bundle, parent }) => {
  const outside = path.join(parent, 'outside.txt');
  fs.writeFileSync(outside, 'secret');
  fs.symlinkSync(outside, path.join(bundle, 'lessons/demo/alias.txt'));
  assert.throws(() => fingerprintReviewedBundle(bundle), /Symlink in private handoff/);
  fs.unlinkSync(path.join(bundle, 'lessons/demo/alias.txt'));
  fs.symlinkSync(path.join(bundle, 'lessons/demo'), path.join(bundle, 'alias'), 'dir');
  assert.throws(() => fingerprintReviewedBundle(bundle), /Symlink in private handoff/);
}));

test('private fingerprint refuses hardlinked files and unexpected files', () => fixture(({ bundle, put }) => {
  const alias = path.join(bundle, 'lessons/demo/alias.html');
  fs.linkSync(path.join(bundle, 'lessons/demo/index.html'), alias);
  assert.throws(() => fingerprintReviewedBundle(bundle), /Hardlinked file/);
  fs.unlinkSync(alias);
  put('private-notes.txt', 'must not leave private source');
  assert.throws(() => fingerprintReviewedBundle(bundle), /Unexpected file/);
}));

test('private fingerprint refuses empty files and unsupported file entries', () => fixture(({ bundle, put }) => {
  const empty = put('lessons/demo/empty.txt', '');
  assert.throws(() => fingerprintReviewedBundle(bundle), /Empty or oversized/);
  fs.unlinkSync(empty);
  fs.mkdirSync(path.join(bundle, 'evidence/demo/nested'));
  // Empty directories do not affect the hash; no hidden file is published.
  assert.equal(fingerprintReviewedBundle(bundle).fileCount, 3);
}));

test('rejects a same-byte file replacement between enumeration and open', () => fixture(({ bundle }) => {
  const target = path.join(bundle, 'lessons/demo/index.html');
  const originalOpen = fs.openSync;
  let replaced = false;
  fs.openSync = function(candidate, ...args) {
    if (candidate === target && !replaced) {
      replaced = true;
      const bytes = fs.readFileSync(target);
      fs.renameSync(target, target + '.previous');
      fs.writeFileSync(target, bytes);
    }
    return originalOpen.call(fs, candidate, ...args);
  };
  try {
    assert.throws(() => fingerprintReviewedBundle(bundle), /changed before hashing/);
    assert.equal(replaced, true);
  } finally {
    fs.openSync = originalOpen;
  }
}));
