# Physical iPhone/iPad and accessibility release protocol

**Required for every candidate lesson. Not yet executed for any approved Showcase lesson.** Chromium emulation and unit tests do not substitute for this review. Never fill in device details or pass statuses without performing the checks.

## Preconditions

Use a private staging URL with the exact SHA-256-pinned candidate package and the same catalog entry to be released. Record lesson ID/version, entry SHA-256, package SHA-256, staging URL and build commit. Use test accounts with no real student information. Verify student-facing media are original/licensed and teacher-only material is absent.

## Test matrix

| Environment | Mandatory actions | Evidence |
| --- | --- | --- |
| Physical iPhone, Safari | Portrait and landscape; load/reload; Teach → Do → Feedback → Next; check controls above fold and no horizontal overflow | Device model, iOS version, browser version, UTC time, redacted screenshots |
| Physical iPhone, Chrome | Repeat navigation, answer/replay/return, video playback and captions; note iOS browser-engine behavior | Same metadata, playback observations |
| Physical iPad, Safari | Portrait/landscape, touch controls, video, completion, reload/resume, no clipped cards or hidden Next | Device model, iPadOS version, UTC time, screenshots |
| Keyboard-only desktop | Tab order, focus visibility, Enter/Space activation, accessible modal exit and question controls | Browser/OS, screen capture or sanitized notes |
| iOS VoiceOver (actual device) | Read headings, lesson instructions, question options, feedback, captions/transcript access, and completion state | Device/OS, actual observations and issues |
| Low bandwidth / offline interruption | Pause/retry media, restore page, verify answer draft and completion behavior; no unapproved remote resources | Network scenario, observed behavior, defects |

## Per-video checks

For each actual MP4: verify initial load, play, pause, rewatch, seek backward, return to a question without losing a draft answer, captions on/off, readable synchronized captions, transcript, audible professional narration, and replay after feedback. Verify video requests succeed and do not use copyrighted competitor footage. If a video is not applicable, explain and document the approved alternative; never mark untested playback as passed.

## Pedagogy and teacher review

Check actual learning objective and standard mapping, accuracy, feedback quality, student choice and inquiry, authentic task and assessment validity. Teacher-only rubrics and keys must not appear in public assets or browser requests. Verify student-specific accommodations where applicable (video locks, time limits, attempts, SpeechStream, passing scores), without using real student data.

## Evidence and decision

1. Record every test result as **passed**, **failed**, or **not run**, with observations, tester identity and UTC timestamp. Do not substitute emulated-device results for physical tests.
2. Redact names, accounts, tokens, private URLs and student data before including a summary in a public PR. Keep raw recordings in restricted storage.
3. Record actual device model, OS version and testedAt in the technical QA JSON. Hash each referenced public evidence artifact. Verify all four gates and reviewer identities independently.
4. A failure, missing test, placeholder narration, unsynchronized captions, inaccessible navigation, or unreviewed rights clearance **blocks publication**.
5. Only after a staging re-test and explicit owner approval may the release PR be merged and the live URL verified.

This protocol documents acceptance criteria only. It is not evidence that any physical-device review has occurred.


### Physical Safari evidence contract (2026-11-01)
For the technical QA report's `iphone` and `ipad` checks, provide
`testMethod: "physical_device"`, `browserName: "Safari"`, an actual
`deviceModel` identifying the correct device family, `osVersion` in
`iOS 18.0` or `iPadOS 18.0` form (use the version actually tested), and
UTC `testedAt` no later than technical signoff. Emulator/Chromium/Playwright
labels and missing/mismatched metadata fail catalog validation. Record
independently reviewable redacted screenshots and actual test steps separately.
These strings are **self-reported** and do not authenticate a physical device,
tester, OS, browser, screenshot, or accessibility result. CI Chromium remains
precautionary browser coverage, not physical Safari evidence.
