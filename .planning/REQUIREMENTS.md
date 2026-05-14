# Requirements: Interactive Piano Helper

**Defined:** 2026-05-14
**Core Value:** Displayed notation and playback must describe the same musical events so learners can trust what they see, hear, and play.

## v1 Requirements

### Canonical Music Model

- [ ] **MODEL-01**: Playback and notation use one canonical event sequence.
- [ ] **MODEL-02**: Built-in JavaScript patterns convert into the canonical model without changing their current audible behavior.
- [ ] **MODEL-03**: Chords, rests, fingerings, timings, hands, time signatures, and native-key metadata are represented explicitly.

### Notation And Playback

- [ ] **SYNC-01**: Lombard rhythm and other short loops display the same event sequence that playback schedules.
- [ ] **SYNC-02**: Pattern preview and full score display are separate explicit modes.
- [ ] **SYNC-03**: Notation highlights map to canonical event IDs, not modulo-only pattern indices.

### Score Display

- [ ] **SCORE-01**: Für Elise in A minor renders the complete available excerpt instead of stopping at 8 measures.
- [ ] **SCORE-02**: Longer notation expands or scrolls without being hidden by the fixed piano area.
- [ ] **SCORE-03**: Unsupported native-key selections show a clear user-facing message and do not start broken playback.

### Validation

- [ ] **VAL-01**: Pattern loading validates required fields and reports missing or invalid pattern modules.
- [ ] **VAL-02**: Pattern validation checks note names, playable range, rests, chords, timing values, time signatures, and fingering length assumptions.
- [ ] **VAL-03**: Invalid selected patterns show clear UI feedback while developer details go to the console.

### MusicXML Readiness

- [ ] **XML-01**: Architecture supports a future MusicXML adapter into the canonical score model.
- [ ] **XML-02**: Current short pedagogical patterns remain supported; MusicXML is added for complete pieces, not forced as the only format.

### Regression Safety

- [ ] **TEST-01**: Focused tests or fixtures cover transposition, timing conversion, measure grouping, validation, Lombard rhythm, Für Elise, chords, rests, and unsupported native keys.
- [ ] **TEST-02**: A lightweight browser smoke check covers app boot, pattern loading, notation SVG rendering, and play/stop highlight cleanup.

## v2 Requirements

### MusicXML Import

- **XML-03**: User can import a MusicXML file for complete sheet music display.
- **XML-04**: MusicXML import validates file structure, supported durations, notes, rests, chords, ties, accidentals, clefs, key signatures, and time signatures.
- **XML-05**: Imported MusicXML scores can be played back through the existing piano and highlighted on the keyboard.

### Practice UX

- **PRAC-01**: User can loop a selected measure range.
- **PRAC-02**: User can start playback from a selected measure or note.
- **PRAC-03**: Notation auto-scrolls to the current system during score playback.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Major sound redesign | Current sound generation is already good enough and not the current bottleneck. |
| Major keyboard UI redesign | Current 88-key display and button/key responses are already strong. |
| Full framework rewrite | The main issue is model consistency, validation, and notation robustness, not lack of a framework. |
| Backend/server-side MusicXML conversion | The app should remain static unless future requirements justify a backend. |
| MusicXML-only replacement of all current patterns | Short pedagogical accompaniment patterns should remain easy to author and maintain. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | TBD | Pending |
| MODEL-02 | TBD | Pending |
| MODEL-03 | TBD | Pending |
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SCORE-01 | TBD | Pending |
| SCORE-02 | TBD | Pending |
| SCORE-03 | TBD | Pending |
| VAL-01 | TBD | Pending |
| VAL-02 | TBD | Pending |
| VAL-03 | TBD | Pending |
| XML-01 | TBD | Pending |
| XML-02 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-14 after initialization*
