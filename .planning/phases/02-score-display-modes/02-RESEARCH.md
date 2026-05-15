# Phase 2: Score Display Modes - Research

**Status:** Complete
**Researched:** 2026-05-15

## Question

What do we need to know to plan Phase 2 well: making notation sheet-first, rendering complete score-like material as A4 pages, preserving canonical playback/highlighting, removing key-changing behavior, and adding optional loop playback?

## Short Answer

Phase 2 should evolve the existing VexFlow renderer rather than replace it. VexFlow is already suitable as a browser/SVG notation backend, and the current app already has the hardest project-specific contract in place from Phase 1: canonical events shared by playback and notation. The main work is to split the renderer into reusable data/layout/render steps, remove the `MAX_DISPLAY_MEASURES = 8` cap for score mode, paginate systems into A4-like page containers, and preserve one event-ID highlight map across all pages.

The planner should treat this as a vertical UI/model integration phase:

1. Add explicit score display metadata/defaults without exposing a compact/full toggle.
2. Remove the key selector and key persistence from the active UI path.
3. Render full canonical sequences into A4 page containers.
4. Add a loop control, disabled by default, and make `Player` stop at score end unless loop is enabled.
5. Add focused unit tests for score pagination/page planning and smoke checks for full score rendering.

## Source Findings

### VexFlow Is Still An Appropriate Rendering Backend

Primary docs confirm that VexFlow is a JavaScript music notation rendering API that runs in the browser and supports SVG. The current app already uses the SVG backend through the CDN global `Vex`, which fits the static app constraint.

Relevant sources:

- https://www.vexflow.com/ - VexFlow overview, browser JavaScript, Canvas/SVG support.
- https://vexflow.github.io/vexflow-examples/guides/tutorial/ - VexFlow tutorial covering `StaveNote`, `Voice`, `System`, rests, chords, modifiers, and dots.
- https://www.vexflow.com/build/docs/renderer.html - Renderer backend docs; SVG is an official backend.
- https://0xfe.github.io/vexflow/api/classes/Formatter.html - Formatter docs; VexFlow lays out notes by tick grids, minimum widths, and proportional spacing.

Planning implication: stay with VexFlow for Phase 2. Do not introduce a MusicXML renderer or build tool just to solve page layout. MusicXML import/rendering can still be researched later.

### Current Renderer Has The Right Pieces But The Wrong Output Surface

`js/staffNotationRenderer.js` already provides:

- canonical event consumption via `sequence.events`
- hand stream construction
- measure grouping
- rest filling
- dotted duration handling
- cross-measure ties within a system
- treble/bass grand staff drawing
- event-ID highlight map creation

The bottleneck is explicit:

- `const MAX_DISPLAY_MEASURES = 8`
- `numMeasures = Math.min(actualMeasureCount, MAX_DISPLAY_MEASURES)`
- one renderer SVG is created in `#vexflow-notation`

Planning implication: extract reusable helpers rather than rewrite notation from scratch. A good plan should separate:

- `buildScoreMeasures(sequence)` - returns bass/treble measures and event IDs.
- `planSystems(measures, pageSpec)` - chooses measures per system/page.
- `renderScorePages(pagePlan, sequence)` - creates A4 page DOM nodes and one SVG per page.
- `eventMap` aggregation - one `Map<eventId, SVGElement[]>` across all rendered pages.

### A4 Pages Should Be CSS Containers, Not A VexFlow Concept

VexFlow draws into SVG or Canvas with explicit width/height. It does not need to know about CSS paper semantics. The app can create A4-like page containers with CSS dimensions/aspect ratio and create one VexFlow SVG per page.

Recommended page model:

- Use a CSS page wrapper with `aspect-ratio: 210 / 297`.
- Use a stable internal SVG coordinate system such as `PAGE_WIDTH = 794`, `PAGE_HEIGHT = 1123` to approximate A4 at 96 CSS pixels per inch.
- Use page padding/margins in renderer coordinates, not by scaling text with viewport width.
- On wide screens, constrain page width with `width: min(100%, 794px)` or similar.
- For one page, center the page grid.
- For two or more pages, use a CSS grid with two columns on wide screens.
- On narrow screens, collapse to one page per row.

Planning implication: the DOM structure should become something like:

- `.score-sheet-view`
- `.score-page-grid`
- `.score-page`
- `.score-page svg`

This keeps the fixed bottom piano out of notation rendering logic; CSS can reserve bottom space and scroll the score area.

### Fur Elise Scale Is Manageable But Requires Real Pagination

Local data check:

- `patterns/furelise.js` resolves in A minor.
- canonical events: 146
- source beats / loop unit beats: 100 quarter-note beats
- time signature: 3/8
- beats per measure: 1.5
- measures: 67
- right hand, left hand, and timing arrays all have 146 items.

The existing 8-measure cap shows roughly 12 percent of the available excerpt. Full display needs a page planner. If a page holds around 4 to 6 systems and each system holds around 3 to 5 measures depending on width, Fur Elise likely needs several pages. That is fine for the requested grid.

Planning implication: do not simply raise `MAX_DISPLAY_MEASURES`. Remove the cap from full score rendering and make pagination explicit. The first implementation can use deterministic fixed heuristics instead of perfect engraving:

- measures per system based on available system width and a minimum measure width
- systems per page based on page height and grand-staff system height
- continuation clefs/key/time as currently done per first system, with time signature on first system only unless planning chooses otherwise

### Highlighting Across Pages Is Feasible

The current renderer already maps canonical event IDs to SVG elements. VexFlow SVG output exposes DOM elements, and VexFlow SVG usage can be styled/animated with CSS when elements or groups are accessible.

Relevant source:

- https://github-wiki-see.page/m/0xfe/vexflow/wiki/Animation-with-VexFlow-%26-CSS - VexFlow SVG context elements can be styled or animated like ordinary DOM nodes.

Planning implication: Phase 2 should preserve the existing `vf-note-highlight` class and return shape:

- `eventMap: Map<string, SVGElement[]>`
- `sequence`

The map should aggregate elements from every page. This matters more than the exact page layout because playback calls `highlightNotationNote(eventId)`.

### Key Removal Touches More Than Markup

The key selector appears in:

- `index.html` markup (`select#key`)
- `settings.init('tempo', 'tempoDisplay', 'sustain', 'key')`
- `resolveCurrentPatternSequence()`
- `handleKeyChange()`
- direct `#key` event listener and `settings.onKeyChange`
- `Settings` state, persistence, callbacks, import/export, and display update
- `staffNotationRenderer.js` fallback lookup for `document.getElementById('key')`
- `canonicalPatternResolver.js` transposition helpers and `resolveHand`

Planning implication: remove the user-facing key feature without destructively deleting useful lower-level resolver capability yet. Phase 2 should:

- remove or hide the key control from `index.html`
- stop registering key-change event listeners
- resolve each pattern using `pattern.nativeKey || 'C'` or a dedicated authored-key helper
- stop persisting `key` in active settings
- let resolver transposition helpers remain for now unless a later cleanup plan safely removes them
- use `sequence.selectedKey` or `sequence.nativeKey` for VexFlow key signature rendering

This satisfies the product decision while avoiding a risky broad refactor.

### Loop Toggle Should Change Playback Boundary Semantics

Current `Player` always loops after `events.length`. Phase 2 decision says loop disabled by default. Therefore `Player` needs one of these:

- `play(sequence, { loop: boolean })`
- `setLoopEnabled(boolean)` plus existing `play(sequence)`
- sequence metadata consumed by player

Recommended plan target: `play(sequence, { loop = false } = {})`.

Behavior:

- If `loop === false`, playback stops after the last canonical event and clears scheduled visual timeouts/piano highlights.
- If `loop === true`, playback keeps current Phase 1 loop behavior.
- The UI loop control should be off by default and should not be confused with future selected-measure practice looping.

Planning implication: this is a small player change but must be tested because timer cleanup and final note unhighlighting are fragile.

## Recommended Plan Shape

### Plan 02-01: Score Metadata, Key Removal, And Playback Loop Control

Purpose: align app state with the sheet-first product direction before touching renderer layout.

Likely tasks:

- Add helper(s) to resolve the authored display key for a pattern, probably `pattern.nativeKey || 'C'`.
- Remove the key selector from the active UI.
- Update `Settings` and `index.html` so key changes are no longer part of the user-facing state path.
- Add loop UI control, off by default.
- Refactor `Player.play(sequence, { loop })` so non-loop playback stops at sequence end.
- Extend unit tests for unsupported/native-key authored key resolution and loop boundary behavior where practical.

Requirements: SCORE-03, partial SYNC-02.

### Plan 02-02: A4 Score Page Renderer

Purpose: make full score rendering real and remove the 8-measure cutoff.

Likely tasks:

- Refactor `staffNotationRenderer.js` into measure-building and page-rendering steps.
- Replace single capped SVG output with A4 page containers and one SVG per page.
- Implement desktop page grid: one page centered; two or more pages two per row, further rows below.
- Implement mobile/narrow fallback: one page per row, scrollable above fixed keyboard.
- Preserve `eventMap` across all pages.
- Add deterministic pagination/page-plan tests if helper functions are pure enough.

Requirements: SYNC-02, SYNC-03, SCORE-01, SCORE-02.

### Plan 02-03: Score Smoke Verification And Fixture Hardening

Purpose: prove the user-visible score behavior with Fur Elise and avoid regressions.

Likely tasks:

- Add browser/static smoke script if feasible without a heavy framework, or document manual smoke in verification if automation is too costly for this phase.
- Verify Fur Elise in A minor renders all 67 measures across page containers.
- Verify play/stop and loop toggle behavior.
- Verify notation highlights are addressable by event IDs after pagination.
- Verify the fixed piano does not cover the final page area on desktop and mobile widths.

Requirements: SYNC-03, SCORE-01, SCORE-02, SCORE-03.

## Risks And Mitigations

### Risk: Layout Quality Becomes A Full Engraving Project

The user wants A4 sheets, but Phase 2 should not chase professional engraving perfection. Use deterministic page/system heuristics and VexFlow formatting within each system.

Mitigation: acceptance criteria should focus on complete display, stable pagination, no cutoff, no piano overlap, and preserved highlighting.

### Risk: One Huge SVG Is Slow Or Awkward

The current renderer uses one SVG. A full score should use one SVG per page so layout, scrolling, and highlight lookup remain manageable.

Mitigation: one renderer instance per page container.

### Risk: Key Removal Breaks Existing Patterns

Many short patterns currently depend on transposition from C. Removing all resolver key logic would be too large for Phase 2.

Mitigation: remove the UI feature and active settings path, but keep resolver internals unless a focused cleanup proves safe.

### Risk: Non-Loop Playback Stop Timing Leaves Stale Highlights

`Player.stop()` clears all highlights immediately. If called too early, it may cancel the final note's visible duration; if called too late, playback may appear stuck.

Mitigation: plan a small player test or careful manual smoke. A useful target is to schedule stop after the final note's unhighlight timeout, or to mark playback ended after scheduling all final-event timers.

### Risk: Fixed Piano Covers Score

CSS currently uses fixed bottom piano and mobile `body { padding-bottom: 25vh !important; }`. Desktop has resizable keyboard up to 50vh.

Mitigation: score container should have bottom padding tied to piano container height or a conservative CSS variable. At minimum, acceptance criteria must include final page content scrolls above the keyboard.

## Verification Strategy

Automated:

- `npm test`
- syntax checks for changed JS modules
- unit tests for pure page-planning helpers if introduced
- source checks that `MAX_DISPLAY_MEASURES` no longer caps score mode
- source checks that active key selector/event wiring is gone from `index.html`

Browser/manual smoke:

- Serve static app.
- Open Fur Elise.
- Confirm all 67 measures are represented across A4 pages.
- Confirm one page centers when only one page exists.
- Confirm multiple pages use two columns on wide desktop and one column on narrow/mobile.
- Confirm bottom piano does not cover final page content.
- Confirm Play without loop stops at score end.
- Confirm loop control off by default and enabled loop repeats after the full sequence.
- Confirm notation highlights advance by canonical event ID on paged score.

## Open Questions For Planning

None requiring user input. The user already locked the key product decisions:

- always full score preview
- A4 page layout
- optional loop control, off by default
- remove key changing
- display/load authored music content as-is

The planner can choose implementation details inside those boundaries.

---
*Phase: 02-score-display-modes*
*Research complete: 2026-05-15*
