# Inside the Cell — Secretion pathway playable media v1 (internal draft)

A 46-second original animated MP4 with synthetic English narration was rendered on 2026-11-04. It visualizes rough ER → transport vesicle → Golgi → secretory vesicle → plasma membrane fusion and extracellular cargo. **Actual media files are attached to the automation run, not committed to this repository.**

## Integration contract
- Media: `/mnt/data/inside_cell_secretion_v1/secretion.mp4` (46.000 s, 960×540, H.264/AAC)
- Narration: `/mnt/data/inside_cell_secretion_v1/narration.wav` (40.404 s, synthetic voice)
- Transcript: `/mnt/data/inside_cell_secretion_v1/transcript.txt`
- Provisional scene-level VTT: `/mnt/data/inside_cell_secretion_v1/captions.vtt` **NOT approved for caption QA**; scene paraphrases do not exactly match spoken narration and are not word-synchronized.
- Source generator: `/mnt/data/inside_cell_secretion_v1/build.py`

## Known issues and blocking criteria
1. Narration/captions must be aligned verbatim and tested; do not advertise this VTT as accessible synchronized captions.
2. Scientific animation is schematic and lacks visually explicit ER budding, Golgi entry, and correct membrane-topology transformation; requires scientific review and refinement.
3. Playback and persistence in an authenticated enrolled-student LMS flow are not implemented or tested.
4. Independent content, pedagogy, iPad/accessibility, and end-to-end QA plus score >=90/100 remain open. Do not publish.

## Render verification
`ffmpeg` completed with exit code 0. `ffprobe` returned 46.000 seconds and 1,037,899 bytes for MP4. Narration duration 40.404444 seconds. No iPad test claimed.
