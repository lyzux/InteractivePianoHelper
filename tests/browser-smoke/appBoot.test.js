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

test('static app boots, renders notation, and cleans playback highlights', async () => {
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
        await page.waitForSelector('#vexflow-notation svg', { timeout: 15000 });
        await page.waitForSelector('.score-page', { timeout: 15000 });

        const optionCount = await page.locator('#pattern option').count();
        const scorePageCount = await page.locator('.score-page').count();
        const validationState = await page.locator('#validationStatus').evaluate(element => ({
            hidden: element.hidden,
            className: element.className,
            text: element.textContent
        }));

        assert.ok(optionCount > 0, 'pattern selector should contain playable options');
        assert.ok(scorePageCount > 0, 'notation should render at least one score page');
        assert.equal(validationState.className.includes('validation-status-error'), false, validationState.text);

        await page.click('#playStopBtn');
        await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Stop');
        await page.click('#playStopBtn');
        await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Play');

        const cleanupState = await page.evaluate(() => ({
            activePianoKeys: document.querySelectorAll('.key.active').length,
            notationHighlights: document.querySelectorAll('.vf-note-highlight').length
        }));

        assert.deepEqual(cleanupState, {
            activePianoKeys: 0,
            notationHighlights: 0
        });
        assert.deepEqual(pageErrors, []);
    } finally {
        await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
});
