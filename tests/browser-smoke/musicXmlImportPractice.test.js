import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const PROJECT_ROOT = resolve(new URL('../..', import.meta.url).pathname);
const FIXTURE_ROOT = resolve(PROJECT_ROOT, 'tests/fixtures');
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
    '.musicxml': 'application/vnd.recordare.musicxml+xml; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
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

async function resetBrowserStorage(page, origin) {
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        if (!window.indexedDB?.deleteDatabase) return;
        await new Promise(resolveDelete => {
            const request = indexedDB.deleteDatabase('interactive-piano-helper-imported-scores');
            request.onsuccess = () => resolveDelete();
            request.onerror = () => resolveDelete();
            request.onblocked = () => resolveDelete();
        });
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
}

async function waitForApp(page) {
    await page.waitForFunction(() => window.Vex && document.querySelectorAll('#pattern option').length > 0);
    await page.waitForSelector('#musicXmlFileInput');
    await page.waitForSelector('.score-page svg', { timeout: 15000 });
}

async function uploadFixture(page, filename) {
    await page.locator('#musicXmlFileInput').setInputFiles(resolve(FIXTURE_ROOT, filename));
}

async function selectMeasureRange(page, startIndex, endIndex) {
    await page.waitForFunction(requiredCount => (
        document.querySelectorAll('.score-measure-hit-target').length > requiredCount
    ), Math.max(startIndex, endIndex));
    await page.waitForTimeout(200);

    for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.evaluate(() => document.getElementById('clearPracticeRangeBtn')?.click());
        await page.evaluate(index => {
            document.querySelectorAll('.score-measure-hit-target')[index]?.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                shiftKey: true,
                view: window
            }));
        }, startIndex);
        await page.waitForFunction(() => /Choose an end measure/.test(document.getElementById('practiceRangeStatus')?.textContent || ''));
        await page.evaluate(index => {
            document.querySelectorAll('.score-measure-hit-target')[index]?.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                shiftKey: true,
                view: window
            }));
        }, endIndex);
        await page.waitForFunction(() => /Measures .* selected/.test(document.getElementById('practiceRangeStatus')?.textContent || ''));
        await page.waitForTimeout(200);
        if (await page.evaluate(() => Boolean(window.__iphPracticeDebug?.getPlaybackRange?.()))) {
            return;
        }
    }

    assert.fail('selected range did not remain available for playback');
}

async function stopAndAssertCleanup(page) {
    await page.click('#playStopBtn');
    await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Play');
    const cleanupState = await page.evaluate(() => ({
        activePianoKeys: document.querySelectorAll('.key.active').length,
        notationHighlights: document.querySelectorAll('.vf-note-highlight').length,
        rangeStillSelected: /Measures .* selected/.test(document.getElementById('practiceRangeStatus')?.textContent || '')
    }));
    assert.deepEqual(cleanupState, {
        activePianoKeys: 0,
        notationHighlights: 0,
        rangeStillSelected: true
    });
}

async function exerciseSelectedRangePlayback(page, expectedStartMeasure, expectedEndMeasure) {
    const selectedRange = await page.evaluate(() => window.__iphPracticeDebug?.getPlaybackRange?.());
    assert.equal(String(selectedRange?.startMeasureNumber), String(expectedStartMeasure));
    assert.equal(String(selectedRange?.endMeasureNumber), String(expectedEndMeasure));

    await page.check('#loopPlayback');
    await page.click('#playStopBtn');
    await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Stop');
    const playbackState = await page.evaluate(() => window.__iphPracticeDebug?.lastPlaybackStart);
    assert.equal(playbackState.loop, true);
    assert.deepEqual(playbackState.range, selectedRange);

    await page.locator('#vexflow-notation').evaluate(element => {
        element.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 120 }));
        element.scrollTop = 80;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForFunction(() => /Auto-follow paused/.test(document.getElementById('autoFollowStatus')?.textContent || ''));
    await page.click('#resumeAutoFollowBtn');
    await page.waitForFunction(() => !/Auto-follow paused/.test(document.getElementById('autoFollowStatus')?.textContent || ''));

    await stopAndAssertCleanup(page);
}

test('MusicXML import and practice workflow works as a static browser flow', async () => {
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
        await resetBrowserStorage(page, origin);
        await waitForApp(page);

        const defaultLibrary = await page.evaluate(() => Array.from(document.querySelectorAll('#pattern option')).map(option => ({
            label: option.textContent,
            sourceType: option.dataset.sourceType || '',
            value: option.value
        })));
        assert.ok(defaultLibrary.length > 0, 'default score library should not be empty');
        assert.ok(defaultLibrary.some(option => /F[üu]r Elise/i.test(option.label)), 'built-in complete score should be visible by default');
        assert.equal(defaultLibrary.some(option => option.sourceType === 'musicxml'), false);

        await uploadFixture(page, 'unsupported-score.musicxml');
        await page.waitForSelector('#importStatus details');
        const failureState = await page.locator('#importStatus').evaluate(element => ({
            text: element.textContent,
            role: element.getAttribute('role') || '',
            detailsOpen: element.querySelector('details')?.open === true
        }));
        assert.match(failureState.text, /This MusicXML file could not be imported/);
        assert.match(failureState.text, /Show import details/);
        assert.match(failureState.text, /Unsupported MusicXML element "harmony"/);
        assert.equal(failureState.role, 'alert');
        assert.equal(failureState.detailsOpen, false);

        await uploadFixture(page, 'tiny-score.musicxml');
        await page.waitForFunction(() => document.querySelector('#pattern option:checked')?.textContent?.includes('Tiny Fixture Score'));
        await page.waitForSelector('.score-page svg');
        await page.waitForSelector('[data-musicxml-event-id]');

        let importedState = await page.evaluate(() => ({
            status: document.getElementById('importStatus')?.textContent || '',
            selectedLabel: document.querySelector('#pattern option:checked')?.textContent || '',
            selectedSourceType: document.querySelector('#pattern option:checked')?.dataset.sourceType || '',
            removeVisible: !document.getElementById('removeImportedScoreBtn')?.hidden,
            pageCount: document.querySelectorAll('.score-page').length,
            svgCount: document.querySelectorAll('.score-page svg').length,
            eventHooks: document.querySelectorAll('[data-musicxml-event-id]').length,
            measureTargets: document.querySelectorAll('.score-measure-hit-target').length
        }));
        assert.match(importedState.status, /Imported "Tiny Fixture Score"/);
        assert.match(importedState.selectedLabel, /Tiny Fixture Score/);
        assert.equal(importedState.selectedSourceType, 'musicxml');
        assert.equal(importedState.removeVisible, true);
        assert.ok(importedState.pageCount > 0);
        assert.equal(importedState.svgCount, importedState.pageCount);
        assert.ok(importedState.eventHooks > 0);
        assert.ok(importedState.measureTargets >= 2);

        await uploadFixture(page, 'tiny-score.musicxml');
        await page.waitForFunction(() => document.querySelector('#pattern option:checked')?.textContent?.includes('Tiny Fixture Score (2)'));
        const duplicateLabels = await page.evaluate(() => Array.from(document.querySelectorAll('#pattern option'))
            .map(option => option.textContent)
            .filter(label => label.includes('Tiny Fixture Score')));
        assert.deepEqual(duplicateLabels.sort(), ['Tiny Fixture Score', 'Tiny Fixture Score (2)']);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForApp(page);
        await page.waitForFunction(() => Array.from(document.querySelectorAll('#pattern option')).some(option => option.textContent.includes('Tiny Fixture Score (2)')));
        importedState = await page.evaluate(() => ({
            selectedLabel: document.querySelector('#pattern option:checked')?.textContent || '',
            importedOptions: Array.from(document.querySelectorAll('#pattern option'))
                .filter(option => option.dataset.sourceType === 'musicxml')
                .map(option => option.textContent),
            removeVisible: !document.getElementById('removeImportedScoreBtn')?.hidden
        }));
        assert.match(importedState.selectedLabel, /Tiny Fixture Score \(2\)/);
        assert.deepEqual(importedState.importedOptions.sort(), ['Tiny Fixture Score', 'Tiny Fixture Score (2)']);
        assert.equal(importedState.removeVisible, true);
        await page.waitForFunction(() => document.querySelectorAll('.score-measure-hit-target').length === 2);

        await selectMeasureRange(page, 0, 1);
        const importedRangeClassCount = await page.locator('.score-measure-hit-target.range-selected').count();
        assert.equal(importedRangeClassCount, 2);
        await exerciseSelectedRangePlayback(page, 1, 2);

        page.once('dialog', async dialog => {
            assert.match(dialog.message(), /Remove this imported score from this browser/);
            await dialog.accept();
        });
        await page.click('#removeImportedScoreBtn');
        await page.waitForFunction(() => !Array.from(document.querySelectorAll('#pattern option')).some(option => option.textContent.includes('Tiny Fixture Score (2)')));
        const afterDuplicateRemove = await page.evaluate(() => ({
            status: document.getElementById('importStatus')?.textContent || '',
            remainingImported: Array.from(document.querySelectorAll('#pattern option'))
                .filter(option => option.dataset.sourceType === 'musicxml')
                .map(option => option.textContent),
            selectedSourceType: document.querySelector('#pattern option:checked')?.dataset.sourceType || ''
        }));
        assert.match(afterDuplicateRemove.status, /Removed imported score/);
        assert.deepEqual(afterDuplicateRemove.remainingImported, ['Tiny Fixture Score']);
        assert.equal(afterDuplicateRemove.selectedSourceType, 'pattern');

        await page.evaluate(() => {
            const select = document.getElementById('pattern');
            const builtIn = Array.from(select?.options || []).find(option => option.dataset.sourceType !== 'musicxml' && /F[üu]r Elise/i.test(option.textContent));
            if (!select || !builtIn) return;
            select.value = builtIn.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForFunction(() => document.querySelectorAll('.score-measure-hit-target').length >= 4);
        await page.uncheck('#loopPlayback');
        await selectMeasureRange(page, 1, 3);
        await exerciseSelectedRangePlayback(page, 2, 4);

        assert.deepEqual(pageErrors, []);
    } finally {
        await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
});
