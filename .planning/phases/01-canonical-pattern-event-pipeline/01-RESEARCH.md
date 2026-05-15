# Phase 1: Canonical Pattern Event Pipeline - Research

**Date:** 2026-05-15
**Status:** Complete

## Research Question

What do we need to know to plan Phase 1 well: making built-in pattern playback and notation derive from one canonical event sequence while preparing professionally for future MusicXML import?

## Executive Summary

The current app has the right pieces but the wrong source-of-truth boundary. `js/player.js` resolves notes and timings for playback, `js/simplePatternLoader.js` resolves notes and converts some notation values, and `js/staffNotationRenderer.js` independently expands, groups, fills, caps, and highlights notation. Phase 1 should introduce a pure canonical resolver that adapts current JavaScript pattern objects into explicit musical events. Playback and notation should consume that same resolved sequence.

The key planning choice is to model the visible loop unit, not only the raw source arrays. Lombard rhythm currently exposes the problem: the source pattern is a 2-beat, 4-event cycle in `4/4`, while notation expands it to a 4-beat display and playback loops 2 beats. The user wants syntactically valid notation, playback of exactly what is visible, and looping after the complete displayed unit. Therefore the resolver should produce a `loopUnit` with complete events, explicit duration beats, event IDs, hand data, source indices, rests, chords, fingering, time signature, and native-key metadata.

## Existing Behavior

### Playback

`js/player.js`:
- Duplicates transposition helpers from `js/simplePatternLoader.js`.
- Resolves `leftHand` and `rightHand` arrays independently through `_resolveNotesP`.
- Uses `pattern.timing[idx % pattern.timing.length]`.
- Loops when `noteIndex >= maxLen`, where `maxLen` is the max of left/right note array lengths.
- Highlights piano keys directly and emits `onNoteHighlight(noteIndex)` for notation.

Risk: playback loop length is array-length based, not visible-loop-unit based. It has no concept of measure completeness, display expansion, canonical event identity, or future score/MusicXML structures.

### Pattern Loader

`js/simplePatternLoader.js`:
- Loads pattern modules listed by `patterns/index.js`.
- Maintains the pattern registry.
- Duplicates note transposition helpers.
- Exposes `generateVexFlowNotation(patternId, key)` with separate `bassClef` and `trebleClef` note arrays.
- Owns VexFlow note and duration conversion helpers.

Risk: it is both a registry and a partial notation adapter, but not a canonical musical model. Playback bypasses its notation output.

### Notation Renderer

`js/staffNotationRenderer.js`:
- Calls `patternLoader.generateVexFlowNotation`.
- Expands patterns through `expandPattern()` to fill at least one measure.
- Groups note/timing streams into measures and fills incomplete measures with rests.
- Caps long output at `MAX_DISPLAY_MEASURES = 8`.
- Builds highlight maps from expanded indices modulo original cycle length.

Risk: it creates display events playback does not schedule. Highlighting maps to pattern positions instead of stable canonical event IDs.

### App Wiring

`index.html`:
- Instantiates `SimplePatternLoader`, `Player`, and the notation renderer separately.
- On play, calls `player.play(pattern, key)`.
- On render, calls `drawStaffNotation(patternLoader, settings)`.
- Bridges highlighting through `player.onNoteHighlight = highlightNotationNote`, using modulo maps.

Risk: the page has no shared resolved pattern/session object, so renderer and player cannot naturally consume identical data yet.

## Important Fixtures

### `patterns/lombardisch.js`

The source pattern has:
- `pattern: () => ['C3', 'G2', 'E3', 'C3']`
- `timing: [0.25, 0.75, 0.25, 0.75]`
- `timeSignature: '4/4'`

The source cycle totals 2 beats. Current notation expands to a complete 4/4 measure, but playback loops after the 4 source notes. Phase 1 should make both display and playback use one resolved loop unit. For Lombard, a musically valid default is a complete one-measure loop that repeats the 2-beat source material twice, unless pattern metadata later declares a different loop unit.

### `patterns/furelise.js`

This is a long score-like/native-key fixture:
- `nativeKey: 'Am'`
- `timeSignature: '3/8'`
- separate hands, rests, long timing array

Full display belongs mainly to Phase 2, but Phase 1 must preserve native-key metadata and avoid model choices that only work for short loops. Unsupported selected keys should become representable in the canonical result as an unsupported/native-key state, even if complete user-facing handling is deferred.

## Recommended Canonical Model Shape

Introduce a pure module such as `js/canonicalPatternResolver.js`. Exact names are planner discretion, but the module should have no DOM, Web Audio, or VexFlow dependency.

Recommended return shape:

- `patternId`
- `patternName`
- `selectedKey`
- `nativeKey`
- `isKeySupported`
- `timeSignature`
- `beatsPerMeasure`
- `loopUnitBeats`
- `displayMode` or `loopMode` metadata
- `events[]`

Each event should include:

- `id`: stable canonical ID, e.g. `event-0`
- `sourceIndex`: index in the original pattern source sequence when applicable
- `startBeat`
- `durationBeats`
- `measureIndex`
- `beatInMeasure`
- `hands`: object containing `left` and/or `right`
- hand payload with `notes`, `isRest`, `fingering`
- optional `tie` or split metadata if measure splitting is later represented here

Why this shape:
- Playback can schedule `events` by duration and hand payload.
- Notation can group `events` by measure and render syntactically complete loop units.
- Highlighting can use `event.id` instead of modulo-only note positions.
- Future MusicXML can adapt into the same event/score concept without executing arbitrary JS pattern modules.

## Loop Unit Strategy

The user wants per-pattern decisions and future MusicXML patterns may loop a whole file. Phase 1 should support these rules:

1. If a pattern later defines explicit loop metadata, honor it.
2. If no metadata exists and the source duration is shorter than one measure, expand to the first complete measure.
3. If the source duration is already one or more complete measures, use the source sequence as the loop unit.
4. If the source duration does not divide cleanly into a measure, preserve enough metadata to expose that as a correction/validation concern rather than hiding it.

This should make Lombard display and play one complete `4/4` measure by default.

## Transposition Strategy

Move the duplicated transposition helpers into the canonical resolver or a small pure helper module. Both current JS pattern adaptation and tests should call the same implementation. Do not leave one transposition path in `player.js` and another in `simplePatternLoader.js`.

Native-key patterns should not transpose. The resolver should call native-key functions with the selected key and return an unsupported result if the pattern returns no events for that key.

## Playback Integration

`Player` should stop resolving pattern arrays. It should accept a resolved sequence or receive a resolver dependency and key/pattern inputs, then schedule canonical events.

Planning options:

- Keep `player.play(pattern, key)` for compatibility, but internally call the resolver.
- Or update `index.html` to resolve once per selected pattern/key and call `player.play(sequence)`.

The second option is cleaner for ensuring notation and playback share the same object, but it touches app wiring. The first option is less invasive but risks accidental double-resolution unless carefully structured. Given the phase goal, the cleaner shared-object approach is preferable if scoped well.

`Player.onNoteHighlight` should receive a canonical event ID or event object, not just `noteIndex`.

## Notation Integration

`staffNotationRenderer` should render pattern previews from canonical events. The renderer may still own VexFlow-specific conversion, layout, and SVG creation, but it should no longer decide source expansion independently.

Immediate Phase 1 target:
- Keep simple pattern preview rendering.
- Replace `expandPattern()` authority with canonical `loopUnit` events.
- Map SVG note elements by canonical event ID.
- Keep full-score display and removal of `MAX_DISPLAY_MEASURES` primarily for Phase 2, but avoid hardening the current cap into the new model.

## Testing Strategy

There is no package/test setup. Phase 1 should introduce minimal JavaScript unit test tooling without changing static app runtime behavior.

Recommended:
- Add `package.json` with a test script.
- Use Node's built-in `node:test` runner if the pure resolver can run under Node ESM with no browser dependencies.
- Keep tests under `tests/` or `test/`.

High-value unit fixtures:
- Lombard resolves to a complete visible loop unit and playback event count matches notation event count.
- Transposition of a simple C pattern to flat/sharp keys matches existing expected notes.
- Rests and chords remain explicit in events.
- Native-key unsupported key returns a clear unsupported canonical result.
- Event IDs are stable and unique within the loop unit.

Browser smoke testing can remain later unless Phase 1 changes make it cheap.

## Risks And Mitigations

### Risk: Overbuilding a full score engine in Phase 1

Mitigation: model enough for future MusicXML, but only adapt current JS patterns and simple previews in this phase.

### Risk: Changing audible behavior unexpectedly

Mitigation: add tests for canonical event durations and verify existing major patterns still schedule the same musical material except where corrections are intentional.

### Risk: Renderer keeps old expansion path

Mitigation: plan acceptance criteria should explicitly remove or bypass `expandPattern()` as the source of loop-unit truth for preview mode.

### Risk: Highlighting remains modulo-based

Mitigation: pass canonical event IDs through player callbacks and renderer maps.

### Risk: Unit tooling disrupts static hosting

Mitigation: test tooling must be dev-only. `index.html` should continue importing app modules directly.

## Plan Implications

Recommended plan split:

1. Build and test the pure canonical resolver/model first.
2. Wire playback and notation to the canonical sequence, preserving sound and keyboard behavior.

Phase 1 can reasonably produce two plans: one for the resolver/tests foundation, one for integration into player/renderer/app wiring. The second should depend on the first.

## Research Complete

This research is sufficient for planning Phase 1.
