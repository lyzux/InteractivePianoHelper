---
phase: 05-musicxml-import-and-practice-ux
plan: "05"
subsystem: ui
tags: [practice-controls, score-playback, auto-follow, playwright, vanilla-js]

requires:
  - phase: 05-04
    provides: interactive MusicXML and built-in score rendering with measure/event hooks
provides:
  - Accessible score measure range selection with Shift+click and range mode
  - Range-aware playback start and loop behavior through the existing Player path
  - Auto-follow pause/resume controls for playback scrolling
affects: [05-06, practice-ux, score-rendering, playback]

tech-stack:
  added: []
  patterns:
    - DOM controller modules with named factory exports
    - Browser smoke coverage for score practice interactions

key-files:
  created:
    - js/practiceRangeController.js
    - js/autoFollowController.js
    - tests/browser-smoke/practiceRangeControls.test.js
  modified:
    - index.html
    - css/styles.css
    - css/mobile.css
    - js/player.js
    - tests/canonicalPatternResolver.test.js
    - tests/scoreDisplayContract.test.js

key-decisions:
  - "Range mode is the accessible touch/keyboard alternative to Shift+click; plain click only selects ranges while range mode is active."
  - "Auto-follow pauses on manual scroll intent and resumes from the visible Resume follow control or playback restart."

patterns-established:
  - "Practice controllers consume renderer measureMap/event metadata instead of duplicating renderer layout logic."
  - "Selected ranges remain persistent UI state across Stop and are cleared only by Clear range or source changes."

requirements-completed: [XML-05, PRAC-01, PRAC-02, PRAC-03]

duration: 12min
completed: 2026-05-15
---

# Phase 05 Plan 05: Practice Range And Auto-Follow Summary

**Score measure selection with range-aware playback looping and pauseable auto-follow controls**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-15T14:41:31Z
- **Completed:** 2026-05-15T14:52:58Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `createPracticeRangeController()` for normalized measure ranges from renderer `measureMap` entries, with Shift+click, explicit Range mode, Clear range, and playback range output.
- Added `createAutoFollowController()` so playback can scroll the current measure/system, pause on manual scroll intent, and resume from a visible control or playback restart.
- Wired Play/Stop to pass `player.play(sequence, { loop, range })`, preserving full-score playback when no range is selected and selected-range looping when one is present.
- Added mint-green range styling (`#6ee7b7`) that remains distinct from amber playback note highlights.
- Added browser smoke coverage for Shift+click selection, range mode selection, range persistence after Stop, Clear range, playback range wiring, and auto-follow pause/resume.

## Task Commits

1. **Task 1 RED: Practice range smoke coverage** - `55890b7` (test)
2. **Tasks 1-3 GREEN: Practice range controls, playback wiring, and auto-follow** - `492f5e1` (feat)

_Note: The three TDD tasks share one GREEN implementation commit because the controller, playback, and auto-follow wiring overlap in the same app shell and smoke flow._

## Files Created/Modified

- `js/practiceRangeController.js` - Owns range state, Shift+click/range-mode selection, Clear range, DOM range classes, and `getPlaybackRange()`.
- `js/autoFollowController.js` - Owns playback-follow scrolling, manual-scroll pause state, and Resume follow.
- `js/player.js` - Resolves measure ranges for canonical sequences with or without explicit `sequence.measures`.
- `index.html` - Adds practice controls, imports the new controllers, passes playback ranges, and keeps selected ranges across Stop.
- `css/styles.css` - Adds practice control layout and mint-green range overlays/badges.
- `css/mobile.css` - Stacks new practice controls with 44px touch targets on mobile.
- `tests/browser-smoke/practiceRangeControls.test.js` - Covers practice range and auto-follow behavior in Chromium.
- `tests/canonicalPatternResolver.test.js` - Updates source contract assertion for `{ loop, range }` playback wiring.
- `tests/scoreDisplayContract.test.js` - Updates source contract assertion for `{ loop, range }` playback wiring.

## Decisions Made

- Range mode is the accessible non-Shift alternative because it preserves plain click for future note/event interactions while still working on touch and keyboard-triggered button clicks.
- Auto-follow listens for wheel/touch/scroll intent so the app does not fight manual navigation during playback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added measure fallback for built-in score playback ranges**
- **Found during:** Task 2 (range-aware playback)
- **Issue:** Imported MusicXML sequences already include `sequence.measures`, but built-in score sequences can rely only on event `measureIndex` metadata. Passing a selected range for those scores would otherwise fail range resolution.
- **Fix:** Added `Player._resolveMeasures()` to synthesize measure ranges from canonical events when explicit measures are absent.
- **Files modified:** `js/player.js`
- **Verification:** `npm test`, focused smoke, and `node --check js/player.js`
- **Committed in:** `492f5e1`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for the plan's built-in-score practice requirement; no scope expansion beyond range correctness.

## Issues Encountered

- Existing source-contract tests expected `player.play(sequence, { loop })`; they were updated to assert the new `player.play(sequence, { loop, range })` contract.
- The focused smoke command expands the existing package glob, so it also runs all browser-smoke files in addition to `practiceRangeControls.test.js`.

## Verification

- `node --check js/practiceRangeController.js js/staffNotationRenderer.js`
- `node --check js/player.js`
- `node --check js/autoFollowController.js js/staffNotationRenderer.js`
- `rg "Measures .* selected|Clear range|#6ee7b7|shiftKey|measureMap|systemIndex|pageNumber|Range mode|aria|44px" js/practiceRangeController.js js/staffNotationRenderer.js index.html css/styles.css css/mobile.css`
- `rg "getPlaybackRange|player.play\\(sequence, \\{ loop, range \\}\\)|Loop plays the selected range" index.html js/player.js`
- `rg "Auto-follow paused|Resume follow|scrollIntoView|manual|autoFollow|systemIndex|pageNumber" js/autoFollowController.js js/staffNotationRenderer.js index.html css/styles.css css/mobile.css`
- `npm run test:smoke -- tests/browser-smoke/practiceRangeControls.test.js`
- `npm test`

All verification passed.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- Found created files: `js/practiceRangeController.js`, `js/autoFollowController.js`, `tests/browser-smoke/practiceRangeControls.test.js`, and this summary.
- Found task commits: `55890b7` and `492f5e1`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 05-06 can add broader browser regression coverage on top of the practice controllers. Residual risk is limited to visual polish across very small mobile viewports; the smoke test proves behavior, not pixel-perfect layout.

---
*Phase: 05-musicxml-import-and-practice-ux*
*Completed: 2026-05-15*
