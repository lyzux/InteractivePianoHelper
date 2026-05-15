import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { resolvePatternSequence, transposeNote } from '../js/canonicalPatternResolver.js';
import { SimplePatternLoader } from '../js/simplePatternLoader.js';
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
    assert.equal(durationTotal(sequence), sequence.loopUnitBeats);
});

test('creates stable unique event IDs for canonical maps', () => {
    const sequence = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' });
    const ids = sequence.events.map(event => event.id);
    const eventMap = new Map(sequence.events.map(event => [event.id, event]));

    assert.equal(new Set(ids).size, ids.length);
    assert.equal(eventMap.size, sequence.events.length);
    assert.deepEqual(ids.slice(0, 3), [
        'lombardisch-event-0',
        'lombardisch-event-1',
        'lombardisch-event-2'
    ]);
});

test('orders canonical events by playback and notation position', () => {
    const sequence = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'G' });
    const positions = sequence.events.map(event => event.startBeat);

    assert.deepEqual(positions, [0, 0.25, 1, 1.25, 2, 2.25, 3, 3.25]);
    sequence.events.forEach((event, index) => {
        assert.equal(event.sourceIndex, index % 4);
        assert.equal(event.measureIndex, 0);
        assert.equal(event.beatInMeasure, positions[index]);
    });
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

test('resolves display sequences in their authored key', () => {
    const loader = new SimplePatternLoader();
    loader.registerPattern('furelise', furelise);
    loader.registerPattern('lombardisch', lombardisch);

    const furElise = loader.resolvePatternSequenceForDisplay('furelise');
    const lombard = loader.resolvePatternSequenceForDisplay('lombardisch');

    assert.equal(loader.getAuthoredKey('furelise'), 'Am');
    assert.equal(furElise.isKeySupported, true);
    assert.equal(furElise.selectedKey, 'Am');
    assert.equal(furElise.displayMode, 'score');
    assert.equal(loader.getAuthoredKey('lombardisch'), 'C');
    assert.equal(lombard.selectedKey, 'C');
});

test('source removes key selector and wires loop playback', () => {
    const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const playerSource = fs.readFileSync(new URL('../js/player.js', import.meta.url), 'utf8');

    assert.doesNotMatch(indexHtml, /select\s+id="key"/);
    assert.match(indexHtml, /id="loopPlayback"/);
    assert.match(indexHtml, /loopToggle\.addEventListener\('change'/);
    assert.match(indexHtml, /player\.setLoopEnabled\(event\.target\.checked === true\)/);
    assert.match(indexHtml, /player\.play\(sequence, \{ loop \}\)/);
    assert.match(playerSource, /play\(sequence, \{ loop = false, range = null \} = \{\}\)/);
    assert.match(playerSource, /setLoopEnabled\(enabled\)/);
});
