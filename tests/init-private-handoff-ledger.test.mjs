import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/init-private-handoff-ledger.mjs', import.meta.url));
const root = fileURLToPath(new URL('../', import.meta.url));
function fixture(fn) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-ledger-bootstrap-'));
  try { fn(directory); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
function run(...args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}
test('bootstrap requires explicit operator acknowledgement', () => fixture(directory => {
  const ledger = path.join(directory, 'replay.json');
  const result = run(ledger);
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(ledger), false);
}));
test('bootstrap creates an empty private ledger only once without overwriting history', () => fixture(directory => {
  const ledger = path.join(directory, 'replay.json');
  assert.equal(run(ledger, '--acknowledge-new-private-ledger').status, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(ledger)), { schemaVersion: 1, records: [] });
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(ledger).mode & 0o777, 0o600);
  }
  const original = fs.readFileSync(ledger);
  const second = run(ledger, '--acknowledge-new-private-ledger');
  assert.notEqual(second.status, 0);
  assert.deepEqual(fs.readFileSync(ledger), original);
}));
test('bootstrap refuses symlinked private ledger directory', () => fixture(directory => {
  const real = path.join(directory, 'real');
  const link = path.join(directory, 'link');
  fs.mkdirSync(real);
  fs.symlinkSync(real, link, 'dir');
  const result = run(path.join(link, 'replay.json'), '--acknowledge-new-private-ledger');
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(path.join(real, 'replay.json')), false);
}));
test('bootstrap refuses public repository path', () => {
  const result = run(path.join(root, 'NEVER-CREATE-PRIVATE-LEDGER.json'),
    '--acknowledge-new-private-ledger');
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(path.join(root, 'NEVER-CREATE-PRIVATE-LEDGER.json')), false);
});

test('bootstrap rejects a world-writable private ledger directory', () => fixture(directory => {
  fs.chmodSync(directory, 0o777);
  try {
    const ledger = path.join(directory, 'replay.json');
    const result = run(ledger, '--acknowledge-new-private-ledger');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must not be world-writable/);
    assert.equal(fs.existsSync(ledger), false);
  } finally {
    fs.chmodSync(directory, 0o700);
  }
}));
