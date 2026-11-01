import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createSignedHandoffRecord } from '../scripts/sign-private-handoff.mjs';
import { verifySignedHandoff } from '../scripts/verify-signed-handoff.mjs';

const repo = 'jeffmartin22222-beep/path-purpose-showcase';
const payload = {
  bundleSha256: 'a'.repeat(64),
  expiresAt: '2026-11-02T00:00:00Z',
  issuedAt: '2026-11-01T00:00:00Z',
  lessonId: 'inside-the-cell',
  lessonVersion: '1.0.0',
  repository: repo,
  schemaVersion: '1',
  sourceArtifactId: 'private:immutable-v1'
};
function fixture(work) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-signer-'));
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicPath = path.join(dir, 'trusted-public.pem');
  const recordPath = path.join(dir, 'detached.json');
  fs.writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }));
  const expected = {
    repository: repo, lessonId: payload.lessonId,
    lessonVersion: payload.lessonVersion, bundleSha256: payload.bundleSha256
  };
  try { work({ dir, pem, publicPath, recordPath, expected }); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('private producer signer creates independently verifiable detached Ed25519 record', () => fixture(f => {
  const record = createSignedHandoffRecord(payload, f.pem);
  fs.writeFileSync(f.recordPath, JSON.stringify(record));
  assert.equal(verifySignedHandoff(f.recordPath, f.publicPath, f.expected,
    new Date('2026-11-01T12:00:00Z')).sourceArtifactId, payload.sourceArtifactId);
}));
test('producer signature fails if record changes after signing', () => fixture(f => {
  const record = createSignedHandoffRecord(payload, f.pem);
  record.payload = { ...payload, sourceArtifactId: 'private:tampered-v2' };
  fs.writeFileSync(f.recordPath, JSON.stringify(record));
  assert.throws(() => verifySignedHandoff(f.recordPath, f.publicPath, f.expected,
    new Date('2026-11-01T12:00:00Z')), /signature/);
}));
test('signer rejects non-Ed25519 private keys', () => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  assert.throws(() => createSignedHandoffRecord(payload,
    privateKey.export({ type: 'pkcs8', format: 'pem' })), /Ed25519/);
});
test('signer rejects extra unsigned payload fields', () => fixture(f => {
  assert.throws(() => createSignedHandoffRecord({ ...payload, override: 'yes' }, f.pem),
    /Unexpected signed handoff fields/);
}));
test('producer CLI refuses signing without explicit review acknowledgement', () => fixture(f => {
  const script = fileURLToPath(new URL('../scripts/sign-private-handoff.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, f.dir, f.publicPath,
    'private:immutable-v1', f.recordPath], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /acknowledge-independent-review/);
  assert.equal(fs.existsSync(f.recordPath), false);
}));
