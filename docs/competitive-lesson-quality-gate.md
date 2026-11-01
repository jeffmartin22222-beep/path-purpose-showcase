# Per-lesson competitive quality gate (proposed implementation contract)

**Status:** specification; not yet wired to publishing. Related issues #3–#7.

## Required lesson evidence
Store a versioned `benchmark.json` per lesson with lesson_id, content_version, date, reviewer, reference URLs and access type, category scores, rubric notes, gaps, remediation, four QA gate statuses and approval. Never fabricate comparison results. Competitor marketing descriptions are labeled as such, not hands-on evidence.

## Scoring / pass criteria
Visual 15, videos 15, meaningful interactives 20, independent student-centered learning 15, academic rigor 15, navigation/accessibility 10, feedback/assessment 10. Target >=90/100, with human reviewer sign-off and no critical weakness. Subject.com is the **minimum comparison reference** where comparable evidence is available, not an automatically verified quality floor.

## Hard gates
- Solo, asynchronous, no peers, live meetings or peer-dependent progression.
- No purchased/household supplies, printer, outside access, travel or parent assistance required. Only school device + internet.
- Interactive/video content has equivalent printable lesson/unit/course representation; student exports never contain teacher keys.
- All four QA checks pass: standards/content; engagement/pedagogy; technical/mobile/accessibility; end-to-end student/demo.
- Drafts never auto-publish. A failed or unknown gate blocks publication.

## Implementation
1. Curriculum builder generates benchmark evidence and lesson artifacts.
2. Reviewer verifies comparisons, quality and instructional accuracy; requests revisions.
3. CI validates evidence schema, total scoring, thresholds, gate statuses, version match, export coverage, and tests.
4. Publisher checks approved artifact version and all gates **server-side**, not just a UI badge.
5. Pilot on Inside the Cell, Grade 8 Math, one ELA/SS lesson; then enforce for every lesson.
6. Record competitor reference date and refresh benchmarks periodically as products change.

No proprietary competitor content should be copied without permission.
