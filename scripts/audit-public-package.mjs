import fs from 'node:fs';
import path from 'node:path';

/**
 * Defense-in-depth for PUBLIC, already-reviewed Showcase packages.
 * This is a conservative static lint, not a substitute for a human privacy,
 * copyright or security review. Binary media/screenshots require human audit.
 */
const BLOCKED_NAME = /(?:^|\/)(?:\.env(?:\..+)?|\.npmrc|\.netrc|id_rsa|id_ed25519|[^/]*\.(?:pem|p12|pfx|key|sqlite|db|map)|[^/]*(?:answer[-_ ]?key|teacher[-_ ]?only|student[-_ ]?roster|credentials?|private[-_ ]?key|secrets?)[^/]*)$/i;
const TEXT_FILE = /\.(?:html?|js|mjs|css|json|txt|md|vtt|srt|svg|xml)$/i;
const SECRET_PATTERNS = [
  /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/,
  /\b(?:api[_ -]?key|client[_ -]?secret|access[_ -]?token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
  /\b(?:api[_ -]?key|client[_ -]?secret)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i
];
const INTERNAL_CONTENT = /\b(?:teacher[- ]only|answer[- ]key|student[- ]roster)\b/i;
const EXTERNAL_MARKUP = [
  /<(?:script|img|audio|video|source|track|iframe|embed|object|link|a|form)\b[^>]*?\b(?:src|href|action|poster|data)\s*=\s*["']?\s*(?:https?:)?\/\//i,
  /\bsrcset\s*=\s*["'][^"']*(?:https?:)?\/\//i,
  /@import\s+(?:url\(\s*)?["']?\s*(?:https?:)?\/\//i,
  /url\(\s*["']?\s*(?:https?:)?\/\//i,
  /\b(?:fetch|WebSocket|EventSource)\s*\(\s*["']\s*(?:https?:)?\/\//i
];
export function auditPublicPackage(root, paths) {
  const base = fs.realpathSync(root);
  for (const relative of paths) {
    if (typeof relative !== 'string' ||
        !/^[a-zA-Z0-9._/-]+$/.test(relative) ||
        relative.split('/').some(s => !s || s === '.' || s === '..') ||
        !/^(?:lessons|evidence)\//.test(relative)) {
      throw new Error('Unsafe public package path: ' + relative);
    }
    if (BLOCKED_NAME.test(relative)) {
      throw new Error('Forbidden public package filename: ' + relative);
    }
    const absolute = path.resolve(base, ...relative.split('/'));
    const resolved = fs.realpathSync(absolute);
    if (!resolved.startsWith(base + path.sep) ||
        !fs.lstatSync(absolute).isFile() || fs.lstatSync(absolute).isSymbolicLink()) {
      throw new Error('Unsafe public package file: ' + relative);
    }
    if (!TEXT_FILE.test(relative)) continue;
    const data = fs.readFileSync(absolute, 'utf8');
    if (SECRET_PATTERNS.some(pattern => pattern.test(data)) ||
        (relative.startsWith('lessons/') && INTERNAL_CONTENT.test(data))) {
      throw new Error('Potential secret or teacher-only material in public package: ' + relative);
    }
    if (/\.html?$/i.test(relative) &&
        EXTERNAL_MARKUP.some(pattern => pattern.test(data))) {
      throw new Error('External dependency or link in student-facing HTML: ' + relative);
    }
    if (/\.css$/i.test(relative) &&
        EXTERNAL_MARKUP.slice(2, 4).some(pattern => pattern.test(data))) {
      throw new Error('External CSS dependency in public package: ' + relative);
    }
  }
  return { auditedFiles: paths.length };
}
