# Phase 04 Research: MusicXML-Ready Foundation

**Date:** 2026-05-15
**Status:** Planning-ready

## Executive Summary

Phase 04 should not attempt a full MusicXML importer. The highest-value foundation is a small, explicit adapter contract that says what any future MusicXML parser must output into the existing canonical score/event model, plus browser smoke coverage proving the static app still boots, validates sources, renders notation SVG, and cleans up playback highlights.

Official MusicXML 4.0 references support this direction: MusicXML is a page/part/measure-oriented score format, not a responsive notation-flow format. The adapter must preserve page and system hints where present, while converting playable score semantics into the app's canonical sequence for playback and highlighting.

## MusicXML Structure Findings

### Score Roots And Header

MusicXML commonly represents exchange scores as `score-partwise`; `score-timewise` exists but is less useful for this app's near-term piano-score path. A `score-partwise` document contains score header information, a `part-list`, and one or more `part` elements. Each part contains ordered `measure` elements.

**Planning consequence:** the Phase 04 contract should declare `score-partwise` as the supported v1 root and document `score-timewise` as deferred. Future parser output should include source identity and score metadata, not just note arrays.

### Parts, Measures, And Attributes

MusicXML measure content combines musical events and local state. `attributes` can define divisions, key, time, staves, clefs, and related layout/playback facts. The same part may change attributes over time.

**Planning consequence:** adapter output must represent enough measure state for validation and rendering: divisions-to-beat conversion, time signature, key signature, clef/staff hints, measure number, and the canonical event span of each measure.

### Notes, Rests, Chords, Durations, Ties

MusicXML `note` elements may contain a `pitch`, a `rest`, a `duration`, voice/staff data, type/dot notation, ties, and accidentals. Chords are represented by a `chord` marker on notes that share the previous onset. `backup` and `forward` move the time cursor within a measure and are essential for multi-voice piano notation. Durations are expressed in divisions, so the parser must translate divisions into beats before constructing canonical events.

**Planning consequence:** the future parser cannot be a simple linear array reader. The contract should explicitly require cursor handling for `backup`, `forward`, and `chord`, and should document how these become canonical events with `startBeat`, `durationBeats`, hand payloads, rests, chords, and ties.

### Print And Page Layout

MusicXML includes page layout defaults and measure-level `print` hints for new pages and systems. These are score fidelity signals. They are not complete rendering instructions, but they matter for the user's desired page behavior: the page remains a page, and content scales into its page viewport instead of flowing to another page because the browser viewport changed.

**Planning consequence:** Phase 04 should add page-layout fields to the adapter contract even if the current VexFlow renderer consumes only a subset. The contract should mention `defaults/page-layout`, `print/new-page`, `print/new-system`, and system layout hints as first-class future inputs.

## Dependency And Renderer Findings

OpenSheetMusicDisplay is a credible future browser MusicXML renderer candidate, but adopting it now would be a substantial notation/rendering dependency and would change the product architecture beyond Phase 04. The current roadmap asks for readiness, not renderer migration.

**Recommendation:** do not adopt OSMD or another MusicXML renderer in Phase 04. Document it as a future evaluation point. Keep VexFlow as the active renderer and harden the data boundary around it.

## Browser Smoke Findings

The repository currently has pure `node:test` coverage and no browser automation dependency. Static DOM/VexFlow behavior cannot be verified meaningfully from Node-only tests because VexFlow rendering, controls, and playback cleanup happen in the browser.

**Recommendation:** add a separate `npm run test:smoke` browser smoke command during execution. Because this requires Playwright or equivalent browser tooling and likely a browser download, it remains the one critical gate to ask before installing. Keep `npm test` as the fast unit/contract suite.

Suggested smoke assertions:

- Serve the repo over a local loopback HTTP server.
- Open `index.html`.
- Verify the pattern selector has valid entries.
- Verify validation feedback is not fatal for the default built-in.
- Verify `#vexflow-notation svg` and score page containers render.
- Click Play and Stop.
- Verify playback state returns to stopped and piano highlights are cleared.

## Security And Robustness Notes

Future MusicXML files are untrusted XML input. Even though Phase 04 does not parse user files, the docs and contract should establish these constraints now:

- Treat MusicXML as data, never executable code.
- Do not use `eval`, `Function`, remote script loading, or executable pattern imports for user MusicXML.
- Use a browser-safe parser configuration/path that avoids external entity or network resolution.
- Validate adapter output through the existing canonical sequence validator before registering a source.
- Keep diagnostics source-scoped with `sourceId`, `sourceType: "musicxml"`, severity, stable code, path, and message.

## Recommended Architecture

1. Add `docs/MUSICXML-ADAPTER.md` describing the future parser boundary, canonical output requirements, page fidelity contract, validation flow, and deferred MusicXML features.
2. Add a tiny pure module such as `js/musicXmlAdapterContract.js` with constants/helpers that make `sourceType: "musicxml"`, supported roots, required canonical fields, page-layout hints, and deferred feature names testable.
3. Add Node contract tests for the adapter constants/helpers.
4. Add a separate browser smoke plan that asks before installing Playwright or comparable browser tooling.
5. Update roadmap/state once plans are accepted.

## References

- Official MusicXML 4.0 tutorial, structure of MusicXML files: `https://www.w3.org/2021/06/musicxml40/tutorial/structure-of-musicxml-files/`
- Official MusicXML 4.0 tutorial, MIDI-compatible part: `https://www.w3.org/2021/06/musicxml40/tutorial/midi-compatible-part/`
- Official MusicXML 4.0 reference, `print`: `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/print/`
- Official MusicXML 4.0 reference, `page-layout`: `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/page-layout/`
- OpenSheetMusicDisplay npm package, future renderer candidate only: `https://www.npmjs.com/package/opensheetmusicdisplay`
