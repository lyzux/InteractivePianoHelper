---
created: 2026-05-14T11:49:50.088Z
title: Harden notation playback contract
area: general
files:
  - CLAUDE.md:277
  - js/staffNotationRenderer.js
  - js/player.js
  - js/simplePatternLoader.js
  - patterns/lombardisch.js
  - patterns/furelise.js
---

## Problem

The workspace evaluation in `CLAUDE.md` identifies the app's strongest areas as sound generation, the 88-key keyboard display, and keyboard/button responsiveness. Those should remain stable for now. The important risk is the contract between pattern data, playback, and notation rendering.

Current behavior is not yet robust enough for score-like material:

- `js/staffNotationRenderer.js` caps long notation at `MAX_DISPLAY_MEASURES = 8`, so longer pieces such as `patterns/furelise.js` are cut off instead of shown as complete sheet music.
- Short loop patterns can display differently from what playback actually performs. `patterns/lombardisch.js` defines a 4-note, 2-beat source cycle, but the renderer expands it to fill a 4/4 measure while playback loops the raw 4 notes.
- Existing pattern files are executable JavaScript modules and are only implicitly validated, which makes malformed notes, timing mismatches, unsupported native keys, and unsupported score-like cases easy to miss.
- The app should eventually prefer MusicXML for complete pieces, but the immediate work should not destabilize sound generation or the keyboard UI.

## Solution

Start with the high-achievability fixes from `CLAUDE.md`:

1. Introduce a shared sequence or score resolver used by both `Player` and `staffNotationRenderer`, so playback and visible notation are derived from the same canonical events.
2. Replace the hard 8-measure notation cap with explicit display modes: compact loop preview for accompaniment patterns and full score rendering for piece-like content.
3. Add clear unsupported-key handling for native-key pieces such as Für Elise.
4. Add pattern validation around required fields, note ranges, rests, timing values, time signatures, native-key behavior, and cyclic length assumptions.
5. Defer major sound, keyboard UI, and framework changes until the notation/data contract is trustworthy.
