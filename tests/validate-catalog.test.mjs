import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateCatalog, REQUIRED_CHECKS } from '../scripts/validate-catalog.mjs';

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
  const assets = [];
  const packageSha256 = hash(JSON.stringify([{ path: 'lessons/demo/index.html', sha256 }]));
  const qa = {};
  const reviewedAt = '2026-10-31T12:00:00Z';
  for (const [gate, checkIds] of Object.entries(REQUIRED_CHECKS)) {
    const prefix = 'evidence/demo/' + gate + '/';
    const artifactPath = prefix + 'test-record.txt';
    const artifactBytes = 'Synthetic unit-test evidence ONLY; not a real approval';
    write(artifactPath, artifactBytes);
    const reportPath = prefix + 'report.json';
    const report = {
      lessonId: 'demo', version: '1', gate, entrySha256: sha256, packageSha256,
      reviewedBy: 'Fixture only', reviewedAt,
      checks: checkIds.map(id => ({
        id, result: 'passed', notes: 'Synthetic fixture',
        ...(['iphone', 'ipad'].includes(id) ? {
          deviceModel: 'Fixture device', osVersion: 'Fixture OS', testedAt: reviewedAt
        } : {})
      })),
      artifacts: [{ path: artifactPath, sha256: hash(artifactBytes) }]
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
  f.write(reportPath, JSON.stringify(report));
  assert.throws(() => validateCatalog(f.root), /Required QA check missing/);
}));
test('rejects unverified content changes', () => withFixture(f => {
  f.write('lessons/demo/index.html', '<h1>Changed after approval</h1>');
  assert.throws(() => validateCatalog(f.root), /SHA-256 mismatch/);
}));
test('rejects nonexistent evidence artifacts', () => withFixture(f => {
  fs.unlinkSync(path.join(f.root, 'evidence/demo/content/test-record.txt'));
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
    { path: f.lesson.entry, sha256: f.lesson.sha256 }
  ]));
  for (const gate of Object.keys(REQUIRED_CHECKS)) {
    const reportPath = 'evidence/demo/' + gate + '/report.json';
    const report = JSON.parse(fs.readFileSync(path.join(f.root, reportPath), 'utf8'));
    report.entrySha256 = f.lesson.sha256;
    report.packageSha256 = f.lesson.packageSha256;
    f.write(reportPath, JSON.stringify(report));
  }
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
