# Phase 7: OSMD Production Score Rendering - Research

**Researched:** 2026-05-15
**Status:** Ready for detailed planning

## Research Question

How should the app move from the Phase 6 OSMD proof to production MusicXML rendering that looks and behaves like a real score page while preserving playback, range selection, auto-follow, and future note click APIs?

## Findings

### 1. Phase 6 Did Not Replace The Production Renderer

The important current code path is:

- `index.html` imports `renderMusicXmlScore()` from `js/musicXmlScoreRenderer.js`.
- `drawStaffNotation()` calls `renderMusicXmlScore()` when `currentPatternSequence.sourceType === "musicxml"`.
- `js/musicXmlScoreRenderer.js` still delegates to `drawStaffNotation()` in `js/staffNotationRenderer.js`.

So the user's observation is correct: OSMD is installed and proven, but the imported-score UI still uses the older VexFlow reconstruction unless tests call the Phase 6 facade directly.

Planning implication: Phase 7 must be a production wiring and contract hardening phase, not another renderer evaluation.

### 2. OSMD Supports The Required Production Building Blocks

OSMD's `OpenSheetMusicDisplay` class can load MusicXML from string, document, blob, or URL and render the loaded sheet to the container. Its options include SVG backend, page format, auto-resize control, credits/title/composer drawing, XML-driven system/page breaks, measure numbers, and cursor options. OSMD also exposes `Sheet`, `GraphicSheet`, `EngravingRules`, `cursor`, and `Zoom`.

Relevant local type observations from `opensheetmusicdisplay@1.9.9`:

- `IOSMDOptions` includes `drawCredits`, `drawTitle`, `drawSubtitle`, `drawComposer`, `useXMLMeasureNumbers`, `pageFormat`, `newSystemFromXML`, and `newPageFromXML`.
- `OpenSheetMusicDisplay` exposes `load()`, `render()`, `clear()`, `setOptions()`, `renderAndScrollBack()`, `setPageFormat()`, and `Zoom`.
- `Cursor` exposes `NotesUnderCursor()` and `GNotesUnderCursor()`.
- `MusicPartManagerIterator` exposes current timestamp, measure index, current voice entries, and movement through the score.
- `Note` exposes `SourceMeasure`, `ParentVoiceEntry`, and `NoteToGraphicalNoteObjectId`.
- `SourceMeasure` exposes `measureListIndex`, `MeasureNumberXML`, `MeasureNumberPrinted`, `printNewSystemXml`, `printNewPageXml`, and `ImplicitMeasure`.

Planning implication: the renderer facade should use OSMD's internal source/graphical structures for mapping where possible, and only use raw SVG selectors as the last step for DOM mutation and hit targets.

Sources:

- OSMD class docs: https://opensheetmusicdisplay.github.io/classdoc/classes/OpenSheetMusicDisplay.html
- OSMD getting started: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started
- OSMD GraphicalMusicSheet docs: https://opensheetmusicdisplay.github.io/classdoc/classes/GraphicalMusicSheet.html
- OSMD GraphicalNote docs: https://opensheetmusicdisplay.github.io/classdoc/classes/GraphicalNote.html
- OSMD timing tutorial: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Tutorial---Extracting-note-timing-for-playing

### 3. MusicXML Page Fidelity Is More Than Notes

MusicXML represents page and system intent through `<defaults>`, `<page-layout>`, `<print>`, and `<credit>`.

Important details:

- `<defaults>` can define score-wide scaling, page layout, system layout, staff layout, and fonts.
- `<page-layout>` can appear in score defaults or a print element and defines page height, width, and margins.
- `<print>` carries page/system/staff layout for the current page/system/staff and attributes such as `new-page` and `new-system`.
- `<credit>` represents title, composer, arranger, copyright, dedication, and other page text/graphics before the music.
- An implicit measure should not display a measure number.

Planning implication: Phase 7 tests should assert credits/titles and page containers, and the integration should configure OSMD to respect XML page/system cues. The app should not flatten this into its own measure flow.

Sources:

- MusicXML `<defaults>`: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/defaults/
- MusicXML `<page-layout>`: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/page-layout/
- MusicXML `<print>`: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/print/
- MusicXML `<credit>`: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/credit/
- MusicXML implicit measure attribute: https://usermanuals.musicxml.com/MusicXML/Content/AT-MusicXML-implicit.htm

### 4. The Hard Part Is The Interaction Bridge

OSMD can render the score far more faithfully than the app-owned reconstruction. But the app's learning value still depends on the existing contracts:

- Playback highlights current notes on the score and keyboard.
- Range selection loops selected measures.
- Start positions and auto-follow use measure indices.
- Future score interactions need click targets.

The current Phase 6 facade has the right shape, but its production mapping is not yet robust:

- Note IDs default to `osmd-event-N`, not canonical event IDs.
- Timing entries are placeholders.
- Measure metadata is inferred from DOM dataset values that OSMD may not provide.

Recommended mapping strategy:

1. Build a canonical MusicXML event signature list from `sequence.events`: measure index, source order, pitch/rest/chord content, voice/staff if available, duration, and beat.
2. Build an OSMD event list from source notes/voice entries/cursor iteration, preserving SourceMeasure index, timestamp, staff/voice, pitch/rest/chord grouping, and graphical note references.
3. Join the two lists deterministically.
4. If ambiguity remains, inject stable IDs into MusicXML notes before OSMD load using XML preprocessing, then recover those IDs from OSMD source notes or DOM where possible.
5. Reject or warn on unreliable mappings instead of silently highlighting the wrong note.

Planning implication: the first production plan can switch page rendering; the second must harden mapping and all interaction tests before the phase is complete.

### 5. Fixture Strategy Should Move From Proof To Gates

Phase 6 already added a curated fixture manifest based on `cuthbertLab/musicxmlTestSuite` and LilyPond coverage categories.

The LilyPond collated suite explains that its files are hand-crafted to check one particular MusicXML aspect and are categorized into basics, staff attributes, notes/chords, notations/articulations, parts/multi-voice, repeat/measure issues, page issues, positioning, lyrics, instruments, MIDI, and compatibility/broken files. The suite is MIT licensed if the notice/license is kept.

For Phase 7, hard gates should stay scoped to app-critical cases:

- Real app import of a MuseScore `.mxl` file when available.
- Page layout and credits.
- Chords with three notes.
- Multi-voice backup/forward timing.
- Directions/text rendered in score.
- Compressed `.mxl` extraction and rendering.
- Range selection, playback highlight, and auto-follow on OSMD output.

Planning implication: do not turn the entire external suite into a hard pass gate yet. Use the manifest tiers and add production app UI smoke tests.

Sources:

- LilyPond collated MusicXML suite: https://lilypond.org/doc/v2.25/input/regression/musicxml/collated-files.html
- music21 cuthbertLab suite note: https://music21.org/music21docs/moduleReference/moduleMusicxmlLilypondTestSuite.html

## Recommended Phase Shape

### Plan 07-01: Production OSMD Renderer And Page Fidelity

Replace `js/musicXmlScoreRenderer.js` internals with the OSMD facade, configure page/credit rendering, adapt CSS for page scaling/notestand layout, and update smoke tests so imported scores in the actual app render through OSMD.

Hard gate: imported scores produce OSMD page SVGs, title/credit text where present, no old app-owned MusicXML reflow, and the local MuseScore `.mxl` renders cleanly when present.

### Plan 07-02: Canonical Interaction Bridge And Practice Regression

Harden canonical event to OSMD note/measure mapping, preserve `eventMap` and `measureMap` contracts, support highlighting/range/auto-follow on OSMD output, and add regression coverage for chords, voices, range looping, start positions, and cleanup.

Hard gate: playback highlights the same notes the player schedules, range selection maps to actual OSMD measures, and no known app-critical fixture silently maps to the wrong visual target.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OSMD cannot render an advanced MusicXML feature exactly like MuseScore Studio | Medium to high | Classify as OSMD limitation or future Verovio trigger; do not hide as app success. |
| Canonical playback events cannot be reliably joined to OSMD notes | High | Add source-ID injection or cursor-derived mapping before accepting the plan. |
| OSMD DOM class names are not stable enough | Medium | Prefer OSMD source/graphical objects for mapping; only use DOM classes for final hit targets and mutation. |
| Page scaling makes click coordinates or scroll behavior wrong | Medium | Smoke range selection and auto-follow after scaling, not before. |
| Large scores render slowly | Medium | Track render timing in smoke and document future performance work. |

## Recommendation

Proceed with Phase 7 as two execution plans. Wire OSMD into production first, then harden the canonical interaction bridge before declaring the phase complete. Keep Verovio as a documented fallback only if OSMD fails critical user-visible page fidelity or addressability gates.

## RESEARCH COMPLETE
