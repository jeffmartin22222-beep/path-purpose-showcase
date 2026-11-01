import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WEIGHTS = Object.freeze({
  visual: 15, video: 15, interactive: 20, solo: 15,
  rigor: 15, uxAccessibility: 10, feedback: 10
});
const PROVIDERS = ['subject.com', 'schoolsplp-lincoln', 'edmentum', 'edgenuity'];
const HARD_GATES = ['soloAsynchronous', 'noPeerDependency', 'deviceInternetOnly',
  'printEquivalents', 'studentOnlyPublic'];
const QA_GATES = ['content', 'pedagogy', 'technical', 'experience'];
const SHA = /^[a-f0-9]{64}$/;
const TEXT = /\.(?:html?|js|mjs|json|md|txt|css|vtt|srt)$/i;
const PEER_REQUIREMENT = /\b(?:work|discuss|collaborate|meet|pair|team up|check in|share)\s+(?:with\s+)?(?:a\s+|your\s+|another\s+)?(?:partner|classmate|peer|group|parent|adult)\b/i;
const REQUIRED_MATERIAL = /\b(?:bring|buy|purchase|print|go outside|go outdoors|collect|gather)\s+(?:a\s+|an\s+|your\s+|the\s+)?(?:worksheet|paper|pencil|scissors|supplies|materials|kit|paint|glue|instrument|equipment|leaves|rocks|objects|ingredients)\b/i;
function check(ok, message) { if (!ok) throw new Error(message); }
function object(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
function keys(x, allowed, label) {
  check(object(x) && Object.keys(x).every(k => allowed.includes(k)), 'Invalid benchmark fields: ' + label);
}
function text(x, min = 1) { return typeof x === 'string' && x.trim().length >= min; }
function time(x) { return typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(x) && !Number.isNaN(Date.parse(x)); }
function hash(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function safeFile(root, relative, prefix) {
  check(typeof relative === 'string' && relative.startsWith(prefix) &&
    /^[a-zA-Z0-9._/-]+$/.test(relative) &&
    !relative.split('/').some(s => !s || s === '.' || s === '..'),
    'Unsafe benchmark path: ' + relative);
  const base = fs.realpathSync(root);
  const absolute = path.resolve(base, ...relative.split('/'));
  const real = fs.realpathSync(absolute);
  const stat = fs.lstatSync(absolute);
  check(real.startsWith(base + path.sep) && stat.isFile() && !stat.isSymbolicLink() &&
    stat.size > 0 && stat.size <= 10 * 1024 * 1024, 'Unsafe benchmark file: ' + relative);
  return fs.readFileSync(absolute);
}
function referenceUrl(url) {
  if (!text(url)) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && !!u.hostname &&
      !['localhost', '127.0.0.1'].includes(u.hostname);
  } catch { return false; }
}
/**
 * Enforces structure, score thresholds, version/hash binding and declared hard
 * blockers. Review authenticity, copyright, physical iOS and print fidelity
 * require independent human verification; this validator cannot prove them.
 */
export function validateBenchmark(root, lesson) {
  const pointer = lesson.benchmark;
  keys(pointer, ['path', 'sha256'], 'catalog pointer');
  check(pointer.path === 'evidence/' + lesson.id + '/benchmark.json' &&
    SHA.test(pointer.sha256 || ''), 'Missing pinned benchmark: ' + lesson.id);
  const bytes = safeFile(root, pointer.path, 'evidence/' + lesson.id + '/');
  check(hash(bytes) === pointer.sha256, 'Benchmark SHA-256 mismatch: ' + lesson.id);
  const report = JSON.parse(bytes.toString('utf8'));
  keys(report, ['schemaVersion', 'lessonId', 'contentVersion', 'entrySha256',
    'packageSha256', 'reviewedBy', 'reviewedAt', 'approval', 'superiorityClaim',
    'comparisons', 'scores', 'rubricNotes', 'gaps', 'remediation', 'overallNotes',
    'hardGates', 'qaGates', 'printEquivalents'], 'report');
  check(report.schemaVersion === '1.0.0' && report.lessonId === lesson.id &&
    report.contentVersion === lesson.version && report.entrySha256 === lesson.sha256 &&
    report.packageSha256 === lesson.packageSha256,
    'Benchmark content version/hash mismatch: ' + lesson.id);
  check(text(report.reviewedBy, 3) && time(report.reviewedAt) &&
    report.approval === 'approved' && report.superiorityClaim === 'not_claimed',
    'Benchmark lacks human signoff or makes unverified superiority claim: ' + lesson.id);
  check(Array.isArray(report.comparisons) && report.comparisons.length === PROVIDERS.length,
    'Benchmark missing competitor comparison: ' + lesson.id);
  const providers = new Set();
  for (const ref of report.comparisons) {
    keys(ref, ['provider', 'evidenceType', 'referenceUrl', 'checkedAt', 'notes'], 'comparison');
    check(PROVIDERS.includes(ref.provider) && !providers.has(ref.provider),
      'Duplicate/unknown benchmark provider: ' + ref.provider);
    providers.add(ref.provider);
    check(['direct_observation', 'public_documentation', 'marketing_claim', 'unavailable']
      .includes(ref.evidenceType) && text(ref.notes, 20),
      'Unverified comparison detail: ' + ref.provider);
    if (ref.evidenceType === 'unavailable') {
      check(ref.referenceUrl === undefined && ref.checkedAt === undefined,
        'Unavailable comparator cannot cite fabricated observation: ' + ref.provider);
    } else {
      check(referenceUrl(ref.referenceUrl) && time(ref.checkedAt),
        'Missing dated HTTPS comparison source: ' + ref.provider);
    }
  }
  check(PROVIDERS.every(p => providers.has(p)), 'Missing required comparison provider');
  check(report.comparisons.some(ref =>
    ['direct_observation', 'public_documentation'].includes(ref.evidenceType)),
    'Benchmark lacks a verifiable comparison reference; route for human review');
  // Marketing descriptions are allowed as labeled context, never as measured UX.
  keys(report.scores, Object.keys(WEIGHTS), 'scores');
  keys(report.rubricNotes, Object.keys(WEIGHTS), 'rubric notes');
  let total = 0;
  for (const [category, max] of Object.entries(WEIGHTS)) {
    const score = report.scores[category];
    check(Number.isInteger(score) && score >= Math.ceil(max * 0.7) && score <= max,
      'Benchmark weak/invalid category: ' + category);
    check(text(report.rubricNotes[category], 20), 'Missing rubric rationale: ' + category);
    total += score;
  }
  check(total >= 90, 'Benchmark score below 90: ' + total);
  check(Array.isArray(report.gaps) && report.gaps.every(x => text(x, 10)) &&
    Array.isArray(report.remediation) && report.remediation.every(x => text(x, 10)) &&
    text(report.overallNotes, 20), 'Missing benchmark gap/remediation notes');
  keys(report.hardGates, HARD_GATES, 'hard gates');
  for (const gate of HARD_GATES) {
    keys(report.hardGates[gate], ['status', 'notes'], gate);
    check(report.hardGates[gate].status === 'passed' &&
      text(report.hardGates[gate].notes, 20), 'Benchmark hard gate not verified: ' + gate);
  }
  keys(report.qaGates, QA_GATES, 'QA gates');
  for (const gate of QA_GATES) {
    check(report.qaGates[gate] === 'passed' && lesson.qa?.[gate]?.status === 'passed',
      'Benchmark four-pass QA mismatch: ' + gate);
  }
  keys(report.printEquivalents, ['lesson', 'unit', 'course'], 'print equivalents');
  const paths = Object.values(report.printEquivalents);
  check(paths.length === 3 && new Set(paths).size === 3,
    'Missing distinct lesson/unit/course print equivalents');
  const assets = new Map(lesson.assets.map(a => [a.path, a.sha256]));
  for (const [scope, relative] of Object.entries(report.printEquivalents)) {
    check(typeof relative === 'string' && relative.endsWith('.html') &&
      relative.startsWith('lessons/' + lesson.id + '/print/') && assets.has(relative),
      'Missing approved print-equivalent asset: ' + scope);
    const content = safeFile(root, relative, 'lessons/' + lesson.id + '/print/');
    check(hash(content) === assets.get(relative) &&
      /<main\b/i.test(content.toString('utf8')) &&
      /data-print-scope=["'](?:lesson|unit|course)["']/i.test(content.toString('utf8')) &&
      content.toString('utf8').includes('data-print-scope="' + scope + '"') &&
      content.length >= 120, 'Invalid print-equivalent content: ' + scope);
  }
  // Conservative high-signal lint; a human must inspect ALL prompts, media,
  // assessment and guides for implied peer/material requirements.
  for (const relative of [lesson.entry, ...lesson.assets.map(a => a.path)].filter(x => TEXT.test(x))) {
    const content = safeFile(root, relative, 'lessons/' + lesson.id + '/').toString('utf8');
    check(!PEER_REQUIREMENT.test(content), 'Potential required peer dependency: ' + relative);
    check(!REQUIRED_MATERIAL.test(content), 'Potential required physical material: ' + relative);
  }
  return { path: pointer.path, total };
}
