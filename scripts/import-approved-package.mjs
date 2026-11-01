#!/usr/bin/env node
/**
 * Explicit, review-only handoff from a private production workspace.
 * This does not upload to GitHub, merge a PR, or deploy a website.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from './validate-catalog.mjs';
import { safeImportDestination } from './safe-import-path.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}
function importPackage() {
  const [sourceArg, ...flags] = process.argv.slice(2);
  requireThat(sourceArg, 'Usage: node scripts/import-approved-package.mjs <extracted-private-bundle-directory> [--apply --acknowledge-public-reviewed]');
  const source = fs.realpathSync(sourceArg);
  requireThat(source !== fs.realpathSync(root) && !source.startsWith(fs.realpathSync(root) + path.sep),
    'Source must be outside the public Showcase repository');
  validateCatalog(source);
  const incoming = JSON.parse(fs.readFileSync(path.join(source, 'catalog/approved.json'), 'utf8'));
  requireThat(incoming.lessons.length === 1, 'Handoff bundle must contain exactly one approved lesson');
  const lesson = incoming.lessons[0];
  const current = JSON.parse(fs.readFileSync(path.join(root, 'catalog/approved.json'), 'utf8'));
  validateCatalog(root);
  requireThat(!current.lessons.some(x => x.id === lesson.id), 'Lesson already exists; updates require a separate review PR');
  const paths = new Set([lesson.entry, ...lesson.assets.map(a => a.path), lesson.benchmark.path]);
  for (const gate of Object.values(lesson.qa)) {
    for (const reportPath of gate.evidence) {
      paths.add(reportPath);
      const report = JSON.parse(fs.readFileSync(path.join(source, reportPath), 'utf8'));
      for (const artifact of report.artifacts) paths.add(artifact.path);
    }
  }
  const filePairs = [...paths].map(relative => {
    const from = path.resolve(source, ...relative.split('/'));
    requireThat(from.startsWith(source + path.sep), 'Source escapes private bundle');
    const sourceStat = fs.lstatSync(from);
    requireThat(sourceStat.isFile() && !sourceStat.isSymbolicLink() && sourceStat.nlink === 1,
      'Source file is not an independent regular file: ' + relative);
    const to = safeImportDestination(root, relative);
    return { from, to, relative };
  });
  const apply = flags.includes('--apply');
  requireThat(flags.every(x => ['--apply', '--acknowledge-public-reviewed'].includes(x)),
    'Unknown import option');
  if (!apply) {
    console.log('DRY RUN: validated', lesson.id, 'and', filePairs.length,
      'explicitly referenced files. No files were copied. Human review is still required.');
    return;
  }
  requireThat(flags.includes('--acknowledge-public-reviewed'),
    'Refusing public import without explicit reviewed-content acknowledgement');
  const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
  requireThat(branch.startsWith('feature/') && branch !== 'main',
    'Import only on a feature branch, never main');
  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
  requireThat(!dirty, 'Commit or discard unrelated working-tree changes before import');
  const previous = fs.readFileSync(path.join(root, 'catalog/approved.json'));
  const copied = [];
  try {
    for (const file of filePairs) {
      fs.mkdirSync(path.dirname(file.to), { recursive: true });
      fs.copyFileSync(file.from, file.to, fs.constants.COPYFILE_EXCL);
      copied.push(file.to);
    }
    current.lessons.push(lesson);
    current.lessons.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    current.generatedAt = new Date().toISOString();
    fs.writeFileSync(path.join(root, 'catalog/approved.json'), JSON.stringify(current, null, 2) + '\n');
    validateCatalog(root);
  } catch (error) {
    fs.writeFileSync(path.join(root, 'catalog/approved.json'), previous);
    for (const file of copied) fs.rmSync(file, { force: true });
    throw error;
  }
  console.log('Prepared', lesson.id, 'on branch', branch,
    'with', filePairs.length, 'referenced files. NOT COMMITTED OR PUBLISHED.');
  console.log('Review the diff and redaction, run CI, obtain owner approval, and open a PR.');
}
try {
  importPackage();
} catch (error) {
  console.error('Import blocked:', error.message);
  process.exitCode = 1;
}
