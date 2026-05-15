---
phase: 01-canonical-pattern-event-pipeline
status: passed
verified: 2026-05-15T10:05:02+02:00
requirements: [MODEL-01, MODEL-02, MODEL-03, SYNC-01]
---

# Phase 01 Verification: Canonical Pattern Event Pipeline

## Verdict

**Passed.** Built-in pattern preview playback, notation rendering, and notation highlighting now consume the same canonical event sequence.

## Goal Check

**Phase goal:** Playback and notation for built-in patterns derive from one canonical event sequence.

The goal is met for Phase 1 scope:

- `js/canonicalPatternResolver.js` produces canonical events with stable IDs, beat positions, durations, normalized hand payloads, rests, chords, fingerings, time signatures, loop metadata, and unsupported native-key states.
- `js/simplePatternLoader.js` exposes `resolvePatternSequence(patternId, key)` and bridges existing JavaScript pattern modules into the canonical resolver.
- `index.html` resolves the selected pattern/key into `currentPatternSequence` and passes that sequence to both notation and playback.
- `js/player.js` schedules from `sequence.events`, advances by `event.durationBeats`, loops after the canonical event list, and emits `onNoteHighlight(event.id, event)`.
- `js/staffNotationRenderer.js` builds bass/treble measure data from canonical events and returns highlight maps keyed by event ID.

## Requirement Traceability

| Requirement | Status | Evidence |
|-------------|--------|----------|
| MODEL-01 | Passed | `index.html`, `js/player.js`, and `js/staffNotationRenderer.js` share `currentPatternSequence` / canonical `events`. |
| MODEL-02 | Passed | Existing pattern modules continue loading through `SimplePatternLoader`, with conversion handled by `resolvePatternSequence`. |
| MODEL-03 | Passed | Resolver tests cover rests, chords, fingerings, durations, hands, time signatures, and unsupported native-key metadata. |
| SYNC-01 | Passed | Lombard resolves to 8 canonical events totaling one `4/4` loop, and both playback and notation consume that same list. |

## Automated Verification

- `npm test` passed.
- `node --check js/player.js` passed.
- `node --check js/staffNotationRenderer.js` passed.
- `rg "expandedIdx|expandPattern|noteIndex %|leftLen|rightLen|_SHARP_P|_resolveNotesP|leftHandNotes|rightHandNotes|currentTiming" index.html js/player.js js/staffNotationRenderer.js` returned no matches.
- Local static server responded with `HTTP/1.0 200 OK` for `/index.html` on port 8001.

## Manual Verification Notes

The local server is running at `http://127.0.0.1:8001/` for visual smoke testing. Browser automation was not available in this runtime, so the remaining useful human check is to open the app, select Lombard, press Play, and confirm the notation highlight and piano highlight advance together through the complete displayed loop.

## Residual Risks

- Full-score display remains capped by `MAX_DISPLAY_MEASURES`; Phase 2 owns long score rendering and Für Elise completeness.
- Pattern validation remains shallow; Phase 3 owns broad validation and user-facing invalid-pattern diagnostics.
- MusicXML import is not implemented; Phase 4 owns adapter readiness beyond the canonical model boundary established here.

---
*Verified: 2026-05-15*
