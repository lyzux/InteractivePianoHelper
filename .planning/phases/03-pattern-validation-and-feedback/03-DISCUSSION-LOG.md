# Phase 3: Pattern Validation And Feedback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15T12:43:23+02:00
**Phase:** 3-Pattern Validation And Feedback
**Areas discussed:** Validation boundary, Failure handling, Strictness, Test depth, Future library picker direction

---

## Folded Todo

| Option | Description | Selected |
|--------|-------------|----------|
| Fold it | Include the remaining validation slice of `Harden notation playback contract` in Phase 3 context. | ✓ |
| Reference only | Mention it as related context but do not make it part of Phase 3 decisions. | |
| Ignore it | Leave it out of this phase discussion. | |

**User's choice:** `1`
**Notes:** The folded slice covers required fields, note/range validation, rests/chords, timing, time signatures, native-key behavior, and cyclic length assumptions.

---

## Validation Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Raw pattern source | Validate only the current JavaScript pattern object shape before registration. | |
| Canonical sequence | Validate only the resolved event sequence consumed by playback and notation. | |
| MusicXML-oriented required components | Focus validation on key musical components needed for future MusicXML loading while covering current source and canonical sequence boundaries. | ✓ |

**User's choice:** Choose the validation that focuses on the key components required to load MusicXML.
**Notes:** Captured as dual source-shape and canonical-sequence validation, with structured diagnostics that can later support MusicXML import.

---

## Failure Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep selectable with error panel | Let invalid patterns remain selectable but block playback/rendering with an error panel. | |
| Hide or remove from selection with user warning | Remove invalid patterns from available options and notify the user that verification failed. | ✓ |
| Developer-only diagnostics | Log validation failures but keep the user surface unchanged. | |

**User's choice:** Invalid patterns should be removed from the selection and a warning or failure toast should inform about the failed verification.
**Notes:** Developer diagnostics should still include pattern IDs and exact field paths in the console.

---

## Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Compatibility workarounds | Allow exceptions so current legacy content continues to load even if malformed. | |
| Strict contract with content corrections | Adjust current content so it passes validation instead of preserving invalid legacy behavior. | ✓ |
| Warnings-only rollout | Warn first and defer strict blocking to later phases. | |

**User's choice:** Current content should be adjusted and not receive a workaround. Long-term preference is conversion/new content to MusicXML and removal of legacy patterns from source.
**Notes:** Phase 3 should not perform wholesale MusicXML conversion, but should prepare for that direction and avoid cementing the existing executable pattern format.

---

## Test Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Known risky fixtures only | Cover Lombard, Fuer Elise, chords, rests, and unsupported key cases. | |
| Extensive practical validation fixtures | Add malformed fixtures for every validator category that materially matters. | ✓ |
| Minimal smoke coverage | Only confirm valid built-ins load and app does not crash. | |

**User's choice:** Make it as extensive as it makes sense.
**Notes:** Captured as practical but broad coverage across required fields, notes/ranges, rests/chords, timing, time signatures, fingerings, native-key behavior, import failures, selector filtering, and feedback hooks.

---

## Future Library Picker Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Built-in defaults only | Keep a fixed built-in list and defer all user sources. | |
| Local remembered library | Built-in defaults plus user-imported MusicXML files remembered locally and removable later. | ✓ |
| Cloud/account library | Persist user files through server or account state. | |

**User's choice:** A few pieces should be preselected as the initial/default state. MusicXML files loaded through a filesystem picker should be saved locally, added to options, remembered, and removable.
**Notes:** Captured as future-facing product direction. Phase 3 should prepare validation source boundaries for this, but file picker/import/persistence/removal UI is deferred.

---

## the agent's Discretion

- Choose diagnostic code taxonomy, severity names, validator module boundaries, and exact toast/notification implementation.
- Decide how to split validation between pre-registration source checks and post-resolution canonical sequence checks.
- Decide the smallest sensible test harness additions for validation and UI feedback contracts.

## Deferred Ideas

- MusicXML filesystem picker, remembered local imports, removable imported options, and full MusicXML parsing/rendering are future capabilities outside Phase 3.
- Replacing all legacy source content with MusicXML is a future migration decision, not a Phase 3 implementation requirement.
