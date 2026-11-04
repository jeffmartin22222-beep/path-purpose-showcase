# Inside the Cell | Vesicle Fusion Evidence Transfer Assessment v1
Status: INTERNAL DRAFT — NOT FOR STUDENT PUBLICATION
Scope: independent asynchronous assessment after the exocytosis model and film.
Science model: vesicle-mediated exocytosis, not diffusion through a protein channel.

## Student experience (five fixed-height pages)
Each page must fit a 768×1024 iPad viewport and a 390×844 phone viewport without document scrolling. Sticky footer: Back, progress, Next. If content cannot fit, paginate; never shrink below readable type. All interactions work by touch, keyboard and screen reader. No materials or other people.

### Page 1 — Make a prediction (not graded for correctness)
**Question:** A cell has packaged signaling molecules inside a membrane-bound vesicle. The vesicle approaches the plasma membrane. What must happen before those molecules can enter the space outside the cell?
A. The molecules pass directly through the lipid bilayer while the vesicle stays closed.
B. The vesicle membrane joins the plasma membrane and an opening connects its interior to the outside.
C. The vesicle disappears and releases its contents into the cytoplasm.
D. The plasma membrane becomes permanently porous everywhere.

**Why do you think so?** Enter one sentence (minimum 15 non-whitespace characters). Save both response and reasoning as immutable `predictionOriginal` and `reasonOriginal` on first Next; subsequent revisits may add a `revisedPrediction`, never overwrite originals. All options permit Next after reasoning is entered; show no correctness feedback yet.

### Page 2 — Examine the evidence (model interaction)
Present a scientifically schematic cutaway with two explicitly labeled conditions. Use one toggle: **Fusion prevented** / **Fusion permitted**. Students must inspect both conditions; focus and screen-reader announcements update on toggle.
- Fusion prevented: vesicle membrane remains closed; cargo stays in lumen; no continuous aqueous path to exterior.
- Fusion permitted: vesicle and plasma membranes merge locally; a fusion pore opens to the extracellular space; cargo may move outward through that path. Do not show the entire vesicle vanishing or cargo crossing intact membrane.
Below the model show the fixed *illustrative* observation dataset (not experimental measurements):
| Condition | Cargo units initially inside vesicle | Cargo units detected outside after model interval |
| Fusion prevented | 20 | 0 |
| Fusion permitted | 20 | 16 |
These numbers are teaching-model values only. They do not imply that fusion always releases exactly 80% of cargo, or that every vesicle releases at the same rate. Both conditions have the same initial cargo quantity.
**Prompt:** What changed between conditions? Choose: (1) initial cargo quantity, (2) whether the membranes made a continuous opening, (3) cargo's molecular identity.
Correct: 2. On incorrect choice give specific feedback and allow retry; do not reveal answer until student has attempted once. Next enabled after both states viewed and one correct evidence choice.

### Page 3 — Interpret, don't memorize
**Which claim is best supported?**
A. Cargo leaves only when a connection to the outside forms. [correct]
B. Cargo always crosses an intact lipid bilayer without assistance.
C. Fusion creates new cargo molecules.
D. Fusion prevented cargo from entering the vesicle in the first place.
For A: “Yes. Both conditions started with 20 cargo units; only the condition with an opening showed cargo outside.”
For B: “Check the blocked condition: no opening formed and no cargo was detected outside.”
For C: “Both started with the same 20 units. The model changes location, not identity or creation.”
For D: “The vesicle already contained 20 units in both conditions.”
Students must select an answer before Next; unlimited retries, feedback after each attempt. Log attempts without replacing first attempt.

### Page 4 — Explain with evidence (graded by rubric)
**Prompt:** A classmate says, “The vesicle just touches the cell membrane, so its cargo can escape.” Explain why touching alone is insufficient. Use both conditions and at least one number from the evidence table. Explain the membrane change that allows release.
Text box: 60–600 characters; provide character count and autosave. A meaningful answer includes: (i) touching/docking is not membrane fusion; (ii) a continuous fusion opening connects vesicle lumen and exterior; (iii) the blocked condition has 0 detected outside while permitted has 16, with equal starting amounts. Do not auto-award full credit from keyword matching. Next requires nonempty substantive answer, not rubric correctness.

### Page 5 — Revisit your thinking
Display original prediction and original reason **verbatim** (read-only), then ask: “What would you keep or change after seeing the evidence?” Require a new 15+ character reflection. Provide a short explanation: “Docking brings membranes close; fusion creates a continuous path. Our model showed 0 cargo units outside when fusion was prevented and 16 when permitted. These numbers illustrate the relationship; actual release depends on the cell and cargo.” Finish with **Complete lesson** (not Next); show persistent completion confirmation and allow review.

## Teacher-only answer key and assessment rubric
This section must be stored behind teacher authorization; never bundle answer key in the student-delivered HTML, JSON, print workbook, or network response.
- Page 1: B is scientifically supported, but initial prediction is diagnostic, ungraded.
- Page 2: opening formation, choice 2.
- Page 3: A.
- Page 4: 6 points:
  - 2 points: distinguishes contact/docking from actual membrane fusion.
  - 2 points: describes continuous opening from vesicle lumen to extracellular space.
  - 2 points: accurately compares 0 vs 16 detected outside and notes same starting 20.
  - 1 point per criterion for partial/incomplete but directionally accurate explanation.
- Page 5: 2 points: 1 for explicitly revisiting original idea; 1 for evidence-supported revision or confirmation.
Total written evidence score: 8 points; multiple choice is formative and not included. Human review or evidence-grounded assisted scoring required; never assert a keyword-based score is definitive.
Common misconceptions: cargo crosses an intact lipid bilayer; docking equals fusion; cargo is created by fusion; all vesicle cargo must exit immediately; vesicle completely disappears. Correct with evidence and membrane continuity.

## Implementation / acceptance tests
1. `predictionOriginal` and `reasonOriginal` remain unchanged after back navigation, retries, reload, and completion.
2. Student cannot proceed from evidence page without viewing both conditions and correctly identifying the changed variable.
3. First attempts and subsequent attempts persist separately; retries are unlimited.
4. Screen-reader announcement describes the *currently visible* membrane state; inactive SVG hidden from accessibility tree.
5. With captions/audio disabled or film unavailable, this activity remains fully completable using text and diagrams.
6. At 390×844 and 768×1024, Next/Back stay visible without page scrolling; text reflows without clipping.
7. Teacher key inaccessible to student roles through API, source, preloaded data, or print export.
8. After completion and reload, completion state and original prediction persist.
9. Numerical values are labeled illustrative; do not imply a quantitative biological law.
10. Student activity is fully solo, asynchronous, no purchase, no printer, no external links.

## QA gates (all OPEN)
- Scientific/standards independent review: OPEN.
- Pedagogy/engagement independent review: OPEN.
- Technical/iPad/accessibility executed testing: OPEN.
- End-to-end student/demo executed testing: OPEN.
No publication and no >=90/100 quality claim until independently evidenced.
