# Roadmap: Interactive Piano Helper

**Created:** 2026-05-15
**Mode:** Vertical MVP
**Core Value:** Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.

## Phase Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 1 | Canonical Pattern Event Pipeline | Make simple patterns play and display from the same event sequence | MODEL-01, MODEL-02, MODEL-03, SYNC-01 | Pending |
| 2 | Score Display Modes | Separate loop preview from score display and render full pieces reliably | SYNC-02, SYNC-03, SCORE-01, SCORE-02, SCORE-03 | Pending |
| 3 | Pattern Validation And Feedback | Validate existing pattern data and surface clear errors | VAL-01, VAL-02, VAL-03, TEST-01 | Pending |
| 4 | MusicXML-Ready Foundation | Prepare the score model for MusicXML while adding browser smoke coverage | XML-01, XML-02, TEST-02 | Pending |

## Phases

### Phase 1: Canonical Pattern Event Pipeline

**Goal:** Playback and notation for built-in patterns derive from one canonical event sequence.
**Mode:** mvp
**UI hint:** yes
**Requirements:** MODEL-01, MODEL-02, MODEL-03, SYNC-01
**Plans:** 0 plans

**Success Criteria**:
1. A shared resolver produces canonical events with start beat, duration, hand, notes, rests, chords, fingering, time signature, source index, and native-key metadata.
2. `js/player.js` schedules playback from the canonical event sequence instead of resolving note arrays independently.
3. `js/staffNotationRenderer.js` renders simple pattern previews from the same canonical events.
4. Lombard rhythm displays the same 4-note source cycle that playback schedules, or both playback and display use the same explicit expansion mode.
5. Existing built-in accompaniment patterns still play audibly as before.

Plans:
- [ ] TBD

### Phase 2: Score Display Modes

**Goal:** The app distinguishes compact pattern previews from complete score display and can render full piece-like material.
**Mode:** mvp
**UI hint:** yes
**Requirements:** SYNC-02, SYNC-03, SCORE-01, SCORE-02, SCORE-03
**Depends on:** Phase 1
**Plans:** 0 plans

**Success Criteria**:
1. Pattern preview and score display are explicit modes selected from pattern metadata or canonical score metadata.
2. Für Elise in A minor renders the complete available excerpt instead of stopping at 8 measures.
3. Longer notation expands or scrolls without being obscured by the fixed piano keyboard area.
4. Notation highlights use canonical event IDs rather than modulo-only pattern indices.
5. Unsupported native-key selections show a clear message and cannot start broken playback.

Plans:
- [ ] TBD

### Phase 3: Pattern Validation And Feedback

**Goal:** Built-in pattern data is validated at load time and selected-pattern failures are understandable.
**Mode:** mvp
**UI hint:** yes
**Requirements:** VAL-01, VAL-02, VAL-03, TEST-01
**Depends on:** Phase 1, Phase 2
**Plans:** 0 plans

**Success Criteria**:
1. Pattern loading validates required fields, note names, playable range, rests, chords, timings, time signatures, fingerings, and native-key behavior.
2. Missing or invalid pattern modules produce useful developer diagnostics instead of silent disappearance.
3. Invalid selected patterns show clear UI feedback without crashing playback or notation rendering.
4. Regression fixtures or tests cover transposition, timing conversion, measure grouping, validation, Lombard rhythm, Für Elise, chords, rests, and unsupported native keys.
5. Existing valid built-in patterns pass validation.

Plans:
- [ ] TBD

### Phase 4: MusicXML-Ready Foundation

**Goal:** The architecture is ready for a future MusicXML adapter without forcing MusicXML to replace compact built-in patterns.
**Mode:** mvp
**UI hint:** yes
**Requirements:** XML-01, XML-02, TEST-02
**Depends on:** Phase 1, Phase 2, Phase 3
**Plans:** 0 plans

**Success Criteria**:
1. The canonical score/event model has an adapter boundary suitable for future MusicXML import.
2. Short pedagogical patterns remain supported through the existing pattern source path or a validated equivalent.
3. Documentation identifies where a MusicXML parser/renderer would plug in and what data it must produce.
4. A lightweight browser smoke check verifies app boot, pattern loading, notation SVG rendering, and play/stop highlight cleanup.
5. The app remains usable as a static site after the architecture changes.

Plans:
- [ ] TBD

## Backlog

### Phase 999.1: MusicXML Import UI (BACKLOG)

**Goal:** User can import MusicXML files for complete sheet music display and playback.
**Requirements:** XML-03, XML-04, XML-05
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with `$gsd-review-backlog` when ready)

### Phase 999.2: Practice Range UX (BACKLOG)

**Goal:** User can loop selected measures, start playback from a measure/note, and auto-scroll during score playback.
**Requirements:** PRAC-01, PRAC-02, PRAC-03
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with `$gsd-review-backlog` when ready)

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | Phase 1 | Pending |
| MODEL-02 | Phase 1 | Pending |
| MODEL-03 | Phase 1 | Pending |
| SYNC-01 | Phase 1 | Pending |
| SYNC-02 | Phase 2 | Pending |
| SYNC-03 | Phase 2 | Pending |
| SCORE-01 | Phase 2 | Pending |
| SCORE-02 | Phase 2 | Pending |
| SCORE-03 | Phase 2 | Pending |
| VAL-01 | Phase 3 | Pending |
| VAL-02 | Phase 3 | Pending |
| VAL-03 | Phase 3 | Pending |
| TEST-01 | Phase 3 | Pending |
| XML-01 | Phase 4 | Pending |
| XML-02 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |

**Coverage:** 16 / 16 v1 requirements mapped.
