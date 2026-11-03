import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { evaluateRunnerReadiness } from '../scripts/check-private-runner-readiness.mjs';

const HEAD = 'a'.repeat(40);
const REMOTE_REF = 'refs/heads/feature/qa-gated-publishing';
const PROBE = 'refs/heads/feature/runner-auth-probe-0123456789abcdef';

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-remote-probe-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'showcase');
  const privateDir = path.join(temp, 'private');
  fs.mkdirSync(root, { mode: 0o700 });
  fs.mkdirSync(privateDir, { mode: 0o700 });
  const ledger = path.join(privateDir, 'ledger.json');
  fs.writeFileSync(ledger, JSON.stringify({ schemaVersion: 1, records: [] }), { mode: 0o600 });
  const key = path.join(privateDir, 'producer.pem');
  const { publicKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(key, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600 });
  const environment = { GH_TOKEN: 'synthetic-not-a-token',
    PP_PRIVATE_HANDOFF_LEDGER: ledger, PP_TRUSTED_PRODUCER_PUBLIC_KEY: key };
  const commands = {
    'git --version': 'git version 2.47.0',
    'gh --version': 'gh version 2.0.0',
    'git remote get-url origin': 'https://github.com/jeffmartin22222-beep/path-purpose-showcase.git',
    'git branch --show-current': 'feature/qa-gated-publishing',
    'git status --porcelain': '',
    'gh api --method GET repos/jeffmartin22222-beep/path-purpose-showcase':
      JSON.stringify({ full_name: 'jeffmartin22222-beep/path-purpose-showcase',
        permissions: { push: true } }),
    ['git ls-remote --heads origin ' + REMOTE_REF]: HEAD + '\t' + REMOTE_REF,
    'git rev-parse HEAD': HEAD,
    ['git push --dry-run --porcelain origin HEAD:' + PROBE]:
      '*\tHEAD:' + PROBE + '\t[new branch]'
  };
  const calls = [];
  const execute = (binary, args) => {
    const command = [binary, ...args].join(' ');
    calls.push(command);
    if (!Object.hasOwn(commands, command)) throw new Error('Unexpected command');
    return commands[command];
  };
  const run = (verifyRemote = true) => evaluateRunnerReadiness({
    repoRoot: root, environment, execute, nodeVersion: '22.16.0',
    verifyRemote, probeSuffix: () => '0123456789abcdef'
  });
  return { run, calls, commands };
}

test('remote probe checks API permission, exact base SHA, and a dry-run push without a write', t => {
  const f = fixture(t);
  assert.deepEqual(f.run(), {
    readyForSignedPreflight: true, failures: [], remoteProbePassed: true
  });
  assert.ok(f.calls.includes('git push --dry-run --porcelain origin HEAD:' + PROBE));
  assert.equal(f.calls.some(c => c.startsWith('git push ') && !c.includes('--dry-run')), false);
});

test('remote probe fails closed if GitHub API reports no push permission', t => {
  const f = fixture(t);
  f.commands['gh api --method GET repos/jeffmartin22222-beep/path-purpose-showcase'] =
    JSON.stringify({ full_name: 'jeffmartin22222-beep/path-purpose-showcase',
      permissions: { push: false } });
  const result = f.run();
  assert.equal(result.remoteProbePassed, false);
  assert.match(result.failures.join(' '), /API credential/);
  assert.equal(f.calls.some(c => c.startsWith('git push ')), false);
});

test('remote probe rejects stale integration HEAD before dry-run push', t => {
  const f = fixture(t);
  f.commands['git ls-remote --heads origin ' + REMOTE_REF] =
    'b'.repeat(40) + '\t' + REMOTE_REF;
  const result = f.run();
  assert.equal(result.readyForSignedPreflight, false);
  assert.match(result.failures.join(' '), /Remote integration HEAD/);
  assert.equal(f.calls.some(c => c.startsWith('git push ')), false);
});

test('remote probe fails closed on rejected git push dry run', t => {
  const f = fixture(t);
  f.commands['git push --dry-run --porcelain origin HEAD:' + PROBE] =
    '!\tHEAD:' + PROBE + '\t[remote rejected]';
  const result = f.run();
  assert.equal(result.remoteProbePassed, false);
  assert.match(result.failures.join(' '), /dry-run probe/);
});

test('default local readiness never calls GitHub API or push', t => {
  const f = fixture(t);
  assert.deepEqual(f.run(false), { readyForSignedPreflight: true, failures: [] });
  assert.equal(f.calls.some(c => c.startsWith('gh api') || c.startsWith('git push')), false);
});
