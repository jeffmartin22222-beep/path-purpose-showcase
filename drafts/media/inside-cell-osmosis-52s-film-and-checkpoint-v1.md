# Inside the Cell | Osmosis: Water Moves Both Ways
**Status:** INTERNAL DRAFT — NOT PUBLISHED | **Runtime:** 52 seconds | **Audience:** secondary Biology | **Media:** original narrated animation, not rendered
**Linked investigation:** `drafts/inside-cell-osmosis-prediction-lab-v1.html`

## Learning target
I can predict the direction of **net** water movement across a selectively permeable membrane and justify my claim with the relative concentration of **nonpenetrating solute** on each side. I can explain why water still moves in both directions when there is no net movement.

## Scientific model contract (animation must obey)
- Two compartments separated by a selectively permeable membrane. Water crosses; depicted solute particles do not. Keep equal compartment volumes for the brief conceptual comparison; explicitly label the animation a *simplified model*, not a quantitative cell-volume prediction.
- Depict **both directions** of individual water crossings in every state. Use visibly unequal crossing counts over the same time interval for unequal effective solute concentrations; equal crossing counts for equal concentrations. No one-way water arrows.
- For this introductory model, assume equal temperature and pressure and nonpenetrating solutes. Higher nonpenetrating solute concentration corresponds to lower water potential; net water movement is toward that side. Do not claim all solutes are impermeable or that concentration alone predicts movement in all real physiological settings.
- At equal effective solute concentrations, individual water molecules continue moving, but **net** water transfer is zero. Do not animate molecules freezing.
- The displayed dots represent illustrative particles, **not** a molecularly accurate scale or measured experimental data. Avoid labeling a direction as ATP-driven; osmosis is passive.
- In an actual cell, water transfer may change cell volume, and membrane permeability/solute behavior matter. Do not depict inevitable bursting or shrinking.

## Timecoded original film storyboard and narration
| Time | Visual / motion | Exact narration | On-screen text |
|---|---|---|---|
| 00:00–00:06 | Close view of membrane with blue water dots crossing in both directions; orange solute dots stay on their side. | “Water is moving across this membrane in both directions, even when you cannot see a change.” | “Water crosses • solute stays” |
| 00:06–00:13 | Split screen: left 2 solute symbols, right 8. Both sides have water crossing; show 3 crossings L→R and 1 R→L within an explicitly illustrative interval. | “In our simplified model, the right side has more solute that cannot cross.” | “Higher nonpenetrating solute: RIGHT” |
| 00:13–00:20 | Pause on side-by-side compartments; water paths fade; large prediction overlay. | “Predict: which way will water move overall? Keep your first answer—we will test it.” | “PAUSE & PREDICT: Net water movement? Left / Right / None” |
| 00:20–00:29 | Resume same illustrative time interval, water crosses both ways; a net counter shows +2 toward right. Keep particle positions stable enough to avoid implying exact kinetics. | “Water still crosses both ways. But more crosses toward the side with more nonpenetrating solute, so net water movement is right.” | “Both directions • Net: RIGHT” |
| 00:29–00:37 | Reverse concentration arrangement: left 8, right 2; animate bidirectional crossings, net left. | “Switch the solute pattern, and the net direction reverses. Osmosis is passive—no ATP pump is driving the water.” | “Net: LEFT • Passive” |
| 00:37–00:45 | Equal 5:5 solute patterns; equal water crossings each way. Display 2→ and 2← as illustrative counts. | “Now the effective solute concentrations match. Water keeps crossing both ways, but there is no net movement.” | “Equal concentrations ≠ stopped water” |
| 00:45–00:52 | Return to original split screen, prediction card stays visible with locked first response; prompt for written reasoning. | “Compare your first prediction with the evidence. Explain the net direction—and why some water still travels the other way.” | “CLAIM + TWO OBSERVATIONS + REASONING” |

## Synchronized WebVTT captions
```vtt
WEBVTT

00:00:00.000 --> 00:00:06.000
Water is moving across this membrane in both directions,
even when you cannot see a change.

00:00:06.000 --> 00:00:13.000
In our simplified model, the right side has
more solute that cannot cross.

00:00:13.000 --> 00:00:20.000
Predict: which way will water move overall?
Keep your first answer—we will test it.

00:00:20.000 --> 00:00:29.000
Water still crosses both ways. But more crosses toward
the side with more nonpenetrating solute, so net water movement is right.

00:00:29.000 --> 00:00:37.000
Switch the solute pattern, and the net direction reverses.
Osmosis is passive—no ATP pump is driving the water.

00:00:37.000 --> 00:00:45.000
Now the effective solute concentrations match.
Water keeps crossing both ways, but there is no net movement.

00:00:45.000 --> 00:00:52.000
Compare your first prediction with the evidence.
Explain the net direction—and why some water still travels the other way.
```

## Student experience: Teach → Predict → Test → Explain → Reflect
**Screen 1, Teach:** Play/pause/rewatch with captions on by default; full transcript and static equivalent available within the screen. Present target and a simple membrane key. Sticky bottom Next button visible without document scrolling.

**Screen 2, Predict (pause at 00:13):** Student chooses Left / Right / No net movement, then submits one sentence explaining why. Save `prediction_original` and `prediction_reason_original` **once**. Do not overwrite on replay or retry. Next enabled only after first submission; unlimited retries elsewhere.

**Screen 3, Test:** Students toggle three independently labeled conditions: right higher (2:8), left higher (8:2), equal (5:5). For each, they see crossings in both directions and a *net* direction label. Require examination of both unequal conditions and equal condition; record observed states, not just clicks. Display “2:8” as **illustrative relative solute units**, not measured concentrations.

**Screen 4, Explain:** Require a claim about net movement for the 2:8 condition, two concrete observations (one from 2:8 and one from 5:5), and reasoning linking concentration differences to unequal bidirectional crossings. Feedback addresses common errors: “water only moves one way,” “equal means no water moves,” “ATP is required,” and “water moves toward lower solute.” Do not use keyword count as a scientific correctness grade; route to teacher review or a validated scoring engine.

**Screen 5, Reflect:** Display immutable original prediction side-by-side with final explanation. Ask “What did the equal-concentration case change or confirm about your thinking?” Completion screen stays visible, with Rewatch and Finish controls, no forced redirect.

## Feedback examples
- “You selected no net movement for 2:8. Watch the crossings again: both directions occur, but the right side receives more in the same interval. Try your net-direction claim again.”
- “You said water stops at equal concentrations. Count the arrows: the movements balance, but individual molecules still cross.”
- “You cited the 2:8 case. Add the equal case to show you can distinguish **net movement** from **all movement**.”

## Teacher-only key and rubric — must never be bundled in student-visible HTML
**Correct 2:8:** net right. **8:2:** net left. **5:5:** no net movement, with water still moving both directions. Valid explanation: the simplified selectively permeable membrane allows water but not the depicted solute through; unequal concentrations yield unequal *net* water transfer toward higher nonpenetrating solute; individual movement remains bidirectional.

**8-point rubric:** claim/direction across both unequal cases (0–2); accurately describes evidence from unequal and equal conditions (0–2); explains selectively permeable membrane and passive osmosis without implying one-way flow (0–2); distinguishes dynamic equilibrium from stopped molecular movement and thoughtfully revisits original prediction (0–2). Accept equivalent wording and accessible alternative response modalities. No automatic correctness credit based only on word matching.

## Accessibility and production acceptance
- Deliver MP4 (H.264/AAC), VTT, plain-text descriptive transcript, poster frame, seven inspection stills, and a machine-readable timing manifest. Do not assert render success until files exist and decode/play successfully.
- Audio describes essential visuals; never rely on color alone. Distinguish sides using LEFT/RIGHT labels, shape and text. Avoid flashing and unnecessary particle motion; offer reduced-motion/static frame sequence.
- Keyboard, touch, VoiceOver and screen-reader focus order must work; pause/rewatch/seek and caption controls accessible. Prediction prompt must pause automatically **once** and must not reset the original answer on rewatch.
- Test at 320px phone width and iPad portrait/landscape: one paged screen at a time, no page-level vertical scrolling, bottom Next always visible, text resizes without clipping; transcript scrolls *inside* a bounded accessible region if necessary.
- On reload, persist prediction, visited conditions, explanation draft, and final completion; never duplicate the submission control across screens. Teacher-only material is served under separate authorization.
- Required experience is fully solo, asynchronous, no purchases, no printing, no lab materials, and no external student links.

## Independent four-gate release record (all OPEN)
1. **Science/standards:** independent biology reviewer validates water potential simplification, dynamic equilibrium, terminology, and relevant standards mapping.
2. **Pedagogy/engagement:** independent reviewer tests prediction retention, meaningful manipulation, feedback, transfer and rubric.
3. **Technical/mobile/accessibility:** executed browser + physical iPad playback and VoiceOver/keyboard/reduced-motion checks, including media decoding and persistence.
4. **End-to-end student/demo:** fresh student account completes all five screens with teacher-only key inaccessible; verify completion remains on final screen.
**Publication prohibition:** no live publishing until all four signed and independently scored at least 90/100.
