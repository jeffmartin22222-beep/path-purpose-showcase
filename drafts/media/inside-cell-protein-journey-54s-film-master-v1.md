# INSIDE THE CELL — From DNA Instructions to a Working Protein
**Internal production master v1 | 54 seconds | DRAFT — DO NOT PUBLISH**

## Learning target and evidence
I can explain how DNA instructions are copied into messenger RNA, read by a ribosome, and used to assemble a protein. I can distinguish the nucleus, nuclear pore, cytoplasm, ribosome, and rough ER without claiming that DNA itself leaves the nucleus. This is a deliberately simplified eukaryotic-cell model; not every protein is made on the rough ER.

## Film: original timed storyboard and voice-over
| Time | On-screen action, accurately animated | Original narration | On-screen caption |
|---|---|---|---|
| 0–6 s | Cross-section of a eukaryotic cell. Nucleus and cytoplasm labeled. DNA stays in nucleus. | "A cell needs proteins to build, move, and respond. But where do the instructions begin?" | Where do protein instructions begin? |
| 6–13 s | Zoom to a DNA gene in the nucleus. RNA polymerase traces one DNA template strand; a complementary single-stranded RNA transcript appears. No DNA strand exits. | "Inside the nucleus, a gene in DNA is copied into an RNA message." | DNA gene → RNA message |
| 13–19 s | RNA is processed in a subtle, clearly labeled 'simplified processing' beat; mature mRNA passes through a nuclear pore. DNA remains fixed. | "After processing, messenger RNA travels through a nuclear pore. The DNA stays inside." | mRNA exits; DNA stays |
| 19–26 s | mRNA approaches a free cytoplasmic ribosome. Three-base codon bracket; incoming tRNA carrying amino acid. | "A ribosome reads the message in three-letter groups, called codons." | Ribosome reads mRNA codons |
| 26–32 s | Ribosome adds amino acids to a growing chain; tRNAs arrive and depart. Do not show codons as amino acids themselves. | "Transfer RNAs bring amino acids. The ribosome joins them in the instructed order." | Amino acids join into a chain |
| 32–38 s | Freeze with two routes: free ribosome → cytosolic protein; ER-bound ribosome → protein entering ER. Ask checkpoint. | "Pause and predict: Does every protein have to enter the rough ER?" | PREDICT: Must every protein enter the rough ER? |
| 38–47 s | Prediction stored. Free ribosome releases cytosolic protein; second ribosome is shown docked at rough ER and nascent chain enters ER through translocon. | "No. Some proteins are made on free ribosomes. Others are directed to the rough ER while they are being made." | Free ribosome ≠ rough ER route |
| 47–54 s | Side-by-side: DNA nucleus, mRNA pore, ribosome, protein; arrows show information flow, not DNA movement. | "The key pathway is DNA instructions, RNA message, ribosome, then protein. Which structure actually builds the chain?" | DNA → mRNA → ribosome → protein |

## Captions — production WebVTT
```vtt
WEBVTT

00:00:00.000 --> 00:00:06.000
A cell needs proteins to build, move, and respond. But where do the instructions begin?

00:00:06.000 --> 00:00:13.000
Inside the nucleus, a gene in DNA is copied into an RNA message.

00:00:13.000 --> 00:00:19.000
After processing, messenger RNA travels through a nuclear pore. The DNA stays inside.

00:00:19.000 --> 00:00:26.000
A ribosome reads the message in three-letter groups, called codons.

00:00:26.000 --> 00:00:32.000
Transfer RNAs bring amino acids. The ribosome joins them in the instructed order.

00:00:32.000 --> 00:00:38.000
Pause and predict: Does every protein have to enter the rough ER?

00:00:38.000 --> 00:00:47.000
No. Some proteins are made on free ribosomes. Others are directed to the rough ER while they are being made.

00:00:47.000 --> 00:00:54.000
The key pathway is DNA instructions, RNA message, ribosome, then protein. Which structure actually builds the chain?
```

## Scientific animation contract — reject render if violated
1. DNA remains inside the nucleus throughout; mRNA, not DNA, crosses a nuclear pore.
2. Transcription uses RNA polymerase and a DNA template; RNA is single-stranded. Simplify RNA processing only with explicit "simplified" labeling.
3. Ribosome translates mRNA; tRNA brings amino acids. Ribosomes do **not** manufacture amino acids.
4. Free ribosomes synthesize many cytosolic proteins; ER-targeted nascent chains are cotranslationally delivered to rough ER. Do not imply all proteins enter ER.
5. Depict protein as amino-acid chain; folding may be mentioned but must not imply every chain is immediately functional.
6. Labels and arrows stay legible on 375px viewport; animation never substitutes motion for scientific meaning.
7. Avoid a false implication that a nuclear pore is a simple open hole without selectivity; show a labeled nuclear pore complex.

## Student player, five paged screens (no page scroll)
**1 — Predict (before video).** "Which structure uses the RNA message to assemble a protein?" Choices nucleus / ribosome / nuclear pore. Save immutable `prediction.original` with timestamp; retry changes only `prediction.revised`. Next always visible, enabled after choice.
**2 — Watch and pause.** 54-second video with captions on by default, transcript, replay, keyboard play/pause, 10-second seek, and audio description. At 32s pause and ask "Does every protein enter rough ER? Yes/No + why?" Preserve response; show explanation only after submission.
**3 — Trace the evidence.** Drag or keyboard-select four evidence cards into order: (a) DNA gene copied in nucleus; (b) mRNA passes pore; (c) ribosome reads codons; (d) amino acids joined. Provide explicit accessible up/down controls; feedback explains why each adjacent step follows.
**4 — Test two routes.** Tap Free Ribosome or Rough ER Ribosome; each displays a scientifically distinct, annotated animation with text equivalent. Require both views before Next. Ask "What stays the same and what differs?" Save two observations, not just a visit flag.
**5 — Explain and reflect.** Claim: "The ribosome, not the nucleus, assembles the amino-acid chain." Cite evidence from screen 3 and compare two routes from screen 4. Display original prediction unedited beside revised explanation. Completion persists on reload; do not return to start.

## Immediate feedback
- "DNA leaves the nucleus": "Look for the molecule moving through the nuclear pore. The DNA stays inside; the mRNA carries a copy."
- "Nuclear pore builds protein": "The pore transports the message. Which structure reads its codons and joins amino acids?"
- "All proteins go to rough ER": "Compare the two routes. A free ribosome can finish a protein for use in the cytosol."
- "Ribosome makes amino acids": "The ribosome joins amino acids delivered by tRNAs; it does not create the amino acids."

## Teacher-only answer key (exclude from student bundle)
Screen 1: ribosome. Checkpoint: No; free ribosomes can make cytosolic proteins, while ER-targeted proteins are synthesized at ER-bound ribosomes. Screen 3 order a → b → c → d. Screen 4: both use mRNA, ribosomes, tRNAs, and amino acids; ER-bound route translocates selected nascent proteins into ER, free route can release protein into cytosol.
**10-point evidence rubric:** 2 accurate nucleus-to-mRNA account; 2 nuclear pore/mRNA vs DNA distinction; 2 ribosome/tRNA/chain mechanism; 2 comparison of free vs ER-bound route; 2 original-prediction reflection supported by two specific observations. Do not grade mere length or keyword presence as proof.

## Accessible and equitable implementation acceptance
- Entire required path solo, asynchronous, free, no equipment or printing; no outside links.
- One-screen-at-a-time with fixed visible Back/Next footer, content area adapted to fit viewport without document scrolling; large touch targets; zoom/reflow at 200% may use internal panel scroll only where unavoidable, with navigation still reachable.
- Captions, downloadable text transcript in LMS, reduced-motion mode, no color-only cues, semantic focus order, screen-reader announcements only for meaningful state changes, keyboard-only alternate to dragging.
- Persist original prediction, checkpoint response, both route observations, and final explanation separately across reload and back navigation.
- A failed media load opens equivalent accessible illustrated/text lesson with the same assessment and no grading penalty.
- Keep teacher rubric access server-authorized; do not hide it only with CSS.

## Four independent QA gates (all OPEN)
1. Content/standards: independent biology expert validates transcription/translation, routes, and age-level accuracy.
2. Pedagogy: independent reviewer tests prediction → evidence → explanation and misconception feedback.
3. Technical/iPad/accessibility: real Safari/iPad and keyboard/VoiceOver tests; caption timing; offline/media failure; persistence; visible Next.
4. End-to-end student/demo: independent learner completes both routes, reloads, and submits evidence-backed response without external help.
**Release policy:** internal draft only; no score ≥90/100 claimed; no production publishing until all four pass.
