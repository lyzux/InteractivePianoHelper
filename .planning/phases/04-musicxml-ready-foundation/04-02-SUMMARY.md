---
phase: 04-musicxml-ready-foundation
plan: "02"
subsystem: testing
tags: [browser-smoke, playwright, static-server, regression-safety]
requires:
  - phase: 04-musicxml-ready-foundation
    provides: MusicXML adapter contract and validated canonical source boundary
provides:
  - Dev-only Playwright browser smoke tooling
  - Static app smoke test for boot, source loading, notation rendering, and playback cleanup
  - Documented smoke test command and browser executable fallback
affects: [testing, static-app, ci-readiness, regression-safety]
tech-stack:
  added: [playwright]
  patterns: [node:test browser smoke, loopback static server, system Chrome fallback]
key-files:
  created:
    - package-lock.json
    - tests/browser-smoke/appBoot.test.js
  modified:
    - package.json
    - README.md
    - .gitignore
key-decisions:
  - "Playwright is accepted as dev-only browser automation because the installed package and playwright-core are Apache-2.0."
  - "The smoke test uses a system Chromium-compatible browser when Playwright's managed Chromium download is unavailable on Ubuntu 26.04."
  - "Browser smoke remains separate from npm test so the fast Node contract suite stays browser-free."
patterns-established:
  - "Browser smoke tests serve the static app on 127.0.0.1 and assert behavior rather than SVG snapshots."
  - "Smoke cleanup assertions check stopped playback state through DOM highlight cleanup, not audible output."
requirements-completed: [phase-04, TEST-02, XML-01]
duration: 6 min
completed: 2026-05-15
---

# Phase 04 Plan 02: Browser Smoke Coverage Summary

**Playwright-based static app smoke coverage for boot, notation rendering, and play/stop cleanup**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-15T12:06:45Z
- **Completed:** 2026-05-15T12:12:13Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Added Playwright as a dev dependency and confirmed `playwright` plus `playwright-core` are `Apache-2.0`.
- Added a separate `npm run test:smoke` command while keeping `npm test` Node-only.
- Created `tests/browser-smoke/appBoot.test.js`, which serves the repo on `127.0.0.1`, launches Chrome through Playwright, verifies selector population, VexFlow SVG rendering, score page rendering, Play/Stop behavior, and highlight cleanup.
- Documented smoke test usage and ignored local dependency/report artifacts.

## Task Commits

1. **Task 1: Approve browser automation tooling if absent** - `23b4caf` (chore)
2. **Task 2: Add separate smoke test command** - `427cadd` (chore)
3. **Task 3: Create static app browser smoke test** - `8d4b2c8` (test)
4. **Task 4: Document smoke test usage and artifact handling** - `6a9850e` (docs)

## Files Created/Modified

- `package.json` - Adds `test:smoke` and dev-only Playwright dependency.
- `package-lock.json` - Locks Playwright dependency versions.
- `tests/browser-smoke/appBoot.test.js` - Browser smoke test and loopback static server.
- `README.md` - Documents `npm test`, `npm run test:smoke`, and Chrome executable fallback.
- `.gitignore` - Ignores `node_modules/`, `playwright-report/`, and `test-results/`.

## Decisions Made

- Used Playwright because it is open source under Apache-2.0 and fits static browser testing.
- Did not rely on Playwright's managed Chromium download after it reported Ubuntu 26.04 unsupported; used `/usr/bin/google-chrome` fallback through the Playwright executable path instead.
- Kept browser smoke structural: no full SVG snapshots and no assertions on audible output.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used system Chrome when Playwright-managed Chromium was unsupported**
- **Found during:** Task 1 (Approve browser automation tooling if absent)
- **Issue:** `npx playwright install chromium` failed with `Playwright does not support chromium on ubuntu26.04-x64`.
- **Fix:** Verified `/usr/bin/google-chrome` exists, used it as the Playwright executable path, and documented `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for alternate systems.
- **Files modified:** `tests/browser-smoke/appBoot.test.js`, `README.md`
- **Verification:** `npm run test:smoke` passed.
- **Committed in:** `8d4b2c8`, `6a9850e`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The smoke coverage still uses Playwright and remains static-site compatible; only the browser acquisition path changed for this OS image.

## Issues Encountered

- Playwright's managed Chromium installer does not support Ubuntu 26.04 in this environment. The smoke test runs successfully with system Chrome.

## User Setup Required

None - no external service configuration required. Developers without `/usr/bin/google-chrome` can set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome`.

## Verification

- `npm test` - passed, 36 tests.
- `npm run test:smoke` - passed, 1 browser smoke test.
- `rg "test:smoke|browser-smoke|playwright|puppeteer" package.json tests README.md` - passed.
- `node -e "... package license check ..."` - passed: `playwright Apache-2.0`, `playwright-core Apache-2.0`.

## Self-Check: PASSED

All tasks and plan-level verification checks passed. TEST-02 is satisfied by the browser smoke test.

## Next Phase Readiness

Phase 04 is complete and ready for verification. Future MusicXML import UI/parser work remains backlog scope.

---
*Phase: 04-musicxml-ready-foundation*
*Completed: 2026-05-15*
