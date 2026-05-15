# Interactive Piano Helper

A small, modular web app for learning and practicing piano bass/accompaniment patterns. It ships a reusable 88‑key piano UI, a simple Web Audio–based piano sound, and pattern playback. Patterns live in separate files under `patterns/` and are auto‑discovered at runtime.

preview on:
https://lyzux.github.io/InteractivePianoHelper/

## Quick Start

- Prerequisites: a modern browser with ES modules. Run over HTTP (file:// won’t work due to module imports).
- Windows: double‑click `start-server.bat` and open http://localhost:8000
- Python: run `python -m http.server 8000` from the repo root, then open http://localhost:8000
- Node: run `npx http-server -p 8000`, then open http://localhost:8000

## Project Structure

```
InteractivePianoHelper/
  index.html            # Main app page
  css/
    styles.css          # Core styles
    mobile.css          # Mobile tweaks
  js/
    audioEngine.js      # Web Audio piano synth
    piano.js            # Reusable 88‑key piano component
    settings.js         # Tempo, sustain, swing; events + localStorage
    player.js           # Score playback with optional looping
    patternLoader.js    # Pattern registry + helpers
    autoPatternLoader.js# Attempts to auto‑load patterns by common names
    patternDiscovery.js # Alternate discovery by known IDs
    patternImporter.js  # Static import of known patterns (fallback)
  patterns/             # Individual accompaniment patterns (auto‑loaded)
  start-server.bat      # Simple local HTTP server helper (Windows)
  LICENSE               # MIT License
```

## Features

- Interactive 88‑key piano with visual highlight
- Simple, musical Web Audio piano synth with harmonics
- Score playback with tempo control, sustain pedal, and optional looping
- Auto‑discovery of patterns under `patterns/`
- Optional two‑hand patterns (left/right or bass/treble)
- Full-score A4-style sheet display rendered with VexFlow
- Browser-only MusicXML import for strict piano-oriented `.musicxml` and `.xml` scores
- Selected measure range looping and auto-follow during score playback

## MusicXML Import And Practice

Use **Import MusicXML** in the score library to add a `.musicxml` or `.xml` file. The app parses the file in the browser as inert data, validates it strictly, converts accepted scores into the same canonical score sequence used by notation and playback, and then displays the score as VexFlow sheet pages. Static hosting is still enough; no backend or build step is required.

Imports are stored locally in this browser with IndexedDB for the current origin. `http://localhost:8000`, another local port, and the GitHub Pages URL each have separate imported-score libraries. Clearing site data removes imported scores. The app does not upload imported files, sync them between browsers, or modify the original file.

If an imported title already exists, the new score is kept as a separate entry with a suffix such as `Title (2)`. The remove button deletes only the selected imported score from this browser and does not affect built-in scores, original files, piano settings, or sound controls.

Strict import currently supports a focused piano-oriented MusicXML subset. Unsupported roots, unsupported parts/features, malformed XML, and files that cannot map to playable canonical events are rejected with a short error and expandable import details.

For practice, Shift+click rendered measures to choose a selected range. On touch devices, use Range mode, then tap the start and end measures. Play starts from the selected range start; when Loop is enabled, playback loops the selected range instead of the whole score. Stop clears playback highlights and active piano keys while keeping the selected range. During playback, Auto-follow scrolls the score to the current system; manual scrolling pauses it until **Resume follow** or a playback restart.

## Adding Patterns

Create a new `.js` file in `patterns/` and export a constant whose name matches the filename. The loader tries common names and registers what it can find.

Minimum (legacy) shape:

```js
// patterns/minuet.js
export const minuet = {
  name: 'Minuet',
  description: 'Simple quarter‑note pattern',
  pattern: (key) => {
    const map = { C: ['C3','E3','G3','E3'] };
    return map[key];
  },
  timing: [1, 1, 1, 1],         // beats per note
  fingering: [5, 3, 1, 3],      // optional
  timeSignature: '4/4',
  tempo: { min: 60, max: 160, default: 120 }
};
```

Two‑hand options are also supported; use either left/right or bass/treble naming:

```js
export const hymn = {
  name: 'Hymn',
  leftHand: (key) => ['C3', ['C3','G3','C4'], 'G2', ['G2','D3','G3']],
  rightHand: (key) => ['E4','G4','C5','G4'],
  leftHandFingering: [5, [1,2,5], 5, [1,2,5]],
  rightHandFingering: [1, 3, 5, 3],
  timing: [1, 1, 1, 1],
  timeSignature: '4/4'
};
```

Notes use scientific names like `C3`, `F#4`. Provide arrays for chords, and `null` for rests. Playback follows the canonical score sequence and loops only when the Loop control is enabled.

Naming rules that help auto‑loading:
- File name and exported constant should match (e.g., `alberti.js` exports `alberti`).
- Keep IDs lowercase ASCII without spaces.

## Modules Overview

- `js/audioEngine.js`: Web Audio–based, parameterized synth (attack/release, brightness, harmonics, pedal resonance).
- `js/piano.js`: 88‑key UI with mouse interaction and highlighting.
- `js/settings.js`: Central tempo/sustain/swing state + change callbacks.
- `js/player.js`: Drives timed playback; supports optional two‑hand scores and complete-sequence looping.
- `js/staffNotationRenderer.js`: Renders complete canonical score sequences as A4-style VexFlow pages.
- `js/patternLoader.js`: Registry + ABC text generator helper retained for legacy compatibility.
- `js/autoPatternLoader.js` and `js/patternDiscovery.js`: Two strategies for finding/loading patterns by name.
- `js/patternImporter.js`: Static import fallback that registers known patterns.

## Development Notes

- ES modules, no bundler. Serve over HTTP for module imports to work.
- VexFlow is included in `index.html` and used for the current sheet music renderer.
- MusicXML import uses browser file input, strict parser/adapter modules, IndexedDB storage, and the same validated score sequence used by playback and notation.
- Short pedagogical patterns remain supported through the current validated pattern source path.
- Console logs include some debug output; feel free to trim for production.

## Automated Checks

Run the fast Node contract suite:

```bash
npm test
```

Run the browser smoke check:

```bash
npm run test:smoke
```

The smoke test uses Playwright and serves the static app on `127.0.0.1`. On this development image Playwright's managed Chromium download does not support Ubuntu 26.04, so the test uses a Chromium-compatible system browser such as `/usr/bin/google-chrome`. If your browser lives elsewhere, set:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome npm run test:smoke
```

## Manual score display smoke check

Serve the static app from the repo root:

```bash
npx http-server -p 8000
```

Then open http://localhost:8000 and verify:

- The app boots and the pattern dropdown populates.
- Fur Elise renders as complete A4-style sheet pages.
- The final page scrolls above the fixed piano keyboard.
- The Loop checkbox starts off.
- Play without Loop stops after the complete score sequence.
- Play with Loop enabled repeats after the complete score sequence.
- Notation highlights follow playback on later pages, not only the first page.
- Import a supported `.musicxml` or `.xml` file and verify it appears in the score library after reload.
- Select a measure range and confirm Loop repeats only that range.
- Scroll manually during playback, then use Resume follow to continue automatic score following.

## License

MIT — see `LICENSE`.
