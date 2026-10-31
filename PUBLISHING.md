# Curriculum Showcase publishing and evidence policy

## State and safeguards

The public Showcase is a **prototype**. Its Biology interactive is illustrative and is **not** an approved curriculum package. The `catalog/approved.json` catalog is deliberately empty. The main website is not to be replaced or deployed until approved by the owner and verified on physical iPhone/iPad. The branch and pull request are development only.

## Four-pass QA

Every approved lesson must have a local student-facing entry `lessons/<id>/index.html`, a matching SHA-256 digest in the catalog, an `assets` array listing and hashing **every** additional lesson file, a `packageSha256` digest of the sorted `[{path,sha256}, ...]` entry/asset manifest, original or documented licensed content rights, and four signed-off QA gates. Each gate's `evidence` array points to one or more JSON reports in `evidence/<id>/<gate>/`. Reports must match the lesson ID, version, HTML hash, full package hash, reviewer and UTC timestamp, and contain check results with notes and at least one hashed supporting artifact stored under the same evidence directory. The validator checks the files, required checks and hashes; it **cannot** establish that a human actually performed a test or that a report is truthful.

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

**No automatic connection from the hourly curriculum builder to GitHub has been established.** Never put unreviewed curriculum, student records, credentials, teacher-only keys, copyrighted source videos, or unredacted device screenshots in this **public** repository. Keep unapproved artifacts in a private production workspace. After rights review and actual QA, an authorized contributor can copy a fully reviewed, redacted student package and evidence into a dedicated PR, compute content and artifact hashes, and add it to the approved catalog. The GitHub Actions validation must pass and a human must audit evidence before merging. No CI workflow should auto-merge or deploy an unreviewed PR. Do not treat a green CI check alone as publication authorization.

## Running the checks

```sh
node --test tests/*.test.mjs
node scripts/validate-catalog.mjs
```

Both use Node 22 built-ins only. Negative tests deliberately create synthetic approvals in a temporary directory; these fixtures never enter the real catalog. The validator rejects changed HTML or assets, missing artifacts, traversal, incomplete physical-device metadata, and missing rights clearance.

## Release criteria and blockers

- Verify production artifact transfer mechanism and credentials/permissions without exposing secrets.
- Add and test catalog-driven mobile website (development branch only).
- Obtain real, redacted content/rights, pedagogy, technical device and experience evidence for the first approved lesson.
- Test iPhone and iPad in Safari and Chrome, video playback, captions, accessibility and persistence.
- Obtain owner approval before merging/deploying to the live Showcase.
