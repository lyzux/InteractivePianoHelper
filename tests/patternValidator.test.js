import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePatternSequence } from '../js/canonicalPatternResolver.js';
import {
    createDiagnostic,
    hasFatalDiagnostics,
    isFatalDiagnostic,
    validatePatternForRegistration,
    validatePatternSource,
    validateResolvedSequence
} from '../js/patternValidator.js';
import { furelise } from '../patterns/furelise.js';
import { lombardisch } from '../patterns/lombardisch.js';
import { bossa } from '../patterns/bossa.js';
import { ragtime } from '../patterns/ragtime.js';

function diagnosticFor(diagnostics, code) {
    return diagnostics.find(diagnostic => diagnostic.code === code);
}

function fatalCodes(diagnostics) {
    return diagnostics.filter(isFatalDiagnostic).map(diagnostic => diagnostic.code);
}

function cloneSequence(sequence) {
    return structuredClone(sequence);
}

test('creates source-scoped structured diagnostics', () => {
    const diagnostic = createDiagnostic({
        sourceId: 'fixture',
        sourceType: 'musicxml',
        severity: 'warning',
        code: 'TEST_CODE',
        path: 'measure[0]',
        message: 'Fixture warning.'
    });

    assert.deepEqual(diagnostic, {
        sourceId: 'fixture',
        sourceType: 'musicxml',
        severity: 'warning',
        code: 'TEST_CODE',
        path: 'measure[0]',
        message: 'Fixture warning.'
    });
    assert.equal(isFatalDiagnostic({ severity: 'error' }), true);
    assert.equal(isFatalDiagnostic({ severity: 'warning' }), false);
});

test('accepts valid production fixtures including rests and chords', () => {
    const fixtures = [
        ['furelise', furelise],
        ['lombardisch', lombardisch],
        ['bossa', bossa],
        ['ragtime', ragtime]
    ];

    fixtures.forEach(([patternId, pattern]) => {
        const result = validatePatternForRegistration(pattern, { patternId });
        assert.equal(result.valid, true, `${patternId} should be valid`);
        assert.deepEqual(fatalCodes(result.diagnostics), []);
    });

    const bossaDiagnostics = validatePatternSource(bossa, { patternId: 'bossa' });
    const ragtimeDiagnostics = validatePatternSource(ragtime, { patternId: 'ragtime' });
    assert.equal(hasFatalDiagnostics(bossaDiagnostics), false);
    assert.equal(hasFatalDiagnostics(ragtimeDiagnostics), false);
});

test('reports missing required fields and invalid timing values', () => {
    const diagnostics = validatePatternSource({
        pattern: () => ['C3'],
        timing: [1, 0, 0.33],
        timeSignature: '4/4'
    }, { patternId: 'missing-fields' });

    const required = diagnosticFor(diagnostics, 'PATTERN_REQUIRED_FIELD');
    const invalidTiming = diagnostics.filter(diagnostic => diagnostic.code === 'TIMING_INVALID_VALUE');

    assert.equal(required.severity, 'error');
    assert.equal(required.path, 'name');
    assert.equal(invalidTiming.length, 2);
    assert.deepEqual(invalidTiming.map(diagnostic => diagnostic.path), ['timing[1]', 'timing[2]']);
});

test('reports invalid note names, out-of-range notes, and invalid time signatures', () => {
    const diagnostics = validatePatternSource({
        name: 'Broken notes',
        pattern: () => ['H3', 'C9', null, ['E3', 'G3']],
        timing: [1],
        timeSignature: 'abc'
    }, { patternId: 'broken-notes' });

    const invalidNote = diagnosticFor(diagnostics, 'NOTE_INVALID_NAME');
    const outOfRange = diagnosticFor(diagnostics, 'NOTE_OUT_OF_RANGE');
    const timeSignature = diagnosticFor(diagnostics, 'TIME_SIGNATURE_INVALID');

    assert.equal(invalidNote.severity, 'error');
    assert.equal(invalidNote.path, 'leftHand()[0]');
    assert.equal(outOfRange.severity, 'error');
    assert.equal(outOfRange.path, 'leftHand()[1]');
    assert.equal(timeSignature.severity, 'error');
    assert.equal(timeSignature.path, 'timeSignature');
});

test('reports malformed chord, rest, loop, native-key, and fingering source data', () => {
    const diagnostics = validatePatternSource({
        name: 'Malformed',
        pattern: () => [[], ['E3', null], 'C3', null, 'D3'],
        timing: [1],
        fingering: [1, [3, 2], [1], 4, 9],
        loopUnitBeats: 0,
        loopMeasures: -1,
        timeSignature: '4/4'
    }, { patternId: 'malformed', key: 'C' });

    assert.equal(diagnosticFor(diagnostics, 'CHORD_INVALID_VALUE').severity, 'error');
    assert.equal(diagnosticFor(diagnostics, 'FINGERING_INVALID_SHAPE').severity, 'error');
    assert.equal(diagnosticFor(diagnostics, 'FINGERING_INVALID_VALUE').severity, 'error');
    assert.equal(diagnosticFor(diagnostics, 'LOOP_UNIT_INVALID').severity, 'error');

    const nativeKeyDiagnostics = validatePatternSource({
        name: 'Native key mismatch',
        nativeKey: 'Am',
        rightHand: () => null,
        timing: [1],
        timeSignature: '4/4'
    }, { patternId: 'native-key-mismatch' });
    assert.equal(diagnosticFor(nativeKeyDiagnostics, 'NATIVE_KEY_UNSUPPORTED').severity, 'error');
});

test('validates canonical duplicate IDs, duration, order, and loop mismatch', () => {
    const sequence = cloneSequence(resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' }));
    sequence.events[1].id = sequence.events[0].id;
    sequence.events[2].durationBeats = 0;
    sequence.events[3].startBeat = -1;
    sequence.loopUnitBeats = 99;

    const diagnostics = validateResolvedSequence(sequence, { patternId: 'canonical-broken' });

    assert.equal(diagnosticFor(diagnostics, 'EVENT_ID_DUPLICATE').path, 'events[1].id');
    assert.equal(diagnosticFor(diagnostics, 'EVENT_DURATION_INVALID').path, 'events[2].durationBeats');
    assert.equal(diagnosticFor(diagnostics, 'EVENT_ORDER_INVALID').path, 'events[3].startBeat');
    assert.equal(diagnosticFor(diagnostics, 'LOOP_UNIT_MISMATCH').path, 'loopUnitBeats');
});

test('validates canonical empty, unsupported, measure, and hand payload failures', () => {
    const emptyDiagnostics = validateResolvedSequence({
        isKeySupported: false,
        beatsPerMeasure: 4,
        loopUnitBeats: 0,
        events: []
    }, { patternId: 'empty' });

    assert.equal(diagnosticFor(emptyDiagnostics, 'SEQUENCE_UNSUPPORTED').path, 'isKeySupported');
    assert.equal(diagnosticFor(emptyDiagnostics, 'SEQUENCE_EMPTY').path, 'events');

    const sequence = cloneSequence(resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' }));
    sequence.events[0].measureIndex = 4;
    sequence.events[0].beatInMeasure = 2;
    sequence.events[0].hands.left.notes = ['C9'];

    const diagnostics = validateResolvedSequence(sequence, { patternId: 'canonical-hand' });
    assert.equal(diagnosticFor(diagnostics, 'EVENT_MEASURE_INVALID').path, 'events[0].measureIndex');
    assert.equal(diagnosticFor(diagnostics, 'EVENT_BEAT_INVALID').path, 'events[0].beatInMeasure');
    assert.equal(diagnosticFor(diagnostics, 'NOTE_OUT_OF_RANGE').path, 'events[0].hands.left.notes[0]');
});

test('keeps valid canonical Lombard and Fuer Elise sequences fatal-free', () => {
    const lombard = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' });
    const furElise = resolvePatternSequence(furelise, { patternId: 'furelise', key: 'Am' });

    assert.deepEqual(fatalCodes(validateResolvedSequence(lombard, { patternId: 'lombardisch' })), []);
    assert.deepEqual(fatalCodes(validateResolvedSequence(furElise, { patternId: 'furelise' })), []);
});
