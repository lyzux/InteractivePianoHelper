# CLAUDE.md — Interactive Piano Helper

## What This Project Does

A zero-dependency, vanilla-JS web app for learning and practicing piano bass/accompaniment patterns. It provides:

- An interactive **88-key piano** that plays sound on mouse interaction
- **Score playback** — accompaniment patterns and longer pieces played from a canonical sequence, with optional looping
- **Sheet notation** rendered via VexFlow as A4-style pages (bass + treble clefs, with fingering annotations)
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
│   ├── player.js                # Canonical score playback + optional loop (Player class)
│   ├── settings.js              # Tempo/sustain/swing state + localStorage (Settings class)
│   ├── simplePatternLoader.js   # SimplePatternLoader: registry + canonical display resolution
│   ├── staffNotationRenderer.js # drawStaffNotation(): A4-style VexFlow sheet rendering
│   ├── physicsControlsPanel.js  # generatePhysicsControls(): builds sidebar sliders dynamically
│   ├── mobileMenu.js            # initializeMobileMenu(): sidebar drawer toggle
│   └── pianoResizeHandler.js    # initializePianoResize(): drag-to-resize + localStorage persist
└── patterns/               # One file per accompaniment style, each a plain JS object export
    ├── index.js             # Pattern manifest — lists all pattern IDs; edit this to add new patterns
    ├── alberti.js           # Alberti bass (classic low-high-mid-high arpeggio)
    ├── waltz.js             # 3/4 bass-chord-chord
    ├── hymn.js              # Chorale, both hands (leftHand + rightHand)
    ├── classical.js         # Alberti + melody (leftHand + rightHand)
    ├── furelise.js          # Für Elise excerpt (leftHand + rightHand)
    └── ... (20 patterns total)
```

---

## Architecture Overview

### Boot sequence (`index.html` `<script type="module">`)

1. All 9 JS modules loaded in parallel via `Promise.all([...dynamic imports...])` with a single `APP_VERSION = Date.now()` cache-buster
2. `AudioEngine` instantiated (lazy — `AudioContext` only created on first note)
3. `Piano` built inside `#piano` div (DOM construction + event listeners)
4. `Settings` attached to tempo/sustain/swing controls; settings loaded from `localStorage`
5. `Player` wired to `AudioEngine`, `Piano`, `Settings`
6. `SimplePatternLoader` calls `autoLoadPatterns()`
   - Reads `PATTERN_IDS` from `patterns/index.js` (the single source of truth for pattern IDs)
   - Loads all patterns in parallel via `Promise.all` + dynamic `import()`
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

### Adding a new pattern

1. Create `patterns/foo.js` — export `const foo = { name, leftHand, rightHand, timing, ... }`
2. Add `'foo'` to the `PATTERN_IDS` array in `patterns/index.js`

That's it. `SimplePatternLoader.autoLoadPatterns()` picks it up automatically on next load.

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
AudioBufferSourceNode (MP3 sample) → sampleLevelGain ──────────────────────────► masterGain
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
- `isManualClick = duration > 5` (computed in `playNote` from the *original* `duration` argument, before it is scaled by `release`) → manual path: note held at sustain level until `stopNote` is called; key stored by note name. Any value ≤ 5 → automatic path (used by the player): note always fades via scheduled gain ramp; key stored as `noteName_startTime_random`, auto-cleans after the note ends. **Important:** `isManualClick` is determined from the original duration, not from `actualDuration = duration × release`. Using `actualDuration > 5` would incorrectly hold automatic notes at full gain for slow-tempo patterns (e.g. hymn at 60 BPM: `actualDuration = 4 × 4 = 16s`).
- `isAutomatic` flag prevents stuck-key logic from interrupting pattern notes
- **chorus**: wet/dry delay line with 0.7 Hz LFO modulation; `chorus` param scales wet mix (0–40%) and LFO depth
- **roomSize**: `ConvolverNode` with a programmatically generated impulse response (0.1–2.6 s); `roomSize` scales wet mix (0–35%) and decay length
- **damping**: per-note `noteFilter.frequency` ramps from bright → muffled during decay; depth and speed scale with `damping`
- **lidPosition**: multiplies the main filter cutoff (0.6–1.0×); lower = darker (closed lid)
- **pedalResonance**: when `useSustain=true`, adds a faint 2nd-harmonic sine with a 150ms delayed bloom; amplitude scales with `pedalResonance`
- `sustainEnabled` flag mirrors the sustain checkbox; kept in sync via `setSustainEnabled(bool)`, wired from `Settings.onSustainChange` in `index.html` — no DOM coupling inside the audio module
- **sampleBlend**: 88 MP3 samples from `third-party/piano-mp3/` are loaded into `sampleBuffers` at `init()` time. For each note, an `AudioBufferSourceNode` feeds `sampleLevelGain → masterGain` in parallel with the synth path. `sampleBlend` (0–1) scales the sample amplitude up while scaling the synth amplitude down (`synthScale = 1 - sampleBlend × 0.75`). At `sampleBlend = 0` the sample path is completely bypassed. Samples use flat-note naming (`Db4.mp3`); sharp inputs are mapped via `_toSampleKey()`.

**Supported note names:** `A0`–`C8` in scientific pitch notation. Enharmonic aliases supported (`Bb` = `A#`, `Db` = `C#`, etc.).

### `js/piano.js` — `Piano`

Renders an 88-key piano into a container div. Keys are DOM elements with `data-note` attributes.

**Interaction model:**
- `mousedown` on key → `startNote(note)` → plays a 30-second note (manual path), highlights key
- `mouseup` anywhere on `document` → stops all non-held notes
- `mouseenter` while mouse button held → plays key (glissando support)
- `Ctrl+click` → adds key to `heldKeys` set — note stays playing until `Ctrl` released
- `document.mouseleave` → emergency stop all non-held notes
- **QWERTY keyboard:** `a s d f g h j k l ;` = white keys C4–E5; `w e t y u o p` = black keys (see `KEYBOARD_MAP` constant). Key-repeat is suppressed. Input/select elements capture focus normally.
- **Touch:** `touchstart` on a key starts the note. `touchmove` uses `elementFromPoint` to detect when the finger slides to a new key (glissando). `touchend`/`touchcancel` stop the note. Multi-touch supported via `touch.identifier`.

**Flat-to-sharp lookup:** `highlightKey`/`unhighlightKey` convert `Bb3` → `A#3` etc. for DOM lookup. Only single-character flat conversions supported.

### `js/player.js` — `Player`

Web Audio API **lookahead scheduler** (25ms `setTimeout` poll, 150ms lookahead). Notes are scheduled into the audio graph in advance using `audioEngine.playNote(..., startTime)`, eliminating `Date.now()`-based jitter. Visual key highlights are triggered with matching `setTimeout` delays calibrated to `startTime − currentTime`.

**Two-hand support:** `play()` consumes canonical sequence events, preserving separate left/right material where present.

**Looping:** `play(sequence, { loop })` loops the complete canonical sequence only when `loop` is true. The Loop checkbox is off by default.

**Tempo changes** take effect for notes not yet scheduled (within the next 150ms); already-scheduled audio nodes play at their original timing.

**Swing timing:** `_noteDurationSec(rawBeats)` reads `settings.getSwingRatio()` (0.5–0.75). When swing > 0.5 and `rawBeats === 0.5`, the note's duration alternates long (`ratio × beatSec`) / short (`(1-ratio) × beatSec`) based on `beatPosition % 1`. Two consecutive swung eighth notes always sum to exactly one beat. Quarter notes and other durations are unaffected.

**Ghost-highlight prevention:** `_visualTimeouts` tracks all pending `setTimeout` IDs; `stop()` cancels them all before calling `piano.clearAllHighlights()`.

### `js/settings.js` — `Settings`

Pub/sub over tempo, sustain, and swingRatio. Persists to `localStorage` under key `pianoHelperSettings`. `getBeatDuration()` returns `60000 / tempo` ms. Legacy key data in stored settings is ignored by the active product path.

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

**Authored-key display:** The active UI resolves each pattern through `resolvePatternSequenceForDisplay()`, using `nativeKey` when present and `C` otherwise. The old key-changing control has been removed from the active product path so pieces display and play as authored. Lower-level resolver methods still accept a key argument for compatibility and future import work.

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

- **A4-style pages** — `drawStaffNotation()` creates `.score-sheet-view`, `.score-page-grid`, and one `.score-page` per page plan. Each VexFlow SVG uses a 794 × 1123 viewBox.
- **Full-score layout** — `buildScoreMeasures(sequence)` groups canonical events into measures. `planScorePages(measureCount)` covers the complete score without the old first-eight-measures cap.
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

## Product Evaluation And Improvement Plan

### Current Evaluation

The app is strongest where it is already intentionally simple:

- **Sound generation:** good enough for the current learning goal. Keep this stable for now instead of spending effort on synthesis polish.
- **88-key keyboard display and input response:** very good. Mouse, touch, QWERTY input, visual key highlights, and playback highlights are a solid foundation.
- **Playback:** musically useful and already uses a proper Web Audio lookahead scheduler. Playback also drives keyboard highlights, which is a strong user-facing feature.

The weakest area is the contract between **pattern data**, **playback**, and **notation rendering**. The current pattern format is flexible but under-validated, and the renderer makes display-only decisions that do not always match playback behavior.

Concrete issues observed before Phase 02:

- Phase 02 removed the old first-eight-measure display cap and now renders complete canonical score sequences as A4-style pages.
- Phase 02 routes display and playback through the same canonical score source, so short accompaniment cycles no longer use a separate display-only expansion path.
- Pattern files are executable JavaScript modules, not data. They are convenient for hand-written examples, but they are hard to validate thoroughly, hard to import from notation software, and easy to make subtly inconsistent.
- Validation is mostly implicit. Missing fields, mismatched note/timing/fingering lengths, unsupported notes, unsupported keys, impossible durations, and very long pieces are not surfaced to the user in a structured way.
- The notation renderer is a custom layout layer over VexFlow. It can render simple material, but it is carrying more responsibility than it should for complete score display, pagination, systems, rests, ties, and edge cases.

### Improvement Goals

1. Make playback and notation derive from one canonical sequence so visible notes and played notes always agree.
2. Always render complete notation for complete pieces, especially MusicXML imports and longer examples such as Für Elise.
3. Replace or supplement executable pattern files with validated data, preferably MusicXML for real pieces and a strict JSON schema for short generated patterns.
4. Surface validation errors and warnings clearly in development and gracefully in the UI.
5. Preserve the parts that already work well: sound generation, keyboard interaction, and the lightweight no-build development loop where possible.

### Recommended Direction

The best long-term direction is a **two-format model**:

- **MusicXML for complete pieces and externally authored music.** This should become the preferred input for full sheet music, imported examples, and anything expected to look like a real score.
- **Strict internal pattern JSON for small pedagogical accompaniment loops.** This keeps simple rhythm-pattern authoring lightweight while still allowing validation and deterministic playback.

This is more achievable than making MusicXML the only format immediately. MusicXML is excellent for notation fidelity, but it is more complex than the current loop-pattern concept. A small validated pattern schema can preserve the current app's fast authoring workflow while MusicXML support grows.

### Option Weighing

| Option | Achievability | Workload | Quality | Robustness | Notes |
|---|---:|---:|---:|---:|---|
| Patch current renderer only | High | Low-Medium | Medium | Medium | Fixes Lombard display/playback mismatch and removes the 8-measure cap, but custom notation edge cases remain. |
| Add validation to current JS patterns | High | Medium | Medium | Medium-High | Good immediate safety net. Still leaves executable JS as the source format. |
| Convert patterns to strict JSON | Medium-High | Medium | High | High | Easier to validate and test. Loses function-based transposition unless transposition is moved into shared app logic. |
| Add MusicXML import beside existing patterns | Medium | High | High | High | Best user-facing upgrade for real sheet music. Requires parser, validation, score-to-playback conversion, and renderer strategy. |
| Replace VexFlow custom layout with a MusicXML-oriented renderer | Medium | High | Very High | High | Best for complete sheet notation. Needs dependency decision and more testing. |
| Full rewrite with framework/build step | Low-Medium | Very High | Unclear | Unclear | Not recommended now. The current architecture is small and understandable. |

### Phase 1: Make Current Behavior Consistent

**Goal:** remove the most visible clunkiness without changing the whole data model.

- Fix notation/playback mismatch for short patterns:
  - Introduce a shared `SequenceResolver` module used by both `Player` and `staffNotationRenderer`.
  - Resolve each pattern into a canonical event list: `{ startBeat, durationBeats, left, right, fingering, sourceIndex }`.
  - Decide explicitly whether a pattern is displayed as:
    - one source cycle, exactly as played, or
    - one full musical measure, with playback using the same expanded sequence.
  - For Lombard rhythm, prefer displaying and playing the same 4-note cycle unless the UI labels the display as a full-measure expansion.
- Remove the hard cut-off for long pieces:
  - Phase 02 now renders all canonical measures on A4-style score pages.
  - Future display modes can still distinguish compact practice previews from full score display, but the active UI currently prefers full score preview.
  - Für Elise uses authored-key score resolution and renders the complete available excerpt.
- Add basic renderer overflow handling:
  - Ensure the notation container scrolls vertically or expands naturally.
  - Keep the piano usable at the bottom without hiding the last systems.
- Add visible messages for unsupported native keys:
  - Example: Für Elise is only available in A minor. If another key is selected, show a clear notation message instead of an empty or broken staff.

**Achievability:** high.  
**Workload:** low to medium.  
**Quality gain:** high for user trust.  
**Robustness gain:** medium.

### Phase 2: Add Validation Around Existing Patterns

**Goal:** make the current format safer before introducing MusicXML.

- Create a `PatternValidator` module that checks:
  - required fields: `name`, `description`, `timing`, and at least one of `pattern`, `leftHand`, `rightHand`;
  - valid note names from `A0` to `C8`, including flats/sharps and chord arrays;
  - valid rests as `null`;
  - valid timing values or supported duration fractions;
  - valid `timeSignature`;
  - matching or intentionally cyclic lengths for notes, timings, and fingerings;
  - valid `nativeKey` behavior;
  - playable keyboard range after transposition;
  - empty-hand and all-rest cases.
- Run validation after `autoLoadPatterns()`.
- Display developer-facing warnings in the console with pattern IDs and exact field paths.
- Display user-facing errors only when a selected pattern cannot be rendered or played.
- Stop silently swallowing dynamic import failures in `simplePatternLoader.js`; log enough information to debug broken pattern files.

**Achievability:** high.  
**Workload:** medium.  
**Quality gain:** medium.  
**Robustness gain:** high.

### Phase 3: Introduce A Canonical Internal Score Model

**Goal:** separate "input format" from "thing the app plays and renders".

Add an internal model such as:

```js
{
  id,
  title,
  sourceType: 'pattern' | 'musicxml',
  mode: 'loop' | 'score',
  keySignature,
  timeSignature,
  tempo,
  parts: [
    {
      id: 'leftHand',
      clef: 'bass',
      events: [
        {
          measure,
          startBeat,
          durationBeats,
          notes: ['C3'],
          fingering: [5],
          tieStart: false,
          tieStop: false
        }
      ]
    }
  ]
}
```

Both playback and notation should consume this model. Current JS patterns and future MusicXML files should be adapters into this model.

Benefits:

- Playback and notation cannot drift as easily.
- Validation can target one internal representation.
- MusicXML support can be added without rewriting the player.
- The app can support score navigation, looping selected measures, and future practice features.

**Achievability:** medium-high.  
**Workload:** medium-high.  
**Quality gain:** high.  
**Robustness gain:** high.

### Phase 4: Add MusicXML Input

**Goal:** make real sheet music the preferred source for complete pieces.

Implementation choices:

1. **Client-side MusicXML parsing with a browser-compatible parser**
   - Achievability: medium.
   - Workload: high.
   - Quality: high if the parser handles common MusicXML exports.
   - Robustness: high with validation and good error reporting.
   - Best fit if the app remains static and GitHub Pages friendly.

2. **Use a rendering library that already understands MusicXML**
   - Possible direction: OpenSheetMusicDisplay for score rendering, while still converting notes into the internal playback model.
   - Achievability: medium.
   - Workload: medium-high.
   - Quality: very high for complete sheet display.
   - Robustness: high for notation, but playback extraction still needs careful mapping.

3. **Server-side conversion**
   - Achievability: low for the current project shape.
   - Workload: high.
   - Quality: high possible.
   - Robustness: high possible.
   - Not recommended unless the project stops being a static app.

Recommended path: investigate **OpenSheetMusicDisplay** or a similar browser-side MusicXML renderer first. If it integrates cleanly, use it for full-score rendering and keep VexFlow/custom rendering only for small pattern previews. If it is too heavy, parse MusicXML into the internal score model and continue rendering with VexFlow, accepting more custom layout work.

MusicXML validation should include:

- file type and XML parse errors;
- required score structure;
- supported divisions/durations;
- supported note pitches, rests, chords, ties, accidentals, clefs, key signatures, and time signatures;
- part-to-hand mapping;
- unsupported notation warnings that do not block playback when safe;
- clear import summary: title, parts, measures, detected key/time, warnings.

**Achievability:** medium.  
**Workload:** high.  
**Quality gain:** very high.  
**Robustness gain:** high.

### Phase 5: Score Display And Practice UX

**Goal:** make complete sheet music feel intentional, not squeezed into a pattern preview.

- Add display modes:
  - `Pattern Preview`: compact one-cycle or one-measure accompaniment view.
  - `Sheet Music`: complete systems, full vertical scroll, stable measure layout.
  - `Practice Range`: selected measures only.
- Add score navigation:
  - current measure tracking during playback;
  - auto-scroll to current system;
  - optional loop selected measure range;
  - clickable measure or note to start playback from that point.
- Highlight notation from canonical event IDs, not modulo pattern indices.
- Keep keyboard highlights synchronized from the same events.

**Achievability:** medium.  
**Workload:** medium-high.  
**Quality gain:** high.  
**Robustness gain:** medium-high.

### Phase 6: Testing And Regression Safety

**Goal:** prevent notation/playback regressions as formats grow.

- Add a minimal `package.json` only when needed for test tooling.
- Unit-test:
  - note parsing and enharmonic conversion;
  - transposition;
  - timing-to-duration conversion;
  - measure grouping;
  - validation failures;
  - pattern-to-score conversion;
  - MusicXML-to-score conversion.
- Add fixture tests for:
  - Lombard rhythm;
  - Für Elise excerpt;
  - patterns with chords;
  - patterns with rests;
  - dotted rhythms;
  - ties across measures;
  - unsupported native key selection.
- Add lightweight browser smoke tests:
  - app boots;
  - patterns load;
  - notation renders non-empty SVG;
  - play/stop does not leave stuck highlights.

**Achievability:** high.  
**Workload:** medium.  
**Quality gain:** medium-high.  
**Robustness gain:** very high.

### Recommended Implementation Order

1. Fix Lombard-style display/playback consistency and remove the long-score cut-off via explicit render modes.
2. Add `PatternValidator` and stop silent loader failures.
3. Introduce a canonical internal score/event model shared by playback and notation.
4. Convert existing JS patterns through an adapter into that model.
5. Add MusicXML import/rendering proof of concept with one known-good file.
6. Decide whether full-score rendering stays custom VexFlow or moves to a MusicXML-oriented renderer.
7. Add score/practice UX: full sheet display, current-measure tracking, auto-scroll, and measure-range looping.
8. Add regression tests around conversion, rendering inputs, and playback scheduling.

### What Not To Prioritize Yet

- Do not spend major effort on sound generation unless a specific playback bug appears.
- Do not redesign the keyboard UI; it is already one of the app's best parts.
- Do not start with a full framework rewrite. The real architectural problem is data/model consistency, not lack of a framework.
- Do not make MusicXML the only supported format immediately. Short pedagogical patterns are valuable and easier to author in a compact validated format.
