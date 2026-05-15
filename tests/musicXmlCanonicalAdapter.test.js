import test from 'node:test';
import assert from 'node:assert/strict';

import {
    adaptMusicXmlDocumentToCanonical,
    validateMusicXmlCanonicalScore
} from '../js/musicXmlCanonicalAdapter.js';
import { parseMusicXmlText } from '../js/musicXmlParser.js';
import { hasFatalDiagnostics, validateResolvedSequence } from '../js/patternValidator.js';

const ACCEPTED_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Adapter Fixture</work-title></work>
  <identification>
    <creator type="composer">Fixture Composer</creator>
  </identification>
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
      <print new-page="yes" page-number="1">
        <system-layout><system-distance>120</system-distance></system-layout>
      </print>
      <attributes>
        <divisions>2</divisions>
        <key><fifths>1</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><alter>1</alter><octave>4</octave></pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
      <note>
        <chord/>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>quarter</type>
        <staff>1</staff>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>eighth</type>
        <staff>1</staff>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <voice>1</voice>
        <type>eighth</type>
        <staff>1</staff>
      </note>
      <backup><duration>4</duration></backup>
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>4</duration>
        <voice>2</voice>
        <type>half</type>
        <staff>2</staff>
        <tie type="start"/>
      </note>
      <forward><duration>4</duration></forward>
    </measure>
    <measure number="2">
      <print new-system="yes"/>
      <attributes>
        <divisions>4</divisions>
        <time><beats>3</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>4</duration>
        <voice>2</voice>
        <type>quarter</type>
        <staff>2</staff>
        <tie type="stop"/>
      </note>
      <backup><duration>4</duration></backup>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>eighth</type>
        <staff>1</staff>
      </note>
      <note>
        <pitch><step>A</step><alter>-1</alter><octave>4</octave></pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>eighth</type>
        <staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;

const MULTIPART_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano RH</part-name></score-part>
    <score-part id="P2"><part-name>Piano LH</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration></note>
    </measure>
  </part>
</score-partwise>`;

function adaptFixture(xml = ACCEPTED_FIXTURE) {
    const parsed = parseMusicXmlText(xml, {
        sourceId: 'fixture-score',
        filename: 'fixture.musicxml'
    });

    return adaptMusicXmlDocumentToCanonical(parsed.document, {
        sourceId: 'fixture-score',
        filename: 'fixture.musicxml',
        descriptor: parsed.descriptor
    });
}

function fatalCodes(diagnostics) {
    return diagnostics
        .filter(diagnostic => diagnostic.severity === 'error')
        .map(diagnostic => diagnostic.code);
}

test('maps accepted MusicXML into canonical sequence, measures, and page metadata', () => {
    const result = adaptFixture();

    assert.equal(result.ok, true);
    assert.deepEqual(fatalCodes(result.diagnostics), []);
    assert.equal(result.sequence.sourceId, 'fixture-score');
    assert.equal(result.sequence.sourceType, 'musicxml');
    assert.equal(result.sequence.patternId, 'fixture-score');
    assert.equal(result.sequence.patternName, 'Adapter Fixture');
    assert.equal(result.sequence.metadata.composer, 'Fixture Composer');
    assert.equal(result.sequence.timeSignature, '4/4');
    assert.equal(result.sequence.beatsPerMeasure, 4);
    assert.equal(result.sequence.loopUnitBeats, 7);
    assert.equal(result.sequence.events.length, 5);
    assert.deepEqual(result.sequence.events.map(event => event.id), [
        'fixture-score-m1-event-0',
        'fixture-score-m1-event-1',
        'fixture-score-m1-event-2',
        'fixture-score-m2-event-3',
        'fixture-score-m2-event-4'
    ]);
    assert.deepEqual(result.sequence.events.map(event => event.startBeat), [0, 1, 1.5, 4, 4.5]);
    assert.deepEqual(result.sequence.events.map(event => event.durationBeats), [2, 0.5, 0.5, 1, 0.5]);
    assert.deepEqual(result.sequence.events.map(event => event.measureIndex), [0, 0, 0, 1, 1]);
});

test('maps chord, rest, accidentals, staff hands, and ties into canonical payloads', () => {
    const { sequence } = adaptFixture();

    assert.deepEqual(sequence.events[0].hands.right.notes, ['C#4', 'E4']);
    assert.equal(sequence.events[0].hands.right.isRest, false);
    assert.deepEqual(sequence.events[0].hands.left.notes, ['C3']);
    assert.equal(sequence.events[0].hands.left.tie, 'start');
    assert.deepEqual(sequence.events[2].hands.right.notes, []);
    assert.equal(sequence.events[2].hands.right.isRest, true);
    assert.deepEqual(sequence.events[3].hands.left.notes, ['C3']);
    assert.equal(sequence.events[3].hands.left.tie, 'stop');
    assert.deepEqual(sequence.events[4].hands.right.notes, ['Ab4']);
});

test('honors backup and forward cursor movement rather than append-only parsing', () => {
    const { sequence } = adaptFixture();
    const leftHalfNote = sequence.events.find(event => event.hands.left?.notes.includes('C3') && event.measureIndex === 0);

    assert.equal(leftHalfNote.startBeat, 0);
    assert.equal(leftHalfNote.durationBeats, 2);
    assert.deepEqual(leftHalfNote.hands.right.notes, ['C#4', 'E4']);
    assert.ok(leftHalfNote.startBeat < sequence.events[2].startBeat, 'backup should move the cursor back to beat 0');
});

test('records measure event IDs and page/system layout hints', () => {
    const { sequence } = adaptFixture();

    assert.deepEqual(sequence.measures.map(measure => measure.measureNumber), ['1', '2']);
    assert.deepEqual(sequence.measures.map(measure => measure.startBeat), [0, 4]);
    assert.deepEqual(sequence.measures.map(measure => measure.durationBeats), [4, 3]);
    assert.deepEqual(sequence.measures[0].eventIds, [
        'fixture-score-m1-event-0',
        'fixture-score-m1-event-1',
        'fixture-score-m1-event-2'
    ]);
    assert.deepEqual(sequence.measures[1].eventIds, [
        'fixture-score-m2-event-3',
        'fixture-score-m2-event-4'
    ]);
    assert.equal(sequence.pageLayout.pageSize.width, 1190);
    assert.equal(sequence.pageLayout.pageSize.height, 1683);
    assert.equal(sequence.pageLayout.measureLayout.length, 2);
    assert.deepEqual(sequence.pageLayout.measureLayout.map(layout => [layout.measureNumber, layout.pageNumber, layout.systemIndex]), [
        ['1', 1, 0],
        ['2', 1, 1]
    ]);
    assert.equal(sequence.pageLayout.printBreaks.length, 2);
});

test('accepted fixtures remain fatal-free through canonical and MusicXML validators', () => {
    const { sequence } = adaptFixture();
    const canonicalDiagnostics = validateResolvedSequence(sequence, {
        sourceId: sequence.sourceId,
        sourceType: 'musicxml'
    });
    const musicXmlDiagnostics = validateMusicXmlCanonicalScore(sequence);

    assert.equal(hasFatalDiagnostics(canonicalDiagnostics), false);
    assert.equal(hasFatalDiagnostics(musicXmlDiagnostics), false);
});

test('rejects unsupported multi-part MusicXML instead of silently skipping parts', () => {
    const result = adaptFixture(MULTIPART_FIXTURE);

    assert.equal(result.ok, false);
    assert.equal(result.sequence, null);
    assert.ok(fatalCodes(result.diagnostics).includes('MUSICXML_PART_UNSUPPORTED'));
});
