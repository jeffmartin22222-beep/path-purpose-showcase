# Inside the Cell — flagship engineering acceptance ledger

**Updated:** 2026-11-02. **Status:** development-only conceptual prototype, not a publishable lesson. The repository is public; do not place private draft packages, teacher keys, student records, protected media, or unapproved producer artifacts here. The approved catalog must remain empty until independently approved.

## This change actually implements

- Three separately manipulable, keyboard-operable native range inputs: oxygen, glucose availability, and mitochondrial capacity. Each changes an original, deterministic **illustrative** aerobic-output index: `round(80 × oxygen/100 × glucose/100 × capacity/100)`.
- Input validation (integers 0–100 in steps of ten), deterministic bounds and monotonicity checks; zero on any axis yields zero aerobic index. This is a teaching abstraction, **not** measured ATP, biochemical kinetics, or a real predictive biological simulation. Glycolysis and metabolic compensation are not modeled.
- Browser-tab-only draft persistence via `sessionStorage` for the three controls. Reset restores defaults; corrupt/disabled storage fails safely. This is **not** authenticated LMS persistence, mastery evidence, durable progress, or cross-device resume.
- Browser smoke regression exercises independent controls and reload restore; existing phone/tablet layout checks run on Chromium and Linux WebKit. A Node test exercises the exact model function embedded in the prototype and validates its invariants.

## Must remain blocked before claiming flagship quality

1. **Content and standards:** curriculum author and biology SME verify all explanatory claims, scientifically appropriate model boundaries, learning target, success criteria and grade/standards alignment; record exact lesson version and rights provenance.
2. **Engagement/pedagogy:** original, purposeful Teach → Do → Feedback → Next with a visible next action at 320 px; prediction, experimentation, explanation, revision, reflection, independent completion and no required supplies/printing/outdoor access. Current Showcase prototype is scroll-based, not a complete paged lesson.
3. **Technical:** real locally packaged original short narrated videos, accurate captions/transcripts, replay, pause and checkpoint resume, no external dependencies, keyboard/VoiceOver checks, actual physical iPhone/iPad Safari testing, persistent progress in the LMS, secure teacher-only keys. The current demo has **no** finished video checkpoint system and no secure assessment.
4. **End-to-end:** an independent student/demo reviewer completes the exact hashed package on phone/iPad and desktop, with evidence for restore, accessibility, independent progression and all links/buttons.
5. **Competitive:** independent, dated legitimate references for Subject.com where observable, PLP/Lincoln, Edmentum and Edgenuity; weighted per-lesson rubric 15 visual / 15 video / 20 interactive / 15 solo / 15 rigor / 10 UX/accessibility / 10 feedback, total >=90 and human approval. No score is assigned to this prototype.
6. **Secure release:** authenticated private producer handoff, trusted signatures and replay ledger, independent approvals, protected required checks, and explicit owner authorization. Never copy unreviewed packages into the public tree. Preserve the live site and paper-lms.

## Next engineering increments

- Replace the scroll-to-investigation prototype with a **separate internal** paged player prototype, preserving the public approved catalog and avoiding public unapproved lesson packages.
- Define the video checkpoint state machine (pause → answer → feedback → replay/return → resume), persisted version-bound draft and deterministic test cases; integrate only original rights-cleared assets.
- Run browser tests at 320/390/820 px including keyboard, touch, reload, navigation, reduced motion, caption controls and offline/self-contained asset validation; physical iOS and screen-reader signoffs remain separate human evidence.
- Reconcile the private Curriculum Builder's latest Inside the Cell artifact **only through a verified, authorized signed transfer**. The automation handoffs do not themselves constitute a GitHub artifact transfer.

**Release state:** no QA passes asserted, no 90/100 score asserted, no actual video or physical-device QA asserted. No merge or deploy.

## Video checkpoint engineering increment — 2026-11-02 (development only)

- Added `scripts/flagship-video-checkpoint.mjs`: pure, version- and SHA-256-bound single-clip/multiple-checkpoint state machine. Supports pause-at-boundary, question → feedback → optional replay/return → continue, seeking guard, no premature `ended` completion, and strict draft restore validation.
- Added `scripts/flagship-video-adapter.mjs`: attaches the state machine to an `HTMLMediaElement`-like video interface, performs actual `pause()`/`currentTime`/`play()` effects, blocks native play while a checkpoint is open, and persists only non-authoritative tab-scoped UI state if the caller provides session storage. Restore never autoplays; disabled storage fails safely.
- Added eight synthetic Node regression tests in `tests/flagship-video-checkpoint.test.mjs` and `tests/flagship-video-adapter.test.mjs` for multiple checkpoints, seeking, replay, stale version/hash, corrupted/forged draft, native-play guard and storage failure. **Local Node tests passed before commit; GitHub CI must independently confirm the exact head.**
- The adapter does **not** yet run in the Showcase's visible lesson prototype. There is **no finished original video, caption track, transcript, checkpoint question UI, assessment evaluator, authenticated LMS persistence, physical Safari verification, or student-facing release**. Synthetic fake-media tests prove state transitions, not real video decoding, captions, touch/VoiceOver or instructional quality.
- The adapter deliberately stores no student answers, grade, teacher keys or mastery evidence. `FEEDBACK_PRESENTED` is a UI event, **not** proof of correct response or reviewer signoff. A future LMS must authenticate and version-bind assessment outcomes server-side. Native media controls are not a security boundary.
- **Next:** Integrate into a separate draft-only paged Teach → Do → Feedback → Next player with approved original short video/caption/transcript assets when available; add browser-level playback/checkpoint/refresh tests at 320/390/820 px, then physical iPad/iPhone and independent four-pass review. Do not add a lesson to `catalog/approved.json`, merge, or deploy.


## Development-only paged student player — November 2, 2026 (13:44 ET)

**Visible preview path:** \`drafts/inside-cell-player.html\` on \`feature/qa-gated-publishing\`. For an actual interactive preview, check out the branch and serve the repository root with a local HTTP server (for example \`python3 -m http.server 8000\`), then open \`http://localhost:8000/drafts/inside-cell-player.html\`. Do not assume GitHub Pages deploys development-branch files. The page is public source code on a development branch, **not** an approved lesson or private curriculum repository.

**Implemented:** a four-screen Teach → Do → Feedback → Next draft student experience with persistent non-authoritative tab-scoped page/model state, a permanently visible bottom Next control, a deterministic three-stage exocytosis model (approach, conceptual fusion pore, cargo release), reset/retry, keyboard-native buttons and touch sizing. The cell membrane is drawn with the extracellular space above and cytoplasm below; cargo is shown leaving only after the pore opens. This is a simplified diagram of event ordering, **not** a molecularly realistic lipid-fusion simulation.

**Real media adapter integration:** the Teach screen accepts a local MP4 and hashes its bytes in-browser. Only the **exact** original 8-second vesicle-approach proof SHA-256 \`2be54741beee271dc0ddfa233691c1c0f1d8e917f5dd535508bdeae66f10f68c\` is accepted. If available locally, the HTMLMediaElement connects to \`scripts/flagship-video-adapter.mjs\` with a 5-second pause → prediction → explanatory feedback → replay/continue checkpoint, and version/hash-bound tab draft recovery. Incorrect media fails closed. The MP4 itself has **not** been transferred into this repository and the public catalog remains empty. The current 8-second proof is silent and visually schematic, not the final narrated/captioned instructional video; the four rejected v0.6 slide videos must never be substituted.

**Actual producer evidence:** inspected [Curriculum Builder November 2 vesicle proof handoff](https://github.com/jeffmartin22222-beep/paper-lms/blob/curriculum-builder-3d-vesicle-proof-20261102/research/handoffs/curriculum-builder-vesicle-3d-proof-20261102.md). Its GitHub branch contains reproducible Python source, not MP4 bytes. The proof is 960×540, 24 fps, eight seconds; the producer reports no fusion pore, no cargo release, no narration, and no independent SME/visual review. No direct signed curriculum transfer was observed. The handoff's 64/100 author-only baseline is not an independently verified quality score.

**New automated acceptance script:** \`tests/flagship-player-browser.mjs\` (wired into \`validate-catalog.yml\`) exercises Chromium and Linux WebKit at 320px phone and 820px tablet viewports: no horizontal overflow, four-page navigation, locked Do→Feedback until cargo release, deterministic state sequence, reload recovery, persistent completion page, restart, rejection of a nonmatching MP4, and no browser page exceptions. These are browser-emulation checks; physical Safari/iPad, VoiceOver, genuine MP4 decoding, captions, narration, cross-device LMS persistence and actual independent student QA remain **not tested**. Check the exact final GitHub Actions run before claiming these tests passed.

**Unresolved priority:** obtain the actual rights-cleared high-quality original media via an authenticated transfer, render a scientifically correct fusion pore and cargo-release segment, add accurate VTT/narration, then exercise the real video checkpoint end-to-end on a physical iPad. Do not merge/deploy, add to the approved catalog, or assign >=90 without independent four-pass QA and human authorization.
