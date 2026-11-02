# Private runner activation: operator checklist (not yet provisioned)

**Status: development-only instructions. No private producer-to-GitHub connection is operating.** This document is an actionable setup plan, not a claim of installed credentials, an authorized release, or genuine curriculum QA. Do not put unreviewed curriculum, private signing keys, tokens, teacher keys or raw student data in this public repository.

## 1. Provision an independent private source

1. Select a restricted, versioned, immutable curriculum artifact store (private repository release or private object storage). Record its owner, retention policy, immutable object/version identifier and how the authorized runner receives the object.
2. Keep the raw curriculum and teacher edition private. Only an independently reviewed, redacted **one-lesson student package** may be considered for a public draft review PR.
3. Have a separate reviewer verify copyright/commercial-use clearance, all four QA gates, competitive benchmark >=90/100 with actual sources, physical iPhone/iPad Safari and accessibility evidence, print equivalents and exact content hashes. Human signoffs cannot be generated from synthetic test fixtures.
4. Set up an independent Ed25519 producer signer and distribute the trusted **public** key through an owner-approved channel separate from the bundle and detached signed record. Keep the private key outside GitHub and the runner's public checkout.

## 2. Provision an isolated trusted runner

Use an authorized Linux/Unix host with Node 22+, git and GitHub CLI. The checkout must be the current `feature/qa-gated-publishing` branch of this repository, with a clean working tree. Give the runner short-lived, least-privilege credentials that can create a review branch and **draft** PR in this repository; never authorize merge or main-branch publication. Git push authentication and `gh` authentication must both work; `GH_TOKEN` presence alone is not proof.

Create a private, backed-up, access-controlled ledger volume supporting atomic exclusive file creation and rename. On **first provisioning only**, initialize the authoritative ledger using `scripts/init-private-handoff-ledger.mjs` and its explicit acknowledgement. If the ledger later disappears, restore the authoritative backup; never bootstrap a fresh ledger to evade replay history. Use one shared authoritative ledger or a transactional service across all runners.

Set the following **in the private runner's secret/environment manager**, never in a committed file or console transcript:

| Variable | Required meaning |
| --- | --- |
| `GH_TOKEN` | Short-lived credential for creating a draft PR; independently validate actual scope |
| `PP_PRIVATE_HANDOFF_LEDGER` | Absolute path to existing, private 0600 authoritative ledger outside checkout and bundle |
| `PP_TRUSTED_PRODUCER_PUBLIC_KEY` | Absolute path to independently provisioned Ed25519 public PEM outside checkout and bundle |

Run the **read-only local prerequisite check**:

```sh
node scripts/check-private-runner-readiness.mjs
```

It checks CLI presence, Node version, expected origin and branch, clean tree, token presence, ledger header/permissions/lock and Ed25519 public key. It does not print secret values or private paths. A successful result means **local prerequisites only**, not that transport, GitHub authentication, ledger durability, review evidence or a genuine signed handoff is verified.

## 3. Demonstrate signed transport without publication

1. Deliver the reviewed package from the private immutable source to the runner over an authenticated channel.
2. Deliver the detached producer-signed record **independently**; pin its expected bundle SHA-256 from that trusted record, not from the untrusted package.
3. From the clean integration checkout, run:

```sh
node scripts/stage-reviewed-package.mjs /private/reviewed-bundle \
  --expected-bundle-sha256=<digest-from-independent-signed-record> \
  --signed-handoff-record=/private/detached-record.json \
  --trusted-producer-public-key=/private/trusted-producer.pem
```

This is an offline signed **dry run**. Verify the reported source fingerprint, exact lesson/version and four-gate evidence against the independent review. The CLI does not authenticate the human review or legal rights.

4. Only after authorized independent public-staging review, repeat with `--apply --acknowledge-public-reviewed` using the same trusted digest, record and key. The existing staging script reserves the replay ledger, creates a dedicated feature branch, runs validation and tests, pushes the reviewed student files and opens a **public draft PR** targeting `feature/qa-gated-publishing`. The draft PR is publicly readable, so do not use `--apply` for unfinished/private lessons.
5. Confirm the trusted base-side PR boundary workflow actually ran and rejected unauthorized changes, and confirm the ordinary QA Actions run passed. Independently inspect the public diff for teacher-key or personal-data leakage. Do **not** merge the draft PR just because CI is green.

## 4. Release remains separately blocked

Before any main-branch merge, require enforced branch protection and trusted required checks on both integration and main, independently verified reviewer identity and actual QA evidence, physical Safari/iPad testing, content rights clearance, print/PDF acceptance, and explicit owner release authorization. The `pull_request_target` trusted workflow is only on the development branch and has not been demonstrated as registered/enforced. GitHub rulesets are currently absent; branch-protection API access is restricted for this app.

## Current gaps (2026-11-02)

- No confirmed immutable producer store, source-delivery event or private runner is connected.
- No real signer, independently delivered trusted key, runner credentials or durable production replay ledger is provisioned.
- No genuine signed lesson has completed a draft-PR transfer.
- No real competitive benchmark, physical iOS QA, print-shop-ready PDFs, independent reviewer authentication or owner approval exists for an approved lesson.
- `catalog/approved.json` remains intentionally empty. `main` and `paper-lms` must remain unchanged.

**Next operational milestone:** a real, independently reviewed and signed one-lesson source reaches a provisioned private runner, passes the signed dry run, then creates a draft review PR without publishing. Do not confuse local/synthetic preflight tests with this milestone.
