# INSIDE THE CELL — Exocytosis: How a Cell Releases Cargo
**Status:** INTERNAL DRAFT — NOT APPROVED FOR STUDENT PUBLICATION  
**Asset ID:** IC-EXO-046-V1 | **Target runtime:** 46 seconds | **Canvas:** 1920×1080, 30 fps | **Delivery:** MP4 H.264 + separate VTT + transcript  
**Audience:** Middle/high-school biology; solo asynchronous, no supplies or outside links

## Instructional promise
A student should distinguish **docking** from **fusion**, explain how a vesicle membrane joins the plasma membrane to make a continuous passage, and cite visible evidence that cargo moves into the extracellular space. This is a conceptual cross-section, **not** a molecular-scale or to-scale simulation.

## Visual language and scientific rules
Cutaway through a eukaryotic cell edge. Cytoplasm below the plasma membrane, extracellular fluid above it, each continuously labeled. Membranes appear as *two leaflets* in a stylized bilayer, not rigid walls. A cargo-filled vesicle approaches from cytoplasm. Cargo stays **inside** the vesicle until the vesicle membrane fuses with the plasma membrane and an opening connects the vesicle lumen to the extracellular fluid. At fusion, draw membrane continuity, not a sealed circle intersecting a line. Cargo exits by diffusion after the opening forms. Vesicle membrane becomes part of the plasma membrane. No cargo passing directly through intact lipid bilayer; no implication that every vesicle fuses spontaneously. Small on-screen tag: “Simplified model; fusion is regulated by proteins.” Do not animate ATP as directly pushing cargo through the pore. Distinct colors plus shape/labels; never rely on color alone.

## Locked narration and shot list (46 seconds)
| Time | Scene / exact camera action | Narration (original) | On-screen text |
|---|---|---|---|
| 00:00–00:06 | Wide cutaway: cell edge, vesicle with six triangular cargo markers moves toward membrane; labels appear. | “Cells sometimes need to release materials without pushing them through the membrane.” | “Inside the cell” / “Outside the cell” |
| 00:06–00:12 | Vesicle stops just beneath intact plasma membrane. Hold 2 seconds; show **no** release. | “A small membrane-bound vesicle carries cargo toward the cell surface.” | “1 · Approach” |
| 00:12–00:18 | Magnify contact. Show vesicle touching surface but still fully sealed. Dashed callout points to closed lumen. | “Touching the surface is not enough. The cargo is still enclosed.” | “2 · Docked ≠ released” |
| 00:18–00:24 | Freeze at docking; dim background; question card, no answer overlay. | “Predict: if the membranes never fuse, where will the cargo stay?” | “Predict before continuing” |
| 00:24–00:32 | Return to cutaway. Morph vesicle and plasma membrane leaflets into continuous connection; open lumen to outside. Do **not** depict cargo crossing before opening. | “When fusion occurs, the two membranes become continuous, opening a route to the outside.” | “3 · Fusion opens a passage” |
| 00:32–00:39 | Triangular cargo moves from lumen through opening to extracellular region; vesicle membrane remains merged with surface. | “Now the cargo can leave the cell, while the vesicle membrane joins the surface membrane.” | “4 · Cargo released” |
| 00:39–00:46 | Side-by-side stills: docked/sealed vs fused/open, arrows pointing at membrane boundaries; pause-ready final frame. | “The evidence is the opening: without fusion, cargo remains enclosed. With fusion, it can escape.” | “What changed? Cite the membrane evidence.” |

**Narration performance:** 125–145 wpm, neutral warm tone, no music required; prioritize crisp pronunciation of “vesicle,” “fusion,” and “membrane.” If voice timing overruns, adjust pauses/camera holds rather than speeding beyond 150 wpm. Narration is ~95 words; timing must be checked against generated audio before final render.

## Student checkpoint and feedback contract
At 00:18, **pause playback** and display a separate accessible question UI (not burned into the video): “If the vesicle touches the membrane but fusion is blocked, what happens to the cargo?” Choices: A. It stays enclosed in the vesicle. B. It crosses the intact membrane. C. It instantly disappears. Save first response in `originalPrediction` and **never overwrite it**; allow revisions in `currentPrediction`. After selection, show feedback: A “Correct: docking alone leaves the cargo enclosed.” B “An intact membrane is still a barrier; look for a continuous opening.” C “Cargo is conserved in this model; look for where it is enclosed.” Offer “Rewatch” and “Continue video” buttons. Video must resume from 00:24 after explicit Continue, not auto-advance. Screen-reader announcement of feedback via live region. Persist checkpoint state per learner and immutable assessment-version ID.

After the film, require student to select both observations: (1) blocked fusion → closed vesicle with cargo inside, (2) permitted fusion → continuous membrane opening and cargo outside. Then ask: “Use both observations to explain why fusion is necessary for release.” Preserve free text and original prediction. Next stays visible; disable advancement with explanatory instruction until both observations and a nonblank explanation are supplied. Do **not** auto-grade explanation by length or keywords.

## Captions (WebVTT, independently editable)
```vtt
WEBVTT

00:00:00.000 --> 00:00:06.000
Cells sometimes need to release materials
without pushing them through the membrane.

00:00:06.000 --> 00:00:12.000
A small membrane-bound vesicle carries
cargo toward the cell surface.

00:00:12.000 --> 00:00:18.000
Touching the surface is not enough.
The cargo is still enclosed.

00:00:18.000 --> 00:00:24.000
Predict: if the membranes never fuse,
where will the cargo stay?

00:00:24.000 --> 00:00:32.000
When fusion occurs, the two membranes become
continuous, opening a route to the outside.

00:00:32.000 --> 00:00:39.000
Now the cargo can leave the cell, while
the vesicle membrane joins the surface membrane.

00:00:39.000 --> 00:00:46.000
The evidence is the opening: without fusion,
cargo remains enclosed. With fusion, it can escape.
```

## Accessible descriptive transcript (non-audio visual details)
00:00 Cell interior is below a labeled plasma membrane; outside is above. A closed vesicle contains six triangle-shaped cargo markers. 00:06 The vesicle approaches and stops. 00:12 It touches the membrane but remains sealed; no cargo escapes. 00:18 Playback pauses for a prediction. 00:24 Vesicle membrane and cell membrane join into one continuous boundary with an open passage to the outside. 00:32 Cargo markers move through that passage. 00:39 The comparison shows a sealed vesicle when fusion is blocked and an open connection when fusion occurs.

## Teacher-only key and misconception guidance (do not ship in student bundle)
Prediction A. Evidence pair: sealed lumen retains cargo; fused membranes create open continuity to extracellular space. Exemplary explanation: “When fusion is blocked, the vesicle stays sealed even though it is docked, so cargo remains inside. When fusion happens, the vesicle membrane connects to the plasma membrane and opens a path; cargo can move outside.” Rubric (4): 1 point correctly states blocked condition; 1 point identifies membrane continuity/open passage; 1 point describes released cargo; 1 point explicitly contrasts conditions as evidence. Feedback for “vesicle crosses membrane”: clarify that membrane **joins** rather than the whole vesicle passing through. Feedback for “cargo leaks through bilayer”: distinguish intact bilayer from open fusion connection.

## Render and integration acceptance checks
1. Frame at 00:16: sealed vesicle, all cargo inside, no open channel. Frame at 00:29: continuous membrane and open lumen. Frame at 00:35: cargo outside, membrane integrated.
2. Validate audio narration matches caption meaning; timestamps follow final audio, not assumed timings.
3. Confirm pause checkpoint is LMS overlay, not a clickable element embedded in MP4. Rewatch and resume retain original prediction.
4. Test iPad Safari touch, muted autoplay policy (require user Play), captions toggle, VoiceOver controls, landscape/portrait sizing, keyboard tab/focus, reduced-motion alternative, no page scrolling, persistent Next.
5. Ensure student has access to transcript and still-image equivalent if video cannot play; all required work remains solo and no-material.
6. Validate export: MP4 playable, VTT valid, poster image legible, transcript available, no remote assets.
7. Four independent sign-offs: science/standards, pedagogy, technical/iPad/accessibility, end-to-end student/demo. Until all pass and score >=90/100: **draft only**.

## Render handoff manifest
Input: this production master. Output names: `inside-cell-exocytosis-46s-v1.mp4`, `inside-cell-exocytosis-46s-v1.vtt`, `inside-cell-exocytosis-46s-v1-poster.png`, `inside-cell-exocytosis-46s-v1-transcript.txt`. Renderer must report actual media duration, narration track presence, and generated output paths. **This document is a production specification, not a claim that an MP4 was rendered.**
