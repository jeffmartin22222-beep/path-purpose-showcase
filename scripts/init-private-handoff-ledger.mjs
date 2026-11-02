#!/usr/bin/env node
/**
 * One-time, operator-controlled bootstrap of the private replay ledger.
 * NEVER run this to bypass an existing, lost, locked or pending ledger.
 * This command does not stage, approve, upload, merge or publish lessons.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fs.realpathSync(fileURLToPath(new URL('../', import.meta.url)));
function main() {
  const [ledgerPath, acknowledgement, ...extra] = process.argv.slice(2);
  if (!ledgerPath || acknowledgement !== '--acknowledge-new-private-ledger' || extra.length ||
      !path.isAbsolute(ledgerPath) || path.resolve(ledgerPath) !== ledgerPath) {
    throw new Error('Usage: node scripts/init-private-handoff-ledger.mjs /absolute/private/replay.json --acknowledge-new-private-ledger');
  }
  if (ledgerPath === root || ledgerPath.startsWith(root + path.sep)) {
    throw new Error('Private replay ledger must be outside public Showcase checkout');
  }
  const directory = path.dirname(ledgerPath);
  if (fs.realpathSync(directory) !== directory || !fs.statSync(directory).isDirectory()) {
    throw new Error('Private replay ledger directory must be a real directory, not a symlink');
  }
  if (fs.statSync(directory).mode & 0o002) {
    throw new Error('Private replay ledger directory must not be world-writable');
  }
  // Exclusive creation is critical: never truncate or replace replay history.
  const fd = fs.openSync(ledgerPath, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify({ schemaVersion: 1, records: [] }, null, 2) + '\n');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  const dirFd = fs.openSync(directory, 'r');
  try { fs.fsyncSync(dirFd); }
  finally { fs.closeSync(dirFd); }
  console.log('Initialized new private replay ledger. No curriculum was staged or approved.');
}
try { main(); }
catch (error) {
  console.error('Private ledger initialization blocked:', error.message.split('\n')[0]);
  process.exitCode = 1;
}
