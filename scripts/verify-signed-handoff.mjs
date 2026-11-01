import fs from 'node:fs';
import crypto from 'node:crypto';

const FIELDS = ['bundleSha256', 'expiresAt', 'issuedAt', 'lessonId', 'lessonVersion', 'repository', 'schemaVersion', 'sourceArtifactId'];
const ownFields = obj => obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj).sort() : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

// All signed fields are strings; sign UTF-8 JSON with lexically sorted keys.
export function canonicalHandoffPayload(payload) {
  assert(JSON.stringify(ownFields(payload)) === JSON.stringify(FIELDS), 'Unexpected signed handoff fields');
  assert(FIELDS.every(key => typeof payload[key] === 'string'), 'Signed handoff fields must be strings');
  return JSON.stringify(Object.fromEntries(FIELDS.map(key => [key, payload[key]])));
}

export function verifySignedHandoff(recordPath, publicKeyPath, expected, now = new Date()) {
  const stat = fs.statSync(recordPath);
  assert(stat.isFile() && stat.size > 0 && stat.size <= 16384, 'Invalid signed handoff record size');
  const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  assert(JSON.stringify(ownFields(record)) === JSON.stringify(['payload', 'signature']), 'Invalid signed handoff envelope');
  const payload = record.payload;
  const message = canonicalHandoffPayload(payload);
  assert(payload.schemaVersion === '1', 'Unsupported handoff schema');
  assert(payload.repository === expected.repository &&
    payload.lessonId === expected.lessonId &&
    payload.lessonVersion === expected.lessonVersion &&
    payload.bundleSha256 === expected.bundleSha256,
    'Signed handoff does not match verified lesson or digest');
  assert(/^[a-f0-9]{64}$/.test(payload.bundleSha256) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.lessonId) &&
    /^[A-Za-z0-9._:/-]{8,200}$/.test(payload.sourceArtifactId) &&
    payload.lessonVersion.length <= 100, 'Malformed signed handoff identifier');
  const utc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  assert(utc.test(payload.issuedAt) && utc.test(payload.expiresAt), 'Handoff timestamps must be UTC');
  const issued = Date.parse(payload.issuedAt);
  const expires = Date.parse(payload.expiresAt);
  const current = now.getTime();
  assert(Number.isFinite(issued) && Number.isFinite(expires) &&
    issued <= current + 5 * 60_000 && expires > current &&
    expires > issued && expires - issued <= 7 * 24 * 60 * 60_000,
    'Signed handoff is expired, future-dated or too long-lived');
  assert(typeof record.signature === 'string' &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(record.signature), 'Invalid handoff signature encoding');
  const signature = Buffer.from(record.signature, 'base64');
  assert(signature.toString('base64') === record.signature && signature.length === 64,
    'Invalid Ed25519 signature bytes');
  const publicKey = crypto.createPublicKey(fs.readFileSync(publicKeyPath));
  assert(publicKey.asymmetricKeyType === 'ed25519', 'Trusted producer key must be Ed25519');
  assert(crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, signature),
    'Invalid signed producer handoff signature');
  return { sourceArtifactId: payload.sourceArtifactId, bundleSha256: payload.bundleSha256 };
}
