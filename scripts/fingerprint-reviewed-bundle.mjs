import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Deterministic digest for an extracted, already-reviewed private handoff.
 * Includes every regular file's relative path and exact bytes; refuses
 * symlinks and unexpected files before any public staging operation.
 * The expected digest MUST arrive from a trusted independent handoff record,
 * not be copied from an untrusted bundle itself.
 */
export function fingerprintReviewedBundle(source) {
  const root = fs.realpathSync(source);
  const catalogFile = path.join(root, 'catalog', 'approved.json');
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
  if (!Array.isArray(catalog.lessons) || catalog.lessons.length !== 1 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(catalog.lessons[0]?.id || '')) {
    throw new Error('Bundle fingerprint requires exactly one valid lesson');
  }
  const id = catalog.lessons[0].id;
  const allowed = new Set(['catalog/approved.json']);
  const allowedPrefixes = ['lessons/' + id + '/', 'evidence/' + id + '/'];
  const paths = [];
  let totalBytes = 0;
  function walk(directory, prefix = '') {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + item.name;
      const absolute = path.join(directory, item.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error('Symlink in private handoff: ' + relative);
      // A hardlink can expose a file outside the reviewed package without a symlink.
      // Reject it before hashing or staging any bytes into a public repository.
      if (stat.isFile() && stat.nlink !== 1) {
        throw new Error('Hardlinked file in private handoff: ' + relative);
      }
      if (stat.isDirectory()) {
        walk(absolute, relative + '/');
      } else if (stat.isFile()) {
        if (!allowed.has(relative) && !allowedPrefixes.some(p => relative.startsWith(p))) {
          throw new Error('Unexpected file in private handoff: ' + relative);
        }
        if (stat.size < 1 || stat.size > 95 * 1024 * 1024) {
          throw new Error('Empty or oversized private handoff file: ' + relative);
        }
        totalBytes += stat.size;
        if (totalBytes > 512 * 1024 * 1024) throw new Error('Private handoff exceeds size limit');
        paths.push(relative);
        if (paths.length > 512) throw new Error('Private handoff exceeds file-count limit');
      } else throw new Error('Unsupported private handoff entry: ' + relative);
    }
  }
  walk(root);
  paths.sort();
  const digest = crypto.createHash('sha256');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  for (const relative of paths) {
    const absolute = path.join(root, ...relative.split('/'));
    // Recheck each file at open time. A prior directory walk alone cannot
    // protect against a file being swapped for a symlink or hardlink before
    // hashing. Production runners must use a private, isolated POSIX volume.
    if (typeof fs.constants.O_NOFOLLOW !== 'number') {
      throw new Error('Private handoff hashing requires O_NOFOLLOW support');
    }
    const stat = fs.lstatSync(absolute, { bigint: true });
    if (!stat.isFile() || stat.nlink !== 1n) {
      throw new Error('Unsafe private handoff file before hashing: ' + relative);
    }
    const fileHash = crypto.createHash('sha256');
    const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      const opened = fs.fstatSync(fd, { bigint: true });
      if (!opened.isFile() || opened.nlink !== 1n ||
          opened.dev !== stat.dev || opened.ino !== stat.ino || opened.size !== stat.size) {
        throw new Error('Private handoff file changed before hashing: ' + relative);
      }
      let position = 0;
      const expectedSize = Number(stat.size);
      while (position < expectedSize) {
        const n = fs.readSync(fd, buffer, 0, Math.min(buffer.length, expectedSize - position), position);
        if (n === 0) throw new Error('Unexpected EOF while hashing: ' + relative);
        fileHash.update(buffer.subarray(0, n));
        position += n;
      }
      const after = fs.fstatSync(fd, { bigint: true });
      const current = fs.lstatSync(absolute, { bigint: true });
      for (const observed of [after, current]) {
        if (!observed.isFile() || observed.nlink !== 1n ||
            observed.dev !== stat.dev || observed.ino !== stat.ino ||
            observed.size !== stat.size || observed.mtimeNs !== stat.mtimeNs ||
            observed.ctimeNs !== stat.ctimeNs) {
          throw new Error('Private handoff file changed during hashing: ' + relative);
        }
      }
    } finally {
      fs.closeSync(fd);
    }
    digest.update(relative + '\0' + fileHash.digest('hex') + '\n');
  }
  return { sha256: digest.digest('hex'), fileCount: paths.length, totalBytes };
}
