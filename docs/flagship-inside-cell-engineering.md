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
