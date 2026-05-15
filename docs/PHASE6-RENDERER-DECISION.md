# Phase 6 Renderer Decision

## Decision

Selected candidate for Phase 6 execution: **OpenSheetMusicDisplay (OSMD)** behind an app-owned renderer facade.

OSMD is the best first professional MusicXML renderer for this app because it runs in the browser, renders MusicXML to interactive SVG, exposes page/cursor/graphic score structures, has a permissive BSD-3-Clause license, and keeps the project close to its existing VexFlow/SVG interaction model. It should replace the Phase 5 simplified MusicXML reconstruction path only through `js/professionalMusicXmlRenderer.js`, so future app code does not depend directly on OSMD internals.

Verovio remains the fallback/comparison renderer. The current app-owned VexFlow reconstruction remains useful for built-in pedagogical patterns and fallback experiments, but it is blocked as the long-term full-MusicXML rendering path.

## Evidence Snapshot

Checked on: 2026-05-15

| Renderer | Version Checked | License | Result | Evidence |
|----------|-----------------|---------|--------|----------|
| OSMD | `opensheetmusicdisplay@1.9.9` | BSD-3-Clause | PASS | Browser smoke loads pinned package bundle, renders A4 SVG pages, exposes `g.vf-measure` and `g.vf-stavenote` DOM hooks, supports click targets, supports SVG color mutation for highlights, exposes cursor object. |
| Verovio | `verovio@6.1.0` npm metadata | LGPL-3.0-or-later | FLAG | Strong SVG, page, timemap, MIDI, and element APIs, but package footprint and LGPL/product-credit obligations are heavier than OSMD for this static browser app. |
| Current VexFlow reconstruction | App-owned renderer using VexFlow 4.2.2 path | MIT via VexFlow | BLOCK | Good for simple patterns and current playback hooks, but real MuseScore exports showed page credits, page/system intent, pickup semantics, multi-voice/chord display, and engraving fidelity becoming app-owned reconstruction work. |

## OSMD Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| Static browser loading | PASS | Smoke test serves the pinned npm package bundle from `node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js`. Production can later choose checked-in vendor asset or pinned CDN path. |
| SVG output | PASS | OSMD emits one SVG per rendered page when page formatting is active. |
| Multi-page page containers | PASS | With `pageFormat: "A4_P"` and `newPageFromXML: true`, XML page breaks render as separate `osmdCanvasPage*` containers and SVGs. |
| Note/measure addressability | PASS | Rendered SVG includes `g.vf-measure` and `g.vf-stavenote` groups suitable for app-owned event delegation and data attributes. |
| Playback cursor path | PASS | OSMD exposes a cursor object and graphical model; detailed canonical timing bridge remains a Phase 6 facade task. |
| Highlight/color mutation | PASS | Smoke test mutates SVG note group shapes to mint green without full rerendering. |
| Local MuseScore `.mxl` sample | PASS when present | Browser smoke extracts the local MuseScore sample through the app's `.mxl` reader and verifies OSMD renders title, measures, notes, and SVG pages. |
| License fit | PASS | BSD-3-Clause is compatible with the open-source static app direction. Keep license notice in dependency/vendor strategy. |
| Package/runtime fit | FLAG | OSMD package includes its own VexFlow 1.2.93 dependency. Keep it isolated behind the facade to avoid coupling it to the app's current VexFlow path. |

## Verovio Comparison

Verovio remains attractive because it has mature engraving, SVG page rendering, compressed MusicXML support, MIDI/timemap capabilities, and APIs for elements at playback time. It is not selected first because `verovio@6.1.0` is much larger than OSMD in npm metadata and carries LGPL-3.0-or-later obligations, including visible credit requirements and source-publication obligations for library modifications.

Adopt Verovio only if OSMD fails a future hard gate such as critical MusicXML fidelity, timing extraction, or note addressability on the curated fixture suite.

## Current VexFlow Reconstruction Comparison

The current renderer is still valuable for:

- Built-in short teaching patterns.
- Playback event highlighting on app-owned canonical events.
- Fallback experiments where hand-authored notation is acceptable.

It is blocked as the full-MusicXML path because it requires the app to own too much engraving logic. The app should not rebuild MuseScore-class page rendering by hand in VexFlow.

## Production Integration Direction

1. Add `js/professionalMusicXmlRenderer.js` as the renderer facade.
2. Keep OSMD construction, page extraction, click mapping, highlight mutation, and teardown behind that facade.
3. Preserve existing app concepts where useful: `pages`, `eventMap`, `measureMap`, playback highlights, range selection, and auto-follow hooks.
4. Do not replace the app's audio engine with renderer-provided playback.
5. Do not use full SVG snapshots as the main regression strategy; prefer DOM contract checks, fixture categories, and targeted visual smoke checks.

## Fixture Strategy

Use `cuthbertLab/musicxmlTestSuite` as the preferred vendorable source because its repository states MIT licensing and it is easier to pin by commit. Use LilyPond's collated MusicXML tests as coverage guidance, not as the first vendored source.

Initial hard gates should stay curated:

- Piano core.
- Layout and credits.
- Voices and chords.
- Directions and text.
- Compressed `.mxl`.
- Render-only edge cases.
- Known unsupported cases.
- Known fail cases.

The full external suite should not be turned into a hard pass gate until the renderer facade and fixture taxonomy have enough maturity to distinguish app-critical regressions from upstream renderer limitations.

## Deviation From Phase 5 Gate

Phase 5 selected the app-owned VexFlow adapter because it satisfied immediate import/practice UX needs without a new dependency. Phase 6 reopens that decision based on real MuseScore evidence: the imported score can now load and play, but the visual notation is not faithful enough for professional MusicXML compatibility.
