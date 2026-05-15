# Phase 1: Canonical Pattern Event Pipeline - Pattern Map

**Date:** 2026-05-15
**Status:** Ready for planning

## Purpose

Map the files likely to change in Phase 1 to existing local analogs and conventions so execution can follow the app's current shape while introducing the canonical event pipeline.

## Target Files And Analogs

| Target | Role | Closest Existing Analog | Notes |
|--------|------|-------------------------|-------|
| `js/canonicalPatternResolver.js` | Pure canonical resolver/model adapter | `js/simplePatternLoader.js` transposition and pattern resolution helpers | Should extract/adapt note resolution into a pure shared module with no DOM, VexFlow, or Web Audio dependency. |
| `js/player.js` | Playback consumer of canonical events | Existing `Player` scheduler in `js/player.js` | Preserve lookahead scheduling, `_visualTimeouts`, sustain handling, and piano highlight cleanup. Replace private `_resolveNotesP` path. |
| `js/staffNotationRenderer.js` | Notation consumer of canonical events | Existing renderer layout and VexFlow conversion flow | Keep VexFlow rendering mechanics, but stop treating `expandPattern()` as source-of-truth for loop units. |
| `js/simplePatternLoader.js` | Pattern registry and compatibility facade | Existing `SimplePatternLoader` class | Keep registry/dropdown behavior. It can expose resolved canonical data or delegate notation data generation to the canonical resolver. |
| `index.html` | Composition and shared resolved sequence wiring | Existing app boot and event handlers | Update wiring so notation and playback use the same resolved sequence per selected pattern/key. Preserve emergency fallback if touched. |
| `package.json` | Dev-only unit test entrypoint | No existing analog | Must not change static browser runtime. Use minimal scripts only. |
| `tests/canonicalPatternResolver.test.js` | Unit tests for pure resolver | No existing test analog | Prefer Node's built-in `node:test` if feasible. Tests should avoid DOM/Web Audio/VexFlow. |

## Existing Patterns To Preserve

### Static ES Module App

The browser imports files directly from `js/` using native ES modules and cache-busting query strings in `index.html`. New runtime modules should remain browser-compatible ES modules.

### Class-Based Service Instances

The app creates shared instances during initialization:

- `new AudioEngine()`
- `new Piano('piano', audioEngine)`
- `new Settings()`
- `new SimplePatternLoader()`
- `new Player(audioEngine, piano, settings)`

Do not introduce a framework or global state manager for Phase 1.

### Playback Cleanup

`Player.stop()` clears scheduler timers, visual timers, piano highlights, and playback state. Any refactor must preserve this cleanup path.

### Pattern Registry

`SimplePatternLoader.autoLoadPatterns()` imports IDs from `patterns/index.js` and registers pattern objects. Keep this mechanism until later phases introduce validated data or MusicXML adapters.

### VexFlow Boundary

`staffNotationRenderer.js` owns VexFlow-specific concerns: `VF.StaveNote`, `VF.Voice`, `VF.Formatter`, ties, dots, clef-specific rest anchors, and SVG highlight class application. The canonical resolver should not import or depend on VexFlow.

## Data Flow Target

Current:

1. `index.html` asks `SimplePatternLoader` for a pattern.
2. `Player` resolves notes privately and schedules raw arrays.
3. `staffNotationRenderer` asks `SimplePatternLoader.generateVexFlowNotation()` and expands/groups independently.
4. Highlighting maps `noteIndex % cycleLen`.

Target:

1. `index.html` or `SimplePatternLoader` resolves selected pattern/key to a canonical sequence.
2. `Player` schedules canonical events.
3. `staffNotationRenderer` renders canonical events.
4. Highlighting maps canonical event IDs.

## Concrete Fixtures

### Lombard

File: `patterns/lombardisch.js`

Use as the mismatch fixture. It should produce a complete visible loop unit and playback should schedule exactly that unit.

### Für Elise

File: `patterns/furelise.js`

Use as native-key/long-score pressure. Phase 1 does not need full score display, but the canonical resolver should represent native-key support and unsupported selected keys cleanly.

## Execution Cautions

- Do not remove sound generation paths in `js/audioEngine.js`.
- Do not redesign piano DOM/input behavior in `js/piano.js`.
- Do not implement MusicXML import in Phase 1.
- Do not rely on VexFlow or DOM APIs in pure resolver tests.
- Do not leave duplicate transposition implementations in both `player.js` and `simplePatternLoader.js` after the canonical resolver exists.
