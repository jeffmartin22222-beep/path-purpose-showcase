import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const workflow = fs.readFileSync(
  fileURLToPath(new URL('../.github/workflows/trusted-review-boundary.yml', import.meta.url)),
  'utf8'
);

test('review PR boundary runs from the trusted base on pull_request_target', () => {
  assert.match(workflow, /pull_request_target:\s*\n\s*branches: \[feature\/qa-gated-publishing\]/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(workflow, /node scripts\/validate-review-pr-diff\.mjs/);
  assert.doesNotMatch(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
});

test('trusted boundary has read-only permissions and no PR-head execution', () => {
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /git fetch --no-tags origin "\$PP_REVIEW_HEAD_SHA"/);
  assert.match(workflow, /actual_base.*!=.*PP_REVIEW_BASE_SHA/);
  assert.doesNotMatch(workflow, /\b(?:npm install|npm ci|npx|bash .*head|node .*head|git checkout .*HEAD_SHA|git switch)\b/);
});
