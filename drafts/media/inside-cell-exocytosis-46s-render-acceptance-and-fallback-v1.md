# Inside the Cell — Exocytosis Film: Render Acceptance + Accessible Fallback
**Internal draft only. Asset IC-EXO-046-V1. Not approved for student publication.**

## Purpose and decision
This package is a **production-facing test contract** for the existing 46-second exocytosis film master. It prevents a technically successful render from being mistaken for a scientifically correct lesson. It also provides a complete independent, no-video-required learning path while the MP4 is unavailable. The renderer must consume the companion `inside-cell-exocytosis-46s-render-ready-master-v1.md`; this document does not claim a render occurred.

## Frame-by-frame scientific acceptance storyboard
| Target frame | Required geometry and evidence | Reject if |
|---|---|---|
| 00:04 | Plasma membrane separates labeled cytoplasm from extracellular space; vesicle lumen contains six triangle-shaped cargo markers | Cargo appears outside before fusion |
| 00:10 | Vesicle approaches intact plasma membrane, vesicle and cell boundaries still distinct | Vesicle already intersects or traverses membrane |
| 00:16 | Docked vesicle is **closed**; all six markers remain inside; membrane still blocks cargo | A pore appears or markers leak across an intact bilayer |
| 00:21 | Prediction pause overlay is supplied by lesson player; video alone remains passive | Answer is revealed before learner predicts |
| 00:29 | Vesicle bilayer and plasma membrane have joined; the vesicle lumen is **continuous with extracellular space** through a visible opening | Closed circle remains drawn over an intact straight membrane, or a cargo-sized hole appears in an unfused membrane |
| 00:35 | At least two cargo markers have traveled **through the fusion opening** into extracellular space; remaining vesicle membrane is incorporated into cell surface | Vesicle crosses membrane whole or cargo teleports |
| 00:43 | Side-by-side blocked and permitted conditions use labels and boundary shapes, not color alone | Comparison relies on color or says docking alone releases cargo |

**Model boundary:** This is a qualitative cutaway, not molecular dynamics. Fusion is protein-regulated. It does not imply ATP directly pushes cargo through a pore or that every docked vesicle fuses.

## Render verification procedure (evidence required, not just a file name)
1. Record renderer invocation, source master revision, render tool/version, generated MP4 path and exact duration; do not include credentials.
2. Extract and retain inspection stills at 00:16, 00:29, 00:35, and 00:43. A reviewer checks each against the table above.
3. Probe MP4: video codec H.264, dimensions 1920×1080 or justified mobile-compatible derivative, audible narration track, duration near 46 seconds. Reject silent output masquerading as narrated video.
4. Listen to narration against original script; check pronunciation and ensure no sentence is clipped. Align VTT cues to *actual* narration timing; VTT must begin with WEBVTT and have nonoverlapping increasing intervals.
5. Verify poster and descriptive transcript exist. Provide a reduced-motion still sequence that conveys the same distinction.
6. Play in iPad Safari (touch Play, pause at prediction, rewatch, Continue from 00:24, caption toggle, portrait and landscape); separately test VoiceOver reading order, keyboard focus, visible Next, no page scrolling, and state recovery after reload.
7. Confirm first prediction persists unchanged when student retries, chooses another condition, rewatches, or edits their current answer. Record both observation choices and written reasoning. Do not infer understanding from clicks alone.
8. Keep video and student-facing files in drafts. Teacher key and rubric must not be embedded in public student HTML or downloadable video assets.

## Complete no-video equivalent: five fixed-height pages
Use one screen at a time; top bar shows 1/5 through 5/5, with persistent Back/Next controls visible without scrolling on iPad and phone. All controls are large touch targets. No supplies, peers, external links, printing, or synchronous help required.

### Page 1 — Predict
**Title:** Does touching mean releasing?
**Target:** I can predict what happens to vesicle cargo when membrane fusion is blocked.
**Diagram description:** A small closed vesicle carrying six triangles touches the underside of a continuous plasma membrane. Above the membrane is the outside of the cell. No triangles are outside.
**Prompt:** “The vesicle has reached the cell surface, but its membrane has not fused. Where is the cargo now?”
- A. Still enclosed in the vesicle
- B. Already outside the cell
- C. Passing straight through the intact membrane
Store selected response once as immutable `originalPrediction` with attempt and item-version IDs. Permit a separate editable `currentPrediction`; do not overwrite original. Feedback after selection: A “Docking alone does not create an exit.” B “Look closely: the vesicle is still sealed.” C “The intact membrane is still a barrier.” Next enabled only after a selection.

### Page 2 — Investigate two conditions
**Title:** Change one condition: fusion.
**Target:** I can compare what changes when fusion is blocked or permitted.
Two large buttons, **Fusion blocked** and **Fusion permitted**, toggle labeled diagrams. Blocked: sealed vesicle next to intact membrane, cargo inside. Permitted: joined membrane outline with open passage to extracellular space; cargo shown moving out *through that passage*. Announce each state in an aria-live region and supply the equivalent text beneath the diagram. Require learners to inspect both conditions; retain inspection flags on reload. Do not call this a molecular-scale simulation.
**Inquiry:** “What boundary changed between the two conditions?” The student must select either “A continuous opening formed” or “The entire vesicle moved through the membrane.” Provide immediate explanatory feedback, and allow correction without erasing the original prediction.

### Page 3 — Collect evidence
**Title:** Which observations support your claim?
Select **one observation from each condition**.
Blocked options: (A) “The vesicle remained closed and cargo stayed inside.” (B) “Cargo crossed the intact membrane.”
Permitted options: (C) “The membranes formed an opening and cargo moved outside.” (D) “The vesicle passed through the membrane without joining it.”
Only A+C counts as the supported evidence pair. If incorrect, show: “Compare the boundary of the vesicle with the cell surface. Can you trace an unbroken route from the vesicle interior to the outside?” Return to Page 2 without losing previous selections. Require the supported pair before advancing.

### Page 4 — Explain
**Title:** Make a claim using evidence.
**Prompt:** “Why does fusion matter for releasing cargo? Use an observation from **both** conditions.”
Offer an optional three-part scaffold: “When fusion was blocked, I observed ___. When fusion was permitted, I observed ___. This shows ___.”
Store free text continuously and on navigation. Do not keyword-grade or require a word count. Require nonblank input, but flag the response as **submitted, pending rubric review** rather than automatically correct. Provide an accessible “Review both diagrams” control that does not erase writing.

### Page 5 — Reflect and finish
Show the learner's immutable original prediction, current prediction, two selected observations, and exact written explanation.
**Reflection:** “What did the membrane opening help you understand that docking alone did not?” Optional text field; no penalty for leaving blank.
Provide a persistent **Finish lesson** control. Completion is recorded once, remains visible after reload, and does not redirect to an empty screen. Offer **Start a new attempt** separately, with explicit confirmation; never silently replace prior attempt history.

## Teacher-only answer key and scoring (exclude from student bundle)
**Prediction:** A; preserve original even if wrong. **Investigation:** continuous opening forms only with permitted fusion. **Evidence:** A+C. **Reasoning exemplar:** “When fusion was blocked, the vesicle stayed closed and cargo remained inside. When fusion was permitted, the vesicle membrane joined the plasma membrane and opened a route to the outside. Cargo moved through that opening, so fusion—not docking alone—made release possible.”
**4-point rubric:** 1 point correct blocked observation; 1 point correct permitted observation; 1 point membrane continuity/open passage mechanism; 1 point explicit comparison that uses observations as evidence. Do not give credit for unsupported claims that cargo crosses an intact bilayer.
**Misconceptions:** “Docking equals release” → point to sealed Page 2 state; “Vesicle crosses whole” → trace joined membrane; “Cargo passes through lipid bilayer” → contrast intact barrier and open lumen; “Fusion always happens” → emphasize model has two controlled conditions.

## QA gate record
- Content/standards: **open**; independent biology review and standards mapping required.
- Pedagogy/engagement: **open**; independent review of evidence-based reasoning and solo accessibility.
- Technical/mobile/accessibility: **open**; executed browser and physical iPad/VoiceOver validation required.
- End-to-end student/demo: **open**; complete prediction-to-finish replay with saved state required.
- Score: **not assigned**. Publication prohibited until independently >=90/100 **and** all four gates pass.

## Production handoff
Companion input: `drafts/media/inside-cell-exocytosis-46s-render-ready-master-v1.md`.
Expected output: MP4, synchronized VTT, poster PNG, descriptive transcript, four inspection stills, media probe report, and QA evidence record. **A committed markdown file is not a rendered video.**
