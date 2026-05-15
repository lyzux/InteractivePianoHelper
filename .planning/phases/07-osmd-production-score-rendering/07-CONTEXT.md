# Phase 7: OSMD Production Score Rendering - Context

**Gathered:** 2026-05-15
**Status:** Ready for detailed planning

<domain>

## Phase Boundary

Phase 7 promotes the Phase 6 OSMD facade from proof to production for imported MusicXML score display.

The phase must replace the old MusicXML VexFlow reconstruction used by `renderMusicXmlScore()` with OSMD-backed page rendering, while preserving the app's existing playback, keyboard highlight, practice range, start position, auto-follow, and imported-score library behavior.

The target user-visible result is a MuseScore-like page view for MusicXML files: full score pages, title/credit rendering, encoded page/system behavior where available, chords and voices visually intact, and no measure reflow invented by the app.

</domain>

<decisions>

## Implementation Decisions

### Renderer Integration
- **D-07-01:** Imported MusicXML display must use the OSMD-backed professional renderer facade in production.
- **D-07-02:** The old app-owned VexFlow reconstruction must not be the normal imported-score path after this phase.
- **D-07-03:** Built-in short patterns remain on the existing staff renderer.
- **D-07-04:** Renderer output must be page-based SVG/DOM, not canvas or bitmap-only output.

### Page Fidelity And Scaling
- **D-07-05:** Render MusicXML as score pages and preserve XML page/system directives where OSMD supports them.
- **D-07-06:** Enable title/credit/composer/subtitle rendering by default for imported scores.
- **D-07-07:** The app must scale the rendered OSMD page containers to fit the notestand viewport instead of reflowing the score into new app-owned measures.
- **D-07-08:** Wide screens should show two pages side by side; small screens may show one page per row with vertical scrolling.

### Interaction Bridge
- **D-07-09:** Playback highlighting must continue to address canonical event IDs from the current player.
- **D-07-10:** Range selection, start position, and auto-follow must work against OSMD-rendered measures.
- **D-07-11:** Plain note/measure click space should remain available for future score interactions; range selection keeps the explicit Range mode and Shift-click behavior.
- **D-07-12:** If canonical-to-OSMD note mapping is not reliable by direct DOM inspection, the implementation should add stable source IDs before OSMD load or use OSMD cursor/graphical-note structures.

### Test And Acceptance Strategy
- **D-07-13:** The user's local MuseScore `.mxl` sample at `/home/mel/Documents/MuseScore4/Scores/mel_test.mxl` is a critical optional fixture: tests should run it when present and skip cleanly otherwise.
- **D-07-14:** Curated cuthbertLab fixtures stay tiered. Hard gates focus on piano layout, voices/chords, directions/credits, compressed `.mxl`, addressability, and playback mapping.
- **D-07-15:** No full SVG snapshots as primary tests. Prefer DOM contracts, page/measure/note counts, text/credit presence, highlight/range behavior, and targeted screenshot/manual evidence for visual sanity.
- **D-07-16:** Any renderer fidelity gap must be classified as app bug, unsupported MusicXML import, OSMD limitation, or future Verovio/fallback trigger.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` - Core value, constraints, and professional MusicXML frontier.
- `.planning/REQUIREMENTS.md` - Requirement IDs including Phase 7 production rendering requirements.
- `.planning/ROADMAP.md` - Phase 7 goal, success criteria, dependencies, and plan split.
- `.planning/STATE.md` - Current phase state and resume point.
- `CLAUDE.md` - Static serving and project-specific workflow notes.

### Phase 6 Evidence
- `.planning/phases/06-professional-musicxml-renderer/06-CONTEXT.md` - Renderer decision context.
- `.planning/phases/06-professional-musicxml-renderer/06-RESEARCH.md` - OSMD, Verovio, VexFlow, and fixture-suite research.
- `.planning/phases/06-professional-musicxml-renderer/06-01-PLAN.md` - Facade proof plan and acceptance criteria.
- `.planning/phases/06-professional-musicxml-renderer/06-01-SUMMARY.md` - Completed OSMD proof, commits, and verification.
- `docs/PHASE6-RENDERER-DECISION.md` - OSMD selected, Verovio retained as fallback, current VexFlow reconstruction blocked for full MusicXML.

### Current Code Touchpoints
- `index.html` - App boot, dynamic imports, current `renderMusicXmlScore()` call, playback highlight wiring.
- `js/musicXmlScoreRenderer.js` - Current production imported-score facade that still calls the simplified VexFlow renderer.
- `js/professionalMusicXmlRenderer.js` - Phase 6 OSMD facade prototype and public contract.
- `js/musicXmlFileReader.js` - `.xml`, `.musicxml`, and `.mxl` file reading.
- `js/musicXmlParser.js` - Strict parse and validation path.
- `js/musicXmlCanonicalAdapter.js` - Current playback source for imported MusicXML.
- `js/player.js` - Canonical playback and range loop behavior.
- `js/practiceRangeController.js` - Measure hit target and range selection contract.
- `js/autoFollowController.js` - Measure-based scroll following.
- `tests/professionalMusicXmlRenderer.test.js` - Facade and fixture manifest tests.
- `tests/browser-smoke/professionalMusicXmlRenderer.test.js` - OSMD proof and local MuseScore sample smoke.
- `tests/browser-smoke/musicXmlImportPractice.test.js` - Current production import/practice behavior.
- `tests/browser-smoke/musicXmlImportUi.test.js` - Current import UI behavior.
- `tests/fixtures/musicxml-suite/MANIFEST.json` - Curated fixture tiers.

### External Sources
- OSMD class docs: `https://opensheetmusicdisplay.github.io/classdoc/classes/OpenSheetMusicDisplay.html`
- OSMD getting started: `https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started`
- OSMD timing tutorial: `https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Tutorial---Extracting-note-timing-for-playing`
- OSMD GraphicalMusicSheet docs: `https://opensheetmusicdisplay.github.io/classdoc/classes/GraphicalMusicSheet.html`
- OSMD GraphicalNote docs: `https://opensheetmusicdisplay.github.io/classdoc/classes/GraphicalNote.html`
- MusicXML print element: `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/print/`
- MusicXML page-layout element: `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/page-layout/`
- MusicXML credit element: `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/credit/`
- LilyPond MusicXML test suite reference: `https://lilypond.org/doc/v2.25/input/regression/musicxml/collated-files.html`

</canonical_refs>

<code_context>

## Current Code Insights

### What Is Already Proven
- `opensheetmusicdisplay@1.9.9` is installed and smoke tested.
- OSMD can render a multi-page fixture as SVG page containers.
- OSMD can render the user's local MuseScore `.mxl` sample when present.
- OSMD output exposes `g.vf-measure` and `g.vf-stavenote` groups in the Phase 6 proof.
- The facade exposes load/render/destroy, pages, maps, highlighting, range, click callbacks, and playback timeline placeholders.

### Current Production Gap
- `index.html` imports `renderMusicXmlScore()` from `js/musicXmlScoreRenderer.js`.
- `js/musicXmlScoreRenderer.js` still calls `drawStaffNotation()` from `js/staffNotationRenderer.js`.
- Production imported scores therefore still use the simplified VexFlow reconstruction and lose MusicXML page/credit/voice fidelity.

### Contract Risks
- `practiceRangeController` currently expects `.score-measure-hit-target` elements with `data-measure-index`.
- `autoFollowController` expects `notationMaps.measureMap.get(event.measureIndex).element`.
- `highlightNotationNote()` expects `currentNotationMaps.eventMap.get(eventId)` to return SVG elements and applies class `vf-note-highlight`.
- Phase 6 facade currently assigns generic `osmd-event-*` IDs and null timing placeholders, so production mapping must be hardened before playback highlighting can be considered correct.

</code_context>

<specifics>

## Specific Ideas

- Keep `renderMusicXmlScore()` as the public production entry point, but delegate to `createProfessionalMusicXmlRenderer()`.
- Store the active professional renderer instance so re-render and cleanup can destroy OSMD output cleanly.
- Add a bridge that returns the same app-level map shape as before: `{ eventMap, measureMap, pages, sequence, renderer }`.
- Add compatibility classes/data attributes to OSMD DOM groups so existing range and auto-follow controllers need minimal changes.
- Improve `ProfessionalMusicXmlRenderer` mapping to derive measure metadata from OSMD `SourceMeasure` / graphical measures where possible.
- Build canonical-to-OSMD note mapping as a hard gate. Try source ID injection before OSMD load if direct note-order mapping is fragile.
- Extend smoke tests to import through the actual app UI, not only the isolated OSMD spike page.
- Update old smoke assertions away from VexFlow-specific assumptions where the intent is "score page SVG and interactive maps."

</specifics>

<deferred>

## Deferred Ideas

- Switching all built-in teaching patterns to OSMD is deferred.
- Full note editing is deferred, though note/measure click APIs must remain future-friendly.
- Verovio migration is deferred unless Phase 7 critical gates prove OSMD unsuitable.
- Pixel-perfect comparison against MuseScore Studio screenshots is deferred; this phase uses functional/page-fidelity smoke and fixture gates.
- Renderer-provided audio playback is deferred; app audio remains canonical.

</deferred>

---

*Phase: 07-osmd-production-score-rendering*
*Context gathered: 2026-05-15*
