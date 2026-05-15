import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const PROJECT_ROOT = resolve(new URL('../..', import.meta.url).pathname);
const HOST = '127.0.0.1';
const OSMD_BUNDLE_PATH = '/node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js';
const USER_MUSESCORE_MXL = '/home/mel/Documents/MuseScore4/Scores/mel_test.mxl';
const CHROME_CANDIDATES = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
].filter(Boolean);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.musicxml': 'application/vnd.recordare.musicxml+xml; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.mxl': 'application/vnd.recordare.musicxml',
    '.txt': 'text/plain; charset=utf-8'
};

function findChromiumExecutable() {
    return CHROME_CANDIDATES.find(candidate => existsSync(candidate)) || null;
}

function resolveStaticPath(requestUrl) {
    const url = new URL(requestUrl, `http://${HOST}`);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const absolutePath = resolve(join(PROJECT_ROOT, normalizedPath));
    if (!absolutePath.startsWith(PROJECT_ROOT)) return null;
    return absolutePath;
}

async function startStaticServer() {
    const server = createServer((request, response) => {
        const url = new URL(request.url || '/', `http://${HOST}`);

        if (url.pathname === '/__osmd-spike.html') {
            response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            response.end(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>OSMD Spike</title></head>
<body>
  <div id="score-root"></div>
  <script src="${OSMD_BUNDLE_PATH}"></script>
</body>
</html>`);
            return;
        }

        const filePath = resolveStaticPath(request.url || '/');
        if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
            response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
            response.end('Not found');
            return;
        }

        response.writeHead(200, {
            'content-type': MIME_TYPES[extname(filePath)] || 'application/octet-stream'
        });
        createReadStream(filePath).pipe(response);
    });

    await new Promise(resolveListen => server.listen(0, HOST, resolveListen));
    const address = server.address();
    return {
        server,
        origin: `http://${HOST}:${address.port}`
    };
}

async function withOsmdPage(assertions) {
    const executablePath = findChromiumExecutable();
    assert.ok(executablePath, 'A Chromium-compatible browser executable is required for smoke tests.');

    const { server, origin } = await startStaticServer();
    const browser = await chromium.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    try {
        await page.goto(`${origin}/__osmd-spike.html`, { waitUntil: 'load' });
        await page.waitForFunction(() => Boolean(window.opensheetmusicdisplay?.OpenSheetMusicDisplay));
        await assertions(page, origin);
        assert.deepEqual(pageErrors, []);
    } finally {
        await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
}

function buildTwoPageFixtureXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>OSMD Two Page Spike</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
    <measure number="2">
      <print new-page="yes"/>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

async function renderOsmdScore(page, xmlText, targetId = 'score-root') {
    return page.evaluate(async ({ xmlText, targetId }) => {
        const root = document.getElementById(targetId);
        root.replaceChildren();

        const osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(root, {
            backend: 'svg',
            autoResize: false,
            drawTitle: true,
            pageFormat: 'A4_P',
            newPageFromXML: true
        });

        const startedAt = performance.now();
        await osmd.load(xmlText);
        osmd.render();
        const renderMilliseconds = performance.now() - startedAt;

        const pages = Array.from(root.querySelectorAll('[id^="osmdCanvasPage"]'));
        const svgs = Array.from(root.querySelectorAll('svg'));
        const measures = Array.from(root.querySelectorAll('g.vf-measure'));
        const notes = Array.from(root.querySelectorAll('g.vf-stavenote'));

        measures.forEach((measure, index) => {
            measure.dataset.osmdMeasureIndex = String(index);
            measure.setAttribute('role', 'button');
            measure.tabIndex = 0;
        });

        notes.forEach((note, index) => {
            note.dataset.osmdEventId = `osmd-event-${index + 1}`;
            note.setAttribute('role', 'button');
            note.tabIndex = 0;
        });

        let clickedMeasureIndex = null;
        let clickedNoteEventId = null;
        measures[0]?.addEventListener('click', event => {
            clickedMeasureIndex = event.currentTarget.dataset.osmdMeasureIndex;
        });
        notes[0]?.addEventListener('click', event => {
            clickedNoteEventId = event.currentTarget.dataset.osmdEventId;
        });
        measures[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        notes[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        const highlightTarget = notes[0];
        if (highlightTarget) {
            highlightTarget.classList.add('iph-osmd-highlight');
            for (const element of highlightTarget.querySelectorAll('path, rect, text')) {
                element.setAttribute('fill', '#2fd7a3');
                element.setAttribute('stroke', '#2fd7a3');
            }
        }

        return {
            osmdVersion: window.opensheetmusicdisplay.version || '1.9.9',
            pageCount: pages.length,
            svgCount: svgs.length,
            musicPages: osmd.GraphicSheet?.musicPages?.length || 0,
            measureCount: measures.length,
            noteCount: notes.length,
            clickedMeasureIndex,
            clickedNoteEventId,
            highlightedNotes: root.querySelectorAll('g.vf-stavenote.iph-osmd-highlight').length,
            mintHighlightShapes: root.querySelectorAll('[fill="#2fd7a3"], [stroke="#2fd7a3"]').length,
            hasImageFallback: Boolean(root.querySelector('canvas, img:not([id^="cursorImg"])')),
            cursorAvailable: Boolean(osmd.cursor),
            renderMilliseconds
        };
    }, { xmlText, targetId });
}

test('OSMD renders pinned multi-page SVG and exposes interactive DOM hooks', async () => {
    await withOsmdPage(async page => {
        const state = await renderOsmdScore(page, buildTwoPageFixtureXml());

        assert.equal(state.pageCount, 2, 'XML page breaks should create separate page containers');
        assert.equal(state.svgCount, state.pageCount, 'each OSMD page should render as SVG');
        assert.equal(state.musicPages, 2, 'OSMD graphical model should expose multiple pages');
        assert.ok(state.measureCount >= 2, 'OSMD should expose measure groups');
        assert.ok(state.noteCount >= 2, 'OSMD should expose note groups');
        assert.equal(state.clickedMeasureIndex, '0', 'measure DOM hook should receive click events');
        assert.equal(state.clickedNoteEventId, 'osmd-event-1', 'note DOM hook should receive click events');
        assert.equal(state.highlightedNotes, 1, 'note highlight class should be applied without rerendering');
        assert.ok(state.mintHighlightShapes > 0, 'note highlight should mutate SVG color attributes');
        assert.equal(state.hasImageFallback, false, 'professional renderer gate must not use static image output');
        assert.equal(state.cursorAvailable, true, 'OSMD cursor should be available for playback mapping research');
        assert.ok(state.renderMilliseconds > 0);
    });
});

test('OSMD can render the local MuseScore MXL sample when it is present', {
    skip: !existsSync(USER_MUSESCORE_MXL)
}, async () => {
    const mxlBytes = Array.from(readFileSync(USER_MUSESCORE_MXL));

    await withOsmdPage(async (page, origin) => {
        const state = await page.evaluate(async ({ mxlBytes, origin }) => {
            const { readMusicXmlFile } = await import(`${origin}/js/musicXmlFileReader.js`);
            const file = new File([new Uint8Array(mxlBytes)], 'mel_test.mxl', {
                type: 'application/vnd.recordare.musicxml'
            });
            const readResult = await readMusicXmlFile(file);
            if (!readResult.ok) {
                return {
                    readOk: false,
                    diagnostics: readResult.diagnostics
                };
            }

            const root = document.getElementById('score-root');
            root.replaceChildren();
            const osmd = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(root, {
                backend: 'svg',
                autoResize: false,
                drawTitle: true,
                pageFormat: 'A4_P',
                newSystemFromXML: true,
                newPageFromXML: true
            });
            await osmd.load(readResult.xmlText);
            osmd.render();

            return {
                readOk: true,
                extractedPath: readResult.extractedPath,
                pageCount: root.querySelectorAll('[id^="osmdCanvasPage"]').length,
                svgCount: root.querySelectorAll('svg').length,
                measureCount: root.querySelectorAll('g.vf-measure').length,
                noteCount: root.querySelectorAll('g.vf-stavenote').length,
                titleRendered: /Confessions in the Moonlight/i.test(root.textContent || ''),
                hasImageFallback: Boolean(root.querySelector('canvas, img:not([id^="cursorImg"])'))
            };
        }, { mxlBytes, origin });

        assert.equal(state.readOk, true, JSON.stringify(state.diagnostics || []));
        assert.ok(state.extractedPath, 'MXL reader should expose the extracted MusicXML path');
        assert.ok(state.pageCount > 0, 'MuseScore sample should render at least one OSMD page');
        assert.equal(state.svgCount, state.pageCount);
        assert.ok(state.measureCount > 0, 'MuseScore sample should expose measure groups');
        assert.ok(state.noteCount > 0, 'MuseScore sample should expose note groups');
        assert.equal(state.titleRendered, true, 'MuseScore title should be rendered by OSMD');
        assert.equal(state.hasImageFallback, false);
    });
});
