# Coding Conventions

**Analysis Date:** 2026-05-14

## Naming Patterns

**Files:**
- ES modules in `js/` use descriptive camelCase filenames: `audioEngine.js`, `pianoResizeHandler.js`.
- Pattern modules use lowercase IDs matching the exported const: `patterns/alberti.js` exports `alberti`.
- Documentation files use uppercase conventional names where appropriate: `README.md`, `CLAUDE.md`.

**Functions:**
- Functions and methods use camelCase: `drawStaffNotation`, `generatePhysicsControls`, `autoLoadPatterns`.
- Event handlers in `index.html` use `handle...` names: `handlePlayStop`, `handlePatternChange`, `handleKeyChange`.
- Some private-ish helpers use underscore prefixes: `_toMidi`, `_resolveNotes`, `_noteDurationSec`.

**Variables:**
- Local variables use camelCase.
- Module-level constants use UPPER_SNAKE_CASE when acting as constants: `VALID_BEATS`, `REST_FILL_SIZES`, `MAX_DISPLAY_MEASURES`, `PATTERN_IDS`.
- Duplicated transposition constants in `js/player.js` include `_P` suffixes.

**Types:**
- No TypeScript types, interfaces, or enums.
- Classes use PascalCase: `AudioEngine`, `Piano`, `Player`, `Settings`, `SimplePatternLoader`.

## Code Style

**Formatting:**
- Four-space indentation in JavaScript and CSS.
- Semicolons are used consistently.
- Single quotes dominate JavaScript strings.
- Inline comments are common for section headers and explanations.
- No automated formatter configuration exists.

**Linting:**
- No linting tool or command configured.
- Browser console warnings/errors are the only runtime feedback.

## Import Organization

**Order:**
1. `index.html` dynamically imports all app modules in one `Promise.all`.
2. `js/simplePatternLoader.js` statically imports `PATTERN_IDS`.
3. Pattern files do not import anything.

**Grouping:**
- No standardized import grouping beyond current small module count.

**Path Aliases:**
- None. All imports are relative paths.

## Error Handling

**Patterns:**
- Boot errors in `index.html` fall back to `setupEmergencyFallback()`.
- Missing optional DOM nodes usually cause early return rather than thrown errors.
- Pattern import failures in `js/simplePatternLoader.js` are silently ignored.
- VexFlow rendering errors are caught and replaced with `Error rendering notation`.
- Audio sample loading failures are silently skipped per sample.

**Error Types:**
- No custom error classes.
- Expected failures typically become `null`, empty arrays, console messages, or fallback UI.

## Logging

**Framework:**
- Direct browser console APIs only.

**Patterns:**
- Many debug logs remain in production path, especially in `index.html`, `js/settings.js`, and `js/physicsControlsPanel.js`.
- Logs use freeform English strings and occasional music emoji in `js/settings.js`.

## Comments

**When to Comment:**
- The codebase uses explanatory comments for architecture-sensitive behavior, such as Web Audio graph setup, VexFlow dotted-note handling, and playback scheduling.
- Section-divider comments are common.

**JSDoc/TSDoc:**
- Minimal JSDoc-style comments appear in `js/audioEngine.js` and `js/staffNotationRenderer.js`.
- No formal generated API docs.

**TODO Comments:**
- No major TODO convention detected.

## Function Design

**Size:**
- Some modules contain large functions, especially `drawStaffNotation()` in `js/staffNotationRenderer.js` and boot/event code in `index.html`.
- Helpers are extracted inside notation rendering for measure grouping and note building.

**Parameters:**
- Class constructors take dependencies directly, e.g. `new Player(audioEngine, piano, settings)`.
- Renderer functions pass collaborators explicitly, e.g. `drawStaffNotation(patternLoader, settings)`.
- Some modules still read DOM IDs internally.

**Return Values:**
- Renderer returns highlight maps or `null`.
- Loader methods return pattern objects, arrays, or `null`.
- Many UI handlers mutate DOM/state without returning values.

## Module Design

**Exports:**
- Named exports only for app modules: `export class ...` or `export function ...`.
- Pattern files export a named `const` matching the filename.

**Barrel Files:**
- No barrel files for `js/`.
- `patterns/index.js` acts as a manifest, not a re-export barrel.

## Domain Data Style

**Pattern Objects:**
- Minimal single-hand patterns use `pattern: () => [...]`.
- Two-hand patterns use `leftHand` and `rightHand`.
- Rests are represented by `null`.
- Chords are represented by note arrays such as `['E3', 'G3', 'C4']`.
- Durations are quarter-note beat units: `1` = quarter, `0.5` = eighth, `0.25` = sixteenth.

**Transposition:**
- Pattern functions typically define C-major source material.
- Transposition is handled in both `js/simplePatternLoader.js` and `js/player.js`, currently duplicated.

---

*Convention analysis: 2026-05-14*
*Update after adding formatter/linter, TypeScript, validation, or a canonical score model*
