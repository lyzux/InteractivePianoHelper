# Phase 03 Pattern Map

**Phase:** 03 - Pattern Validation And Feedback
**Purpose:** Existing code patterns and analogs for validation planning/execution.

## Files To Create Or Modify

| Target | Role | Closest Existing Analog | Notes |
|--------|------|-------------------------|-------|
| `js/patternValidator.js` | Pure validation module | `js/canonicalPatternResolver.js` | Keep DOM/Web Audio/VexFlow-free and Node-testable. Export named pure functions. |
| `js/canonicalPatternResolver.js` | Canonical event validation helper integration | `js/canonicalPatternResolver.js` | Existing note helpers and resolver output shape are source of truth. Validation should make implicit fallbacks explicit without breaking resolver consumers. |
| `js/simplePatternLoader.js` | Validation gate and rejected-source registry | `js/simplePatternLoader.js` | Natural boundary for dynamic imports, registration, selector options, and validation summaries. |
| `index.html` | Validation notification and safe empty state | Existing `patternInfo`, `setupEmergencyFallback()`, `populatePatternDropdown()`, `handlePlayStop()` | Keep UI changes small. No framework, no sound/piano redesign. |
| `css/styles.css` / `css/mobile.css` | Notification styling | `.pattern-info`, `.score-empty`, `.pedal-control` | Use existing colors/spacing; avoid changing score page, keyboard, or sound panel layout. |
| `patterns/*.js` | Source data corrections | Current pattern modules | Fix data to pass strict validation instead of adding validator exceptions. |
| `tests/patternValidator.test.js` | Source and canonical validator tests | `tests/canonicalPatternResolver.test.js` | Use Node `node:test` and malformed in-test fixtures. |
| `tests/simplePatternLoaderValidation.test.js` | Loader gate tests | `tests/scoreDisplayContract.test.js` | Source-level and class-behavior assertions are appropriate. |
| `tests/validationFeedbackContract.test.js` | UI feedback contract tests | `tests/scoreDisplayContract.test.js` | Read `index.html`/CSS source and assert stable IDs/copy/classes. |

## Established Code Patterns

- Use named ES module exports and four-space indentation.
- Keep pure domain logic in `js/` modules and test with Node's built-in runner.
- Loader methods return plain objects, arrays, maps, or `null`; avoid framework state.
- Existing UI composition lives in `index.html`; small DOM helpers are acceptable there.
- Existing tests use `node:test`, `node:assert/strict`, and `fs.readFileSync()` for source contracts.

## Relevant Existing Snippets

### Pure Resolver Shape

`js/canonicalPatternResolver.js` exports pure helpers such as:

- `noteToMidi(note)`
- `transposeNote(note, semitones, preferFlats)`
- `beatsPerMeasure(timeSignature)`
- `resolvePatternSequence(pattern, options)`

Validation should reuse or extend these helpers instead of duplicating note parsing.

### Loader Gate Location

`js/simplePatternLoader.js` currently contains:

- `registerPattern(id, pattern)` -> direct `Map` insertion.
- `getPatternOptions()` -> every loaded pattern becomes selectable.
- `autoLoadPatterns()` -> catches import failures silently.

Phase 03 should change successful registration to mean "verified enough for selector/playback/rendering."

### UI Feedback Location

`index.html` currently owns:

- `populatePatternDropdown()`
- `updatePatternInfo()`
- `handlePlayStop()`
- `setupEmergencyFallback()`

The validation notification should be integrated here with a single status region. Avoid putting diagnostics inside score pages.

## Implementation Landmines

- Do not add a second musical interpretation path. Validation should guard the canonical event path.
- Do not make invalid legacy source pass by weakening validation. Correct source data where needed.
- Do not show diagnostic field paths or JSON to the user. Keep those in console/test assertions.
- Do not reintroduce key selection or content editing.
- Do not implement MusicXML import, local file picker, or persisted user library in this phase.
- Do not change sound generation, piano keyboard behavior, A4 score scaling, sound panel expansion, or bottom keyboard expansion.
