import test from 'node:test';
import assert from 'node:assert/strict';

import { SimplePatternLoader } from '../js/simplePatternLoader.js';
import {
    assignDuplicateImportedTitle,
    createImportedScoreRecord,
    listCompleteScoreOptions,
    registerImportedScore,
    removeImportedScore
} from '../js/importedScoreLibrary.js';
import { parseMusicXmlText } from '../js/musicXmlParser.js';

const ACCEPTED_SCORE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Tiny Piece</work-title></work>
  <identification><creator type="composer">Ada Composer</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
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
        <rest/>
        <duration>1</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;

function codes(result) {
    return result.diagnostics.map(diagnostic => diagnostic.code);
}

function firstDiagnostic(result) {
    assert.ok(result.diagnostics.length > 0, 'expected at least one diagnostic');
    return result.diagnostics[0];
}

test('accepts a small score-partwise fixture as inert MusicXML data', () => {
    const result = parseMusicXmlText(ACCEPTED_SCORE, {
        sourceId: 'musicxml:tiny-piece',
        filename: 'tiny-piece.musicxml'
    });

    assert.equal(result.ok, true);
    assert.equal(result.descriptor.sourceType, 'musicxml');
    assert.equal(result.descriptor.sourceId, 'musicxml:tiny-piece');
    assert.equal(result.descriptor.title, 'Tiny Piece');
    assert.equal(result.descriptor.composer, 'Ada Composer');
    assert.equal(result.descriptor.root, 'score-partwise');
    assert.equal(result.document.rootName, 'score-partwise');
    assert.deepEqual(result.diagnostics, []);
});

test('rejects malformed XML with a parse failure diagnostic', () => {
    const result = parseMusicXmlText('<score-partwise><part-list>', {
        sourceId: 'musicxml:broken',
        filename: 'broken.musicxml'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(codes(result), ['MUSICXML_PARSE_FAILED']);
    assert.equal(firstDiagnostic(result).sourceType, 'musicxml');
});

test('rejects score-timewise with unsupported root diagnostic', () => {
    const result = parseMusicXmlText('<score-timewise version="4.0"></score-timewise>', {
        sourceId: 'musicxml:timewise',
        filename: 'timewise.musicxml'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(codes(result), ['MUSICXML_ROOT_UNSUPPORTED']);
    assert.equal(firstDiagnostic(result).path, 'score-timewise');
});

test('rejects score-partwise without part-list', () => {
    const result = parseMusicXmlText('<score-partwise><part id="P1"><measure number="1"/></part></score-partwise>', {
        sourceId: 'musicxml:no-part-list'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(codes(result), ['MUSICXML_PART_LIST_MISSING']);
});

test('rejects score-partwise without parts', () => {
    const result = parseMusicXmlText('<score-partwise><part-list><score-part id="P1"/></part-list></score-partwise>', {
        sourceId: 'musicxml:no-parts'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(codes(result), ['MUSICXML_PART_MISSING']);
});

test('rejects a part without measures', () => {
    const result = parseMusicXmlText('<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1"></part></score-partwise>', {
        sourceId: 'musicxml:no-measures'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(codes(result), ['MUSICXML_MEASURE_MISSING']);
});

test('rejects unsupported multi-part structures without silently skipping parts', () => {
    const result = parseMusicXmlText(`
        <score-partwise>
            <part-list>
                <score-part id="P1"><part-name>Piano</part-name></score-part>
                <score-part id="P2"><part-name>Violin</part-name></score-part>
            </part-list>
            <part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes></measure></part>
            <part id="P2"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes></measure></part>
        </score-partwise>`, {
        sourceId: 'musicxml:multi-part'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(codes(result), ['MUSICXML_PART_UNSUPPORTED']);
    assert.equal(firstDiagnostic(result).path, 'score-partwise.part');
});

test('diagnostics preserve MusicXML source identity', () => {
    const result = parseMusicXmlText('<not-music/>', {
        sourceId: 'musicxml:identity',
        filename: 'identity.xml'
    });
    const diagnostic = firstDiagnostic(result);

    assert.equal(diagnostic.sourceId, 'musicxml:identity');
    assert.equal(diagnostic.sourceType, 'musicxml');
    assert.equal(diagnostic.severity, 'error');
    assert.equal(diagnostic.code, 'MUSICXML_ROOT_UNSUPPORTED');
});

test('assigns duplicate imported titles with numeric suffixes', () => {
    const existing = [
        { title: 'Tiny Piece' },
        { title: 'Tiny Piece (2)' }
    ];

    assert.equal(assignDuplicateImportedTitle('Tiny Piece', existing), 'Tiny Piece (3)');
    assert.equal(assignDuplicateImportedTitle('Fresh Piece', existing), 'Fresh Piece');
});

test('registers and removes imported score records through the loader boundary', () => {
    const loader = new SimplePatternLoader();
    const record = createImportedScoreRecord({
        id: 'imported:tiny-piece',
        title: 'Tiny Piece',
        filename: 'tiny-piece.musicxml',
        xmlText: ACCEPTED_SCORE,
        descriptor: parseMusicXmlText(ACCEPTED_SCORE, {
            sourceId: 'imported:tiny-piece',
            filename: 'tiny-piece.musicxml'
        }).descriptor
    });

    const registerResult = registerImportedScore(loader, record);
    assert.equal(registerResult.ok, true);
    assert.equal(loader.getPattern('imported:tiny-piece').sourceType, 'musicxml');
    assert.equal(loader.getDiagnosticsForSource('imported:tiny-piece').length, 0);

    const removeResult = removeImportedScore(loader, 'imported:tiny-piece');
    assert.equal(removeResult.ok, true);
    assert.equal(loader.getPattern('imported:tiny-piece'), undefined);
    assert.deepEqual(loader.getDiagnosticsForSource('imported:tiny-piece'), []);
});

test('default complete-score options can hide short pedagogical patterns without deleting them', () => {
    const loader = new SimplePatternLoader();
    loader.registerPattern('short-pattern', {
        name: 'Short Pattern',
        displayMode: 'preview',
        timing: [1],
        pattern: () => ['C3'],
        timeSignature: '4/4'
    });
    loader.registerPattern('complete-score', {
        name: 'Complete Score',
        displayMode: 'score',
        sourceType: 'pattern',
        timing: [1],
        pattern: () => ['C3'],
        timeSignature: '4/4'
    });

    const options = listCompleteScoreOptions(loader);

    assert.deepEqual(options, [{ value: 'complete-score', label: 'Complete Score', sourceType: 'pattern' }]);
    assert.ok(loader.getPattern('short-pattern'), 'short pattern remains registered internally');
});
