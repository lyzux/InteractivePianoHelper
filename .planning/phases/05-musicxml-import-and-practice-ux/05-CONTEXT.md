# Phase 5: MusicXML Import And Practice UX - Context

**Gathered:** 2026-05-15T15:10:40+02:00
**Status:** Ready for research and planning

<domain>
## Phase Boundary

This phase turns the MusicXML-ready foundation into a user-facing import and practice workflow. The app should import `.musicxml`/`.xml` files locally in the browser, validate them strictly, convert accepted scores into the canonical model used by playback and notation, display imported scores as complete MusicXML-style pages, remember/removable imported pieces locally, and add score-based practice controls for range looping, playback start positions, and auto-follow scrolling.

The phase must keep the app static/browser-only and must preserve the existing sound engine, 88-key piano interaction, bottom keyboard behavior, and sound controls unless a change is directly required for import or practice playback.

</domain>

<decisions>
## Implementation Decisions

### Import Library Lifecycle
- **D-01:** After browser storage/cache is clear, the default library should show only complete score-like pieces. Short pedagogical patterns may remain supported internally but should not be the primary default library surface for Phase 5.
- **D-02:** Imported MusicXML files should be remembered automatically in browser-local storage after successful import.
- **D-03:** Duplicate imports with the same filename/title should create a second entry with a suffix instead of updating or blocking the existing imported entry.
- **D-04:** Imported entries should have a visible remove action near the selector/library UI.

### MusicXML Acceptance Boundary
- **D-05:** Phase 5 should try to support multi-part MusicXML scores where possible, but unsupported parts must be rejected rather than silently skipped.
- **D-06:** Import should be strict by default. Optional lenient import can be deferred until strict import is reliable.
- **D-07:** Failed import/validation should show a short toast plus expandable user-facing error details. Detailed diagnostics should remain structured and useful for console/tests.
- **D-08:** Imported files must map cleanly to the current canonical event model. Display-only imports are not acceptable for Phase 5.

### Score Rendering Fidelity
- **D-09:** MusicXML page and system layout should be preserved as defined by the file where present, similar to MuseScore Studio's full-page score presentation. When layout data is incomplete, generate full pages rather than flowing content arbitrarily.
- **D-10:** Rendered page content should scale inside the sheet viewport without reflowing measures or systems into a different page.
- **D-11:** Renderer choice is delegated to implementation/research, but the chosen path must be future-proof and interactive. It must support playback highlights, click events, and possible future note editing. Static-image-only rendering is out of scope.
- **D-12:** Desktop/wide layouts should keep the two-page stand behavior. Small screens should switch to a one-page vertical layout, with vertical scrolling preferred.

### Practice Playback Controls
- **D-13:** Measure range selection should be score-based, using an intentional modified click gesture such as `Shift+click` rather than plain click alone.
- **D-14:** The selected range should use a mint-green accent.
- **D-15:** Playback should support starting from the selected measure first. Starting from a selected note/event is allowed if the renderer exposes reliable event clicks.
- **D-16:** The existing loop toggle should loop the selected range when a range exists; otherwise it should loop the full score.
- **D-17:** Auto-scroll should follow playback unless the user manually scrolls away. Manual scroll pauses auto-follow until resumed.

### the agent's Discretion
- Choose the exact storage API and schema for remembered imports, provided it remains browser-local and static-hosting compatible.
- Choose whether the first implementation uses the current VexFlow renderer, an adapter around a dedicated MusicXML renderer, or a hybrid, provided decisions D-09 through D-12 are met and any substantial dependency remains reviewable during planning/execution.
- Choose exact UI placement for import, remove, validation-detail, range-selection, and auto-follow controls, while keeping the app's operational score surface uncluttered.
- Choose test boundaries and fixture files that prove import, validation, canonical mapping, score rendering, practice playback, and browser behavior without brittle full-SVG snapshots.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` — Core value, static-app constraints, preservation of sound/keyboard behavior, and MusicXML direction.
- `.planning/REQUIREMENTS.md` — Phase 5 requirements XML-03, XML-04, XML-05, PRAC-01, PRAC-02, and PRAC-03.
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, dependencies, and promoted backlog scope.
- `.planning/STATE.md` — Current phase state and constraints after Phase 4.
- `CLAUDE.md` — Project operation notes and user-facing app evaluation context.

### Prior Phase Artifacts
- `.planning/phases/02-score-display-modes/02-CONTEXT.md` — Full-score A4 page direction, two-page stand behavior, no key editing, and optional loop defaults.
- `.planning/phases/03-pattern-validation-and-feedback/03-CONTEXT.md` — Strict validation, rejected-source UX, future import library direction, and source-type diagnostics.
- `.planning/phases/04-musicxml-ready-foundation/04-CONTEXT.md` — MusicXML adapter boundary, page fidelity, static hosting, and browser smoke testing direction.
- `.planning/phases/04-musicxml-ready-foundation/04-01-SUMMARY.md` — MusicXML adapter contract implementation state.
- `.planning/phases/04-musicxml-ready-foundation/04-02-SUMMARY.md` — Browser smoke tooling and verification state.

### MusicXML Contract And Source Touchpoints
- `docs/MUSICXML-ADAPTER.md` — Adapter contract for parsing MusicXML as inert data, preserving page semantics, and mapping into canonical events.
- `js/musicXmlAdapterContract.js` — Existing constants and helper for MusicXML source descriptors and required canonical/page-layout fields.
- `js/simplePatternLoader.js` — Existing valid/rejected source registry, diagnostics, selector options, and future registration boundary for `sourceType: musicxml`.
- `js/patternValidator.js` — Structured validation helpers and canonical sequence validation that imported MusicXML output must reuse or extend.
- `js/canonicalPatternResolver.js` — Current canonical sequence shape and note/time helpers that MusicXML adapters must target or evolve.
- `js/staffNotationRenderer.js` — Current VexFlow page renderer, event highlight maps, page scaling, and range-selection integration point.
- `js/player.js` — Existing canonical-event playback scheduler, loop toggle integration, and highlight callback path.
- `index.html` — Static app shell, selector/library UI, import/remove controls target, validation feedback area, playback wiring, and notation container.

### Codebase Maps And Tests
- `.planning/codebase/ARCHITECTURE.md` — Static vanilla JS architecture and app layers.
- `.planning/codebase/INTEGRATIONS.md` — VexFlow CDN, browser-local/static hosting assumptions, and Playwright smoke setup.
- `.planning/codebase/TESTING.md` — Node contract tests and browser smoke patterns.
- `.planning/codebase/CONCERNS.md` — MusicXML input, renderer fragility, and fixed piano/layout risks.
- `tests/musicXmlAdapterContract.test.js` — Existing adapter contract test shape.
- `tests/patternValidator.test.js` — Existing validation diagnostic and canonical invariant coverage.
- `tests/browser-smoke/appBoot.test.js` — Existing browser smoke coverage style.

### External Standards And Renderer Research
- `https://www.w3.org/2021/06/musicxml40/tutorial/structure-of-musicxml-files/` — Official MusicXML file structure.
- `https://www.w3.org/2021/06/musicxml40/tutorial/midi-compatible-part/` — Official MusicXML note, duration, chord, tie, backup, and forward semantics.
- `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/print/` — Official page/system break hints.
- `https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/page-layout/` — Official page-layout defaults.
- `https://www.npmjs.com/package/opensheetmusicdisplay` — Candidate dedicated MusicXML renderer to evaluate only if it supports interactive SVG/cursor/highlight needs and static hosting.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SimplePatternLoader.recordRejectedSource()` already supports rejected source diagnostics and can generalize to `sourceType: musicxml`.
- `validateResolvedSequence()` already checks canonical events and should remain the final safety gate for imported MusicXML playback.
- `createMusicXmlSourceDescriptor()` already normalizes source metadata and diagnostics for future imported sources.
- `drawStaffNotation()` and related page-planning helpers already provide score page containers and highlight maps that can be reused or adapted for MusicXML-rendered pages.
- `Player.play(sequence, { loop })`, `setLoopEnabled()`, and `onNoteHighlight` already provide the base playback/highlight loop path.
- Existing `localStorage` patterns in settings, sound panel, and piano resize handlers are available analogs, but imported file payload size may require evaluating IndexedDB.

### Established Patterns
- Keep the app vanilla ES modules and browser-only.
- Prefer pure modules under `js/` for parsing, adapter, storage, and validation logic.
- Keep user-facing errors concise, with structured diagnostics available for tests and developer detail.
- Use Node `node:test` for pure contracts and Playwright browser smoke for DOM/VexFlow/interaction checks.
- Avoid brittle full SVG snapshots; assert structure, event maps, behavior, and visible state.

### Integration Points
- Add a MusicXML file import control near the score library/selector.
- Add a local imported-library store that registers accepted imports into the same selectable source path and exposes removal.
- Add a MusicXML parser/adapter module that returns either canonical score data or structured diagnostics, with no executable user content.
- Extend validation to MusicXML-supported durations, notes, rests, chords, ties, accidentals, clefs, key signatures, time signatures, backups/forwards, parts, and layout fields.
- Extend score rendering/highlight metadata to expose page/system/measure/event hit targets for `Shift+click` range selection, mint-green range highlighting, auto-scroll, and start-from-measure playback.
- Extend player controls so selected ranges affect start/end behavior and loop boundaries without creating a separate MusicXML-only playback path.

</code_context>

<specifics>
## Specific Ideas

- The desired rendering reference is MuseScore Studio-like full pages: MusicXML defines page content, and the browser scales that page rather than reflowing notes into another page.
- The imported library should feel like a small piece library, not a pattern picker. Imported files are automatically remembered and removable.
- The selected practice range should be visibly mint-green.
- `Shift+click` or a similar modified click should select ranges so plain score clicks remain available for future interactions.
- Future click events and possible note editing should stay possible; avoid renderer choices that flatten notation into static images.

</specifics>

<deferred>
## Deferred Ideas

- Optional lenient MusicXML import mode after strict import is reliable.
- Future note editing or richer click interactions after interactive MusicXML rendering is stable.
- Full arbitrary orchestral playback, repeats/codas/segno interpretation, lyrics, ornaments, and complete engraving parity remain outside Phase 5 unless research identifies a small safe subset needed for the selected fixtures.

</deferred>

---

*Phase: 5-MusicXML Import And Practice UX*
*Context gathered: 2026-05-15T15:10:40+02:00*
