# Phase 7: OSMD Production Score Rendering - Discussion Log

**Created:** 2026-05-15
**Status:** Ready for planning

## User Direction

The next phase should deliver full notation correctness for imported MusicXML as far as the selected professional renderer can support it. The comparison target is MuseScore Studio page view: titles, credits, systems, page layout, pickup and implicit measure semantics, multiple voices, chords, directions, and score spacing should no longer look like the simplified Phase 5 reconstruction.

## Key Clarifications Already Given

1. Imported MusicXML should display like a real score page, not as app-owned flowing/reflowing measures.
2. Page scaling should keep the encoded page content inside the sheet viewport.
3. The renderer must remain interactive SVG/DOM, not static score images, because playback highlighting, range selection, click events, and possible future editing need addressable notation elements.
4. Two-page notestand behavior is still desired on wider screens, with one page per row on small screens and vertical scrolling as the primary navigation mode.
5. The current app sound generation and keyboard UI are not the bottleneck.
6. OSMD is accepted as the preferred next renderer direction after Phase 6 proof.
7. The MusicXML test-suite strategy should be integrated into automated tests, with the best fixture strategy chosen by the agent.

## Planning Interpretation

Phase 6 selected and proved OSMD behind a facade, but it deliberately did not switch the production imported-score path away from `js/musicXmlScoreRenderer.js` and the old VexFlow reconstruction. Phase 7 must make that switch real.

The phase should not promise exact MuseScore Studio parity in every engraving detail. MuseScore has its own engraving engine, and OSMD documents several MusicXML support limits. The practical bar is:

- OSMD renders the imported score as full pages with credits/layout enabled.
- The app stops reconstructing imported MusicXML with its own VexFlow page logic.
- The user's MuseScore-exported `.mxl` sample becomes a critical visual smoke fixture when available.
- Gaps are classified as app integration bugs, OSMD limitations, unsupported MusicXML, or future renderer fallback triggers.

## Open Implementation Decisions For Executor

1. Whether to reuse `js/musicXmlScoreRenderer.js` as the public production facade and call `ProfessionalMusicXmlRenderer` internally, or to rename the production import path after tests are updated.
2. Whether the first production mapping from canonical playback events to OSMD notes should use deterministic note order, injected source IDs before OSMD load, OSMD cursor timing, or a hybrid. The plan requires evidence and tests before accepting the mapping.
3. Whether OSMD's `onXMLRead`/`OnXMLRead` hook or pre-load XML preprocessing is the safest place to add app-owned IDs if the DOM cannot be mapped reliably after render.
4. Whether any old MusicXML VexFlow reconstruction remains as a debug-only fallback. It must not silently replace OSMD for normal imports.

## Locked Direction

- OSMD is the production renderer for imported MusicXML unless a critical gate fails during execution.
- Built-in short teaching patterns continue to use the existing staff renderer unless a later phase explicitly migrates them.
- Playback remains through the app's audio engine and canonical player.
- The renderer facade owns external renderer details; `index.html`, range selection, and auto-follow should depend on the app-level render result contract.

---

*Phase: 07-osmd-production-score-rendering*
*Discussion captured: 2026-05-15*
