# Phase 1: Canonical Pattern Event Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15T09:34:03+02:00
**Phase:** 1-Canonical Pattern Event Pipeline
**Areas discussed:** Short-loop preview semantics, canonical model depth, correction strictness, test tooling, todo folding

---

## Short-Loop Preview Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Source-cycle preview | Display the raw source cycle even if shorter than a measure. | |
| Explicit expanded loop | Display a syntactically complete loop unit and make playback match it. | |
| Per-pattern canonical loop unit | Decide the loop unit individually per pattern through canonical metadata/defaults. | ✓ |

**User's choice:** The notation must be syntactically right and playback must play what is seen. Looping after the last measure is wanted. The loop unit has to be decided individually, with the future expectation that MusicXML patterns can loop the entire MusicXML file.
**Notes:** This rules out the current hidden mismatch where Lombard can display an expanded unit while playback cycles a shorter raw source sequence.

---

## Canonical Model Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal current-pattern event stream | Only model what current JavaScript patterns need. | |
| MusicXML-ready score/event model | Prepare as much as practical for future MusicXML integration. | ✓ |
| Full MusicXML implementation now | Implement MusicXML import in this phase. | |

**User's choice:** Prepare utmost for MusicXML to be integrated later and make the integration professionally prepared.
**Notes:** Phase 1 should not implement MusicXML import, but downstream planning should treat adapter boundaries and standard musical concepts as important quality criteria.

---

## Correction Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Mismatch fixes only | Fix only inconsistencies needed for valid notation and playback/display agreement. | |
| Musical interpretation improvements | Also improve musical interpretation when a pattern seems awkward or incomplete. | ✓ |
| Preserve unless clearly wrong | Prefer current behavior unless it is plainly broken. | |

**User's choice:** Musical interpretation improvements are allowed.
**Notes:** Corrections should remain scoped to Phase 1's model/playback/notation contract and not become a sound/UI redesign.

---

## Test Tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Manual smoke only | Keep Phase 1 verification manual. | |
| Unit tests where useful | Add unit tests around pure resolver/model behavior. | ✓ |
| Full browser smoke setup now | Add broader browser automation immediately. | |

**User's choice:** The user prefers already implementing unit tests where it makes sense.
**Notes:** Minimal JavaScript test tooling is acceptable if it preserves static app usage.

---

## Todo Folding

| Option | Description | Selected |
|--------|-------------|----------|
| Fold todo into Phase 1 | Include `Harden notation playback contract` in this phase context. | ✓ |
| Leave todo pending | Keep the todo separate for later triage. | |

**User's choice:** Yes, fold the todo.
**Notes:** The folded todo also mentions Phase 2/3/4 topics; only the shared resolver and notation/playback contract portions are in Phase 1 scope.

---

## the agent's Discretion

- Choose exact canonical resolver module boundaries.
- Choose minimal appropriate unit test tooling.
- Decide which current pattern corrections are Phase 1 model fixes versus later validation/score-display work.

## Deferred Ideas

- Full MusicXML import UI.
- Complete full-score display and scrolling.
- Full pattern validation and selected-pattern error UI.
