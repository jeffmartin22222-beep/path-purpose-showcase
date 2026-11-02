import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReviewDiff } from '../scripts/validate-review-pr-diff.mjs';

const valid = {
  headRef: 'feature/review-inside-the-cell-012345abcdef',
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
