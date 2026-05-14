# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- None configured.
- No `package.json`, `npm test`, test config, or CI workflow exists.

**Assertion Library:**
- None configured.

**Run Commands:**
```bash
# Manual smoke only
python -m http.server 8000
npx http-server -p 8000
start-server.bat
```

## Test File Organization

**Location:**
- No test files detected.
- No `tests/`, `__tests__/`, `.spec.js`, `.test.js`, or browser automation directories.

**Naming:**
- No current test naming conventions.

**Structure:**
```
InteractivePianoHelper/
├── index.html
├── js/
├── css/
├── patterns/
└── third-party/
```

## Test Structure

**Suite Organization:**
- Not established.

**Patterns:**
- Manual browser verification is the current effective test strategy.
- `CLAUDE.md` identifies future regression targets around notation/playback consistency, pattern validation, and score rendering.

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
- None currently.
- The highest-value future coverage is behavioral, not raw line count.

**Configuration:**
- None.

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
  - Pattern-to-canonical-event conversion once added.

**Integration Tests:**
- High-value targets:
  - Pattern loader imports every ID from `patterns/index.js`.
  - Playback and notation use the same canonical event count/order.
  - Unsupported native key selection produces clear non-playing/non-rendering state.

**Browser Smoke Tests:**
- High-value targets:
  - App boots over HTTP.
  - Pattern dropdown is populated.
  - VexFlow notation area renders non-empty SVG.
  - Play/Stop does not leave stuck keyboard or notation highlights.
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
*Update when adding a package manifest, test runner, or browser automation*
