import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createSignedHandoffRecord, signReviewedBundle } from '../scripts/sign-private-handoff.mjs';
import { verifySignedHandoff } from '../scripts/verify-signed-handoff.mjs';
import { REQUIRED_CHECKS } from '../scripts/validate-catalog.mjs';

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

test('synthetic reviewed-package fixture signs to a detached private record, refuses overwrite', () => fixture(f => {
  const bundle = path.join(f.dir, 'synthetic-bundle');
  const keyPath = path.join(f.dir, 'signing-key.pem');
  const write = (relative, data) => {
    const target = path.join(bundle, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  };
  const hash = data => crypto.createHash('sha256').update(data).digest('hex');
  const html = '<!doctype html><html><title>Fixture</title><body>Synthetic fixture</body></html>';
  const entry = 'lessons/demo/index.html';
  const htmlHash = hash(html);
  write(entry, html);
  const assets = ['lesson', 'unit', 'course'].map(scope => {
    const relative = 'lessons/demo/print/' + scope + '.html';
    const printable = '<!doctype html><html><body><main data-print-scope="' + scope +
      '"><h1>Synthetic ' + scope + ' print representation</h1><p>' +
      'This is synthetic test-only print material, not a real approved workbook or verified PDF.' +
      '</p></main></body></html>';
    write(relative, printable);
    return { path: relative, sha256: hash(printable) };
  });
  const packageHash = hash(JSON.stringify([
    { path: entry, sha256: htmlHash }, ...assets
  ].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
  const reviewedAt = '2026-11-01T00:00:00Z';
  const qa = {};
  for (const [gate, checks] of Object.entries(REQUIRED_CHECKS)) {
    const dir = 'evidence/demo/' + gate + '/';
    const artifact = dir + 'synthetic.txt';
    const artifactData = 'SYNTHETIC TEST ONLY — NOT ACTUAL QA';
    write(artifact, artifactData);
    const reportPath = dir + 'report.json';
    write(reportPath, JSON.stringify({
      lessonId: 'demo', version: '1', gate,
      entrySha256: htmlHash, packageSha256: packageHash,
      reviewedBy: 'Synthetic fixture only', reviewedAt,
      checks: checks.map(id => ({
        id, result: 'passed', notes: 'Synthetic fixture only',
        ...(['iphone', 'ipad'].includes(id) ? {
          deviceModel: id === 'iphone' ? 'Test iPhone 16' : 'Test iPad Air',
          osVersion: id === 'iphone' ? 'iOS 18.0' : 'iPadOS 18.0',
          browserName: 'Safari', testMethod: 'physical_device', testedAt: reviewedAt
        } : {})
      })),
      artifacts: [{ path: artifact, sha256: hash(artifactData) }]
    }));
    qa[gate] = { status: 'passed', reviewedBy: 'Synthetic fixture only',
      reviewedAt, evidence: [reportPath] };
  }
  const benchmark = {
    schemaVersion: '1.0.0', lessonId: 'demo', contentVersion: '1',
    entrySha256: htmlHash, packageSha256: packageHash,
    reviewedBy: 'Synthetic fixture reviewer', reviewedAt,
    approval: 'approved', superiorityClaim: 'not_claimed',
    comparisons: ['subject.com', 'schoolsplp-lincoln', 'edmentum', 'edgenuity']
      .map(provider => provider === 'subject.com'
        ? { provider, evidenceType: 'public_documentation',
          referenceUrl: 'https://subject.com/',
          checkedAt: reviewedAt,
          notes: 'Synthetic fixture only; this URL is NOT real competitor evidence.' }
        : { provider, evidenceType: 'unavailable',
          notes: 'Synthetic fixture only; no actual competitor observation has occurred.' }),
    scores: { visual: 14, video: 14, interactive: 19, solo: 14,
      rigor: 14, uxAccessibility: 9, feedback: 9 },
    rubricNotes: Object.fromEntries(['visual', 'video', 'interactive', 'solo',
      'rigor', 'uxAccessibility', 'feedback'].map(category =>
      [category, 'Synthetic rationale for testing only; no actual evaluation occurred.'])),
    gaps: [], remediation: [],
    overallNotes: 'Synthetic fixture only; no actual curriculum approval occurred.',
    hardGates: Object.fromEntries(['soloAsynchronous', 'noPeerDependency',
      'deviceInternetOnly', 'printEquivalents', 'studentOnlyPublic']
      .map(gate => [gate, { status: 'passed',
        notes: 'Synthetic fixture only; not a real verified student journey.' }])),
    qaGates: Object.fromEntries(['content', 'pedagogy', 'technical', 'experience']
      .map(gate => [gate, 'passed'])),
    printEquivalents: Object.fromEntries(['lesson', 'unit', 'course']
      .map(scope => [scope, 'lessons/demo/print/' + scope + '.html']))
  };
  const benchmarkPath = 'evidence/demo/benchmark.json';
  const benchmarkBytes = JSON.stringify(benchmark);
  write(benchmarkPath, benchmarkBytes);
  write('catalog/approved.json', JSON.stringify({
    schemaVersion: '1.0.0', generatedAt: null, lessons: [{
      id: 'demo', title: 'Synthetic fixture only', grade: '8', subject: 'Science',
      course: 'Biology', unit: 'Synthetic', version: '1', entry,
      sha256: htmlHash, assets, packageSha256: packageHash,
      benchmark: { path: benchmarkPath, sha256: hash(benchmarkBytes) },
      rights: { status: 'cleared', basis: 'original', notes: 'Synthetic test only',
        reviewedBy: 'Synthetic fixture only', reviewedAt },
      qa
    }]
  }));
  const privateKey = crypto.generateKeyPairSync('ed25519').privateKey;
  fs.writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  const signedAt = new Date();
  const signed = signReviewedBundle(bundle, keyPath, 'private:synthetic-fixture-v1',
    f.recordPath, signedAt);
  assert.equal(signed.lessonId, 'demo');
  assert.equal((fs.statSync(f.recordPath).mode & 0o077), 0);
  const publicKey = path.join(f.dir, 'derived-public.pem');
  fs.writeFileSync(publicKey, crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }));
  assert.equal(verifySignedHandoff(f.recordPath, publicKey, {
    repository: repo, lessonId: 'demo', lessonVersion: '1',
    bundleSha256: signed.bundleSha256
  }, new Date(signedAt.getTime() + 30 * 60_000)).sourceArtifactId, 'private:synthetic-fixture-v1');

  const stageScript = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const digestFlag = '--expected-bundle-sha256=' + signed.bundleSha256;
  const recordFlag = '--signed-handoff-record=' + f.recordPath;
  const keyFlag = '--trusted-producer-public-key=' + publicKey;
  const preflight = (...flags) => spawnSync(process.execPath,
    [stageScript, bundle, ...flags], { encoding: 'utf8', env: { ...process.env, GH_TOKEN: '' } });
  const verified = preflight(digestFlag, recordFlag, keyFlag);
  assert.equal(verified.status, 0, verified.stderr);
  assert.match(verified.stdout, /Signed producer handoff verified/);
  assert.match(verified.stdout, /No GitHub calls, commits, or file copies/);
  const missingKey = preflight(digestFlag, recordFlag);
  assert.notEqual(missingKey.status, 0);
  assert.match(missingKey.stderr, /requires trusted digest, detached record and trusted public key/);
  const incorrectDigest = preflight('--expected-bundle-sha256=' + 'b'.repeat(64),
    recordFlag, keyFlag);
  assert.notEqual(incorrectDigest.status, 0);
  assert.match(incorrectDigest.stderr, /fingerprint mismatch/);
  const wrongKey = path.join(f.dir, 'untrusted-public.pem');
  fs.writeFileSync(wrongKey, crypto.generateKeyPairSync('ed25519').publicKey
    .export({ type: 'spki', format: 'pem' }));
  const untrusted = preflight(digestFlag, recordFlag,
    '--trusted-producer-public-key=' + wrongKey);
  assert.notEqual(untrusted.status, 0);
  assert.match(untrusted.stderr, /Invalid signed producer handoff signature/);
  assert.throws(() => signReviewedBundle(bundle, keyPath, 'private:synthetic-fixture-v1',
    f.recordPath, signedAt), /EEXIST/);
}));
