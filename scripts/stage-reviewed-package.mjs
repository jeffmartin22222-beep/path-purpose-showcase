#!/usr/bin/env node
/**
 * Trusted-runner entrypoint: validated, explicitly reviewed private bundle
 * -> isolated feature branch -> draft PR against the integration branch.
 *
 * This is NOT a scheduled producer connection, a content approval system,
 * or an automatic merge/deploy. A separate private runner with access to the
 * reviewed source, git push credentials and GH_TOKEN must invoke it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from './validate-catalog.mjs';
import { fingerprintReviewedBundle } from './fingerprint-reviewed-bundle.mjs';
import { verifySignedHandoff } from './verify-signed-handoff.mjs';
import { withPrivateHandoffLedger } from './private-handoff-ledger.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = 'jeffmartin22222-beep/path-purpose-showcase';
const base = 'feature/qa-gated-publishing';

function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}
function command(binary, args) {
  return execFileSync(binary, args, {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}
function main() {
  const [sourceArg, ...flags] = process.argv.slice(2);
  requireThat(sourceArg, 'Usage: node scripts/stage-reviewed-package.mjs <private-bundle-dir> [--apply --acknowledge-public-reviewed --expected-bundle-sha256=<trusted-digest> --signed-handoff-record=<independent-json> --trusted-producer-public-key=<trusted-pem>]');
  const digestFlags = flags.filter(x => x.startsWith('--expected-bundle-sha256='));
  const recordFlags = flags.filter(x => x.startsWith('--signed-handoff-record='));
  const keyFlags = flags.filter(x => x.startsWith('--trusted-producer-public-key='));
  requireThat(digestFlags.length <= 1 && recordFlags.length <= 1 && keyFlags.length <= 1,
    'Duplicate digest, signed record or producer key option');
  requireThat(flags.every(x => ['--apply', '--acknowledge-public-reviewed'].includes(x) ||
    /^--expected-bundle-sha256=[a-f0-9]{64}$/.test(x) ||
    /^--signed-handoff-record=.+$/.test(x) ||
    /^--trusted-producer-public-key=.+$/.test(x)), 'Unknown or malformed option');
  const apply = flags.includes('--apply');
  requireThat(!apply || flags.includes('--acknowledge-public-reviewed'),
    'Apply requires explicit human reviewed/public acknowledgement');
  requireThat(!apply || digestFlags.length === 1,
    'Apply requires a trusted independently obtained --expected-bundle-sha256');

  const source = fs.realpathSync(sourceArg);
  const realRoot = fs.realpathSync(root);
  requireThat(source !== realRoot && !source.startsWith(realRoot + path.sep),
    'Private bundle must be outside public Showcase checkout');
  const fingerprint = fingerprintReviewedBundle(source);
  const result = validateCatalog(source);
  requireThat(result.approvedLessons === 1, 'Exactly one reviewed lesson per handoff');
  if (digestFlags.length) {
    const expected = digestFlags[0].split('=')[1];
    requireThat(fingerprint.sha256 === expected, 'Private handoff fingerprint mismatch');
  }
  const lesson = JSON.parse(fs.readFileSync(path.join(source, 'catalog/approved.json'), 'utf8')).lessons[0];
  const reviewBranch = 'feature/review-' + lesson.id + '-' + lesson.packageSha256.slice(0, 12);

  // Preserve credential-first refusal for apply; offline preflight never needs a token.
  if (apply) {
  requireThat(process.env.GH_TOKEN && process.env.GH_TOKEN.trim(),
    'GH_TOKEN required in private runner environment; never place it in this repository');
  }

  // Offline preflight can now verify the complete producer signature and digest
  // without a GitHub token, private ledger, branch write or public file copy.
  // Do not describe an unsigned dry run as a verified producer handoff.
  const provenanceRequested = recordFlags.length > 0 || keyFlags.length > 0;
  requireThat(!provenanceRequested ||
    (recordFlags.length === 1 && keyFlags.length === 1 && digestFlags.length === 1),
    'Signed preflight requires trusted digest, detached record and trusted public key together');
  requireThat(!apply || provenanceRequested,
    'Apply requires independently signed producer record and trusted public key');
  let signed = null;
  if (provenanceRequested) {
    const recordPath = fs.realpathSync(recordFlags[0].slice('--signed-handoff-record='.length));
    const keyPath = fs.realpathSync(keyFlags[0].slice('--trusted-producer-public-key='.length));
    for (const privatePath of [recordPath, keyPath]) {
      requireThat(privatePath !== realRoot && !privatePath.startsWith(realRoot + path.sep) &&
        privatePath !== source && !privatePath.startsWith(source + path.sep),
        'Signed handoff record and trusted key must be independent of bundle and public checkout');
    }
    signed = verifySignedHandoff(recordPath, keyPath, {
      repository: repo, lessonId: lesson.id, lessonVersion: lesson.version,
      bundleSha256: fingerprint.sha256
    });
  }

  // The existing importer validates the destination and copies only referenced files.
  command(process.execPath, ['scripts/import-approved-package.mjs', source]);
  if (!apply) {
    console.log('DRY RUN: package validated; draft PR branch would be', reviewBranch);
    console.log('Private bundle SHA-256:', fingerprint.sha256,
      'files:', fingerprint.fileCount, 'bytes:', fingerprint.totalBytes);
    console.log(signed ? 'Signed producer handoff verified; human QA and rights remain unverified.' :
      'Unsigned structural dry run only; producer provenance NOT verified.');
    console.log('No GitHub calls, commits, or file copies were made.');
    return;
  }

  // A digest computed from the same untrusted bundle is not authentication.
  // The caller must independently verify the expected digest against an
  // immutable producer record before passing --expected-bundle-sha256.
  const remote = command('git', ['remote', 'get-url', 'origin']);
  requireThat([
    'https://github.com/' + repo + '.git',
    'https://github.com/' + repo,
    'git@github.com:' + repo + '.git',
    'git@github.com:' + repo
  ].includes(remote), 'Unexpected git origin; refusing to push');
  requireThat(command('git', ['branch', '--show-current']) === base,
    'Run only from the reviewed integration branch ' + base);
  requireThat(!command('git', ['status', '--porcelain']),
    'Working tree must be clean before staging a public draft PR');
  // A stale integration checkout may run an obsolete approval validator.
  // Refresh the exact remote base without merging or changing the worktree;
  // require the trusted runner to use the latest reviewed gate implementation.
  const localHead = command('git', ['rev-parse', 'HEAD']);
  command('git', ['fetch', '--no-tags', 'origin', 'refs/heads/' + base]);
  requireThat(command('git', ['rev-parse', 'FETCH_HEAD']) === localHead,
    'Integration checkout is stale; refresh and revalidate before staging');
  command('gh', ['--version']);

  // The ledger is private, shared, durable and independent of the public
  // repository and source package. An interrupted push stays pending and
  // requires human GitHub reconciliation; never silently replay a handoff.
  const ledgerPath = process.env.PP_PRIVATE_HANDOFF_LEDGER;
  requireThat(ledgerPath && path.isAbsolute(ledgerPath),
    'PP_PRIVATE_HANDOFF_LEDGER must point to an absolute private replay ledger');
  const ledgerAbsolute = path.resolve(ledgerPath);
  requireThat(ledgerAbsolute !== realRoot && !ledgerAbsolute.startsWith(realRoot + path.sep) &&
    ledgerAbsolute !== source && !ledgerAbsolute.startsWith(source + path.sep),
    'Private replay ledger must be outside public checkout and source bundle');
  const pr = withPrivateHandoffLedger(ledgerAbsolute, {
    sourceArtifactId: signed.sourceArtifactId, lessonId: lesson.id,
    lessonVersion: lesson.version, bundleSha256: fingerprint.sha256
  }, () => {
    // Branch creation is intentionally non-idempotent: repeated packages cannot
    // silently overwrite an earlier review. No force push, merge or deployment.
    command('git', ['switch', '-c', reviewBranch]);
    command(process.execPath, ['scripts/import-approved-package.mjs', source,
      '--apply', '--acknowledge-public-reviewed']);
    requireThat(fingerprintReviewedBundle(source).sha256 === fingerprint.sha256,
      'Private handoff changed during staging; refusing to push');
    command(process.execPath, ['scripts/validate-catalog.mjs']);
    const unitTests = fs.readdirSync(path.join(root, 'tests'))
      .filter(x => x.endsWith('.test.mjs')).sort().map(x => 'tests/' + x);
    command(process.execPath, ['--test', ...unitTests]);

    command('git', ['add', '--', 'catalog/approved.json',
      'lessons/' + lesson.id, 'evidence/' + lesson.id]);
    command('git', ['commit', '-m',
      'Stage reviewed lesson ' + lesson.id + ' (' + lesson.version + ') for independent QA']);
    command('git', ['push', '--set-upstream', 'origin', reviewBranch]);
    const pr = command('gh', ['pr', 'create', '--repo', repo, '--draft',
      '--base', base, '--head', reviewBranch,
      '--title', 'Review curriculum: ' + lesson.title,
      '--body', [
        'PUBLIC DRAFT PR — DO NOT MERGE WITHOUT INDEPENDENT REVIEW.',
        '',
        'Lesson: ' + lesson.id + ' / version ' + lesson.version,
        'Package SHA-256: ' + lesson.packageSha256,
        'Source reviewed and explicitly acknowledged by private runner operator.',
        'CI hashes and static lint do not prove evidence authenticity, rights or physical iOS testing.',
        'Owner approval and staging verification required before any release.'
      ].join('\n')]);
    return pr;
  });
  console.log('Created draft review PR:', pr);
  console.log('Verified signed source artifact:', signed.sourceArtifactId);
  console.log('No merge or deployment was performed.');
}
try { main(); }
catch (error) {
  // Never print environment variables or command stderr; credentials are private.
  console.error('Staging stopped:', error.message.split('\n')[0]);
  process.exitCode = 1;
}
