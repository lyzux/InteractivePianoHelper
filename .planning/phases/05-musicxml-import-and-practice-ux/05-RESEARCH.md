# Phase 5: MusicXML Import And Practice UX - Research

**Researched:** 2026-05-15T15:10:40+02:00
**Status:** Ready for UI contract and planning

## Research Question

What do we need to know to plan MusicXML import, page-faithful interactive rendering, local imported-library persistence, and practice playback controls for a static vanilla JavaScript piano learning app?

## Key Findings

### 1. MusicXML Import Should Stay Strict And Data-Only

MusicXML `score-partwise` is the practical first root because parts contain ordered measures and align with the existing adapter contract. Browser import can use a normal file input plus `Blob.text()`/`FileReader.readAsText()` and `DOMParser.parseFromString(..., 'application/xml')`. MDN notes that XML parse failures produce a returned document containing `parsererror`, which should become a fatal diagnostic rather than a thrown app crash.

Planning implications:

- Add a pure `js/musicXmlParser.js` or similarly named module that accepts text and filename metadata, returns `{ ok, document, diagnostics }`, and never executes user content.
- Add strict root validation for `score-partwise`; reject malformed XML, unsupported root types, missing `part-list`, missing `part`, empty measures, or unsupported multi-part structures.
- Keep validation diagnostics source-scoped with `sourceId`, `sourceType: 'musicxml'`, `severity`, `code`, `path`, and `message`, matching the Phase 3/4 contract.
- Use small checked-in MusicXML fixture strings/files for tests rather than relying on user-provided files.

Relevant sources:

- MDN `DOMParser.parseFromString()` documents XML parsing and `parsererror` behavior: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
- MDN `FileReader.readAsText()` notes that `Blob.text()` is a newer promise-based alternative: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText
- W3C MusicXML structure tutorial: https://www.w3.org/2021/06/musicxml40/tutorial/structure-of-musicxml-files/

### 2. MusicXML Playback Mapping Requires Cursor Handling, Not Append-Only Parsing

Piano MusicXML commonly uses multiple voices/staves within a part. The official MusicXML model uses `duration` values in divisions, and `backup`/`forward` elements move the cursor within a measure. A parser that simply appends notes will misplace left/right hand or voice events.

Planning implications:

- Build an adapter state machine with active `divisions`, time signature, key signature, clefs, staves, part metadata, and per-part/measure cursor positions.
- Convert MusicXML `duration / divisions` into canonical quarter-note beats, preserving the existing app convention where `1` is a quarter-note beat.
- Treat `chord` notes as same-onset additions to the previous note event rather than time-advancing events.
- Treat `backup` and `forward` as required for correctness; reject files that need unsupported cursor behavior rather than importing partial playback.
- Map accepted files into the canonical event model before playback/notation; no display-only import in Phase 5.

Relevant sources:

- W3C MusicXML MIDI-compatible part tutorial covers note, duration, rest, chord, tie, backup, and forward semantics: https://www.w3.org/2021/06/musicxml40/tutorial/midi-compatible-part/
- Existing contract: `docs/MUSICXML-ADAPTER.md`

### 3. Page Fidelity Depends On Preserving MusicXML Layout Hints

The user wants MusicXML pages displayed as pages, similar to MuseScore Studio. MusicXML provides defaults and per-measure print hints that can indicate page and system layout. The W3C `print` element can force new pages/systems, set page numbers, and carry page/system/staff layout data that applies from that point forward.

Planning implications:

- Preserve `defaults/page-layout`, page margins, and measure-level `print` hints in the adapter model even if first rendering support is partial.
- Page content should scale inside a sheet viewport. The responsive rule is scale, not reflow.
- Desktop score view should keep a two-page stand. Narrow screens should switch to a one-page vertical column.
- Tests should assert page metadata and DOM layout classes/styles, not full engraved SVG snapshots.

Relevant sources:

- W3C MusicXML `print` element reference: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/print/
- W3C MusicXML `page-layout` reference: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/page-layout/

### 4. Renderer Choice Is The Critical Technical Decision

The current custom VexFlow renderer is already integrated with event highlight maps, but it does not parse MusicXML and has already shown page/layout fragility. OpenSheetMusicDisplay (OSMD) is the strongest candidate to evaluate because it renders MusicXML in-browser, is based on VexFlow, can use SVG output, parses much of MusicXML into a modifiable data model, exposes cursor-related APIs, and supports plain JavaScript usage without a framework. It is not a full interactive editor and long scores can be expensive, so it should be adopted deliberately.

Planning implications:

- Treat OSMD as a candidate, not an automatic dependency. A plan should include a spike/gate that proves static-site loading, SVG output, page scaling, highlight/cursor or SVG-node mapping, and click/range hit testing.
- If OSMD passes the gate, use it for imported MusicXML rendering while keeping canonical playback mapping in app-owned modules.
- If OSMD fails the interaction/page-fidelity gate, keep the current VexFlow renderer and implement a smaller supported MusicXML subset into the existing page renderer.
- Static-image output is not acceptable because Phase 5 needs playback highlights and measure range selection.

Relevant sources:

- OSMD GitHub README: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- OSMD class docs list constructor, load/render, cursors, follow cursor, zoom, export SVG, and related APIs: https://opensheetmusicdisplay.github.io/classdoc/classes/OpenSheetMusicDisplay.html
- OSMD Getting Started documents plain JavaScript inclusion, SVG backend, and loading MusicXML from a string/document/URL: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Getting-Started

### 5. Imported Score Persistence Should Prefer IndexedDB For File Payloads

The user wants successful imports remembered automatically and removable. `localStorage` is already used in this app, but MDN documents Web Storage as string-only and limited to about 10 MiB total per origin. MusicXML files can be larger than ordinary settings, and localStorage is synchronous. IndexedDB is designed for larger structured browser data and better matches an imported score library.

Planning implications:

- Use `localStorage` only for small preferences or selected source ID.
- Prefer a small no-dependency IndexedDB wrapper module for imported score records: `id`, `title`, `filename`, `createdAt`, `xmlText`, `descriptor`, maybe `diagnostics`.
- Handle storage failures with visible import failure details and do not register a score that cannot be saved if automatic persistence is required.
- Account for origin-specific storage: local HTTP server and GitHub Pages origins have separate libraries.
- Do not promise cloud sync; clearing site data removes imports.

Relevant sources:

- MDN `localStorage` documents string storage and origin-specific behavior: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- MDN storage quotas notes Web Storage limits and identifies IndexedDB for large data structures: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

### 6. Practice Range UX Needs Measure/Event Metadata

Range selection, start-from-measure playback, and auto-follow all require a reliable bridge between rendered score positions and canonical events. The current player can start only at event index 0 and loops the whole sequence, so range support should be added to `Player` as canonical-event slicing/windowing rather than as renderer-specific behavior.

Planning implications:

- Extend canonical measures with `measureNumber`, `startBeat`, `durationBeats`, `eventIds`, `pageNumber`, and `systemIndex`.
- Add a range selection state module or app-controller helpers for `rangeStartMeasure`, `rangeEndMeasure`, `startEventId`, and `autoFollowPaused`.
- Implement `Shift+click` or equivalent modified click on rendered measures; plain click should remain free for future note interactions.
- Use a mint-green CSS accent for selected ranges.
- Extend `Player.play()` to accept `startEventId`/`startIndex`, `endEventId`/`endIndex`, or a `range` object. The loop toggle should loop the selected range when present and full score otherwise.
- Auto-scroll should follow the current system/page during playback, but manual user scroll should pause auto-follow until the user resumes or playback restarts.

## Recommended Plan Shape

1. **Research/Spike Gate For Renderer And Storage**
   - Prove OSMD or current VexFlow path can satisfy interactive page rendering.
   - Prove IndexedDB wrapper can persist/remove imported MusicXML without a build step.
   - Critical gate: any new renderer dependency must remain static-hosting compatible and preserve interactive SVG/cursor/click behavior.

2. **MusicXML Import, Storage, And Validation Core**
   - File input, XML parse diagnostics, strict MusicXML structure validation, source descriptors, local imported-library storage, duplicate suffixing, removal.
   - Node tests for parser/storage adapters where possible.

3. **Canonical Adapter And Playback Mapping**
   - Convert accepted MusicXML subset into canonical score/events/measures/page-layout metadata.
   - Cover divisions, durations, rests, chords, ties, accidentals, clefs, key/time signatures, backups/forwards, and unsupported multi-part rejection.

4. **Interactive Score Rendering**
   - Render full pages, preserve page/system hints where available, scale within page viewport, two-page stand on desktop, one-page column on narrow screens.
   - Keep event and measure mappings for highlights and range selection.

5. **Practice Playback UX**
   - `Shift+click` range selection, mint-green range display, start-from-measure, range-aware loop, auto-follow with manual-scroll pause.

6. **Browser Smoke And Regression Coverage**
   - Import a tiny fixture, verify remembered entry appears, remove it, render pages, start playback from a range, verify highlights/auto-scroll cleanup.

## Validation Architecture

Phase 5 should validate at four layers:

1. **File/XML validation:** extension/MIME where useful, text read, XML parse success, `parsererror` detection, supported root.
2. **MusicXML semantic validation:** part-list/part/measure structure, divisions, attributes, durations, notes/rests/chords/ties, backups/forwards, staves/voices, key/time/clef data, page/system hints.
3. **Canonical validation:** `validateResolvedSequence()` and new measure/page-layout consistency checks.
4. **Browser behavior validation:** static app boot, import UI, rejected import details, accepted import display, remembered library, removal, playback highlight, range loop, auto-follow behavior.

## Risks

- OSMD may improve MusicXML rendering but may not expose the exact event/measure mapping needed for playback highlights and `Shift+click` range selection.
- A full MusicXML parser is large; Phase 5 should choose a narrow supported subset and reject unsupported structures clearly.
- IndexedDB testability in Node is awkward without adding a polyfill; plan should keep storage wrapper thin and verify behavior mainly in browser smoke.
- Combining import, renderer, storage, and practice UX is a large phase. Planning should use multiple waves with a dependency gate after renderer/storage spike.

## Recommendation

Research supports proceeding, but with one important workflow note: Phase 5 is UI-heavy and should get a UI-SPEC before final PLAN.md generation. The UI-SPEC should lock the import/library surface, validation-detail affordance, score-page layout, range-selection affordance, mint-green accent, and auto-follow controls. After that, plan Phase 5 as an MVP sequence with an early renderer/storage gate so the project can choose OSMD or the current VexFlow renderer before deeper implementation begins.

## RESEARCH COMPLETE
