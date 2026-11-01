# Public curriculum package security lint

This repository is PUBLIC. A green build is not an independent privacy, copyright, device, or curriculum review.

## Automated defense-in-depth

The catalog validator now runs `scripts/audit-public-package.mjs` over every referenced student-facing lesson file and public evidence artifact after verifying hashes. The lint blocks:

- Obvious private/teacher-only filenames (answer keys, rosters, credentials, private keys, secrets, `.env`, key stores, databases and source maps).
- Explicit extension allowlists: lessons may contain reviewed HTML/JS/CSS, captions, passive artwork, video/audio and web fonts; public QA evidence may contain only sanitized JSON/text/CSV and passive screenshot formats. Unknown binaries, archives, executables, PDFs, WebAssembly, raw evidence videos, and active HTML/JS/SVG evidence are rejected. New formats require explicit security review.
- Common text credentials and private key markers in HTML, JavaScript, JSON, captions, SVG, CSS, and redacted evidence text.
- External resource references, links, CSS imports and direct network calls in student-facing HTML, plus external CSS imports. The goal is a self-contained lesson.
- Outbound URL literals in student JavaScript modules and common delayed/click-triggered network or navigation APIs (`XMLHttpRequest`, `sendBeacon`, `window.open`, location redirects and protocol-relative active imports). Local `fetch('./asset.json')` remains available for reviewed, manifest-listed resources. This is conservative static lint, not complete JavaScript data-flow analysis.
- Executable SVG constructs (scripts, event-handler attributes, foreign HTML, remote/script URLs) while permitting passive local illustrations.
- HTML `<base>` URL overrides, meta-refresh redirects, `srcdoc` embedded documents, active `javascript:`/`data:`/`blob:`/`file:` URI attributes, and common scripted location redirects. These can bypass simple remote-resource scans or change the meaning of relative URLs.
- During Chromium smoke testing, every lesson request must target an explicitly listed, hashed file within **that lesson's** manifest. Even an existing HTTP 200 file elsewhere in this public repository is rejected as an unreviewed dependency.

The tests include negative fixtures that repin *all* SHA-256 hashes and QA report references after adding prohibited HTML. This demonstrates that hashes and attestations alone cannot make unsafe public content acceptable.

## Limits and mandatory human checks

These are heuristic text checks and extension restrictions, not a parser, browser Content Security Policy, file-signature validator, or complete data-loss prevention system. Renaming dangerous bytes to an allowed extension may bypass type checks; human reviewers must inspect actual file content and privacy. Obfuscated JavaScript, dynamically constructed URLs, credentials in images/video, proprietary licensed material, sensitive names in ordinary prose, and misleading attestations can evade them. Browser smoke checks exercise only resources requested during their test window; lazy-loaded content and alternate branches still require explicit QA. Human reviewers must inspect the actual package, evidence and media; verify content rights; review network behavior; and confirm real iPhone/iPad, accessibility, captions, persistence and student flow. Never add unreviewed drafts or raw private QA artifacts to a public branch.

An automated pass must **never** be treated as authorization to merge or deploy. Keep approved catalog entries empty until a genuinely reviewed package is available and owner authorization is recorded.

## Remaining integration blocker

The private producer storage location, authenticated integration runner and release approval process are not configured. The importer is a local reviewed-package preparation tool; it is not a background sync or authenticated upload. See [production handoff](production-handoff.md) and [issue #2](https://github.com/jeffmartin22222-beep/path-purpose-showcase/issues/2).

## Public catalog metadata boundary (2026-11-01)

The approved catalog JSON is itself a public asset. The validator now rejects unrecognized
fields at the catalog, lesson, asset, rights, QA-gate and gate-approval levels, and audits
`catalog/approved.json` for credential-like values, teacher-only wording and sensitive JSON
keys. This prevents an unreviewed `teacherAnswerKey` or private metadata extension from
silently bypassing the student-asset audit. The JSON schema also disallows extra fields in
these structures. These checks are defense-in-depth only: human review must still inspect
all text, screenshots, media, rights and evidence authenticity before staging or release.


## Public QA evidence schema hardening (2026-11-01)

The four-gate validator now fails closed on unknown keys in each public QA report,
individual check, and hashed artifact reference, not only the catalog manifest.
Reports may contain only `lessonId`, `version`, `gate`, `entrySha256`,
`packageSha256`, `reviewedBy`, `reviewedAt`, `checks`, and `artifacts`.
Checks may contain only `id`, `result`, `notes`, `deviceModel`,
`osVersion`, and `testedAt`; artifact references only `path` and `sha256`.
Duplicate check identifiers or artifact references in a report are rejected.
The catalog's optional `generatedAt` must be null or a UTC timestamp.

Place richer technical observations in separately redacted, hashed evidence
artifacts, not in unreviewed report fields. This blocks a class of accidental
private metadata disclosure; it **does not** prove reports are genuine or
that artifacts are free of private content. Independent reviewers must still
inspect each public artifact and physical-device result. Six synthetic negative
tests cover unexpected metadata, duplicates, and invalid generation metadata.

### Media container signature preflight (2026-11-01)

The public-package auditor now checks recognizable header signatures for approved
PNG/JPEG/GIF/WebP/AVIF images, MP4/WebM video, MP3/Ogg/WAV audio and WOFF/WOFF2
fonts, including passive evidence screenshots. A renamed HTML/script payload
with a media extension is rejected before public staging. Synthetic tests cover
each allowed media family and a masquerading active-document case.

**Limitations:** a matching header is not proof that a file decodes safely,
is complete, has correct codecs/captions, contains no private information,
or is licensed for commercial use. Binary media and screenshots still require
human inspection and actual browser/mobile playback; the separate four-pass
QA and owner authorization remain mandatory. This does not establish a
private producer connection or authorize publishing.
