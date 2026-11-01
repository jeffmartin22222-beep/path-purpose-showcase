import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { withPrivateHandoffLedger } from '../scripts/private-handoff-ledger.mjs';

const handoff = {
  sourceArtifactId: 'private:immutable-artifact-1',
  lessonId: 'inside-the-cell',
  lessonVersion: '1.0.0',
  bundleSha256: 'a'.repeat(64)
};
const pr = 'https://github.com/jeffmartin22222-beep/path-purpose-showcase/pull/99';
function fixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-ledger-'));
  const ledger = path.join(dir, 'replay.json');
  try { fn(ledger); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('successful private staging records source, version and PR and rejects replay', () => fixture(ledger => {
  assert.equal(withPrivateHandoffLedger(ledger, handoff, () => pr), pr);
  const data = JSON.parse(fs.readFileSync(ledger));
  assert.equal(data.records.length, 1);
  assert.equal(data.records[0].status, 'staged');
  assert.equal(data.records[0].prUrl, pr);
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr), /replay or conflicting/);
  assert.equal(fs.existsSync(ledger + '.lock'), false);
}));
test('crashed staging leaves pending reservation and refuses unsafe retry', () => fixture(ledger => {
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => {
    throw new Error('simulated GitHub outage');
  }), /simulated GitHub outage/);
  assert.equal(JSON.parse(fs.readFileSync(ledger)).records[0].status, 'pending');
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr), /replay or conflicting/);
}));
test('conflicting source for same lesson version is blocked', () => fixture(ledger => {
  withPrivateHandoffLedger(ledger, handoff, () => pr);
  assert.throws(() => withPrivateHandoffLedger(ledger,
    { ...handoff, sourceArtifactId: 'private:immutable-artifact-2', bundleSha256: 'b'.repeat(64) },
    () => pr), /replay or conflicting/);
}));
test('preexisting lock prevents simultaneous runner staging', () => fixture(ledger => {
  fs.writeFileSync(ledger + '.lock', 'existing runner');
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr), /ledger locked/);
  assert.equal(fs.readFileSync(ledger + '.lock', 'utf8'), 'existing runner');
}));
test('invalid ledger schema fails closed without changing the file', () => fixture(ledger => {
  fs.writeFileSync(ledger, '{"schemaVersion":2,"records":[]}');
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr), /Invalid private replay ledger schema/);
  assert.equal(fs.existsSync(ledger + '.lock'), false);
}));
test('non-PR result cannot mark a handoff staged', () => fixture(ledger => {
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => 'not-a-pr'), /review PR URL/);
  assert.equal(JSON.parse(fs.readFileSync(ledger)).records[0].status, 'pending');
}));
test('symlink ledger is rejected', () => fixture(ledger => {
  const target = path.join(path.dirname(ledger), 'target.json');
  fs.writeFileSync(target, '{"schemaVersion":1,"records":[]}');
  fs.symlinkSync(target, ledger);
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr), /regular file|symlink/);
}));

test('non-repository GitHub URL cannot mark a handoff staged', () => fixture(ledger => {
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff,
    () => 'https://github.com/attacker/other/pull/1'), /review PR URL/);
  assert.equal(JSON.parse(fs.readFileSync(ledger)).records[0].status, 'pending');
}));
test('malformed prior pending entry blocks staging before callback', () => fixture(ledger => {
  fs.writeFileSync(ledger, JSON.stringify({ schemaVersion: 1, records: [
    { sourceArtifactId: 'private:broken', lessonId: 'demo', lessonVersion: '1',
      bundleSha256: 'b'.repeat(64), status: 'approved', updatedAt: '2026-11-01T00:00:00Z' }
  ] }));
  let called = false;
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => {
    called = true;
    return pr;
  }), /Invalid private replay ledger record/);
  assert.equal(called, false);
}));
test('duplicate existing source IDs block staging even for a new lesson', () => fixture(ledger => {
  const make = (lessonId, version) => ({
    sourceArtifactId: 'private:duplicate', lessonId, lessonVersion: version,
    bundleSha256: 'c'.repeat(64), status: 'pending', updatedAt: '2026-11-01T00:00:00Z'
  });
  fs.writeFileSync(ledger, JSON.stringify({ schemaVersion: 1,
    records: [make('demo-one', '1'), make('demo-two', '2')] }));
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr),
    /Duplicate entries/);
}));
test('invalid staged PR URL in existing ledger fails closed', () => fixture(ledger => {
  fs.writeFileSync(ledger, JSON.stringify({ schemaVersion: 1, records: [{
    sourceArtifactId: 'private:other', lessonId: 'demo', lessonVersion: '1',
    bundleSha256: 'c'.repeat(64), status: 'staged',
    updatedAt: '2026-11-01T00:00:00Z', prUrl: 'https://github.com/attacker/other/pull/1'
  }] }));
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr),
    /Invalid private replay ledger record/);
}));

test('dangling ledger symlink fails closed instead of resetting replay history', () => fixture(ledger => {
  fs.symlinkSync(path.join(path.dirname(ledger), 'missing-target'), ledger);
  assert.throws(() => withPrivateHandoffLedger(ledger, handoff, () => pr), /non-symlink/);
  assert.equal(fs.lstatSync(ledger).isSymbolicLink(), true);
}));
