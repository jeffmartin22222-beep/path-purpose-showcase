import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReviewDiff, validateReviewCatalogDelta } from '../scripts/validate-review-pr-diff.mjs';

const valid = {
  headRef: 'feature/review-inside-the-cell-012345abcdef',
  headRepo: 'jeffmartin22222-beep/path-purpose-showcase',
  baseRef: 'feature/qa-gated-publishing',
  changes: [
    { status: 'M', file: 'catalog/approved.json', mode: '100644' },
    { status: 'A', file: 'lessons/inside-the-cell/index.html', mode: '100644' },
    { status: 'A', file: 'evidence/inside-the-cell/qa.json', mode: '100644' }
  ]
};
const check = (changes, overrides = {}) => validateReviewDiff({ ...valid, changes, ...overrides });
test('accepts one content-only review PR', () => {
  assert.deepEqual(check(valid.changes), { lessonId: 'inside-the-cell', fileCount: 3 });
});
test('rejects non-review head and wrong base', () => {
  assert.throws(() => check(valid.changes, { headRef: 'feature/qa-gated-publishing' }), /branch format/);
  assert.throws(() => check(valid.changes, { baseRef: 'main' }), /integration branch/);
});
test('rejects forked review PRs even with a plausible branch name and allowed paths', () => {
  assert.throws(() => check(valid.changes, { headRepo: 'untrusted-fork/path-purpose-showcase' }),
    /trusted Showcase repository/);
  assert.throws(() => check(valid.changes, { headRepo: undefined }),
    /trusted Showcase repository/);
});
test('rejects changes to workflows or validators', () => {
  for (const file of ['.github/workflows/validate-catalog.yml', 'scripts/validate-catalog.mjs']) {
    assert.throws(() => check([...valid.changes, { status: 'M', file, mode: '100644' }]), /cannot change/);
  }
});
test('rejects unrelated lesson or evidence paths', () => {
  for (const file of ['lessons/other/index.html', 'evidence/other/qa.json']) {
    assert.throws(() => check([...valid.changes, { status: 'A', file, mode: '100644' }]), /cannot change/);
  }
});
test('rejects edits to previously reviewed assets', () => {
  assert.throws(() => check(valid.changes.map(x => x.file.endsWith('index.html') ? { ...x, status: 'M' } : x)), /must be new/);
});
test('rejects symlink, submodule and executable modes', () => {
  for (const mode of ['120000', '160000', '100755', undefined]) {
    assert.throws(() => check(valid.changes.map(x => x.file.endsWith('qa.json') ? { ...x, mode } : x)), /non-executable/);
  }
});
test('rejects deletion and rename statuses', () => {
  for (const status of ['D', 'R100']) {
    assert.throws(() => check(valid.changes.map(x => x.file.endsWith('qa.json') ? { ...x, status } : x)), /must be new/);
  }
});
test('rejects duplicate or unsafe file paths', () => {
  assert.throws(() => check([...valid.changes, valid.changes[2]]), /duplicate/);
  assert.throws(() => check([...valid.changes, { status: 'A', file: 'lessons/inside-the-cell/../evil', mode: '100644' }]), /Invalid/);
});
test('requires catalog, lesson and evidence changes', () => {
  for (const i of [0, 1, 2]) {
    assert.throws(() => check(valid.changes.filter((_, index) => index !== i)), /must modify catalog/);
  }
});

const digest = '012345abcdef' + '0'.repeat(52);
const old = { id: 'prior-lesson', version: '1.0.0', packageSha256: 'a'.repeat(64), title: 'Existing' };
const added = { id: 'inside-the-cell', version: '1.1.0', packageSha256: digest };
const baseCatalog = { schemaVersion: '1.0.0', generatedAt: null, lessons: [old] };
const headCatalog = { schemaVersion: '1.0.0', generatedAt: '2026-11-02T00:00:00Z', lessons: [old, added] };
const delta = (head = headCatalog, base = baseCatalog, headRef = valid.headRef) =>
  validateReviewCatalogDelta({ headRef, baseCatalog: base, headCatalog: head });
test('catalog delta allows exactly one new version-pinned lesson and unchanged old records', () => {
  assert.deepEqual(delta(), { lessonId: 'inside-the-cell', version: '1.1.0' });
  assert.deepEqual(delta({ ...headCatalog, lessons: [added, { ...old }] }),
    { lessonId: 'inside-the-cell', version: '1.1.0' });
});
test('catalog delta rejects changing or removing previously approved records', () => {
  assert.throws(() => delta({ ...headCatalog, lessons: [{ ...old, title: 'Tampered' }, added] }), /cannot remove or modify/);
  assert.throws(() => delta({ ...headCatalog, lessons: [added] }), /exactly one/);
});
test('catalog delta rejects multiple additions and duplicate IDs', () => {
  assert.throws(() => delta({ ...headCatalog, lessons: [old, added, { ...added, id: 'extra' }] }), /exactly one/);
  assert.throws(() => delta({ ...headCatalog, lessons: [old, added, added] }), /duplicate/);
});
test('catalog delta rejects branch lesson or package digest mismatch', () => {
  assert.throws(() => delta({ ...headCatalog, lessons: [old, { ...added, id: 'other' }] }), /branch ID/);
  assert.throws(() => delta({ ...headCatalog, lessons: [old, { ...added, packageSha256: 'f'.repeat(64) }] }), /branch digest/);
  assert.throws(() => delta(headCatalog, baseCatalog, 'feature/review-inside-the-cell-ffffffffffff'), /branch digest/);
});
test('catalog delta rejects schema changes and malformed manifests', () => {
  assert.throws(() => delta({ ...headCatalog, schemaVersion: '2.0.0' }), /catalog versions/);
  assert.throws(() => delta({ ...headCatalog, lessons: null }), /catalog versions/);
});
