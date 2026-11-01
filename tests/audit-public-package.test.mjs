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
