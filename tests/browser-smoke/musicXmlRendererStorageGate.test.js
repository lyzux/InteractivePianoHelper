import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const PROJECT_ROOT = resolve(new URL('../..', import.meta.url).pathname);
const HOST = '127.0.0.1';
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
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
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

async function withAppPage(assertions) {
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
        await page.goto(origin, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.Vex && document.querySelectorAll('#pattern option').length > 0);
        await page.waitForSelector('.score-page svg', { timeout: 15000 });
        await assertions(page, origin);
        assert.deepEqual(pageErrors, []);
    } finally {
        await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
}

test('vexflow-adapter renderer exposes interactive score page hooks', async () => {
    await withAppPage(async page => {
        const rendererState = await page.evaluate(() => {
            const sheetView = document.querySelector('.score-sheet-view');
            const pageGrid = document.querySelector('.score-page-grid');
            const pages = Array.from(document.querySelectorAll('.score-page'));
            const measures = Array.from(document.querySelectorAll('[data-musicxml-measure]'));
            const eventTargets = Array.from(document.querySelectorAll('[data-musicxml-event-id]'));
            const firstMeasure = measures[0];
            let clickedMeasure = null;

            if (firstMeasure) {
                firstMeasure.addEventListener('click', event => {
                    clickedMeasure = {
                        page: event.currentTarget.dataset.page,
                        measureIndex: event.currentTarget.dataset.measureIndex,
                        measureNumber: event.currentTarget.dataset.measureNumber
                    };
                });
                firstMeasure.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
            }

            if (eventTargets[0]) eventTargets[0].classList.add('vf-note-highlight');

            return {
                sheetView: Boolean(sheetView),
                pageGrid: Boolean(pageGrid),
                pageCount: pages.length,
                svgCount: document.querySelectorAll('.score-page svg').length,
                pageScale: pageGrid?.style.getPropertyValue('--score-scale') || '',
                measureCount: measures.length,
                firstMeasureRole: firstMeasure?.getAttribute('role') || '',
                clickedMeasure,
                eventTargetCount: eventTargets.length,
                highlightedEventHooks: document.querySelectorAll('[data-musicxml-event-id].vf-note-highlight').length,
                hasImageFallback: Boolean(document.querySelector('.score-page img, .score-page canvas'))
            };
        });

        assert.equal(rendererState.sheetView, true);
        assert.equal(rendererState.pageGrid, true);
        assert.ok(rendererState.pageCount > 0, 'score pages should render');
        assert.equal(rendererState.svgCount, rendererState.pageCount, 'each score page should contain SVG output');
        assert.notEqual(rendererState.pageScale, '', 'score page grid should expose a scale value');
        assert.ok(rendererState.measureCount > 0, 'renderer should expose measure hit targets');
        assert.equal(rendererState.firstMeasureRole, 'button');
        assert.ok(rendererState.clickedMeasure, 'rendered measure should receive click events');
        assert.ok(rendererState.eventTargetCount > 0, 'renderer should expose event highlight targets');
        assert.ok(rendererState.highlightedEventHooks > 0, 'event highlight hook should accept vf-note-highlight');
        assert.equal(rendererState.hasImageFallback, false, 'renderer gate must not use static image output');
    });
});

test('imported score store saves lists retrieves and deletes MusicXML records', async () => {
    await withAppPage(async page => {
        const storageState = await page.evaluate(async () => {
            const {
                deleteImportedScore,
                getImportedScore,
                listImportedScores,
                saveImportedScore
            } = await import('./js/importedScoreStore.js');

            const storeOptions = { databaseName: 'iph-smoke-imported-scores' };
            await deleteImportedScore('gate-score-1', storeOptions);

            const saveResult = await saveImportedScore({
                id: 'gate-score-1',
                title: 'Gate Score',
                filename: 'gate-score.musicxml',
                createdAt: '2026-05-15T14:00:00.000Z',
                xmlText: '<score-partwise version="4.0"></score-partwise>',
                descriptor: {
                    sourceId: 'gate-score-1',
                    sourceType: 'musicxml',
                    title: 'Gate Score'
                },
                diagnostics: []
            }, storeOptions);

            const listResult = await listImportedScores(storeOptions);
            const getResult = await getImportedScore('gate-score-1', storeOptions);
            const deleteResult = await deleteImportedScore('gate-score-1', storeOptions);
            const afterDeleteResult = await getImportedScore('gate-score-1', storeOptions);
            const failureResult = await saveImportedScore({
                id: 'will-fail',
                title: 'Will Fail',
                filename: 'will-fail.musicxml',
                xmlText: '<score-partwise />'
            }, { indexedDB: null });

            return {
                saveResult,
                listCount: listResult.records.length,
                listedRecord: listResult.records.find(record => record.id === 'gate-score-1'),
                loadedRecord: getResult.record,
                deleteResult,
                afterDeleteResult,
                failureResult
            };
        });

        assert.equal(storageState.saveResult.ok, true);
        assert.equal(storageState.listCount, 1);
        assert.equal(storageState.listedRecord.title, 'Gate Score');
        assert.equal(storageState.listedRecord.xmlText, undefined, 'list should omit XML payload text');
        assert.equal(storageState.loadedRecord.xmlText, '<score-partwise version="4.0"></score-partwise>');
        assert.equal(storageState.loadedRecord.descriptor.sourceType, 'musicxml');
        assert.equal(storageState.deleteResult.ok, true);
        assert.equal(storageState.afterDeleteResult.ok, false);
        assert.equal(storageState.afterDeleteResult.error.code, 'NOT_FOUND');
        assert.equal(storageState.failureResult.ok, false);
        assert.equal(storageState.failureResult.error.code, 'STORAGE_UNAVAILABLE');
        assert.match(storageState.failureResult.error.message, /storage/i);
    });
});
