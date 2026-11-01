# Private curriculum production → public Showcase: secure integration contract

**Status: design only; no automatic producer-to-GitHub transfer is operating.** This document is the handoff for the hourly curriculum production and Showcase integration tasks. Do not treat a green CI check or a generated artifact as authorization to publish.

## Trust boundaries

1. **Private producer**: produces original student-facing HTML, media, captions/transcript, lesson metadata, and *draft* QA results. Store drafts, source media, teacher keys, student information, internal prompts, credentials, and unredacted screenshots only in private storage.
2. **Independent reviewers**: verify content and state standards, pedagogy, original/licensed rights, physical iPhone/iPad, Safari and Chrome, playback/replay, captions, keyboard/screen reader, persistence, teacher/student demo. They record actual reviewer, time, device and evidence. A model must not fabricate these attestations.
3. **Sanitizer and importer**: build a one-lesson extracted package containing only approved student-facing assets, redacted review summaries and SHA-256 evidence artifacts. Run `node scripts/import-approved-package.mjs <private-extracted-directory>` as a dry run first. On an isolated clean feature branch, `--apply --acknowledge-public-reviewed` copies validated referenced files and revalidates. It does not upload, commit, merge, or deploy.
4. **GitHub review PR**: a future service identity with least-privilege short-lived credentials may create a review branch and PR. It must never push directly to main or enable automatic merge. GitHub Actions checks structure, digests, orphaned files, and browser smoke tests. Human review verifies *truth* of attestations and legal clearance.
5. **Release**: only after owner authorization, enforced branch rules, green checks, actual-device review, and a tested staging deployment may a reviewed PR be merged. Confirm that a genuinely approved lesson appears on the website; otherwise the connection is not complete.

## Required source handoff fields

- `lessonId`, immutable `version`, `sourceCommit` or provenance ID, `entry`, full asset list with SHA-256, `packageSha256`, subject, grade, course, unit and standards references
- Copyright basis and actual clearance reviewer; source/license reference kept private if sensitive
- Four QA reports with the exact checks in `PUBLISHING.md`, actual reviewer identity and timestamp, supporting sanitized artifact hashes
- Physical device evidence with actual device model, OS version, tested timestamp and recorded observations; never substitute Chromium emulation for physical iOS
- A redaction report confirming no private student/teacher data, credentials, competitor videos, source secrets or internal-only notes

## Runnable reviewed-package draft PR staging (requires private runner)

The repository now includes `scripts/stage-reviewed-package.mjs`. On a **private, clean, trusted checkout** of `feature/qa-gated-publishing`, the runner can execute a read-only dry run with `node scripts/stage-reviewed-package.mjs /private/reviewed-bundle`. After independent reviews, rights clearance, redaction and owner-approved public staging, the authorized operator must obtain the **expected SHA-256 bundle fingerprint from an independent, immutable producer record** (not from the extracted directory itself). Run the dry-run command to inspect the computed fingerprint and compare it with the trusted record. Only then run `node scripts/stage-reviewed-package.mjs /private/reviewed-bundle --apply --acknowledge-public-reviewed --expected-bundle-sha256=<64-character-trusted-digest>` with `GH_TOKEN` supplied through the private runner secret store and git push credentials configured securely. The digest covers all allowed files' paths and bytes, rejects unexpected files/symlinks, and is mandatory for `--apply`. A digest self-reported by the same untrusted source **does not establish provenance or authenticity**. The script validates the package, refuses dirty trees or unexpected remotes, creates a unique feature branch, reuses the validated importer, runs unit tests, pushes only the reviewed files, and opens a **draft PR against the integration branch**, not main. It never merges or deploys. The operator must verify the PR, actual test evidence, and content rights before further action. The draft PR itself is PUBLIC; never invoke `--apply` on private or unreviewed content.

This script does **not** discover or fetch producer artifacts, provision credentials, guarantee evidence authenticity, or schedule transfers. The private producer storage, authenticated runner, source-to-runner delivery and owner approval are still required. The script intentionally fails closed if credentials or acknowledgements are absent.

## Proposed automated transport (not configured)

Prefer a **private production repository or restricted object storage** as the producer's durable handoff, with immutable versioned objects. A separate trusted integration runner receives a *reference* (not file contents or secrets) to a reviewed package, verifies expected source and digest, downloads with a short-lived read token, revalidates and sanitizes in an isolated workspace, then uses a narrowly scoped GitHub App installation token to create a dedicated Showcase feature-branch PR. Store credentials in the runner's secret store, never in a public workflow, browser, or repository. Use a replay-resistant unique package/version key and reject conflicting or duplicate imports. Keep raw QA artifacts private; include only redacted public evidence summaries.

**Missing before implementation**: confirmed producer artifact storage path, an authorized private runner/identity, a durable artifact-delivery event or queue, secret management, and release approver workflow. The hourly ChatGPT tasks do not inherently share files or credentials.

## Acceptance test

1. A synthetic *draft* lesson must fail to publish; orphaned files and missing evidence must fail CI.
2. A deliberately tampered asset or mismatched version must fail the importer and validator.
3. A fully reviewed, redacted **test fixture** must create a draft PR with no direct main write and no deployment.
4. A genuinely reviewed original lesson must pass independent review, actual iPhone/iPad tests and owner approval.
5. The approved lesson must render correctly from `catalog/approved.json` on staging and, after authorized release, on the live Showcase. Recheck video playback, captions, lesson navigation and persistence.
6. A failed or revoked token must stop transfer without exposing secrets, partially approving a lesson, or changing the live site.

## Current next actions

- Complete Chromium emulated mobile/tablet smoke tests in CI, then perform **physical** Safari/iPhone/iPad review separately.
- Identify an accessible **private** source for curriculum output; do not copy unapproved materials into this public repository.
- Configure enforceable branch protection / required checks (current access has not confirmed enforcement).
- Implement an authenticated producer handoff only after its source and credentials are verified.
- Preserve `main` and the separate `paper-lms` repository until verified release approval.

## Source fingerprint transport contract (implemented locally; external source not connected)

The private producer must publish a separate immutable record containing a unique source artifact ID, immutable version, the digest produced by `fingerprintReviewedBundle`, expected lesson ID, creation time, and an authorized reviewer reference. Deliver that record over a separately authenticated trusted channel; never trust a digest embedded in the same unverified ZIP or directory. The staging tool rejects missing/mismatched pinned digests, unexpected files, and symlinks before any GitHub push. The fingerprint is a transport-integrity check, **not** a replacement for human review, signature verification, rights clearance or actual iOS testing. The authorized runner must keep a private replay ledger keyed by source ID + version + digest and must not run concurrent staging jobs for the same package. No source registry, credential service or runner is provisioned yet.
