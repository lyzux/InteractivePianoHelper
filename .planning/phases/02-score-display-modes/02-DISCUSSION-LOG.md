# Phase 2: Score Display Modes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15T10:29:21+02:00
**Phase:** 2-Score Display Modes
**Areas discussed:** Mode behavior, Long score layout, Für Elise playback loop, Unsupported key handling

---

## Todo Inclusion

| Option | Description | Selected |
|--------|-------------|----------|
| Fold display parts | Use full-score and score-display concerns as Phase 2 context without reopening Phase 1 playback work. | ✓ |
| Review later | Leave the todo as background only and discuss Phase 2 from the roadmap requirements. | |
| Fold all | Bring the whole todo into this phase, including validation or MusicXML items. | |

**User's choice:** `1`
**Notes:** Folded only the Phase 2 display-related slice of `Harden notation playback contract`.

---

## Mode Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only modes | Use pattern or canonical score metadata to decide compact preview versus score. | |
| Automatic by length/type | Infer score display from piece-like content or longer event lists. | |
| User-visible toggle | Let the user manually choose compact preview or full score. | |
| Always full score preview | Sheet-first direction; do not preserve compact preview as a dominant user-facing mode. | ✓ |

**User's choice:** "always full score preview."
**Notes:** The app is evolving above simple pattern playback toward complete MusicXML files. The planner should make score display explicit in code while avoiding a prominent compact/full preview switch.

---

## Long Score Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single vertical score | One continuous scrolling notation surface. | |
| Paged systems | Split notation into page-like surfaces. | |
| A4 sheet grid | Render A4-style sheets; center one page, use two pages per row when multiple pages exist. | ✓ |

**User's choice:** "A4 sheets, if one is present make it centered, if there are two or more adopt this grid: 2 are horizontal per row, and all other pages can be found in rows again when scrolling down."
**Notes:** The fixed piano must not obscure the score grid.

---

## Für Elise Playback Loop

| Option | Description | Selected |
|--------|-------------|----------|
| Loop whole score by default | Full-score playback loops automatically after the entire score. | |
| Toggle loop, off by default | Add a loop control for optional looping; default is no loop. | ✓ |
| Defer looping | Keep full-score display separate from any loop decisions. | |

**User's choice:** "add a toggle button or checkbox whatever fits in better to decide for a loop, by default it is disabled"
**Notes:** Practice range looping remains later work.

---

## Unsupported Key Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Disable Play and show inline message | Keep key selector but prevent invalid playback. | |
| Auto-switch to native key | Keep key selector but move to supported key when needed. | |
| Remove key change feature | Display authored content as-is; no editing or transposition in current scope. | ✓ |

**User's choice:** "remove the key change feature entirely."
**Notes:** The current capability goal is loading complete MusicXML files. Editing, content changes, or key changes are not in scope now and maybe later.

---

## the agent's Discretion

- Choose the exact implementation boundary for score-display metadata.
- Choose the most locally consistent loop UI control.
- Choose responsive fallback details for narrow layouts while preserving the desktop/wide A4 grid behavior.

## Deferred Ideas

- Practice range UX: loop selected measures, start playback from a measure or note, auto-scroll during playback.
- MusicXML import and validation.
- Content editing and key changes may be revisited later.
