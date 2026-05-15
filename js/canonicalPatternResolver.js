// Canonical Pattern Resolver
// Adapts current JavaScript pattern modules into a shared event sequence for
// playback and notation. This module intentionally has no DOM, Web Audio, or
// VexFlow dependency so it can be unit-tested in Node and reused by the app.

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const ENHARMONIC_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
const KEY_SEMITONES = {
    C: 0, G: 7, D: 2, A: 9, E: 4, B: 11, 'F#': 6,
    F: 5, Bb: 10, Eb: 3, Ab: 8, Db: 1,
    Am: 9, Dm: 2
};
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Dm']);
export const PIANO_MIN_MIDI = 21; // A0
export const PIANO_MAX_MIDI = 108; // C8

function roundBeat(value) {
    return Math.round(value * 1000) / 1000;
}

export function noteToMidi(note) {
    if (!note) return null;
    const octave = Number.parseInt(note.slice(-1), 10);
    const name = note.slice(0, -1);
    const pitchClass = SHARP_NAMES.indexOf(ENHARMONIC_TO_SHARP[name] || name);
    if (!Number.isFinite(octave) || pitchClass === -1) return null;
    return (octave + 1) * 12 + pitchClass;
}

export function noteFromMidi(midi, preferFlats = false) {
    const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;
    return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export function isPlayableMidi(midi) {
    return Number.isInteger(midi) && midi >= PIANO_MIN_MIDI && midi <= PIANO_MAX_MIDI;
}

export function isPlayablePianoNote(note) {
    return isPlayableMidi(noteToMidi(note));
}

export function transposeNote(note, semitones, preferFlats = false) {
    if (note === null || note === undefined) return null;
    if (Array.isArray(note)) return note.map(n => transposeNote(n, semitones, preferFlats));
    const midi = noteToMidi(note);
    return midi === null ? note : noteFromMidi(midi + semitones, preferFlats);
}

export function beatsPerMeasure(timeSignature = '4/4') {
    const [numBeats, beatValue] = String(timeSignature).split('/').map(Number);
    if (!Number.isFinite(numBeats) || !Number.isFinite(beatValue) || beatValue === 0) {
        return 4;
    }
    return roundBeat(numBeats * (4 / beatValue));
}

function resolveHand(pattern, hand, key) {
    const fn = pattern[hand] || (hand === 'leftHand' ? pattern.pattern : null);
    if (!fn) return [];

    if (pattern.nativeKey) {
        return fn(key) || [];
    }

    const base = fn('C') || [];
    if (key === 'C') return base;

    const semitones = KEY_SEMITONES[key] ?? 0;
    const preferFlats = FLAT_KEYS.has(key);
    return base.map(note => transposeNote(note, semitones, preferFlats));
}

function normalizeNotes(note) {
    if (note === null || note === undefined) return [];
    return Array.isArray(note) ? note : [note];
}

function normalizeHandPayload(note, fingering) {
    const notes = normalizeNotes(note);
    return {
        notes,
        isRest: notes.length === 0,
        fingering: fingering ?? null
    };
}

function sumSourceBeats(sourceLength, timing) {
    let total = 0;
    for (let i = 0; i < sourceLength; i++) {
        total = roundBeat(total + (timing[i % timing.length] ?? 1));
    }
    return total;
}

function resolveLoopUnitBeats(pattern, sourceBeats, measureBeats) {
    if (Number.isFinite(pattern.loopUnitBeats) && pattern.loopUnitBeats > 0) {
        return roundBeat(pattern.loopUnitBeats);
    }
    if (Number.isFinite(pattern.loopMeasures) && pattern.loopMeasures > 0) {
        return roundBeat(pattern.loopMeasures * measureBeats);
    }
    if (sourceBeats < measureBeats - 0.001) {
        return measureBeats;
    }
    return sourceBeats;
}

function hasAnyNotes(leftNotes, rightNotes) {
    return leftNotes.length > 0 || rightNotes.length > 0;
}

export function resolvePatternSequence(pattern, options = {}) {
    const patternId = options.patternId || pattern?.id || 'unknown';
    const key = options.key || 'C';
    const timeSignature = pattern?.timeSignature || '4/4';
    const measureBeats = beatsPerMeasure(timeSignature);

    if (!pattern) {
        return {
            patternId,
            patternName: '',
            selectedKey: key,
            nativeKey: null,
            isKeySupported: false,
            unsupportedReason: 'Pattern is missing.',
            timeSignature,
            beatsPerMeasure: measureBeats,
            loopUnitBeats: 0,
            events: []
        };
    }

    const leftNotes = resolveHand(pattern, 'leftHand', key);
    const rightNotes = resolveHand(pattern, 'rightHand', key);
    const timing = Array.isArray(pattern.timing) && pattern.timing.length ? pattern.timing : [1];

    if (pattern.nativeKey && !hasAnyNotes(leftNotes, rightNotes)) {
        return {
            patternId,
            patternName: pattern.name || patternId,
            selectedKey: key,
            nativeKey: pattern.nativeKey,
            isKeySupported: false,
            unsupportedReason: `${pattern.name || patternId} is only available in ${pattern.nativeKey}.`,
            timeSignature,
            beatsPerMeasure: measureBeats,
            loopUnitBeats: 0,
            events: []
        };
    }

    const sourceLength = Math.max(leftNotes.length, rightNotes.length, timing.length);
    if (!sourceLength) {
        return {
            patternId,
            patternName: pattern.name || patternId,
            selectedKey: key,
            nativeKey: pattern.nativeKey || null,
            isKeySupported: true,
            timeSignature,
            beatsPerMeasure: measureBeats,
            loopUnitBeats: 0,
            events: []
        };
    }

    const leftFingering = pattern.leftHandFingering || pattern.fingering || [];
    const rightFingering = pattern.rightHandFingering || [];
    const sourceBeats = sumSourceBeats(sourceLength, timing);
    const loopBeats = resolveLoopUnitBeats(pattern, sourceBeats, measureBeats);
    const events = [];
    let startBeat = 0;
    let eventOrdinal = 0;

    while (startBeat < loopBeats - 0.001) {
        const sourceIndex = eventOrdinal % sourceLength;
        const durationBeats = timing[sourceIndex % timing.length] ?? 1;
        const event = {
            id: `${patternId}-event-${eventOrdinal}`,
            sourceIndex,
            startBeat: roundBeat(startBeat),
            durationBeats: roundBeat(durationBeats),
            measureIndex: Math.floor(startBeat / measureBeats),
            beatInMeasure: roundBeat(startBeat % measureBeats),
            hands: {}
        };

        if (leftNotes.length) {
            event.hands.left = normalizeHandPayload(
                leftNotes[sourceIndex % leftNotes.length],
                leftFingering[sourceIndex % leftFingering.length]
            );
        }

        if (rightNotes.length) {
            event.hands.right = normalizeHandPayload(
                rightNotes[sourceIndex % rightNotes.length],
                rightFingering[sourceIndex % rightFingering.length]
            );
        }

        events.push(event);
        startBeat = roundBeat(startBeat + durationBeats);
        eventOrdinal++;

        if (eventOrdinal > sourceLength * 1000) {
            throw new Error(`Could not resolve loop unit for ${patternId}; expansion exceeded safety limit.`);
        }
    }

    return {
        patternId,
        patternName: pattern.name || patternId,
        selectedKey: key,
        nativeKey: pattern.nativeKey || null,
        isKeySupported: true,
        timeSignature,
        beatsPerMeasure: measureBeats,
        loopUnitBeats: loopBeats,
        sourceBeats,
        events
    };
}
