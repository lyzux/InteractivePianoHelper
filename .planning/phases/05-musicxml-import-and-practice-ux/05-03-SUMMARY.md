---
phase: 05-musicxml-import-and-practice-ux
plan: "03"
subsystem: musicxml-playback
tags: [musicxml, canonical-events, validation, playback-range, node-test]
requires:
  - phase: 05-musicxml-import-and-practice-ux
    provides: "05-02 strict MusicXML parser, inert imported source descriptors, and library registration boundary"
provides:
  - "Strict MusicXML-to-canonical score adapter with cursor, chord, rest, tie, measure, and page-layout mapping"
  - "MusicXML canonical measure/page validation layered on existing resolved sequence validation"
  - "Canonical Player.play(sequence, { loop, range }) support for measure and event ID ranges"
affects: [05-04-interactive-score-rendering, 05-05-practice-range-ux, musicxml-import, player]
tech-stack:
  added: []
  patterns:
    - "Pure ES module adapters with structured diagnostics"
    - "MusicXML-specific validation extends canonical checks without weakening pattern validation"
    - "Player range windows resolve to canonical event slices before scheduling"
key-files:
  created:
    - js/musicXmlCanonicalAdapter.js
    - tests/musicXmlCanonicalAdapter.test.js
    - tests/playerRange.test.js
  modified:
    - js/patternValidator.js
    - js/musicXmlAdapterContract.js
    - js/player.js
    - tests/canonicalPatternResolver.test.js
    - tests/scoreDisplayContract.test.js
key-decisions:
  - "MusicXML same-onset notes from backup/chord handling are merged into canonical events by beat, preserving hand payloads and tie metadata."
  - "MusicXML canonical validation allows sparse/polyphonic score timelines while preserving strict loop-duration checks for built-in patterns."
  - "Playback ranges are resolved once at play start into canonical event windows; no MusicXML-specific playback branch was added."
patterns-established:
  - "Adapter output must pass validateResolvedSequence plus validateMusicXmlCanonicalScore before accepted use."
  - "Player range inputs may use startMeasureNumber/endMeasureNumber or startEventId/endEventId."
requirements-completed: [XML-04, XML-05, PRAC-02]
duration: 7min
completed: 2026-05-15T14:23:11Z
---

# Phase 05 Plan 03: Canonical Adapter and Playback Mapping Summary

**Strict MusicXML canonical adapter with measure/page metadata and canonical event range playback**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-15T14:16:16Z
- **Completed:** 2026-05-15T14:23:11Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `js/musicXmlCanonicalAdapter.js` to convert strict parsed MusicXML documents into canonical score sequences with stable event IDs, measure metadata, page layout, chord/rest/tie handling, accidentals, clefs, key signatures, time signatures, backups, and forwards.
- Extended validation so MusicXML scores must pass both canonical event checks and MusicXML-specific measure/page consistency checks before acceptance.
- Extended `Player.play(sequence, { loop, range })` to start from measure or event ranges and loop within that canonical range without a MusicXML-only playback path.

## Task Commits

1. **Task 1: Add canonical adapter behavior tests** - `9744c25` (test)
2. **Task 2: Implement MusicXML canonical adapter and validation extensions** - `6913fd4` (feat)
3. **Task 3: Add canonical range/start playback support** - `ed62181` (test), `ecdd30a` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `js/musicXmlCanonicalAdapter.js` - Pure adapter from parsed MusicXML document trees to canonical score/event/measure/page data.
- `js/patternValidator.js` - Added MusicXML measure/page layout validation and sparse MusicXML loop coverage rules while preserving built-in pattern loop validation.
- `js/musicXmlAdapterContract.js` - Updated adapter version, required canonical fields, deferred features, and validator contract.
- `js/player.js` - Added canonical range resolution and range-aware scheduling/loop wrapping.
- `tests/musicXmlCanonicalAdapter.test.js` - Fixture coverage for durations, rests, chords, ties, accidentals, attributes, backup/forward cursor movement, measure layout, page layout, and unsupported multipart rejection.
- `tests/playerRange.test.js` - Direct Player coverage for full playback, measure ranges, event ID ranges, non-loop stop, and loop wrapping.
- `tests/canonicalPatternResolver.test.js` - Updated source-contract assertion for range-aware `Player.play`.
- `tests/scoreDisplayContract.test.js` - Updated source-contract assertion for range-aware `Player.play`.

## Decisions Made

- MusicXML same-onset notes are merged by canonical `startBeat` into one event with left/right hand payloads. This keeps backup/chord placement accurate and preserves the current event highlight contract.
- MusicXML score timelines may be sparse or polyphonic, so `validateResolvedSequence()` now keeps exact duration-sum enforcement for pattern sources and uses coverage-based loop validation for `sourceType: musicxml`.
- Range playback is canonical-only: the player resolves a range to `sequence.events` once, then schedules the resulting event window. It does not inspect MusicXML parser or adapter structures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected adapter fixture expectations for same-onset canonical grouping**
- **Found during:** Task 2
- **Issue:** The RED fixture initially expected backup-created left-hand notes to become separate later events, which conflicted with the canonical model's ordered same-onset event grouping and fatal-free validation requirement.
- **Fix:** Updated expectations to assert ordered start beats, merged hand payloads at beat 0, and measure event IDs that match the canonical event window.
- **Files modified:** `tests/musicXmlCanonicalAdapter.test.js`
- **Verification:** `node --test tests/musicXmlCanonicalAdapter.test.js tests/patternValidator.test.js tests/musicXmlAdapterContract.test.js`
- **Committed in:** `6913fd4`

**2. [Rule 1 - Bug] Updated source-contract tests for the new Player.play signature**
- **Found during:** Task 3
- **Issue:** Existing contract tests hard-coded `play(sequence, { loop = false } = {})`, causing `npm test` to fail after adding the planned `range` option.
- **Fix:** Updated the assertions to require `play(sequence, { loop = false, range = null } = {})`.
- **Files modified:** `tests/canonicalPatternResolver.test.js`, `tests/scoreDisplayContract.test.js`
- **Verification:** `npm test`
- **Committed in:** `ecdd30a`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were necessary to keep tests aligned with the canonical model and planned Player API. No scope expansion.

## Issues Encountered

- MusicXML score events can be sparse and polyphonic, unlike built-in loop patterns. This required a source-type-aware loop validation rule so imported scores validate by event coverage rather than by summing every event duration.

## Verification

- `node --check js/musicXmlCanonicalAdapter.js js/patternValidator.js js/musicXmlAdapterContract.js js/player.js` - passed.
- `node --test tests/musicXmlCanonicalAdapter.test.js tests/patternValidator.test.js tests/musicXmlAdapterContract.test.js` - passed, 19/19.
- `node --test tests/playerRange.test.js` - passed, 5/5.
- `npm test` - passed, 58/58.

## Known Stubs

None. Stub scan only found intentional empty/default values in constructors, test fixtures, and validation helpers.

## Threat Flags

None. The new untrusted-input and playback surfaces were already covered by the plan threat model and mitigated through strict adapter validation plus invalid/empty range rejection.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

05-04 can render imported MusicXML scores from canonical `events`, `measures`, and `pageLayout.measureLayout`, then hand range/start selections to the canonical player. Residual risk is visual/browser integration: the adapter is covered by Node fixtures, but score-page hit testing and imported-score UI still need 05-04/05-05 browser validation.

## Self-Check: PASSED

- Found created files: `js/musicXmlCanonicalAdapter.js`, `tests/musicXmlCanonicalAdapter.test.js`, `tests/playerRange.test.js`, `.planning/phases/05-musicxml-import-and-practice-ux/05-03-SUMMARY.md`.
- Found task commits: `9744c25`, `6913fd4`, `ed62181`, `ecdd30a`.

---
*Phase: 05-musicxml-import-and-practice-ux*
*Completed: 2026-05-15T14:23:11Z*
