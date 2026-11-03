import fs from 'node:fs';
import path from 'node:path';

/**
 * Fail-closed destination for public curriculum imports.
 * Lexical path checks alone do not stop a pre-existing symlinked parent
 * (for example lessons/id -> /outside/repository) from redirecting writes.
 *
 * This is defense in depth for a trusted, isolated runner; do not share its
 * checkout with untrusted processes that can race filesystem mutations.
 */
export function safeImportDestination(repositoryRoot, relative) {
  if (typeof relative !== 'string' ||
      !/^[a-zA-Z0-9._/-]+$/.test(relative) ||
      relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Unsafe import path: ' + String(relative));
  }
  const base = fs.realpathSync(repositoryRoot);
  if (!fs.statSync(base).isDirectory()) {
    throw new Error('Import repository root is not a directory');
  }
  const segments = relative.split('/');
  const destination = path.resolve(base, ...segments);
  if (!destination.startsWith(base + path.sep)) {
    throw new Error('Import destination escapes repository');
  }

  let current = base;
  for (let index = 0; index < segments.length; index++) {
    current = path.join(current, segments[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error('Symlink in public import destination: ' + relative);
    }
    if (index === segments.length - 1) {
      throw new Error('Refusing to overwrite existing import path: ' + relative);
    }
    if (!stat.isDirectory()) {
      throw new Error('Non-directory import ancestor: ' + relative);
    }
  }
  return destination;
}
