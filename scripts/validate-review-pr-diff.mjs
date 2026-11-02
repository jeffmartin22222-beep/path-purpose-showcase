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

function requireThat(ok, message) {
  if (!ok) throw new Error(message);
}

export function validateReviewDiff({ headRef, baseRef, changes }) {
  requireThat(baseRef === 'feature/qa-gated-publishing',
    'Review PR must target the QA integration branch');
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

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'] });
}

function main() {
  const { PP_REVIEW_HEAD_REF: headRef, PP_REVIEW_BASE_REF: baseRef,
    PP_REVIEW_BASE_SHA: baseSha, PP_REVIEW_HEAD_SHA: headSha } = process.env;
  requireThat(/^[a-f0-9]{40}$/.test(baseSha || '') && /^[a-f0-9]{40}$/.test(headSha || ''),
    'Missing exact PR base/head commit SHA');
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
  const result = validateReviewDiff({ headRef, baseRef, changes });
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
