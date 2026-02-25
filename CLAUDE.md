# CLAUDE.md — Interactive Piano Helper

## What This Project Does

A zero-dependency, vanilla-JS web app for learning and practicing piano bass/accompaniment patterns. It provides:

- An interactive **88-key piano** that plays sound on mouse interaction
- **Pattern playback** — looping accompaniment patterns across multiple musical styles
- **Staff notation** rendered via VexFlow (bass + treble clefs, with fingering annotations)
- A **"Piano Controls" sidebar** with per-parameter sound shaping sliders
- **Mobile support** — keyboard pins to the bottom 25vh, sidebar slides in as a drawer

No build step. No framework. No bundler. Served over HTTP as plain ES modules.

---

## Running the Project

Must be served over HTTP — `file://` breaks ES module imports.

```bash
# Python (simplest)
python -m http.server 8000

# Node
npx http-server -p 8000

# Windows shortcut
start-server.bat   # tries Python first, falls back to Node
```

Open http://localhost:8000.

---

## Directory Structure

```
InteractivePianoHelper/
├── index.html                   # Single-page app entry point; boot sequence, event wiring, emergency fallback
├── css/
│   ├── styles.css               # Core styles (piano keys, controls, layout)
│   └── mobile.css               # Mobile overrides + resize-handle styles
├── js/
│   ├── audioEngine.js           # Web Audio API synth (AudioEngine class)
│   ├── piano.js                 # 88-key DOM piano component (Piano class)
│   ├── player.js                # Pattern playback loop (Player class)
│   ├── settings.js              # Tempo/sustain/key state + localStorage (Settings class)
│   ├── simplePatternLoader.js   # SimplePatternLoader: registry + VexFlow notation + pattern auto-loader
│   ├── staffNotationRenderer.js # drawStaffNotation(): VexFlow two-stave rendering
│   ├── physicsControlsPanel.js  # generatePhysicsControls(): builds sidebar sliders dynamically
│   ├── mobileMenu.js            # initializeMobileMenu(): sidebar drawer toggle
│   ├── pianoResizeHandler.js    # initializePianoResize(): drag-to-resize + localStorage persist
│   ├── patternLoader.js         # PatternLoader base class: registry + ABC notation helpers
│   ├── autoPatternLoader.js     # Dynamic import by probing a hardcoded list of names (AutoPatternLoader)
│   ├── patternDiscovery.js      # Alternate discovery; essentially same strategy as autoPatternLoader
│   └── patternImporter.js       # Static fallback: imports all 17 known patterns explicitly
└── patterns/               # One file per accompaniment style, each a plain JS object export
    ├── alberti.js           # Alberti bass (classic low-high-mid-high arpeggio)
    ├── waltz.js             # 3/4 bass-chord-chord
    ├── hymn.js              # Chorale, both hands (leftHand + rightHand)
    ├── classical.js         # Alberti + melody (leftHand + rightHand)
    ├── swing.js             # Walking bass + comping (leftHand + rightHand)
    ├── furelise.js          # Für Elise excerpt (leftHand + rightHand)
    └── ... (20 patterns total, see patterns/README.md)
```

---

## Architecture Overview

### Boot sequence (`index.html` `<script type="module">`)

1. All 9 JS modules loaded in parallel via `Promise.all([...dynamic imports...])` with a single `APP_VERSION = Date.now()` cache-buster
2. `AudioEngine` instantiated (lazy — `AudioContext` only created on first note)
3. `Piano` built inside `#piano` div (DOM construction + event listeners)
4. `Settings` attached to slider/checkbox/select elements; settings loaded from `localStorage`
5. `Player` wired to `AudioEngine`, `Piano`, `Settings`
6. `SimplePatternLoader` calls `autoLoadPatterns()`
   - Probes ~20 known names via dynamic `import()` from `../patterns/`
   - Falls back to a hard-coded Alberti pattern if nothing loads
7. Pattern `<select>` populated; first pattern rendered
8. Physics (sound) controls generated dynamically into `#physicsControls`
9. Mobile menu and piano resize wired up

### Module dependency graph

```
index.html (boot + thin wrappers + event handlers)
  ├── audioEngine.js            (standalone)
  ├── piano.js                → audioEngine (passed in)
  ├── settings.js               (standalone, reads DOM IDs)
  ├── player.js               → audioEngine, piano, settings
  ├── simplePatternLoader.js    (dynamic imports ../patterns/*.js)
  ├── staffNotationRenderer.js  (reads global Vex from CDN; params: patternLoader, settings)
  ├── physicsControlsPanel.js   (param: engine)
  ├── mobileMenu.js             (DOM only)
  └── pianoResizeHandler.js     (DOM + localStorage)
```

### Pattern loading (three overlapping strategies)

The project has three nearly-identical pattern-loading strategies. At runtime only one is invoked:

| Module | Strategy | When used |
|---|---|---|
| `autoPatternLoader.js` | Dynamic `import()` against a ~50-name list | Primary path (via `PatternLoader.autoLoadPatterns`) |
| `patternDiscovery.js` | Same dynamic-import probe approach, 17-name list | Available but **not currently called** from index.html |
| `patternImporter.js` | Static `Promise.all([import(...)])` for 17 known patterns | Fallback if `autoLoadPatterns` returns 0 |

Adding a new pattern: create `patterns/foo.js`, export `const foo = { ... }`, and add `'foo'` to the `possiblePatterns` list in `autoPatternLoader.js`. The `patternImporter.js` fallback also needs updating if you want the static path covered.

---

## Key Modules In Detail

### `js/audioEngine.js` — `AudioEngine`

Web Audio API synth. Lazy `AudioContext` init (triggered on first `playNote` call, required by browser autoplay policy).

**Signal chain:**
```
OscillatorNode (triangle) → noteFilter (lowpass, damping sweep) → GainNode (envelope) ─┐
                                                                                         │
HarmonicOscillator (sine, 2×) → BiquadFilter → GainNode → DynamicsCompressor ──────────┤
                                                                                         ▼
                                                                                    masterGain
                                                                                    /    |    \
                                            ┌── dry ──────────────────────────────┘     |     └── convolver → reverbGain ──┐
                                            │                                            └── chorusDelay (LFO) → chorusGain ┤
                                            └─────────────────────────── postFxBus ◄──────────────────────────────────────┘
                                                                              │
                                                             mainFilter (lowpass: brightness × lidPosition)
                                                                              │
                                                                         destination
```

**Key design choices:**
- `duration > 5` seconds → manual-click path (held until `stopNote` called; key stored by note name)
- `duration ≤ 5` → automatic playback path (key stored as `noteName_startTime_random`, auto-cleans after timeout)
- `isAutomatic` flag prevents stuck-key logic from interrupting pattern notes
- **chorus**: wet/dry delay line with 0.7 Hz LFO modulation; `chorus` param scales wet mix (0–40%) and LFO depth
- **roomSize**: `ConvolverNode` with a programmatically generated impulse response (0.1–2.6 s); `roomSize` scales wet mix (0–35%) and decay length
- **damping**: per-note `noteFilter.frequency` ramps from bright → muffled during decay; depth and speed scale with `damping`
- **lidPosition**: multiplies the main filter cutoff (0.6–1.0×); lower = darker (closed lid)
- **pedalResonance**: when `useSustain=true`, adds a faint 2nd-harmonic sine with a 150ms delayed bloom; amplitude scales with `pedalResonance`
- `sustainEnabled` flag mirrors the sustain checkbox; kept in sync via `setSustainEnabled(bool)`, wired from `Settings.onSustainChange` in `index.html` — no DOM coupling inside the audio module

**Supported note names:** `A0`–`C8` in scientific pitch notation. Enharmonic aliases supported (`Bb` = `A#`, `Db` = `C#`, etc.).

### `js/piano.js` — `Piano`

Renders an 88-key piano into a container div. Keys are DOM elements with `data-note` attributes.

**Interaction model:**
- `mousedown` on key → `startNote(note)` → plays a 30-second note (manual path), highlights key
- `mouseup` anywhere on `document` → stops all non-held notes
- `mouseenter` while mouse button held → plays key (glissando support)
- `Ctrl+click` → adds key to `heldKeys` set — note stays playing until `Ctrl` released
- `document.mouseleave` → emergency stop all non-held notes

**Flat-to-sharp lookup:** `highlightKey`/`unhighlightKey` convert `Bb3` → `A#3` etc. for DOM lookup. Only single-character flat conversions supported.

**Debug logging:** ~30 `console.log` calls with emoji left in from development. These fire on every key event.

### `js/player.js` — `Player`

Polling-based playback loop (20ms `setTimeout` interval). Checks elapsed time against beat duration; fires note when due.

**Two-hand support:** `play()` resolves `leftHand`/`rightHand` (or falls back to `pattern`). The loop indexes both arrays simultaneously. If the arrays are different lengths, they both independently wrap modulo their own length.

**Tempo changes during playback** are handled naturally — `getBeatDuration()` is read every poll cycle.

**Gotcha:** Right-hand note entries that are chord arrays (e.g. `['C3','E3','G3']`) are passed directly to `audioEngine.playNote` — the player does not iterate them, so chords in `rightHand` may not play as expected.

### `js/settings.js` — `Settings`

Simple pub/sub over tempo, sustain, and key. Persists to `localStorage` under key `pianoHelperSettings`. `getBeatDuration()` returns `60000 / tempo` ms.

### `js/patternLoader.js` — `PatternLoader`

Registry (`Map<id, pattern>`) + notation helpers.

**`generateABCNotation()`** — generates ABC text from a pattern. The output is never rendered in the UI (VexFlow is used for rendering instead). The ABC method has a bug: for octave 6+ it appends one `'` per octave starting from 6, missing the octave-5 case correctly but over-generating for 6+.

**`generateVexFlowNotation()`** — defined as an inline method inside the `SimplePatternLoader` subclass in `index.html`, not in the base class. It builds a data object (`{ timeSignature, bassClef, trebleClef }`) consumed by `drawStaffNotation()`.

---

## Pattern File Format

### Minimal (single-voice)

```js
export const mypattern = {
  name: 'Display Name',
  description: 'What this pattern is.',
  pattern: () => ['C3', 'E3', 'G3'],  // C major only; transposition is automatic
  timing: [1, 1, 1],                  // beats per note (1 = quarter note at current BPM)
  fingering: [5, 3, 1],               // optional, shown in VexFlow
  timeSignature: '3/4',
  tempo: { min: 60, max: 180, default: 120 }
};
```

### Two-hand

```js
export const mypattern = {
  name: '...',
  leftHand: (key) => [...],
  rightHand: (key) => [...],    // null entries are rests
  leftHandFingering: [...],
  rightHandFingering: [...],
  timing: [...],
  timeSignature: '4/4'
};
```

Both the Player and the VexFlow renderer read `leftHand`/`rightHand`. There is no longer a separate `bassClef`/`trebleClef` naming — all patterns use the same fields for both playback and notation.

**Key transposition:** Pattern functions only need to implement the C major version. `_resolveNotes()` (in `simplePatternLoader.js`) and `_resolveNotesP()` (in `player.js`) always call `fn('C')` and transpose chromatically for all other keys. Flat keys (F, B♭, E♭, A♭, D♭, Dm) produce flat enharmonics (e.g. B♭4 instead of A♯4). Chord arrays (`['C4','E4','G4']`) are transposed element-wise. Patterns that are not transposable (e.g. `furelise`) set `nativeKey: 'Am'`; for these, `fn(key)` is called directly and returns `null` for unsupported keys (stave shown empty).

**Chord notation:** `['C4','E4','G4']` inside a note array = simultaneous chord. `null` = rest.

---

## Tech Stack

| Technology | Version | How used |
|---|---|---|
| Vanilla JS ES Modules | Native | All modules, no transpilation |
| Web Audio API | Browser native | Audio synthesis |
| VexFlow | 4.2.2 (CDN) | Staff notation rendering |
| Google Fonts — Libre Baskerville | CDN | Serif UI typography |
| Google Material Icons | CDN | Mobile menu toggle icons |
| CSS Custom Properties | None used | (plain CSS only) |

No `package.json`. No bundler. No TypeScript. No tests.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  header (Piano Patterns, controls row)                  │
├──────────────────────────────┬──────────────────────────┤
│  .piano-section              │  .physics-sidebar         │
│  - pattern info              │  (Piano Controls sliders) │
│  - staff notation (VexFlow)  │  (hidden on mobile)       │
│  - [main content area]       │                           │
├──────────────────────────────┴──────────────────────────┤
│  .piano-keyboard-container (fixed bottom on mobile)     │
│  ├── resize handle                                       │
│  └── .piano-container → .piano (88 keys)                │
└─────────────────────────────────────────────────────────┘
```

Desktop: sidebar is always visible. Mobile (≤768px): sidebar is a fixed-position drawer toggled by hamburger icon; piano keyboard is fixed to the bottom 25vh.

---

## VexFlow Notation Rendering

`generateVexFlowNotation()` lives on `SimplePatternLoader` in `js/simplePatternLoader.js`. `drawStaffNotation()` is in `js/staffNotationRenderer.js`. Both are dynamically imported into `index.html`; a thin wrapper in the inline script calls them with the current `patternLoader` and `settings`.

- **Responsive width** — SVG width is set to `vexFlowDiv.clientWidth - 40` (subtracting CSS padding); falls back to 800 if the element has not yet laid out.
- **Multi-measure layout** — notes are grouped into per-measure arrays using beat-count arithmetic (`bpm = numBeats × 4/beatValue`). Measures are distributed across horizontal systems (lines); the number of measures per line is `floor((width - headerWidth) / 80)`.
- **Bar lines** — each measure is a separate `VF.Stave`; VexFlow automatically draws a right bar line at each stave boundary.
- **Dotted notes** — VexFlow 4 separates tick count (set by the `'d'` suffix in the duration string, e.g. `'qd'`, `'8d'`) from visual rendering of the augmentation dot (requires an explicit `VF.Dot.buildAndAttach([sn], { all: true })` call). Both are needed; omitting the modifier call leaves notes visually undotted even though they occupy the correct number of ticks.
- **Rest fill sizes** (`REST_FILL_SIZES`) exclude dotted values (1.5, 0.75) to avoid VexFlow's ambiguous `'xdr'` duration parsing for rests. Dotted rest durations are decomposed into two plain rests instead (e.g. 1.5 → quarter + eighth).
- **Ties for cross-bar notes** — when a note duration overflows a bar line and both parts are standard VexFlow durations (0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4), the note is split into two tied `StaveNote` objects connected by `VF.StaveTie`. Cross-system ties are skipped.
- **System headers** — first system gets clef + key sig + time sig; subsequent systems get clef + key sig only.
- Sources `leftHand`/`rightHand` from the pattern — same fields the Player uses.
- Falls back gracefully: if no `rightHand` data exists, treble stave shows a single whole-measure rest per measure (not individual rests per note).
- Fingering numbers shown as `VF.Annotation` modifiers.
- VexFlow errors are caught and logged silently.

---

## Cache Busting

All modules are loaded via a single `Promise.all` at the top of the inline script using a computed version:

```js
const APP_VERSION = Date.now();
// all imports: import(`./js/foo.js?v=${APP_VERSION}`)
```

`Date.now()` changes on every page load, so the browser always fetches fresh modules — no manual bumping needed. For a production deployment, replace `Date.now()` with a fixed build timestamp string to allow caching between loads.

---

## Known Design Issues & Future Optimizations

### Architecture

1. **Three redundant pattern loaders** — `autoPatternLoader.js`, `patternDiscovery.js`, and `patternImporter.js` all do essentially the same thing. Only one path is used. Consolidate into a single loader or use true directory listing via a backend endpoint.

2. **No real auto-discovery** — `simplePatternLoader.js` probes a hardcoded list of ~20 names. Adding a new pattern requires editing the `knownPatterns` array there. True auto-discovery would require a server-side directory listing endpoint.

### Audio

3. **Only triangle + sine waves** — no sampled audio, no per-note velocity curves beyond a linear amplitude scale. A Soundfont loader would dramatically improve realism.

4. **Room-Size Slider bug** when changing the room size slider while the player is playing a note the note or notes that are played during dragging the slider never get released.

### Player

5. **Polling loop jitter** — the 20ms `setTimeout` poll accumulates drift. Replace with `AudioContext`-time-based scheduling (`audioContext.currentTime`) for sample-accurate timing.

6. **No quantization or swing timing** — all notes play straight. Swing patterns are labeled "swing" but play straight eighth notes.

7. **Chord arrays not played** — the Player passes note entries directly to `audioEngine.playNote`; if an entry is an array (chord), it is not iterated. Both `leftHand` and `rightHand` chords are silently skipped.

### UX

9. **Debug `console.log` spam** — `piano.js` logs every mouse event with emoji. Remove before any production/public deployment.

10. **No keyboard (computer keyboard) input** — only mouse interaction supported; no QWERTY-to-piano mapping.

11. **No touch support for playing notes** — mobile piano shows key highlights during pattern playback but manual touch-to-play is not implemented.

12. **Settings not restored from localStorage on key/pattern change** — `Settings.load()` is called once at startup; key changes update only the in-memory state, not the `<select>` if changed programmatically.
