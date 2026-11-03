import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { rejectSyntheticEvidence } from '../scripts/reject-synthetic-evidence.mjs';

function fixture(work) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-public-evidence-'));
  const write = (relative, data) => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof data === 'string' ? data : JSON.stringify(data));
  };
  const reportPath = 'evidence/demo/technical/report.json';
  const artifactPath = 'evidence/demo/technical/iphone.txt';
  const benchmarkPath = 'evidence/demo/benchmark.json';
  const report = {
    reviewedBy: 'Independent device reviewer',
    checks: [{ id: 'iphone', notes: 'Physical Safari playback and persistence verified.' }],
    artifacts: [{ path: artifactPath }]
  };
  const benchmark = {
    reviewedBy: 'Independent curriculum reviewer',
    overallNotes: 'Reviewed instructional quality and student journey.',
    rubricNotes: { video: 'Short, clear explanations with captions.' },
    comparisons: [{ provider: 'subject.com', notes: 'Publicly documented interaction pattern.' }],
    hardGates: { soloAsynchronous: { notes: 'Student finished independently.' } }
  };
  const catalog = { lessons: [{
    id: 'demo',
    rights: { reviewedBy: 'Rights reviewer', notes: 'Original lesson art.' },
    qa: { technical: { reviewedBy: 'Independent device reviewer', evidence: [reportPath] } },
    benchmark: { path: benchmarkPath }
  }] };
  const save = () => {
    write('catalog/approved.json', catalog);
    write(reportPath, report);
    write(benchmarkPath, benchmark);
  };
  write(artifactPath, 'Physical iPhone Safari evidence summary.');
  save();
  try { work({ root, write, report, benchmark, catalog, save, artifactPath }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('empty approved catalog passes synthetic-evidence publication guard', () => fixture(f => {
  f.catalog.lessons = [];
  f.save();
  assert.equal(rejectSyntheticEvidence(f.root).lessonsChecked, 0);
}));
test('non-synthetic review metadata passes guard without claiming authenticity', () => fixture(f => {
  f.write('lessons/demo/index.html', '<p>A synthetic polymer is an instructional topic.</p>');
  assert.equal(rejectSyntheticEvidence(f.root).lessonsChecked, 1);
}));
test('synthetic or fixture reviewer identity cannot enter public catalog', () => fixture(f => {
  f.catalog.lessons[0].rights.reviewedBy = 'Synthetic fixture reviewer';
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /Synthetic or test-only publication evidence blocked/);
}));
test('fake physical iOS QA notes are rejected', () => fixture(f => {
  f.report.checks[0].notes = 'Synthetic fixture only; no real physical device was tested.';
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /publication evidence blocked/);
}));
test('test-only artifact bytes are rejected even if review notes appear normal', () => fixture(f => {
  f.write(f.artifactPath, 'SYNTHETIC TEST ONLY — NOT ACTUAL QA');
  assert.throws(() => rejectSyntheticEvidence(f.root), /publication evidence blocked/);
}));
test('fabricated benchmark notes are rejected', () => fixture(f => {
  f.benchmark.overallNotes = 'Placeholder approval pending review';
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /publication evidence blocked/);
}));
test('traversal in public evidence reference is rejected', () => fixture(f => {
  f.catalog.lessons[0].benchmark.path = '../outside.json';
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /Unsafe public evidence reference/);
}));

test('synthetic benchmark gaps and remediation are blocked', () => fixture(f => {
  f.benchmark.gaps = ['Placeholder review evidence still pending'];
  f.benchmark.remediation = ['Actual review required'];
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /publication evidence blocked.*benchmark.gaps/);
}));
test('nested QA report metadata and device attestations cannot hide test-only markers', () => fixture(f => {
  f.report.checks[0].deviceMetadata = { testerComment: 'Fixture iPad test only' };
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /publication evidence blocked.*deviceMetadata/);
}));
test('synthetic QA approval metadata is blocked outside reviewer name', () => fixture(f => {
  f.catalog.lessons[0].qa.technical.operatorNotes = 'Synthetic approval, not real QA';
  f.save();
  assert.throws(() => rejectSyntheticEvidence(f.root), /publication evidence blocked.*operatorNotes/);
}));
test('symlinked review evidence path is rejected', () => fixture(f => {
  const target = path.join(f.root, 'evidence/demo/technical/iphone.txt');
  fs.unlinkSync(target);
  fs.symlinkSync(path.join(f.root, 'evidence/demo/benchmark.json'), target);
  assert.throws(() => rejectSyntheticEvidence(f.root), /Symlink in public evidence reference/);
}));
test('symlinked evidence ancestor is rejected', () => fixture(f => {
  const original = path.join(f.root, 'evidence/demo/technical');
  const moved = path.join(f.root, 'evidence/demo/technical-real');
  fs.renameSync(original, moved);
  fs.symlinkSync(moved, original, 'dir');
  assert.throws(() => rejectSyntheticEvidence(f.root), /Symlink in public evidence reference/);
}));
