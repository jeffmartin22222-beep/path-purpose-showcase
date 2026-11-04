# Inside the Cell — Membrane Transport Evidence Lab
**Status:** DRAFT / NOT FOR STUDENT PUBLICATION. **Unit:** Inside the Cell (secondary Biology). **Estimated student time:** 12–16 minutes. **Delivery:** five paged screens; solo, asynchronous, no supplies, no outside links.

## Core scientific question
How can a cell move a substance across its membrane when the direction of movement matters?

**Student target:** I can distinguish facilitated diffusion from ATP-coupled active transport using the direction of net transport relative to a concentration gradient and evidence about energy coupling.

**Success criteria:** I (1) record a prediction before testing, (2) compare two membrane transport conditions, (3) cite at least two numerical observations, and (4) explain why the evidence supports a particular transport mechanism.

**Scientific scope:** Stylized model of a *single solute* moving through two different membrane proteins. The counts are conceptual observations, not molecular dynamics, physiological rates, or a claim that all active transporters directly hydrolyze ATP. Protein A is a passive carrier/channel that allows downhill movement; Protein B is an ATP-driven pump that can move the same hypothetical solute uphill. Neither allows unmediated diffusion through the lipid bilayer in this model. Both directions can show individual movement; “net” means forward crossings minus reverse crossings. ATP hydrolysis is represented as an energy-coupling event, not as ATP pushing particles directly.

## Screen 1 — Predict before you inspect
**Heading:** Can a cell move particles toward the crowded side?
**Student copy:** A cell membrane separates two spaces. The outside has 12 particles of substance X; the inside has 4. A protein in the membrane can move X. What would need to be true for the cell to move *more X from inside to outside* than from outside to inside?

**Prediction choices:** A. Any transport protein can do this without energy. B. The cell needs an energy-coupled transport mechanism. C. Particles stop moving once the sides have different counts. D. I am unsure.

**Reason box:** “I predict ___ because ___.” Minimum 15 non-whitespace characters; student may state uncertainty. **Save the first submitted prediction and reason as immutable** `initialPrediction` and `initialReason`; never overwrite on edits or retries. The student may add `revisedPrediction` later. Feedback at this point: “Your prediction is saved. Now test it; you will return to it.”

**Next** stays fixed in the bottom action area, never below the fold. Disabled until prediction and reason are submitted. The prediction is not graded.

## Screen 2 — Investigate Protein A
**Heading:** Test movement without an energy input
**Student copy:** Start with 12 X outside and 4 X inside. Protein A allows X to cross, but is not coupled to an energy source. Run one observation interval. Track crossings, not just where particles appear.

**Manipulation:** Button “Run Protein A” animates a 4-second interval; “Replay” repeats the same *labeled model dataset* without changing its values. No randomness.

**Observation card (after Run):**
- Outside → inside crossings: **5**
- Inside → outside crossings: **1**
- Net: **4 particles inward**
- ATP-coupled events: **0**

**Check:** “Which claim matches the observation?” (a) Net movement is inward, from more concentrated to less concentrated. **Correct.** (b) Net movement is outward. (c) All individual particles move inward. (d) The membrane protein uses ATP.

**Feedback:** For (a): “Yes. Five crossed inward and one outward; the *net* is four inward. Some particles still traveled outward.” For (b): “Compare 5 inward with 1 outward. Subtract to find the net direction.” For (c): “One particle crossed outward. Net movement does not mean one-way movement.” For (d): “The model recorded zero ATP-coupled events. This is facilitated diffusion.”

**Evidence receipt:** On correct response, store `proteinA={in:5,out:1,net:"4 inward",energy:0}`, along with `observedA=true`. **Next** remains fixed and requires correct evidence interpretation, with unlimited retries.

## Screen 3 — Investigate Protein B
**Heading:** What changes when energy is coupled to transport?
**Student copy:** Reset to 12 X outside and 4 X inside. Protein B is an ATP-driven pump. It changes shape as it couples ATP hydrolysis to X transport. Run the same length observation interval.

**Manipulation:** Button “Run Protein B” animates the pump alternating access to each side. Show X binding on the inside, a distinct ATP hydrolysis indicator, and release outside. Never depict an open tunnel across both sides at once. “Replay” uses the same model data.

**Observation card (after Run):**
- Inside → outside crossings: **6**
- Outside → inside crossings: **1**
- Net: **5 particles outward**
- ATP hydrolysis events coupled to pump cycles: **6** (illustrative 1:1 coupling for this fictional pump, *not* a universal stoichiometry)

**Check:** “Which observation most strongly supports active transport?” (a) X can move in both directions. (b) The pump produces net outward movement from the lower-count side to the higher-count side while coupled to ATP hydrolysis. **Correct.** (c) The membrane contains proteins. (d) The pump stops all diffusion.

**Feedback:** Correct: “Right. Net outward movement opposes the concentration difference, and the modeled pump couples its cycle to ATP hydrolysis.” For (a)/(c): “That observation alone cannot distinguish active from passive transport.” For (d): “One particle still crossed inward; the model does not imply all movement stops.”

**Evidence receipt:** Store `proteinB={in:1,out:6,net:"5 outward",atp:6}` and `observedB=true` on correct check. Both evidence receipts are required before advancing.

## Screen 4 — Explain with evidence
**Heading:** Make a claim that the numbers support
**Student copy:** Your prediction is shown *exactly as you first submitted it*. You may keep it or revise it; the original stays visible. Explain why Protein A and Protein B move X differently.

**Structured response fields:**
1. **Claim:** “Protein ___ is the energy-coupled transporter because ___.” (minimum 35 characters)
2. **Evidence A:** “Protein A: ___ inward and ___ outward; net ___.” (three required numeric/direction selections)
3. **Evidence B:** “Protein B: ___ outward and ___ inward; net ___; ATP events ___.” (four required selections)
4. **Reasoning:** “The direction of net movement matters because ___; ATP coupling matters because ___.” (minimum 80 characters)
5. **Revision:** “My original prediction was ___; I now think ___ because ___.” (minimum 35 characters, uncertainty accepted)

**Immediate feedback before final submit:** Missing numbers or reasoning → “Add evidence from both runs and explain how the concentration difference affects the direction of net movement.” Numeric mismatches → “Check the observation receipts; do not guess from the animation alone.” Do not reveal the teacher model answer while composing. Save drafts on each change; never alter initial prediction.

**Submit** is enabled only after both evidence receipts exist and required fields are complete. **Next** remains fixed.

## Screen 5 — Review and transfer
**Heading:** Can you apply the idea somewhere new?
**Student copy:** A cell has 3 Y particles inside and 15 outside. A membrane protein produces a net movement of Y from inside to outside. Which additional observation would best support that the protein uses an energy-coupled process?

Choices: (a) The protein is present in the membrane. (b) Y is also moving inward occasionally. (c) The protein's transport cycle depends on an energy source such as ATP hydrolysis. **Correct.** (d) The cell membrane contains phospholipids.

**Feedback:** Correct: “Yes. Moving net from the less concentrated side to the more concentrated side needs an energy source; dependence on energy coupling strengthens the claim.” Incorrect: “The direction is uphill. Which observation explains how that movement can be sustained?”

**Final review:** Display original prediction verbatim, optional revision, A and B observation receipts, submitted explanation, and transfer feedback. Completion screen persists after refresh; no automatic jump to a new lesson. “Review my evidence” returns read-only to screens 2–4. A visible “Finish lesson” control appears only after the transfer question is answered correctly.

## Visual and interaction implementation contract
- Fixed-height page layout: header, central stage, fixed footer with Back / Next; no document scrolling at target phone and iPad viewports. At 320×568, shrink/reflow visual stage and use internal screen-state pagination rather than clipping text; if a single screen cannot fit with readable text, split it into another page rather than shrink below accessible size.
- Visual: two labeled compartments, membrane bilayer, protein icon, numbered particle tokens; show direction arrows and crossing counters *as text*, not color alone. Protein A: open/close or carrier motion without ATP; Protein B: alternating-access pump with separate ATP cue. Do not imply direct passage through phospholipids or all transport proteins are pumps.
- Pause/replay and “Skip animation / Show observations” controls; reduced-motion mode renders the end state and full numerical observation. Animation is never the sole source of evidence.
- Keyboard: Tab to all controls; Enter/Space activate; focus heading after Next; visible focus ring. Accessible live region announces “Observation complete; five inward, one outward, net four inward” etc., once only. Respect screen-reader reading order; label all numeric controls.
- Persistence: `lessonVersion`, immutable `initialPrediction`/`initialReason`, `observedA`, `observedB`, evidence receipts, draft explanation, final submission, transfer result, and completion state. Restore the same screen on reload. If storage is unavailable, warn clearly and keep the current session usable.
- All required work is solo, asynchronous, digital, and without purchases, supplies, printing, peers, or external links. No timer, no attempt limit. Teacher-only answer key and rubric must not be shipped in student-facing bundles.

## Teacher-only answer key (do not expose to student)
- Prediction: ungraded; strong answer anticipates energy coupling for net uphill transport.
- Protein A: 5 inward − 1 outward = net 4 inward, down concentration gradient, zero ATP events; facilitated diffusion.
- Protein B: 6 outward − 1 inward = net 5 outward, against the initial concentration difference, six modeled ATP-coupled pump events; active transport.
- Transfer: C. Energy coupling supports sustained net uphill movement.
- **Rubric, 10 points:** accurate mechanism claim (2); numerical A evidence and net direction (2); numerical B evidence and net direction (2); reasoning links gradient and energy coupling (3); prediction reflection using evidence (1). Suggested mastery 8/10 with no critical scientific misconception; teacher can override with rationale.
- **Critical misconceptions:** “all particles move in the net direction”; “proteins automatically use ATP”; “ATP pushes molecules directly”; “a transporter must form an always-open pore”; “concentration difference alone drives net uphill movement.” Provide targeted reteaching and unlimited retries. An explanation containing any critical misconception requires review even if numeric score is high.

## Independent QA acceptance tests — all currently UNVERIFIED
**Gate 1 Content/standards:** independent Biology reviewer verifies gradients, net movement, ATP coupling, and fictitious pump stoichiometry disclaimer; align with the adopted district/state standard version before release.
**Gate 2 Pedagogy/engagement:** external reviewer checks prediction is preserved, both conditions are genuinely compared, evidence precedes explanation, feedback diagnoses misconceptions, and 10-point rubric applies consistently.
**Gate 3 Technical/mobile/accessibility:** automated and manual keyboard, screen-reader, reduced-motion, iPad Safari, 320×568 and 768×1024 tests; Next always visible, no document scroll, persistence after reload, no teacher key in student payload.
**Gate 4 End-to-end student/demo:** fresh student account completes all five screens, tries incorrect answers, resumes after reload, reviews original prediction, submits explanation, finishes and sees persistent completion; teacher views key separately.

**Publication gate:** Remain in drafts until independently scored ≥90/100 and all four gates pass. This markdown is an implementation-ready curriculum specification, not a claim of a built or tested interactive.
