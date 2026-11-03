#!/usr/bin/env node
/**
 * Private producer only: issue a detached, short-lived Ed25519 handoff record.
 * Does not transfer content, certify evidence authenticity, create PRs or publish.
 * Never run with a private key stored in this public repository.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from './validate-catalog.mjs';
import { fingerprintReviewedBundle } from './fingerprint-reviewed-bundle.mjs';
import { canonicalHandoffPayload } from './verify-signed-handoff.mjs';
import { readPrivateSigningKey } from './read-private-signing-key.mjs';

const root = fs.realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const repository = 'jeffmartin22222-beep/path-purpose-showcase';
const within = (candidate, parent) => candidate === parent || candidate.startsWith(parent + path.sep);
function insist(ok, message) { if (!ok) throw new Error(message); }

/** Pure signer; the caller must separately establish reviewer and key custody. */
export function createSignedHandoffRecord(payload, privateKeyPem) {
  const message = canonicalHandoffPayload(payload);
  const key = crypto.createPrivateKey(privateKeyPem);
  insist(key.asymmetricKeyType === 'ed25519', 'Producer signing key must be Ed25519');
  return { payload, signature: crypto.sign(null, Buffer.from(message, 'utf8'), key).toString('base64') };
}

export function signReviewedBundle(sourceArg, keyArg, sourceArtifactId, outputArg, now = new Date()) {
  insist(/^[A-Za-z0-9._:/-]{8,200}$/.test(sourceArtifactId || ''),
    'Invalid immutable source artifact ID');
  const source = fs.realpathSync(sourceArg);
  const keyPath = path.resolve(keyArg);
  const output = path.resolve(outputArg);
  insist(fs.statSync(source).isDirectory() && !within(source, root),
    'Producer bundle must be a private directory outside the public checkout');
  insist(!within(keyPath, root) && !within(keyPath, source) &&
    !within(output, root) && !within(output, source) && output !== keyPath,
    'Key and detached record must remain outside the bundle and public checkout');
  insist(fs.realpathSync(path.dirname(output)) === path.dirname(output),
    'Record destination parent must not be a symlink');
  insist(Number.isFinite(now.getTime()), 'Invalid signing time');
  const result = validateCatalog(source);
  insist(result.approvedLessons === 1, 'Sign exactly one reviewed lesson per package');
  const lesson = JSON.parse(fs.readFileSync(path.join(source, 'catalog/approved.json'), 'utf8')).lessons[0];
  const fingerprint = fingerprintReviewedBundle(source);
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60_000).toISOString();
  const payload = {
    bundleSha256: fingerprint.sha256, expiresAt, issuedAt,
    lessonId: lesson.id, lessonVersion: lesson.version, repository,
    schemaVersion: '1', sourceArtifactId
  };
  // Pin the trusted signing key to a single descriptor and reject concurrent replacement.
  const record = createSignedHandoffRecord(payload, readPrivateSigningKey(keyPath));
  // Re-read the bundle after signing: reject concurrent changes before issuing record.
  insist(fingerprintReviewedBundle(source).sha256 === fingerprint.sha256,
    'Producer bundle changed during signing; discard record');
  const fd = fs.openSync(output, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(record, null, 2) + '\n');
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  const dirFd = fs.openSync(path.dirname(output), 'r');
  try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
  return { output, bundleSha256: fingerprint.sha256, lessonId: lesson.id, expiresAt };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [source, key, artifactId, output, ...flags] = process.argv.slice(2);
    insist(source && key && artifactId && output &&
      flags.length === 1 && flags[0] === '--acknowledge-independent-review',
      'Usage: node scripts/sign-private-handoff.mjs <private-bundle-dir> <private-ed25519-key.pem> <immutable-source-id> <detached-record.json> --acknowledge-independent-review');
    const result = signReviewedBundle(source, key, artifactId, output);
    console.log('Signed detached private handoff for', result.lessonId,
      'SHA-256', result.bundleSha256, 'expires', result.expiresAt);
    console.log('Keep the record and signing key private; deliver record independently of bundle.');
    console.log('No transfer, GitHub change, QA approval or publication occurred.');
  } catch (error) {
    console.error('Private handoff signing stopped:', error.message.split('\n')[0]);
    process.exitCode = 1;
  }
}
