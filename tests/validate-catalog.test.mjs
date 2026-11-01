import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateCatalog, REQUIRED_CHECKS } from '../scripts/validate-catalog.mjs';
import { fingerprintReviewedBundle } from '../scripts/fingerprint-reviewed-bundle.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-showcase-'));
  const write = (relative, content) => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };
  const html = '<!doctype html><html><title>Fixture</title><body>Fixture</body></html>';
  const sha256 = hash(html);
  write('lessons/demo/index.html', html);
  const assets = ['lesson', 'unit', 'course'].map(scope => {
    const relative = 'lessons/demo/print/' + scope + '.html';
    const html = '<!doctype html><html><body><main data-print-scope="' + scope +
      '"><h1>Synthetic ' + scope + ' print equivalent</h1><p>' +
      'This is synthetic test-only accessible print representation, not a production workbook or verified PDF.' +
      '</p></main></body></html>';
    write(relative, html);
    return { path: relative, sha256: hash(html) };
  });
  const packageSha256 = hash(JSON.stringify([
    { path: 'lessons/demo/index.html', sha256 }, ...assets
  ].sort((a, b) => a.path.localeCompare(b.path, 'en'))));
  const qa = {};
  const reviewedAt = '2026-10-31T12:00:00Z';
  for (const [gate, checkIds] of Object.entries(REQUIRED_CHECKS)) {
    const prefix = 'evidence/demo/' + gate + '/';
    const artifacts = checkIds.map(id => {
      const artifactPath = prefix + id + '-test-record.txt';
      const artifactBytes = 'Synthetic unit-test evidence ONLY for ' + id + '; not a real approval';
      write(artifactPath, artifactBytes);
      return { path: artifactPath, sha256: hash(artifactBytes) };
    });
    const reportPath = prefix + 'report.json';
    const report = {
      schemaVersion: '1.1.0', lessonId: 'demo', version: '1', gate, entrySha256: sha256, packageSha256,
      reviewedBy: 'Fixture only', reviewedAt,
      checks: checkIds.map(id => ({
        id, result: 'passed', notes: 'Synthetic fixture',
        artifactPaths: [prefix + id + '-test-record.txt'],
        ...(['iphone', 'ipad'].includes(id) ? {
          deviceModel: id === 'iphone' ? 'Test iPhone 16' : 'Test iPad Air',
          osVersion: id === 'iphone' ? 'iOS 18.0' : 'iPadOS 18.0',
          browserName: 'Safari', testMethod: 'physical_device', testedAt: reviewedAt
        } : {})
      })),
      artifacts
    };
    write(reportPath, JSON.stringify(report));
    qa[gate] = { status: 'passed', reviewedBy: 'Fixture only', reviewedAt, evidence: [reportPath] };
  }
  const lesson = {
    id: 'demo', title: 'Fixture', grade: '8', subject: 'Science', course: 'Biology',
    unit: 'Cells', version: '1', entry: 'lessons/demo/index.html', sha256, assets, packageSha256,
    rights: { status: 'cleared', basis: 'original', notes: 'Synthetic fixture',
      reviewedBy: 'Fixture only', reviewedAt },
    qa
  };
  const benchmark = {
    schemaVersion: '1.0.0', lessonId: 'demo', contentVersion: '1',
    entrySha256: sha256, packageSha256, reviewedBy: 'Synthetic fixture reviewer',
    reviewedAt, approval: 'approved', superiorityClaim: 'not_claimed',
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
      [category, 'Synthetic test rationale only; not an actual quality assessment.'])),
    gaps: [], remediation: [],
    overallNotes: 'Synthetic fixture only; no real lesson was reviewed or approved.',
    hardGates: Object.fromEntries(['soloAsynchronous', 'noPeerDependency',
      'deviceInternetOnly', 'printEquivalents', 'studentOnlyPublic']
      .map(gate => [gate, { status: 'passed',
        notes: 'Synthetic fixture declaration only; not verified for real students.' }])),
    qaGates: Object.fromEntries(['content', 'pedagogy', 'technical', 'experience']
      .map(gate => [gate, 'passed'])),
    printEquivalents: Object.fromEntries(['lesson', 'unit', 'course']
      .map(scope => [scope, 'lessons/demo/print/' + scope + '.html']))
  };
  const benchmarkPath = 'evidence/demo/benchmark.json';
  const benchmarkBytes = JSON.stringify(benchmark);
  write(benchmarkPath, benchmarkBytes);
  lesson.benchmark = { path: benchmarkPath, sha256: hash(benchmarkBytes) };
  const catalog = { schemaVersion: '1.0.0', generatedAt: null, lessons: [lesson] };
  const save = () => write('catalog/approved.json', JSON.stringify(catalog));
  save();
  return { root, lesson, catalog, save, write };
}
function withFixture(fn) {
  const f = fixture();
  try { fn(f); } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
}
test('empty approved catalog is allowed only when no draft files are public', () => withFixture(f => {
  f.catalog.lessons = []; f.save();
  fs.rmSync(path.join(f.root, 'lessons'), { recursive: true, force: true });
  fs.rmSync(path.join(f.root, 'evidence'), { recursive: true, force: true });
  assert.equal(validateCatalog(f.root).approvedLessons, 0);
}));
test('fully structured fixture passes', () => withFixture(f => {
  assert.equal(validateCatalog(f.root).approvedLessons, 1);
}));
test('rejects missing required QA check', () => withFixture(f => {
  const reportPath = 'evidence/demo/technical/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  report.checks = report.checks.filter(x => x.id !== 'ipad');
  report.artifacts = report.artifacts.filter(x => !x.path.endsWith('/ipad-test-record.txt'));
  fs.unlinkSync(path.join(f.root, 'evidence/demo/technical/ipad-test-record.txt'));
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Required QA check missing/);
}));
test('rejects unverified content changes', () => withFixture(f => {
  f.write('lessons/demo/index.html', '<h1>Changed after approval</h1>');
  assert.throws(() => validateCatalog(f.root), /SHA-256 mismatch/);
}));
test('rejects nonexistent evidence artifacts', () => withFixture(f => {
  fs.unlinkSync(path.join(f.root, 'evidence/demo/content/standards-test-record.txt'));
  assert.throws(() => validateCatalog(f.root), /ENOENT/);
}));
test('rejects path traversal', () => withFixture(f => {
  f.lesson.qa.content.evidence = ['evidence/demo/content/../../../../outside.json'];
  f.save();
  assert.throws(() => validateCatalog(f.root), /Unsafe file path/);
}));
test('rejects missing rights clearance', () => withFixture(f => {
  f.lesson.rights.status = 'pending'; f.save();
  assert.throws(() => validateCatalog(f.root), /Missing cleared content rights/);
}));
test('rejects missing physical iPad metadata', () => withFixture(f => {
  const reportPath = 'evidence/demo/technical/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  delete report.checks.find(x => x.id === 'ipad').deviceModel;
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Physical device test metadata required/);
}));

test('rejects emulation or unspecified physical Safari evidence', () => {
  for (const mutation of [
    check => { delete check.testMethod; },
    check => { check.testMethod = 'emulated'; },
    check => { check.browserName = 'Chromium'; }
  ]) withFixture(f => {
    const p = 'evidence/demo/technical/report.json';
    const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
    mutation(report.checks.find(x => x.id === 'ipad'));
    f.write(p, JSON.stringify(report));
    assert.throws(() => validateCatalog(f.root), /Physical Safari device evidence required/);
  });
});
test('rejects simulator labels and mismatched iOS device evidence', () => {
  for (const mutation of [
    check => { check.deviceModel = 'Chromium iPad emulator'; },
    check => { check.deviceModel = 'Test iPhone 16'; },
    check => { check.osVersion = 'Windows 11'; }
  ]) withFixture(f => {
    const p = 'evidence/demo/technical/report.json';
    const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
    mutation(report.checks.find(x => x.id === 'ipad'));
    f.write(p, JSON.stringify(report));
    assert.throws(() => validateCatalog(f.root), /Physical iOS device metadata mismatch/);
  });
});
test('rejects unlisted lesson assets', () => withFixture(f => {
  f.write('lessons/demo/unreviewed-video.mp4', 'Unreviewed asset');
  assert.throws(() => validateCatalog(f.root), /unlisted files/);
}));
test('rejects a forged package digest', () => withFixture(f => {
  f.lesson.packageSha256 = '0'.repeat(64); f.save();
  assert.throws(() => validateCatalog(f.root), /Package SHA-256 mismatch/);
}));

test('reviewed package import dry-run does not write to Showcase', () => withFixture(f => {
  const importer = fileURLToPath(new URL('../scripts/import-approved-package.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [importer, f.root], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /DRY RUN/);
}));

test('rejects orphaned lesson folders when the catalog is empty', () => withFixture(f => {
  f.catalog.lessons = []; f.save();
  assert.throws(() => validateCatalog(f.root), /Unapproved or unsupported lessons directory entry/);
}));
test('rejects unlisted evidence files that could leak private review materials', () => withFixture(f => {
  f.write('evidence/demo/technical/private-notes.txt', 'Do not publish');
  assert.throws(() => validateCatalog(f.root), /Unreferenced evidence file/);
}));

function repinFixtureHtml(f) {
  const bytes = fs.readFileSync(path.join(f.root, f.lesson.entry));
  f.lesson.sha256 = hash(bytes);
  f.lesson.packageSha256 = hash(JSON.stringify([
    { path: f.lesson.entry, sha256: f.lesson.sha256 }, ...f.lesson.assets
  ].sort((a, b) => a.path.localeCompare(b.path, 'en'))));
  for (const gate of Object.keys(REQUIRED_CHECKS)) {
    const reportPath = 'evidence/demo/' + gate + '/report.json';
    const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
    report.entrySha256 = f.lesson.sha256;
    report.packageSha256 = f.lesson.packageSha256;
    f.write(reportPath, JSON.stringify(report));
  }
  const benchmarkPath = f.lesson.benchmark.path;
  const benchmark = JSON.parse(fs.readFileSync(path.join(f.root, benchmarkPath), 'utf8'));
  benchmark.entrySha256 = f.lesson.sha256;
  benchmark.packageSha256 = f.lesson.packageSha256;
  const benchmarkBytes = JSON.stringify(benchmark);
  f.write(benchmarkPath, benchmarkBytes);
  f.lesson.benchmark.sha256 = hash(benchmarkBytes);
  f.save();
}
test('catalog rejects remote HTML links even if all hashes and reports are updated', () => withFixture(f => {
  f.write(f.lesson.entry, '<!doctype html><a href="https://example.com/">External link</a>');
  repinFixtureHtml(f);
  assert.throws(() => validateCatalog(f.root), /External dependency or link/);
}));
test('catalog rejects teacher-only text even if all hashes and reports are updated', () => withFixture(f => {
  f.write(f.lesson.entry, '<!doctype html><p>Teacher-only answer key</p>');
  repinFixtureHtml(f);
  assert.throws(() => validateCatalog(f.root), /Potential secret or teacher-only/);
}));

test('trusted-runner handoff dry-run needs no credentials and never pushes', () => withFixture(f => {
  const staging = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [staging, f.root], {
    encoding: 'utf8', env: { ...process.env, GH_TOKEN: '' }
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /DRY RUN/);
  assert.match(run.stdout, /No GitHub calls, commits, or file copies/);
}));
test('trusted-runner refuses apply without human acknowledgement', () => withFixture(f => {
  const staging = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [staging, f.root, '--apply'], {
    encoding: 'utf8', env: { ...process.env, GH_TOKEN: '' }
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /explicit human reviewed\/public acknowledgement/);
}));
test('trusted-runner refuses upload without private credentials', () => withFixture(f => {
  const staging = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const digest = fingerprintReviewedBundle(f.root).sha256;
  const run = spawnSync(process.execPath, [staging, f.root,
    '--apply', '--acknowledge-public-reviewed', '--expected-bundle-sha256=' + digest], {
    encoding: 'utf8', env: { ...process.env, GH_TOKEN: '' }
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /GH_TOKEN required/);
}));

test('private handoff fingerprint is deterministic and changes when reviewed bytes change', () => withFixture(f => {
  const first = fingerprintReviewedBundle(f.root);
  assert.match(first.sha256, /^[a-f0-9]{64}$/);
  assert.equal(fingerprintReviewedBundle(f.root).sha256, first.sha256);
  f.write('lessons/demo/index.html', '<p>Changed bytes</p>');
  assert.notEqual(fingerprintReviewedBundle(f.root).sha256, first.sha256);
}));
test('private handoff refuses unrelated private files and symlinks', () => withFixture(f => {
  f.write('private/teacher-answers.json', '{"secret":true}');
  assert.throws(() => fingerprintReviewedBundle(f.root), /Unexpected file/);
  fs.rmSync(path.join(f.root, 'private'), { recursive: true, force: true });
  fs.symlinkSync(path.join(f.root, 'lessons/demo/index.html'),
    path.join(f.root, 'lessons/demo/linked.html'));
  assert.throws(() => fingerprintReviewedBundle(f.root), /Symlink in private handoff/);
}));
test('private fingerprint rejects hardlinks to files outside the reviewed bundle', () => withFixture(f => {
  const external = path.join(os.tmpdir(), 'pp-external-' + path.basename(f.root));
  fs.writeFileSync(external, 'Synthetic private file; never publish');
  try {
    fs.linkSync(external, path.join(f.root, 'evidence/demo/content/linked.txt'));
    assert.throws(() => fingerprintReviewedBundle(f.root), /Hardlinked file in private handoff/);
  } finally {
    fs.rmSync(external, { force: true });
  }
}));
test('standalone importer rejects a hardlinked source even if its manifest hashes match', () => withFixture(f => {
  const external = path.join(os.tmpdir(), 'pp-index-' + path.basename(f.root));
  const entry = path.join(f.root, 'lessons/demo/index.html');
  fs.copyFileSync(entry, external);
  try {
    fs.unlinkSync(entry);
    fs.linkSync(external, entry);
    // The source content still matches the approved hashes. Link topology is the risk.
    assert.equal(validateCatalog(f.root).approvedLessons, 1);
    const importer = fileURLToPath(new URL('../scripts/import-approved-package.mjs', import.meta.url));
    const run = spawnSync(process.execPath, [importer, f.root], { encoding: 'utf8' });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /Source file is not an independent regular file/);
  } finally {
    fs.rmSync(external, { force: true });
  }
}));

test('staging apply refuses an unpinned bundle even with a token', () => withFixture(f => {
  const staging = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [staging, f.root,
    '--apply', '--acknowledge-public-reviewed'], {
    encoding: 'utf8', env: { ...process.env, GH_TOKEN: 'test-only-not-a-token' }
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /trusted independently obtained --expected-bundle-sha256/);
}));
test('staging rejects mismatched independent source fingerprint before GitHub', () => withFixture(f => {
  const staging = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [staging, f.root,
    '--apply', '--acknowledge-public-reviewed', '--expected-bundle-sha256=' + '0'.repeat(64)], {
    encoding: 'utf8', env: { ...process.env, GH_TOKEN: 'test-only-not-a-token' }
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Private handoff fingerprint mismatch/);
}));

test('staging refuses apply without separately signed provenance even with digest and token', () => withFixture(f => {
  const staging = fileURLToPath(new URL('../scripts/stage-reviewed-package.mjs', import.meta.url));
  const digest = fingerprintReviewedBundle(f.root).sha256;
  const run = spawnSync(process.execPath, [staging, f.root,
    '--apply', '--acknowledge-public-reviewed', '--expected-bundle-sha256=' + digest], {
    encoding: 'utf8', env: { ...process.env, GH_TOKEN: 'test-only-not-a-token' }
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /independently signed producer record and trusted public key/);
}));

test('rejects unreviewed extra catalog metadata, including teacher answer keys', () => withFixture(f => {
  f.lesson.teacherAnswerKey = 'Synthetic private answer; must never publish'; f.save();
  assert.throws(() => validateCatalog(f.root), /Unexpected public catalog field/);
}));
test('rejects unexpected nested review fields', () => withFixture(f => {
  f.lesson.qa.technical.teacherOnly = 'Synthetic internal note'; f.save();
  assert.throws(() => validateCatalog(f.root), /Unexpected public catalog field/);
}));
test('scans catalog notes for credential-like strings', () => withFixture(f => {
  f.lesson.rights.notes = 'api_key:SensitiveToken123456'; f.save();
  assert.throws(() => validateCatalog(f.root), /Potential secret or teacher-only material/);
}));

test('rejects non-UTC or structured catalog generation metadata', () => withFixture(f => {
  f.catalog.generatedAt = { privateReviewNotes: 'Synthetic internal only' };
  f.save();
  assert.throws(() => validateCatalog(f.root), /Invalid catalog generation timestamp/);
}));
test('rejects unexpected fields in public QA reports', () => withFixture(f => {
  const reportPath = 'evidence/demo/technical/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  report.internalReviewMemo = 'Synthetic private notes must never publish';
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Unexpected public catalog field/);
}));
test('rejects unreviewed metadata nested in QA checks', () => withFixture(f => {
  const reportPath = 'evidence/demo/content/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  report.checks[0].privateScoringGuide = 'Synthetic teacher-only content';
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Unexpected public catalog field/);
}));
test('rejects unexpected public evidence artifact fields', () => withFixture(f => {
  const reportPath = 'evidence/demo/pedagogy/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  report.artifacts[0].privateSourcePath = '/private/synthetic';
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Unexpected public catalog field/);
}));
test('rejects duplicate QA checks even when each says passed', () => withFixture(f => {
  const reportPath = 'evidence/demo/technical/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  report.checks.push({ ...report.checks[0] });
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Duplicate QA check/);
}));
test('rejects duplicate evidence artifact references', () => withFixture(f => {
  const reportPath = 'evidence/demo/experience/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
  report.artifacts.push({ ...report.artifacts[0] });
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Duplicate evidence artifact/);
}));

function changeBenchmark(f, mutate) {
  const p = f.lesson.benchmark.path;
  const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
  mutate(report);
  const bytes = JSON.stringify(report);
  f.write(p, bytes);
  f.lesson.benchmark.sha256 = hash(bytes);
  f.save();
}
test('benchmark is required for every approved lesson', () => withFixture(f => {
  delete f.lesson.benchmark; f.save();
  assert.throws(() => validateCatalog(f.root), /Invalid benchmark fields/);
}));
test('benchmark rejects scores below 90', () => withFixture(f => {
  changeBenchmark(f, r => { r.scores.visual = 11; r.scores.video = 11; });
  assert.throws(() => validateCatalog(f.root), /Benchmark score below 90/);
}));
test('benchmark rejects weak critical category even with high total', () => withFixture(f => {
  changeBenchmark(f, r => { r.scores.interactive = 13; });
  assert.throws(() => validateCatalog(f.root), /Benchmark weak\/invalid category/);
}));
test('benchmark rejects content version mismatch', () => withFixture(f => {
  changeBenchmark(f, r => { r.contentVersion = 'unreviewed-new-version'; });
  assert.throws(() => validateCatalog(f.root), /Benchmark content version\/hash mismatch/);
}));
test('benchmark rejects unverified approval', () => withFixture(f => {
  changeBenchmark(f, r => { r.approval = 'pending'; });
  assert.throws(() => validateCatalog(f.root), /human signoff/);
}));
test('benchmark rejects fabricated superiority claim', () => withFixture(f => {
  changeBenchmark(f, r => { r.superiorityClaim = 'better_than_subject'; });
  assert.throws(() => validateCatalog(f.root), /superiority claim/);
}));
test('benchmark rejects missing competitor reference', () => withFixture(f => {
  changeBenchmark(f, r => { r.comparisons = r.comparisons.filter(x => x.provider !== 'subject.com'); });
  assert.throws(() => validateCatalog(f.root), /missing competitor comparison/);
}));
test('benchmark rejects marketing claim posing as dated observation', () => withFixture(f => {
  changeBenchmark(f, r => {
    r.comparisons[0].evidenceType = 'direct_observation';
    r.comparisons[0].referenceUrl = 'http://untrusted.invalid/claim';
  });
  assert.throws(() => validateCatalog(f.root), /Missing dated HTTPS comparison source/);
}));
test('benchmark rejects failed device-only hard gate', () => withFixture(f => {
  changeBenchmark(f, r => { r.hardGates.deviceInternetOnly.status = 'unknown'; });
  assert.throws(() => validateCatalog(f.root), /Benchmark hard gate not verified/);
}));
test('benchmark rejects four-pass QA mismatch', () => withFixture(f => {
  changeBenchmark(f, r => { r.qaGates.technical = 'pending'; });
  assert.throws(() => validateCatalog(f.root), /Benchmark four-pass QA mismatch/);
}));
test('benchmark rejects missing print-equivalent asset', () => withFixture(f => {
  changeBenchmark(f, r => { r.printEquivalents.course = 'lessons/demo/print/missing.html'; });
  assert.throws(() => validateCatalog(f.root), /Missing approved print-equivalent asset/);
}));
test('benchmark rejects required peer work', () => withFixture(f => {
  f.write(f.lesson.entry, '<!doctype html><main>Work with a partner to finish.</main>');
  repinFixtureHtml(f);
  assert.throws(() => validateCatalog(f.root), /Potential required peer dependency/);
}));
test('benchmark rejects required supplies', () => withFixture(f => {
  f.write(f.lesson.entry, '<!doctype html><main>Buy scissors to complete this lesson.</main>');
  repinFixtureHtml(f);
  assert.throws(() => validateCatalog(f.root), /Potential required physical material/);
}));

test('benchmark blocks common asynchronous peer and adult dependencies', () => {
  for (const instruction of [
    'Reply to two classmates before moving on.',
    "Wait for your teacher's grade before proceeding.",
    'Attend a live class tomorrow.',
    'Ask a parent to help you finish.',
    'Join a group to complete the project.'
  ]) withFixture(f => {
    f.write(f.lesson.entry, '<!doctype html><main>' + instruction + '</main>');
    repinFixtureHtml(f);
    assert.throws(() => validateCatalog(f.root), /Potential required peer dependency/);
  });
});
test('benchmark blocks mandatory supplies, printing, and outdoor travel', () => {
  for (const instruction of [
    'You must use a pencil to complete this.',
    'Use a notebook for your answers.',
    'You need to print this worksheet.',
    'Print out the worksheet.',
    'Go outside to observe plants.',
    'Required supplies: scissors'
  ]) withFixture(f => {
    f.write(f.lesson.entry, '<!doctype html><main>' + instruction + '</main>');
    repinFixtureHtml(f);
    assert.throws(() => validateCatalog(f.root), /Potential required physical material/);
  });
});
test('benchmark allows independent digital work and genuinely optional supplies', () => withFixture(f => {
  f.write(f.lesson.entry, '<!doctype html><main>' +
    'Work independently using the digital simulation. No printer, paper, or supplies are required. ' +
    'You can optionally sketch with a pencil, but the digital canvas is equivalent. ' +
    'Your teacher may review work asynchronously; continue now.</main>');
  repinFixtureHtml(f);
  assert.equal(validateCatalog(f.root).approvedLessons, 1);
}));

test('benchmark hash tampering is rejected', () => withFixture(f => {
  f.write(f.lesson.benchmark.path, '{"fake":"record"}');
  assert.throws(() => validateCatalog(f.root), /Benchmark SHA-256 mismatch/);
}));

test('benchmark rejects all-unavailable competitive references', () => withFixture(f => {
  changeBenchmark(f, r => {
    r.comparisons = r.comparisons.map(x => ({
      provider: x.provider, evidenceType: 'unavailable',
      notes: 'No actual source is available; independent comparison must be reviewed.'
    }));
  });
  assert.throws(() => validateCatalog(f.root), /lacks a verifiable comparison reference/);
}));

test('benchmark rejects placeholder, reserved and IP-only comparison URLs', () => {
  for (const url of [
    'https://example.invalid/synthetic-test-reference',
    'https://docs.example.com/reference',
    'https://localhost/benchmark',
    'https://127.0.0.1/reference',
    'https://198.51.100.3/reference'
  ]) withFixture(f => {
    changeBenchmark(f, r => { r.comparisons[0].referenceUrl = url; });
    assert.throws(() => validateCatalog(f.root), /Missing dated HTTPS comparison source/);
  });
});
test('benchmark rejects future-dated human approval', () => withFixture(f => {
  changeBenchmark(f, r => { r.reviewedAt = '2099-01-01T12:00:00Z'; });
  assert.throws(() => validateCatalog(f.root), /Benchmark review timestamp is in the future/);
}));
test('benchmark cannot predate four-pass QA approval', () => withFixture(f => {
  changeBenchmark(f, r => { r.reviewedAt = '2026-10-30T12:00:00Z'; });
  assert.throws(() => validateCatalog(f.root), /Benchmark predates required rights or four-pass QA review/);
}));
test('benchmark cannot predate rights clearance', () => withFixture(f => {
  f.lesson.rights.reviewedAt = '2026-11-01T12:00:00Z'; f.save();
  assert.throws(() => validateCatalog(f.root), /Benchmark predates required rights or four-pass QA review/);
}));
test('benchmark cannot approve comparison checked after signoff', () => withFixture(f => {
  changeBenchmark(f, r => { r.comparisons[0].checkedAt = '2026-11-01T12:00:00Z'; });
  assert.throws(() => validateCatalog(f.root), /Comparison checked after benchmark signoff/);
}));

test('rejects physical iPad evidence dated after technical QA approval', () => withFixture(f => {
  const p = 'evidence/demo/technical/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
  report.checks.find(x => x.id === 'ipad').testedAt = '2026-11-01T12:00:00Z';
  f.write(p, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Physical device test occurred after QA signoff/);
}));
test('rejects future-dated rights and QA signoffs', () => {
  withFixture(f => {
    f.lesson.rights.reviewedAt = '2099-01-01T12:00:00Z'; f.save();
    assert.throws(() => validateCatalog(f.root), /Future-dated rights or QA approval/);
  });
  withFixture(f => {
    f.lesson.qa.content.reviewedAt = '2099-01-01T12:00:00Z'; f.save();
    assert.throws(() => validateCatalog(f.root), /Future-dated rights or QA approval/);
  });
});

test('rejects unversioned or outdated QA evidence reports', () => withFixture(f => {
  const p = 'evidence/demo/content/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
  delete report.schemaVersion;
  f.write(p, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Evidence does not match approved lesson/);
}));
test('rejects missing or duplicate per-check artifact references', () => {
  for (const mutation of [
    check => { delete check.artifactPaths; },
    check => { check.artifactPaths = []; },
    check => { check.artifactPaths.push(check.artifactPaths[0]); }
  ]) withFixture(f => {
    const p = 'evidence/demo/content/report.json';
    const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
    mutation(report.checks[0]);
    f.write(p, JSON.stringify(report));
    assert.throws(() => validateCatalog(f.root), /Missing or duplicate check-linked QA artifacts/);
  });
});
test('rejects check references not pinned to hashed report artifacts', () => withFixture(f => {
  const p = 'evidence/demo/content/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
  report.checks[0].artifactPaths = ['evidence/demo/content/nonexistent.txt'];
  f.write(p, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /QA check references unverified artifact/);
}));
test('rejects unrelated unlinked QA artifacts', () => withFixture(f => {
  const p = 'evidence/demo/content/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
  const relative = 'evidence/demo/content/unlinked.txt';
  f.write(relative, 'Synthetic unlinked evidence');
  report.artifacts.push({ path: relative, sha256: hash('Synthetic unlinked evidence') });
  f.write(p, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Unlinked QA evidence artifact/);
}));
test('rejects reused iPhone and iPad physical evidence', () => withFixture(f => {
  const p = 'evidence/demo/technical/report.json';
  const report = JSON.parse(fs.readFileSync(path.join(f.root, p), 'utf8'));
  report.checks.find(x => x.id === 'ipad').artifactPaths =
    [...report.checks.find(x => x.id === 'iphone').artifactPaths];
  // The original iPad artifact is still linked by another check to isolate
  // the physical-device distinction from the unlinked-artifact rule.
  report.checks.find(x => x.id === 'video').artifactPaths.push(
    'evidence/demo/technical/ipad-test-record.txt');
  f.write(p, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /iPhone and iPad must have distinct physical test artifacts/);
}));
