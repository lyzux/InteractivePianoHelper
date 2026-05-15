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
        await page.waitForSelector('.score-measure-hit-target', { timeout: 15000 });
        await assertions(page, origin);
        assert.deepEqual(pageErrors, []);
    } finally {
        await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
}

test('practice range controls support Shift selection, range mode, persistence, and clear', async () => {
    await withAppPage(async page => {
        await page.locator('.score-measure-hit-target').nth(0).click();
        assert.equal(await page.locator('#practiceRangeStatus').textContent(), 'No range selected');

        await page.locator('.score-measure-hit-target').nth(2).click({ modifiers: ['Shift'] });
        await page.locator('.score-measure-hit-target').nth(4).click({ modifiers: ['Shift'] });
        await page.waitForFunction(() => /Measures .* selected/.test(document.getElementById('practiceRangeStatus')?.textContent || ''));

        let rangeState = await page.evaluate(() => ({
            status: document.getElementById('practiceRangeStatus')?.textContent || '',
            clearHidden: document.getElementById('clearPracticeRangeBtn')?.hidden === true,
            selected: document.querySelectorAll('.score-measure-hit-target.range-selected').length,
            boundary: document.querySelectorAll('.score-measure-hit-target.range-boundary').length,
            accent: getComputedStyle(document.documentElement).getPropertyValue('--range-accent').trim()
        }));
        assert.match(rangeState.status, /Measures .* selected/);
        assert.equal(rangeState.clearHidden, false);
        assert.ok(rangeState.selected >= 3, 'selected range should mark multiple measures');
        assert.equal(rangeState.boundary, 2);
        assert.equal(rangeState.accent, '#6ee7b7');

        await page.click('#playStopBtn');
        await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Stop');
        await page.click('#playStopBtn');
        await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Play');
        assert.match(await page.locator('#practiceRangeStatus').textContent(), /Measures .* selected/);

        await page.click('#clearPracticeRangeBtn');
        await page.waitForFunction(() => document.getElementById('practiceRangeStatus')?.textContent?.trim() === 'No range selected');
        assert.equal(await page.locator('.score-measure-hit-target.range-selected').count(), 0);

        await page.click('#practiceRangeModeBtn');
        await page.locator('.score-measure-hit-target').nth(1).click();
        await page.locator('.score-measure-hit-target').nth(3).click();
        await page.waitForFunction(() => /Measures .* selected/.test(document.getElementById('practiceRangeStatus')?.textContent || ''));

        rangeState = await page.evaluate(() => ({
            modePressed: document.getElementById('practiceRangeModeBtn')?.getAttribute('aria-pressed'),
            status: document.getElementById('practiceRangeStatus')?.textContent || ''
        }));
        assert.equal(rangeState.modePressed, 'false');
        assert.match(rangeState.status, /Measures .* selected/);
    });
});

test('selected ranges wire into playback and auto-follow pauses and resumes', async () => {
    await withAppPage(async page => {
        await page.locator('.score-measure-hit-target').nth(1).click({ modifiers: ['Shift'] });
        await page.locator('.score-measure-hit-target').nth(2).click({ modifiers: ['Shift'] });
        await page.waitForFunction(() => /Measures .* selected/.test(document.getElementById('practiceRangeStatus')?.textContent || ''));

        const selectedRange = await page.evaluate(() => window.__iphPracticeDebug?.getPlaybackRange?.());
        assert.ok(selectedRange, 'selected range should expose a playback range');
        assert.equal(String(selectedRange.startMeasureNumber), '2');
        assert.equal(String(selectedRange.endMeasureNumber), '3');

        await page.check('#loopPlayback');
        await page.click('#playStopBtn');
        await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Stop');
        const playbackState = await page.evaluate(() => window.__iphPracticeDebug?.lastPlaybackStart);
        assert.equal(playbackState.loop, true);
        assert.deepEqual(playbackState.range, selectedRange);

        await page.locator('#vexflow-notation').evaluate(element => {
            element.scrollTop = 60;
            element.dispatchEvent(new Event('scroll', { bubbles: true }));
        });
        await page.waitForFunction(() => /Auto-follow paused/.test(document.getElementById('autoFollowStatus')?.textContent || ''));

        await page.click('#resumeAutoFollowBtn');
        await page.waitForFunction(() => !/Auto-follow paused/.test(document.getElementById('autoFollowStatus')?.textContent || ''));

        await page.click('#playStopBtn');
        await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Play');
        assert.match(await page.locator('#practiceRangeStatus').textContent(), /Measures .* selected/);
        assert.match(await page.locator('#loopPlaybackHelp').textContent(), /Loop plays the selected range when one is selected/);
    });
});
