# Inside the Cell — Membrane Transport: Two Routes, One Boundary
**Unpublished original video production master | 48 seconds | Biology flagship | Draft 1 | 2026-11-03**

## Production objective and conceptual accuracy
Students compare **facilitated diffusion** of a solute down its concentration gradient through a selective membrane protein with **ATP-coupled active transport** of a solute against its concentration gradient. This is a *conceptual model*, not a molecular simulation. The two routes must use **different labeled solutes** to avoid falsely implying one transporter can carry arbitrary molecules. Do not suggest that all membrane proteins use ATP or that diffusion requires cellular energy. Do not imply ATP alone determines direction: transport requires an appropriate protein and coupling mechanism. Use a **direct ATP-powered pump** as the active-transport example; secondary active transport is outside scope. Do not show water as the example solute.

## Art direction
16:9, 1920×1080 source, 48 seconds, clean 2.5D cutaway of a lipid bilayer with clearly visible hydrophilic heads and hydrophobic tails. Two distinct proteins: left, a teal selective channel/carrier for **Solute A**; right, an amber ATP-driven pump for **Solute B**. Use shape and labels in addition to color. A consistent cytoplasm/extracellular orientation remains fixed. Solute counts are illustrative and explicitly labeled *model particles, not to scale*. Avoid misleading spinning molecules, pore resizing, or instantaneous teleportation. Show an individual transport event as a smooth traversal. Each scene must be understandable when paused.

## Locked narration and shot-by-shot storyboard
| Time | Visual direction | Original narration | On-screen student language |
|---|---|---|---|
| 00:00–00:06 | Camera establishes bilayer, cytoplasm below, outside above. Two clearly separate transport routes, both inactive. | “A cell membrane controls what enters and leaves the cell.” | **One membrane. Different transport routes.** |
| 00:06–00:13 | Left route only. Solute A abundant outside, scarce inside; stable labels **higher** and **lower concentration**. Protein selectively binds/passes A. | “Some substances move from higher to lower concentration through a matching membrane protein.” | **Facilitated diffusion · high → low** |
| 00:13–00:19 | Three A particles pass through the protein one by one; ATP icon crossed out *only beside this route*, not over the cell. | “That is facilitated diffusion. It does not directly use ATP.” | **No direct ATP input** |
| 00:19–00:25 | Freeze with high/low A particle counts. Brief prediction overlay: **If the concentrations become equal, what happens to net movement?** Pause and await learner choice in LMS; film itself holds a clean poster frame. | “Predict: what happens to net movement when both sides have equal concentrations?” | **Predict before revealing** |
| 00:25–00:32 | Reveal: A particles move in both directions with equal average rates, zero **net** movement. Do not stop all motion. | “Particles still move both ways, but there is no net movement at equilibrium.” | **Movement continues · net movement = 0** |
| 00:32–00:40 | Right route only. Solute B low inside and high outside; pump carries B from low inside to high outside; ATP → ADP + phosphate shown next to pump. | “Other proteins use energy from ATP to pump a substance against its concentration gradient.” | **Active transport · low → high · ATP coupled** |
| 00:40–00:48 | Split comparison, both routes operating. Fade to evidence challenge with labels visible. | “Which route needs ATP, and what evidence tells you the direction of transport?” | **Explain with evidence: concentration, direction, energy.** |

Narration target: approximately 112 words; delivery should be unhurried with deliberate pauses, especially 00:19–00:25. The prediction segment is an interactive checkpoint; when implemented, pause **before** any reveal and preserve the student's initial choice unchanged.

## Exact WebVTT captions (draft; synchronize to final recorded voice)
```vtt
WEBVTT

00:00:00.000 --> 00:00:06.000
A cell membrane controls what enters and leaves the cell.

00:00:06.000 --> 00:00:13.000
Some substances move from higher to lower concentration
through a matching membrane protein.

00:00:13.000 --> 00:00:19.000
That is facilitated diffusion. It does not directly use ATP.

00:00:19.000 --> 00:00:25.000
Predict: what happens to net movement
when both sides have equal concentrations?

00:00:25.000 --> 00:00:32.000
Particles still move both ways,
but there is no net movement at equilibrium.

00:00:32.000 --> 00:00:40.000
Other proteins use energy from ATP
to pump a substance against its concentration gradient.

00:00:40.000 --> 00:00:48.000
Which route needs ATP, and what evidence tells you
the direction of transport?
```

## Accessible LMS checkpoint and student experience
At 00:19 pause and show a full-width, keyboard-operable checkpoint above a persistent **Next** button, with no vertical scrolling at 1024×768 or mobile landscape. Prompt: “When Solute A reaches equal concentration on both sides, which statement is best supported?” Options: (A) All particles stop moving; (B) Particles continue moving both directions, with no net movement; (C) The membrane begins consuming ATP to maintain diffusion. Store original answer as immutable `initialPrediction` on first submit; later revision stored separately as `revisedAnswer`. Never overwrite original on replay. Offer **Replay segment** and captions/transcript. Reveal explanation only after initial prediction, not beforehand. Give feedback: A—particles continue random motion; B—correct, equal opposing fluxes; C—facilitated diffusion does not directly consume ATP. A choice is required, but correctness must not gate viewing; a reasoned explanation is required for completion.

## Evidence-based follow-through (solo, asynchronous, no materials)
After video, show a two-column comparison of the same two routes. Student selects **concentration gradient**, **direction of net transport**, and **ATP coupling** evidence and answers: “A membrane protein moves Solute B from an area with fewer particles to one with more particles. Which route does the model support? Use two observations as evidence.” Provide a plain-text alternative to visual particle counts. Response must contain reasoning, not a keyword-only auto-pass. A student can complete with keyboard or touch; no printer, lab materials, live meeting, or outside links.

## Teacher-only key and formative rubric (must not be embedded in student public bundle)
Checkpoint: B. At equilibrium, molecular motion continues while net flux is zero. Transfer response: ATP-coupled active transport; evidence 1: Solute B moves from lower to higher concentration; evidence 2: ATP is coupled to the membrane pump. Score 0–4: 1 point correct transport type; 1 point direction with relative concentrations; 1 point ATP/protein evidence; 1 point coherent causal explanation. Misconceptions: “all motion stops at equilibrium,” “all membrane transport uses ATP,” “any protein transports any solute,” “ATP can make particles pass through the lipid bilayer without a transporter.” Require teacher access control; never package this section into student-facing export.

## Production handoff and acceptance
1. Render original continuous 48-second video with natural, intelligible narration, high-quality visuals, no borrowed commercial media. Deliver MP4 H.264, AAC audio, WebVTT, transcript, silent poster image, and provenance/rights manifest.
2. Check scientific visual truth: two distinct solutes and proteins; persistent concentration labels; nonzero particle motion at equilibrium; ATP attached only to active pump; smooth membrane crossing; no misleading fusion or holes.
3. Test checkpoint pause/replay and immutable original prediction; keyboard, touch, VoiceOver, captions, reduced-motion fallback, portrait/landscape iPad, and a visible Next button.
4. Independent reviewers sign content/standards, pedagogy, technical/iPad/accessibility, and end-to-end student/demo gates. No publication or >=90/100 quality claim before evidence.

**Status:** Original storyboard, complete narration, caption draft, checkpoint, evidence task, teacher key and rubric authored. No audio/video render, independent reviews, or physical device tests completed. Keep on draft branch.
