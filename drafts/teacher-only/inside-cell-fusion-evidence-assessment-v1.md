# Inside the Cell — Exocytosis Evidence Lab
## Teacher-only assessment, scoring guide, and feedback master · v1.0
**INTERNAL DRAFT — NEVER SHIP IN PUBLIC STUDENT CATALOG OR SITE.** Not independently reviewed, not a published answer key. Designed for a solo asynchronous learner using the four-screen Fusion Evidence Lab and optional 40-second exocytosis video. No materials, printing, peers, audio, or adult help required.

### Target and boundaries
**Learning target:** Explain how vesicle–plasma-membrane fusion permits secreted cargo to leave a cell, and support the explanation with observations of a simplified model.

**Success criteria:** (1) distinguish docking from fusion; (2) locate cargo before/after pore opening; (3) use an observed state change as evidence; (4) connect evidence to a causal explanation rather than merely naming exocytosis.

**Science integrity:** The model is a simplified illustration of vesicle fusion. It does not resolve SNARE proteins, regulatory steps, membrane curvature, energetics, or real molecular timing. Do not teach that all vesicles always fuse, that all proteins are secreted, that docking guarantees fusion, or that cargo passes through an intact bilayer. In a cell, cargo is enclosed by a vesicle membrane before release; fusion makes the vesicle lumen continuous with extracellular space. This is exocytosis, not diffusion across an intact membrane.

### Student-facing independent assessment items
All items may be presented as one per page; keep Next visible without scrolling. Text equivalents must accompany any image or video. All multiple-choice responses receive immediate feedback; unlimited retry is allowed without replacing the initial prediction.

**1. Prediction — before observing fusion (ungraded diagnostic).** A protein-containing vesicle reaches the cell surface, but its membrane has not fused with the plasma membrane. Where is the protein cargo?
A. Inside the vesicle; B. Outside the cell.
Store the *first* response as `originalPrediction`, immutable within an attempt. Students may revise a separate `currentThinking` field after investigating. Do not score the diagnostic for correctness.

**2. Observe and discriminate (1 point).** Which observation is the best evidence that a route for release has formed?
A. The vesicle is close to the plasma membrane.
B. The two membranes are connected and an opening joins the vesicle interior to the outside.
C. The vesicle contains protein cargo.
**Key B.** A shows proximity, not a passage; C shows cargo packaging, not export. Feedback B: “Yes—fusion changes the boundary and creates a connected passage.” A: “Closeness is docking, not an opening; compare the fused state.” C: “Cargo can remain enclosed even when a vesicle is full.”

**3. Predict a counterfactual (1 point).** Suppose docking occurs but membrane fusion is prevented. What should happen to the cargo in this simplified model?
A. It remains enclosed; B. It crosses the intact plasma membrane automatically; C. It has already entered the extracellular space.
**Key A.** A: “Correct. Without fusion, this model provides no route for enclosed cargo to leave.” B: “An intact membrane does not automatically let this packaged cargo cross.” C: “Docking alone does not release cargo.”

**4. Put evidence in order (2 points).** Select the sequence that matches the model.
A. Cargo released → membranes fuse → vesicle docks.
B. Vesicle docks → membranes fuse → cargo released.
C. Membranes fuse → cargo released → vesicle docks.
**Key B.** One point for choosing B; a second point for correctly explaining that release requires a passage created by fusion. Feedback: “Docking brings membranes together; fusion opens the route; cargo then exits.” Do not award the second point for simply repeating the sequence.

**5. Explain with evidence (4 points).** “A classmate says: ‘Once the vesicle touches the plasma membrane, the protein is already outside.’ Use **two observations** from the model to explain whether that claim is supported.”
Expected response: At docking, the vesicle is touching the membrane but cargo is still enclosed; after fusion, the vesicle interior connects to the outside through an opening; only then does cargo move outside. Contact alone is not release.
Rubric (one point each): (a) identifies cargo still enclosed in docked state; (b) identifies connected passage/opening after fusion; (c) identifies cargo outside only after fusion; (d) explicitly rejects the classmate's claim with causal reasoning. Accept equivalent wording, grammar variations, speech-to-text, or accessible typing. Do not require the term SNARE, pore diameter, or memorized jargon. No automatic AI grade; teacher review for rubric points. Feedback by missing criterion: “Look again at the docked state—where is the cargo?” / “What changed in the boundary at fusion?” / “When do you first see cargo outside?” / “Explain why touching and release are not the same event.”

**6. Transfer to a new situation (2 points).** “A vesicle carrying a signaling protein docks normally. The membranes cannot merge. Predict whether the signaling protein will be released by this vesicle and explain why.”
Expected: No; in this simplified pathway, without membrane fusion there is no continuous opening for the vesicle cargo to exit. One point for no release, one for explaining the missing connection/passage. Do not penalize students for acknowledging other secretion pathways could exist; assess this vesicle in this scenario. Teacher feedback: “Link your prediction to whether the vesicle interior ever connects to the extracellular space.”

### Scoring and mastery
Items 2–6 total **10 points** (1+1+2+4+2); Item 1 is ungraded. Suggested mastery evidence: **8/10 plus at least 3/4 on Item 5**, reviewed by a teacher. This is a suggested criterion, not an enforced district passing score; support per-student thresholds and unlimited attempts. Do not expose keys/rubric point allocations to students before submission. Student-facing feedback should explain mechanisms without leaking full model answers ahead of an attempt.

### Misconception and feedback map
| Code | Observable response | Instructional response |
|---|---|---|
| M1 CONTACT_EQUALS_RELEASE | Chooses proximity as proof | Revisit docked state; point to cargo still enclosed |
| M2 CROSSES_INTACT_BILAYER | Predicts automatic transit across intact membrane | Compare closed boundary and connected passage |
| M3 FUSION_AFTER_RELEASE | Orders release before fusion | Reconstruct three states and identify first external cargo |
| M4 DESCRIPTION_NO_CAUSE | Names exocytosis without explaining mechanism | Prompt: “What changed in the boundary, and what did that allow?” |
| M5 OVERGENERALIZATION | Claims all proteins or vesicles are secreted | Clarify this is one secretory vesicle and one pathway |

### Persistence and assessment contract
Use stable item logical IDs `IC-EXO-01` through `IC-EXO-06` and immutable item version `1.0.0`; semantic changes require a new item version. Keep `originalPrediction` separate from `currentThinking`, `evidenceSelection`, `writtenExplanation`, and `attemptId`. Preserve the original response during back-navigation, replay, tab restoration, and retries; a new explicit attempt may create a new diagnostic response while retaining history. Do not store student answers in a public GitHub repository. Teacher-only key must be access-controlled in LMS and excluded from public build manifests. A local demo may show completion but must never claim an LMS grade.

### Accessibility and materials QA checklist (not yet executed)
- [ ] At 320 CSS px and iPad landscape/portrait, no horizontal overflow; Next always in fixed safe-area footer
- [ ] VoiceOver announces page title, choices, state changes, error feedback, and completion in logical order
- [ ] Keyboard and touch can operate every choice and state transition; 44 px minimum targets
- [ ] No video or audio dependency: equivalent captions, transcript, and three-state text model available
- [ ] Screen-reader accessible description explains the closed, fused, and released states
- [ ] Every task is solo asynchronous, with no purchases, printing, transport, supplies, or peer interaction
- [ ] A teacher independently reviews scientific accuracy and written rubric scoring; evidence recorded
- [ ] Student cannot access this teacher-only file through any public Pages path, manifest, import ZIP, or API

### QA release state
Content/standards: OPEN. Pedagogy/engagement: OPEN. Technical/iPad/accessibility: OPEN. End-to-end student/demo: OPEN. No independent score or publication approval. **Do not merge this teacher-only file into a public GitHub Pages branch.**
