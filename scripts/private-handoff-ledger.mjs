import fs from 'node:fs';
import path from 'node:path';

// Never silently accept a damaged or partially overwritten replay ledger.
// Otherwise an invalid prior record could be ignored during duplicate checks.
function validateExistingLedger(ledger) {
  if (!ledger || ledger.schemaVersion !== 1 || !Array.isArray(ledger.records) ||
      ledger.records.length > 100000) throw new Error('Invalid private replay ledger schema');
  const sourceIds = new Set();
  const versions = new Set();
  for (const record of ledger.records) {
    const staged = record?.status === 'staged';
    const pending = record?.status === 'pending';
    const keys = staged
      ? ['bundleSha256', 'lessonId', 'lessonVersion', 'prUrl', 'sourceArtifactId', 'status', 'updatedAt']
      : ['bundleSha256', 'lessonId', 'lessonVersion', 'sourceArtifactId', 'status', 'updatedAt'];
    if ((!staged && !pending) || !record || Array.isArray(record) ||
        JSON.stringify(Object.keys(record).sort()) !== JSON.stringify(keys) ||
        ['sourceArtifactId', 'lessonId', 'lessonVersion', 'updatedAt'].some(k =>
          typeof record[k] !== 'string' || !record[k].trim()) ||
        !/^[a-f0-9]{64}$/.test(record.bundleSha256) ||
        (staged && !/^https:\/\/github\.com\/jeffmartin22222-beep\/path-purpose-showcase\/pull\/[1-9][0-9]*$/.test(record.prUrl))) {
      throw new Error('Invalid private replay ledger record');
    }
    const versionKey = JSON.stringify([record.lessonId, record.lessonVersion]);
    if (sourceIds.has(record.sourceArtifactId) || versions.has(versionKey))
      throw new Error('Duplicate entries in private replay ledger');
    sourceIds.add(record.sourceArtifactId);
    versions.add(versionKey);
  }
}

/**
 * Private-runner-only replay ledger. The file and its parent directory must
 * live on a durable, shared, access-controlled filesystem OUTSIDE this repo.
 * A pending entry deliberately blocks retries after an interrupted push/PR.
 * The operator must reconcile GitHub state before manually resolving it.
 */
export function withPrivateHandoffLedger(ledgerPath, handoff, work) {
  if (typeof ledgerPath !== 'string' || !path.isAbsolute(ledgerPath))
    throw new Error('Private replay ledger must be an absolute path');
  if (typeof work !== 'function') throw new Error('Ledger requires staging callback');
  const fields = ['sourceArtifactId', 'lessonId', 'lessonVersion', 'bundleSha256'];
  if (!handoff || fields.some(k => typeof handoff[k] !== 'string' || !handoff[k].trim()))
    throw new Error('Incomplete private handoff identity');
  if (!/^[a-f0-9]{64}$/.test(handoff.bundleSha256))
    throw new Error('Invalid private handoff bundle digest');
  const directory = path.dirname(ledgerPath);
  if (fs.realpathSync(directory) !== directory)
    throw new Error('Replay ledger parent must not be a symlink');
  for (const candidate of [ledgerPath, ledgerPath + '.lock']) {
    let stat;
    try { stat = fs.lstatSync(candidate); }
    catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    // lstat (rather than existsSync) also catches dangling symlinks.
    if (stat.isSymbolicLink() || !stat.isFile())
      throw new Error('Replay ledger or lock must be a regular non-symlink file');
  }
  const lockPath = ledgerPath + '.lock';
  let lock;
  try {
    lock = fs.openSync(lockPath, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new Error('Private replay ledger locked; reconcile any interrupted staging before retry');
    throw error;
  }
  try {
    fs.writeSync(lock, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
    fs.fsyncSync(lock);
    // A missing ledger could mean deleted replay history. Never silently
    // bootstrap an empty ledger on a staging attempt: fail closed instead.
    if (!fs.existsSync(ledgerPath))
      throw new Error('Private replay ledger missing; provision explicitly before staging');
    const stat = fs.statSync(ledgerPath);
    if (stat.size > 16 * 1024 * 1024) throw new Error('Private replay ledger exceeds size limit');
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    validateExistingLedger(ledger);
    if (ledger.records.some(r =>
      r.sourceArtifactId === handoff.sourceArtifactId ||
      (r.lessonId === handoff.lessonId && r.lessonVersion === handoff.lessonVersion)))
      throw new Error('Private handoff replay or conflicting lesson version; reconcile ledger and GitHub manually');

    const persist = () => {
      const temporary = ledgerPath + '.tmp-' + process.pid;
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try {
        fs.writeFileSync(fd, JSON.stringify(ledger, null, 2) + '\n');
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(temporary, ledgerPath);
      // Durable rename requires syncing the parent directory as well as the file.
      // If this filesystem cannot provide that guarantee, fail closed.
      const directoryFd = fs.openSync(directory, 'r');
      try { fs.fsyncSync(directoryFd); }
      finally { fs.closeSync(directoryFd); }
    };
    const entry = { ...Object.fromEntries(fields.map(k => [k, handoff[k]])),
      status: 'pending', updatedAt: new Date().toISOString() };
    ledger.records.push(entry);
    persist(); // Reserve BEFORE any push or PR; failure remains pending.
    const result = work();
    if (typeof result !== 'string' ||
        !/^https:\/\/github\.com\/jeffmartin22222-beep\/path-purpose-showcase\/pull\/[1-9][0-9]*$/.test(result))
      throw new Error('Staging did not return a GitHub review PR URL');
    entry.status = 'staged';
    entry.prUrl = result;
    entry.updatedAt = new Date().toISOString();
    persist();
    return result;
  } finally {
    fs.closeSync(lock);
    fs.unlinkSync(lockPath);
  }
}
