import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    adaptMusicXmlDocumentToCanonical,
    validateMusicXmlCanonicalScore
} from '../js/musicXmlCanonicalAdapter.js';
import { parseMusicXmlText } from '../js/musicXmlParser.js';
import { hasFatalDiagnostics, validateResolvedSequence } from '../js/patternValidator.js';

const FIXTURE_ROOT = resolve(new URL('.', import.meta.url).pathname, 'fixtures');
const ACCEPTED_FIXTURE = readFileSync(resolve(FIXTURE_ROOT, 'tiny-score.musicxml'), 'utf8');
const UNSUPPORTED_FIXTURE = readFileSync(resolve(FIXTURE_ROOT, 'unsupported-score.musicxml'), 'utf8');

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

const VARIABLE_METER_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
    </measure>
    <measure number="2">
      <attributes><time><beats>3</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>3</duration><staff>1</staff></note>
    </measure>
    <measure number="3">
      <attributes><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

const UNSUPPORTED_DOUBLE_SHARP_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>F</step><alter>2</alter><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

const UNSUPPORTED_LYRIC_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <staff>1</staff>
        <lyric><text>la</text></lyric>
      </note>
    </measure>
  </part>
</score-partwise>`;

const UNSUPPORTED_FRACTIONAL_DURATION_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>3</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

const UNSUPPORTED_ADDITIVE_METER_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>3+2</beats><beat-type>8</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

const UNSUPPORTED_ACCIDENTAL_TEXT_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><accidental>quarter-sharp</accidental><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

const UNSUPPORTED_KEY_SIGNATURE_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>8</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
    </measure>
  </part>
</score-partwise>`;

const MUSESCORE_ENGRAVING_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <credit page="1">
    <credit-type>title</credit-type>
    <credit-words default-x="500" default-y="700" justify="center" font-size="22">Engraving Fixture</credit-words>
  </credit>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
      </attributes>
      <direction placement="above">
        <direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>84</per-minute></metronome></direction-type>
        <sound tempo="84"/>
      </direction>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem>down</stem>
        <staff>1</staff>
        <beam number="1">begin</beam>
        <notations><slur type="start" number="1"/></notations>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>1</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem>down</stem>
        <staff>1</staff>
        <beam number="1">end</beam>
      </note>
      <backup><duration>2</duration></backup>
      <note>
        <rest/>
        <duration>2</duration>
        <voice>5</voice>
        <type>quarter</type>
        <staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;

const IMPLICIT_PICKUP_CHORD_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Pickup Chord Fixture</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="0" implicit="yes">
      <attributes>
        <divisions>2</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
      </attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><staff>1</staff></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><staff>1</staff></note>
      <backup><duration>2</duration></backup>
      <note><rest/><duration>2</duration><voice>5</voice><staff>2</staff></note>
    </measure>
    <measure number="1">
      <note><pitch><step>E</step><alter>-1</alter><octave>5</octave></pitch><duration>3</duration><voice>1</voice><staff>1</staff></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><voice>1</voice><staff>1</staff></note>
      <note><pitch><step>E</step><alter>-1</alter><octave>5</octave></pitch><duration>2</duration><voice>1</voice><staff>1</staff></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><staff>1</staff></note>
      <backup><duration>8</duration></backup>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>8</duration><voice>5</voice><staff>2</staff></note>
      <note><chord/><pitch><step>E</step><alter>-1</alter><octave>4</octave></pitch><duration>8</duration><voice>5</voice><staff>2</staff></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>8</duration><voice>5</voice><staff>2</staff></note>
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
    assert.equal(result.sequence.patternName, 'Tiny Fixture Score');
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

test('validates variable meter events against measure metadata', () => {
    const result = adaptFixture(VARIABLE_METER_FIXTURE);

    assert.equal(result.ok, true);
    assert.deepEqual(fatalCodes(result.diagnostics), []);
    assert.deepEqual(result.sequence.measures.map(measure => measure.timeSignature), ['4/4', '3/4', '4/4']);
    assert.deepEqual(result.sequence.events.map(event => event.startBeat), [0, 4, 7]);
    assert.equal(hasFatalDiagnostics(validateResolvedSequence(result.sequence, {
        sourceId: result.sequence.sourceId,
        sourceType: 'musicxml'
    })), false);
});

test('rejects unsupported accidentals instead of silently changing pitch', () => {
    const result = adaptFixture(UNSUPPORTED_DOUBLE_SHARP_FIXTURE);

    assert.equal(result.ok, false);
    assert.equal(result.sequence, null);
    assert.ok(fatalCodes(result.diagnostics).includes('MUSICXML_ACCIDENTAL_UNSUPPORTED'));
});

test('rejects deferred note-level features in strict mode', () => {
    const result = adaptFixture(UNSUPPORTED_LYRIC_FIXTURE);

    assert.equal(result.ok, false);
    assert.equal(result.sequence, null);
    assert.ok(fatalCodes(result.diagnostics).includes('MUSICXML_ELEMENT_UNSUPPORTED'));
});

test('rejects durations that cannot render and play consistently', () => {
    const result = adaptFixture(UNSUPPORTED_FRACTIONAL_DURATION_FIXTURE);

    assert.equal(result.ok, false);
    assert.equal(result.sequence, null);
    assert.ok(fatalCodes(result.diagnostics).includes('MUSICXML_DURATION_UNSUPPORTED'));
});

test('rejects unsupported MusicXML meter, accidental text, and key signatures', () => {
    const additiveMeter = adaptFixture(UNSUPPORTED_ADDITIVE_METER_FIXTURE);
    const accidentalText = adaptFixture(UNSUPPORTED_ACCIDENTAL_TEXT_FIXTURE);
    const keySignature = adaptFixture(UNSUPPORTED_KEY_SIGNATURE_FIXTURE);

    assert.equal(additiveMeter.ok, false);
    assert.equal(additiveMeter.sequence, null);
    assert.ok(fatalCodes(additiveMeter.diagnostics).includes('MUSICXML_TIME_SIGNATURE_UNSUPPORTED'));

    assert.equal(accidentalText.ok, false);
    assert.equal(accidentalText.sequence, null);
    assert.ok(fatalCodes(accidentalText.diagnostics).includes('MUSICXML_ACCIDENTAL_UNSUPPORTED'));

    assert.equal(keySignature.ok, false);
    assert.equal(keySignature.sequence, null);
    assert.ok(fatalCodes(keySignature.diagnostics).includes('MUSICXML_KEY_SIGNATURE_UNSUPPORTED'));
});

test('accepts common MuseScore engraving-only elements without changing playback data', () => {
    const result = adaptFixture(MUSESCORE_ENGRAVING_FIXTURE);

    assert.equal(result.ok, true);
    assert.deepEqual(fatalCodes(result.diagnostics), []);
    assert.equal(result.sequence.events.length, 2);
    assert.deepEqual(result.sequence.events.map(event => event.startBeat), [0, 0.5]);
    assert.deepEqual(result.sequence.events.map(event => event.durationBeats), [1, 0.5]);
    assert.equal(result.sequence.events[0].hands.right.durationBeats, 0.5);
    assert.equal(result.sequence.events[0].hands.left.durationBeats, 1);
    assert.equal(result.sequence.events[0].hands.left.isRest, true);
    assert.equal(result.sequence.events[1].hands.right.durationBeats, 0.5);
    assert.deepEqual(result.sequence.pageLayout.credits.map(credit => [credit.pageNumber, credit.type, credit.text]), [
        [1, 'title', 'Engraving Fixture']
    ]);
});

test('honors implicit pickup duration and chord starts after backup cursor moves', () => {
    const result = adaptFixture(IMPLICIT_PICKUP_CHORD_FIXTURE);

    assert.equal(result.ok, true);
    assert.deepEqual(fatalCodes(result.diagnostics), []);
    assert.deepEqual(result.sequence.measures.map(measure => ({
        number: measure.measureNumber,
        implicit: measure.implicit,
        startBeat: measure.startBeat,
        durationBeats: measure.durationBeats
    })), [
        { number: '0', implicit: true, startBeat: 0, durationBeats: 1 },
        { number: '1', implicit: false, startBeat: 1, durationBeats: 4 }
    ]);

    const firstFullMeasure = result.sequence.events.filter(event => event.measureIndex === 1);
    assert.deepEqual(firstFullMeasure.map(event => event.beatInMeasure), [0, 1.5, 2, 3]);
    assert.deepEqual(firstFullMeasure[0].hands.left.notes, ['C4', 'Eb4', 'G4']);
    assert.deepEqual(firstFullMeasure[3].hands.left, undefined);
});

test('rejects unsupported multi-part MusicXML instead of silently skipping parts', () => {
    const result = adaptFixture(MULTIPART_FIXTURE);

    assert.equal(result.ok, false);
    assert.equal(result.sequence, null);
    assert.ok(fatalCodes(result.diagnostics).includes('MUSICXML_PART_UNSUPPORTED'));
});

test('rejects the shared unsupported fixture before creating a playable canonical sequence', () => {
    const parsed = parseMusicXmlText(UNSUPPORTED_FIXTURE, {
        sourceId: 'unsupported-fixture',
        filename: 'unsupported-score.musicxml'
    });
    const result = adaptMusicXmlDocumentToCanonical(parsed.document, {
        sourceId: 'unsupported-fixture',
        filename: 'unsupported-score.musicxml',
        descriptor: parsed.descriptor
    });

    assert.equal(parsed.ok, false);
    assert.equal(result.ok, false);
    assert.equal(result.sequence, null);
    assert.ok(fatalCodes(result.diagnostics).includes('MUSICXML_ELEMENT_UNSUPPORTED'));
});
