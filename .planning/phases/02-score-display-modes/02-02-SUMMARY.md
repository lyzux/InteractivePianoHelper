---
phase: "02"
plan: "02"
subsystem: "score page renderer"
tags: ["notation", "layout", "vexflow", "tests"]
requires: ["02-01"]
provides: ["a4-score-pages", "full-score-rendering", "paged-event-highlights"]
affects: ["index.html", "js/staffNotationRenderer.js", "css/styles.css", "css/mobile.css", "tests/scoreDisplayContract.test.js"]
tech-stack:
  added: []
  patterns: ["vexflow-svg", "pure-layout-helpers", "node-test"]
key-files:
  created:
    - "tests/scoreDisplayContract.test.js"
  modified:
    - "index.html"
    - "js/staffNotationRenderer.js"
    - "css/styles.css"
    - "css/mobile.css"
key-decisions:
  - "The renderer now plans full canonical scores into A4-like pages instead of capping at eight measures."
  - "One VexFlow SVG is rendered per score page, while a single eventMap aggregates highlights across every page."
  - "The score surface uses CSS page/grid contracts so future MusicXML output can feed the same display path."
requirements-completed: [phase-02, SYNC-02, SYNC-03, SCORE-01, SCORE-02]
duration: "0 min"
completed: "2026-05-15"
---

# Phase 02 Plan 02: A4 Full-Score Page Renderer Summary

Plan 02-02 replaced the capped notation renderer with a sheet-first page renderer. Full canonical sequences are now converted into score measures, planned into A4-style pages, and rendered as one VexFlow SVG per page with highlight maps preserved across the complete score.

## Execution

**Start:** 2026-05-15  
**End:** 2026-05-15  
**Tasks:** 7  
**Files changed:** 5

## Changes

- Exported `buildScoreMeasures()` and `planScorePages()` from `js/staffNotationRenderer.js`.
- Removed the active `MAX_DISPLAY_MEASURES` first-eight-measure cap.
- Rendered `.score-sheet-view`, `.score-page-grid`, and `.score-page` DOM nodes with one SVG per A4 page.
- Kept canonical event highlighting through one aggregate `Map` across all rendered pages.
- Renamed the visible notation section to `Sheet Music`.
- Added sheet/page CSS with A4 aspect ratio, desktop two-column pages, mobile one-column pages, and fixed-piano bottom clearance.
- Added `tests/scoreDisplayContract.test.js` covering Fur Elise's 67 measures and page coverage.

## Verification

- `npm test` — passed.
- `node --check js/staffNotationRenderer.js` — passed.
- `node -e "import('./js/staffNotationRenderer.js').then(m => console.log(typeof m.buildScoreMeasures, typeof m.planScorePages))"` — printed `function function`.
- `rg "MAX_DISPLAY_MEASURES|Math\\.min\\([^\\n]*8|getElementById\\('key'\\)|settings\\.getKey|Staff Notation" js/staffNotationRenderer.js index.html` — no matches.
- `rg "score-sheet-view|score-page-grid|score-page|aspect-ratio: 210 / 297|794px|Sheet Music|Loading sheet music|Unable to render this score|This score cannot be displayed" js/staffNotationRenderer.js index.html css/styles.css css/mobile.css` — found expected contracts.
- `rg "letter-spacing: -" css/styles.css css/mobile.css` — no matches.

## Deviations from Plan

- **[Rule 1 - Bug] Page-local tie guard** — Found during: Task T4 | Issue: the first implementation compared undefined system entries for measures not rendered on the current page, which could call tie drawing with undefined measure note objects. | Fix: added a `systemByMeasure.has()` guard before same-system tie drawing. | Files modified: `js/staffNotationRenderer.js` | Verification: `npm test` and `node --check js/staffNotationRenderer.js` passed. | Commit: `ac9be82`

**Total deviations:** 1 auto-fixed.  
**Impact:** Prevents a renderer error when drawing ties after pagination.

## Issues Encountered

None.

## Self-Check: PASSED

Ready for Plan 02-03.
