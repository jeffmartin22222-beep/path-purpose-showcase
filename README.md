# Path + Purpose Curriculum Showcase

This is a public, mobile-first **prototype**. The current Inside the Cell interactive is illustrative and **not** a released lesson. The approved catalog is intentionally empty until real, complete QA and rights evidence is available.

## Integration status — 2026-10-31

- Development branch: `feature/qa-gated-publishing`; draft pull request [#1](https://github.com/jeffmartin22222-beep/path-purpose-showcase/pull/1).
- Read-only catalog UI added to `index.html`; it fetches `catalog/approved.json` and renders only structurally approved lesson entries with safe DOM APIs.
- Node validation requires original/licensed rights attestation, SHA-256 hashes for the HTML and **all** lesson assets, a package hash, and four reviewed QA evidence reports with required check IDs and supporting hashed artifacts.
- Automated negative tests and static Showcase smoke tests run in GitHub Actions.
- An explicit, dry-run-first `scripts/import-approved-package.mjs` supports transferring a **manually approved** extracted private production package into a clean feature branch. It does not upload, commit, merge or deploy.
- No automatic synchronization from the hourly curriculum builder to this repository is operating yet. The existing production slice has not passed physical iPhone/iPad, expert content review and release approval.
- GitHub rulesets query returned no repository rulesets; branch protection could not be inspected with current app permissions. A green workflow alone is **not** an enforceable merge gate or proof of QA authenticity.

## Verify

```sh
node --test tests/*.test.mjs
node scripts/validate-catalog.mjs
node scripts/import-approved-package.mjs /path/to/private/extracted-reviewed-package
```

See [PUBLISHING.md](PUBLISHING.md) for the QA checklist, secure handoff, and remaining blockers.

**Do not merge or deploy** until evidence has been independently audited, mobile behavior has been tested on real devices, and the owner authorizes release.
