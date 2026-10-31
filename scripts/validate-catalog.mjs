import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const REQUIRED_CHECKS = Object.freeze({
  content: ['standards', 'accuracy', 'copyright'],
  pedagogy: ['student_agency', 'scaffolding', 'feedback'],
  technical: ['iphone', 'ipad', 'video', 'captions', 'keyboard', 'screen_reader', 'persistence'],
  experience: ['student_flow', 'teacher_review', 'demo']
});

function requireThat(ok, message) {
  if (!ok) throw new Error(message);
}
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function timestamp(value) {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}
function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}
function readFile(root, relative, prefix, maxBytes = 10 * 1024 * 1024) {
  requireThat(typeof relative === 'string' &&
    /^[a-zA-Z0-9._/-]+$/.test(relative) &&
    !relative.split('/').some(segment => segment === '..' || segment === '.' || segment === '') &&
    relative.startsWith(prefix), 'Unsafe file path: ' + String(relative));
  const absolute = path.resolve(root, ...relative.split('/'));
  requireThat(absolute.startsWith(path.resolve(root) + path.sep), 'Path escapes repository');
  const resolved = fs.realpathSync(absolute);
  requireThat(resolved.startsWith(fs.realpathSync(root) + path.sep),
    'File resolves outside repository: ' + relative);
  const stat = fs.lstatSync(absolute);
  requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.size > 0 && stat.size <= maxBytes,
    'Missing, empty, symlinked, or oversized file: ' + relative);
  return fs.readFileSync(absolute);
}
function lessonFiles(root, id) {
  const base = path.join(root, 'lessons', id);
  const found = [];
  function walk(dir, prefix) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix + item.name;
      if (item.isDirectory()) walk(path.join(dir, item.name), relative + '/');
      else if (item.isFile()) found.push(relative);
      else throw new Error('Symlink or unsupported file in lesson package: ' + relative);
    }
  }
  walk(base, 'lessons/' + id + '/');
  return found.sort();
}
function checkAttestation(obj, label) {
  requireThat(isObject(obj) && nonempty(obj.reviewedBy) && timestamp(obj.reviewedAt),
    'Missing reviewer or UTC review timestamp: ' + label);
}
export function validateCatalog(root = DEFAULT_ROOT) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog/approved.json'), 'utf8'));
  requireThat(isObject(catalog) && catalog.schemaVersion === '1.0.0' &&
    Array.isArray(catalog.lessons), 'Invalid catalog schema version or lessons');
  const ids = new Set();
  for (const lesson of catalog.lessons) {
    requireThat(isObject(lesson) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.id || ''),
      'Invalid lesson ID');
    requireThat(!ids.has(lesson.id), 'Duplicate lesson ID: ' + lesson.id);
    ids.add(lesson.id);
    for (const field of ['title', 'grade', 'subject', 'course', 'unit', 'version']) {
      requireThat(nonempty(lesson[field]), 'Missing ' + field + ' for ' + lesson.id);
    }
    requireThat(lesson.entry === 'lessons/' + lesson.id + '/index.html',
      'Lesson entry must be its own index.html: ' + lesson.id);
    const html = readFile(root, lesson.entry, 'lessons/' + lesson.id + '/');
    requireThat(/^[a-f0-9]{64}$/.test(lesson.sha256 || '') && sha256(html) === lesson.sha256,
      'Lesson content SHA-256 mismatch: ' + lesson.id);
    requireThat(Array.isArray(lesson.assets), 'Missing assets manifest: ' + lesson.id);
    const files = [{ path: lesson.entry, sha256: lesson.sha256 }];
    const seen = new Set([lesson.entry]);
    for (const asset of lesson.assets) {
      requireThat(isObject(asset) && typeof asset.path === 'string' &&
        asset.path.startsWith('lessons/' + lesson.id + '/') &&
        /^[a-f0-9]{64}$/.test(asset.sha256 || '') &&
        !seen.has(asset.path), 'Invalid or duplicate asset: ' + lesson.id);
      seen.add(asset.path);
      const bytes = readFile(root, asset.path, 'lessons/' + lesson.id + '/', 95 * 1024 * 1024);
      requireThat(sha256(bytes) === asset.sha256, 'Asset SHA-256 mismatch: ' + asset.path);
      files.push({ path: asset.path, sha256: asset.sha256 });
    }
    requireThat(JSON.stringify([...seen].sort()) === JSON.stringify(lessonFiles(root, lesson.id)),
      'Lesson package contains unlisted files: ' + lesson.id);
    const digest = sha256(JSON.stringify(files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
    requireThat(lesson.packageSha256 === digest, 'Package SHA-256 mismatch: ' + lesson.id);
    const rights = lesson.rights;
    checkAttestation(rights, lesson.id + ' rights');
    requireThat(rights.status === 'cleared' &&
      ['original', 'licensed'].includes(rights.basis) && nonempty(rights.notes),
      'Missing cleared content rights: ' + lesson.id);
    if (rights.basis === 'licensed') {
      requireThat(nonempty(rights.licenseReference), 'Missing license reference: ' + lesson.id);
    }
    requireThat(isObject(lesson.qa), 'Missing QA: ' + lesson.id);
    for (const [gate, required] of Object.entries(REQUIRED_CHECKS)) {
      const approval = lesson.qa[gate];
      checkAttestation(approval, lesson.id + ' ' + gate);
      requireThat(approval.status === 'passed' && Array.isArray(approval.evidence) &&
        approval.evidence.length > 0, 'Missing passed gate/evidence: ' + lesson.id + ' ' + gate);
      const checks = new Set();
      for (const evidencePath of approval.evidence) {
        const prefix = 'evidence/' + lesson.id + '/' + gate + '/';
        requireThat(typeof evidencePath === 'string' && evidencePath.endsWith('.json'),
          'Evidence must be a JSON report: ' + gate);
        const report = JSON.parse(readFile(root, evidencePath, prefix).toString('utf8'));
        requireThat(isObject(report) && report.lessonId === lesson.id &&
          report.version === lesson.version && report.gate === gate &&
          report.entrySha256 === lesson.sha256 &&
          report.packageSha256 === lesson.packageSha256 &&
          report.reviewedBy === approval.reviewedBy &&
          report.reviewedAt === approval.reviewedAt,
          'Evidence does not match approved lesson/reviewer: ' + evidencePath);
        requireThat(Array.isArray(report.checks), 'Missing checks: ' + evidencePath);
        for (const check of report.checks) {
          requireThat(isObject(check) && nonempty(check.id) &&
            check.result === 'passed' && nonempty(check.notes),
            'Unverified check: ' + evidencePath);
          checks.add(check.id);
          if (gate === 'technical' && ['iphone', 'ipad'].includes(check.id)) {
            requireThat(nonempty(check.deviceModel) && nonempty(check.osVersion) &&
              timestamp(check.testedAt), 'Physical device test metadata required: ' + check.id);
          }
        }
        requireThat(Array.isArray(report.artifacts) && report.artifacts.length > 0,
          'No supporting evidence artifacts: ' + evidencePath);
        for (const artifact of report.artifacts) {
          requireThat(isObject(artifact) && /^[a-f0-9]{64}$/.test(artifact.sha256 || ''),
            'Invalid evidence artifact hash');
          const bytes = readFile(root, artifact.path, prefix);
          requireThat(sha256(bytes) === artifact.sha256, 'Evidence artifact hash mismatch: ' + artifact.path);
        }
      }
      for (const check of required) {
        requireThat(checks.has(check), 'Required QA check missing: ' + lesson.id + '/' + gate + '/' + check);
      }
    }
  }
  return { approvedLessons: catalog.lessons.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = validateCatalog();
    console.log('Validated', result.approvedLessons,
      'approved lessons. Review attestations and physical device evidence must still be independently audited.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
