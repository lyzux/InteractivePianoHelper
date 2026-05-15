import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { deflateRawSync } from 'node:zlib';
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
    '.mxl': 'application/vnd.recordare.musicxml',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

const VALID_SCORE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Smoke Import</work-title></work>
  <identification><creator type="composer">Browser Fixture</creator></identification>
  <defaults>
    <page-layout>
      <page-height>1683</page-height>
      <page-width>1190</page-width>
      <page-margins type="both">
        <left-margin>56</left-margin>
        <right-margin>56</right-margin>
        <top-margin>48</top-margin>
        <bottom-margin>48</bottom-margin>
      </page-margins>
    </page-layout>
  </defaults>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <print new-page="yes" page-number="1"/>
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
      <note>
        <pitch><step>G</step><octave>3</octave></pitch>
        <duration>1</duration>
        <voice>2</voice>
        <type>quarter</type>
        <staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;

function createMxlBuffer(xmlText) {
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>`;
    const files = [
        ['META-INF/container.xml', containerXml],
        ['score.xml', xmlText]
    ];
    let offset = 0;
    const locals = [];
    const entries = files.map(([name, text]) => {
        const nameBytes = Buffer.from(name, 'utf8');
        const source = Buffer.from(text, 'utf8');
        const compressed = deflateRawSync(source);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(8, 8);
        local.writeUInt32LE(0, 10);
        local.writeUInt32LE(0, 14);
        local.writeUInt32LE(compressed.length, 18);
        local.writeUInt32LE(source.length, 22);
        local.writeUInt16LE(nameBytes.length, 26);
        local.writeUInt16LE(0, 28);
        const localPart = Buffer.concat([local, nameBytes, compressed]);
        const entry = { nameBytes, source, compressed, offset };
        locals.push(localPart);
        offset += localPart.length;
        return entry;
    });
    const centralOffset = offset;
    const centrals = entries.map(entry => {
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(8, 10);
        central.writeUInt32LE(0, 12);
        central.writeUInt32LE(0, 16);
        central.writeUInt32LE(entry.compressed.length, 20);
        central.writeUInt32LE(entry.source.length, 24);
        central.writeUInt16LE(entry.nameBytes.length, 28);
        central.writeUInt16LE(0, 30);
        central.writeUInt16LE(0, 32);
        central.writeUInt16LE(0, 34);
        central.writeUInt16LE(0, 36);
        central.writeUInt32LE(0, 38);
        central.writeUInt32LE(entry.offset, 42);
        return Buffer.concat([central, entry.nameBytes]);
    });
    const centralDirectory = Buffer.concat(centrals);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDirectory.length, 12);
    eocd.writeUInt32LE(centralOffset, 16);
    eocd.writeUInt16LE(0, 20);
    return Buffer.concat([...locals, centralDirectory, eocd]);
}

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

async function setFileInput(page, name, mimeType, text) {
    await page.locator('#musicXmlFileInput').setInputFiles({
        name,
        mimeType,
        buffer: Buffer.from(text, 'utf8')
    });
}

test('MusicXML import UI shows details, restores saved scores, and removes imported entries', async () => {
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
        await page.waitForSelector('#musicXmlFileInput');

        const importControl = await page.locator('#musicXmlFileInput').evaluate(input => ({
            label: document.querySelector(`label[for="${input.id}"]`)?.textContent || '',
            accept: input.getAttribute('accept') || ''
        }));
        assert.match(importControl.label, /Import MusicXML/);
        assert.equal(importControl.accept, '.musicxml,.xml,.mxl');

        await setFileInput(page, 'broken.musicxml', 'application/xml', '<score-timewise></score-timewise>');
        await page.waitForSelector('#importStatus details');
        const failureState = await page.locator('#importStatus').evaluate(element => ({
            text: element.textContent,
            summary: element.querySelector('summary')?.textContent || '',
            role: element.getAttribute('role') || ''
        }));
        assert.match(failureState.text, /This MusicXML file could not be imported/);
        assert.match(failureState.summary, /Show import details/);
        assert.match(failureState.text, /Import details/);
        assert.match(failureState.text, /Only score-partwise MusicXML files are supported/);
        assert.equal(failureState.role, 'alert');

        await page.locator('#musicXmlFileInput').setInputFiles({
            name: 'smoke-import.mxl',
            mimeType: 'application/vnd.recordare.musicxml',
            buffer: createMxlBuffer(VALID_SCORE)
        });
        await page.waitForFunction(() => document.querySelector('#pattern option:checked')?.textContent?.includes('Smoke Import'));
        await page.waitForSelector('.score-page svg');
        await page.waitForSelector('[data-musicxml-event-id]');

        const successState = await page.evaluate(() => ({
            status: document.getElementById('importStatus')?.textContent || '',
            selectedLabel: document.querySelector('#pattern option:checked')?.textContent || '',
            selectedValue: document.getElementById('pattern')?.value || '',
            removeVisible: !document.getElementById('removeImportedScoreBtn')?.hidden,
            pageCount: document.querySelectorAll('.score-page').length,
            eventHooks: document.querySelectorAll('[data-musicxml-event-id]').length
        }));
        assert.match(successState.status, /Imported "Smoke Import"/);
        assert.match(successState.selectedLabel, /Smoke Import/);
        assert.match(successState.selectedValue, /^imported-score:/);
        assert.equal(successState.removeVisible, true);
        assert.ok(successState.pageCount > 0, 'imported score should render score pages');
        assert.ok(successState.eventHooks > 0, 'imported score should expose playback highlight hooks');

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.Vex && Array.from(document.querySelectorAll('#pattern option')).some(option => option.textContent.includes('Smoke Import')));
        const restoredState = await page.evaluate(() => ({
            options: Array.from(document.querySelectorAll('#pattern option')).map(option => option.textContent),
            selectedLabel: document.querySelector('#pattern option:checked')?.textContent || '',
            removeVisible: !document.getElementById('removeImportedScoreBtn')?.hidden
        }));
        assert.ok(restoredState.options.some(label => label.includes('Smoke Import')));
        assert.match(restoredState.selectedLabel, /Smoke Import/);
        assert.equal(restoredState.removeVisible, true);

        page.once('dialog', async dialog => {
            assert.match(dialog.message(), /Remove this imported score from this browser/);
            await dialog.accept();
        });
        await page.click('#removeImportedScoreBtn');
        await page.waitForFunction(() => !Array.from(document.querySelectorAll('#pattern option')).some(option => option.textContent.includes('Smoke Import')));

        const afterRemove = await page.evaluate(() => ({
            status: document.getElementById('importStatus')?.textContent || '',
            removeHidden: document.getElementById('removeImportedScoreBtn')?.hidden === true,
            selectedSourceType: document.querySelector('#pattern option:checked')?.dataset.sourceType || ''
        }));
        assert.match(afterRemove.status, /Removed imported score/);
        assert.equal(afterRemove.removeHidden, true);
        assert.notEqual(afterRemove.selectedSourceType, 'musicxml');
        assert.deepEqual(pageErrors, []);
    } finally {
        await browser.close();
        await new Promise(resolveClose => server.close(resolveClose));
    }
});
