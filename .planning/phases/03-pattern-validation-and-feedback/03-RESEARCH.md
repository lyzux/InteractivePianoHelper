# Phase 3: Pattern Validation And Feedback - Research

**Date:** 2026-05-15
**Phase:** 03-pattern-validation-and-feedback
**Status:** Complete

## Research Question

What needs to be true for Phase 3 to validate the current built-in pattern/piece data rigorously while preparing the same validation boundary for future MusicXML sources?

## Key Findings

### 1. Validation Should Be A Source Gate Plus A Canonical Sequence Gate

The current app has two meaningful boundaries:

- Source modules load through `patterns/index.js` and `SimplePatternLoader.autoLoadPatterns()`.
- Playback and notation consume resolved canonical sequences from `resolvePatternSequence()` / `resolvePatternSequenceForDisplay()`.

Phase 3 should validate both:

- **Source validation** catches malformed pattern modules before they enter the registry.
- **Canonical validation** catches musical/event invariants after a source has been adapted into playback/notation events.

This is especially important for future MusicXML. MusicXML will not look like the current JS pattern object, but it should still adapt into the same canonical sequence shape. A validator split between source diagnostics and canonical invariants lets future import code reuse the second half without coupling MusicXML to legacy pattern fields.

### 2. MusicXML Readiness Means Validating Musical Semantics, Not Just JS Shape

Official MusicXML 4.0 references show the future adapter will need to preserve concepts that already map well to the app's canonical model:

- MusicXML `<attributes>` carries divisions, key, time signature, clefs, and related measure-level information.
- MusicXML notes distinguish pitch, unpitched, and rest payloads; normal notes require duration, while grace notes are a special case.
- Durations are positive division units and advance musical position except for chord notes.
- A `<chord>` note is an additional tone of the preceding note and does not advance the measure position.
- Rests represent notated silence and may represent a full-measure rest.

Phase 3 does not parse MusicXML, but the validator should use these semantics as a design compass. The current app should validate note/rest/chord/duration/time-signature behavior in a way that later MusicXML input can produce equivalent diagnostics and canonical events.

Primary sources:

- https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/note/
- https://www.w3.org/2021/06/musicxml40/tutorial/midi-compatible-part/
- https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/duration/
- https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/chord/
- https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/rest/
- https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/attributes/

### 3. Current Source Risks

`js/simplePatternLoader.js` currently:

- Registers patterns without validation.
- Returns all loaded patterns as selector options.
- Silently swallows dynamic import errors in `autoLoadPatterns()`.
- Uses fallback pattern loading in `index.html` when automatic loading fails.

`js/canonicalPatternResolver.js` currently:

- Defaults missing/empty timing to `[1]`.
- Defaults invalid time signatures to `4/4` behavior through `beatsPerMeasure()`.
- Returns the original invalid note string from `transposeNote()` when `noteToMidi()` fails.
- Represents unsupported native-key selections as empty unsupported sequences.
- Throws only on runaway loop expansion.

These fallbacks were acceptable while stabilizing playback/display, but Phase 3 should convert the important ones into explicit validation outcomes so invalid data is rejected or repaired in source.

### 4. Existing Test Infrastructure Is Sufficient For This Phase

The repo now has a minimal `package.json` with:

```bash
npm test
```

which runs:

```bash
node --test tests/*.test.js
```

Existing tests already cover canonical resolver behavior and score display contracts. Phase 3 can extend this without a new framework. The highest-value tests should use:

- Existing production fixtures for valid coverage: `patterns/furelise.js`, `patterns/lombardisch.js`, chord/rest-heavy patterns.
- Deliberate malformed in-test fixture objects for negative validator cases.
- Source string assertions for lightweight UI wiring where full browser automation is not yet present.

### 5. UI Feedback Should Be Small And Deterministic

Phase 3 has a user-facing feedback requirement but should not redesign the app shell. The existing `index.html` pattern selector, `patternInfo`, and app boot flow are enough integration points for:

- Filtering invalid sources out of `getPatternOptions()`.
- Showing a small warning/failure notification after validation rejects one or more sources.
- Showing a clear empty state if no valid sources remain.
- Logging detailed diagnostics to the console.

A toast utility can be plain DOM code, not a library. Tests can assert the expected IDs/classes/functions and loader state behavior. A full browser smoke test is mapped to a later requirement (`TEST-02`) unless planning decides a narrow smoke is cheap.

## Recommended Implementation Shape

### New Validation Module

Create `js/patternValidator.js` or a similarly named pure module with:

- `validatePatternSource(pattern, { patternId, sourceType })`
- `validateResolvedSequence(sequence, { sourceId, sourceType })`
- `createDiagnostic({ code, severity, path, message, sourceId })`
- `isFatalDiagnostic(diagnostic)`

Suggested diagnostic fields:

- `sourceId`
- `sourceType`: initially `'pattern'`, future-ready for `'musicxml'`
- `severity`: `'error' | 'warning' | 'info'`
- `code`: stable string such as `PATTERN_REQUIRED_FIELD`, `NOTE_INVALID_NAME`, `TIMING_INVALID_VALUE`
- `path`: source path like `timing[3]`, `leftHand()[2]`, or canonical path like `events[7].hands.left.notes[0]`
- `message`

### Loader Integration

Update `SimplePatternLoader` so successful registration means "validated and playable/displayable enough for the app":

- Keep `patterns` for valid sources.
- Add a validation result store such as `validationResults` or `rejectedPatterns`.
- Make `registerPattern(id, pattern)` validate before adding to `patterns`.
- Make `autoLoadPatterns()` log import failures with IDs and module paths instead of silently swallowing them.
- Return enough summary data for `index.html` to notify the user when sources failed.
- Keep `getPatternOptions()` valid-only.

### Source Rules To Validate

Fatal source errors should include:

- Missing `name`.
- Missing or invalid `timing`.
- Missing playable source: none of `pattern`, `leftHand`, `rightHand`.
- Hand source exists but is not a function.
- Hand function returns neither an array nor `null` for supported authored key.
- Note value is neither `null`, a valid note string, nor an array of valid note strings.
- Note is outside the 88-key playable piano range.
- Timing value is non-numeric, non-positive, or unsupported by current renderer/playback.
- Time signature is invalid or unsupported.
- `nativeKey` source cannot resolve in its authored key.
- `loopUnitBeats` / `loopMeasures` values are invalid if present.
- Fingering entries are structurally incompatible with notes/chords when present.

Warnings can include:

- Missing optional `description`.
- Missing optional tempo metadata.
- Fingering arrays shorter than source content when the app can still render/play safely.
- Source lengths that require cyclic reuse but are musically allowed by explicit loop metadata.

### Canonical Sequence Rules To Validate

Fatal canonical errors should include:

- `sequence.isKeySupported !== true` for the authored display key.
- Empty `events`.
- Duplicate event IDs.
- Non-monotonic `startBeat`.
- Non-positive `durationBeats`.
- Invalid `measureIndex` / `beatInMeasure` relative to `beatsPerMeasure`.
- Event hand payload that is neither rest nor valid note/chord.
- Event total duration does not equal the resolved loop unit within tolerance.
- Notes outside playable range after transposition/resolution.

### UI Feedback Rules

Recommended minimal UI contract:

- A toast/status region exists in the app shell.
- When validation rejects sources, the user sees a concise message like "Some pieces failed verification and were not loaded."
- The message should not list raw stack traces or field paths.
- Console output includes detailed structured diagnostics grouped by source ID.
- The selector contains only valid sources.
- If all sources fail, play/notation controls stay safe and the score area shows a clear empty/error state.

## Suggested Plan Breakdown

### Plan 03-01: Validator Core And Tests

Build pure validation utilities and unit tests. Cover source-shape rules, note/range rules, timing/time-signature rules, fingering/chord/rest cases, and canonical sequence invariants.

### Plan 03-02: Loader Gate And Built-In Source Corrections

Integrate validation into `SimplePatternLoader`, make failed imports/validation visible to developer diagnostics, keep invalid entries out of selector options, and fix built-in patterns until all valid sources pass.

### Plan 03-03: User Feedback And Regression Contracts

Add the warning/failure toast or status region, empty-state handling, and contract tests for selector filtering, rejected-source notification, Lombard/Fuer Elise/chord/rest/native-key regressions, and `npm test`.

These plans can probably run mostly sequentially: loader integration depends on the validator API; user feedback depends on loader rejection summaries. Some test work can overlap once the validator API is stable, but the phase is small enough that a conservative sequence is safer.

## Validation Architecture

Phase 3 should validate along four dimensions:

1. **Source integrity:** each listed pattern module imports, exports the expected ID, and satisfies the required source contract.
2. **Musical payload:** notes, rests, chords, timing, time signatures, native keys, loop metadata, and fingering payloads are valid and within supported limits.
3. **Canonical event integrity:** resolved events are internally consistent and safe for both player and renderer.
4. **Feedback integrity:** fatal validation errors prevent user selection, surface a concise visible notification, and emit structured developer diagnostics.

Passing the phase means:

- All current built-in valid sources appear in the selector.
- Invalid test fixtures are rejected deterministically.
- No invalid pattern can reach playback or score rendering through the normal selector flow.
- `npm test` exits successfully.

## Planning Notes

- Do not change sound generation or piano keyboard behavior.
- Do not reintroduce key selection or content editing.
- Do not implement MusicXML import or filesystem persistence in this phase.
- Use ASCII filenames and code unless editing existing non-ASCII content such as `Für Elise` labels.
- Keep the runtime static-browser compatible.
- Prefer pure validator functions first; then wire them into loader/UI.

## RESEARCH COMPLETE
