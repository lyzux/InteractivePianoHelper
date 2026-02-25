# Interactive Piano Helper

A small, modular web app for learning and practicing piano bass/accompaniment patterns. It ships a reusable 88‑key piano UI, a simple Web Audio–based piano sound, and pattern playback. Patterns live in separate files under `patterns/` and are auto‑discovered at runtime.

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
    settings.js         # Tempo, sustain, key; events + localStorage
    player.js           # Pattern playback/looping
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
- Pattern playback with tempo control and sustain pedal
- Auto‑discovery of patterns under `patterns/`
- Optional two‑hand patterns (left/right or bass/treble)
- VexFlow is included via CDN in `index.html` for future/staff rendering placeholders

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

Notes use scientific names like `C3`, `F#4`. Provide arrays for chords, and `null` for rests. The player loops patterns; if your note list is shorter than the timing list, values repeat modulo their lengths.

Naming rules that help auto‑loading:
- File name and exported constant should match (e.g., `alberti.js` exports `alberti`).
- Keep IDs lowercase ASCII without spaces.

## Modules Overview

- `js/audioEngine.js`: Web Audio–based, parameterized synth (attack/release, brightness, harmonics, pedal resonance).
- `js/piano.js`: 88‑key UI with mouse interaction and highlighting.
- `js/settings.js`: Central tempo/sustain/key state + change callbacks.
- `js/player.js`: Drives timed playback; supports optional two‑hand patterns.
- `js/patternLoader.js`: Registry + ABC text generator helper. Note: ABC rendering is not wired; VexFlow CDN is present for future staff rendering.
- `js/autoPatternLoader.js` and `js/patternDiscovery.js`: Two strategies for finding/loading patterns by name.
- `js/patternImporter.js`: Static import fallback that registers known patterns.

## Development Notes

- ES modules, no bundler. Serve over HTTP for module imports to work.
- VexFlow is included in `index.html`; wiring actual staff rendering is a good next step.
- Console logs include some debug output; feel free to trim for production.

## License

MIT — see `LICENSE`.

