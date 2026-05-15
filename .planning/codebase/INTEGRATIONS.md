# External Integrations

**Analysis Date:** 2026-05-14
**Last Updated:** 2026-05-15 after Phase 04 execution

## APIs & External Services

**CDN Libraries:**
- VexFlow 4.2.2 - loaded from `https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js` in `index.html`.
  - Integration method: classic script tag, exposes global `Vex`.
  - Used by: `js/staffNotationRenderer.js`.
  - Failure mode: notation area shows a retry/loading message if `Vex` is unavailable.
- Google Fonts - Libre Baskerville loaded from `fonts.googleapis.com` in `index.html`.
- Google Material Icons - loaded from `fonts.googleapis.com` in `index.html`.

**External APIs:**
- None.
- No remote backend, no authentication provider, no analytics, and no telemetry.

## Data Storage

**Databases:**
- None.

**File Storage:**
- Static local MP3 sample files under `third-party/piano-mp3/`.
- Sample files are fetched by URL at runtime from the same origin.

**Caching:**
- Browser cache for static assets.
- ES module imports are intentionally cache-busted on every page load by `APP_VERSION = Date.now()` in `index.html`.

## Authentication & Identity

**Auth Provider:**
- None.

**OAuth Integrations:**
- None.

## Monitoring & Observability

**Error Tracking:**
- None.

**Analytics:**
- None.

**Logs:**
- Browser console logs are used heavily in `index.html`, `js/settings.js`, and `js/physicsControlsPanel.js`.
- There is no structured logging or production log collection.

## CI/CD & Deployment

**Hosting:**
- Static hosting. `README.md` links a GitHub Pages preview at `https://lyzux.github.io/InteractivePianoHelper/`.

**CI Pipeline:**
- None detected. There is no `.github/workflows/`.
- Local test commands exist: `npm test` and `npm run test:smoke`.

## Environment Configuration

**Development:**
- No required env vars.
- Serve the repo root over HTTP.
- `start-server.bat` tries Python first, then Node `http-server`.
- Browser smoke tests may set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if Chrome/Chromium is not in a standard path.

**Staging:**
- None defined.

**Production:**
- Static hosting must serve `index.html`, `js/`, `css/`, `patterns/`, and `third-party/piano-mp3/`.
- CDN links must remain reachable unless dependencies are vendored.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

---

*Integration audit: 2026-05-14*
*Updated after adding local browser smoke tooling*
