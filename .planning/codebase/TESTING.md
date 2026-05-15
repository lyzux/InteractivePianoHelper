# Testing Patterns

**Analysis Date:** 2026-05-14
**Last Updated:** 2026-05-15 after Phase 04 execution

> Current note: this map was originally created before tests existed. The repository now has `package.json`, `npm test` for Node contract tests, and `npm run test:smoke` for Playwright browser smoke coverage.

## Test Framework

**Runner:**
- Node's built-in `node:test` runner via `npm test`.
- Browser smoke via `npm run test:smoke`.

**Assertion Library:**
- `node:assert/strict`.
- Playwright for browser automation.

**Run Commands:**
```bash
npm test
npm run test:smoke
```

## Test File Organization

**Location:**
- Node tests live in `tests/*.test.js`.
- Browser smoke tests live in `tests/browser-smoke/*.test.js`.

**Naming:**
- Test files use `*.test.js`.

**Structure:**
```
InteractivePianoHelper/
├── tests/*.test.js
└── tests/browser-smoke/*.test.js
```

## Test Structure

**Suite Organization:**
- Not established.

**Patterns:**
- Pure model and source-contract tests use Node's test runner.
- Browser smoke uses Playwright with a local `127.0.0.1` static server.
- Smoke assertions are structural and behavioral rather than full SVG snapshots.

## Mocking

**Framework:**
- None.

**What to Mock in Future:**
- Web Audio API for unit tests of `AudioEngine` and `Player`.
- DOM APIs for `Piano`, `Settings`, and controls.
- VexFlow for isolated notation conversion tests, or run actual browser tests for SVG output.
- `localStorage` for settings and resize persistence.

**What NOT to Mock in Future:**
- Pure note parsing/transposition helpers once extracted.
- Measure grouping and timing conversion logic.
- Pattern validation fixtures.

## Fixtures and Factories

**Test Data:**
- Existing pattern files are useful fixtures:
  - `patterns/lombardisch.js` for short-cycle display/playback mismatch.
  - `patterns/furelise.js` for long score-like notation and native-key handling.
  - `patterns/hymn.js`, `patterns/march.js`, `patterns/waltz.js` for chords.
  - `patterns/bossa.js`, `patterns/tango.js`, `patterns/polonaise.js` for rests.

**Location:**
- Future shared fixtures could live under `tests/fixtures/`.

## Coverage

**Requirements:**
- Phase 01-04 v1 coverage is represented by focused tests for canonical events, score display contracts, validation, MusicXML adapter contract, and browser smoke.

**Configuration:**
- No coverage reporter configured.

**View Coverage:**
- Not applicable.

## Test Types

**Unit Tests:**
- High-value targets:
  - Note parsing and enharmonic conversion.
  - Transposition.
  - Timing-to-VexFlow duration conversion.
  - Measure grouping and rest filling.
  - Pattern validation.
  - Pattern-to-canonical-event conversion.
  - MusicXML adapter contract fields.

**Integration Tests:**
- High-value targets:
  - Pattern loader imports every ID from `patterns/index.js`.
  - Playback and notation use the same canonical event count/order.
  - Unsupported native key selection produces clear non-playing/non-rendering state.

**Browser Smoke Tests:**
- Implemented in `tests/browser-smoke/appBoot.test.js`:
  - App boots over HTTP.
  - Pattern dropdown is populated.
  - VexFlow notation area renders non-empty SVG.
  - At least one score page renders.
  - Play/Stop does not leave stuck keyboard or notation highlights.
- Future target:
  - Mobile drawer opens and closes.

**Visual/Regression Tests:**
- Useful after notation changes:
  - Lombard rhythm displays the same sequence playback schedules.
  - Für Elise renders complete available excerpt in score mode.
  - Notation does not overlap fixed bottom piano on mobile/desktop.

## Common Patterns

**Async Testing:**
- Future playback tests should control timers and avoid relying on real time where possible.
- Browser tests may need to stub or unlock Web Audio autoplay behavior.

**Error Testing:**
- Pattern validation tests should assert exact warnings/errors for malformed notes, timing mismatches, unsupported keys, and out-of-range notes.

**Snapshot Testing:**
- Avoid brittle full SVG snapshots initially.
- Prefer structural assertions: SVG exists, expected measure count, expected note event count, expected warning message.

---

*Testing analysis: 2026-05-14*
*Updated after adding a package manifest, test runner, and browser automation*
