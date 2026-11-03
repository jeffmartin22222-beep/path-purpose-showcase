import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const FIELDS = ['bundleSha256', 'expiresAt', 'issuedAt', 'lessonId', 'lessonVersion', 'repository', 'schemaVersion', 'sourceArtifactId'];
const ownFields = obj => obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj).sort() : [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

// All signed fields are strings; sign UTF-8 JSON with lexically sorted keys.
export function canonicalHandoffPayload(payload) {
  assert(JSON.stringify(ownFields(payload)) === JSON.stringify(FIELDS), 'Unexpected signed handoff fields');
  assert(FIELDS.every(key => typeof payload[key] === 'string'), 'Signed handoff fields must be strings');
  return JSON.stringify(Object.fromEntries(FIELDS.map(key => [key, payload[key]])));
}

// The detached record and owner-provisioned public key are separate trust inputs.
// Reject symlinks (including symlinked parent paths), hardlinks, group/world
// writable files and oversized files before reading either input. A symlink
// could otherwise redirect the trusted key to attacker-controlled material.
// Read from a pinned descriptor, not by reopening the pathname after lstat.
// A producer record or trusted key replaced between checking and reading must
// never be accepted. The isolated private runner still needs exclusive custody
// of its trust directory; this is a local filesystem defense-in-depth check.
function readTrustedInput(candidate, label) {
  const absolute = path.resolve(candidate);
  const unsafe = 'Unsafe ' + label + ': require a stable independent non-symlink, non-writable regular file';
  const valid = stat => stat.isFile() && stat.nlink === 1n &&
    (stat.mode & 0o022n) === 0n && stat.size > 0n && stat.size <= 16384n;
  const same = (a, b) => a.dev === b.dev && a.ino === b.ino &&
    a.size === b.size && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs;
  assert(typeof fs.constants.O_NOFOLLOW === 'number', unsafe);
  const before = fs.lstatSync(absolute, { bigint: true });
  assert(valid(before) && fs.realpathSync(absolute) === absolute, unsafe);
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd, { bigint: true });
    assert(valid(opened) && same(before, opened), unsafe);
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd, { bigint: true });
    const current = fs.lstatSync(absolute, { bigint: true });
    assert(valid(after) && valid(current) && same(before, after) &&
      same(before, current) && bytes.length === Number(before.size), unsafe);
    return { absolute, bytes };
  } finally {
    fs.closeSync(fd);
  }
}

export function verifySignedHandoff(recordPath, publicKeyPath, expected, now = new Date()) {
  const recordInput = readTrustedInput(recordPath, 'signed handoff record');
  const keyInput = readTrustedInput(publicKeyPath, 'trusted producer public key');
  assert(recordInput.absolute !== keyInput.absolute, 'Record and trusted public key must be separate files');
  const record = JSON.parse(recordInput.bytes.toString('utf8'));
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
  const publicKey = crypto.createPublicKey(keyInput.bytes);
  assert(publicKey.asymmetricKeyType === 'ed25519', 'Trusted producer key must be Ed25519');
  assert(crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, signature),
    'Invalid signed producer handoff signature');
  return { sourceArtifactId: payload.sourceArtifactId, bundleSha256: payload.bundleSha256 };
}
