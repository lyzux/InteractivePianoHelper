---
phase: 05-musicxml-import-and-practice-ux
plan: "06"
subsystem: testing
tags: [musicxml, playwright, node-test, browser-smoke, documentation]

requires:
  - phase: 05-musicxml-import-and-practice-ux
    provides: MusicXML import, storage, rendering, playback, range selection, and auto-follow UX from plans 05-01 through 05-05
provides:
  - Shared accepted and unsupported MusicXML fixtures
  - Fixture-backed parser and canonical adapter regression coverage
  - End-to-end browser smoke for import, persistence, rendering, range playback, auto-follow, cleanup, removal, and built-in score practice
  - README usage notes for static browser-only MusicXML import and practice
affects: [musicxml-import, practice-ux, regression-safety, documentation]

tech-stack:
  added: []
  patterns: [fixture-backed MusicXML regressions, Playwright static browser smoke without SVG snapshots]

key-files:
  created:
    - tests/fixtures/tiny-score.musicxml
    - tests/fixtures/unsupported-score.musicxml
    - tests/browser-smoke/musicXmlImportPractice.test.js
  modified:
    - js/musicXmlParser.js
    - tests/musicXmlParser.test.js
    - tests/musicXmlCanonicalAdapter.test.js
    - README.md

key-decisions:
  - "Use shared MusicXML fixture files as the source of parser, adapter, and browser smoke truth."
  - "Reject unsupported MusicXML measure children during parse validation so unsupported imports cannot reach registration or playback."
  - "Browser smoke asserts DOM state, controls, highlights, and persistence rather than full SVG serialization."

patterns-established:
  - "MusicXML fixtures live under tests/fixtures and are consumed by both Node and browser smoke tests."
  - "Integrated browser smoke clears browser-local storage, uploads fixtures, verifies persistence, and exercises practice behavior end to end."

requirements-completed: [XML-03, XML-04, XML-05, PRAC-01, PRAC-02, PRAC-03]

duration: 8min
completed: 2026-05-15
---

# Phase 05 Plan 06: Browser Smoke And Regression Coverage Summary

**Fixture-backed MusicXML import regressions plus integrated static-browser practice workflow smoke**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-15T14:56:32Z
- **Completed:** 2026-05-15T15:04:15Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added accepted and unsupported MusicXML fixtures covering page hints, key/time/clef attributes, rests, chords, ties, backup/forward cursor movement, and strict unsupported-feature rejection.
- Strengthened Node parser and canonical adapter tests to load shared fixtures and assert strict diagnostics, canonical event order, measure metadata, page layout, and `validateResolvedSequence()` compatibility.
- Added an integrated Playwright smoke for unsupported import details, accepted import, duplicate suffixing, reload persistence, score SVG/page hooks, imported range loop playback, auto-follow pause/resume, stop cleanup, imported removal, and built-in score range behavior.
- Updated README with accurate static browser-only MusicXML import and practice notes, including local origin storage limits and deferred feature boundaries.

## Task Commits

1. **Task 1: Add shared MusicXML fixtures and strengthen Node regressions** - `914136b` (test), `a444a89` (feat)
2. **Task 2: Add end-to-end browser smoke for import and practice** - `5759a3d` (test), `7eeb287` (test)
3. **Task 3: Document Phase 5 import and practice usage** - `4f811de` (docs)

## Files Created/Modified

- `tests/fixtures/tiny-score.musicxml` - Accepted MusicXML fixture for parser, adapter, and browser import coverage.
- `tests/fixtures/unsupported-score.musicxml` - Unsupported strict-import fixture with a rejected `direction` element.
- `tests/musicXmlParser.test.js` - Fixture-backed strict parser diagnostics and imported loader boundary coverage.
- `tests/musicXmlCanonicalAdapter.test.js` - Fixture-backed canonical mapping, validator, page layout, and unsupported rejection coverage.
- `tests/browser-smoke/musicXmlImportPractice.test.js` - Full Phase 5 import and practice browser workflow smoke.
- `js/musicXmlParser.js` - Strict measure-child validation for unsupported MusicXML elements.
- `README.md` - User-facing import, storage, removal, range looping, and auto-follow notes.

## Decisions Made

- Used shared fixture files instead of inline XML so parser, adapter, and browser tests exercise the same accepted/rejected source data.
- Added parser-level unsupported-element diagnostics for strict import, rather than relying only on the canonical adapter to reject unsupported measure children.
- Kept browser assertions structural and behavioral: selectors, details text, score page/SVG presence, event hooks, range classes, playback debug state, auto-follow status, active key cleanup, and library entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added parser-level unsupported element rejection**
- **Found during:** Task 1
- **Issue:** The unsupported fixture exposed that `parseMusicXmlText()` accepted unsupported measure children even though the adapter later rejected them.
- **Fix:** Added strict measure-child validation in `js/musicXmlParser.js` with `MUSICXML_ELEMENT_UNSUPPORTED` diagnostics.
- **Files modified:** `js/musicXmlParser.js`
- **Verification:** `node --test tests/musicXmlParser.test.js tests/musicXmlCanonicalAdapter.test.js`
- **Committed in:** `a444a89`

**2. [Rule 1 - Bug] Stabilized range selection in integrated smoke after reload**
- **Found during:** Task 2 full smoke verification
- **Issue:** The new integrated smoke could click range targets while the reloaded score layout was still settling, causing a transient missing playback range.
- **Fix:** Waited for measure targets to settle, dispatched explicit Shift-click events, and asserted the selected range remains available before playback.
- **Files modified:** `tests/browser-smoke/musicXmlImportPractice.test.js`
- **Verification:** `npm run test:smoke -- tests/browser-smoke/musicXmlImportPractice.test.js` and `npm run test:smoke`
- **Committed in:** `7eeb287`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes strengthened the required regression coverage and strict import guarantee without adding product scope.

## Issues Encountered

- Task 2 was coverage-only: the first integrated smoke implementation passed against current app behavior, then the full smoke run exposed a timing race that was resolved inside the test harness.
- `npm run test:smoke -- tests/browser-smoke/musicXmlImportPractice.test.js` currently runs the configured smoke glob plus the explicit file argument, so the full smoke suite runs during that focused command.

## Verification

- `node --test tests/musicXmlParser.test.js tests/musicXmlCanonicalAdapter.test.js` - PASS, 19 tests.
- `npm run test:smoke -- tests/browser-smoke/musicXmlImportPractice.test.js` - PASS, 6 browser smoke tests.
- `npm test` - PASS, 60 Node tests.
- `npm run test:smoke` - PASS, 6 browser smoke tests.

## Known Stubs

None found in the files created or modified for this plan.

## Threat Flags

None. This plan added test fixtures, test coverage, README documentation, and stricter parser validation; it did not add new runtime network endpoints, auth paths, file access patterns, or schema trust boundaries beyond the already-planned browser fixture upload surface.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 5 now has end-to-end regression coverage for the static browser MusicXML import and practice workflow. Residual risk before phase verification is visual engraving fidelity for arbitrary real-world MusicXML files; current tests deliberately avoid brittle full SVG snapshots and cover the supported strict subset instead.

## Self-Check: PASSED

- Found created files: `tests/fixtures/tiny-score.musicxml`, `tests/fixtures/unsupported-score.musicxml`, `tests/browser-smoke/musicXmlImportPractice.test.js`, and this summary.
- Found task commits: `914136b`, `a444a89`, `5759a3d`, `7eeb287`, and `4f811de`.

---
*Phase: 05-musicxml-import-and-practice-ux*
*Completed: 2026-05-15*
