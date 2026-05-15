import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePatternSequence, transposeNote } from '../js/canonicalPatternResolver.js';
import { lombardisch } from '../patterns/lombardisch.js';
import { furelise } from '../patterns/furelise.js';
import { bossa } from '../patterns/bossa.js';
import { ragtime } from '../patterns/ragtime.js';

function durationTotal(sequence) {
    return Math.round(sequence.events.reduce((sum, event) => sum + event.durationBeats, 0) * 1000) / 1000;
}

test('resolves Lombard rhythm to one complete visible 4/4 loop unit', () => {
    const sequence = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' });

    assert.equal(sequence.isKeySupported, true);
    assert.equal(sequence.timeSignature, '4/4');
    assert.equal(sequence.beatsPerMeasure, 4);
    assert.equal(sequence.loopUnitBeats, 4);
    assert.equal(sequence.events.length, 8);
    assert.equal(durationTotal(sequence), 4);
});

test('creates stable unique event IDs for canonical maps', () => {
    const sequence = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' });
    const ids = sequence.events.map(event => event.id);

    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(ids.slice(0, 3), [
        'lombardisch-event-0',
        'lombardisch-event-1',
        'lombardisch-event-2'
    ]);
});

test('transposes pattern notes through shared note helper', () => {
    assert.equal(transposeNote('C3', 7, false), 'G3');
    assert.equal(transposeNote('E3', 5, true), 'A3');
    assert.deepEqual(transposeNote(['E3', 'G3'], 5, true), ['A3', 'C4']);
});

test('normalizes rests as explicit hand payloads', () => {
    const sequence = resolvePatternSequence(bossa, { patternId: 'bossa', key: 'C' });
    const restEvent = sequence.events.find(event => event.hands.left?.isRest);

    assert.ok(restEvent);
    assert.deepEqual(restEvent.hands.left.notes, []);
    assert.equal(restEvent.hands.left.fingering, null);
});

test('normalizes chords as note arrays with matching fingering', () => {
    const sequence = resolvePatternSequence(ragtime, { patternId: 'ragtime', key: 'C' });
    const chordEvent = sequence.events.find(event => event.hands.left?.notes.length > 1);

    assert.ok(chordEvent);
    assert.deepEqual(chordEvent.hands.left.notes, ['E3', 'G3']);
    assert.deepEqual(chordEvent.hands.left.fingering, [3, 2]);
    assert.equal(chordEvent.hands.left.isRest, false);
});

test('represents unsupported native-key patterns without events', () => {
    const sequence = resolvePatternSequence(furelise, { patternId: 'furelise', key: 'C' });

    assert.equal(sequence.isKeySupported, false);
    assert.equal(sequence.events.length, 0);
    assert.match(sequence.unsupportedReason, /only available in Am/);
});
