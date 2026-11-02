#!/usr/bin/env node
/**
 * Fail closed on a producer review PR that changes anything other than one
 * newly staged, student-facing lesson and its redacted evidence.
 * This is a CI guard, not an authorization to merge or publish. The workflow
 * and branch must also be protected against modification by the PR author.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

function requireThat(ok, message) {
  if (!ok) throw new Error(message);
}

export function validateReviewDiff({ headRef, baseRef, headRepo, changes }) {
  requireThat(baseRef === 'feature/qa-gated-publishing',
    'Review PR must target the QA integration branch');
  requireThat(headRepo === 'jeffmartin22222-beep/path-purpose-showcase',
    'Review PR head must originate from the trusted Showcase repository');
  const match = /^feature\/review-([a-z0-9]+(?:-[a-z0-9]+)*)-([a-f0-9]{12})$/.exec(headRef || '');
  requireThat(match, 'Review PR must use the signed-package review branch format');
  requireThat(Array.isArray(changes) && changes.length > 0 && changes.length <= 512,
    'Review PR must have a bounded nonempty change list');
  const id = match[1];
  let catalogCount = 0;
  let lessonCount = 0;
  let evidenceCount = 0;
  const seen = new Set();
  for (const change of changes) {
    const { status, file, mode } = change || {};
    requireThat(typeof file === 'string' && /^[a-zA-Z0-9._/-]+$/.test(file) &&
      !file.split('/').some(s => !s || s === '.' || s === '..') && !seen.has(file),
      'Invalid or duplicate path in review PR');
    seen.add(file);
    if (file === 'catalog/approved.json') {
      requireThat(status === 'M' && mode === '100644',
        'Review PR may only modify the existing approved catalog');
      catalogCount++;
    } else if (file.startsWith('lessons/' + id + '/')) {
      requireThat(status === 'A' && mode === '100644',
        'Review PR lesson files must be new, regular, non-executable files');
      lessonCount++;
    } else if (file.startsWith('evidence/' + id + '/')) {
      requireThat(status === 'A' && mode === '100644',
        'Review PR evidence files must be new, regular, non-executable files');
      evidenceCount++;
    } else {
      throw new Error('Review PR cannot change code, workflow, other lessons, or unrelated files: ' + file);
    }
  }
  requireThat(catalogCount === 1 && lessonCount > 0 && evidenceCount > 0,
    'Review PR must modify catalog once and add lesson and evidence files');
  return { lessonId: id, fileCount: changes.length };
}

/**
 * The catalog is the publication manifest, not merely a file with an allowed
 * path. A review PR may add exactly one version-pinned lesson and must preserve
 * every previously approved lesson record unchanged.
 */
export function validateReviewCatalogDelta({ headRef, baseCatalog, headCatalog }) {
  const match = /^feature\/review-([a-z0-9]+(?:-[a-z0-9]+)*)-([a-f0-9]{12})$/.exec(headRef || '');
  requireThat(match, 'Review PR must use the signed-package review branch format');
  requireThat(baseCatalog && headCatalog &&
    baseCatalog.schemaVersion === '1.0.0' && headCatalog.schemaVersion === baseCatalog.schemaVersion &&
    Array.isArray(baseCatalog.lessons) && Array.isArray(headCatalog.lessons),
    'Review PR catalog versions or lesson arrays are invalid');
  const baseById = new Map();
  for (const lesson of baseCatalog.lessons) {
    requireThat(lesson && typeof lesson.id === 'string' && !baseById.has(lesson.id),
      'Base catalog has duplicate or invalid lesson IDs');
    baseById.set(lesson.id, lesson);
  }
  const headById = new Map();
  for (const lesson of headCatalog.lessons) {
    requireThat(lesson && typeof lesson.id === 'string' && !headById.has(lesson.id),
      'Review PR catalog has duplicate or invalid lesson IDs');
    headById.set(lesson.id, lesson);
  }
  requireThat(headById.size === baseById.size + 1,
    'Review PR must add exactly one catalog lesson');
  for (const [id, original] of baseById) {
    requireThat(headById.has(id) && isDeepStrictEqual(headById.get(id), original),
      'Review PR cannot remove or modify existing approved lesson: ' + id);
  }
  const added = [...headById.values()].filter(lesson => !baseById.has(lesson.id));
  requireThat(added.length === 1 && added[0].id === match[1],
    'Review PR catalog lesson must match its review branch ID');
  requireThat(typeof added[0].packageSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(added[0].packageSha256) &&
    added[0].packageSha256.slice(0, 12) === match[2],
    'Review PR branch digest must match new lesson package SHA-256');
  return { lessonId: added[0].id, version: added[0].version };
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'] });
}

function main() {
  const { PP_REVIEW_HEAD_REF: headRef, PP_REVIEW_BASE_REF: baseRef,
    PP_REVIEW_BASE_SHA: baseSha, PP_REVIEW_HEAD_SHA: headSha,
    PP_REVIEW_HEAD_REPO: headRepo } = process.env;
  requireThat(/^[a-f0-9]{40}$/.test(baseSha || '') && /^[a-f0-9]{40}$/.test(headSha || ''),
    'Missing exact PR base/head commit SHA');
  // The private staging tool creates one commit directly from the current
  // integration HEAD. Reject rebased/merged/stale or unrelated histories; a
  // matching branch name alone is not producer authentication.
  requireThat(git(['rev-list', '--parents', '-n', '1', headSha]).trim() ===
    headSha + ' ' + baseSha,
    'Review PR must contain one direct child commit of the current integration base');
  const tokens = git(['diff', '--name-status', '-z', '--no-renames', baseSha, headSha]).split('\0');
  requireThat(tokens.at(-1) === '', 'Malformed NUL-delimited Git diff');
  tokens.pop();
  requireThat(tokens.length % 2 === 0, 'Malformed Git diff entries');
  const changes = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const status = tokens[i];
    const file = tokens[i + 1];
    const treeEntry = git(['ls-tree', headSha, '--', file]).trimEnd();
    const mode = /^([0-9]{6}) blob [a-f0-9]{40}\t/.exec(treeEntry)?.[1];
    changes.push({ status, file, mode });
  }
  const result = validateReviewDiff({ headRef, baseRef, headRepo, changes });
  const catalogDelta = validateReviewCatalogDelta({
    headRef,
    baseCatalog: JSON.parse(git(['show', baseSha + ':catalog/approved.json'])),
    headCatalog: JSON.parse(git(['show', headSha + ':catalog/approved.json']))
  });
  requireThat(result.lessonId === catalogDelta.lessonId, 'Review PR catalog and file changes disagree');
  console.log('Content-only review PR diff accepted:', result.lessonId,
    '(' + result.fileCount + ' changed files). This is NOT publication approval.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) {
    console.error('Review PR diff blocked:', error.message.split('\n')[0]);
    process.exitCode = 1;
  }
}
