import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canonicalHandoffPayload, verifySignedHandoff } from '../scripts/verify-signed-handoff.mjs';

function fixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-signed-handoff-'));
  try {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    const pub = path.join(dir, 'trusted-public.pem');
    const record = path.join(dir, 'record.json');
    fs.writeFileSync(pub, publicKey.export({ type: 'spki', format: 'pem' }));
    const now = new Date('2026-10-31T20:00:00Z');
    const payload = {
      schemaVersion: '1', repository: 'jeffmartin22222-beep/path-purpose-showcase',
      lessonId: 'demo', lessonVersion: '1', bundleSha256: 'a'.repeat(64),
      sourceArtifactId: 'private:demo-v1',
      issuedAt: '2026-10-31T19:00:00Z', expiresAt: '2026-11-01T19:00:00Z'
    };
    const expected = {
      repository: payload.repository, lessonId: payload.lessonId,
      lessonVersion: payload.lessonVersion, bundleSha256: payload.bundleSha256
    };
    const save = (obj = payload) => fs.writeFileSync(record, JSON.stringify({
      payload: obj,
      signature: crypto.sign(null, Buffer.from(canonicalHandoffPayload(obj)), privateKey).toString('base64')
    }));
    save();
    fn({ dir, pub, record, payload, expected, now, save });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
test('valid independent signed producer record verifies', () => fixture(f => {
  assert.equal(verifySignedHandoff(f.record, f.pub, f.expected, f.now).sourceArtifactId, 'private:demo-v1');
}));
test('tampered producer record fails signature', () => fixture(f => {
  const r = JSON.parse(fs.readFileSync(f.record));
  r.payload.sourceArtifactId = 'private:other';
  fs.writeFileSync(f.record, JSON.stringify(r));
  assert.throws(() => verifySignedHandoff(f.record, f.pub, f.expected, f.now), /signature/);
}));
test('untrusted producer key fails signature', () => fixture(f => {
  const key = crypto.generateKeyPairSync('ed25519').publicKey;
  fs.writeFileSync(f.pub, key.export({ type: 'spki', format: 'pem' }));
  assert.throws(() => verifySignedHandoff(f.record, f.pub, f.expected, f.now), /signature/);
}));
test('signed digest must match independently verified bundle', () => fixture(f => {
  assert.throws(() => verifySignedHandoff(f.record, f.pub, {
    ...f.expected, bundleSha256: 'b'.repeat(64)
  }, f.now), /does not match/);
}));
test('expired producer record is rejected', () => fixture(f => {
  assert.throws(() => verifySignedHandoff(f.record, f.pub, f.expected,
    new Date('2026-11-03T00:00:00Z')), /expired/);
}));
test('unrecognized signed fields are rejected', () => fixture(f => {
  assert.throws(() => f.save({ ...f.payload, unreviewed: 'yes' }), /Unexpected signed handoff fields/);
}));
