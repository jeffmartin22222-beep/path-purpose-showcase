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

The repository now includes `scripts/stage-reviewed-package.mjs`. On a **private, clean, trusted checkout** of `feature/qa-gated-publishing`, the runner can execute a read-only dry run with `node scripts/stage-reviewed-package.mjs /private/reviewed-bundle`. After independent reviews, rights clearance, redaction and owner-approved public staging, the authorized operator must obtain the **expected SHA-256 bundle fingerprint from an independent, immutable producer record** (not from the extracted directory itself). Run the dry-run command to inspect the computed fingerprint and compare it with the trusted record. Only then run `node scripts/stage-reviewed-package.mjs /private/reviewed-bundle --apply --acknowledge-public-reviewed --expected-bundle-sha256=<64-character-trusted-digest> --signed-handoff-record=/private/trusted-record.json --trusted-producer-public-key=/private/keys/producer-public.pem` with `GH_TOKEN` supplied through the private runner secret store and git push credentials configured securely. The record and trusted public key must be outside both the bundle and the public Showcase checkout. The digest covers all allowed files' paths and bytes, rejects unexpected files/symlinks, and is mandatory for `--apply`. A digest self-reported by the same untrusted source **does not establish provenance or authenticity**. The script validates the package, refuses dirty trees or unexpected remotes, creates a unique feature branch, reuses the validated importer, runs unit tests, pushes only the reviewed files, and opens a **draft PR against the integration branch**, not main. It never merges or deploys. The operator must verify the PR, actual test evidence, and content rights before further action. The draft PR itself is PUBLIC; never invoke `--apply` on private or unreviewed content.

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

## Independent signed producer provenance (verification implemented; signer not provisioned)

A private producer must sign a detached handoff record with an Ed25519 private key kept outside GitHub, lesson bundles and public artifacts. The authorized runner must receive its trusted PEM public key through a separate, owner-approved channel; never trust a key supplied by the same untrusted package.

The signed record is JSON with exactly `payload` and `signature` fields. `signature` is standard base64 of a raw 64-byte Ed25519 signature over UTF-8 bytes from `canonicalHandoffPayload(payload)` in `scripts/verify-signed-handoff.mjs`. The payload must have exactly these string fields: `bundleSha256`, `expiresAt`, `issuedAt`, `lessonId`, `lessonVersion`, `repository`, `schemaVersion`, `sourceArtifactId`. The verifier sorts the keys lexically before serializing, so producers should call the exported canonicalization helper.

Example payload format (illustrative only; NOT an approval or a valid signature):

```json
{
  "schemaVersion": "1",
  "repository": "jeffmartin22222-beep/path-purpose-showcase",
  "lessonId": "inside-the-cell",
  "lessonVersion": "1.0.0",
  "bundleSha256": "<64 lowercase hex characters>",
  "sourceArtifactId": "private:immutable-object-v1",
  "issuedAt": "2026-11-01T00:00:00Z",
  "expiresAt": "2026-11-02T00:00:00Z"
}
```

The signed record must be transported independently from the reviewed bundle. The signed SHA-256, lesson identity and version must match the independently verified bundle. The verifier rejects missing, malformed, expired, future-dated or longer-than-seven-day records and untrusted signatures **before git operations**. This authenticates producer provenance only; it does not prove human review, standards alignment, copyright rights, physical iOS testing or release authorization.

**Still missing externally:** private immutable artifact storage, signer/key management, source event delivery, a trusted runner with short-lived GitHub credentials, a private replay ledger keyed by artifact/version/digest, independent reviewers, protected branches and explicit owner-authorized release. A deterministic review branch is not a complete distributed replay ledger. No automatic connection or deployment is claimed.

## Private replay ledger (implementation added 2026-11-01; NOT provisioned)

The trusted runner now **must** set `PP_PRIVATE_HANDOFF_LEDGER` to an absolute file path in a durable, restricted **shared** private directory, outside the public Showcase checkout and reviewed bundle. This is a local-filesystem coordination contract; do not run two independent hosts with different ledger copies. Configure a shared filesystem with atomic exclusive file creation and rename, or replace this component with a transactional shared database before multi-host production. Never put the ledger, lock, token, signing private key or raw handoff in GitHub.

**Explicit first-time initialization:** The authorized operator must provision a brand-new, restricted, durable private directory and run `node scripts/init-private-handoff-ledger.mjs /absolute/private/replay.json --acknowledge-new-private-ledger` exactly once. The command uses exclusive creation (`wx`), mode `0600`, and file/directory fsync; it refuses an existing ledger or a path inside the public repository. Stage only after confirming the newly initialized ledger is on the shared private volume and is protected by appropriate backups and access controls. **If the ledger disappears, staging now fails closed instead of silently creating an empty history.** Investigate and recover the authoritative ledger from secure backup; do not initialize a replacement to bypass pending or staged records. The CLI bootstrap is not an automatic producer connection or permission to publish. Unit tests use isolated synthetic ledger files.\n\nAfter independent Ed25519 verification, digest matching, clean branch and origin checks, the staging tool acquires an exclusive `.lock` file, rejects duplicate source artifact IDs and duplicate lesson ID/version pairs, and durably reserves the handoff as `pending` **before** any branch creation, push or PR. On a successful draft PR, it records `staged` and the review PR URL. On a failed or interrupted attempt, the pending record remains: **do not automatically retry or delete it**. An authorized operator must reconcile the GitHub branch/PR and source artifact, document the outcome privately, and only then manually resolve the ledger entry. A stale lock after a crash similarly requires manual inspection before removal. Never bypass this by pointing the runner at a new empty ledger.

The ledger is defense-in-depth for duplicate/replay protection, **not** proof of approval or a substitute for private artifact storage, signing key custody, a trusted runner, least-privilege credentials, independent reviewers, protected branches or owner authorization. No production ledger has been provisioned, and no automatic transfer has been demonstrated. Unit tests use temporary synthetic ledgers only.

### Replay-ledger integrity hardening (2026-11-01)

The private ledger now checks every existing record's exact schema, allowed pending/staged state, unique source artifact ID and unique lesson/version pair **before** allowing a new staging callback. A staged record must point to a numeric pull request in this exact Showcase repository; unrelated GitHub URLs are rejected. It also limits existing ledger size and synchronizes the containing directory after atomic ledger-file rename. If the underlying private filesystem cannot support the required durability and exclusive locking semantics, the runner must stop rather than treat it as safe. Synthetic tests cover malformed records, duplicate source IDs and spoofed PR URLs. These controls remain **unprovisioned**: no shared production ledger or authenticated producer connection has been demonstrated.

### Public import destination containment (2026-11-01)

The reviewed-package importer now uses `scripts/safe-import-path.mjs` to reject traversal, pre-existing destination files, dangling symlinks, symlinked parent directories and non-directory ancestors **before copying any reviewed file**. Lexical path containment alone was insufficient: a pre-existing `lessons/<id>` or `evidence/<id>` symlink could otherwise redirect a public import write outside the Showcase checkout. Five synthetic regression tests exercise these cases. The destination checks are defense-in-depth, not a safe way to share a checkout with an untrusted process capable of changing filesystem entries between validation and copying. Use an isolated, trusted runner; preserve the current clean-tree, signed-source, four-gate, review PR and owner-authorization requirements. No private producer connection or physical-device approval has been established by this change.

### Hardlink containment (2026-11-01)

The private-bundle fingerprint and standalone reviewed-package importer now reject any source regular file with a hardlink count other than one. A hardlink is not a symlink: without this check, a private bundle could reference the same inode as a file outside the reviewed package, allowing unrelated bytes to be read and copied even though the path appears to be inside the bundle. The staging flow invokes the fingerprint before validating or importing; the standalone importer enforces the same constraint independently. Synthetic negative tests cover an out-of-bundle hardlink and a manifest-valid hardlinked HTML entry. This is defense-in-depth, not proof of source authenticity or content approval. Use an isolated, trusted filesystem; hardlink-count checks cannot eliminate races from untrusted processes that can mutate the checkout during staging.


## Private producer signing command (implemented; NOT a connected producer)

After an independent curriculum/rights/device review and **only** in a trusted private producer environment, an authorized operator can issue the detached signed record required by the existing staging verifier:

```sh
node scripts/sign-private-handoff.mjs \
  /private/immutable-reviewed-bundle \
  /private/keys/producer-ed25519-private.pem \
  private:immutable-object-version-id \
  /private/records/lesson-handoff.json \
  --acknowledge-independent-review
```

This command requires exactly one schema-valid, four-gate reviewed lesson; fingerprints every package file; signs the canonical Ed25519 payload with a private key that must be an independent regular file with restricted permissions; issues a 24-hour UTC expiration; refuses existing output files; and writes the detached record with mode 0600 and file/directory fsync. It never pushes, merges, deploys, grants approval or establishes a transport. The acknowledgement is an **operator assertion**, not cryptographic evidence that reviews actually occurred. A schema-valid but fabricated review remains unsafe and must not be signed.

Provision an Ed25519 key using an approved private key-management process, preferably a managed signer/HSM. Keep the private key outside GitHub, bundles, logs, and public CI; distribute the corresponding trusted public key through a separately authenticated channel. The signed JSON record must travel **independently** of the immutable source bundle to the authorized private runner. The runner then verifies the source fingerprint against the signed record, checks replay history and opens only a draft review PR using `scripts/stage-reviewed-package.mjs`. Do not put the detached record in the public lesson/evidence folders.

**Not yet implemented/proven:** producer object storage, immutable artifact identifier issuance, trusted signer service/key custody, authenticated delivery of record and bundle, runner credentials, real shared replay ledger and an end-to-end signed draft-PR acceptance run. Synthetic signer tests verify cryptography and rejection behavior, not these external integrations. Physical iOS, SME, licensing and owner release approval remain mandatory.
