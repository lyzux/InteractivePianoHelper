# Phase 4: MusicXML-Ready Foundation - Context

**Gathered:** 2026-05-15T13:15:00+02:00
**Status:** Ready for research and planning

<domain>
## Phase Boundary

This phase prepares the existing canonical score/event architecture for future MusicXML import while adding lightweight browser smoke coverage. It should define and test the adapter boundary that a MusicXML parser will later target, document how MusicXML concepts map into the app's current validated canonical model, and verify the static browser app still boots and renders notation. It must not implement the file picker, persistent imported library, removable user entries, full MusicXML parser, or MusicXML import UI from the backlog.

</domain>

<decisions>
## Implementation Decisions

### MusicXML Adapter Boundary
- **D-01:** Phase 4 should introduce a clear adapter contract for future MusicXML input, not a full user-facing MusicXML import workflow.
- **D-02:** The preferred internal target remains the existing canonical score/event sequence used by playback and notation. MusicXML-specific parsing should eventually adapt into this model rather than bypassing it with a separate playback path.
- **D-03:** The contract should explicitly account for standard MusicXML score structure: `score-partwise` as the default preferred root, score header metadata, `part-list`, parts, measures, attributes, notes, rests, chords, backups/forwards, directions, print/layout markers, and sound/playback metadata where relevant.
- **D-04:** The foundation should document unsupported or deferred MusicXML concepts rather than pretending to support everything. Reasonable v1 adapter targets are piano-oriented scores with notes, rests, chords, ties, time/key/clef data, page/system layout hints, and enough metadata for source identity.

### Page Fidelity And Rendering Direction
- **D-05:** Future MusicXML-backed sheet display should preserve page semantics where available instead of reflowing musical content across arbitrary responsive containers.
- **D-06:** MusicXML layout data such as `defaults/page-layout` and measure-level `print` page/system hints should be represented in the planned adapter model even if the current VexFlow page renderer can only consume a subset at first.
- **D-07:** The current A4 sheet renderer remains the active display surface. Phase 4 may refine data contracts and documentation around page layout, but should not replace VexFlow or introduce a new production renderer unless research proves a small dependency is clearly necessary and compatible with static hosting.

### Existing Pattern Support
- **D-08:** Short pedagogical patterns remain supported through the current validated JS pattern path. MusicXML should be added as an additional source type for complete pieces later, not forced as the only format.
- **D-09:** Source records and diagnostics should continue to use source-scoped abstractions (`sourceId`, `sourceType`, diagnostics) so future built-in MusicXML and user-imported MusicXML entries fit the same loader/validation feedback path.
- **D-10:** Existing sound generation, keyboard interaction, bottom keyboard behavior, sound panel behavior, and authored-key/no-transpose product direction remain locked and should not be redesigned in this phase.

### Browser Smoke Coverage
- **D-11:** Add lightweight browser smoke coverage for app boot, validated pattern loading, score SVG rendering, and play/stop/highlight cleanup. Prefer a small static-server plus browser automation setup that keeps `npm test` or a separate smoke command simple.
- **D-12:** If browser smoke tooling requires a new dev dependency such as Playwright, that dependency choice is a critical execution gate. The recommended path is to ask before installing/downloading browser tooling, then keep it dev-only and static-site compatible.
- **D-13:** Avoid brittle full SVG snapshots. Smoke tests should assert structure and behavior: dropdown populated, `#vexflow-notation svg` exists, score pages render, Play changes state, Stop clears state/highlights, and no validation failure is visible for valid built-ins.

### Documentation And Migration Notes
- **D-14:** Phase 4 should produce implementation-facing documentation that explains where a future MusicXML parser plugs in, what canonical data it must output, how validation should run, and how future library/import UI can use the same loader boundary.
- **D-15:** Documentation should reference official MusicXML semantics rather than relying on guessed mappings. Research should prioritize official W3C MusicXML 4.0 references and only use third-party renderer docs for library evaluation.

### Recommended Gates
- **D-16:** Non-critical planning gates are pre-approved to use the recommended option. Critical gates should still ask the user. The only currently anticipated critical gate is adding/downloading browser automation tooling or a substantial notation/MusicXML rendering dependency.

### the agent's Discretion
- Choose exact module and document names for the adapter contract.
- Choose whether the adapter boundary is represented as JSDoc/type-like schema, plain markdown, small pure helpers, or tests first, as long as future MusicXML implementation has a concrete target.
- Choose the smoke test command shape and assertions, but ask before installing browser tooling if it is not already available.
- Choose whether to refresh outdated codebase maps during planning if they conflict with the current post-Phase-3 implementation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` — Core value, constraints, static-app direction, and explicit preservation of sound/keyboard behavior.
- `.planning/REQUIREMENTS.md` — Phase 4 requirements XML-01, XML-02, and TEST-02; future XML-03/XML-04/XML-05 are backlog scope.
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and boundary from MusicXML import UI backlog.
- `.planning/STATE.md` — Current state after Phase 3; notes that MusicXML import remains a future adapter target.
- `CLAUDE.md` — Project overview and the user's preference for MusicXML-compatible sheet fidelity.

### Prior Phase Artifacts
- `.planning/phases/01-canonical-pattern-event-pipeline/01-CONTEXT.md` — Canonical event model decisions and MusicXML-readiness constraints.
- `.planning/phases/01-canonical-pattern-event-pipeline/01-VERIFICATION.md` — Confirms canonical playback/notation path exists.
- `.planning/phases/02-score-display-modes/02-CONTEXT.md` — Sheet-first A4 page decisions, no key editing, optional loop behavior, authored content as source of truth.
- `.planning/phases/02-score-display-modes/02-VERIFICATION.md` — Confirms full-score rendering and residual visual risks.
- `.planning/phases/03-pattern-validation-and-feedback/03-CONTEXT.md` — MusicXML-oriented validation boundary and source-type decisions.
- `.planning/phases/03-pattern-validation-and-feedback/03-VERIFICATION.md` — Confirms loader gate, structured diagnostics, and validation feedback are in place.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — App layers and static browser architecture; note that some pre-Phase-1 issues have since been improved.
- `.planning/codebase/INTEGRATIONS.md` — External dependency shape: VexFlow CDN, static hosting, no backend.
- `.planning/codebase/TESTING.md` — Browser smoke targets and future test strategy; note that Node tests now exist despite the older map.
- `.planning/codebase/CONCERNS.md` — MusicXML input, renderer fragility, fixed piano layout, and browser coverage gaps.

### Source Touchpoints
- `js/canonicalPatternResolver.js` — Current canonical event output and note helpers that future MusicXML adapters should target or evolve.
- `js/patternValidator.js` — Existing structured validation and canonical sequence checks; sourceType must support future `musicxml`.
- `js/simplePatternLoader.js` — Valid/rejected source registry, diagnostics, selector options, and future multi-source integration point.
- `js/staffNotationRenderer.js` — Current A4 VexFlow sheet renderer, score page planner, highlight maps, and page scaling behavior.
- `js/player.js` — Canonical sequence playback consumer that should not gain a separate MusicXML-only path.
- `index.html` — Static app shell, boot path, validation status, play/stop wiring, and target for browser smoke checks.
- `tests/*.test.js` — Existing Node test suite and contract-test style.
- `package.json` — Current test command and minimal package setup.

### External Standards And Library Research
- `https://www.w3.org/2021/06/musicxml40/tutorial/structure-of-musicxml-files/` — Official MusicXML 4.0 structure: score roots, header, part-list, parts, measures, and music data.
- `https://www.w3.org/2021/06/musicxml40/tutorial/midi-compatible-part/` — Official MusicXML 4.0 note, pitch, duration, rest, chord, tie, backup/forward concepts relevant to playback mapping.
- `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/print/` — Official MusicXML 4.0 page/system print hints.
- `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/page-layout/` — Official MusicXML 4.0 page layout defaults and per-page layout behavior.
- `https://www.npmjs.com/package/opensheetmusicdisplay` — Third-party browser MusicXML renderer candidate for future evaluation only; do not adopt without a critical dependency decision.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolvePatternSequence()` produces pure canonical events with IDs, start beats, durations, hands, notes/rests/chords, time signature, loop unit, and native-key metadata.
- `validateResolvedSequence()` in `js/patternValidator.js` already checks canonical invariants that a MusicXML adapter should satisfy.
- `SimplePatternLoader` already stores valid and rejected sources separately and exposes source-scoped diagnostics.
- `drawStaffNotation()` and helpers in `js/staffNotationRenderer.js` already produce A4-style score pages and event highlight maps from canonical events.
- Existing `node:test` tests give a lightweight pattern for pure contract coverage.

### Established Patterns
- Keep vanilla ES modules and static hosting.
- Use pure modules under `js/` for model/validation logic.
- Keep detailed diagnostics structured for tests/console and user copy concise.
- Avoid changing sound, keyboard, or key-editing behavior while improving notation/data reliability.
- Use source-level contract tests where browser automation is not needed, and reserve browser smoke tests for actual DOM/VexFlow behavior.

### Integration Points
- Future MusicXML adapters should connect before loader registration and produce either a canonical source record or a rejected source record.
- Future MusicXML validation should reuse `createDiagnostic()`, severity conventions, source IDs, source types, and canonical sequence validation.
- Browser smoke coverage should serve the app over HTTP, open `index.html`, wait for pattern loading, inspect notation SVG/page output, exercise Play/Stop, and verify highlight cleanup.
- Any future renderer/library evaluation must preserve the current static deployment model and page-fidelity direction.

</code_context>

<specifics>
## Specific Ideas

- Future MusicXML display should depict the page as a page: content should scale within the sheet viewport and not flow into another page just because the viewport is smaller.
- Complete pieces should eventually be MusicXML-backed, while short pedagogical patterns may remain in a strict validated internal format.
- The future default state should be a small built-in library; imported MusicXML library/persistence/removal remains later backlog scope.
- Browser smoke should focus on app trust: boot, valid sources, visible score SVG/page output, Play/Stop, and cleanup.

</specifics>

<deferred>
## Deferred Ideas

- MusicXML file picker, local persistence, remembered imported pieces, and removal controls remain Phase 999.1 / future import UI scope.
- Full MusicXML parsing and rendering of arbitrary files is not Phase 4 unless planning finds a small fixture parser is necessary only to prove the adapter contract.
- Practice range UX, selected-measure looping, start-from-measure, and auto-scroll remain Phase 999.2 scope.
- Replacing the app's VexFlow renderer with OpenSheetMusicDisplay or another renderer is deferred unless a future critical decision explicitly approves the dependency and migration.

</deferred>

---

*Phase: 4-MusicXML-Ready Foundation*
*Context gathered: 2026-05-15T13:15:00+02:00*
