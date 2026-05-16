---
phase: 07-osmd-production-score-rendering
plan: "01"
subsystem: notation
tags: [musicxml, osmd, svg, notation, playback-sync]

requires:
  - phase: 06-professional-musicxml-renderer
    provides: OSMD facade contract and renderer decision
provides:
  - Production imported MusicXML rendering through the OSMD facade
  - Full-page score wrapper and notestand scaling for OSMD pages
  - Canonical measure/event bridge needed by practice smoke coverage
affects: [phase-07, musicxml, practice-range, auto-follow, notation-renderer]

tech-stack:
  added: []
  patterns: [async-render-token, osmd-facade, canonical-dom-bridge]

key-files:
  created:
    - .planning/phases/07-osmd-production-score-rendering/07-01-SUMMARY.md
  modified:
    - js/musicXmlScoreRenderer.js
    - js/professionalMusicXmlRenderer.js
    - js/practiceRangeController.js
    - index.html
    - css/styles.css
    - css/mobile.css

key-decisions:
  - "Imported MusicXML now fails through OSMD rather than silently falling back to the simplified VexFlow reconstruction."
  - "OSMD-generated staff and fragment DOM is grouped back onto canonical measures before practice controls see it."
  - "Score pages are scaled as complete SVG pages inside the notestand instead of reflowing MusicXML into app-owned systems."

patterns-established:
  - "MusicXML render results expose renderer methods such as clearHighlights(), highlightEvents(), setRange(), and clearRange()."
  - "The app shell treats MusicXML rendering as async and ignores stale render promises with a render token."
  - "Practice range classes are applied across grouped measure elements while keeping one hit target per canonical measure."

requirements-completed: [XML-09, XML-10, TEST-04]

duration: 52min
completed: 2026-05-16
---

# Phase 07 Plan 01 Summary

**Imported MusicXML now renders through OSMD as full score pages with canonical measure targets and async-safe app wiring**

## Performance

- **Duration:** 52 min
- **Started:** 2026-05-16T15:34:00+02:00
- **Completed:** 2026-05-16T16:26:27+02:00
- **Tasks:** 3
- **Files modified:** 6 production files plus this summary

## Accomplishments

- Replaced the production imported-score display path with `ProfessionalMusicXmlRenderer` while preserving the old VexFlow path for built-in teaching patterns.
- Configured OSMD for SVG page rendering with credits/title/composer, XML page/system breaks, A4 page behavior, and cursor availability.
- Added page wrappers and scale variables so OSMD pages behave like a fixed score page inside the responsive notestand.
- Added canonical measure/event mapping early enough for the practice smoke to verify range selection, playback highlighting, and auto-follow on OSMD output.

## Task Commits

1. **Tasks 1-3: OSMD production renderer, page scaling, and practice-compatible mapping** - `c4729ab` (feat)

**Plan metadata:** pending in this summary commit

## Files Created/Modified

- `js/musicXmlScoreRenderer.js` - App-owned imported-score entry point now creates, reuses, destroys, and normalizes the OSMD renderer facade.
- `js/professionalMusicXmlRenderer.js` - OSMD lifecycle, page wrappers, canonical measure/event maps, highlight/range APIs, and diagnostics.
- `js/practiceRangeController.js` - Range class handling now supports grouped renderer measure elements.
- `index.html` - MusicXML rendering is async-safe and uses renderer highlight cleanup APIs.
- `css/styles.css` - Score notestand no longer exposes horizontal clipping and uses page dimension variables.
- `css/mobile.css` - Narrow layouts use the same page dimension variables for one-column score pages.

## Decisions Made

- Kept OSMD as the only production renderer for imported MusicXML; renderer failures now surface as failures instead of reconstructing a simplified score.
- Used canonical sequence measures/events as the app contract, because OSMD emits multiple SVG groups for staves and fragments that should not become separate practice measures.
- Preserved static-hosting behavior by loading the installed OSMD bundle from `node_modules` through the same browser-only facade.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added part of the canonical mapping bridge during Plan 01**
- **Found during:** Task 3 verification (`musicXmlImportPractice.test.js`)
- **Issue:** OSMD exposes multiple `g.vf-measure` groups for one musical measure, so the practice smoke saw six SVG groups for the two-measure tiny fixture.
- **Fix:** Grouped OSMD DOM back onto canonical measures and assigned canonical event IDs before practice controls consume the map.
- **Files modified:** `js/professionalMusicXmlRenderer.js`, `js/practiceRangeController.js`
- **Verification:** `npm run test:smoke -- tests/browser-smoke/musicXmlImportPractice.test.js`
- **Committed in:** `c4729ab`

---

**Total deviations:** 1 auto-fixed blocking issue
**Impact on plan:** This pulled a necessary part of Plan 02 forward so Plan 01's own practice smoke could pass. It reduces remaining Plan 02 risk rather than expanding scope.

## Issues Encountered

- The OSMD DOM does not present a one-to-one app measure model. The facade now treats OSMD DOM as renderer output and the canonical sequence as the learning/playback contract.

## User Setup Required

None - no external service configuration required.

## Verification

- `node --check js/musicXmlScoreRenderer.js`
- `node --check js/professionalMusicXmlRenderer.js`
- `node --check js/practiceRangeController.js`
- `node --test tests/professionalMusicXmlRenderer.test.js`
- `npm run test:smoke -- tests/browser-smoke/musicXmlImportUi.test.js`
- `npm run test:smoke -- tests/browser-smoke/professionalMusicXmlRenderer.test.js`
- `npm run test:smoke -- tests/browser-smoke/musicXmlImportPractice.test.js`

## Next Phase Readiness

Plan 02 can focus on strengthening mapping diagnostics, chord/voice coverage, and expanded fixture gates rather than first proving that OSMD can participate in playback and practice controls.

---
*Phase: 07-osmd-production-score-rendering*
*Completed: 2026-05-16*
