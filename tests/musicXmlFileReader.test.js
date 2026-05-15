import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readMusicXmlFile } from '../js/musicXmlFileReader.js';
import { parseMusicXmlText } from '../js/musicXmlParser.js';

const FIXTURE_ROOT = resolve(new URL('.', import.meta.url).pathname, 'fixtures');
const ACCEPTED_SCORE = readFileSync(resolve(FIXTURE_ROOT, 'tiny-score.musicxml'), 'utf8');

function localHeader(nameBytes, compressed, uncompressedLength, localOffset, method) {
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(method, 8);
    header.writeUInt32LE(0, 10);
    header.writeUInt32LE(0, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(uncompressedLength, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28);
    return { localOffset, buffer: Buffer.concat([header, nameBytes, compressed]) };
}

function centralHeader(entry) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(entry.method, 10);
    header.writeUInt32LE(0, 12);
    header.writeUInt32LE(0, 16);
    header.writeUInt32LE(entry.compressed.length, 20);
    header.writeUInt32LE(entry.uncompressedLength, 24);
    header.writeUInt16LE(entry.nameBytes.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(entry.localOffset, 42);
    return Buffer.concat([header, entry.nameBytes]);
}

function createZip(entries) {
    let offset = 0;
    const localParts = [];
    const prepared = entries.map(entry => {
        const nameBytes = Buffer.from(entry.name, 'utf8');
        const source = Buffer.from(entry.text, 'utf8');
        const method = entry.store ? 0 : 8;
        const compressed = entry.store ? source : deflateRawSync(source);
        const preparedEntry = {
            nameBytes,
            method,
            compressed,
            uncompressedLength: source.length,
            localOffset: offset
        };
        const local = localHeader(nameBytes, compressed, source.length, offset, method).buffer;
        localParts.push(local);
        offset += local.length;
        return preparedEntry;
    });

    const centralParts = prepared.map(centralHeader);
    const centralDirectory = Buffer.concat(centralParts);
    const centralOffset = offset;
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(prepared.length, 8);
    eocd.writeUInt16LE(prepared.length, 10);
    eocd.writeUInt32LE(centralDirectory.length, 12);
    eocd.writeUInt32LE(centralOffset, 16);
    eocd.writeUInt16LE(0, 20);
    return Buffer.concat([...localParts, centralDirectory, eocd]);
}

function createMxlFile(xmlText = ACCEPTED_SCORE) {
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml"/>
  </rootfiles>
</container>`;
    const buffer = createZip([
        { name: 'META-INF/container.xml', text: containerXml },
        { name: 'score.xml', text: xmlText }
    ]);
    return new File([buffer], 'tiny-score.mxl', {
        type: 'application/vnd.recordare.musicxml'
    });
}

test('reads plain MusicXML files as text', async () => {
    const file = new File([ACCEPTED_SCORE], 'tiny-score.musicxml', {
        type: 'application/vnd.recordare.musicxml+xml'
    });

    const result = await readMusicXmlFile(file);

    assert.equal(result.ok, true);
    assert.equal(result.compressed, false);
    assert.equal(result.filename, 'tiny-score.musicxml');
    assert.equal(parseMusicXmlText(result.xmlText, { filename: result.filename }).ok, true);
});

test('extracts score XML from compressed MuseScore MXL packages', async () => {
    const result = await readMusicXmlFile(createMxlFile());

    assert.equal(result.ok, true);
    assert.equal(result.compressed, true);
    assert.equal(result.filename, 'tiny-score.mxl');
    assert.equal(result.extractedPath, 'score.xml');
    assert.equal(parseMusicXmlText(result.xmlText, { filename: result.filename }).ok, true);
});

test('reports structured diagnostics for invalid MXL files', async () => {
    const file = new File([Buffer.from('not a zip')], 'broken.mxl', {
        type: 'application/vnd.recordare.musicxml'
    });

    const result = await readMusicXmlFile(file);

    assert.equal(result.ok, false);
    assert.equal(result.diagnostics[0].code, 'MXL_READ_FAILED');
    assert.match(result.diagnostics[0].message, /ZIP directory/);
});
