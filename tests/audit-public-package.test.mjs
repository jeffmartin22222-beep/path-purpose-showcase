import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditPublicPackage } from '../scripts/audit-public-package.mjs';

function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-public-audit-'));
  const write = (name, value) => {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  };
  try { fn({ root, write }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}
test('allows local interactive HTML and captions', () => fixture(({root,write}) => {
  write('lessons/demo/index.html', '<video src="video.mp4" controls></video><a href="transcript.html">Transcript</a>');
  write('lessons/demo/captions.vtt', 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nCell');
  assert.equal(auditPublicPackage(root, ['lessons/demo/index.html','lessons/demo/captions.vtt']).auditedFiles, 2);
}));
test('rejects teacher-only answer keys in public assets', () => fixture(({root,write}) => {
  write('lessons/demo/teacher-only-answers.json', '{}');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/teacher-only-answers.json']), /Forbidden public package filename/);
}));
test('rejects embedded private keys', () => fixture(({root,write}) => {
  write('evidence/demo/content/report.json', '{"note":"-----BEGIN PRIVATE KEY-----"}');
  assert.throws(() => auditPublicPackage(root, ['evidence/demo/content/report.json']), /Potential secret/);
}));
test('rejects external active resources and links', () => fixture(({root,write}) => {
  write('lessons/demo/index.html', '<img src="https://example.com/tracker.png"><a href="https://example.com">Leave</a>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/index.html']), /External dependency/);
}));
test('rejects external CSS imports', () => fixture(({root,write}) => {
  write('lessons/demo/theme.css', '@import url("https://fonts.example.com/css");');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/theme.css']), /External CSS dependency/);
}));
test('rejects traversal and symlinks', () => fixture(({root,write}) => {
  write('lessons/demo/index.html', '<p>OK</p>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/../demo/index.html']), /Unsafe public package path/);
  fs.symlinkSync(path.join(root,'lessons/demo/index.html'),path.join(root,'lessons/demo/alias.html'));
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/alias.html']), /Unsafe public package file/);
}));

test('allows a passive, self-contained SVG illustration', () => fixture(({root,write}) => {
  write('lessons/demo/cell.svg', '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="12"/></svg>');
  assert.equal(auditPublicPackage(root, ['lessons/demo/cell.svg']).auditedFiles, 1);
}));
test('rejects executable SVG even without external network dependencies', () => fixture(({root,write}) => {
  write('lessons/demo/cell.svg', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="10"/></svg>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/cell.svg']), /Executable or external SVG/);
  write('lessons/demo/cell.svg', '<svg><foreignObject><div>HTML</div></foreignObject></svg>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/cell.svg']), /Executable or external SVG/);
  write('lessons/demo/cell.svg', '<svg><script>alert(1)</script></svg>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/cell.svg']), /Executable or external SVG/);
}));
test('rejects remote and javascript SVG references', () => fixture(({root,write}) => {
  write('lessons/demo/cell.svg', '<svg><image href="https://example.com/tracker.png"/></svg>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/cell.svg']), /Executable or external SVG/);
  write('lessons/demo/cell.svg', '<svg><a xlink:href="javascript:alert(1)"><circle r="10"/></a></svg>');
  assert.throws(() => auditPublicPackage(root, ['lessons/demo/cell.svg']), /Executable or external SVG/);
}));

test('rejects HTML base URL overrides, refresh redirects and embedded srcdoc', () => fixture(({root,write}) => {
  for (const html of [
    '<base href="https://outside.example/"><img src="cell.png">',
    '<base href="/lessons/demo/">',
    '<meta http-equiv="refresh" content="0;url=https://outside.example">',
    '<iframe srcdoc="embedded active document"></iframe>'
  ]) {
    write('lessons/demo/index.html', html);
    assert.throws(() => auditPublicPackage(root, ['lessons/demo/index.html']), /External dependency/);
  }
}));
test('rejects active URI schemes and scripted navigation in approved HTML', () => fixture(({root,write}) => {
  for (const html of [
    '<a href="javascript:alert(1)">Click</a>',
    '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">',
    '<button formaction="javascript:alert(1)">Send</button>',
    '<script>window.location = "https://outside.example";</script>',
    '<script>location.replace("https://outside.example");</script>'
  ]) {
    write('lessons/demo/index.html', html);
    assert.throws(() => auditPublicPackage(root, ['lessons/demo/index.html']), /External dependency/);
  }
}));

// These tests are synthetic; no fixture is approved or copied into the live catalog.
test('allows approved student media and passive evidence formats', () => fixture(({root,write}) => {
  write('lessons/demo/clip.mp4', 'synthetic video bytes');
  write('lessons/demo/font.woff2', 'synthetic font bytes');
  write('lessons/demo/captions.vtt', 'WEBVTT\\n\\n00:00:00.000 --> 00:00:01.000\\nCell');
  write('evidence/demo/technical/screenshot.png', 'synthetic screenshot bytes');
  assert.equal(auditPublicPackage(root, [
    'lessons/demo/clip.mp4', 'lessons/demo/font.woff2',
    'lessons/demo/captions.vtt', 'evidence/demo/technical/screenshot.png'
  ]).auditedFiles, 4);
}));
test('rejects executable, archive and unreviewed binary file types', () => fixture(({root,write}) => {
  for (const relative of [
    'lessons/demo/answers.zip', 'lessons/demo/setup.exe',
    'lessons/demo/bundle.wasm', 'lessons/demo/raw.pdf',
    'lessons/demo/data.bin', 'evidence/demo/technical/recording.mp4',
    'evidence/demo/content/raw.html', 'evidence/demo/content/review.js',
    'evidence/demo/content/raw.svg'
  ]) {
    write(relative, 'synthetic content only');
    assert.throws(() => auditPublicPackage(root, [relative]),
      /Unsupported public package file type/, relative);
  }
}));

test('rejects credential strings in otherwise allowed evidence CSV', () => fixture(({root,write}) => {
  write('evidence/demo/content/results.csv', 'type,value\npassword,VerySensitiveSecret123456');
  assert.throws(() => auditPublicPackage(root, ['evidence/demo/content/results.csv']),
    /Potential secret or teacher-only material/);
}));


test('rejects delayed external endpoints and active navigation in lesson scripts', () => fixture(({root,write}) => {
  for (const code of [
    "setTimeout(() => fetch('https://outside.example/collect'), 1000);",
    "const destination = 'https://outside.example/';",
    "new XMLHttpRequest();",
    "navigator.sendBeacon('/collect', 'payload');",
    "window.open('/index.html');",
    "location.assign('/index.html');",
    "const socket = new WebSocket('//outside.example/live');"
  ]) {
    write('lessons/demo/player.js', code);
    assert.throws(() => auditPublicPackage(root, ['lessons/demo/player.js']),
      /Unsafe outbound network or navigation code/, code);
  }
}));
test('rejects active network and navigation primitives in inline lesson HTML', () => fixture(({root,write}) => {
  for (const html of [
    '<script>new XMLHttpRequest();</script>',
    '<script>navigator.sendBeacon("/collect", "data");</script>',
    '<script>window.open("/index.html");</script>'
  ]) {
    write('lessons/demo/index.html', html);
    assert.throws(() => auditPublicPackage(root, ['lessons/demo/index.html']),
      /Unsafe outbound network or navigation code/, html);
  }
}));
test('allows local manifest-resolvable fetch and student progress persistence', () => fixture(({root,write}) => {
  write('lessons/demo/player.mjs',
    "const response = await fetch('./lesson.json'); localStorage.setItem('progress', '1');");
  assert.equal(auditPublicPackage(root, ['lessons/demo/player.mjs']).auditedFiles, 1);
}));

// Public catalog metadata must be scanned even when no lesson files are approved.
test('audits catalog JSON and blocks teacher keys or credentials', () => fixture(({root,write}) => {
  write('catalog/approved.json', JSON.stringify({schemaVersion:'1.0.0',lessons:[]}));
  assert.equal(auditPublicPackage(root, ['catalog/approved.json']).auditedFiles, 1);
  for (const extra of [{teacherAnswerKey:'Never public'}, {notes:'api_key:SensitiveToken123456'}]) {
    write('catalog/approved.json', JSON.stringify({schemaVersion:'1.0.0',lessons:[],...extra}));
    assert.throws(() => auditPublicPackage(root, ['catalog/approved.json']),
      /Potential secret or teacher-only material/);
  }
}));
