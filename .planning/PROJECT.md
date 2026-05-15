# Interactive Piano Helper

## What This Is

Interactive Piano Helper is a browser-only piano learning app for exploring accompaniment patterns and simple two-hand examples. It already provides a strong 88-key piano UI, responsive manual input, Web Audio/sample-based sound, pattern playback, and VexFlow notation previews.

The next stage is to make it feel trustworthy as a notation-backed learning tool: visible notes, played notes, validation, and score-like material should agree and fail clearly.

The current frontier is production MusicXML score rendering. Phase 6 proved OSMD as the preferred professional renderer, but Phase 7 still needs to make OSMD the real imported-score display path and preserve playback/practice correctness on top of OSMD pages.

## Core Value

Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.

## Requirements

### Validated

- ✓ User can play an interactive 88-key piano with mouse, touch, and QWERTY input — existing
- ✓ User can hear acceptable piano sound using Web Audio synthesis blended with local MP3 samples — existing
- ✓ User can select built-in accompaniment patterns and play/stop them with tempo, sustain, key, and swing controls — existing
- ✓ User can see keyboard highlights during manual play and pattern playback — existing
- ✓ User can view VexFlow staff notation for simple built-in patterns — existing
- ✓ User can use the app as a static site with no build step over a local HTTP server or static hosting — existing

### Active

- [ ] Make notation and playback derive from one canonical musical sequence.
- [ ] Fix short-loop display/playback mismatches such as Lombard rhythm showing 8 note events while playback loops 4.
- [ ] Render full score-like pieces, especially the existing Für Elise excerpt, without the hard 8-measure cutoff.
- [ ] Add explicit display modes for compact pattern preview versus complete sheet music.
- [ ] Add pattern validation for required fields, note names/ranges, rests, chords, timings, time signatures, fingerings, and native-key support.
- [ ] Show clear user-facing errors or guidance for unsupported keys and invalid pattern data.
- [ ] Prepare the architecture for MusicXML import by introducing an internal score/event model that both notation and playback can consume.
- [ ] Add focused regression tests around transposition, timing, notation grouping, validation, and playback/notation synchronization.
- [x] Evaluate a professional MusicXML renderer module, with OSMD as the preferred candidate and Verovio retained as fallback/comparison.
- [x] Add a curated MusicXML compatibility fixture suite using the cuthbertLab MIT test suite as the preferred source and LilyPond's collated tests as coverage guidance.
- [ ] Make OSMD the production imported MusicXML renderer in the real app instead of the simplified VexFlow reconstruction.
- [ ] Preserve playback highlights, range selection, start position, and auto-follow on OSMD-rendered score pages.

### Out of Scope

- Major sound generation redesign — current sound is good enough and not the present bottleneck.
- Major keyboard UI redesign — the piano display and button/key responses are already strong.
- Full framework rewrite — the immediate problem is data/model consistency, not lack of a framework.
- MusicXML-only replacement of all current patterns — short pedagogical accompaniment patterns should remain easy to author, ideally through a strict validated format.
- Server-side conversion or backend storage — the app should remain static unless a later requirement clearly justifies a backend.

## Context

This is a brownfield static web app with no production build step. It now has npm-based test tooling and pinned browser dependencies for renderer/testing work. The current stack is documented in `.planning/codebase/STACK.md`; the architecture map is in `.planning/codebase/ARCHITECTURE.md`; known risks are in `.planning/codebase/CONCERNS.md`.

The app boots from `index.html`, dynamically imports modules from `js/`, loads pattern modules from `patterns/index.js`, renders built-in pattern notation with VexFlow 4.2.2 from CDN, has an OSMD facade ready for imported MusicXML, and plays audio through `js/audioEngine.js`.

The early architectural issue was that pattern data, playback, and notation rendering did not share one canonical model. Phases 1-6 established canonical events, validation, MusicXML import, practice controls, browser smoke coverage, and an OSMD renderer facade. The current architectural issue is that imported MusicXML production display still uses the old simplified reconstruction path instead of OSMD.

The user explicitly values the current sound generation and piano interaction. Improvements should preserve those areas and concentrate on robustness around notation, validation, score display, and future MusicXML support.

## Constraints

- **Tech stack**: Keep vanilla JavaScript and static hosting unless test tooling or MusicXML support requires a minimal package setup.
- **Deployment**: The app must continue to work when served as static files over HTTP.
- **Existing UX**: Preserve the current keyboard interaction and sound defaults.
- **Notation**: VexFlow is currently loaded from CDN and used through global `Vex`.
- **Data model**: Existing JS pattern files are executable modules; validation and migration must avoid breaking all built-in patterns at once.
- **Testing**: There are no current tests, so high-risk refactors need focused fixtures and smoke coverage.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep sound generation stable for now | User deems it okay; notation/data robustness is higher leverage | — Pending |
| Preserve current 88-key keyboard UI and input responsiveness | User deems display and button responses very good | — Pending |
| Prioritize canonical notation/playback sequence | Fixes the trust problem where visible notes and played notes can diverge | — Pending |
| Support two input directions over time: validated short patterns and MusicXML for pieces | MusicXML is best for complete sheet music, but compact accompaniment patterns are still useful | — Pending |
| Avoid full framework rewrite | Current architecture is small and understandable; the core issue is model consistency | — Pending |
| Prefer a dedicated professional renderer for full MusicXML | Real MuseScore exports exceed the practical scope of app-owned VexFlow reconstruction | Phase 6 completed; OSMD selected |
| Use curated MusicXML fixtures instead of ad hoc samples | Renderer trust needs repeatable coverage across voices, chords, layout, directions, and compressed files | Phase 6 completed |
| Promote OSMD through a production facade | Phase 6 proved OSMD, but the app still needs production wiring and interaction mapping | Phase 7 planned |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 after Phase 7 planning*
