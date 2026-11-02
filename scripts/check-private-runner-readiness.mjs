#!/usr/bin/env node
/**
 * Read-only operator preflight for the NOT-YET-CONNECTED private producer runner.
 * It checks local prerequisites only. It cannot verify GitHub credentials,
 * storage durability, producer signatures, review authenticity, or approval.
 * Never print credentials, private paths, or private ledger contents.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPECTED_REPO = 'jeffmartin22222-beep/path-purpose-showcase';
const EXPECTED_BRANCH = 'feature/qa-gated-publishing';
const REPO_ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const ORIGINS = new Set([
  `https://github.com/${EXPECTED_REPO}.git`,
  `https://github.com/${EXPECTED_REPO}`,
  `git@github.com:${EXPECTED_REPO}.git`,
  `git@github.com:${EXPECTED_REPO}`
]);

const isInside = (parent, child) => child === parent || child.startsWith(parent + path.sep);
const check = (failures, label, fn) => {
  try { if (!fn()) failures.push(label); }
  catch { failures.push(label); }
};

/** Local-only, dependency-injectable checks. Never prints secrets or paths. */
export function evaluateRunnerReadiness({
  repoRoot = REPO_ROOT,
  environment = process.env,
  filesystem = fs,
  execute = (binary, args) => execFileSync(binary, args, {
    cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000
  }).trim(),
  nodeVersion = process.versions.node
} = {}) {
  const failures = [];
  const root = path.resolve(repoRoot);
  const version = Number.parseInt(nodeVersion.split('.')[0], 10);
  check(failures, 'Node.js 22 or newer required', () => Number.isInteger(version) && version >= 22);
  check(failures, 'Expected Showcase checkout is missing or redirected', () =>
    filesystem.realpathSync(root) === root && filesystem.statSync(root).isDirectory());
  check(failures, 'Git CLI unavailable', () => execute('git', ['--version']).startsWith('git version'));
  check(failures, 'GitHub CLI unavailable', () => execute('gh', ['--version']).startsWith('gh version'));
  check(failures, 'Wrong Git remote', () => ORIGINS.has(execute('git', ['remote', 'get-url', 'origin'])));
  check(failures, 'Not on integration branch', () =>
    execute('git', ['branch', '--show-current']) === EXPECTED_BRANCH);
  check(failures, 'Checkout has uncommitted changes', () =>
    execute('git', ['status', '--porcelain']) === '');
  check(failures, 'GH_TOKEN is not provisioned', () =>
    typeof environment.GH_TOKEN === 'string' && environment.GH_TOKEN.trim().length > 0);

  const safePrivateFile = (candidate, label, permissions) => {
    check(failures, label, () => {
      if (typeof candidate !== 'string' || !path.isAbsolute(candidate)) return false;
      const absolute = path.resolve(candidate);
      if (isInside(root, absolute) || filesystem.realpathSync(absolute) !== absolute ||
          filesystem.realpathSync(path.dirname(absolute)) !== path.dirname(absolute)) return false;
      const parent = filesystem.statSync(path.dirname(absolute));
      const stat = filesystem.lstatSync(absolute);
      return parent.isDirectory() && (parent.mode & 0o002) === 0 &&
        stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
        (stat.mode & permissions) === 0 && stat.size > 0;
    });
  };

  const ledger = environment.PP_PRIVATE_HANDOFF_LEDGER;
  safePrivateFile(ledger, 'Durable private ledger missing or unsafe (0600 required)', 0o077);
  if (!failures.includes('Durable private ledger missing or unsafe (0600 required)')) {
    check(failures, 'Private replay ledger is not initialized with valid header', () => {
      const stat = filesystem.statSync(ledger);
      if (stat.size > 16 * 1024 * 1024) return false;
      const data = JSON.parse(filesystem.readFileSync(ledger, 'utf8'));
      return data?.schemaVersion === 1 && Array.isArray(data.records) && data.records.length <= 100000;
    });
    check(failures, 'Private ledger has an unresolved lock; reconcile before staging', () =>
      !filesystem.existsSync(ledger + '.lock'));
  }

  const key = environment.PP_TRUSTED_PRODUCER_PUBLIC_KEY;
  safePrivateFile(key, 'Trusted producer public key missing or unsafe', 0o022);
  if (!failures.includes('Trusted producer public key missing or unsafe')) {
    check(failures, 'Trusted producer public key is not Ed25519', () => {
      const stat = filesystem.statSync(key);
      if (stat.size > 16384) return false;
      const parsed = crypto.createPublicKey(filesystem.readFileSync(key));
      return parsed.asymmetricKeyType === 'ed25519';
    });
  }
  return { readyForSignedPreflight: failures.length === 0, failures };
}

function main() {
  const { readyForSignedPreflight, failures } = evaluateRunnerReadiness();
  if (!readyForSignedPreflight) {
    console.error('Private runner prerequisites incomplete:');
    for (const failure of failures) console.error('- ' + failure);
    process.exitCode = 1;
    return;
  }
  console.log('Local private runner prerequisites passed. No credentials were used.');
  console.log('NOT verified: producer storage/transport, token authorization, remote freshness,');
  console.log('ledger durability, independent signed bundle, genuine QA, or owner approval.');
  console.log('Next: use stage-reviewed-package.mjs signed dry run with an independently delivered bundle.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
