# Codebase Concerns

**Analysis Date:** 2026-05-14

## Tech Debt

**Playback and notation resolve patterns separately:**
- Issue: `js/player.js` and `js/simplePatternLoader.js` duplicate transposition and note resolution logic.
- Why: playback and notation evolved as separate consumers of the pattern format.
- Impact: visible notation can drift from what playback schedules.
- Fix approach: introduce a shared canonical sequence/score resolver consumed by both playback and notation.

**Notation renderer expands short loops independently:**
- Issue: `js/staffNotationRenderer.js` uses `expandPattern()` to fill measures for display, while `js/player.js` loops the raw note arrays.
- Why: renderer tries to make a complete-looking measure from short accompaniment cycles.
- Impact: `patterns/lombardisch.js` displays 8 events in 4/4 while playback loops the 4 source notes.
- Fix approach: make display mode explicit: source-cycle preview versus measure expansion, and ensure playback uses the same canonical event stream as the visible mode.

**Long notation is capped:**
- Issue: `MAX_DISPLAY_MEASURES = 8` in `js/staffNotationRenderer.js`.
- Why: prevents overwhelming custom multi-line output.
- Impact: score-like material such as `patterns/furelise.js` is cut off.
- Fix approach: replace hard cap with `loop-preview` and `score` modes; allow full vertical score display for pieces.

**Pattern format is executable JS:**
- Issue: pattern files are functions and arbitrary module code rather than validated data.
- Why: simple to author and transpose from C source patterns.
- Impact: harder validation, harder import from notation tools, and harder migration to MusicXML.
- Fix approach: add `PatternValidator` now; later add MusicXML and/or strict pattern JSON adapters into a canonical internal model.

**Inline app composition is large:**
- Issue: `index.html` contains substantial boot logic, fallback logic, event handlers, and styles.
- Why: no build step and single-page simplicity.
- Impact: app wiring is harder to test and reason about.
- Fix approach: move event/controller logic into `js/app.js` or similar once higher-priority notation/data issues are stable.

## Known Bugs

**Für Elise only shows the first part of the available excerpt:**
- Symptoms: selecting `patterns/furelise.js` in A minor renders only the first few systems.
- Trigger: long piece-like patterns exceed 8 measures.
- Workaround: none in UI.
- Root cause: `MAX_DISPLAY_MEASURES` cap.

**Lombard rhythm display/playback mismatch:**
- Symptoms: notation shows 8 visible note events while playback cycles 4 source notes.
- Trigger: short source cycle shorter than 4/4 measure, specifically `patterns/lombardisch.js`.
- Workaround: mentally treat notation as a measure expansion.
- Root cause: renderer expansion is not shared with playback.

**Unsupported native keys can fail unclearly:**
- Symptoms: native-key pattern functions return `null` for unsupported keys; renderer can show empty staves or minimal output.
- Trigger: selecting a non-native key for `patterns/furelise.js`.
- Workaround: select A minor.
- Root cause: missing explicit validation/user-facing unsupported-key state.

## Security Considerations

**No sensitive backend surface:**
- Risk: low; app is static and has no credentials.
- Current mitigation: no auth, no server, no API keys.
- Recommendations: keep imported MusicXML local-only unless adding upload/backend features.

**CDN dependency trust:**
- Risk: CDN compromise or network failure can break notation/icons/fonts.
- Current mitigation: none.
- Recommendations: consider vendoring VexFlow if reliability matters; use subresource integrity if keeping CDN.

**Executable pattern modules:**
- Risk: any added pattern file runs arbitrary JavaScript in the page.
- Current mitigation: pattern files are local repo-controlled.
- Recommendations: prefer validated data for user-imported content; never execute arbitrary uploaded pattern JS.

## Performance Bottlenecks

**Sample loading:**
- Problem: `AudioEngine._loadSamples()` fetches and decodes many MP3 files in parallel.
- Measurement: no measurement available.
- Cause: 88-key sample set loads when audio context initializes.
- Improvement path: lazy-load only needed octaves/notes, or preload progressively.

**Notation rendering:**
- Problem: custom VexFlow layout may become slow or cluttered for complete scores.
- Measurement: no measurement available.
- Cause: all systems are rendered in one SVG; long scores currently capped instead.
- Improvement path: score mode with paging/virtualization or a MusicXML-oriented renderer.

**Room reverb generation:**
- Problem: `updateReverb()` generates impulse buffers.
- Current mitigation: room size slider is debounced in `js/physicsControlsPanel.js`.
- Improvement path: cache impulses by room size buckets if needed.

## Fragile Areas

**Notation renderer:**
- Why fragile: handles durations, rests, dots, ties, systems, clefs, and highlight maps in one custom module.
- Common failures: invalid VexFlow duration, missing dots, ties skipped across systems, overflowing/capped output.
- Safe modification: add fixtures before refactoring; test with Lombard, Für Elise, chords, rests, dotted rhythms, and ties.
- Test coverage: none.

**Playback scheduler/highlighting:**
- Why fragile: audio is scheduled in Web Audio time while visual highlights use timers.
- Common failures: ghost highlights, mismatch after tempo/key/pattern changes, modulo index issues.
- Safe modification: preserve `_visualTimeouts` cleanup and verify stop/change flows.
- Test coverage: none.

**Pattern loader dynamic imports:**
- Why fragile: failures are swallowed silently.
- Common failures: missing pattern file or export typo causes a pattern to disappear without clear diagnostics.
- Safe modification: log import errors with pattern ID and file path; validate loaded pattern objects.
- Test coverage: none.

**Mobile layout with fixed piano:**
- Why fragile: piano is fixed to bottom while notation/content scroll above it.
- Common failures: content hidden behind keyboard, cramped notation, resize override conflicts with mobile CSS.
- Safe modification: verify desktop and mobile screenshots after layout changes.
- Test coverage: none.

## Scaling Limits

**Static no-build architecture:**
- Current capacity: good for small app and simple modules.
- Limit: dependency management, tests, code splitting, and MusicXML renderer integration become awkward without tooling.
- Symptoms at limit: large inline scripts, hard-to-test modules, CDN/version drift.
- Scaling path: introduce minimal `package.json` and test tooling only when needed.

**Pattern manifest:**
- Current capacity: works for 20-ish local patterns.
- Limit: manual manifest updates and executable pattern modules do not scale to user imports.
- Scaling path: separate built-in patterns from imported MusicXML/data files.

## Dependencies at Risk

**VexFlow CDN global:**
- Risk: external availability and global API assumptions.
- Impact: staff notation fails if CDN is unavailable or API changes.
- Migration plan: pin/vendored asset, or evaluate OpenSheetMusicDisplay/MusicXML renderer for full-score work.

**Google Fonts/Material Icons CDN:**
- Risk: UI typography/icons degrade offline.
- Impact: non-critical visual degradation.
- Migration plan: vendor icons or replace with inline/local assets if offline support matters.

## Missing Critical Features

**Canonical score/event model:**
- Problem: playback and notation do not share one model.
- Current workaround: duplicated resolver logic and renderer expansion.
- Blocks: reliable MusicXML support, score navigation, exact notation highlighting, robust validation.
- Implementation complexity: medium-high.

**Pattern validation:**
- Problem: invalid pattern data is not systematically detected.
- Current workaround: runtime behavior and console errors.
- Blocks: trust in imported or longer score material.
- Implementation complexity: medium.

**MusicXML input:**
- Problem: complete sheet music cannot be imported from standard notation tools.
- Current workaround: hand-coded JS arrays such as `patterns/furelise.js`.
- Blocks: robust full-score workflows.
- Implementation complexity: high.

## Test Coverage Gaps

**All application behavior:**
- What's not tested: boot, pattern imports, playback scheduling, notation rendering, keyboard interaction, mobile drawer, settings persistence.
- Risk: regressions are likely during notation/model refactors.
- Priority: high before MusicXML or canonical score model work.
- Difficulty to test: moderate because Web Audio, VexFlow, DOM, and timers need browser-aware tooling.

---

*Concerns audit: 2026-05-14*
*Update as notation/model issues are fixed or new test coverage is added*
