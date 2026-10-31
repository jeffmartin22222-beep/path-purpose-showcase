# Curriculum Showcase publishing and evidence policy

## State and safeguards

The public Showcase is a **prototype**. Its Biology interactive is illustrative and is **not** an approved curriculum package. The `catalog/approved.json` catalog is deliberately empty. The main website is not to be replaced or deployed until approved by the owner and verified on physical iPhone/iPad. The branch and pull request are development only.

## Four-pass QA

Every approved lesson must have a local student-facing entry `lessons/<id>/index.html`, a matching SHA-256 digest in the catalog, an `assets` array listing and hashing **every** additional lesson file, a `packageSha256` digest of the sorted `[{path,sha256}, ...]` entry/asset manifest, original or documented licensed content rights, and four signed-off QA gates. Each gate's `evidence` array points to one or more JSON reports in `evidence/<id>/<gate>/`. Reports must match the lesson ID, version, HTML hash, full package hash, reviewer and UTC timestamp, and contain check results with notes and at least one hashed supporting artifact stored under the same evidence directory. The validator checks the files, required checks and hashes; it **cannot** establish that a human actually performed a test or that a report is truthful. It also rejects orphaned lesson directories and unreferenced evidence files so that a public branch cannot silently accumulate unapproved draft packages or stray private review records.

| Gate | Required checks |
| --- | --- |
| content | standards, accuracy, copyright |
| pedagogy | student_agency, scaffolding, feedback |
| technical | iphone, ipad, video, captions, keyboard, screen_reader, persistence |
| experience | student_flow, teacher_review, demo |

For `iphone` and `ipad`, reports must include `deviceModel`, `osVersion`, and UTC `testedAt` for the actual physical device. Do not fill these fields with guesses or simulations. Accessibility includes real screen-reader and keyboard checks. Video evidence must document actual playback, pause/replay, captions/transcript and mobile playback; persistence evidence must document refresh/resume. Add additional checks and evidence as necessary.

### Evidence report example (template only; **not a passed test**)

```json
{
  "lessonId": "inside-the-cell",
  "version": "1",
  "gate": "technical",
  "entrySha256": "<SHA-256 OF APPROVED HTML>",
  "packageSha256": "<SHA-256 OF SORTED ENTRY/ASSET MANIFEST>",
  "reviewedBy": "<ACTUAL REVIEWER>",
  "reviewedAt": "<UTC ISO DATE>",
  "checks": [
    {"id": "ipad", "result": "passed", "notes": "<OBSERVATIONS>", "deviceModel": "<ACTUAL DEVICE>", "osVersion": "<ACTUAL OS>", "testedAt": "<UTC ISO DATE>"}
  ],
  "artifacts": [
    {"path": "evidence/inside-the-cell/technical/<REDACTED RECORD>", "sha256": "<SHA-256 OF RECORD>"}
  ]
}
```

This example is incomplete and will fail validation, as intended.

## Secure production handoff

**No automatic connection from the hourly curriculum builder to GitHub has been established.** Never put unreviewed curriculum, student records, credentials, teacher-only keys, copyrighted source videos, or unredacted device screenshots in this **public** repository. Keep unapproved artifacts in a private production workspace. After rights review and actual QA, an authorized contributor can transfer an extracted, fully reviewed, redacted student package with the **same folder structure as this repository** and a one-lesson `catalog/approved.json` into a dedicated feature-branch PR. Use `node scripts/import-approved-package.mjs /path/to/private/extracted-package` for a read-only dry run. Only after manual redaction and rights review, run `node scripts/import-approved-package.mjs /path/to/private/extracted-package --apply --acknowledge-public-reviewed` from a **clean feature branch**. The importer validates the complete package, copies only referenced files, refuses overwrites, revalidates, and does not commit, merge, upload, or deploy. The GitHub Actions validation must pass and a human must audit evidence before merging. No CI workflow should auto-merge or deploy an unreviewed PR. Do not treat a green CI check alone as publication authorization.

**Current limitation:** The hourly curriculum builder's latest Inside the Cell v0.4 package is still release-blocked (physical iPhone/iPad, science review, teacher authorization and narrated video). It is **not** an approved Showcase package. The private production-to-GitHub handoff remains manual until a trusted source and credential design are verified.

## Running the checks

```sh
node --test tests/*.test.mjs
node scripts/validate-catalog.mjs
# Browser smoke test (requires installed playwright and Chromium):
node tests/browser-smoke.mjs
node tests/browser-fixture.mjs
```

The first two commands use Node 22 built-ins only. The browser smoke test uses Playwright Chromium (installed by CI) to exercise the actual Showcase at phone and tablet viewport sizes, verify no horizontal overflow, test both empty and populated catalogs, and exercise interactive reset/feedback. For each genuinely approved lesson, it loads the lesson at both sizes and rejects missing local assets, external network dependencies, runtime errors and horizontal overflow. The synthetic browser fixture runner checks the populated-catalog path and confirms that external and missing assets fail, without placing any fake approvals in the repository. Browser emulation is **not** physical iOS Safari or iPad QA. Negative tests deliberately create synthetic approvals in a temporary directory; these fixtures never enter the real catalog. The validator rejects changed HTML or assets, missing artifacts, traversal, incomplete physical-device metadata, and missing rights clearance.

A passing browser smoke test with an empty catalog **does not mean any curriculum lesson has been browser-tested**. The synthetic fixture is not curriculum and does not constitute physical iPhone/iPad QA or content approval.

## Release criteria and blockers

- Verify production artifact transfer mechanism and credentials/permissions without exposing secrets.
- Add and test catalog-driven mobile website (development branch only).
- Obtain real, redacted content/rights, pedagogy, technical device and experience evidence for the first approved lesson.
- Test iPhone and iPad in Safari and Chrome, video playback, captions, accessibility and persistence.
- Obtain owner approval before merging/deploying to the live Showcase.
