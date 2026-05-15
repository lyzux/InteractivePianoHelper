---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 06
status: phase_planned
last_updated: "2026-05-15T16:45:00.000Z"
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 17
  completed_plans: 16
  percent: 94
---

# Project State: Interactive Piano Helper

**Initialized:** 2026-05-15
**Current Phase:** 06
**Status:** Phase planned

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-14)

**Core value:** Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.
**Current focus:** Phase 06 — Professional MusicXML Renderer

## Roadmap Reference

See: `.planning/ROADMAP.md`

**Active roadmap:** 6 phases, vertical MVP mode.
**Phase 1:** Canonical Pattern Event Pipeline - completed
**Phase 2:** Score Display Modes - completed
**Phase 3:** Pattern Validation And Feedback - completed
**Phase 4:** MusicXML-Ready Foundation - completed
**Phase 5:** MusicXML Import And Practice UX - completed; 05-06 browser smoke and regression coverage complete
**Phase 6:** Professional MusicXML Renderer - planned; OSMD-first renderer decision, facade, and MusicXML test-suite strategy

## Codebase Reference

See: `.planning/codebase/`

Important files:

- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`

## Accumulated Context

### Pending Todos

- `.planning/todos/completed/2026-05-14-harden-notation-playback-contract.md` - Folded into Phase 01 for resolver/playback/notation contract work, Phase 02 for full-score display work, and Phase 03 validation execution.

### Last Session

- Stopped at: Captured Phase 6 renderer exploration and drafted 06-01-PLAN.md
- Resume from: Execute or refine Phase 6 plan after review

### Decisions

- 05-01 selected the existing VexFlow adapter path for Phase 5 imported score rendering instead of adding OSMD now.
- 05-01 persists imported MusicXML payloads as inert text records in IndexedDB, not localStorage or executable modules.
- 05-01 requires future import UI to call `js/musicXmlScoreRenderer.js` instead of rendering imported scores directly.
- 05-02 accepts only strict score-partwise MusicXML and rejects unsupported import structure with source-scoped diagnostics.
- 05-02 registers imported MusicXML as inert complete-score loader records, not executable pattern modules.
- 05-02 exposes complete-score filtering while preserving built-in short pattern APIs internally.
- 05-03 maps strict MusicXML documents into canonical score events, measures, and page layout before display or playback.
- 05-03 implements `Player.play(sequence, { loop, range })` through canonical event ranges rather than a MusicXML-specific playback path.
- 05-04 imports register only after strict parse/adapt and IndexedDB save succeed.
- 05-04 routes imported MusicXML through renderMusicXmlScore while built-ins stay on drawStaffNotation.
- 05-04 uses Für Elise as the default complete-score built-in library entry after clear storage.
- 05-05 uses explicit Range mode as the accessible non-Shift alternative while preserving plain click for future score interactions.
- 05-05 auto-follow pauses on manual scroll intent and resumes from Resume follow or playback restart.
- 05-06 uses shared MusicXML fixture files as parser, adapter, and browser-smoke source data.
- 05-06 rejects unsupported MusicXML measure children during parse validation so unsupported imports cannot reach registration or playback.
- 05-06 browser smoke asserts DOM behavior and playback cleanup rather than brittle full SVG snapshots.
- 06 exploration reopens the Phase 5 renderer decision because real MuseScore exports show the simplified VexFlow reconstruction is not sufficient for professional MusicXML page fidelity.
- 06 chooses OSMD as the preferred renderer candidate, with Verovio retained as fallback/comparison due to stronger LGPL obligations and larger footprint.
- 06 recommends cuthbertLab/musicxmlTestSuite as the preferred MIT fixture source, with LilyPond collated tests used as coverage guidance.

### Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 05 | 01 | 4 min | 3 | 5 |
| 05 | 02 | 4 min | 3 | 4 |
| 05 | 03 | 7 min | 3 | 8 |
| 05 | 04 | 35 min | 3 | 8 |
| 05 | 05 | 12 min | 3 | 9 |
| 05 | 06 | 8 min | 3 | 7 |
| 06 | Explore | 20 min | 4 artifacts | 4 |

### Key Constraints

- Keep the app static and browser-only unless future requirements justify a build step or backend.
- Preserve existing sound generation and 88-key piano interaction.
- Prioritize notation/playback consistency, validation, score display, and MusicXML readiness.

### Known Risks

- Pattern data is still executable JavaScript, but it is now validated before selection.
- Long notation is now paginated by the Phase 2 renderer; human browser smoke remains the main residual visual check.
- MusicXML import is now covered by fixture-backed parser/adapter tests and integrated browser smoke for import, persistence, rendering, range playback, auto-follow, cleanup, removal, and built-in score practice behavior.
- Phase 6 should not expand app-owned engraving logic unless OSMD and Verovio both fail the renderer decision gate.

---
*State initialized: 2026-05-15*
