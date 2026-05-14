# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- JavaScript ES modules - all application logic in `index.html`, `js/*.js`, and `patterns/*.js`.
- HTML - single-page app shell in `index.html`.
- CSS - visual layout and responsive behavior in `css/styles.css`, `css/mobile.css`, plus inline styles in `index.html`.

**Secondary:**
- Windows batch - local server helper in `start-server.bat`.
- Markdown - project documentation in `README.md`, `CLAUDE.md`, `patterns/README.md`, and GSD planning docs.

## Runtime

**Environment:**
- Modern browser with native ES module support.
- Web Audio API for synthesis and sample playback.
- DOM APIs for rendering the 88-key piano, controls, mobile drawer, and notation container.
- Must be served over HTTP; `file://` breaks module imports.

**Package Manager:**
- None. There is no `package.json`, lockfile, bundler, transpiler, or local dependency install.
- Optional serving command in docs: `npx http-server -p 8000`.

## Frameworks

**Core:**
- Vanilla JavaScript ES modules - no framework.
- VexFlow 4.2.2 from CDN in `index.html` - staff notation rendering through global `Vex`.
- Web Audio API - audio graph and scheduled playback in `js/audioEngine.js`.

**Testing:**
- No test framework currently configured.
- No unit, integration, browser smoke, or visual regression tests are present.

**Build/Dev:**
- No build step.
- Runtime cache busting uses `APP_VERSION = Date.now()` in `index.html` and appends `?v=...` to dynamic imports.
- Local HTTP serving via `python -m http.server 8000`, `npx http-server -p 8000`, or `start-server.bat`.

## Key Dependencies

**Critical:**
- VexFlow 4.2.2 CDN - renders two-stave notation in `js/staffNotationRenderer.js`.
- Google Fonts CDN - Libre Baskerville typography loaded in `index.html`.
- Google Material Icons CDN - mobile hamburger and close icons in `index.html`.
- Local MP3 samples - 88-key sample set under `third-party/piano-mp3/`, loaded by `AudioEngine._loadSamples()`.

**Infrastructure:**
- Browser `localStorage` - settings and piano resize persistence in `js/settings.js` and `js/pianoResizeHandler.js`.
- Browser `fetch()` - sample loading in `js/audioEngine.js`.
- Dynamic `import()` - app modules and pattern files load at runtime.

## Configuration

**Environment:**
- No environment variables.
- No secrets.
- User settings persist under `localStorage` key `pianoHelperSettings`.
- Piano height persists under `localStorage` key `pianoHeight`.

**Build:**
- No build configuration files.
- Pattern registry is code configuration in `patterns/index.js`.
- App layout configuration is spread across `index.html`, `css/styles.css`, and `css/mobile.css`.

## Platform Requirements

**Development:**
- Any platform with a modern browser and a simple HTTP server.
- Optional Node/npm only if using `npx http-server`.
- Optional Python only if using `python -m http.server`.

**Production:**
- Static hosting is sufficient, including GitHub Pages.
- CDN availability is required for VexFlow, Google Fonts, and Material Icons unless vendored locally.
- Local sample files under `third-party/piano-mp3/` must be deployed with the app.

---

*Stack analysis: 2026-05-14*
*Update after adding a package manifest, build tooling, test runner, or MusicXML rendering dependency*
