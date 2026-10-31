# Path + Purpose Curriculum Showcase

This is a public, mobile-first **prototype**. The current Inside the Cell interactive is illustrative and **not** a released lesson. The approved catalog is intentionally empty until real, complete QA and rights evidence is available.

## Integration status — 2026-10-31

- Development branch: `feature/qa-gated-publishing`; draft pull request [#1](https://github.com/jeffmartin22222-beep/path-purpose-showcase/pull/1).
- Read-only catalog UI added to `index.html`; it fetches `catalog/approved.json` and renders only structurally approved lesson entries with safe DOM APIs.
- Node validation requires original/licensed rights attestation, SHA-256 hashes for the HTML and **all** lesson assets, a package hash, and four reviewed QA evidence reports with required check IDs and supporting hashed artifacts.
- Automated positive/negative tests now also reject orphaned public lesson folders and unreferenced evidence artifacts. GitHub Actions runs real Chromium **emulated** phone/tablet browser smoke tests for overflow, catalog fail-closed behavior, feedback, and reset. These do **not** replace physical iPhone/iPad Safari, video, accessibility, or persistence QA.
- An explicit, dry-run-first `scripts/import-approved-package.mjs` supports transferring a **manually approved** extracted private production package into a clean feature branch. It does not upload, commit, merge or deploy.
- No automatic synchronization from the hourly curriculum builder to this repository is operating yet. The curriculum task reports Inside the Cell **v0.5** with five offline Chromium viewport checks and 15 validator scenarios, but the source package has not been securely transferred here. Its videos are storyboards/scripts rather than finished narrated MP4s, and physical iPhone/iPad, expert content review, teacher authorization, and release approval remain outstanding. See [secure production handoff](docs/production-handoff.md).
- GitHub rulesets query returned no repository rulesets; branch protection could not be inspected with current app permissions. A green workflow alone is **not** an enforceable merge gate or proof of QA authenticity.

## Verify

```sh
node --test tests/*.test.mjs
node scripts/validate-catalog.mjs
# After installing Playwright and Chromium:
node tests/browser-smoke.mjs
node scripts/import-approved-package.mjs /path/to/private/extracted-reviewed-package
```

See [PUBLISHING.md](PUBLISHING.md) for the QA checklist, secure handoff, and remaining blockers.

**Do not merge or deploy** until evidence has been independently audited, mobile behavior has been tested on real devices, and the owner authorizes release.
