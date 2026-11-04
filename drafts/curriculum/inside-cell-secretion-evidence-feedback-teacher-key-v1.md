# Inside the Cell — Secretion Evidence, Feedback and Teacher Key v1
Status: INTERNAL DRAFT — not for student publication. Scope: rough ER → Golgi → secretory vesicle → plasma membrane secretion.

## Student-facing investigation (five paged screens)
**Screen 1 — Predict (Do):** A cell produces a protein intended for release outside the cell. The protein enters the rough ER. What will happen if a secretory vesicle reaches the plasma membrane but cannot fuse with it? Choose: A. Protein is released anyway; B. Protein remains inside the vesicle; C. Protein is destroyed by the Golgi. Ask for a one-sentence reason. On submission, store `predictionOriginal` and `predictionReasonOriginal` as immutable first-submission values; later edits must be disallowed. Do not show correctness yet.

**Screen 2 — Teach:** Play the original narrated, captioned 46-second secretion film, with replay, captions on by default, transcript, and pause. Explain: ribosomes associated with rough ER synthesize proteins entering the secretory pathway; transport vesicles deliver cargo to Golgi compartments for processing/sorting; secretory vesicles carry cargo to plasma membrane; membrane fusion releases soluble cargo outside. The membrane of the vesicle becomes continuous with the plasma membrane. Do not imply every protein is secreted or that Golgi creates the protein.

**Screen 3 — Manipulate (Do):** Provide two buttons with large touch targets: `Fusion enabled` and `Fusion blocked`. In each run, cargo moves from rough ER to Golgi to secretory vesicle. With fusion enabled, the vesicle docks, membranes fuse, soluble cargo is released outside. With fusion blocked, the vesicle docks but does not fuse, and cargo remains vesicle-enclosed. The animation must show lipid bilayer continuity at fusion, not cargo passing through an intact membrane or a generic pore. Require both runs. Keep a visible evidence table:

| Condition | Vesicle reaches membrane? | Membranes fuse? | Soluble cargo outside? |
|---|---|---|---|
| Fusion enabled | Yes | Yes | Yes |
| Fusion blocked | Yes | No | No |

These are qualitative outputs of a simplified model, not laboratory measurements. Docking and fusion are distinct steps. The model assumes earlier ER/Golgi transport is functional and isolates the final fusion step; it does not claim fusion is the only determinant of secretion in real cells.

**Screen 4 — Explain (Do → Feedback):** Prompt: “Using BOTH model runs, explain why the protein is released in one condition but not the other. Name the membrane event that makes release possible.” Require a written response, then give targeted feedback without falsely claiming automated semantic grading. For choice A: “Arrival is not release: the blocked run shows cargo still enclosed.” For choice B: “Your prediction matches the blocked run. Cite both conditions and the membrane-fusion event.” For choice C: “The Golgi processes and sorts cargo; blocking final fusion does not by itself show destruction.” After submission show both model observations and invite revision in a separate `revisedExplanation` field. Preserve `predictionOriginal`.

**Screen 5 — Reflect and complete:** “What evidence changed or strengthened your thinking?” Display the unchanged original prediction beside the final explanation. Completion requires both conditions observed, checkpoint submitted, and final evidence-based explanation entered. Provide visible Back/Next controls at all times; Next disabled with specific explanation when incomplete. No mandatory supplies, group interactions, printing or external links.

## Teacher-only key — never send to student bundle
Correct prediction: B. A soluble secretory protein can be released when the vesicle membrane fuses with the plasma membrane (exocytosis); docking alone does not release enclosed cargo. Earlier steps: synthesis into rough ER lumen, trafficking to Golgi, sorting/packaging into secretory vesicle. Do not assert all proteins use this route; cytosolic proteins and many membrane proteins have different destinations. The vesicle membrane merges with the plasma membrane; soluble luminal cargo exits to extracellular space.

### Evidence-based reasoning rubric (10 points)
- Accurate pathway order ER → Golgi → vesicle → plasma membrane: 2
- Uses evidence from **both** model conditions: 3 (1 for enabled release, 1 for blocked retention, 1 for explicit comparison)
- Correct mechanism: membrane fusion, not docking or passage through intact bilayer: 3
- Scientific clarity and correct use of cargo/vesicle terms: 1
- Reflection distinguishes original prediction from revised understanding: 1

Teacher review required for free-response scientific correctness. Do not award points merely because text is long or includes keywords. Allow unlimited revision attempts; maintain immutable original prediction and separate revision history.

## LMS integration contract
Version: `inside-cell-secretion-evidence-feedback-v1`. Lesson ID to be supplied by LMS owner; do not invent enrollment IDs.
Persist per authenticated student, lesson and content version: `predictionOriginal`, `predictionReasonOriginal`, `predictionSubmittedAt`, `watchedVideo`, `conditionsObserved` (set of `enabled`, `blocked`), `checkpointChoice`, `checkpointSubmittedAt`, `explanationDraft`, `revisedExplanation`, `reflection`, `completedAt`, `revisionHistory`. Server must enforce original prediction write-once, authorization, versioned saves and resume across devices. Do not treat localStorage or client-side read-only UI as durable authenticated persistence. Do not expose this teacher key in student JSON or client assets.

## Acceptance checks for independent reviewers
1. Correct scientific geometry of bilayer fusion and soluble cargo release; blocked condition retains cargo in vesicle.
2. Video and verbatim WebVTT captions synchronized by human review, transcript equivalent, keyboard controls and touch targets.
3. 320px phone and iPad Safari: one-screen layout, visible navigation, no forced page scrolling; VoiceOver focus/announcements tested.
4. Original prediction unchanged after Back/Next, reload, device change and attempts to alter request payload.
5. Both conditions required; checkpoint feedback distinguishes docking from fusion; student explanation cites both runs.
6. Authenticated enrolled student can resume, complete and have completion visible to teacher; teacher key never exposed to student.
7. Four independent QA gates and independent ≥90/100 score required before publication.

## Current evidence and blockers
This document is a curriculum/feedback integration artifact, **not** proof of rendered geometry, browser/iPad execution, authenticated persistence, or independent QA. Existing v4 ZIP is a local prototype and its server integration is unverified. All gates remain open; no live publication authorized.
