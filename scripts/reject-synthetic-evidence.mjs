#!/usr/bin/env node
/**
 * Fail closed on explicitly synthetic QA/rights/benchmark attestations.
 * Structural defense-in-depth only: absence of these labels is NOT proof
 * that an attestation is genuine. Synthetic fixtures remain allowed in
 * isolated unit tests but cannot be imported or pass public catalog CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const marker = /\b(?:synthetic|fixture|test[\s-]*only|not\s+(?:actual|real)\s+(?:qa|review|test|evidence|approval)|not\s+(?:a|an)\s+real\s+(?:review|approval)|placeholder\s+(?:review|evidence|approval)|fabricated\s+(?:review|evidence|approval))\b/i;
const evidenceText = /\.(?:txt|md|json|csv|html|svg|vtt|srt)$/i;
function read(rootDir, relative) {
  if (typeof relative !== 'string' || !/^[a-zA-Z0-9._/-]+$/.test(relative) ||
      relative.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error('Unsafe public evidence reference');
  }
  const absolute = path.resolve(rootDir, relative);
  if (!absolute.startsWith(path.resolve(rootDir) + path.sep)) {
    throw new Error('Evidence reference escapes package');
  }
  return fs.readFileSync(absolute, 'utf8');
}
function inspect(value, label) {
  if (marker.test(String(value ?? ''))) {
    throw new Error('Synthetic or test-only publication evidence blocked: ' + label);
  }
}
export function rejectSyntheticEvidence(rootDir = root) {
  const catalog = JSON.parse(read(rootDir, 'catalog/approved.json'));
  if (!Array.isArray(catalog.lessons)) throw new Error('Missing catalog lessons');
  for (const lesson of catalog.lessons) {
    const id = lesson.id;
    inspect(lesson.rights?.reviewedBy, id + ' rights reviewer');
    inspect(lesson.rights?.notes, id + ' rights notes');
    for (const [gate, approval] of Object.entries(lesson.qa || {})) {
      inspect(approval.reviewedBy, id + ' ' + gate + ' reviewer');
      for (const reportPath of approval.evidence || []) {
        const report = JSON.parse(read(rootDir, reportPath));
        inspect(report.reviewedBy, reportPath + ' reviewer');
        for (const check of report.checks || []) {
          inspect(check.notes, reportPath + ' ' + check.id);
        }
        for (const artifact of report.artifacts || []) {
          if (!evidenceText.test(artifact.path)) continue;
          const text = read(rootDir, artifact.path);
          inspect(text, artifact.path);
        }
      }
    }
    const benchmark = JSON.parse(read(rootDir, lesson.benchmark?.path));
    inspect(benchmark.reviewedBy, id + ' benchmark reviewer');
    inspect(benchmark.overallNotes, id + ' benchmark notes');
    for (const [category, notes] of Object.entries(benchmark.rubricNotes || {})) {
      inspect(notes, id + ' benchmark ' + category);
    }
    for (const comparison of benchmark.comparisons || []) {
      inspect(comparison.notes, id + ' comparison ' + comparison.provider);
    }
    for (const [gate, attestation] of Object.entries(benchmark.hardGates || {})) {
      inspect(attestation.notes, id + ' hard gate ' + gate);
    }
  }
  return { lessonsChecked: catalog.lessons.length };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1) throw new Error('Usage: node scripts/reject-synthetic-evidence.mjs [package-directory]');
    const result = rejectSyntheticEvidence(args[0] ? path.resolve(args[0]) : root);
    console.log('No explicit synthetic approval markers in', result.lessonsChecked,
      'catalog lessons; independent human verification still required.');
  } catch (error) {
    console.error('Publication evidence blocked:', error.message.split('\n')[0]);
    process.exitCode = 1;
  }
}
