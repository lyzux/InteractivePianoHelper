# Phase 5: MusicXML Import And Practice UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15T15:10:40+02:00
**Phase:** 5-MusicXML Import And Practice UX
**Areas discussed:** Import Library Lifecycle, MusicXML Acceptance Boundary, Score Rendering Fidelity, Practice Playback Controls

---

## Import Library Lifecycle

| Question | Option | Selected |
|----------|--------|----------|
| Default library after cache clear | Built-in pieces and teaching patterns both appear by default | |
| Default library after cache clear | Only complete score-like pieces appear by default | yes |
| Default library after cache clear | Separate Pieces and Patterns groups in one selector | |
| Imported MusicXML storage | Remember imported files in browser storage automatically | yes |
| Imported MusicXML storage | Import for current session only unless user explicitly saves | |
| Imported MusicXML storage | Ask after each import whether to remember it | |
| Duplicate imports | Same filename/title updates the existing imported entry | |
| Duplicate imports | Same filename/title creates a second entry with a suffix | yes |
| Duplicate imports | Block duplicates and show a warning | |
| Removing imported pieces | Imported entries have a visible remove action near the selector/library | yes |
| Removing imported pieces | Remove action only appears in an expanded library/manage panel | |
| Removing imported pieces | No removal in Phase 5, only import and remember | |

**User's choice:** `1B, 2A, 3B, 4A`
**Notes:** Default user-facing library should lean toward complete score-like material.

---

## MusicXML Acceptance Boundary

| Question | Option | Selected |
|----------|--------|----------|
| First supported score type | Piano-oriented MusicXML only, preferably one piano part with two staves | |
| First supported score type | Any single-part MusicXML if it can map to playable notes | |
| First supported score type | Try multi-part scores, but reject unsupported parts | yes |
| Unsupported MusicXML features | Reject the file if unsupported features affect playback or page structure | |
| Unsupported MusicXML features | Import what is playable and warn about skipped features | |
| Unsupported MusicXML features | Strict mode by default, with an optional lenient import later | yes |
| Validation feedback | Short toast plus detailed diagnostics in console | |
| Validation feedback | Short toast plus expandable user-facing error details | yes |
| Validation feedback | Full validation report panel after every failed import | |
| Playback mapping | Only import files that can map cleanly to the current canonical event model | yes |
| Playback mapping | Allow partial playback if notation can still display more than playback supports | |
| Playback mapping | Display-only import is acceptable for unsupported playback files | |

**User's choice:** `1C, 2C, 3B, 4A`
**Notes:** Strict mode is the Phase 5 default. Lenient import is deferred.

---

## Score Rendering Fidelity

| Question | Option | Selected |
|----------|--------|----------|
| MusicXML page layout priority | Preserve MusicXML page/system breaks when present, otherwise generate A4 pages | yes |
| MusicXML page layout priority | Always regenerate app-owned A4 pages from canonical events | |
| MusicXML page layout priority | Preserve only page breaks, but let systems/measures be re-laid out | |
| Scaling behavior | Scale each rendered page to fit its sheet viewport without reflowing content | yes |
| Scaling behavior | Keep notation at natural size and allow page scrolling/panning | |
| Scaling behavior | Provide zoom controls, defaulting to fit-to-page | |
| Renderer dependency tolerance | Stay with current VexFlow renderer for Phase 5 | |
| Renderer dependency tolerance | Evaluate a dedicated MusicXML renderer if it materially improves fidelity | |
| Renderer dependency tolerance | Dedicated renderer is acceptable only behind a critical approval gate | |
| Small-screen behavior | Fit full page width; vertical page scroll is fine | yes |
| Small-screen behavior | Fit full page height; horizontal page scroll is fine | |
| Small-screen behavior | Offer fit-width and fit-page modes, default fit-width | |

**User's choice:** Preserve MusicXML-defined full pages like MuseScore Studio; scale page contents; delegate renderer choice if it remains interactive and future-proof; small screens move from two pages to one vertical page column.
**Notes:** Static-image-only rendering is explicitly rejected because playback highlights, click events, and possible future editing should remain possible.

---

## Practice Playback Controls

| Question | Option | Selected |
|----------|--------|----------|
| Measure range selection | Numeric start/end measure inputs | |
| Measure range selection | Click/tap measures on the score to set range | yes |
| Measure range selection | Both: numeric inputs first, score-click selection if practical | |
| Start playback from | Selected measure only | |
| Start playback from | Selected note/event only | |
| Start playback from | Selected measure first, note/event start if the renderer exposes reliable event clicks | yes |
| Loop behavior | Loop toggle loops the selected range when a range exists, otherwise full score | yes |
| Loop behavior | Separate controls for full-score loop and range loop | |
| Loop behavior | Range loop only appears after a range is selected | |
| Auto-scroll during playback | Always keep the current system/page visible | |
| Auto-scroll during playback | Auto-scroll only when a toggle is enabled | |
| Auto-scroll during playback | Auto-scroll during playback unless the user manually scrolls away, then pause auto-follow until resumed | yes |

**User's choice:** `1B, 2C, 3A, 4C`
**Notes:** Range selection should use an intentional modified click gesture such as `Shift+click`, and the selected range should use a mint-green accent.

---

## the agent's Discretion

- Renderer/library choice is delegated, but must preserve interactive notation and future extensibility.
- Exact local storage strategy is delegated, provided it remains browser-local and static-site compatible.

## Deferred Ideas

- Optional lenient MusicXML import mode after strict import is reliable.
- Future note editing or richer click interactions after interactive MusicXML rendering is stable.
