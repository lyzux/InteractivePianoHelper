# Phase 2: Score Display Modes - Context

**Gathered:** 2026-05-15T10:29:21+02:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase turns notation display into a sheet-first experience. The app should render complete score-like material, especially Für Elise in A minor, as full A4-style sheet pages instead of a capped compact preview. Playback and highlighting must continue to consume the canonical event sequence created in Phase 1, but Phase 2 should focus on score display modes, full-score layout, optional loop playback, and removal of key-changing behavior from the current product direction.

</domain>

<decisions>
## Implementation Decisions

### Sheet-First Display Direction
- **D-01:** Always prefer full score preview. The app is evolving beyond simple pattern playback toward complete MusicXML-style sheet music, so the current compact pattern preview concept should not remain the dominant display mode.
- **D-02:** Existing short built-in patterns can still be rendered, but downstream planning should treat them as score content shown on the sheet surface rather than as a separate miniature notation mode.
- **D-03:** The previous roadmap wording about separating compact pattern preview and score display should be interpreted as making the display behavior explicit in code and metadata, not as preserving a user-facing compact/full mode switch.

### A4 Page Layout
- **D-04:** Full score notation should be presented as A4-like pages.
- **D-05:** If there is one page, it should be centered.
- **D-06:** If there are two or more pages, use a page grid: two pages horizontally per row on desktop/wide layouts, then additional pages continue in rows as the user scrolls down.
- **D-07:** The fixed piano keyboard must not obscure the page grid; longer scores should scroll cleanly above it.

### Loop Playback
- **D-08:** Add a loop control for score playback. Use whichever UI control fits the existing app best, such as a checkbox or toggle button.
- **D-09:** Looping is disabled by default.
- **D-10:** When looping is enabled, playback may loop the current complete score/visible score source. Practice-range looping, measure selection, and start-from-measure behavior remain future practice UX work.

### Key Handling And Transposition
- **D-11:** Remove the key change feature entirely from the current product direction. The app should not edit, transpose, or reinterpret musical content as part of Phase 2.
- **D-12:** Native-key pieces such as Für Elise should simply display in their authored/original key. Unsupported-key handling should be solved by removing the unsupported choice rather than by showing an error after the user selects a bad key.
- **D-13:** Future MusicXML files should be loaded and displayed as written. Editing the content or changing keys is out of scope for now and maybe later.

### Folded Todos
- **D-14:** Folded todo slice: `Harden notation playback contract` from `.planning/todos/pending/2026-05-14-harden-notation-playback-contract.md`. Only its Phase 2 display concerns are folded here: remove the hard 8-measure cap, support full score rendering, and keep full-score work bounded away from validation and MusicXML import.

### the agent's Discretion
- Choose the exact implementation boundary for display metadata, provided the user-facing result is sheet-first and not a prominent compact/full preview switch.
- Choose whether the loop control is a checkbox, toggle button, or another locally consistent control.
- Choose the responsive fallback for narrow screens, as long as desktop/wide layouts use the requested centered single page and two-pages-per-row grid.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning And Requirements
- `.planning/PROJECT.md` — Core value, constraints, and explicit direction to preserve sound and keyboard behavior while improving notation trust.
- `.planning/REQUIREMENTS.md` — Phase 2 requirement IDs SYNC-02, SYNC-03, SCORE-01, SCORE-02, and SCORE-03.
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria; interpret compact/full display wording through decisions D-01 through D-03 above.
- `.planning/STATE.md` — Current project state and known residual risks after Phase 1.
- `.planning/todos/pending/2026-05-14-harden-notation-playback-contract.md` — Folded display concern source; validation and MusicXML points remain later-phase context.

### Prior Phase Artifacts
- `.planning/phases/01-canonical-pattern-event-pipeline/01-CONTEXT.md` — Locked Phase 1 decisions about canonical events, playback/display agreement, loop boundaries, and MusicXML readiness.
- `.planning/phases/01-canonical-pattern-event-pipeline/01-VERIFICATION.md` — Confirms canonical event sequence, player, renderer, and event-ID highlight bridge are in place.
- `.planning/phases/01-canonical-pattern-event-pipeline/01-01-SUMMARY.md` — Resolver foundation and canonical event model details.
- `.planning/phases/01-canonical-pattern-event-pipeline/01-02-SUMMARY.md` — Playback and notation consumer integration details.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — Current app composition, notation rendering layer, and data flow.
- `.planning/codebase/STRUCTURE.md` — File locations and where score display, validation, and future MusicXML support likely belong.
- `.planning/codebase/CONCERNS.md` — Long notation cap, Für Elise truncation, unsupported native-key behavior, and fixed-piano layout risks.

### Source Touchpoints
- `index.html` — App composition, controls, key selector, play/stop button, notation container, and event wiring.
- `js/staffNotationRenderer.js` — Current VexFlow renderer, `MAX_DISPLAY_MEASURES` cap, multi-system layout, and event highlight map creation.
- `js/canonicalPatternResolver.js` — Canonical sequence model that full score display and playback should continue to share.
- `js/player.js` — Playback scheduler that already consumes canonical events and will need the new loop control behavior.
- `js/simplePatternLoader.js` — Pattern registry and canonical sequence bridge.
- `patterns/furelise.js` — Primary Phase 2 fixture for native-key score-like full display.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `js/staffNotationRenderer.js`: Existing VexFlow conversion, measure grouping, rest filling, tie drawing, responsive system layout, and event map logic can be reused, but the hard `MAX_DISPLAY_MEASURES = 8` cap must stop controlling full-score rendering.
- `js/canonicalPatternResolver.js`: Provides event IDs, durations, hand payloads, measure positions, and unsupported native-key state. Phase 2 should extend or consume this model instead of inventing another score representation.
- `js/player.js`: Already loops over canonical events. Phase 2 can gate loop behavior with a UI control rather than changing sound generation.
- `index.html`: Existing control bar and notation container are the integration points for removing key selection, adding loop control, and wrapping notation in an A4 page grid.
- `patterns/furelise.js`: Existing long score-like fixture with `nativeKey: 'Am'`, `timeSignature: '3/8'`, right-hand and left-hand arrays, timing, and fingering data.

### Established Patterns
- The app remains vanilla ES modules and static-hosted; avoid introducing a framework or backend for Phase 2.
- VexFlow is still loaded as global `Vex`; keep the browser runtime simple unless planning finds a small static-compatible improvement is necessary.
- Controls are currently plain HTML form controls in `index.html`; loop UI should fit that style unless a cleaner local pattern already exists.
- Phase 1 established canonical event IDs as the bridge between notation and playback highlighting. Phase 2 must preserve that identity through full score pages.

### Integration Points
- Remove or neutralize the key selector in `index.html` and any settings/key-change wiring that no longer fits the product direction.
- Update notation rendering so full score layout can render all measures/pages while staying clear of the fixed bottom piano.
- Ensure the renderer returns event maps across all pages, not only the first capped systems.
- Update Play behavior so unsupported/native-key states cannot occur through the removed key control, and loop behavior is controlled by the new off-by-default loop UI.

</code_context>

<specifics>
## Specific Ideas

- The user wants complete notation presented as A4 sheets.
- A single sheet should be centered.
- Multiple sheets should form a two-column grid on desktop/wide screens, with further pages in additional rows while scrolling down.
- Loop playback should be optional and disabled by default.
- The app should load and display authored musical content as-is. Editing, changing key, or transposing content is not part of the current capability goal.
- The current capability goal is moving toward complete MusicXML files, even though MusicXML import itself is not Phase 2.

</specifics>

<deferred>
## Deferred Ideas

- Practice range UX, including looping selected measures, starting from a selected measure or note, and auto-scroll during playback, remains a future phase/backlog capability.
- MusicXML import, validation, and file structure handling remain future MusicXML phases.
- Pattern data validation and user-facing invalid-pattern diagnostics remain Phase 3.
- Content editing and key changes may be reconsidered later, but are explicitly out of scope now.

</deferred>

---
*Phase: 2-Score Display Modes*
*Context gathered: 2026-05-15T10:29:21+02:00*
