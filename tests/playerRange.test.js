import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as wait } from 'node:timers/promises';

import { Player } from '../js/player.js';

function makeSequence() {
    return {
        patternId: 'range-fixture',
        patternName: 'Range Fixture',
        selectedKey: 'C',
        isKeySupported: true,
        timeSignature: '4/4',
        beatsPerMeasure: 4,
        loopUnitBeats: 5,
        measures: [
            { measureNumber: '1', startBeat: 0, durationBeats: 2, eventIds: ['e0', 'e1'] },
            { measureNumber: '2', startBeat: 2, durationBeats: 2, eventIds: ['e2', 'e3'] },
            { measureNumber: '3', startBeat: 4, durationBeats: 1, eventIds: ['e4'] }
        ],
        events: [
            event('e0', 0, 1, 0, 'C3'),
            event('e1', 1, 1, 0, 'D3'),
            event('e2', 2, 1, 1, 'E3'),
            event('e3', 3, 1, 1, 'F3'),
            event('e4', 4, 1, 2, 'G3')
        ]
    };
}

function event(id, startBeat, durationBeats, measureIndex, note, payloadOverrides = {}) {
    return {
        id,
        startBeat,
        durationBeats,
        measureIndex,
        beatInMeasure: startBeat - (measureIndex * 2),
        hands: {
            left: {
                notes: [note],
                isRest: false,
                fingering: null,
                ...payloadOverrides
            }
        }
    };
}

function makePlayer() {
    const played = [];
    const highlights = [];
    const audioEngine = {
        audioContext: { currentTime: 0 },
        initCalls: 0,
        init() {
            this.initCalls += 1;
        },
        getCurrentTime() {
            return this.audioContext.currentTime;
        },
        playNote(notes, duration, sustain, volume, startTime) {
            played.push({ notes, duration, sustain, volume, startTime });
        }
    };
    const piano = {
        highlighted: [],
        cleared: 0,
        highlightKey(notes) {
            this.highlighted.push(notes);
        },
        unhighlightKey() {},
        clearAllHighlights() {
            this.cleared += 1;
        }
    };
    const settings = {
        getBeatDuration: () => 5,
        getSwingRatio: () => 0.5,
        getSustain: () => false
    };
    const player = new Player(audioEngine, piano, settings);
    player.onNoteHighlight = (eventId, event) => highlights.push({ eventId, event });
    return { player, played, highlights, piano, audioEngine };
}

test('plays all canonical events when no range is provided', () => {
    const { player, played } = makePlayer();

    player.play(makeSequence());
    player.stop();

    assert.deepEqual(played.map(call => call.notes), [['C3'], ['D3'], ['E3'], ['F3'], ['G3']]);
});

test('measure range starts at the first event in the start measure', async () => {
    const { player, played, highlights } = makePlayer();

    player.play(makeSequence(), {
        range: {
            startMeasureNumber: '2',
            endMeasureNumber: '2'
        }
    });
    await wait(15);
    player.stop();

    assert.deepEqual(played.map(call => call.notes), [['E3'], ['F3']]);
    assert.deepEqual(highlights.map(entry => entry.eventId), ['e2', 'e3']);
});

test('event ID range starts and stops at selected canonical events', () => {
    const { player, played } = makePlayer();

    player.play(makeSequence(), {
        range: {
            startEventId: 'e1',
            endEventId: 'e3'
        }
    });
    player.stop();

    assert.deepEqual(played.map(call => call.notes), [['D3'], ['E3'], ['F3']]);
});

test('non-looping range stops after the end measure', () => {
    const { player, played } = makePlayer();

    player.play(makeSequence(), {
        loop: false,
        range: {
            startMeasureNumber: '2',
            endMeasureNumber: '2'
        }
    });

    assert.deepEqual(played.map(call => call.notes), [['E3'], ['F3']]);
    assert.equal(player.noteIndex, 2);
    player.stop();
});

test('looping range wraps to the range start', () => {
    const { player, played } = makePlayer();

    player.play(makeSequence(), {
        loop: true,
        range: {
            startMeasureNumber: '2',
            endMeasureNumber: '2'
        }
    });
    player.stop();

    assert.deepEqual(played.slice(0, 6).map(call => call.notes), [
        ['E3'],
        ['F3'],
        ['E3'],
        ['F3'],
        ['E3'],
        ['F3']
    ]);
});

test('tied stop events do not retrigger playback attacks', () => {
    const { player, played } = makePlayer();
    const sequence = {
        ...makeSequence(),
        loopUnitBeats: 3,
        measures: [
            { measureNumber: '1', startBeat: 0, durationBeats: 3, eventIds: ['t0', 't1', 't2'] }
        ],
        events: [
            event('t0', 0, 1, 0, 'C3', { tie: 'start' }),
            event('t1', 1, 1, 0, 'C3', { tie: 'stop' }),
            event('t2', 2, 1, 0, 'D3')
        ]
    };

    player.play(sequence);
    player.stop();

    assert.deepEqual(played.map(call => call.notes), [['C3'], ['D3']]);
    assert.equal(played[0].duration, 0.01);
});

test('hand payload duration controls playback length when hands share an event', () => {
    const { player, played } = makePlayer();
    const sequence = {
        ...makeSequence(),
        loopUnitBeats: 1,
        measures: [
            { measureNumber: '1', startBeat: 0, durationBeats: 1, eventIds: ['shared0'] }
        ],
        events: [
            {
                id: 'shared0',
                startBeat: 0,
                durationBeats: 1,
                measureIndex: 0,
                beatInMeasure: 0,
                hands: {
                    right: {
                        notes: ['C5'],
                        isRest: false,
                        durationBeats: 0.5
                    },
                    left: {
                        notes: [],
                        isRest: true,
                        durationBeats: 1
                    }
                }
            }
        ]
    };

    player.play(sequence);
    player.stop();

    assert.deepEqual(played.map(call => call.notes), [['C5']]);
    assert.equal(played[0].duration, 0.0025);
});
