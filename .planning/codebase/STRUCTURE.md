# Codebase Structure

**Analysis Date:** 2026-05-14
**Last Updated:** 2026-05-15 after Phase 04 execution

> Current note: this map was created before the test/package setup existed. The repo now includes `tests/`, `package.json`, and `package-lock.json`.

## Directory Layout

```
InteractivePianoHelper/
├── index.html                 # Single-page app shell, module boot, event wiring
├── js/                        # ES modules for app behavior
├── css/                       # Core and mobile styles
├── patterns/                  # One JS module per accompaniment pattern or piece
├── tests/                     # Node contract tests and browser smoke tests
├── third-party/               # Vendored notices and piano MP3 samples
├── .planning/                 # GSD planning artifacts
├── README.md                  # User-facing project overview
├── CLAUDE.md                  # Detailed architecture notes and improvement plan
├── package.json               # npm test scripts
├── package-lock.json          # npm dependency lockfile
├── start-server.bat           # Windows HTTP server helper
├── LICENSE                    # MIT license
└── .gitignore                 # Git ignore rules
```

## Directory Purposes

**`js/`:**
- Purpose: browser modules.
- Contains: audio engine, piano UI, playback scheduler, settings, pattern loader, notation renderer, controls, mobile menu, resize handler.
- Key files: `js/audioEngine.js`, `js/piano.js`, `js/player.js`, `js/simplePatternLoader.js`, `js/staffNotationRenderer.js`.
- Subdirectories: none.

**`css/`:**
- Purpose: application styling.
- Contains: desktop/base styles and mobile overrides.
- Key files: `css/styles.css`, `css/mobile.css`.
- Subdirectories: none.

**`patterns/`:**
- Purpose: pattern and piece definitions loaded at runtime.
- Contains: `patterns/index.js` manifest and individual pattern modules.
- Key files: `patterns/lombardisch.js` for the known short-cycle display/playback mismatch, `patterns/furelise.js` for longer score-like material.
- Subdirectories: none.

**`third-party/`:**
- Purpose: vendored third-party assets and notices.
- Contains: `third-party/NOTICE.md`, `third-party/piano-mp3/*.mp3`, and sample license.
- Key files: `third-party/piano-mp3/LICENSE`.

**`.planning/`:**
- Purpose: GSD project planning artifacts.
- Current contents: captured todo in `.planning/todos/pending/` and codebase map documents in `.planning/codebase/`.
- Important: this directory is being initialized for GSD and may grow to include `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, and phase directories.

**`tests/`:**
- Purpose: automated regression coverage.
- Contains: `tests/*.test.js` Node contract tests and `tests/browser-smoke/appBoot.test.js`.
- Browser smoke: starts a loopback static server and drives Chrome through Playwright.

## Key File Locations

**Entry Points:**
- `index.html`: browser entry, markup, dependency tags, dynamic module imports, event handlers.
- `start-server.bat`: Windows convenience launcher.

**Configuration:**
- `patterns/index.js`: pattern manifest and source of truth for dynamic pattern imports.
- `package.json`: npm scripts for `npm test` and `npm run test:smoke`.
- `.gitignore`: ignored files.
- No build config exists.

**Core Logic:**
- `js/audioEngine.js`: Web Audio synthesis, effects, sample loading, active note lifecycle.
- `js/piano.js`: 88-key piano DOM construction and mouse/touch/QWERTY input.
- `js/player.js`: lookahead scheduler for pattern playback.
- `js/simplePatternLoader.js`: pattern registry, transposition, VexFlow note conversion.
- `js/staffNotationRenderer.js`: VexFlow SVG notation layout and highlight maps.

**UI Support:**
- `js/settings.js`: tempo, key, sustain, swing ratio, localStorage persistence.
- `js/physicsControlsPanel.js`: generated audio parameter sliders.
- `js/mobileMenu.js`: mobile sidebar drawer.
- `js/pianoResizeHandler.js`: resizable bottom piano.

**Testing:**
- `tests/*.test.js`: Node contract/unit coverage.
- `tests/browser-smoke/appBoot.test.js`: static app browser smoke coverage.

**Documentation:**
- `README.md`: quick start and general overview; some module names are stale versus current files.
- `CLAUDE.md`: most accurate architecture documentation and current improvement plan.
- `patterns/README.md`: pattern authoring notes; claims automatic recognition, but current code uses `patterns/index.js` manifest.

## Naming Conventions

**Files:**
- JavaScript modules use camelCase or descriptive lower-case names: `audioEngine.js`, `simplePatternLoader.js`, `staffNotationRenderer.js`.
- Pattern files use lowercase ASCII-ish IDs matching export names: `alberti.js` exports `alberti`, `lombardisch.js` exports `lombardisch`.
- Project docs use uppercase names: `README.md`, `CLAUDE.md`, `LICENSE`.

**Directories:**
- Lowercase plural directories: `js/`, `css/`, `patterns/`, `third-party/`.

**Special Patterns:**
- A pattern ID must appear in `patterns/index.js`, have a matching `patterns/{id}.js` file, and export `const {id}`.
- Pattern modules return notes from `pattern()`, `leftHand()`, and/or `rightHand()`.

## Where to Add New Code

**New accompaniment pattern:**
- Add `patterns/{id}.js`.
- Export `const {id}`.
- Add `{id}` to `PATTERN_IDS` in `patterns/index.js`.

**New shared playback/notation logic:**
- Add a new module under `js/`, likely `js/sequenceResolver.js` or similar.
- Update both `js/player.js` and `js/staffNotationRenderer.js` to consume it.

**New validation:**
- Add `js/patternValidator.js`.
- Call it from `js/simplePatternLoader.js` after dynamic imports.
- Surface selected-pattern errors through `index.html` and/or notation UI.

**New MusicXML support:**
- If keeping no build step, add browser-compatible parser/renderer via static asset or CDN.
- Add import UI in `index.html`.
- Add MusicXML adapter module under `js/`.
- Keep complete score rendering separate from compact pattern preview logic.

**New tests:**
- Add fast contract/unit tests to `tests/*.test.js`.
- Add full browser smoke checks to `tests/browser-smoke/*.test.js`.
- Keep `npm test` browser-free; use `npm run test:smoke` for Playwright coverage.

## Special Directories

**`third-party/piano-mp3/`:**
- Purpose: 88-key piano sample library.
- Source: vendored asset set with license.
- Committed: yes.

**`.planning/`:**
- Purpose: GSD-managed planning memory.
- Source: generated/maintained by GSD workflows and Codex edits.
- Committed: currently yes unless project config later disables planning doc commits.

---

*Structure analysis: 2026-05-14*
*Updated after adding tests, package manifest, and browser smoke coverage*
