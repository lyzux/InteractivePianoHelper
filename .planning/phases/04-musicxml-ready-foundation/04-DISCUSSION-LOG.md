# Phase 4: MusicXML-Ready Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15T13:15:00+02:00
**Phase:** 4-MusicXML-Ready Foundation
**Areas discussed:** adapter boundary, page fidelity, source coexistence, smoke testing

---

## Adapter Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Thin adapter contract | Define the canonical target, validation route, and docs for future MusicXML input without implementing import UI. | ✓ |
| Full parser now | Begin parsing MusicXML files in this phase. | |
| Renderer replacement | Use this phase to switch to a MusicXML renderer. | |

**User's choice:** Recommended default selected under "choose the recommended gates only on critical gates ask me."
**Notes:** Roadmap limits Phase 4 to readiness/foundation; MusicXML import UI is backlog scope.

---

## Page Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve MusicXML page semantics | Model page/system layout hints and keep sheet content scaled within pages where available. | ✓ |
| Responsive reflow | Treat MusicXML as fluid content that may flow between pages based on viewport size. | |
| Current A4 only | Ignore MusicXML layout hints and keep only hardcoded A4 planning. | |

**User's choice:** Recommended default selected based on earlier user feedback about page fidelity.
**Notes:** User explicitly rejected flowing notation into another page when viewport space changes.

---

## Source Coexistence

| Option | Description | Selected |
|--------|-------------|----------|
| Dual source types | Keep validated short JS patterns and prepare future MusicXML sources as another validated source type. | ✓ |
| MusicXML-only | Force all content into MusicXML now. | |
| JS-only for v1 | Defer adapter boundary entirely. | |

**User's choice:** Recommended default selected from Phase 3 decisions.
**Notes:** Complete pieces should become MusicXML-backed later; short pedagogical patterns remain useful.

---

## Smoke Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight browser smoke | Add a small static-server browser check for boot, dropdown, SVG/page render, Play/Stop, and cleanup. | ✓ |
| Manual smoke only | Keep browser checks manual. | |
| Full visual regression | Add image snapshots or broad browser coverage immediately. | |

**User's choice:** Recommended default selected; dependency installation remains a critical gate.
**Notes:** If Playwright or another browser automation tool must be installed/downloaded, ask before doing so during execution.

---

## the agent's Discretion

- Choose exact adapter contract files and module boundaries.
- Choose exact smoke command and assertions, subject to the critical dependency gate.
- Refresh stale codebase maps only if needed for planning accuracy.

## Deferred Ideas

- File picker, local imported MusicXML persistence, remembered library entries, and removal controls.
- Full MusicXML parser/import UI.
- Practice-range UX and auto-scroll.
- Replacing VexFlow with OSMD or another renderer without a separate critical dependency/migration decision.
