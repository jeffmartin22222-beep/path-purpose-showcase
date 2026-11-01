import fs from 'node:fs';
import path from 'node:path';

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
    if (fs.existsSync(candidate) && !fs.lstatSync(candidate).isFile())
      throw new Error('Replay ledger or lock must be a regular file');
    if (fs.existsSync(candidate) && fs.lstatSync(candidate).isSymbolicLink())
      throw new Error('Replay ledger or lock cannot be a symlink');
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
    let ledger = { schemaVersion: 1, records: [] };
    if (fs.existsSync(ledgerPath)) {
      ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
      if (ledger.schemaVersion !== 1 || !Array.isArray(ledger.records))
        throw new Error('Invalid private replay ledger schema');
    }
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
    };
    const entry = { ...Object.fromEntries(fields.map(k => [k, handoff[k]])),
      status: 'pending', updatedAt: new Date().toISOString() };
    ledger.records.push(entry);
    persist(); // Reserve BEFORE any push or PR; failure remains pending.
    const result = work();
    if (typeof result !== 'string' || !/^https:\/\/github\.com\//.test(result))
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
