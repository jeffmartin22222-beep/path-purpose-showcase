#!/usr/bin/env node
/**
 * Fail closed on explicitly synthetic QA/rights/benchmark attestations.
 * Structural defense-in-depth only: absence of these labels is NOT proof
 * that an attestation is genuine. Synthetic fixtures remain allowed in
 * isolated unit tests but cannot be imported or pass public catalog CI.
 * Do not scan student-facing instructional content for these markers.
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
  const base = fs.realpathSync(rootDir);
  let candidate = base;
  for (const segment of relative.split('/')) {
    candidate = path.join(candidate, segment);
    if (fs.lstatSync(candidate).isSymbolicLink()) {
      throw new Error('Symlink in public evidence reference');
    }
  }
  const absolute = path.resolve(base, relative);
  if (!absolute.startsWith(base + path.sep) || fs.realpathSync(absolute) !== absolute) {
    throw new Error('Evidence reference escapes package');
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile() || stat.size > 10 * 1024 * 1024) {
    throw new Error('Invalid or oversized public evidence file');
  }
  return fs.readFileSync(absolute, 'utf8');
}
function inspect(value, label) {
  if (marker.test(String(value ?? ''))) {
    throw new Error('Synthetic or test-only publication evidence blocked: ' + label);
  }
}
// Scan every textual review field, including arrays of gaps/remediation,
// nested attestations and device metadata. Only review documents are scanned;
// lesson instruction and media captions must not be keyword-censored.
function inspectReview(value, label) {
  if (typeof value === 'string') return inspect(value, label);
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectReview(item, label + '[' + index + ']'));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      inspectReview(item, label + '.' + key);
    }
  }
}
export function rejectSyntheticEvidence(rootDir = root) {
  const catalog = JSON.parse(read(rootDir, 'catalog/approved.json'));
  if (!Array.isArray(catalog.lessons)) throw new Error('Missing catalog lessons');
  for (const lesson of catalog.lessons) {
    const id = lesson.id;
    inspectReview(lesson.rights, id + ' rights');
    for (const [gate, approval] of Object.entries(lesson.qa || {})) {
      inspectReview(approval, id + ' ' + gate + ' approval');
      for (const reportPath of approval.evidence || []) {
        const report = JSON.parse(read(rootDir, reportPath));
        inspectReview(report, reportPath + ' report');
        for (const artifact of report.artifacts || []) {
          if (!evidenceText.test(artifact.path)) continue;
          inspect(read(rootDir, artifact.path), artifact.path);
        }
      }
    }
    const benchmark = JSON.parse(read(rootDir, lesson.benchmark?.path));
    inspectReview(benchmark, id + ' benchmark');
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
