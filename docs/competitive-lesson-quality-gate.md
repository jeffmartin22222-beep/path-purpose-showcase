# Per-lesson competitive quality gate (v1 implementation)

**Status (2026-11-01):** CI schema/score/hash/QA/print-asset checks implemented on development branch only. The catalog remains empty. No competitor hands-on comparisons, real lesson approvals, physical iOS tests or vendor-ready PDF proofs are asserted.

## Per-lesson contract

Each approved lesson MUST include \`benchmark: {path,sha256}\` pointing to \`evidence/<lesson-id>/benchmark.json\`. The public benchmark report uses \`schemaVersion: "1.0.0"\`, matches the catalog's lesson ID, content version, entry hash and full package hash, and has a human reviewer and UTC timestamp. Its hash is checked, it is included in the public-file security audit and in the reviewed-package importer.

See \`catalog/benchmark.schema.json\` and \`scripts/validate-benchmark.mjs\`. The benchmark report includes:
- Benchmark signoff must occur **after** the rights clearance and all four QA reviews, and after any dated comparator observations; future-dated signoffs are rejected (five-minute clock-skew tolerance). Placeholder/reference-only domains (including `example.invalid` and `example.com`), localhost and IP-literal comparison URLs are rejected. This prevents accidentally treating synthetic fixture URLs as real competitor evidence, but **does not prove** that an allowed URL actually contains a meaningful observation or that a reviewer read it.
- Four explicit comparator entries: \`subject.com\`, \`schoolsplp-lincoln\`, \`edmentum\`, \`edgenuity\`. Each is labeled \`direct_observation\`, \`public_documentation\`, \`marketing_claim\` or \`unavailable\`; a dated HTTPS reference is mandatory for the first three. An unavailable comparison requires an explanatory note and must not masquerade as an observation. **At least one comparator must have a dated direct-observation or public-documentation reference; all-unavailable or marketing-only comparisons block approval and require human review.** Subject.com is a comparison target where legitimately observable, **not a measured superiority claim**.
- Seven integer scores and substantive category rationales: visual 15, video 15, interactive 20, solo 15, rigor 15, UX/accessibility 10, feedback 10. Total >=90; each category >=70% of its maximum. Scores require actual human verification; synthetic fixtures are not evidence.
- Human \`approval: "approved"\`, \`superiorityClaim: "not_claimed"\`, gaps/remediation arrays, overall notes, five passed hard-gate attestations, and statuses matching all four QA gates.
- Three distinct, hashed, approved student-facing **HTML print-equivalent assets** under \`lessons/<id>/print/\` for lesson/unit/course scopes. Each must contain a scope-tagged \`<main>\` and substantive content. Human review must confirm interactive/video equivalents, no keys, grayscale legibility and actual scope coverage.

## Hard blockers

No peer/group/live dependencies or progression waits; no required supplies, purchases, printing, outdoors, adults or travel. Only a school-provided device and internet may be required. Human review must check ALL prompts, media, assessments, teacher guides and alternative pathways. Static lint blocks common imperative peer/material phrases but is not semantic proof. Content/standards, engagement/pedagogy, real technical/mobile/video/accessibility/persistence, and end-to-end student/demo QA must all pass on the exact hashed version. Missing benchmark, weak category, total <90, stale hash, unapproved comparison, missing print assets or unverified gates block catalog validation.

The four-pass validator additionally requires \`solo_async\`, \`device_internet_only\`, \`no_peer_wait\`, \`print_equivalents\`, and \`independent_completion\` checks in the relevant QA reports.

## What is NOT implemented or verified

- **No production-ready PDF export engine** or verified lesson/unit/course print-shop PDF, duplex proof, protected teacher edition or physical vendor proof. HTML print-equivalent artifacts are a schema foundation, not a PDF/X, PDF/UA or print-vendor claim. See issue #5.
- **No automatic independent reviewer authentication**. A JSON signoff can be forged by an authorized committer; require trusted reviewer identity, signed provenance, branch protection and manual audit before any merge.
- **No real Subject.com/PLP/Edmentum/Edgenuity lesson comparison has been performed by this change.** Marketing references are not hands-on observations. Do not publish comparative superiority claims.
- **No physical iPhone/iPad or screen-reader evidence was generated** by these automated tests. CI Chromium emulation is not physical Safari.
- **No trusted private producer-to-GitHub transport** or owner-authorized publication is operational.

## Release discipline

Test on Inside the Cell, Grade 8 math and a contrasting ELA/SS lesson, but apply the gate to every approved lesson. Keep draft/review work private. A green GitHub Actions check is necessary but never sufficient for publishing. No auto-merge or deployment. Related issues: #3, #4, #5, #6, #7.

### Review chronology hardening (2026-11-01)

The benchmark validator now rejects non-public placeholder competitor references and impossible review ordering. Synthetic tests cover reserved domains, IP literals, future approval, benchmark-before-QA/rights, and comparator observation after signoff. These are structural checks only: a genuine public URL is not proof of source relevance, a claimed review time is not independently authenticated, and CI cannot validate physical-device test truth. Keep PR #1 draft and the approved catalog empty until independent evidence and owner release authorization exist.

### Device evidence ordering (2026-11-01)

Public rights and four-pass QA signoff timestamps must not be in the future (five-minute clock-skew tolerance). Physical iPhone/iPad `testedAt` must be valid UTC and no later than the technical QA review signoff. This blocks a record claiming the reviewer approved an iOS test before it occurred, but does not authenticate the device, tester, screenshot, or result. Independent physical-device evidence remains a release blocker.


### Physical-device evidence lint (2026-11-01)
Technical `iphone` and `ipad` QA checks now require explicit
`physical_device` + Safari attestations, correct iPhone/iPad model family,
a numeric iOS/iPadOS version, and dated testing before signoff. Emulator and
Chromium labels fail closed. This blocks common accidental substitution of
browser emulation for physical testing; it does **not** prove that claimed
device testing actually occurred. Independent human verification remains mandatory.
