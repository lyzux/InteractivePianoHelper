# Phase 02 Pattern Map

**Phase:** 02 - Score Display Modes
**Created:** 2026-05-15

## Purpose

This map anchors Phase 02 planning to the current codebase instead of treating the
score work as a greenfield renderer. The existing app already has the important
Phase 01 contract: playback and notation share canonical events. Phase 02 should
preserve that contract while changing the score surface, key behavior, and loop
semantics.

## Source Touchpoints

| Target Area | Current File | Role | Reuse Pattern |
|-------------|--------------|------|---------------|
| App composition and controls | `index.html` | Owns controls, current sequence, playback button, notation highlight bridge | Keep vanilla module boot and local handler style; remove key control and add loop control here |
| Settings persistence | `js/settings.js` | Stores tempo, sustain, key, swing and callbacks | Keep tempo/sustain/swing persistence; stop key persistence from active UI path |
| Pattern registry | `js/simplePatternLoader.js` | Loads pattern modules and bridges to `resolvePatternSequence` | Add authored-key/display helpers here so UI and renderer do not inspect pattern internals repeatedly |
| Playback scheduler | `js/player.js` | Schedules canonical events, piano highlights, notation callback | Add `play(sequence, { loop = false } = {})` and keep current timer cleanup behavior |
| Notation renderer | `js/staffNotationRenderer.js` | Builds hand streams, measures, VexFlow notes, SVG highlight map | Extract pure measure/page planning helpers; render one SVG per A4 page; aggregate event map |
| Visual surface | `css/styles.css`, `css/mobile.css` | Controls and notation styles, fixed piano clearance | Replace framed notation box with sheet surface and page grid; keep mobile piano constraints |
| Regression tests | `tests/canonicalPatternResolver.test.js` | Native Node test runner for pure contracts | Add page planning/source contract tests without introducing a build step |

## Data Flow Pattern

Current Phase 01 flow:

1. `index.html` reads selected pattern and key.
2. `SimplePatternLoader.resolvePatternSequence(patternId, key)` returns canonical sequence.
3. `drawStaffNotation(patternLoader, settings, sequence)` renders sequence and returns `eventMap`.
4. `Player.play(sequence)` schedules sequence events and emits event IDs through `onNoteHighlight`.
5. `index.html` maps event IDs to SVG elements through `currentNotationMaps.eventMap`.

Phase 02 should keep the same flow, with these changes:

1. The selected pattern is resolved using the authored key: `pattern.nativeKey || 'C'`.
2. Key selection is removed from the user-facing state path.
3. `Player.play(sequence, { loop })` is controlled by an off-by-default loop input.
4. `drawStaffNotation` renders full score pages, not a capped preview SVG.
5. `eventMap` covers elements on every rendered page.

## Existing Code Excerpts To Respect

`index.html` already centralizes current sequence resolution:

```js
function resolveCurrentPatternSequence() {
    const patternSelect = document.getElementById('pattern');
    const patternType = patternSelect ? patternSelect.value : null;
    const key = settings && typeof settings.getKey === 'function' ? settings.getKey() : 'C';

    currentPatternSequence = patternType && patternLoader?.resolvePatternSequence
        ? patternLoader.resolvePatternSequence(patternType, key)
        : null;

    return currentPatternSequence;
}
```

Change this to use an authored-key helper rather than `settings.getKey()`.

`Player` already schedules canonical events and loops at the boundary:

```js
this.sequenceEvents = sequence.events;
...
const event = this.sequenceEvents[idx];
...
if (++this.noteIndex >= maxLen) {
    this.noteIndex = 0;
    this.beatPosition = 0;
}
```

Change only the boundary behavior: reset for loop mode, otherwise end playback after
the final scheduled event has had time to unhighlight.

`staffNotationRenderer.js` already builds measures and event maps:

```js
const bassMeasures = groupIntoMeasures(bc.notes, bc.timings, bc.fingerings, bpm, bc.eventIds);
fillMeasureRests(bassMeasures, bpm);
...
const eventHighlightMap = new Map();
```

Keep these concepts, but remove this cap as score authority:

```js
const MAX_DISPLAY_MEASURES = 8;
const numMeasures = Math.min(actualMeasureCount, MAX_DISPLAY_MEASURES);
```

## Implementation Boundary

In scope:

- Authored-key score resolution.
- Removing active key control and key-change wiring.
- Off-by-default loop control.
- A4 page containers with one VexFlow SVG per page.
- Complete Fur Elise display from current canonical data.
- Event-ID highlight map across all pages.
- Focused pure/source tests.

Out of scope:

- MusicXML import.
- User-upload validation.
- Practice range looping.
- Auto-scroll during playback.
- Replacing VexFlow.
- Major sound or keyboard redesign.

