import fs from 'node:fs';
import path from 'node:path';

/**
 * Defense-in-depth for PUBLIC, already-reviewed Showcase packages.
 * This is a conservative static lint, not a substitute for a human privacy,
 * copyright or security review. Binary media/screenshots require human audit.
 */
const BLOCKED_NAME = /(?:^|\/)(?:\.env(?:\..+)?|\.npmrc|\.netrc|id_rsa|id_ed25519|[^/]*\.(?:pem|p12|pfx|key|sqlite|db|map)|[^/]*(?:answer[-_ ]?key|teacher[-_ ]?only|student[-_ ]?roster|credentials?|private[-_ ]?key|secrets?)[^/]*)$/i;
// Public assets are executable/downloadable from GitHub Pages. Deny unknown formats
// rather than silently copying archives, installers, databases or active documents.
// New media formats require an explicit security and licensing review.
const LESSON_EXTENSIONS = new Set([
  '.html', '.htm', '.js', '.mjs', '.css', '.json', '.txt', '.md',
  '.vtt', '.srt', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif',
  '.avif', '.mp4', '.webm', '.mp3', '.ogg', '.wav', '.woff', '.woff2'
]);
// Evidence must be sanitized review summaries and passive screenshots/text.
// Never publish raw browser recordings, active HTML, scripts or binary archives.
const EVIDENCE_EXTENSIONS = new Set([
  '.json', '.txt', '.md', '.csv', '.png', '.jpg', '.jpeg', '.webp', '.avif'
]);
const TEXT_FILE = /\.(?:html?|js|mjs|css|json|txt|md|csv|vtt|srt|svg|xml)$/i;
const SECRET_PATTERNS = [
  /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/,
  /\b(?:api[_ -]?key|client[_ -]?secret|access[_ -]?token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
  /\b(?:api[_ -]?key|client[_ -]?secret|access[_ -]?token|password)\s*,\s*["']?[A-Za-z0-9_./+=-]{12,}/i
];
const INTERNAL_CONTENT = /\b(?:teacher[- ]only|answer[- ]key|student[- ]roster)\b/i;
const EXTERNAL_MARKUP = [
  /<(?:script|img|audio|video|source|track|iframe|embed|object|link|a|form)\b[^>]*?\b(?:src|href|action|poster|data)\s*=\s*["']?\s*(?:https?:)?\/\//i,
  /\bsrcset\s*=\s*["'][^"']*(?:https?:)?\/\//i,
  /@import\s+(?:url\(\s*)?["']?\s*(?:https?:)?\/\//i,
  /url\(\s*["']?\s*(?:https?:)?\/\//i,
  /\b(?:fetch|WebSocket|EventSource)\s*\(\s*["']\s*(?:https?:)?\/\//i
];
// Reject HTML URL-base overrides, silent redirects and embedded documents.
// These can evade a remote-src check or turn local-looking asset URLs remote.
// Static lint is defense in depth; actual browser network tests remain required.
const UNSAFE_HTML_NAVIGATION = [
  /<base\b/i,
  /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?\s*refresh\b/i,
  /\bsrcdoc\s*=/i,
  /\b(?:href|src|action|formaction|poster|data|srcset)\s*=\s*["']?\s*(?:javascript:|data:|vbscript:|file:|blob:)/i,
  /\b(?:location\.(?:href|assign|replace)|window\.location|document\.location)\s*(?:=|\()/i
];
// Reject outbound-network and navigation primitives in reviewed student scripts.
// Browser smoke checks cover runtime requests on initial load, but a delayed or
// click-triggered script could otherwise evade those short smoke windows.
// Local fetch() remains permitted for manifest-listed lesson assets.
const SCRIPT_NETWORK_RISKS = [
  /\b(?:fetch|WebSocket|EventSource|importScripts)\s*\(\s*['"\x60]\s*\/\//i,
  /\b(?:new\s+)?XMLHttpRequest\s*\(/i,
  /\b(?:navigator\.)?sendBeacon\s*\(/i,
  /\b(?:window\.)?open\s*\(/i,
  /\b(?:window\.|document\.)?location(?:\.href)?\s*=/i,
  /\b(?:window\.|document\.)?location\.(?:assign|replace)\s*\(/i
];
const REMOTE_SCRIPT_LITERAL = /\bhttps?:\/\/[a-z0-9]/i;
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
    const extension = path.extname(relative).toLowerCase();
    const allowed = relative.startsWith('lessons/') ? LESSON_EXTENSIONS : EVIDENCE_EXTENSIONS;
    if (!allowed.has(extension)) {
      throw new Error('Unsupported public package file type: ' + relative);
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
        (EXTERNAL_MARKUP.some(pattern => pattern.test(data)) ||
         UNSAFE_HTML_NAVIGATION.some(pattern => pattern.test(data)))) {
      throw new Error('External dependency or link in student-facing HTML: ' + relative);
    }
    if (/\.css$/i.test(relative) &&
        EXTERNAL_MARKUP.slice(2, 4).some(pattern => pattern.test(data))) {
      throw new Error('External CSS dependency in public package: ' + relative);
    }
    if (/\.(?:html?|m?js)$/i.test(relative) &&
        (SCRIPT_NETWORK_RISKS.some(pattern => pattern.test(data)) ||
         (/\.(?:m?js)$/i.test(relative) && REMOTE_SCRIPT_LITERAL.test(data)))) {
      throw new Error('Unsafe outbound network or navigation code in public lesson: ' + relative);
    }
    // SVG is an active document format, not merely a passive image. A malicious
    // SVG can execute scripts or load remote content when opened directly.
    // Keep approved student media as self-contained, non-executable artwork.
    if (/\.svg$/i.test(relative) && [
      /<(?:script|foreignObject|iframe|object|embed)\b/i,
      /\son[a-z]+\s*=/i,
      /\b(?:href|xlink:href)\s*=\s*["']?\s*(?:https?:|\/\/|javascript:|data:)/i,
      /\burl\(\s*["']?\s*(?:https?:|\/\/|javascript:)/i,
      /@import\b/i
    ].some(pattern => pattern.test(data))) {
      throw new Error('Executable or external SVG content in public package: ' + relative);
    }
  }
  return { auditedFiles: paths.length };
}
