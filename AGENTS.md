<!-- GSD:project-start source:PROJECT.md -->
## Project

**Interactive Piano Helper**

Interactive Piano Helper is a browser-only piano learning app for exploring accompaniment patterns and simple two-hand examples. It already provides a strong 88-key piano UI, responsive manual input, Web Audio/sample-based sound, pattern playback, and VexFlow notation previews.

The next stage is to make it feel trustworthy as a notation-backed learning tool: visible notes, played notes, validation, and score-like material should agree and fail clearly.

**Core Value:** Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.

### Constraints

- **Tech stack**: Keep vanilla JavaScript and static hosting unless test tooling or MusicXML support requires a minimal package setup.
- **Deployment**: The app must continue to work when served as static files over HTTP.
- **Existing UX**: Preserve the current keyboard interaction and sound defaults.
- **Notation**: VexFlow is currently loaded from CDN and used through global `Vex`.
- **Data model**: Existing JS pattern files are executable modules; validation and migration must avoid breaking all built-in patterns at once.
- **Testing**: There are no current tests, so high-risk refactors need focused fixtures and smoke coverage.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript ES modules - all application logic in `index.html`, `js/*.js`, and `patterns/*.js`.
- HTML - single-page app shell in `index.html`.
- CSS - visual layout and responsive behavior in `css/styles.css`, `css/mobile.css`, plus inline styles in `index.html`.
- Windows batch - local server helper in `start-server.bat`.
- Markdown - project documentation in `README.md`, `CLAUDE.md`, `patterns/README.md`, and GSD planning docs.
## Runtime
- Modern browser with native ES module support.
- Web Audio API for synthesis and sample playback.
- DOM APIs for rendering the 88-key piano, controls, mobile drawer, and notation container.
- Must be served over HTTP; `file://` breaks module imports.
- None. There is no `package.json`, lockfile, bundler, transpiler, or local dependency install.
- Optional serving command in docs: `npx http-server -p 8000`.
## Frameworks
- Vanilla JavaScript ES modules - no framework.
- VexFlow 4.2.2 from CDN in `index.html` - staff notation rendering through global `Vex`.
- Web Audio API - audio graph and scheduled playback in `js/audioEngine.js`.
- No test framework currently configured.
- No unit, integration, browser smoke, or visual regression tests are present.
- No build step.
- Runtime cache busting uses `APP_VERSION = Date.now()` in `index.html` and appends `?v=...` to dynamic imports.
- Local HTTP serving via `python -m http.server 8000`, `npx http-server -p 8000`, or `start-server.bat`.
## Key Dependencies
- VexFlow 4.2.2 CDN - renders two-stave notation in `js/staffNotationRenderer.js`.
- Google Fonts CDN - Libre Baskerville typography loaded in `index.html`.
- Google Material Icons CDN - mobile hamburger and close icons in `index.html`.
- Local MP3 samples - 88-key sample set under `third-party/piano-mp3/`, loaded by `AudioEngine._loadSamples()`.
- Browser `localStorage` - settings and piano resize persistence in `js/settings.js` and `js/pianoResizeHandler.js`.
- Browser `fetch()` - sample loading in `js/audioEngine.js`.
- Dynamic `import()` - app modules and pattern files load at runtime.
## Configuration
- No environment variables.
- No secrets.
- User settings persist under `localStorage` key `pianoHelperSettings`.
- Piano height persists under `localStorage` key `pianoHeight`.
- No build configuration files.
- Pattern registry is code configuration in `patterns/index.js`.
- App layout configuration is spread across `index.html`, `css/styles.css`, and `css/mobile.css`.
## Platform Requirements
- Any platform with a modern browser and a simple HTTP server.
- Optional Node/npm only if using `npx http-server`.
- Optional Python only if using `python -m http.server`.
- Static hosting is sufficient, including GitHub Pages.
- CDN availability is required for VexFlow, Google Fonts, and Material Icons unless vendored locally.
- Local sample files under `third-party/piano-mp3/` must be deployed with the app.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- ES modules in `js/` use descriptive camelCase filenames: `audioEngine.js`, `pianoResizeHandler.js`.
- Pattern modules use lowercase IDs matching the exported const: `patterns/alberti.js` exports `alberti`.
- Documentation files use uppercase conventional names where appropriate: `README.md`, `CLAUDE.md`.
- Functions and methods use camelCase: `drawStaffNotation`, `generatePhysicsControls`, `autoLoadPatterns`.
- Event handlers in `index.html` use `handle...` names: `handlePlayStop`, `handlePatternChange`, `handleKeyChange`.
- Some private-ish helpers use underscore prefixes: `_toMidi`, `_resolveNotes`, `_noteDurationSec`.
- Local variables use camelCase.
- Module-level constants use UPPER_SNAKE_CASE when acting as constants: `VALID_BEATS`, `REST_FILL_SIZES`, `MAX_DISPLAY_MEASURES`, `PATTERN_IDS`.
- Duplicated transposition constants in `js/player.js` include `_P` suffixes.
- No TypeScript types, interfaces, or enums.
- Classes use PascalCase: `AudioEngine`, `Piano`, `Player`, `Settings`, `SimplePatternLoader`.
## Code Style
- Four-space indentation in JavaScript and CSS.
- Semicolons are used consistently.
- Single quotes dominate JavaScript strings.
- Inline comments are common for section headers and explanations.
- No automated formatter configuration exists.
- No linting tool or command configured.
- Browser console warnings/errors are the only runtime feedback.
## Import Organization
- No standardized import grouping beyond current small module count.
- None. All imports are relative paths.
## Error Handling
- Boot errors in `index.html` fall back to `setupEmergencyFallback()`.
- Missing optional DOM nodes usually cause early return rather than thrown errors.
- Pattern import failures in `js/simplePatternLoader.js` are silently ignored.
- VexFlow rendering errors are caught and replaced with `Error rendering notation`.
- Audio sample loading failures are silently skipped per sample.
- No custom error classes.
- Expected failures typically become `null`, empty arrays, console messages, or fallback UI.
## Logging
- Direct browser console APIs only.
- Many debug logs remain in production path, especially in `index.html`, `js/settings.js`, and `js/physicsControlsPanel.js`.
- Logs use freeform English strings and occasional music emoji in `js/settings.js`.
## Comments
- The codebase uses explanatory comments for architecture-sensitive behavior, such as Web Audio graph setup, VexFlow dotted-note handling, and playback scheduling.
- Section-divider comments are common.
- Minimal JSDoc-style comments appear in `js/audioEngine.js` and `js/staffNotationRenderer.js`.
- No formal generated API docs.
- No major TODO convention detected.
## Function Design
- Some modules contain large functions, especially `drawStaffNotation()` in `js/staffNotationRenderer.js` and boot/event code in `index.html`.
- Helpers are extracted inside notation rendering for measure grouping and note building.
- Class constructors take dependencies directly, e.g. `new Player(audioEngine, piano, settings)`.
- Renderer functions pass collaborators explicitly, e.g. `drawStaffNotation(patternLoader, settings)`.
- Some modules still read DOM IDs internally.
- Renderer returns highlight maps or `null`.
- Loader methods return pattern objects, arrays, or `null`.
- Many UI handlers mutate DOM/state without returning values.
## Module Design
- Named exports only for app modules: `export class ...` or `export function ...`.
- Pattern files export a named `const` matching the filename.
- No barrel files for `js/`.
- `patterns/index.js` acts as a manifest, not a re-export barrel.
## Domain Data Style
- Minimal single-hand patterns use `pattern: () => [...]`.
- Two-hand patterns use `leftHand` and `rightHand`.
- Rests are represented by `null`.
- Chords are represented by note arrays such as `['E3', 'G3', 'C4']`.
- Durations are quarter-note beat units: `1` = quarter, `0.5` = eighth, `0.25` = sixteenth.
- Pattern functions typically define C-major source material.
- Transposition is handled in both `js/simplePatternLoader.js` and `js/player.js`, currently duplicated.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- No server-side application logic.
- No build pipeline; the browser executes native ES modules directly.
- `index.html` is both document shell and composition root.
- Domain data is executable JavaScript modules under `patterns/`.
- Audio, piano UI, playback, settings, pattern loading, notation, mobile UI, and resize behavior are separated into modules.
## Layers
- Purpose: Load modules, create shared instances, wire events, and provide fallback behavior.
- Contains: dynamic imports, UI event handlers, notation highlight bridge, emergency fallback.
- Location: `index.html`.
- Depends on: all `js/*.js` modules and DOM IDs defined in the page.
- Used by: browser entry point.
- Purpose: Generate and play piano sound.
- Contains: Web Audio graph, MP3 sample loading, synthesis parameters, effects controls, active note tracking.
- Location: `js/audioEngine.js`.
- Depends on: Web Audio API, local sample files under `third-party/piano-mp3/`.
- Used by: `js/piano.js`, `js/player.js`, and physics controls.
- Purpose: Render an 88-key piano and map mouse, touch, and QWERTY input to notes.
- Contains: DOM key creation, pointer/touch handlers, held-key behavior, highlight/unhighlight helpers.
- Location: `js/piano.js`.
- Depends on: `AudioEngine` instance passed by `index.html`.
- Used by: user input and playback highlighting.
- Purpose: Schedule pattern playback with stable timing.
- Contains: lookahead scheduler, per-note timing, swing timing, two-hand playback, key highlight timers.
- Location: `js/player.js`.
- Depends on: `AudioEngine`, `Piano`, and `Settings`.
- Used by: Play/Stop button in `index.html`.
- Purpose: Define accompaniment patterns and pieces.
- Contains: JS object exports with note functions, timings, fingerings, tempo metadata, time signatures, and optional native key.
- Location: `patterns/*.js` and `patterns/index.js`.
- Depends on: runtime dynamic import.
- Used by: `js/simplePatternLoader.js`, `js/player.js`, and `js/staffNotationRenderer.js`.
- Purpose: Load pattern modules, resolve notes for selected key, transpose notes, and convert note/timing values into VexFlow inputs.
- Location: `js/simplePatternLoader.js`.
- Depends on: `patterns/index.js`, pattern modules, transposition helper tables.
- Used by: `index.html` and `js/staffNotationRenderer.js`.
- Purpose: Render treble and bass staves as SVG.
- Contains: measure grouping, rest filling, dotted-note handling, tie handling, multi-system layout, highlight maps.
- Location: `js/staffNotationRenderer.js`.
- Depends on: global `Vex` from CDN and `SimplePatternLoader` conversion helpers.
- Used by: `index.html` on pattern/key changes.
- Purpose: Persist user controls and adapt UI for mobile/resizing.
- Locations: `js/settings.js`, `js/physicsControlsPanel.js`, `js/mobileMenu.js`, `js/pianoResizeHandler.js`.
- Depends on: DOM IDs and `localStorage`.
- Used by: app composition layer.
## Data Flow
- Persistent user state is limited to browser `localStorage`.
- Pattern registry is in-memory only.
- No server or database state.
## Key Abstractions
- Purpose: Encapsulate sound synthesis, sample playback, effects, and note lifecycle.
- Location: `js/audioEngine.js`.
- Pattern: class instance shared by UI and playback.
- Purpose: Encapsulate the 88-key DOM piano and user input.
- Location: `js/piano.js`.
- Pattern: class instance with DOM event listeners and highlight helpers.
- Purpose: Encapsulate time-based playback scheduling.
- Location: `js/player.js`.
- Pattern: class instance with lookahead polling and visual timeout bookkeeping.
- Purpose: Registry and conversion facade for pattern modules.
- Location: `js/simplePatternLoader.js`.
- Pattern: class instance wrapping a `Map`.
- Purpose: Domain format for loops and pieces.
- Location: `patterns/*.js`.
- Pattern: named ES export matching filename and ID in `patterns/index.js`.
## Entry Points
- Location: `index.html`.
- Triggers: opening the app over HTTP.
- Responsibilities: markup, CDN dependencies, module boot, app wiring, fallback.
- Location: `patterns/index.js`.
- Triggers: imported by `js/simplePatternLoader.js`.
- Responsibilities: declares all pattern IDs to load.
- Location: `start-server.bat`.
- Triggers: Windows user double-click or shell invocation.
- Responsibilities: serve repo root over HTTP on port 8000.
## Error Handling
- `index.html` wraps app initialization and invokes `setupEmergencyFallback()` on boot failure.
- `SimplePatternLoader.autoLoadPatterns()` catches pattern import errors silently.
- `staffNotationRenderer.js` catches VexFlow rendering errors and displays `Error rendering notation`.
- `AudioEngine._loadSamples()` catches failed sample loads and falls back to synth-only for individual notes.
- Many UI support modules no-op when expected DOM elements are missing.
## Cross-Cutting Concerns
- Browser `console.log`, `console.warn`, and `console.error` are used directly.
- Debug logs are common in `index.html`, `js/settings.js`, and `js/physicsControlsPanel.js`.
- Pattern validation is mostly implicit.
- Unsupported note names are ignored by `AudioEngine.playNote()` because no frequency is found.
- Unsupported native keys can produce empty note arrays without strong user-facing explanation.
- Basic labels exist for form controls.
- Piano keys are `div` elements, not semantic buttons.
- QWERTY keyboard support exists for note input.
- UI and docs mix English and some German naming/context.
- Pattern names/descriptions include English labels and some German-origin filenames such as `lombardisch.js`.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
