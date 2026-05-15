# Phase 6: Professional MusicXML Renderer - Discussion Log

> **Audit trail only.** Do not use as the sole input to planning or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves what was explored.

**Date:** 2026-05-15
**Phase:** 6-Professional MusicXML Renderer
**Areas discussed:** Renderer fidelity, renderer interactivity, licensing, MusicXML compatibility tests

---

## Origin

After Phase 5, `.mxl` import and most playback worked, but real MuseScore Studio exports exposed that the current app renderer is still a simplified VexFlow reconstruction:

- Title, subtitle, composer, dynamics, slurs, and other score symbols are incomplete or misplaced.
- MusicXML page/system layout is not faithfully treated as the visual source of truth.
- Implicit pickup measures and backup/chord handling needed corrective patches.
- Multi-voice piano material is hard to verify because the rendered notation is visually unreliable.
- The current renderer would require app-owned implementations for many MusicXML layout rules that mature score renderers already solve.

## User Direction

| Topic | Decision |
|-------|----------|
| Renderer ambition | Professional, fully fledged MusicXML renderer module, not incremental patching of the simplified renderer |
| MusicXML scope | Aim to include everything MusicXML has to offer over time, with professional page-fidelity behavior |
| Interactivity | Renderer must support playback highlights, coloring/marking notes, click events, and future editing-facing APIs where practical |
| Licensing | Project is open source; third-party renderer and fixture licenses must be considered before integration |
| Preferred renderer | OSMD sounds good and should be treated as the leading candidate |
| Test suite | Integrate a best-fitting MusicXML test-suite strategy into project tests; exact source/approach delegated |

## Alternatives Considered

| Option | Discussion Outcome |
|--------|--------------------|
| Continue custom VexFlow reconstruction | Rejected as the main path. VexFlow is excellent as a low-level engraving API, but full MusicXML layout would remain the app's burden. |
| OpenSheetMusicDisplay | Preferred candidate. Browser MusicXML renderer with SVG output, cursor APIs, graphical notes, note coloring, and a modifiable score model. |
| Verovio | Keep as comparison/fallback. Strong renderer and timemap/SVG APIs, but LGPL-3.0-or-later has more obligations and package footprint is larger. |
| alphaTab | Not favored for this app's core need because its MusicXML support is not positioned as complete page-fidelity import. |
| LilyPond-hosted MusicXML collated files | Valuable reference and upstream knowledge. Direct vendoring should be checked carefully. |
| cuthbertLab/musicxmlTestSuite | Preferred fixture source because it is a GitHub-hosted fork with explicit MIT license statements and easier automated integration. |

## Key Discussion Result

Phase 6 should not be "fix the current renderer again." It should evaluate and integrate a professional MusicXML rendering module, with OSMD as the first intended path and a comparison gate against Verovio/current VexFlow.

The test-suite strategy should use the cuthbertLab MusicXML Test Suite as the vendorable MIT source, while keeping the LilyPond collated documentation as coverage guidance and historical reference.

