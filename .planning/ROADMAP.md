# Roadmap: Interactive Piano Helper

**Created:** 2026-05-15
**Mode:** Vertical MVP
**Core Value:** Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.

## Phase Overview

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 1 | Canonical Pattern Event Pipeline | Make simple patterns play and display from the same event sequence | MODEL-01, MODEL-02, MODEL-03, SYNC-01 | Completed |
| 2 | Score Display Modes | Separate loop preview from score display and render full pieces reliably | SYNC-02, SYNC-03, SCORE-01, SCORE-02, SCORE-03 | Completed |
| 3 | Pattern Validation And Feedback | Validate existing pattern data and surface clear errors | VAL-01, VAL-02, VAL-03, TEST-01 | Completed |
| 4 | MusicXML-Ready Foundation | Prepare the score model for MusicXML while adding browser smoke coverage | XML-01, XML-02, TEST-02 | Completed |
| 5 | MusicXML Import And Practice UX | Import MusicXML scores and add practice controls for score playback | XML-03, XML-04, XML-05, PRAC-01, PRAC-02, PRAC-03 | Pending |

## Phases

### Phase 1: Canonical Pattern Event Pipeline

**Goal:** Playback and notation for built-in patterns derive from one canonical event sequence.
**Mode:** mvp
**UI hint:** yes
**Requirements:** MODEL-01, MODEL-02, MODEL-03, SYNC-01
**Plans:** 2 plans

**Success Criteria**:
1. A shared resolver produces canonical events with start beat, duration, hand, notes, rests, chords, fingering, time signature, source index, and native-key metadata.
2. `js/player.js` schedules playback from the canonical event sequence instead of resolving note arrays independently.
3. `js/staffNotationRenderer.js` renders simple pattern previews from the same canonical events.
4. Lombard rhythm displays the same 4-note source cycle that playback schedules, or both playback and display use the same explicit expansion mode.
5. Existing built-in accompaniment patterns still play audibly as before.

Plans:
- [x] 01-01 Canonical resolver and unit test foundation
- [x] 01-02 Playback and notation consume canonical events

### Phase 2: Score Display Modes

**Goal:** The app distinguishes compact pattern previews from complete score display and can render full piece-like material.
**Mode:** mvp
**UI hint:** yes
**Requirements:** SYNC-02, SYNC-03, SCORE-01, SCORE-02, SCORE-03
**Depends on:** Phase 1
**Plans:** 3/3 plans complete

**Success Criteria**:
1. Pattern preview and score display are explicit modes selected from pattern metadata or canonical score metadata.
2. Für Elise in A minor renders the complete available excerpt instead of stopping at 8 measures.
3. Longer notation expands or scrolls without being obscured by the fixed piano keyboard area.
4. Notation highlights use canonical event IDs rather than modulo-only pattern indices.
5. Unsupported native-key selections show a clear message and cannot start broken playback.

Plans:
**Wave 1**
- [x] 02-01 Authored score controls and loop playback

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02 A4 full-score page renderer

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 02-03 Score display contract verification

### Phase 3: Pattern Validation And Feedback

**Goal:** Built-in pattern data is validated at load time and selected-pattern failures are understandable.
**Mode:** mvp
**UI hint:** yes
**Requirements:** VAL-01, VAL-02, VAL-03, TEST-01
**Depends on:** Phase 1, Phase 2
**Plans:** 3/3 plans complete

**Success Criteria**:
1. Pattern loading validates required fields, note names, playable range, rests, chords, timings, time signatures, fingerings, and native-key behavior.
2. Missing or invalid pattern modules produce useful developer diagnostics instead of silent disappearance.
3. Invalid selected patterns show clear UI feedback without crashing playback or notation rendering.
4. Regression fixtures or tests cover transposition, timing conversion, measure grouping, validation, Lombard rhythm, Für Elise, chords, rests, and unsupported native keys.
5. Existing valid built-in patterns pass validation.

Plans:
- [x] `03-01-PLAN.md` — Validator core and diagnostic fixtures (Wave 1)
- [x] `03-02-PLAN.md` — Loader validation gate and source corrections (Wave 2, depends on 03-01)
- [x] `03-03-PLAN.md` — User feedback and regression contracts (Wave 3, depends on 03-01 and 03-02)

### Phase 4: MusicXML-Ready Foundation

**Goal:** The architecture is ready for a future MusicXML adapter without forcing MusicXML to replace compact built-in patterns.
**Mode:** mvp
**UI hint:** yes
**Requirements:** XML-01, XML-02, TEST-02
**Depends on:** Phase 1, Phase 2, Phase 3
**Plans:** 2 plans

**Success Criteria**:
1. The canonical score/event model has an adapter boundary suitable for future MusicXML import.
2. Short pedagogical patterns remain supported through the existing pattern source path or a validated equivalent.
3. Documentation identifies where a MusicXML parser/renderer would plug in and what data it must produce.
4. A lightweight browser smoke check verifies app boot, pattern loading, notation SVG rendering, and play/stop highlight cleanup.
5. The app remains usable as a static site after the architecture changes.

Plans:
**Wave 1**
- [x] `04-01-PLAN.md` — MusicXML adapter contract and documentation

**Wave 2** *(blocked on Wave 1 completion; critical browser tooling gate)*
- [x] `04-02-PLAN.md` — Browser smoke coverage

### Phase 5: MusicXML Import And Practice UX

**Goal:** User can import MusicXML files for complete sheet music display/playback and practice imported or built-in score content with selected measure looping, start positions, and auto-scroll.
**Mode:** mvp
**UI hint:** yes
**Requirements:** XML-03, XML-04, XML-05, PRAC-01, PRAC-02, PRAC-03
**Depends on:** Phase 1, Phase 2, Phase 3, Phase 4
**Plans:** 0 plans

**Success Criteria**:
1. User can import `.musicxml` or `.xml` files through a browser file picker without a backend.
2. Imported MusicXML is parsed as inert data, validated, converted into the canonical score model, and rejected with clear feedback when unsupported or invalid.
3. Imported MusicXML scores display as complete sheet pages and play through the existing piano, keyboard, and highlight path.
4. Imported pieces are remembered locally, appear alongside built-in pieces, and can be removed.
5. User can choose a measure range to loop and can start playback from a selected measure or note.
6. Notation auto-scrolls to the currently playing system during score playback without disrupting the bottom keyboard or sound controls.
7. Built-in short pedagogical patterns remain available and are not forced into MusicXML.

Plans:
- [ ] TBD

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | Phase 1 | Completed |
| MODEL-02 | Phase 1 | Completed |
| MODEL-03 | Phase 1 | Completed |
| SYNC-01 | Phase 1 | Completed |
| SYNC-02 | Phase 2 | Completed |
| SYNC-03 | Phase 2 | Completed |
| SCORE-01 | Phase 2 | Completed |
| SCORE-02 | Phase 2 | Completed |
| SCORE-03 | Phase 2 | Completed |
| VAL-01 | Phase 3 | Completed |
| VAL-02 | Phase 3 | Completed |
| VAL-03 | Phase 3 | Completed |
| TEST-01 | Phase 3 | Completed |
| XML-01 | Phase 4 | Completed |
| XML-02 | Phase 4 | Completed |
| TEST-02 | Phase 4 | Completed |
| XML-03 | Phase 5 | Pending |
| XML-04 | Phase 5 | Pending |
| XML-05 | Phase 5 | Pending |
| PRAC-01 | Phase 5 | Pending |
| PRAC-02 | Phase 5 | Pending |
| PRAC-03 | Phase 5 | Pending |

**Coverage:** 22 / 22 requirements mapped.
