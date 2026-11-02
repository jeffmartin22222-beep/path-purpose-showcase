import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { evaluateRunnerReadiness } from '../scripts/check-private-runner-readiness.mjs';

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-runner-readiness-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'showcase');
  const privateDir = path.join(temp, 'private');
  fs.mkdirSync(root, { mode: 0o700 });
  fs.mkdirSync(privateDir, { mode: 0o700 });
  const ledger = path.join(privateDir, 'replay.json');
  fs.writeFileSync(ledger, JSON.stringify({ schemaVersion: 1, records: [] }), { mode: 0o600 });
  const key = path.join(privateDir, 'producer.pem');
  const { publicKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(key, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600 });
  const environment = { GH_TOKEN: 'synthetic-not-real', PP_PRIVATE_HANDOFF_LEDGER: ledger,
    PP_TRUSTED_PRODUCER_PUBLIC_KEY: key };
  const commands = {
    'git --version': 'git version 2.47.0', 'gh --version': 'gh version 2.0.0',
    'git remote get-url origin': 'https://github.com/jeffmartin22222-beep/path-purpose-showcase.git',
    'git branch --show-current': 'feature/qa-gated-publishing',
    'git status --porcelain': ''
  };
  const execute = (binary, args) => {
    const command = [binary, ...args].join(' ');
    if (!(command in commands)) throw new Error('Unexpected command');
    return commands[command];
  };
  return { root, ledger, key, environment, commands, run: () =>
    evaluateRunnerReadiness({ repoRoot: root, environment, execute, nodeVersion: '22.16.0' }) };
}

test('valid synthetic local prerequisites are distinguished from verified transfer', t => {
  const f = fixture(t);
  assert.deepEqual(f.run(), { readyForSignedPreflight: true, failures: [] });
});

test('missing token and missing private ledger fail closed without exposing secret', t => {
  const f = fixture(t);
  f.environment.GH_TOKEN = '';
  fs.rmSync(f.ledger);
  const result = f.run();
  assert.equal(result.readyForSignedPreflight, false);
  assert.match(result.failures.join(' '), /GH_TOKEN/);
  assert.match(result.failures.join(' '), /ledger/);
  assert.doesNotMatch(JSON.stringify(result), /synthetic-not-real/);
});

test('dirty checkout and wrong branch block readiness', t => {
  const f = fixture(t);
  f.commands['git branch --show-current'] = 'main';
  f.commands['git status --porcelain'] = ' M index.html';
  const result = f.run();
  assert.equal(result.readyForSignedPreflight, false);
  assert.match(result.failures.join(' '), /branch/);
  assert.match(result.failures.join(' '), /uncommitted/);
});

test('symlinked producer key fails local preflight', t => {
  const f = fixture(t);
  const alias = f.key + '.link';
  fs.symlinkSync(f.key, alias);
  f.environment.PP_TRUSTED_PRODUCER_PUBLIC_KEY = alias;
  assert.match(f.run().failures.join(' '), /public key missing or unsafe/);
});

test('missing ledger history and unresolved lock both block readiness', t => {
  const f = fixture(t);
  fs.writeFileSync(f.ledger, '{}');
  fs.writeFileSync(f.ledger + '.lock', 'pending', { mode: 0o600 });
  const result = f.run();
  assert.match(result.failures.join(' '), /not initialized/);
  assert.match(result.failures.join(' '), /unresolved lock/);
});

test('world-writable key and incorrect key algorithm are rejected', t => {
  const f = fixture(t);
  fs.chmodSync(f.key, 0o666);
  assert.match(f.run().failures.join(' '), /public key missing or unsafe/);
  fs.chmodSync(f.key, 0o600);
  const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  fs.writeFileSync(f.key, publicKey.export({ type: 'spki', format: 'pem' }));
  assert.match(f.run().failures.join(' '), /not Ed25519/);
});
