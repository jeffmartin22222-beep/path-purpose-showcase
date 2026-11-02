import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readPrivateSigningKey } from '../scripts/read-private-signing-key.mjs';

function fixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-key-pin-'));
  const key = path.join(dir, 'producer.pem');
  const bytes = 'synthetic key fixture; never a real secret';
  fs.writeFileSync(key, bytes, { mode: 0o600 });
  try { fn({ dir, key, bytes }); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('pinned producer key reader accepts an unchanged private file', () => fixture(f => {
  assert.equal(readPrivateSigningKey(f.key).toString(), f.bytes);
}));

test('pinned producer key reader rejects symlink and hardlink aliases', () => fixture(f => {
  const alias = path.join(f.dir, 'alias.pem');
  fs.symlinkSync(f.key, alias);
  assert.throws(() => readPrivateSigningKey(alias), /Unsafe producer signing key/);
  fs.unlinkSync(alias);
  fs.linkSync(f.key, alias);
  assert.throws(() => readPrivateSigningKey(f.key), /Unsafe producer signing key/);
}));

test('pinned producer key reader rejects group-readable or oversized files', () => fixture(f => {
  fs.chmodSync(f.key, 0o640);
  assert.throws(() => readPrivateSigningKey(f.key), /Unsafe producer signing key/);
  fs.chmodSync(f.key, 0o600);
  fs.writeFileSync(f.key, 'x'.repeat(16385));
  assert.throws(() => readPrivateSigningKey(f.key), /Unsafe producer signing key/);
}));

test('pinned producer key reader rejects inode replacement during descriptor read', () => fixture(f => {
  const original = fs.readFileSync;
  let swapped = false;
  try {
    fs.readFileSync = function (target, ...args) {
      if (typeof target === 'number' && !swapped) {
        swapped = true;
        fs.renameSync(f.key, path.join(f.dir, 'old.pem'));
        fs.writeFileSync(f.key, f.bytes, { mode: 0o600 });
      }
      return original.call(fs, target, ...args);
    };
    assert.throws(() => readPrivateSigningKey(f.key), /Unsafe producer signing key/);
    assert.equal(swapped, true);
  } finally { fs.readFileSync = original; }
}));

test('pinned producer key reader rejects same-length in-place modification during read', () => fixture(f => {
  const original = fs.readFileSync;
  let changed = false;
  try {
    fs.readFileSync = function (target, ...args) {
      if (typeof target === 'number' && !changed) {
        changed = true;
        fs.writeFileSync(f.key, 'x'.repeat(f.bytes.length), { mode: 0o600 });
      }
      return original.call(fs, target, ...args);
    };
    assert.throws(() => readPrivateSigningKey(f.key), /Unsafe producer signing key/);
    assert.equal(changed, true);
  } finally { fs.readFileSync = original; }
}));
