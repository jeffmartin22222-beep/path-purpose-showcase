import fs from 'node:fs';
import path from 'node:path';

/**
 * Verify that an importer reads only independent regular files beneath the
 * reviewed private bundle. Refuse symlinked ancestors, even when they point
 * back inside the bundle: validation must cover the same path that is copied.
 * Defense-in-depth; the runner still needs an isolated immutable source.
 */
export function safeImportSource(sourceRoot, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) ||
      !/^[A-Za-z0-9._/-]+$/.test(relative) ||
      relative.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error('Unsafe private import source path');
  }
  const root = fs.realpathSync(sourceRoot);
  if (!fs.statSync(root).isDirectory()) throw new Error('Private source root is not a directory');
  const segments = relative.split('/');
  let candidate = root;
  for (let i = 0; i < segments.length; i++) {
    candidate = path.join(candidate, segments[i]);
    const stat = fs.lstatSync(candidate);
    if (stat.isSymbolicLink()) throw new Error('Symlink in private import source: ' + relative);
    if (i < segments.length - 1 && !stat.isDirectory()) {
      throw new Error('Non-directory private import source ancestor: ' + relative);
    }
    if (i === segments.length - 1 && (!stat.isFile() || stat.nlink !== 1)) {
      throw new Error('Source file is not an independent regular file: ' + relative);
    }
  }
  if (fs.realpathSync(candidate) !== candidate || !candidate.startsWith(root + path.sep)) {
    throw new Error('Private import source escapes reviewed bundle: ' + relative);
  }
  return candidate;
}
