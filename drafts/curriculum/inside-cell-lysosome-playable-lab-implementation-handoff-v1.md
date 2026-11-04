# Inside the Cell — Lysosome Evidence Lab: executable student activity handoff
INTERNAL DRAFT · 2026-11-04 · DO NOT PUBLISH

## Implemented artifact
A standalone 5-screen HTML student lab was built as `inside_cell_lysosome_lab_playable_v1.html` and saved as an attached downloadable artifact in the curriculum-builder run. This manifest documents the precise tested implementation contract; the HTML is not represented as deployed or rendered video.

## Student progression
1. Predict independently whether lowering lysosomal acidity prevents cargo delivery, slows digestion, or speeds digestion. Require a written rationale. Lock the original answer with timestamp and content version; show it read-only thereafter.
2. Manipulate two acidity conditions, each with 12 delivered cargo units. The illustrative model processes 9 units at usual acidity, versus 3 at reduced acidity; 3 versus 9 remain intact. Both trials are required. Show both shape-coded diagrams and an accessible table. Counts are illustrative, not physiological rates.
3. Interpret: the supported conclusion is equal delivery with reduced digestion. Wrong answers receive specific evidence-oriented feedback, unlimited retries, and append-only attempt records.
4. Write claim, numerical evidence from both trials, and biological reasoning about acid-active lysosomal hydrolases. Save draft text after every input. Do not treat minimum-length checks as scientifically valid automatic grading; teacher review is required.
5. Transfer: identify a direct arrival count as the test of whether delivery failed. Revisit immutable original prediction and write a two-observation reflection. Persist completion.

## Implementation safeguards
- Solo, asynchronous, no purchased materials, printing, peers, or external services.
- Back/Next buttons persist in the bottom player rail; lesson content uses a bounded viewport panel.
- Semantic buttons, labels, focus-visible styles, aria-pressed for choices, text alternatives to diagram, prefers-reduced-motion support, responsive layout.
- Client-side localStorage is a prototype-only persistence mechanism. Production integration must use authenticated durable LMS storage and keep the teacher key entirely server-side. A localStorage demo does not establish multi-device persistence.
- Scientific boundary: lysosomal acidification often supports hydrolase activity, but real-world disruption can also affect trafficking; this controlled model isolates digestion while keeping delivery fixed.
- Actual screen-reader, iPad, 320px and 200%-zoom verification remains open. A viewport panel may scroll for enlarged text; production must repaginate rather than clip and must preserve visible navigation.

## Acceptance checks
- Original prediction does not change after navigating back.
- Cannot advance past experiment until both conditions are run.
- Diagram and accessible table give identical numbers.
- Wrong interpretation does not unlock Next.
- All CER fields required before progression; not marked mastered by length.
- Completion survives refresh in same browser; multi-device sync is not claimed.
- Teacher key absent from student HTML.
- No production publication until independent content/standards, pedagogy, technical/iPad/accessibility, and end-to-end demo gates all pass and independent score >=90/100.

## Teacher-only rubric (store separately in authenticated teacher resources)
10 points: claim 2, delivery evidence from both conditions 2, digestion evidence from both conditions 2, acid-active enzyme mechanism with model limitation 2, reflection supported by two observations 2. Predicted answer B is preferred but prediction correctness is not graded. Interpret B; transfer A. This teacher-only section is in the internal handoff, not in the student HTML.
