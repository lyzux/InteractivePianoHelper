# Phase 6: Professional MusicXML Renderer - Context

**Gathered:** 2026-05-15
**Status:** Ready for detailed planning

<domain>

## Phase Boundary

This phase replaces the Phase 5 "simplified VexFlow reconstruction" path for imported MusicXML display with a professional renderer boundary. The goal is page-faithful MusicXML display that can support playback highlighting, score selection, click events, and future editing-adjacent APIs while preserving the app's static browser-only nature.

The phase should treat OSMD as the preferred candidate, but it must include an evidence gate against the current renderer and Verovio so the final integration is grounded in real fixtures and licensing facts.

</domain>

<decisions>

## Implementation Decisions

### Renderer Direction
- **D-06-01:** Imported MusicXML display should use a dedicated professional MusicXML renderer module rather than further expanding the app-owned simplified VexFlow page renderer.
- **D-06-02:** OpenSheetMusicDisplay is the leading candidate because it renders MusicXML in the browser, outputs SVG, exposes cursors/graphical notes, supports note coloring, and has a modifiable score model.
- **D-06-03:** Verovio remains a serious fallback/comparison candidate because it has strong SVG/timemap/MIDI APIs and broad notation goals, but LGPL-3.0-or-later obligations and package footprint must be accepted explicitly before adoption.
- **D-06-04:** Raw VexFlow remains useful for built-in teaching patterns and as a low-level fallback, but not as the primary full-MusicXML renderer.

### Renderer Contract
- **D-06-05:** Production code should talk to a renderer facade owned by the app, not directly to OSMD/Verovio APIs scattered through the UI.
- **D-06-06:** The renderer facade must expose page containers, note/measure hit targets, playback highlight APIs, range-selection APIs, and lifecycle cleanup.
- **D-06-07:** MusicXML visual rendering should preserve encoded page/system behavior where possible and scale pages within the notestand viewport instead of reflowing measures into different pages.
- **D-06-08:** The renderer must remain interactive SVG/DOM, not static bitmap or non-addressable image output.

### Playback And Canonical Model
- **D-06-09:** Playback should continue through the app's existing piano/audio path, not by adopting a renderer-provided audio engine as the product path.
- **D-06-10:** Renderer-derived timing/cursor data may replace or validate the current strict MusicXML canonical adapter if it proves more faithful.
- **D-06-11:** The app must keep a stable bridge between visual notes/measures and playable events for keyboard highlighting, range loop, start position, and future note clicks.

### Test Suite Strategy
- **D-06-12:** Use `cuthbertLab/musicxmlTestSuite` as the preferred vendorable MusicXML test-suite source because it has explicit MIT license statements and repo structure suitable for automation.
- **D-06-13:** Treat the LilyPond collated MusicXML page as coverage guidance and upstream reference, not the first vendored fixture source.
- **D-06-14:** Import the suite in curated tiers rather than turning on every file as a hard gate immediately.
- **D-06-15:** Tests should include smoke rendering, parser/import acceptance, visual DOM addressability, playback timing extraction, and known unsupported-feature reporting. Avoid brittle full-SVG snapshots as the primary assertion.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` — Core value and static-app constraints.
- `.planning/REQUIREMENTS.md` — New Phase 6 requirements and completed earlier MusicXML import requirements.
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, and dependencies.
- `.planning/STATE.md` — Current milestone state and new phase focus.
- `CLAUDE.md` — Project architecture and no-build static hosting notes.

### Prior Phase Artifacts
- `.planning/phases/05-musicxml-import-and-practice-ux/05-CONTEXT.md` — Import library, strict MusicXML acceptance, score rendering, and practice-control decisions.
- `.planning/phases/05-musicxml-import-and-practice-ux/05-RESEARCH.md` — Earlier renderer research and why OSMD was considered but deferred.
- `.planning/phases/05-musicxml-import-and-practice-ux/05-01-SUMMARY.md` — Existing Phase 5 renderer gate selected the current VexFlow adapter, which Phase 6 now reopens based on real MuseScore evidence.
- `.planning/phases/05-musicxml-import-and-practice-ux/05-VERIFICATION.md` — Verify existing import/playback behavior before replacing rendering internals.

### Current Code Touchpoints
- `index.html` — App boot, dynamic imports, file import UI, playback/notation wiring.
- `js/musicXmlFileReader.js` — Existing `.musicxml`, `.xml`, and `.mxl` browser file reader.
- `js/musicXmlParser.js` — Current strict XML parser.
- `js/musicXmlCanonicalAdapter.js` — Current canonical MusicXML adapter; may be reduced or validated against renderer timing later.
- `js/musicXmlScoreRenderer.js` — Existing facade to preserve/replace.
- `js/staffNotationRenderer.js` — Current app-owned VexFlow renderer and score-page DOM conventions.
- `js/player.js` — Existing canonical playback/range loop implementation.
- `js/practiceRangeController.js` — Score range click integration.
- `js/autoFollowController.js` — Playback-follow scrolling.
- `tests/browser-smoke/*.test.js` — Existing browser behavior coverage.

### External Renderer Sources
- OSMD docs: `https://opensheetmusicdisplay.github.io/classdoc/classes/OpenSheetMusicDisplay.html`
- OSMD GraphicalNote docs: `https://opensheetmusicdisplay.github.io/classdoc/classes/GraphicalNote.html`
- OSMD GitHub: `https://github.com/opensheetmusicdisplay/opensheetmusicdisplay`
- OSMD timing tutorial: `https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Tutorial---Extracting-note-timing-for-playing`
- jsDelivr OSMD metadata: `https://www.jsdelivr.com/package/npm/opensheetmusicdisplay`
- Verovio licensing: `https://book.verovio.org/introduction/licensing.html`
- Verovio toolkit methods: `https://book.verovio.org/toolkit-reference/toolkit-methods.html`
- VexFlow: `https://www.vexflow.com/`
- cuthbertLab MusicXML Test Suite: `https://github.com/cuthbertLab/musicxmlTestSuite`
- LilyPond MusicXML tests: `https://lilypond.org/doc/v2.24/Documentation/contributor/musicxml-tests`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets
- Imported file reading already supports `.mxl` extraction.
- IndexedDB-backed imported score persistence already exists.
- Playback/range/auto-follow already work against `eventMap` and `measureMap` concepts.
- `musicXmlScoreRenderer.js` already provides a facade seam that can hide OSMD/Verovio details from app UI.
- Browser smoke tests already exercise static serving, import UI, score rendering, range selection, persistence, and cleanup.

### Current Limitations
- The current renderer reconstructs pages from canonical events and loses too much MusicXML engraving/layout intent.
- Voice separation is flattened into hand payloads, which is acceptable for simple playback but not enough for professional score display.
- MuseScore exports include credits, explicit positions, implicit pickup measures, multiple voices, slurs, dynamics, and encoded page/system information that the current renderer only partially uses.
- Full MusicXML parity is too large for app-owned VexFlow layout code.

### Integration Rules
- Keep static hosting. A bundler may be evaluated only if the phase proves it is worth changing the project's no-build posture.
- Prefer loading a pinned renderer build from a checked-in vendor file or documented CDN path; avoid floating latest.
- Keep renderer output inside existing notestand/page UI contracts where possible.
- Preserve the bottom keyboard and sound panel behavior.
- Do not adopt renderer audio playback as the primary product sound path unless explicitly planned later.

</code_context>

<specifics>

## Specific Ideas

- Create `js/professionalMusicXmlRenderer.js` or evolve `js/musicXmlScoreRenderer.js` into the renderer facade.
- Use OSMD's SVG backend and page mode as the first proof target.
- Map OSMD graphical notes or cursor notes to app playback event IDs.
- Support note coloring for current playback, range selection, and future markings through renderer-owned APIs.
- Add a fixture manifest for curated MusicXML compatibility tests: smoke, piano-core, layout, voices/chords, directions/text, compressed `.mxl`, unsupported/known-fail.
- Vendor a small curated subset first; optionally add a script to fetch or update the wider test suite later.

</specifics>

<deferred>

## Deferred Ideas

- Full note editing is not part of the first professional renderer integration, but the renderer facade must not block future editing research.
- Renderer-provided MIDI/audio playback can be researched later for validation, but the app's sound engine remains product playback.
- Complete all-file MusicXML suite gating is deferred until curated tiers are stable.
- Legal review beyond obvious open-source license compatibility is outside this phase; record license facts and obligations clearly.

</deferred>

---

*Phase: 6-Professional MusicXML Renderer*
*Context gathered: 2026-05-15*

