# Phase 6: Professional MusicXML Renderer - Research

**Researched:** 2026-05-15
**Status:** Ready for detailed planning

## Research Question

What rendering and MusicXML test-suite strategy best supports a professional, page-faithful, interactive, open-source MusicXML module for Interactive Piano Helper?

## Key Findings

### 1. The Current VexFlow Reconstruction Is The Wrong Long-Term Renderer For MusicXML

VexFlow is an excellent low-level browser notation API and is MIT licensed, but it requires each measure and symbol to be constructed and positioned by application code. That is exactly where the current app is failing with real MuseScore exports: page credits, encoded layout, voices, slurs, dynamics, chord placement, and implicit measure semantics become app-owned engraving work.

Planning implications:

- Keep VexFlow for built-in pedagogical pattern display and fallback experiments.
- Stop treating app-owned VexFlow layout code as the path to "everything MusicXML offers."
- Introduce a renderer module/facade whose job is MusicXML display, addressability, and rendering lifecycle.

Sources:

- VexFlow describes itself as a JavaScript notation rendering API supporting Canvas/SVG and MIT licensing: https://www.vexflow.com/
- OSMD's README explicitly notes that VexFlow requires measures/symbols to be created and positioned by hand: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay

### 2. OSMD Is The Best First Candidate For This App

OpenSheetMusicDisplay renders MusicXML in the browser and is specifically positioned as a bridge between MusicXML and VexFlow. Current package metadata checked on 2026-05-15 reports `opensheetmusicdisplay@1.9.9`, `BSD-3-Clause`, and about 1.8 MB unpacked. Its docs expose `load()`, `render()`, SVG export, cursor support, zoom, page format options, and a sheet/graphic model. OSMD's model includes notes and graphical notes, and the GraphicalNote API supports color/visibility operations for SVG backends.

Important fit points:

- MusicXML-first renderer.
- Browser compatible.
- SVG output.
- Cursor APIs for playback-follow behavior.
- GraphicalNote and Note APIs for visual note access.
- Note coloring without full rerendering, when using SVG.
- Timing extraction tutorial exists for playback mapping.
- More compatible with the current app's VexFlow/SVG mental model than Verovio.

Known concerns:

- OSMD is a renderer, not a full editor.
- Long scores can be expensive.
- npm metadata shows dependency on an older `vexflow` package line; integration must avoid conflicting with the app's current global VexFlow 4.2.2 path.
- Not all MusicXML tags are fully supported. The phase must measure practical support with fixtures instead of assuming perfection.

Sources:

- OSMD class docs: https://opensheetmusicdisplay.github.io/classdoc/classes/OpenSheetMusicDisplay.html
- OSMD GraphicalNote docs: https://opensheetmusicdisplay.github.io/classdoc/classes/GraphicalNote.html
- OSMD Cursor docs: https://opensheetmusicdisplay.github.io/classdoc/classes/Cursor.html
- OSMD timing tutorial: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Tutorial---Extracting-note-timing-for-playing
- jsDelivr metadata for OSMD 1.9.9 and BSD-3-Clause: https://www.jsdelivr.com/package/npm/opensheetmusicdisplay

### 3. Verovio Is A Strong Fallback But Has Heavier License And Integration Tradeoffs

Verovio is a powerful JavaScript/C++ engraving library with MusicXML input, SVG output, MIDI, timemap, and element-time APIs. It can render pages to SVG, expose page counts, return elements at playback time, and load compressed MusicXML ZIP data in the toolkit. It is highly attractive for robust score rendering and time mapping.

Tradeoffs:

- Current npm metadata checked on 2026-05-15 reports `verovio@6.1.0`, `LGPL-3.0-or-later`, and about 25.6 MB unpacked.
- Verovio requires visible credit in products that use it.
- Modifications to Verovio itself must be published under LGPLv3.
- It is more MEI-centered conceptually, though it supports MusicXML input.

Planning implication:

- Include Verovio as the comparison/fallback in a spike, especially for timemap and element addressability.
- Prefer OSMD first because its license/package footprint and VexFlow-adjacent integration are simpler for this app.

Sources:

- Verovio licensing: https://book.verovio.org/introduction/licensing.html
- Verovio toolkit methods: https://book.verovio.org/toolkit-reference/toolkit-methods.html
- Verovio overview: https://music-encoding.org/tools/verovio

### 4. The Renderer Adapter Should Own A Stable App API

The app should not let OSMD, Verovio, or VexFlow details leak across UI/playback modules. A stable facade lets the app switch renderer internals later without rewriting range selection, auto-follow, playback highlight, or import UI.

Recommended facade responsibilities:

- `load(xmlText | mxlBytes, metadata)` or accept an already-read XML string from `musicXmlFileReader`.
- `render(container, options)` returning `{ pages, eventMap, measureMap, noteMap }`.
- `highlightEvents(eventIds, color | token)`.
- `clearHighlights(kind?)`.
- `setRange(startMeasureId, endMeasureId)`.
- `clearRange()`.
- `onMeasureClick(handler)` and `onNoteClick(handler)`.
- `getPlaybackTimeline()` or `getEventAtTime()` bridge.
- `destroy()` lifecycle cleanup.

The first implementation can keep names close to the current `renderMusicXmlScore()` return contract, but the API should be explicit enough to support future editing-facing work.

### 5. Test Suite Strategy Should Use cuthbertLab As Vendored Source, LilyPond As Coverage Reference

The LilyPond docs say its MusicXML regression tests were developed for `musicxml2ly` and can be used to test any MusicXML implementation. The cuthbertLab GitHub fork states it is a fork of the LilyPond test suite, licensed under MIT, and free for use as long as the license remains intact. music21's documentation also identifies the fork as MIT licensed.

Recommendation:

- Use `cuthbertLab/musicxmlTestSuite` as the source to vendor or fetch because it has explicit MIT license statements and a GitHub repo layout.
- Keep the LilyPond collated page as reference coverage documentation.
- Vendor only a curated subset initially under `tests/fixtures/musicxml-suite/` with a copied license/notice file.
- Add a manifest that classifies each fixture by purpose and expected status:
  - `must-pass-render`
  - `must-pass-import-playback`
  - `must-pass-addressability`
  - `known-render-only`
  - `known-unsupported`
  - `known-fail-upstream`
- Avoid treating the entire suite as a hard pass gate on day one; this would block useful progress on edge cases outside the current app's piano-learning scope.

Sources:

- LilyPond contributor docs: https://lilypond.org/doc/v2.24/Documentation/contributor/musicxml-tests
- cuthbertLab repository/license statement: https://github.com/cuthbertLab/musicxmlTestSuite
- music21 license note: https://www.music21.org/music21docs/moduleReference/moduleMusicxmlLilypondTestSuite.html

## Recommended Phase Shape

1. **Renderer Decision Spike**
   - Build an isolated OSMD proof with the user's MuseScore `.mxl`, a tiny fixture, and a small cuthbertLab subset.
   - Compare with Verovio on the same evidence.
   - Record license, package size, load strategy, static hosting behavior, page fidelity, note/measure addressability, cursor/timing support, and rendering performance.

2. **Renderer Facade Contract**
   - Define a stable app-owned renderer API for pages, note/measure click events, highlights, range selection, playback timeline, and teardown.
   - Keep existing UI/playback modules dependent on the facade, not OSMD directly.

3. **OSMD Integration MVP**
   - Wire OSMD as the default imported MusicXML renderer if the spike passes.
   - Preserve current built-in pattern renderer unless there is a separate reason to migrate it.
   - Keep the app's audio engine and playback controls as product playback.

4. **Fixture Suite Integration**
   - Add the MIT fixture notice.
   - Add curated fixture files and a manifest.
   - Add Node/browser tests that load/render representative files and assert DOM addressability, not pixel-perfect SVG.

5. **Migration And Cleanup**
   - Retire or narrow the current MusicXML VexFlow reconstruction path.
   - Keep canonical playback mapping either as app-owned strict adapter or renderer-derived timeline after evidence decides.

## Open Questions For Planning

- Should the app accept a pinned CDN dependency for OSMD, or vendor the renderer bundle locally to preserve offline/static determinism?
- Does OSMD expose enough stable identifiers from MusicXML to map renderer notes back to our playback events, or do we need to inject IDs into MusicXML before load?
- Should `musicXmlCanonicalAdapter.js` remain the playback source of truth, or should OSMD timing extraction become the canonical MusicXML playback source?
- What fixture categories should be first hard gates for the app's real goal: piano score display/practice, not universal notation editing?

## Recommendation

Proceed with Phase 6 using OSMD as the intended renderer path, but require an explicit decision spike before deeper integration. Use cuthbertLab's MIT MusicXML test suite as the fixture source, staged through a manifest-driven subset. Keep Verovio as a fallback comparison and future option, especially if OSMD fails on addressability or page fidelity.

## RESEARCH COMPLETE

