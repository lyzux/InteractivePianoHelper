# Architecture

**Analysis Date:** 2026-05-14

## Pattern Overview

**Overall:** Static browser-only single-page app with modular vanilla JavaScript.

**Key Characteristics:**
- No server-side application logic.
- No build pipeline; the browser executes native ES modules directly.
- `index.html` is both document shell and composition root.
- Domain data is executable JavaScript modules under `patterns/`.
- Audio, piano UI, playback, settings, pattern loading, notation, mobile UI, and resize behavior are separated into modules.

## Layers

**App Composition Layer:**
- Purpose: Load modules, create shared instances, wire events, and provide fallback behavior.
- Contains: dynamic imports, UI event handlers, notation highlight bridge, emergency fallback.
- Location: `index.html`.
- Depends on: all `js/*.js` modules and DOM IDs defined in the page.
- Used by: browser entry point.

**Audio Layer:**
- Purpose: Generate and play piano sound.
- Contains: Web Audio graph, MP3 sample loading, synthesis parameters, effects controls, active note tracking.
- Location: `js/audioEngine.js`.
- Depends on: Web Audio API, local sample files under `third-party/piano-mp3/`.
- Used by: `js/piano.js`, `js/player.js`, and physics controls.

**Keyboard UI Layer:**
- Purpose: Render an 88-key piano and map mouse, touch, and QWERTY input to notes.
- Contains: DOM key creation, pointer/touch handlers, held-key behavior, highlight/unhighlight helpers.
- Location: `js/piano.js`.
- Depends on: `AudioEngine` instance passed by `index.html`.
- Used by: user input and playback highlighting.

**Playback Layer:**
- Purpose: Schedule pattern playback with stable timing.
- Contains: lookahead scheduler, per-note timing, swing timing, two-hand playback, key highlight timers.
- Location: `js/player.js`.
- Depends on: `AudioEngine`, `Piano`, and `Settings`.
- Used by: Play/Stop button in `index.html`.

**Pattern Data Layer:**
- Purpose: Define accompaniment patterns and pieces.
- Contains: JS object exports with note functions, timings, fingerings, tempo metadata, time signatures, and optional native key.
- Location: `patterns/*.js` and `patterns/index.js`.
- Depends on: runtime dynamic import.
- Used by: `js/simplePatternLoader.js`, `js/player.js`, and `js/staffNotationRenderer.js`.

**Pattern/Notation Adapter Layer:**
- Purpose: Load pattern modules, resolve notes for selected key, transpose notes, and convert note/timing values into VexFlow inputs.
- Location: `js/simplePatternLoader.js`.
- Depends on: `patterns/index.js`, pattern modules, transposition helper tables.
- Used by: `index.html` and `js/staffNotationRenderer.js`.

**Notation Rendering Layer:**
- Purpose: Render treble and bass staves as SVG.
- Contains: measure grouping, rest filling, dotted-note handling, tie handling, multi-system layout, highlight maps.
- Location: `js/staffNotationRenderer.js`.
- Depends on: global `Vex` from CDN and `SimplePatternLoader` conversion helpers.
- Used by: `index.html` on pattern/key changes.

**Settings/UI Support Layer:**
- Purpose: Persist user controls and adapt UI for mobile/resizing.
- Locations: `js/settings.js`, `js/physicsControlsPanel.js`, `js/mobileMenu.js`, `js/pianoResizeHandler.js`.
- Depends on: DOM IDs and `localStorage`.
- Used by: app composition layer.

## Data Flow

**Application Boot:**
1. Browser loads `index.html`.
2. CDN scripts/styles load VexFlow, fonts, icons, and CSS.
3. Inline module script dynamically imports `js/*.js`.
4. `AudioEngine`, `Piano`, `Settings`, `Player`, and `SimplePatternLoader` are created.
5. `SimplePatternLoader.autoLoadPatterns()` imports every ID from `patterns/index.js`.
6. Pattern dropdown is populated.
7. First pattern info and notation render.
8. Physics controls, mobile drawer, and piano resize behavior are initialized.

**Manual Note Input:**
1. User clicks/touches a key or presses mapped QWERTY key.
2. `Piano.startNote()` calls `AudioEngine.playNote(note, 30, sustainEnabled, 0.8)`.
3. `AudioEngine` starts a manual-path long note and highlights the key.
4. Mouse/touch/key release calls `Piano.stopNote()`, which calls `AudioEngine.stopNote()`.

**Pattern Playback:**
1. User clicks Play.
2. `index.html` resolves selected pattern and key.
3. `Player.play()` resolves left/right hand notes using duplicated transposition logic.
4. `_scheduleLoop()` schedules audio ahead by 150ms and schedules matching visual key highlights.
5. `player.onNoteHighlight` calls `highlightNotationNote()` in `index.html`.
6. Notation highlight maps from `drawStaffNotation()` light the first SVG occurrence of each pattern index.

**Notation Rendering:**
1. `drawStaffNotation(patternLoader, settings)` reads selected pattern and key.
2. `SimplePatternLoader.generateVexFlowNotation()` resolves note arrays and timing metadata.
3. Renderer expands short cycles, groups notes into measures, fills rests, builds `VF.StaveNote`s, and draws SVG systems.
4. Renderer returns maps from pattern indices to SVG elements for playback highlighting.

**State Management:**
- Persistent user state is limited to browser `localStorage`.
- Pattern registry is in-memory only.
- No server or database state.

## Key Abstractions

**AudioEngine:**
- Purpose: Encapsulate sound synthesis, sample playback, effects, and note lifecycle.
- Location: `js/audioEngine.js`.
- Pattern: class instance shared by UI and playback.

**Piano:**
- Purpose: Encapsulate the 88-key DOM piano and user input.
- Location: `js/piano.js`.
- Pattern: class instance with DOM event listeners and highlight helpers.

**Player:**
- Purpose: Encapsulate time-based playback scheduling.
- Location: `js/player.js`.
- Pattern: class instance with lookahead polling and visual timeout bookkeeping.

**SimplePatternLoader:**
- Purpose: Registry and conversion facade for pattern modules.
- Location: `js/simplePatternLoader.js`.
- Pattern: class instance wrapping a `Map`.

**Pattern Object:**
- Purpose: Domain format for loops and pieces.
- Location: `patterns/*.js`.
- Pattern: named ES export matching filename and ID in `patterns/index.js`.

## Entry Points

**Browser Page:**
- Location: `index.html`.
- Triggers: opening the app over HTTP.
- Responsibilities: markup, CDN dependencies, module boot, app wiring, fallback.

**Pattern Manifest:**
- Location: `patterns/index.js`.
- Triggers: imported by `js/simplePatternLoader.js`.
- Responsibilities: declares all pattern IDs to load.

**Local Dev Server:**
- Location: `start-server.bat`.
- Triggers: Windows user double-click or shell invocation.
- Responsibilities: serve repo root over HTTP on port 8000.

## Error Handling

**Strategy:** Mostly graceful fallback and console logging.

**Patterns:**
- `index.html` wraps app initialization and invokes `setupEmergencyFallback()` on boot failure.
- `SimplePatternLoader.autoLoadPatterns()` catches pattern import errors silently.
- `staffNotationRenderer.js` catches VexFlow rendering errors and displays `Error rendering notation`.
- `AudioEngine._loadSamples()` catches failed sample loads and falls back to synth-only for individual notes.
- Many UI support modules no-op when expected DOM elements are missing.

## Cross-Cutting Concerns

**Logging:**
- Browser `console.log`, `console.warn`, and `console.error` are used directly.
- Debug logs are common in `index.html`, `js/settings.js`, and `js/physicsControlsPanel.js`.

**Validation:**
- Pattern validation is mostly implicit.
- Unsupported note names are ignored by `AudioEngine.playNote()` because no frequency is found.
- Unsupported native keys can produce empty note arrays without strong user-facing explanation.

**Accessibility:**
- Basic labels exist for form controls.
- Piano keys are `div` elements, not semantic buttons.
- QWERTY keyboard support exists for note input.

**Internationalization:**
- UI and docs mix English and some German naming/context.
- Pattern names/descriptions include English labels and some German-origin filenames such as `lombardisch.js`.

---

*Architecture analysis: 2026-05-14*
*Update when adding a canonical score model, MusicXML pipeline, or build/test framework*
