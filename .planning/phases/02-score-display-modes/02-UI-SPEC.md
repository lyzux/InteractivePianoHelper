---
phase: 02
slug: score-display-modes
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-15
---

# Phase 02 — UI Design Contract

> Visual and interaction contract for Phase 2: Score Display Modes.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | Material Icons already loaded; no new icon dependency |
| Font | Existing `Libre Baskerville`, with system serif fallback |

### Product Feel

The Phase 2 screen should feel like a music stand with controls, not a pattern-demo dashboard. The notation area is the primary experience. Controls should feel quiet and utilitarian, with the score presented on white A4-like pages.

### Layout Contract

| Area | Contract |
|------|----------|
| App shell | Keep static single-page layout; no framework or route redesign. |
| Controls | Compact top control strip. Remove key selector. Add loop control off by default. Preserve pattern select, tempo, swing, sustain, and Play/Stop unless a plan explicitly proves a narrower removal is safe. |
| Score heading | Rename the visible notation section to `Sheet Music`. Avoid explanatory helper text. |
| Score surface | Replace the current single framed notation container with a sheet-view surface that can hold A4 page containers. |
| One page | Center a single A4 page horizontally. |
| Multiple pages | Desktop/wide layout uses two A4 pages per row. Additional pages continue in rows below while scrolling. |
| Narrow/mobile | One page per row. Horizontal overflow is allowed only if needed to keep the page readable; prefer fit-to-container scaling before horizontal scroll. |
| Fixed piano clearance | The final page must be scrollable above the fixed/resizable piano. Reserve bottom spacing using CSS or runtime measurement. |

### A4 Page Contract

| Token | Value | Usage |
|-------|-------|-------|
| `score-page-ratio` | `210 / 297` | CSS `aspect-ratio` for every score page |
| `score-page-width` | `min(100%, 794px)` | Desktop single-page max width |
| `score-page-svg-width` | `794` | Stable internal SVG coordinate width |
| `score-page-svg-height` | `1123` | Stable internal SVG coordinate height |
| `score-page-margin-x` | `48px` | Internal renderer margin |
| `score-page-margin-y` | `56px` | Internal renderer margin |
| `score-system-gap` | `32px` | Minimum vertical gap between grand-staff systems |

The planner may tune renderer coordinates if VexFlow requires it, but generated pages must keep A4 proportion and stable page-to-page sizing.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | SVG highlight offsets, tiny icon/text gaps |
| sm | 8px | Checkbox row gaps, compact control spacing |
| md | 16px | Default control gaps, page grid narrow gap |
| lg | 24px | Score surface padding, section padding |
| xl | 32px | Desktop page grid gap, system gap baseline |
| 2xl | 48px | A4 horizontal page margin, major vertical separation |
| 3xl | 64px | Top/bottom breathing room around score surface |

Exceptions:
- Existing piano key dimensions may remain non-scale values.
- VexFlow renderer coordinates may use fixed numeric values where required for engraving.
- A4 page dimensions use the explicit page contract above.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 500 | 1.3 |
| Control value | 14px | 400 | 1.25 |
| Section heading | 22px | 400 italic | 1.25 |
| App title | Existing size unless touched; do not enlarge for Phase 2 | 400 italic | 1.15 |

Rules:
- Do not scale font size with viewport width.
- Letter spacing must be `0` in new score/page styles.
- Sheet pages should let VexFlow own musical glyph typography; do not overlay large UI text on pages.
- Keep headings modest. The score is the hero, not the page title.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f4f1ea` | App background around the sheet surface, warm neutral only outside page paper |
| Paper | `#ffffff` | A4 score pages |
| Ink | `#1f2933` | Body text, score page shadows, controls text |
| Secondary (30%) | `#eef2f6` | Control surfaces and subtle dividers |
| Accent (10%) | `#4f6f9f` | Focus states, active loop state, restrained primary controls |
| Playback active | `#c2410c` | Stop/playing state only |
| Highlight | `#f59e0b` | Piano key and notation event highlight |
| Destructive | `#b91c1c` | Destructive actions only; none expected in Phase 2 |

Accent reserved for:
- Play button default state
- Checkbox/toggle active state
- Focus rings
- Thin section accent lines only if needed

Rules:
- Do not carry the current purple gradient into the score surface.
- The score view should read neutral, paper-like, and calm.
- Avoid cards inside cards. A4 pages are framed objects; the surrounding score surface should be an unframed layout band, not a nested card stack.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Score section heading | `Sheet Music` |
| Primary CTA | `Play` |
| Active playback CTA | `Stop` |
| Loop control label | `Loop` |
| Empty state heading | `No score loaded` |
| Empty state body | `Select a piece to view its sheet music.` |
| Unsupported score state | `This score cannot be displayed.` |
| Renderer loading state | `Loading sheet music...` |
| Renderer error state | `Unable to render this score.` |
| Destructive confirmation | not applicable |

Rules:
- Do not add visible instructional paragraphs about A4 pages, keyboard shortcuts, MusicXML readiness, or how the layout works.
- Do not show unsupported-key copy after Phase 2 removes key-changing; the authored key should be selected internally.
- Console diagnostics may be more detailed than user-facing copy.

---

## Interaction Contract

### Pattern/Piece Selection

- Selecting a pattern or piece updates the canonical sequence and re-renders the sheet pages.
- Score rendering should always use the authored key: `pattern.nativeKey || 'C'`.
- The key selector is removed from the UI. `settings.getKey()` must not be the visible source of score transposition.

### Loop Control

- Add a binary loop control using the existing checkbox/toggle visual pattern.
- Initial state: unchecked/off.
- Off: Play schedules the canonical sequence once and stops after the final event.
- On: Play repeats after the complete canonical sequence.
- The loop control must not imply measure-range selection.

### Highlighting

- Notation highlights use canonical event IDs.
- Highlight styling remains class-based through `vf-note-highlight`.
- Highlight maps must include SVG elements from every rendered page.
- Page layout changes must not break keyboard highlight/unhighlight behavior.

### Scrolling

- Score area scrolls vertically with the document.
- The bottom of the final page must remain reachable above the fixed piano.
- Auto-scroll during playback is out of scope for Phase 2.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party UI blocks | none | not allowed in Phase 2 |

No new UI registry, component package, icon package, or CSS framework should be introduced for this phase.

---

## Verification Contract

The planner should include verification that proves:

- `index.html` no longer contains an active `select id="key"` control.
- The loop control exists, is off by default, and passes loop state into playback.
- Fur Elise in A minor renders all 67 canonical measures, not the first 8.
- A single generated score page centers.
- Multiple generated pages use two columns on desktop/wide viewports.
- Narrow/mobile layout uses one page per row or readable fit-to-container behavior.
- The fixed piano does not obscure the last page.
- `currentNotationMaps.eventMap` can resolve event IDs from later pages, not only the first page.

Recommended viewport checks:
- Desktop wide: `1440x1000`
- Desktop medium: `1024x900`
- Mobile/narrow: `390x844`

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-15
