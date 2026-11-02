import fs from 'node:fs';
import path from 'node:path';

/**
 * Read a producer Ed25519 private key from a pinned descriptor, not a pathname
 * reopened after permission checks. The key must remain outside public repos
 * and on an isolated, trusted POSIX filesystem. This does not manage key custody.
 */
export function readPrivateSigningKey(candidate) {
  const absolute = path.resolve(candidate);
  const unsafe = 'Unsafe producer signing key: require a stable private regular file (0600, no links, at most 16 KiB)';
  const valid = stat => stat.isFile() && stat.nlink === 1n &&
    (stat.mode & 0o077n) === 0n && stat.size > 0n && stat.size <= 16384n;
  const same = (a, b) => a.dev === b.dev && a.ino === b.ino &&
    a.size === b.size && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs;
  if (typeof fs.constants.O_NOFOLLOW !== 'number') throw new Error(unsafe);
  const before = fs.lstatSync(absolute, { bigint: true });
  if (!valid(before) || fs.realpathSync(absolute) !== absolute) throw new Error(unsafe);
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd, { bigint: true });
    if (!valid(opened) || !same(before, opened)) throw new Error(unsafe);
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd, { bigint: true });
    const current = fs.lstatSync(absolute, { bigint: true });
    if (!valid(after) || !valid(current) || !same(before, after) ||
        !same(before, current) || bytes.length !== Number(before.size)) {
      throw new Error(unsafe);
    }
    return bytes;
  } finally {
    fs.closeSync(fd);
  }
}
