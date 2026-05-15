---
phase: 01-canonical-pattern-event-pipeline
plan: "02"
subsystem: playback-notation
tags: [canonical-events, playback, notation, highlighting, vexflow]
requires:
  - phase: 01-canonical-pattern-event-pipeline
    provides: Pure canonical resolver and SimplePatternLoader bridge
provides:
  - Playback scheduling from canonical event sequences
  - Notation rendering from canonical event sequences
  - Event-ID-based notation highlight bridge
  - Integration-facing canonical resolver tests
affects: [playback, notation, validation, musicxml-readiness, score-display]
tech-stack:
  added: []
  patterns: [canonical-sequence-consumer, event-id-highlighting]
key-files:
  created: []
  modified:
    - index.html
    - js/player.js
    - js/staffNotationRenderer.js
    - tests/canonicalPatternResolver.test.js
key-decisions:
  - "Resolve selected pattern/key once in app wiring and pass that canonical sequence to both notation and playback."
  - "Playback loops after the canonical event list, not after independently resolved raw note arrays."
  - "Notation highlighting is keyed by canonical event ID instead of modulo pattern indices."
patterns-established:
  - "App state stores the current canonical sequence as the shared contract between renderer and player."
  - "Renderer builds hand streams from canonical event payloads and returns eventMap for SVG highlighting."
  - "Player emits onNoteHighlight(event.id, event) for synchronized notation highlights."
requirements-completed: [phase-01, MODEL-01, MODEL-02, MODEL-03, SYNC-01]
duration: 25 min
completed: 2026-05-15
---

# Phase 01 Plan 02: Playback And Notation Consume Canonical Events Summary

**Playback, notation, and highlight coordination now share the same canonical pattern event sequence**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-15T09:38:00+02:00
- **Completed:** 2026-05-15T10:02:45+02:00
- **Tasks:** 5
- **Files modified:** 4

## Accomplishments

- Updated `index.html` to maintain `currentPatternSequence` from `patternLoader.resolvePatternSequence(patternId, key)` and pass that same sequence to notation and playback.
- Refactored `Player` to schedule directly from canonical `events`, including rests, chords, hand payloads, event durations, and loop boundary reset.
- Refactored `drawStaffNotation` to render preview measures from canonical events instead of local preview expansion logic.
- Replaced modulo-based notation highlight lookup with canonical event ID maps.
- Extended resolver tests for loop duration, event ID map stability, event order, rests, chords, and unsupported native-key results.

## Task Commits

Each task was committed atomically where file ownership allowed it:

1. **Task 1: Resolve selected pattern/key once in app wiring** - `d9f3560` (feat)
2. **Task 2: Schedule playback from canonical events** - `d81187f` (feat)
3. **Task 3: Render notation from canonical events** - `2ed507b` (feat)
4. **Task 4: Update notation highlight bridge to event IDs** - covered across `d9f3560`, `d81187f`, and `2ed507b`
5. **Task 5: Extend tests for integration-facing resolver guarantees** - `c4ec5a9` (test)

## Files Created/Modified

- `index.html` - Stores the current canonical sequence, prevents playback for unsupported/empty sequences, and highlights notation by canonical event ID.
- `js/player.js` - Schedules playback from canonical event payloads and emits event IDs for notation highlights.
- `js/staffNotationRenderer.js` - Builds VexFlow measure data from canonical event hand streams and returns an event highlight map.
- `tests/canonicalPatternResolver.test.js` - Adds integration-facing assertions for loop totals, event ordering, and event ID map stability.

## Decisions Made

- Kept full-score display and MusicXML import out of Phase 1; the canonical model remains the adapter target for later phases.
- Left the existing VexFlow rendering surface in place and changed its input contract instead of redesigning notation layout.
- Treated Lombard as one complete canonical `4/4` preview loop: 8 events totaling 4 beats.

## Deviations from Plan

None - plan executed as specified. Task 4 was necessarily implemented across the app wiring, player callback, and renderer return-map changes rather than as a standalone file-only commit.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** None.

## Issues Encountered

- A new event-order test initially expected Lombard source indices to alternate modulo 2. The canonical resolver preserves the 4-item source cycle and expands it twice, so the test was corrected to assert modulo 4.
- Manual browser smoke was deferred to the final static-server step after documentation/state updates; automated unit and syntax verification passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 2. The app now has a shared event contract that Phase 2 can use to separate compact pattern previews from full score display, including Für Elise-style native-key material and longer notation surfaces.

## Self-Check: PASSED

- `npm test` passed.
- `node --check js/player.js` passed.
- `node --check js/staffNotationRenderer.js` passed.
- `rg "expandedIdx|expandPattern|noteIndex %|leftLen|rightLen|_SHARP_P|_resolveNotesP|leftHandNotes|rightHandNotes|currentTiming" index.html js/player.js js/staffNotationRenderer.js` returned no matches.

---
*Phase: 01-canonical-pattern-event-pipeline*
*Completed: 2026-05-15*
