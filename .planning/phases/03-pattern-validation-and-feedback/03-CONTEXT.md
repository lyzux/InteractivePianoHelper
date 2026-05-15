# Phase 3: Pattern Validation And Feedback - Context

**Gathered:** 2026-05-15T12:43:23+02:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase validates built-in pattern/piece data at load time and makes selected-pattern failures understandable without crashing playback or notation rendering. The validator should protect the shared canonical playback/notation contract from Phase 1 and the sheet-first score display direction from Phase 2. It should prepare the data boundary needed for future MusicXML import, but it does not implement MusicXML parsing, file picker import, local-library persistence, or MusicXML rendering.

</domain>

<decisions>
## Implementation Decisions

### MusicXML-Oriented Validation Boundary
- **D-01:** Validation should focus on the musical components required to load MusicXML professionally later: score identity/metadata, time signatures, playable notes and ranges, rests, chords, durations/timing values, hand/voice payloads, fingerings where present, native/authored key behavior, loop-unit boundaries, and canonical event consistency.
- **D-02:** The validator should check the current source pattern shape before registration and should also check the resolved canonical sequence invariants that playback and notation consume. This dual boundary keeps current built-ins safe while making the future MusicXML adapter target explicit.
- **D-03:** Validation output should be structured enough for future MusicXML import diagnostics: include pattern/source ID, severity, stable error/warning code, field path or event path, and human-readable message. Simple console strings alone are not enough.
- **D-04:** Phase 3 should not implement MusicXML import. However, validator names, result objects, and source abstractions should avoid assuming that every source will remain an executable JavaScript module.

### Invalid Pattern Handling
- **D-05:** Invalid patterns should be removed from the user selection list rather than left selectable in a broken state.
- **D-06:** When a pattern fails verification, the app should show a clear warning or failure toast so the user understands that something was rejected. Developer details should go to the console with source ID and exact diagnostic paths.
- **D-07:** Pattern import failures should no longer disappear silently. Missing or invalid modules should produce useful developer diagnostics while keeping the app bootable if at least one valid source remains.
- **D-08:** If no valid selectable pattern remains, the UI should show a clear empty/error state instead of crashing playback or notation rendering.

### Strictness And Source Quality
- **D-09:** Do not add compatibility workarounds merely to preserve invalid legacy content. Current built-in content should be corrected so it passes the validation contract.
- **D-10:** The preferred long-term direction is that real pieces become MusicXML-backed and legacy pattern source content is converted or replaced where that improves quality. Phase 3 should prepare for that direction, not cement the existing executable pattern format as permanent.
- **D-11:** Short pedagogical patterns may continue to exist for now only if they pass the stricter validated contract and adapt cleanly into the canonical score/event model.
- **D-12:** Warnings can exist for non-fatal quality concerns, but fatal validation errors should block a source from the selector. The planner should define severity categories deliberately rather than treating everything as a console-only warning.

### Validation Feedback UI
- **D-13:** The user-facing feedback should be brief and action-oriented: a warning/failure toast or similarly visible notification that a source failed verification and was not loaded.
- **D-14:** The active score area should not become a developer error dump. Detailed diagnostics belong in structured console output and tests.
- **D-15:** Validation feedback should preserve the existing strong sound generation, keyboard display, and button responsiveness. This phase should not redesign the sound engine or piano UI.

### Test Depth
- **D-16:** Add extensive tests where they make sense. Tests should cover both valid built-in fixtures and deliberate malformed fixtures.
- **D-17:** Test coverage should include required fields, invalid note names, out-of-range notes, rests, chords, timing values, time signatures, fingering length/shape assumptions, native-key/authored-key behavior, import failures, hidden invalid selector entries, and user-facing warning/failure feedback hooks.
- **D-18:** Regression tests should continue to cover Lombard rhythm, Fuer Elise, chords, rests, transposition, timing conversion, measure grouping, validation, and unsupported native keys.
- **D-19:** Tests should assert structured diagnostic codes/paths where practical so future MusicXML validation can reuse the same verification style.

### Future Library Picker Direction
- **D-20:** The future product model is a small library of preselected pieces as the initial/default state. Clearing browser cache should return the app to that built-in default library.
- **D-21:** Later MusicXML files loaded through a filesystem picker should be persisted locally, added to the selectable options, remembered across sessions, and removable by the user.
- **D-22:** Phase 3 should not build that library/import UI, but validation should assume there will later be multiple source types: built-in validated sources now, user-imported MusicXML sources later.

### Folded Todos
- **D-23:** Folded todo: `Harden notation playback contract` from `.planning/todos/pending/2026-05-14-harden-notation-playback-contract.md`. Its remaining Phase 3 slice is validation around required fields, note ranges, rests, timing values, time signatures, native-key behavior, and cyclic length assumptions. The earlier playback/display portions were already handled by Phase 1 and Phase 2.

### the agent's Discretion
- Choose the exact diagnostic code taxonomy, severity names, and module boundaries, provided they support both current pattern validation and a future MusicXML adapter.
- Choose the toast/notification implementation that best fits the existing vanilla JS app without creating a heavy UI framework dependency.
- Choose how much validation lives before registration versus after canonical sequence resolution, provided fatal invalid sources are kept out of the user selector.
- Choose the smallest sensible test harness additions needed for the validation and UI feedback contracts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` — Core value, constraints, and explicit focus on validation, notation trust, and future MusicXML support while preserving sound and keyboard behavior.
- `.planning/REQUIREMENTS.md` — Phase 3 requirement IDs VAL-01, VAL-02, VAL-03, and TEST-01; MusicXML readiness requirements XML-01/XML-02 for future compatibility.
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, dependencies, and the later Phase 4/999.1 MusicXML boundaries.
- `.planning/STATE.md` — Current project state, residual risk that executable pattern data remains under-validated, and the future MusicXML adapter target.
- `.planning/todos/pending/2026-05-14-harden-notation-playback-contract.md` — Folded source todo for validation hardening and remaining MusicXML-readiness concerns.
- `CLAUDE.md` — Project overview, current architecture notes, and the user's evaluation/preferences around sound, keyboard, notation robustness, validation, and MusicXML direction.

### Prior Phase Artifacts
- `.planning/phases/01-canonical-pattern-event-pipeline/01-CONTEXT.md` — Locked decisions about playback/display agreement, complete visible loop units, canonical events, MusicXML readiness, and unit tests.
- `.planning/phases/01-canonical-pattern-event-pipeline/01-VERIFICATION.md` — Confirms canonical event sequence and event-ID highlight bridge are in place.
- `.planning/phases/02-score-display-modes/02-CONTEXT.md` — Locked decisions about sheet-first display, A4 page layout, optional loop control, authored-key display, and no key-editing product path.
- `.planning/phases/02-score-display-modes/02-VERIFICATION.md` — Confirms score display implementation state and residual risks after Phase 2.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — App composition, pattern data layer, loader/notation adapter layer, error handling, and current implicit validation weakness.
- `.planning/codebase/CONCERNS.md` — Known fragility around executable pattern data, invalid notes/timing, and future MusicXML complexity.
- `.planning/codebase/STRUCTURE.md` — Source layout and likely module locations for validation, loader integration, and tests.
- `.planning/codebase/TESTING.md` — Existing and recommended test fixture strategy; note this map predates the current `tests/` folder and should be interpreted with current source.

### Source Touchpoints
- `js/simplePatternLoader.js` — Pattern registry and dynamic import path; currently registers patterns without validation and silently swallows failed imports.
- `js/canonicalPatternResolver.js` — Pure resolver and canonical sequence adapter; currently has implicit fallbacks that validation should make explicit.
- `js/staffNotationRenderer.js` — Score renderer that consumes resolved notation/sequence data and should receive only valid renderable sources.
- `js/player.js` — Playback scheduler that should receive only valid canonical sequences and stay protected from invalid source data.
- `index.html` — App composition, pattern selector population, pattern info/feedback area, play/stop wiring, and likely toast/notification integration point.
- `patterns/index.js` — Built-in manifest; validation should ensure listed sources either pass and appear in selection or fail with diagnostics.
- `patterns/furelise.js` — Score-like authored-key fixture for longer complete piece validation.
- `patterns/lombardisch.js` — Short-loop regression fixture for canonical loop-unit validation.
- `tests/canonicalPatternResolver.test.js` — Existing Node unit coverage for resolver behavior and key display contracts.
- `tests/scoreDisplayContract.test.js` — Existing contract tests for score display and UI structure.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolvePatternSequence()` in `js/canonicalPatternResolver.js` is pure and already Node-testable. It is the right place to validate resolved event invariants or to share note/time helpers with a separate validator.
- `SimplePatternLoader` in `js/simplePatternLoader.js` is the natural gate for source validation because it owns dynamic imports, registration, selector options, and the bridge into canonical sequence resolution.
- Existing `tests/` files already use Node's built-in test runner and source-level assertions. Phase 3 can extend this setup without adding a large framework.
- `index.html` already owns user-facing pattern selection and fallback display; it can surface concise validation failure feedback while console diagnostics remain developer-facing.

### Established Patterns
- The app remains vanilla ES modules and static-hosted. Validation should avoid requiring a backend or build step for runtime use.
- Built-in sources currently come from `patterns/index.js` and dynamic `import()`. Phase 3 should preserve static serving while making import/validation failures visible.
- Playback and notation already share canonical sequences after Phase 1. Validation should guard that shared contract rather than creating a parallel interpretation path.
- Phase 2 removed active key-changing from the product path. Validation should treat authored/native keys as source truth and avoid reintroducing key editing.

### Integration Points
- Add a validation gate before `registerPattern()` succeeds, and retain enough failure records for console reporting and user notification.
- Populate the pattern selector only from valid sources.
- Ensure `resolvePatternSequenceForDisplay()` and play/notation calls handle missing or rejected patterns gracefully.
- Add structured validation fixtures under `tests/` and use malformed local test objects rather than mutating production pattern files for negative cases.
- Consider a small validation result API that can later accept `sourceType: 'pattern' | 'musicxml'` without changing the app shell again.

</code_context>

<specifics>
## Specific Ideas

- Invalid sources should be kept out of the selector, with a visible warning/failure toast.
- Current content should be fixed to pass validation rather than given exceptions.
- The validator should be extensive enough to matter, but still scoped to the current phase and tests that make practical sense.
- Future default state should be a small built-in library of pieces/options.
- Future imported MusicXML files should become remembered local library entries and be removable by the user.
- MusicXML page fidelity remains important: future loaded MusicXML should be depicted accurately rather than treated as flowing responsive text.

</specifics>

<deferred>
## Deferred Ideas

- MusicXML filesystem picker, local persistence of imported files, remembered user library entries, and removal controls are future MusicXML/library features, not Phase 3 implementation scope.
- Replacing all current source content with MusicXML is a future migration decision. Phase 3 may correct or validate current built-ins but should not perform a wholesale MusicXML conversion.
- Full MusicXML parser/renderer selection remains future work under MusicXML foundation/import phases.

</deferred>

---

*Phase: 3-Pattern Validation And Feedback*
*Context gathered: 2026-05-15T12:43:23+02:00*
