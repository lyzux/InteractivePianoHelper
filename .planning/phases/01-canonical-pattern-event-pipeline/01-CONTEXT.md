# Phase 1: Canonical Pattern Event Pipeline - Context

**Gathered:** 2026-05-15T09:34:03+02:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes built-in pattern playback and simple notation previews derive from one canonical musical event sequence. It should replace the current split interpretation between `js/player.js`, `js/simplePatternLoader.js`, and `js/staffNotationRenderer.js` without redesigning the sound engine, the 88-key piano UI, or the overall static browser-only architecture.

</domain>

<decisions>
## Implementation Decisions

### Notation And Playback Contract
- **D-01:** Visible notation must be syntactically valid music notation, not merely a visualization of arrays.
- **D-02:** Playback must play the same event sequence that the user sees in notation.
- **D-03:** Looping is wanted, but the loop should happen after the displayed complete measure, phrase, or pattern unit, not by silently cycling a shorter raw source array while the notation shows an expanded version.
- **D-04:** Short-loop behavior must be decided per pattern. The canonical model should support pattern metadata/defaults for the displayed loop unit rather than imposing one global rule.

### MusicXML Readiness
- **D-05:** Phase 1 should prepare as strongly as practical for future MusicXML integration. The canonical model should be professionally shaped as an adapter target, not a throwaway resolver that only happens to satisfy current JavaScript patterns.
- **D-06:** The future direction is that patterns can load from MusicXML and the complete MusicXML file can be treated as the looped pattern source. Phase 1 does not implement MusicXML import, but it should avoid model choices that would make that future awkward.

### Musical Corrections
- **D-07:** Corrections are allowed. The planner may improve musical interpretation when current pattern data seems awkward, incomplete, or inconsistent, not only when a strict playback/display mismatch is already visible.
- **D-08:** Corrections should still respect the project constraints: do not redesign sound generation, do not redesign the piano UI, and do not turn this phase into full score display or MusicXML import.

### Test Expectations
- **D-09:** Unit tests should be introduced in Phase 1 where they make sense, especially around canonical event generation, timing, loop-unit decisions, transposition, rests/chords, and playback/notation agreement.
- **D-10:** Minimal JavaScript test tooling is acceptable as long as the browser app still works as a static site.

### Folded Todos
- **D-11:** Folded todo: `Harden notation playback contract` from `.planning/todos/pending/2026-05-14-harden-notation-playback-contract.md`. It fits this phase through the shared resolver, Lombard mismatch, and playback/notation trust work. Its score display, validation, and MusicXML points should inform architecture but remain bounded by the roadmap phase split.

### the agent's Discretion
- Choose the exact module names and boundaries for the canonical resolver, provided downstream consumers can share the same event IDs and timing model.
- Decide the smallest useful test runner/setup that gives reliable unit coverage without forcing a full framework rewrite.
- Decide which built-in patterns need immediate data corrections in Phase 1 versus which should be flagged for later validation or score-display phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` — Core value, constraints, and explicit decision to preserve sound and keyboard behavior.
- `.planning/REQUIREMENTS.md` — Requirement IDs and phase split, especially MODEL-01, MODEL-02, MODEL-03, and SYNC-01.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and dependencies.
- `.planning/STATE.md` — Current project state, pending todo reference, and known risks.
- `.planning/todos/pending/2026-05-14-harden-notation-playback-contract.md` — Folded source todo for the notation/playback contract.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — Current data flow and split between playback, loader, and notation layers.
- `.planning/codebase/CONCERNS.md` — Known Lombard mismatch, long notation cap, executable pattern risk, and fragile areas.
- `.planning/codebase/STRUCTURE.md` — Where new shared playback/notation logic and tests should likely live.

### Source Touchpoints
- `js/player.js` — Playback scheduler currently resolves pattern notes independently and drives audio/highlights.
- `js/simplePatternLoader.js` — Pattern registry and notation conversion facade with duplicated note resolution/transposition logic.
- `js/staffNotationRenderer.js` — VexFlow renderer currently expands short loops, caps long display, and maps highlights separately.
- `patterns/lombardisch.js` — Known short-loop mismatch fixture.
- `patterns/furelise.js` — Known score-like/native-key fixture; full display belongs mainly to Phase 2, but metadata readiness matters in Phase 1.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SimplePatternLoader`: existing registry and dynamic import path for built-in patterns; likely entry point for adapting current JS pattern objects into canonical events.
- `Player`: existing lookahead scheduler, visual timeout cleanup, tempo/swing handling, and keyboard highlight integration should be preserved while changing its input model.
- `staffNotationRenderer`: existing VexFlow rendering path can be fed by canonical events for simple previews, but its independent expansion/highlight logic should stop being authoritative.
- `patterns/index.js`: current manifest remains the built-in pattern source of truth until future MusicXML/data adapters exist.

### Established Patterns
- The app is vanilla ES modules served statically. New model/resolver code should live under `js/` and avoid requiring a bundled runtime for the app.
- Pattern modules are executable JavaScript today. Phase 1 should adapt them into a canonical event sequence while leaving stricter validation to later phases where appropriate.
- UI state comes from existing settings and DOM wiring in `index.html`; Phase 1 should connect to that surface carefully rather than moving the whole app shell.

### Integration Points
- `index.html` currently wires pattern selection, notation rendering, playback, and notation highlighting. Any canonical event IDs or display-mode metadata must flow through this wiring.
- `js/player.js` should schedule from canonical events instead of raw independently resolved arrays.
- `js/staffNotationRenderer.js` should render from canonical events for pattern previews and highlight by canonical identity rather than by divergent source-index expansion.
- Unit tests can target pure resolver/model code before browser-level smoke coverage exists.

</code_context>

<specifics>
## Specific Ideas

- The desired user-facing rule is: display notes in a syntactically correct way and play exactly what is seen.
- Looping remains important, but the loop boundary should be the complete visible unit.
- Pattern loop-unit choice must be individual per pattern because future MusicXML-backed patterns may loop an entire file.
- Future MusicXML integration should feel professional and standard, so Phase 1 should bias toward clean musical concepts: events, durations, rests, chords, hands, source identity, time signatures, and adapter boundaries.

</specifics>

<deferred>
## Deferred Ideas

- Full MusicXML import UI remains a future/backlog capability, not part of Phase 1.
- Full score display, full Für Elise rendering, score scrolling, and unsupported-key UI are Phase 2 responsibilities.
- Broad pattern validation and user-facing invalid-pattern errors are Phase 3 responsibilities, though Phase 1 should leave good hooks for them.

</deferred>

---

*Phase: 1-Canonical Pattern Event Pipeline*
*Context gathered: 2026-05-15T09:34:03+02:00*
