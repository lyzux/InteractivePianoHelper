# Technology Stack

**Analysis Date:** 2026-05-14
**Last Updated:** 2026-05-15 after Phase 04 execution

> Current note: the app still has no build step or framework, but npm is now used for automated tests and Playwright browser smoke tooling.

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
- npm is used for test tooling only.
- `package.json` and `package-lock.json` exist.
- There is no bundler, transpiler, or build step.

## Frameworks

**Core:**
- Vanilla JavaScript ES modules - no framework.
- VexFlow 4.2.2 from CDN in `index.html` - staff notation rendering through global `Vex`.
- Web Audio API - audio graph and scheduled playback in `js/audioEngine.js`.

**Testing:**
- Node's built-in `node:test` runner for contract/unit tests.
- Playwright for browser smoke coverage.
- No visual snapshot framework.

**Build/Dev:**
- No build step.
- Runtime cache busting uses `APP_VERSION = Date.now()` in `index.html` and appends `?v=...` to dynamic imports.
- Local HTTP serving via `python -m http.server 8000`, `npx http-server -p 8000`, or `start-server.bat`.
- Test commands: `npm test` and `npm run test:smoke`.

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
- Playwright 1.60.0 - dev-only browser smoke automation; installed package license is Apache-2.0.

## Configuration

**Environment:**
- No required environment variables for normal app use.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point smoke tests at a Chromium-compatible executable.
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
- Node/npm required for automated tests.
- Optional Node/npm only if using `npx http-server` for serving without Python.
- Optional Python only if using `python -m http.server`.

**Production:**
- Static hosting is sufficient, including GitHub Pages.
- CDN availability is required for VexFlow, Google Fonts, and Material Icons unless vendored locally.
- Local sample files under `third-party/piano-mp3/` must be deployed with the app.

---

*Stack analysis: 2026-05-14*
*Updated after adding a package manifest, test runner, and browser smoke tooling*
