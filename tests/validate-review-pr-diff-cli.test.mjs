import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../scripts/validate-review-pr-diff.mjs', import.meta.url));
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}
function write(cwd, relative, content) {
  const target = path.join(cwd, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
test('CLI compares actual Git trees, accepts content-only changes and blocks workflow edits', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-review-diff-'));
  try {
    git(dir, 'init', '-q');
    git(dir, 'config', 'user.email', 'test@example.invalid');
    git(dir, 'config', 'user.name', 'Synthetic Test');
    write(dir, 'catalog/approved.json', JSON.stringify({ schemaVersion: '1.0.0', lessons: [] }) + '\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'base');
    const baseSha = git(dir, 'rev-parse', 'HEAD');
    git(dir, 'switch', '-qc', 'feature/review-inside-the-cell-012345abcdef');
    write(dir, 'catalog/approved.json', JSON.stringify({ schemaVersion: '1.0.0', lessons: [ { id: 'inside-the-cell', version: '1.1.0', packageSha256: '012345abcdef' + '0'.repeat(52) } ] }) + '\n');
    write(dir, 'lessons/inside-the-cell/index.html', '<main>Original synthetic test</main>\n');
    write(dir, 'evidence/inside-the-cell/qa.json', '{"fixture":true}\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'review fixture');
    const env = { ...process.env,
      PP_REVIEW_HEAD_REF: 'feature/review-inside-the-cell-012345abcdef',
      PP_REVIEW_BASE_REF: 'feature/qa-gated-publishing',
      PP_REVIEW_BASE_SHA: baseSha,
      PP_REVIEW_HEAD_SHA: git(dir, 'rev-parse', 'HEAD') };
    const good = spawnSync(process.execPath, [cli], { cwd: dir, env, encoding: 'utf8' });
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stdout, /NOT publication approval/);
    write(dir, '.github/workflows/validate-catalog.yml', 'name: unsafe fixture\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'malicious workflow change');
    const bad = spawnSync(process.execPath, [cli], { cwd: dir,
      env: { ...env, PP_REVIEW_HEAD_SHA: git(dir, 'rev-parse', 'HEAD') }, encoding: 'utf8' });
    assert.notEqual(bad.status, 0);
    assert.match(bad.stderr, /cannot change code, workflow/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
