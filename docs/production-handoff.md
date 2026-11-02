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

## Offline signed-provenance preflight (implemented 2026-11-01)

A trusted operator can now verify the actual Ed25519 producer signature and immutable
bundle digest **without** supplying `GH_TOKEN`, creating a Git branch, writing the
private replay ledger, copying lesson files, or opening a public PR:

```sh
node scripts/stage-reviewed-package.mjs /private/reviewed-bundle \
  --expected-bundle-sha256=<digest-from-independent-trusted-source> \
  --signed-handoff-record=/private/detached-record.json \
  --trusted-producer-public-key=/private/trusted-producer.pem
```

All three provenance options are required together for a signed dry run.
A plain dry run remains a structural-only check and explicitly reports that
producer provenance was **not** verified. Invalid signatures, mismatched digests,
and missing trusted-key options fail before any GitHub action. Synthetic regression
coverage exercises signer → bundle fingerprint → staging preflight, including
wrong-key and digest-mismatch rejection. These tests **do not** establish a live
private transfer, independent human review, media rights, physical iOS testing,
or a successful draft-PR creation. Do not move the source bundle, key, or detached
record into the public repository. Production still requires the independently
provisioned runner, durable replay ledger, private source transport and human
release process.

### Trusted runner integration-branch freshness (2026-11-01)

Before creating a draft review branch, the private staging entrypoint now fetches the exact `refs/heads/feature/qa-gated-publishing` from the verified `origin` and requires `HEAD` to match `FETCH_HEAD`. This prevents staging with an outdated local QA gate after the integration branch advances. The check is after signature verification and before the replay ledger reserves a source version. It does **not** provision a runner, authenticate the curriculum reviewers, protect GitHub main, or prevent a later base-branch change during PR review; CI and independent review must rerun against the current head. A failed fetch or stale checkout blocks staging; never bypass it by weakening the gate.

### Private replay ledger filesystem permissions (2026-11-01)

The staging ledger now fails closed if its parent directory is world-writable, or if the existing ledger/lock is hardlinked or has any group/other permission bits. Provision the authoritative ledger with mode **0600** and a non-world-writable, access-controlled parent directory on a durable filesystem supporting exclusive creation, atomic rename and directory fsync. A group-shared runner must use a deliberately managed service identity/ACL design rather than loosening the ledger file to 0660. Do not store this file under public CI workspaces or shared temporary folders. Synthetic tests cover 0644/0660/0666 ledger files, hardlinks and a world-writable parent. These checks do not provision the real runner, private storage, reviewer identity or trusted transport.


### Detached handoff trust-file hardening (2026-11-01)

The signed-handoff verifier now fails closed if the detached record or independently provisioned trusted producer public key is a symlink (including a symlinked parent), hardlinked file, group/world-writable file, empty file, or file larger than 16 KiB. The two inputs must be distinct regular files. The staging CLI now preserves the original resolved pathname rather than following symlinks before verification, so aliases cannot evade these checks. Regression tests cover symlink, hardlink, writable and same-file inputs.

**Scope:** these checks protect local trust-input integrity on an isolated trusted runner; they do not provision the producer, establish custody of the trusted key, authenticate human QA, or complete any private transport. A file owned by the runner account can still be replaced by an attacker with equivalent account privileges. Provision immutable private artifacts, a dedicated least-privilege runner, short-lived GitHub credentials and the durable replay ledger before real staging. No lesson was approved, merged or deployed by this change.


### Standalone importer private-source containment (2026-11-01)

The reviewed-package importer now calls `scripts/safe-import-source.mjs` for **every referenced private source file** before copying it. The guard rejects traversal, absolute or ambiguous paths, symlinked ancestors and leaves (including aliases pointing back inside the reviewed bundle), hardlinked files, directory leaves, and non-directory ancestors. It complements the existing public destination guard and the signed staging fingerprint; CI includes seven synthetic positive/negative source-path tests.

**Boundary:** this is a filesystem path check, not an authenticated curriculum transfer or a guarantee against concurrent modification by a process with write access to the private source. The real runner must use an immutable private snapshot with restricted access, verify the independently signed bundle digest, maintain a durable replay ledger, and obtain independent rights/QA/physical-device review. A passing unit test or GitHub Action is never approval to publish. No curriculum was transferred, merged or deployed by this change.


## Private bundle hashing file-identity hardening — 2026-11-01

The private-bundle fingerprint routine now opens each file with POSIX `O_NOFOLLOW`, checks that the opened descriptor matches the original path's device/inode, refuses hardlinks, and checks descriptor/path size plus nanosecond modification/change timestamps after reading. This closes several file-replacement and concurrent-edit gaps between directory enumeration and hashing. The digest still covers every allowed file path and its SHA-256 bytes. Synthetic regression tests cover deterministic fingerprints, same-length byte changes, symlinks, hardlinks, unexpected files and empty files.

**Limit:** These checks reduce but cannot eliminate all hostile filesystem races; the producer and runner still require a private, immutable, isolated source volume. On systems without `O_NOFOLLOW`, hashing now fails closed rather than silently weakening the trust boundary. This is transport-integrity engineering, not evidence that a real lesson passed QA, that rights were cleared, or that a signed private producer transfer has operated.


### Trust-input descriptor pinning — 2026-11-02

The signed-handoff verifier now opens both the detached producer record and the separately provisioned trusted Ed25519 public key using `O_NOFOLLOW` after checking path ancestry and permissions. It reads each from that descriptor and compares device/inode, link count, size, nanosecond modification/change times, permissions and pathname identity before accepting the bytes. This rejects replacement of either file between the path check and read. Two synthetic regression tests swap the record and key inode during descriptor reads.

This is a **local filesystem hardening measure**, not a production connection, independent approval, or protection against a privileged adversary controlling the runner. It assumes an isolated POSIX filesystem and secure private key custody. No genuine producer artifact has been received, and no review PR or release was created by this change. The next P0 remains provisioning immutable private artifact storage, trusted producer/runner credentials, shared replay ledger, and an independently approved signed transfer.

### Private producer signing-key descriptor pinning — 2026-11-02

The signer now reads its independently provisioned Ed25519 private PEM through
`scripts/read-private-signing-key.mjs`, using `O_NOFOLLOW` and a pinned
file descriptor. It rejects symlinked paths/ancestors, hardlinks, group/other
permissions, files larger than 16 KiB, and a key whose device/inode, size,
modification/change timestamps or pathname identity changes while being read.
Five synthetic regression tests cover valid private input, unsafe links and
permissions, oversize, inode replacement and same-length in-place modification.
The key remains **private**; no signing keys or actual lesson artifacts were
added to the repository.

This is local filesystem defense-in-depth, not a managed signer, HSM, key
rotation policy, authenticated artifact transport or proof of independent
curriculum/rights/device review. A privileged adversary or mutable source
volume can still defeat assumptions outside this module. Provision a trusted
producer identity and immutable private storage before attempting a real
signed producer-to-draft-PR transfer. Keep public catalog empty until four
actual QA passes, benchmark signoff, physical iOS review and owner authorization.

### Synthetic fixture publication guard — 2026-11-02

The public catalog CI and reviewed-package `--apply` paths now run
`scripts/reject-synthetic-evidence.mjs`. It rejects explicit synthetic,
fixture, test-only, placeholder-review or fabricated-approval markers in
rights/QA reviewer metadata, QA check notes, text-based QA artifacts and
per-lesson benchmark review metadata. It runs **before** the private staging
replay ledger reserves an artifact, so an accidentally selected synthetic
package cannot consume a real source/version slot. Offline dry runs remain
available for synthetic security regression fixtures, but such fixtures cannot
be imported to a public review branch. The check intentionally does not scan
student-facing lesson text for words such as `synthetic`, which may be valid
instructional vocabulary. Seven isolated regression tests cover rejection,
normal metadata and path safety.

**Limit:** this is a high-signal test-fixture exclusion rule, **not** reviewer
authentication, evidence truth verification, or a substitute for independent
human review. A maliciously relabeled fake report can still evade keyword
checks; trusted reviewer identity, provenance, rights checks, physical iOS
verification, private transport and owner authorization remain mandatory.
No production producer connection is implied.

### Nested review evidence and symlink guard — 2026-11-02

The explicit synthetic-evidence guard now recursively inspects textual fields in rights
attestations, four-pass QA approvals/reports, benchmark gaps/remediation, comparator
notes and other benchmark review metadata. Previously, synthetic approval markers
in nested review fields (such as benchmark gaps or device tester comments) could
escape the narrow list of checked properties. Referenced text evidence is read
only through package-contained non-symlink paths, with a 10 MiB per-file bound.
Student lesson content is intentionally not keyword-scanned.

Five new negative regression tests cover nested benchmark notes, nested device
metadata, QA approval metadata, symlinked evidence files and symlinked ancestors.
These tests are **synthetic safety tests**, not real lesson QA. A dishonest
reviewer can still remove explicit markers or fabricate attestations. Physical
Safari, independent rights/standards reviews, genuine competitor observations,
authenticated private producer transport and owner authorization remain P0
release blockers. No automatic publication is authorized.

### Content-only review PR boundary (2026-11-02)

`scripts/validate-review-pr-diff.mjs` now checks GitHub PR base/head commit SHAs and fails the Actions job for producer branches matching `feature/review-<lesson-id>-<12-hex>` unless the PR **only** modifies `catalog/approved.json` and adds new regular, non-executable files under `lessons/<lesson-id>/` and `evidence/<lesson-id>/`. It rejects attempts to alter workflow/QA code, existing lesson assets, other lessons, symlinks, executable files, deleted files, and missing evidence. The GitHub workflow fetches full history to compare the exact base/head commit trees; the guard has nine pure positive/negative Node tests plus a real-Git CLI integration test. Existing integration PR #1 is intentionally not treated as a producer content-only PR.

This is **defense in depth**, not independently enforceable release protection while main branch protection/rulesets are disabled. A malicious PR that can change the workflow it runs may attempt to bypass this check; require protected, trusted CI and review rules before accepting a producer PR. The guard does not authenticate human reviewers, establish private transport, or authorize any deployment. A real signed producer-to-draft-PR transfer remains untested.
