# Phase 7: OSMD Production Score Rendering - UI Spec

**Created:** 2026-05-15
**Status:** Ready for planning

## UI Objective

Imported MusicXML should look like a real score in a digital notestand: page-based, readable, scrollable, and interactive. The renderer may scale pages, but it must not flow score content into different app-owned pages.

## Layout Contract

### Score Pages

- Imported MusicXML pages render as OSMD SVG pages inside `.score-page` compatible containers or equivalent app-level wrappers.
- Wide viewport: two pages per row, centered in the notestand.
- Narrow viewport: one page per row.
- Vertical scroll remains the primary navigation.
- Horizontal scrolling should not be required for normal imported score reading.
- The bottom keyboard must not cover reachable page content.

### Scaling

- Scale the complete rendered page container to fit the available page column width.
- Preserve page aspect ratio.
- Do not re-render or reflow MusicXML into additional app-owned systems solely because the viewport changed.
- Page scaling must not break click targets, range selection, or auto-follow.

### Controls

- Existing import/library/practice controls remain where they are unless required to fix layout.
- Range mode and Shift-click remain the expected range selection behaviors.
- Loop toggle behavior should remain immediate from previous phase fixes.
- Sound controls and keyboard expand/collapse state are preserved.

## Visual Quality Gates

- Score titles/credits from MusicXML should be visible when present.
- System spacing, chords, voices, clefs, key signatures, time signatures, slurs/ties/directions should be delegated to OSMD rather than reconstructed by the app.
- Highlight color remains mint green for playback/current-note marking.
- Range selection remains mint green but visually distinct from playback highlight.
- Hit targets must not add large visible boxes that make the score look less like sheet music.

## Accessibility Contract

- Measure hit targets remain keyboard-focusable where practical.
- Range selection status remains announced through existing status text.
- Import failures and renderer failures use existing status/toast patterns with diagnostic details.
- The score remains readable when the right sound panel and bottom keyboard are collapsed or expanded.

## Responsive Acceptance

- Desktop 1280px+ viewport: two-page notestand layout visible without horizontal page clipping.
- Smaller desktop/tablet viewport: one page per row if two pages would make the score unreadable.
- Mobile/narrow viewport: one page per row, scaled to width, vertical scroll only.

## Non-Goals

- Do not add a marketing/landing screen.
- Do not introduce decorative page chrome around every page.
- Do not use static image render output as the product path.
- Do not implement note editing in this phase.

---

*Phase: 07-osmd-production-score-rendering*
*UI spec created: 2026-05-15*
