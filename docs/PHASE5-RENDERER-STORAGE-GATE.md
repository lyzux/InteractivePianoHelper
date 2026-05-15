# Phase 5 Renderer And Storage Gate

## Decision

Selected renderer path: **vexflow-adapter**.

The current VexFlow page renderer remains the Phase 5 rendering base because it already runs as static browser code, emits SVG pages, uses the app-owned canonical event sequence for playback highlights, and preserves the existing `.score-sheet-view`, `.score-page-grid`, and `.score-page` sheet semantics. OpenSheetMusicDisplay remains a possible future spike, but this gate does not add it because the current adapter can satisfy the immediate interactive hooks without a new dependency or build path.

Imported MusicXML rendering must enter production through `renderMusicXmlScore` in `js/musicXmlScoreRenderer.js`. Import UI plans should not call `drawStaffNotation()` directly.

## Gate Matrix

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Static hosting | PASS | Uses native ES modules, VexFlow CDN already present in `index.html`, and no backend or build step. |
| SVG output | PASS | Browser gate requires `.score-page svg` and rejects static image or canvas fallbacks. |
| Page scaling | PASS | Existing score grid exposes `--score-scale` and scales A4 page content without reflowing measures. |
| Two-page desktop / one-page mobile layout | PASS | Existing `.score-page-grid` two-column desktop and mobile CSS one-column behavior remain the layout contract. |
| Click hit targets | FAIL until implementation | Browser gate requires rendered measure DOM hooks with click events. |
| Playback highlight hooks | FAIL until implementation | Browser gate requires event DOM hooks that accept `vf-note-highlight`. |
| Auto-follow metadata | FAIL until implementation | Renderer facade must return page and measure metadata for later system/page following. |
| Dependency footprint | PASS | No new runtime dependency and no build step. |

## Non-Negotiables

- Static image rendering is not accepted.
- MusicXML payloads are inert text/data only.
- The renderer facade must return `eventMap`, `measureMap`, `sequence`, and `pages`.
- Page content may scale inside the viewport but must not reflow into unrelated page/system layouts.
