# Phase 04 Pattern Map: MusicXML-Ready Foundation

**Date:** 2026-05-15
**Status:** Planning-ready

## Existing Patterns To Reuse

| New/Changed Area | Existing Analog | Pattern To Follow |
| --- | --- | --- |
| MusicXML adapter contract module | `js/patternValidator.js`, `js/canonicalPatternResolver.js` | Pure ES module, named exports, no DOM, no network, no audio side effects. |
| Source type and diagnostics | `js/patternValidator.js`, `js/simplePatternLoader.js` | Preserve `sourceId`, `sourceType`, severity, code, path, and message structure. |
| Canonical score target | `js/canonicalPatternResolver.js` | Future parser output must become canonical events with IDs, start beats, duration, hand payloads, rests, chords, time signatures, and metadata. |
| Sheet fidelity contract | `js/staffNotationRenderer.js`, Phase 02 context | Treat pages as pages; scale page content inside the page viewport rather than reflowing music across arbitrary responsive space. |
| Contract tests | `tests/patternValidator.test.js`, `tests/scoreDisplayContract.test.js` | Use `node:test` and stable data assertions for pure model contracts. |
| Browser smoke | `index.html`, existing static app boot path | Keep a separate command because DOM/VexFlow behavior requires a real browser. |
| Documentation | `README.md`, `.planning/phases/*/*-CONTEXT.md` | Implementation-facing, traceable to requirements and explicit about deferred work. |

## Target Files

### Plan 04-01

- `docs/MUSICXML-ADAPTER.md`
- `js/musicXmlAdapterContract.js`
- `tests/musicXmlAdapterContract.test.js`
- `README.md`

### Plan 04-02

- `package.json`
- `tests/browser-smoke/appBoot.test.js`
- `README.md`
- `.gitignore` only if browser smoke artifacts are produced locally

## Architecture Constraints

- Keep the application static and browser-only.
- Do not add a MusicXML parser, file picker, imported-library persistence, removal UI, or renderer replacement in Phase 04.
- Do not change sound generation, piano keyboard behavior, key editing removal, loop semantics, or built-in pattern playback.
- Do not register untrusted MusicXML as executable JavaScript.
- Do not weaken current validation to accommodate future MusicXML; adapt MusicXML into the validated canonical model.

## Test Strategy Pattern

Use three levels of validation:

1. Pure contract tests for adapter constants and required canonical output shape.
2. Existing unit tests for current pattern validation, resolution, score display contracts, and feedback.
3. Browser smoke tests for the real static app boot/render/play/stop path.

`npm test` should remain fast and Node-only. Browser smoke should be separate, likely `npm run test:smoke`, because it requires a browser dependency and may need an install/download step.
