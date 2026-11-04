# Inside the Cell — Mitochondria: Follow the Energy (draft v1)
Status: INTERNAL DRAFT ONLY. No student publication or independent QA approval.

## Learning target and scientific boundaries
**Target:** Explain how mitochondria use energy from food molecules to support ATP production in aerobic cellular respiration, and support a claim using model evidence.
**Success:** Compare oxygen-available and oxygen-limited conditions; identify where matter enters and leaves; explain ATP as an energy-transfer molecule, not energy created from nothing.
**Scientific guardrails:** Cells do not simply "turn food into energy." Energy is transferred from chemical bonds through reactions; atoms are conserved. Glycolysis occurs in the cytosol, not mitochondria. The mitochondrial matrix hosts pyruvate oxidation and the citric acid cycle; the inner mitochondrial membrane hosts the electron transport chain and ATP synthase. Oxygen acts as the terminal electron acceptor in aerobic respiration. Cells may continue glycolysis and some ATP production without oxygen; never depict oxygen removal as instantly stopping all cellular ATP. Numbers below are fictional, normalized instructional model units, not measured ATP yields or exact stoichiometry. No implication that all organisms or cells contain mitochondria.

## Student sequence: five paged screens
Each screen fits the viewport, with a persistent bottom Back / Next bar, no document scrolling at supported phone and iPad widths; one focused task per screen. Next is visible but disabled until the screen's required response is saved, with an explanation of why.

### 1. Predict — What changes when oxygen is scarce?
**Narrative:** Your muscle cell needs ATP to move. Food-derived molecules provide chemical energy. Oxygen is available in one model cell but scarce in another. What happens to ATP production through aerobic respiration?
**Prompt:** Select: (A) Both conditions produce the same mitochondrial ATP; (B) Oxygen-scarce condition supports less mitochondrial ATP; (C) Oxygen creates ATP from nothing. Then write a one-sentence reason.
**State:** Save `predictionOriginal` and `predictionReasonOriginal` once, append-only. Never replace on retries, back navigation, or restoration. Display "Your first prediction" at the end. Do not reveal correctness yet.

### 2. Explore — Track the matter
**Manipulation:** Student selects each labeled region of a cell model: cytosol, mitochondrial matrix, inner membrane, and outside cell. Interactive accessible text labels and focus order mirror the visual diagram. The model traces carbon-containing molecules from glucose breakdown to carbon dioxide released during subsequent reactions; oxygen is consumed in the electron transport process and water is formed. Show arrows for matter movement and separate dotted arrows for energy transfer.
**Student task:** Tap "Follow carbon" and "Follow oxygen" and answer: "Which material is released as carbon-containing waste?" Correct: carbon dioxide. Incorrect feedback distinguishes CO2 from ATP and oxygen. Clarify that the diagram is simplified and not every molecular intermediate is shown.
**Science:** Do not show glucose molecules moving intact into mitochondria as the sole pathway; explicitly label glycolysis in cytosol.

### 3. Experiment — Change oxygen availability
**Controls:** Two buttons: "Oxygen available" and "Oxygen limited". A three-stage visual shows (1) food-derived molecules enter mitochondrial reactions, (2) electron transport depends on oxygen accepting electrons, (3) ATP synthase is driven by an ion gradient. The oxygen-limited view reduces electron-transport activity; do not animate ATP synthase as directly consuming oxygen.
**Model observations** (arbitrary relative units per equal time interval; not real ATP yields):
| Condition | Relative mitochondrial ATP output | Relative cytosolic glycolysis ATP output |
|---|---:|---:|
| Oxygen available | 24 | 2 |
| Oxygen limited | 4 | 2 |
The "4" represents residual modeled output during a limited-oxygen interval, not steady-state anaerobic mitochondrial ATP generation. The model is illustrative, not a biochemical prediction. A simpler implementation may instead label outputs "higher" / "lower" if the numerical assumption cannot be justified in its animation.
**Required:** Inspect both conditions. Save first inspection timestamp and observed values separately; allow revisits. Prompt: "Which condition supports more ATP from mitochondria? Cite both numbers."

### 4. Explain — Evidence, not guessing
**Prompt:** "Make a claim about oxygen availability and mitochondrial ATP production. Use both observed values and explain why oxygen matters. Then explain why ATP production does not necessarily drop to zero across the whole cell."
**Answer scaffold:** "When oxygen was ___, mitochondrial ATP output was ___ model units, compared with ___ when oxygen was ___. This supports my claim because ___. The cytosol can still ___."
**Feedback:** If student equates oxygen with ATP fuel: "Oxygen is not the energy source. It helps the electron transport chain continue by accepting electrons." If student claims zero whole-cell ATP: "Recheck the glycolysis column." If student confuses ATP with matter output: "ATP transfers usable chemical energy; it is not a waste gas." Automated checks may identify missing evidence, but must NOT award scientific correctness solely for keywords or length. Require a teacher-review state for unvalidated free text.

### 5. Revisit — Explain a new scenario
**Transfer:** "A cell is supplied with glucose but its mitochondrial electron transport chain is blocked. Would extra glucose alone restore normal mitochondrial ATP output? Why?" Expected: No; substrate alone cannot bypass the blocked electron transport chain; glycolysis can still contribute some ATP.
**Reflection:** Show original immutable prediction and reason beside current claim. "What would you keep or change in your thinking? Point to one observation." Save reflection separately.
**Completion:** Completion persists, stays visible, and has an obvious "Return to Homeroom" control. No repeated submission boxes.

## Original 50-second video: “The Oxygen Hand-off”
| Time | Visual direction | Narration |
|---|---|---|
| 00–07 | Cell wide shot, zoom to cytosol, glucose breaks into smaller molecules; label "glycolysis" | "Your cells transfer energy from food molecules to make ATP, a molecule that helps power cellular work." |
| 07–14 | Move to mitochondrion; highlight matrix and inner membrane separately | "Some reactions happen in the cytosol. Many later steps of aerobic respiration happen in mitochondria." |
| 14–22 | Electron carriers deliver electrons to inner-membrane chain; membrane separates compartments | "Electron carriers deliver high-energy electrons to proteins in the inner mitochondrial membrane." |
| 22–30 | Protons move across inner membrane; ATP synthase rotates schematically | "These transfers help build a proton gradient. ATP synthase uses that gradient to produce ATP." |
| 30–37 | Oxygen receives electrons at end of chain; water labeled | "Oxygen accepts electrons at the end of the chain. Water forms during this process." |
| 37–43 | Freeze: two side-by-side cells, oxygen available versus limited; question overlay | "Predict: what happens to mitochondrial ATP output when oxygen becomes scarce?" |
| 43–50 | Show reduced chain activity and comparison, not all ATP at zero | "Without enough oxygen, this pathway slows. But glycolysis can still make some ATP in the cytosol." |

### WebVTT captions
```vtt
WEBVTT

00:00:00.000 --> 00:00:07.000
Your cells transfer energy from food molecules to make ATP, a molecule that helps power cellular work.

00:00:07.000 --> 00:00:14.000
Some reactions happen in the cytosol. Many later steps of aerobic respiration happen in mitochondria.

00:00:14.000 --> 00:00:22.000
Electron carriers deliver high-energy electrons to proteins in the inner mitochondrial membrane.

00:00:22.000 --> 00:00:30.000
These transfers help build a proton gradient. ATP synthase uses that gradient to produce ATP.

00:00:30.000 --> 00:00:37.000
Oxygen accepts electrons at the end of the chain. Water forms during this process.

00:00:37.000 --> 00:00:43.000
Predict: what happens to mitochondrial ATP output when oxygen becomes scarce?

00:00:43.000 --> 00:00:50.000
Without enough oxygen, this pathway slows. But glycolysis can still make some ATP in the cytosol.
```

**Rendering requirements:** Original vector-style cellular imagery, no stock footage; accurate double mitochondrial membrane and inner-membrane placement; labeled electron chain and ATP synthase; no suggestion ATP synthase directly uses oxygen. At 37–43 s, player pauses for prediction, saves response, offers rewatch, then resumes; narration and captions do not reveal answer until prediction saved. Include audio description or equivalent integrated narration for nonverbal science-critical motion. Deliver MP4, VTT, transcript, poster, and scientific inspection stills. Never auto-publish render.

## Protected teacher edition (not in student payload)
**Screen 1:** B is best, but preserve all original predictions, including wrong ones.
**Screen 2:** Carbon dioxide. Glycolysis in cytosol; mitochondrial pathways release CO2; oxygen ultimately contributes to water formation.
**Screen 3:** 24 versus 4 illustrative mitochondrial output units, with cytosolic glycolysis 2 in each condition. These are relative model values, not physiological yields. If scientifically reviewed model changes, update all keys and feedback together.
**Screen 4 model answer:** "With oxygen available, mitochondrial ATP output was 24 units, compared with 4 under limited oxygen. Oxygen allows electron transport to continue as the terminal electron acceptor, supporting the proton gradient that drives ATP synthase. Cytosolic glycolysis can still produce some ATP."
**Screen 5:** More glucose does not fix blocked electron transport; cytosolic glycolysis may still yield ATP.

**10-point rubric:** Claim about oxygen (2); evidence from both model conditions (2); mechanistic role of oxygen/electron transport/proton gradient (3); distinguish mitochondrial versus whole-cell ATP/glycolysis (2); transfer reasoning (1). No full credit for unsupported "oxygen gives energy" explanations.

## Implementation and independent acceptance tests
1. First prediction and reason remain immutable across retries, browser reload, Back, and session restore.
2. Both conditions inspected before evidence explanation unlocks; no default fake observations.
3. Values and captions clearly labeled illustrative; no precise ATP-yield claims.
4. Narration, VTT, transcript, and pause-and-predict remain synchronized; pause/rewatch and captions work on Safari iPad.
5. VoiceOver announces region labels, controls, active condition, model output, feedback, and disabled Next reason. Keyboard and touch controls work; no drag-only task.
6. Next/Back remain in view at 320px phone width, landscape iPad, 200% zoom; no page scrolling and no clipped interactive targets.
7. State restoration does not overwrite prediction or prematurely complete lesson.
8. Teacher rubric and model answers never included in student network payload or HTML.
9. All progression is solo, asynchronous, digital, and materials-free.
10. Completion stays visible after refresh; return-to-homeroom action navigates correctly.
11. Independent biology/standards, pedagogy, technical/iPad/accessibility, and end-to-end student/demo reviewers sign separate gate receipts; overall >=90/100 independently before any publication.
12. Video render must be visually inspected at each science-critical timestamp; source script alone is not a passing render test.

**Gate status:** All four gates OPEN. No independent score. Draft only.
