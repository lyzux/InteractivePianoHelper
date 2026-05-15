# Requirements: Interactive Piano Helper

**Defined:** 2026-05-14
**Core Value:** Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.

## v1 Requirements

### Canonical Music Model

- [x] **MODEL-01**: Playback and notation use one canonical event sequence.
- [x] **MODEL-02**: Built-in JavaScript patterns convert into the canonical model without changing their current audible behavior.
- [x] **MODEL-03**: Chords, rests, fingerings, timings, hands, time signatures, and native-key metadata are represented explicitly.

### Notation And Playback

- [x] **SYNC-01**: Lombard rhythm and other short loops display the same event sequence that playback schedules.
- [x] **SYNC-02**: Pattern preview and full score display are separate explicit modes.
- [x] **SYNC-03**: Notation highlights map to canonical event IDs, not modulo-only pattern indices.

### Score Display

- [x] **SCORE-01**: Für Elise in A minor renders the complete available excerpt instead of stopping at 8 measures.
- [x] **SCORE-02**: Longer notation expands or scrolls without being hidden by the fixed piano area.
- [x] **SCORE-03**: Unsupported native-key selections show a clear user-facing message and do not start broken playback.

### Validation

- [x] **VAL-01**: Pattern loading validates required fields and reports missing or invalid pattern modules.
- [x] **VAL-02**: Pattern validation checks note names, playable range, rests, chords, timing values, time signatures, and fingering length assumptions.
- [x] **VAL-03**: Invalid selected patterns show clear UI feedback while developer details go to the console.

### MusicXML Readiness

- [x] **XML-01**: Architecture supports a future MusicXML adapter into the canonical score model.
- [x] **XML-02**: Current short pedagogical patterns remain supported; MusicXML is added for complete pieces, not forced as the only format.

### Regression Safety

- [x] **TEST-01**: Focused tests or fixtures cover transposition, timing conversion, measure grouping, validation, Lombard rhythm, Für Elise, chords, rests, and unsupported native keys.
- [x] **TEST-02**: A lightweight browser smoke check covers app boot, pattern loading, notation SVG rendering, and play/stop highlight cleanup.

## v2 Requirements

### MusicXML Import

- [x] **XML-03**: User can import a MusicXML file for complete sheet music display.
- [x] **XML-04**: MusicXML import validates file structure, supported durations, notes, rests, chords, ties, accidentals, clefs, key signatures, and time signatures.
- [x] **XML-05**: Imported MusicXML scores can be played back through the existing piano and highlighted on the keyboard.

### Practice UX

- [x] **PRAC-01**: User can loop a selected measure range.
- [x] **PRAC-02**: User can start playback from a selected measure or note.
- [x] **PRAC-03**: Notation auto-scrolls to the current system during score playback.

### Professional MusicXML Rendering

- [x] **XML-06**: Imported MusicXML scores render through a professional page-faithful renderer module rather than the simplified app-owned VexFlow reconstruction.
- [x] **XML-07**: The MusicXML renderer exposes app-owned APIs for note/measure click events, playback highlighting, range marking, timing/cursor mapping, page metadata, and lifecycle cleanup.
- [x] **XML-08**: Renderer dependency choice is documented with license, static-hosting, performance, interactivity, and fallback analysis, with OSMD evaluated first and Verovio retained as a fallback comparison.

### MusicXML Compatibility Testing

- [x] **TEST-03**: A curated MusicXML fixture suite is integrated into automated tests, using the cuthbertLab MIT MusicXML Test Suite as the preferred source and LilyPond's collated tests as coverage guidance.

## v3 Requirements

### Production MusicXML Rendering

- [ ] **XML-09**: Imported MusicXML scores render through the OSMD-backed professional renderer facade in the real app, not through the simplified VexFlow reconstruction.
- [ ] **XML-10**: Imported MusicXML display preserves score-page semantics where supported: titles, credits, page layout, system/page breaks, printed measure behavior, voices, chords, directions, and full-page scaling within the notestand viewport.

### Production Playback And Practice Sync

- [ ] **SYNC-04**: Canonical playback event IDs map to OSMD-rendered visual note targets so score highlighting, keyboard highlighting, and cleanup remain synchronized.
- [ ] **PRAC-04**: Practice range selection, selected-measure looping, start position, and auto-follow work on OSMD-rendered measures.

### Production Renderer Regression Safety

- [ ] **TEST-04**: Automated tests cover production OSMD import/render behavior with curated MusicXML fixtures and the local MuseScore `.mxl` sample when present, including page fidelity markers, chords/voices, compressed MXL, highlights, range selection, and auto-follow.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Major sound redesign | Current sound generation is already good enough and not the current bottleneck. |
| Major keyboard UI redesign | Current 88-key display and button/key responses are already strong. |
| Full framework rewrite | The main issue is model consistency, validation, and notation robustness, not lack of a framework. |
| Backend/server-side MusicXML conversion | The app should remain static unless future requirements justify a backend. |
| MusicXML-only replacement of all current patterns | Short pedagogical accompaniment patterns should remain easy to author and maintain. |
| App-owned full MusicXML engraving engine | Mature MusicXML page rendering should come from a dedicated renderer module; the app should own integration APIs, not every engraving rule. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | Phase 1 | Completed |
| MODEL-02 | Phase 1 | Completed |
| MODEL-03 | Phase 1 | Completed |
| SYNC-01 | Phase 1 | Completed |
| SYNC-02 | Phase 2 | Complete |
| SYNC-03 | Phase 2 | Complete |
| SCORE-01 | Phase 2 | Complete |
| SCORE-02 | Phase 2 | Complete |
| SCORE-03 | Phase 2 | Complete |
| VAL-01 | Phase 3 | Completed |
| VAL-02 | Phase 3 | Completed |
| VAL-03 | Phase 3 | Completed |
| XML-01 | Phase 4 | Complete |
| XML-02 | Phase 4 | Complete |
| TEST-01 | Phase 3 | Completed |
| TEST-02 | Phase 4 | Complete |
| XML-03 | Phase 5 | Complete |
| XML-04 | Phase 5 | Complete |
| XML-05 | Phase 5 | Complete |
| PRAC-01 | Phase 5 | Complete |
| PRAC-02 | Phase 5 | Complete |
| PRAC-03 | Phase 5 | Complete |
| XML-06 | Phase 6 | Completed |
| XML-07 | Phase 6 | Completed |
| XML-08 | Phase 6 | Completed |
| TEST-03 | Phase 6 | Completed |
| XML-09 | Phase 7 | Planned |
| XML-10 | Phase 7 | Planned |
| SYNC-04 | Phase 7 | Planned |
| PRAC-04 | Phase 7 | Planned |
| TEST-04 | Phase 7 | Planned |

**Coverage:**
- Requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-15 after Phase 7 planning*
