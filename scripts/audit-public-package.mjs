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
// A filename allowlist alone does not establish media type. Reject obvious
// HTML/script masquerading as an image, video, audio file or web font before
// such bytes can enter the public approved catalog. This checks container
// signatures, NOT full decoding, file safety or content licensing.
const MEDIA_SIGNATURES = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif',
  '.mp4', '.webm', '.mp3', '.ogg', '.wav', '.woff', '.woff2'
]);
function matchesMediaSignature(extension, bytes) {
  const ascii = (start, end) => bytes.toString('ascii', start, end);
  const begins = hex => bytes.length >= hex.length / 2 &&
    bytes.subarray(0, hex.length / 2).equals(Buffer.from(hex, 'hex'));
  const riff = kind => bytes.length >= 12 && ascii(0, 4) === 'RIFF' &&
    ascii(8, 12) === kind;
  switch (extension) {
    case '.png': return begins('89504e470d0a1a0a');
    case '.jpg':
    case '.jpeg': return begins('ffd8ff');
    case '.gif': return ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a';
    case '.webp': return riff('WEBP');
    case '.avif': return bytes.length >= 16 && ascii(4, 8) === 'ftyp' &&
      /(?:avif|avis)/.test(ascii(8, Math.min(bytes.length, 64)));
    case '.mp4': return bytes.length >= 12 && ascii(4, 8) === 'ftyp';
    case '.webm': return begins('1a45dfa3');
    case '.mp3': return ascii(0, 3) === 'ID3' ||
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case '.ogg': return ascii(0, 4) === 'OggS';
    case '.wav': return riff('WAVE');
    case '.woff': return ascii(0, 4) === 'wOFF';
    case '.woff2': return ascii(0, 4) === 'wOF2';
    default: return true;
  }
}
const PRIVATE_JSON_FIELDS = /"(?:teacher(?:[_-]?(?:only|answer(?:[_-]?key)?|key))|answer[_-]?key|student[_-]?roster|private[_-]?notes|credentials?|secrets?)"\s*:/i;
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
// Inline scripts and event handlers can defer outbound requests until a click
// or timer, beyond the initial-load browser smoke window. Inspect their URL
// literals just as we inspect standalone .js/.mjs files. This is conservative
// static lint, not a JavaScript parser or a runtime network sandbox.
function hasDeferredRemoteHtmlCode(html) {
  const scripts = html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script\\s*>/gi);
  for (const match of scripts) {
    if (REMOTE_SCRIPT_LITERAL.test(match[1])) return true;
  }
  const handlers = html.matchAll(/\\bon[a-z]+\\s*=\\s*(?:"([^"]*)"|'([^']*)')/gi);
  for (const match of handlers) {
    if (REMOTE_SCRIPT_LITERAL.test(match[1] ?? match[2])) return true;
  }
  return false;
}
export function auditPublicPackage(root, paths) {
  const base = fs.realpathSync(root);
  for (const relative of paths) {
    if (typeof relative !== 'string' ||
        !/^[a-zA-Z0-9._/-]+$/.test(relative) ||
        relative.split('/').some(s => !s || s === '.' || s === '..') ||
        !(relative === 'catalog/approved.json' || /^(?:lessons|evidence)\//.test(relative))) {
      throw new Error('Unsafe public package path: ' + relative);
    }
    if (BLOCKED_NAME.test(relative)) {
      throw new Error('Forbidden public package filename: ' + relative);
    }
    const extension = path.extname(relative).toLowerCase();
    const allowed = relative === 'catalog/approved.json' ? new Set(['.json']) :
      relative.startsWith('lessons/') ? LESSON_EXTENSIONS : EVIDENCE_EXTENSIONS;
    if (!allowed.has(extension)) {
      throw new Error('Unsupported public package file type: ' + relative);
    }
    const absolute = path.resolve(base, ...relative.split('/'));
    const resolved = fs.realpathSync(absolute);
    if (!resolved.startsWith(base + path.sep) ||
        !fs.lstatSync(absolute).isFile() || fs.lstatSync(absolute).isSymbolicLink()) {
      throw new Error('Unsafe public package file: ' + relative);
    }
    if (MEDIA_SIGNATURES.has(extension)) {
      const fd = fs.openSync(absolute, 'r');
      const header = Buffer.alloc(64);
      let count;
      try { count = fs.readSync(fd, header, 0, header.length, 0); }
      finally { fs.closeSync(fd); }
      if (!matchesMediaSignature(extension, header.subarray(0, count))) {
        throw new Error('Invalid public media signature: ' + relative);
      }
    }
    if (!TEXT_FILE.test(relative)) continue;
    const data = fs.readFileSync(absolute, 'utf8');
    if (SECRET_PATTERNS.some(pattern => pattern.test(data)) ||
        ((relative.startsWith('lessons/') || relative === 'catalog/approved.json') &&
          INTERNAL_CONTENT.test(data)) ||
        (/\.json$/i.test(relative) && PRIVATE_JSON_FIELDS.test(data))) {
      throw new Error('Potential secret or teacher-only material in public package: ' + relative);
    }
    if (/\.html?$/i.test(relative) &&
        (EXTERNAL_MARKUP.some(pattern => pattern.test(data)) ||
         UNSAFE_HTML_NAVIGATION.some(pattern => pattern.test(data)) ||
         hasDeferredRemoteHtmlCode(data))) {
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
