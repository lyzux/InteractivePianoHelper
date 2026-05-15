---
phase: 03
slug: pattern-validation-and-feedback
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-15
---

# Phase 03 - UI Design Contract

> Visual and interaction contract for Phase 03 validation feedback. This phase adds concise verification feedback for rejected pattern/piece sources without redesigning the score, sound controls, or piano keyboard.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | Google Material Icons already loaded in `index.html`; no new icon library |
| Font | `Libre Baskerville`, fallback `'Times New Roman'`, Georgia, serif |

### Existing Surface To Preserve

- Keep the sheet-first score area as the primary visual focus.
- Keep the bottom piano keyboard behavior and layout unchanged.
- Keep the right-side sound controls behavior unchanged.
- Keep the current static vanilla HTML/CSS/JS approach; do not add a UI framework.

---

## Validation Feedback Pattern

### Placement

- Add a single notification/status region near the top of the main content, after the controls and before `patternInfo`, or inside `patternInfo` only when no valid source is selected.
- The notification must not overlap the fixed bottom keyboard, right-side sound panel toggle, score sheets, or piano controls panel.
- The notification must not live inside the score pages; score pages remain for notation only.

### Behavior

| State | Required Behavior |
|-------|-------------------|
| Some sources rejected | Show one concise warning/failure notification after loading completes. Selector contains valid sources only. |
| A selected source becomes unavailable | Stop playback, clear notation highlights, select the first valid source if one exists, and show the warning notification. |
| No valid sources | Disable play, keep selector safe, show the empty/error state in `patternInfo` and `#vexflow-notation`. |
| Import/module failure | Same user notification as validation failure; detailed failure remains console-only. |

### Notification Contract

- Use one dismissible or auto-replaceable message region; do not stack many toasts.
- Message should summarize count, not list raw diagnostics.
- Detailed diagnostics remain in console output and tests.
- Notification must be keyboard/screen-reader reachable through `role="status"` or `role="alert"` depending on severity.

---

## Spacing Scale

Declared values must use the existing 4px rhythm where possible.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline diagnostic count spacing |
| sm | 8px | Notification internal text gap |
| md | 16px | Notification padding and control-to-message spacing |
| lg | 24px | Section spacing around validation status |
| xl | 32px | Score-page grid gap remains unchanged |
| 2xl | 48px | No new usage in this phase |
| 3xl | 64px | No new usage in this phase |

Exceptions: existing score page constants `794px` x `1123px`, existing bottom piano dimensions, and existing right sound panel dimensions remain unchanged.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 500 | 1.35 |
| Feedback title | 16px | 600 | 1.35 |
| Feedback body | 14px | 400 | 1.45 |
| Empty state heading | 18px | 400 | 1.3 |

Rules:

- Do not use hero-scale text for validation feedback.
- Do not use negative letter spacing.
- Keep message text short enough to fit on mobile without wrapping awkwardly inside buttons or badges.

---

## Color

Use existing app colors and add only small semantic feedback accents.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f8f7f3` | App background and main content surface |
| Secondary (30%) | `#f4f1ea` | Score band / sheet music surroundings |
| Text | `#1f2933` | Primary notification and empty-state text |
| Muted text | `#52606d` | Secondary notification detail |
| Warning accent | `#b7791f` | Validation warning border/icon/count |
| Warning background | `#fff7e6` | Non-fatal validation notice surface |
| Failure accent | `#c53030` | Fatal/no-valid-source border/icon/count |
| Failure background | `#fff5f5` | Fatal/no-valid-source notice surface |
| Focus accent | `#667eea` | Existing focus ring and control focus behavior |

Accent reserved for: warning/failure notification border, optional Material Icon, diagnostic count, and existing focus states. Do not recolor the score pages, piano keyboard, or sound controls as part of this phase.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Warning notification title | `Some pieces failed verification` |
| Warning notification body | `{count} source(s) were not loaded. Playable pieces remain available.` |
| Failure notification title | `No verified pieces available` |
| Failure notification body | `The loaded sources failed verification. Check the console diagnostics and fix the source data.` |
| Pattern info empty heading | `No verified piece selected` |
| Pattern info empty body | `Fix the source data, then reload the app.` |
| Score empty heading | `This score cannot be displayed.` |
| Score empty body | `The selected source did not pass verification.` |

Rules:

- User-facing copy says "pieces" or "sources", not "pattern object", "module export", or field paths.
- Do not expose stack traces, diagnostic JSON, or source field paths in the visible UI.
- Console diagnostics may use exact pattern IDs, codes, severities, and paths.

---

## Interaction Contracts

### Selector

- Selector options must include only validation-passing sources.
- Invalid sources must not appear as disabled selectable options.
- If validation removes the previously selected value, the app should select the first valid option and redraw the score.
- If no valid options exist, the selector must not contain a misleading playable default.

### Play Button

- Play must not start when there is no valid canonical sequence.
- When there are no valid sources, the play button should be disabled or remain inert with the failure state visible.
- Stopping/clearing behavior must remain as Phase 2 implemented: stop playback and clear notation highlights.

### Notification

- One notification region should replace prior validation messages rather than stacking.
- A warning for rejected sources may remain visible until dismissed, pattern change, or reload.
- If dismissible, the control label must be accessible, e.g. `Dismiss validation message`.

---

## Responsive Contract

- The notification must fit within the same content width as controls/pattern info.
- On mobile, notification content may wrap but must not cause horizontal scrolling.
- The notification must remain above the fixed piano area and must not be hidden by the right-side sound panel toggle.
- No changes to A4 score page scaling, two-page stand behavior, bottom keyboard expansion, or sound panel expansion are part of this phase.

---

## Accessibility Contract

- Validation status region uses `role="status"` for warning summaries after successful app load.
- Fatal no-valid-source state uses `role="alert"` or an equivalent assertive live region.
- Notification text must have sufficient contrast against `#fff7e6` / `#fff5f5`.
- Dismiss button, if added, must be reachable by keyboard and have visible focus.
- Do not rely on color alone; include text and optionally a Material Icon.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party UI blocks | none | not allowed for this phase |

No external UI registries or component kits should be introduced.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-15
