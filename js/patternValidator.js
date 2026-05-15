import {
    beatsPerMeasure,
    isPlayablePianoNote,
    noteToMidi,
    resolvePatternSequence
} from './canonicalPatternResolver.js';

const DEFAULT_SOURCE_TYPE = 'pattern';
const DEFAULT_SOURCE_ID = 'unknown';
const VALID_SEVERITIES = new Set(['error', 'warning', 'info']);
const VALID_TIMINGS = new Set([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]);
const VALID_BEAT_VALUES = new Set([1, 2, 4, 8, 16]);
const VALID_FINGERS = new Set([1, 2, 3, 4, 5]);
const ROUND_TOLERANCE = 0.001;

function roundBeat(value) {
    return Math.round(value * 1000) / 1000;
}

function sourceContext(options = {}) {
    return {
        sourceId: options.sourceId || options.patternId || DEFAULT_SOURCE_ID,
        sourceType: options.sourceType || DEFAULT_SOURCE_TYPE
    };
}

function pushDiagnostic(diagnostics, context, input) {
    diagnostics.push(createDiagnostic({ ...context, ...input }));
}

function pathWithIndex(path, index) {
    return `${path}[${index}]`;
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidTimeSignature(timeSignature) {
    const value = String(timeSignature || '').trim();
    const parts = value.split('/');
    if (parts.length !== 2) return false;
    const [beats, beatValue] = parts.map(Number);
    return Number.isInteger(beats)
        && beats > 0
        && Number.isInteger(beatValue)
        && VALID_BEAT_VALUES.has(beatValue);
}

function validateTiming(timing, diagnostics, context) {
    if (!Array.isArray(timing) || timing.length === 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_REQUIRED_FIELD',
            path: 'timing',
            message: 'Pattern timing must be a non-empty array.'
        });
        return;
    }

    timing.forEach((value, index) => {
        const path = pathWithIndex('timing', index);
        if (!Number.isFinite(value) || value <= 0 || !VALID_TIMINGS.has(value)) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'TIMING_INVALID_VALUE',
                path,
                message: 'Timing values must use supported positive beat durations.'
            });
        }
    });
}

function validateLoopMetadata(pattern, diagnostics, context) {
    if ('loopUnitBeats' in pattern && (!Number.isFinite(pattern.loopUnitBeats) || pattern.loopUnitBeats <= 0)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'LOOP_UNIT_INVALID',
            path: 'loopUnitBeats',
            message: 'loopUnitBeats must be a positive number when present.'
        });
    }

    if ('loopMeasures' in pattern && (!Number.isFinite(pattern.loopMeasures) || pattern.loopMeasures <= 0)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'LOOP_UNIT_INVALID',
            path: 'loopMeasures',
            message: 'loopMeasures must be a positive number when present.'
        });
    }
}

function validateNoteValue(value, path, diagnostics, context) {
    if (value === null) return;

    if (Array.isArray(value)) {
        if (value.length === 0) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'CHORD_INVALID_VALUE',
                path,
                message: 'Chord arrays must contain at least one note.'
            });
            return;
        }

        value.forEach((note, index) => {
            if (Array.isArray(note) || note === null) {
                pushDiagnostic(diagnostics, context, {
                    severity: 'error',
                    code: 'CHORD_INVALID_VALUE',
                    path: pathWithIndex(path, index),
                    message: 'Chord entries must be note strings.'
                });
                return;
            }
            validateNoteValue(note, pathWithIndex(path, index), diagnostics, context);
        });
        return;
    }

    if (typeof value !== 'string' || noteToMidi(value) === null) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'NOTE_INVALID_NAME',
            path,
            message: 'Note values must be valid pitch names such as C4, F#3, or Bb2.'
        });
        return;
    }

    if (!isPlayablePianoNote(value)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'NOTE_OUT_OF_RANGE',
            path,
            message: 'Note values must be within the 88-key piano range A0 through C8.'
        });
    }
}

function normalizeFingerValues(fingering) {
    if (fingering === null || fingering === undefined) return [];
    return Array.isArray(fingering) ? fingering : [fingering];
}

function validateFingeringValue(fingering, noteValue, path, diagnostics, context) {
    if (fingering === null || fingering === undefined) return;

    const noteCount = Array.isArray(noteValue) ? noteValue.length : (noteValue === null ? 0 : 1);
    const fingers = normalizeFingerValues(fingering);

    if (noteValue === null) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'FINGERING_INVALID_SHAPE',
            path,
            message: 'Rest entries must not have fingering values.'
        });
        return;
    }

    if (Array.isArray(noteValue) && !Array.isArray(fingering)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'FINGERING_INVALID_SHAPE',
            path,
            message: 'Chord fingering must be an array matching the chord notes.'
        });
        return;
    }

    if (!Array.isArray(noteValue) && Array.isArray(fingering)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'FINGERING_INVALID_SHAPE',
            path,
            message: 'Scalar note fingering must be a single finger number.'
        });
        return;
    }

    if (noteCount > 0 && fingers.length !== noteCount) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'FINGERING_INVALID_SHAPE',
            path,
            message: 'Fingering entries must match the note or chord shape.'
        });
        return;
    }

    fingers.forEach((finger, index) => {
        if (!VALID_FINGERS.has(finger)) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'FINGERING_INVALID_VALUE',
                path: Array.isArray(fingering) ? pathWithIndex(path, index) : path,
                message: 'Finger numbers must be integers from 1 through 5.'
            });
        }
    });
}

function readHandSource(pattern, handName, authoredKey, diagnostics, context) {
    const source = pattern[handName] || (handName === 'leftHand' ? pattern.pattern : null);
    if (!source) return { exists: false, notes: [] };

    if (typeof source !== 'function') {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_INVALID_FIELD',
            path: handName === 'leftHand' && pattern.pattern ? 'pattern' : handName,
            message: 'Hand sources must be functions that return note arrays.'
        });
        return { exists: true, notes: [] };
    }

    let result;
    try {
        result = source(authoredKey);
    } catch (error) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_SOURCE_THROWN',
            path: `${handName}()`,
            message: `Hand source threw while resolving: ${error.message}`
        });
        return { exists: true, notes: [] };
    }

    if (result === null && pattern.nativeKey && authoredKey !== pattern.nativeKey) {
        return { exists: true, notes: [] };
    }

    if (!Array.isArray(result)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_INVALID_FIELD',
            path: `${handName}()`,
            message: 'Hand sources must resolve to an array for the authored key.'
        });
        return { exists: true, notes: [] };
    }

    return { exists: true, notes: result };
}

function validateHandSource(notes, fingering, handName, diagnostics, context) {
    notes.forEach((note, index) => {
        const notePath = `${handName}()[${index}]`;
        validateNoteValue(note, notePath, diagnostics, context);
        if (Array.isArray(fingering) && index < fingering.length) {
            validateFingeringValue(fingering[index], note, `${handName}Fingering[${index}]`, diagnostics, context);
        }
    });
}

function validateCanonicalHandPayload(payload, path, diagnostics, context) {
    if (!isPlainObject(payload)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'HAND_PAYLOAD_INVALID',
            path,
            message: 'Canonical hand payloads must be objects.'
        });
        return;
    }

    if (!Array.isArray(payload.notes)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'HAND_PAYLOAD_INVALID',
            path: `${path}.notes`,
            message: 'Canonical hand notes must be an array.'
        });
        return;
    }

    if (payload.isRest === true) {
        if (payload.notes.length !== 0) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'HAND_PAYLOAD_INVALID',
                path,
                message: 'Canonical rests must not contain notes.'
            });
        }
        return;
    }

    if (payload.notes.length === 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'HAND_PAYLOAD_INVALID',
            path,
            message: 'Canonical played hand payloads must contain notes.'
        });
        return;
    }

    payload.notes.forEach((note, index) => {
        validateNoteValue(note, `${path}.notes[${index}]`, diagnostics, context);
    });
}

export function createDiagnostic(input = {}) {
    const severity = VALID_SEVERITIES.has(input.severity) ? input.severity : 'error';
    return {
        sourceId: input.sourceId || DEFAULT_SOURCE_ID,
        sourceType: input.sourceType || DEFAULT_SOURCE_TYPE,
        severity,
        code: input.code || 'VALIDATION_ERROR',
        path: input.path || '',
        message: input.message || 'Validation failed.'
    };
}

export function isFatalDiagnostic(diagnostic) {
    return diagnostic?.severity === 'error';
}

export function hasFatalDiagnostics(diagnostics) {
    return diagnostics.some(isFatalDiagnostic);
}

export function validatePatternSource(pattern, options = {}) {
    const context = sourceContext(options);
    const diagnostics = [];

    if (!isPlainObject(pattern)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_INVALID_FIELD',
            path: '',
            message: 'Pattern source must be an object.'
        });
        return diagnostics;
    }

    if (typeof pattern.name !== 'string' || pattern.name.trim() === '') {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_REQUIRED_FIELD',
            path: 'name',
            message: 'Pattern name is required.'
        });
    }

    validateTiming(pattern.timing, diagnostics, context);

    const timeSignature = pattern.timeSignature || '4/4';
    if (!isValidTimeSignature(timeSignature)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'TIME_SIGNATURE_INVALID',
            path: 'timeSignature',
            message: 'Time signature must use a supported positive meter such as 4/4 or 3/8.'
        });
    }

    validateLoopMetadata(pattern, diagnostics, context);

    const authoredKey = options.key || pattern.nativeKey || 'C';
    const left = readHandSource(pattern, 'leftHand', authoredKey, diagnostics, context);
    const right = readHandSource(pattern, 'rightHand', authoredKey, diagnostics, context);

    if (!left.exists && !right.exists) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'PATTERN_REQUIRED_FIELD',
            path: 'pattern|leftHand|rightHand',
            message: 'At least one playable hand source is required.'
        });
    }

    if (pattern.nativeKey && (!left.notes.length && !right.notes.length)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'NATIVE_KEY_UNSUPPORTED',
            path: 'nativeKey',
            message: 'Native-key sources must resolve playable arrays in their authored key.'
        });
    }

    validateHandSource(left.notes, pattern.leftHandFingering || pattern.fingering, 'leftHand', diagnostics, context);
    validateHandSource(right.notes, pattern.rightHandFingering, 'rightHand', diagnostics, context);

    if (Array.isArray(pattern.leftHandFingering) && pattern.leftHandFingering.length < left.notes.length) {
        pushDiagnostic(diagnostics, context, {
            severity: 'warning',
            code: 'FINGERING_INCOMPLETE',
            path: 'leftHandFingering',
            message: 'Left-hand fingering has fewer entries than source notes.'
        });
    }

    if (Array.isArray(pattern.rightHandFingering) && pattern.rightHandFingering.length < right.notes.length) {
        pushDiagnostic(diagnostics, context, {
            severity: 'warning',
            code: 'FINGERING_INCOMPLETE',
            path: 'rightHandFingering',
            message: 'Right-hand fingering has fewer entries than source notes.'
        });
    }

    return diagnostics;
}

export function validateResolvedSequence(sequence, options = {}) {
    const context = sourceContext(options);
    const diagnostics = [];

    if (!isPlainObject(sequence)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'SEQUENCE_INVALID',
            path: '',
            message: 'Resolved sequence must be an object.'
        });
        return diagnostics;
    }

    if (sequence.isKeySupported !== true) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'SEQUENCE_UNSUPPORTED',
            path: 'isKeySupported',
            message: 'Resolved sequence must support the authored display key.'
        });
    }

    if (!Number.isFinite(sequence.beatsPerMeasure) || sequence.beatsPerMeasure <= 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'BEATS_PER_MEASURE_INVALID',
            path: 'beatsPerMeasure',
            message: 'Resolved sequences must expose a positive beatsPerMeasure value.'
        });
    }

    if (!Number.isFinite(sequence.loopUnitBeats) || sequence.loopUnitBeats <= 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'LOOP_UNIT_INVALID',
            path: 'loopUnitBeats',
            message: 'Resolved sequences must expose a positive loopUnitBeats value.'
        });
    }

    if (!Array.isArray(sequence.events) || sequence.events.length === 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'SEQUENCE_EMPTY',
            path: 'events',
            message: 'Resolved sequence must contain canonical events.'
        });
        return diagnostics;
    }

    const seenIds = new Set();
    let previousStart = -Infinity;
    let durationTotal = 0;
    const measureBeats = sequence.beatsPerMeasure || beatsPerMeasure(sequence.timeSignature);

    sequence.events.forEach((event, index) => {
        const eventPath = `events[${index}]`;

        if (!event?.id || typeof event.id !== 'string') {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'EVENT_ID_INVALID',
                path: `${eventPath}.id`,
                message: 'Canonical events must have stable string IDs.'
            });
        } else if (seenIds.has(event.id)) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'EVENT_ID_DUPLICATE',
                path: `${eventPath}.id`,
                message: 'Canonical event IDs must be unique.'
            });
        } else {
            seenIds.add(event.id);
        }

        if (!Number.isFinite(event.startBeat) || event.startBeat < previousStart - ROUND_TOLERANCE) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'EVENT_ORDER_INVALID',
                path: `${eventPath}.startBeat`,
                message: 'Canonical events must be ordered by non-decreasing startBeat.'
            });
        }
        previousStart = Number.isFinite(event.startBeat) ? event.startBeat : previousStart;

        if (!Number.isFinite(event.durationBeats) || event.durationBeats <= 0) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'EVENT_DURATION_INVALID',
                path: `${eventPath}.durationBeats`,
                message: 'Canonical event durations must be positive.'
            });
        } else {
            durationTotal = roundBeat(durationTotal + event.durationBeats);
        }

        const expectedMeasureIndex = Math.floor((event.startBeat || 0) / measureBeats);
        const expectedBeatInMeasure = roundBeat((event.startBeat || 0) % measureBeats);
        if (event.measureIndex !== expectedMeasureIndex) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'EVENT_MEASURE_INVALID',
                path: `${eventPath}.measureIndex`,
                message: 'Canonical measureIndex must match startBeat and beatsPerMeasure.'
            });
        }
        if (Math.abs((event.beatInMeasure ?? NaN) - expectedBeatInMeasure) > ROUND_TOLERANCE) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'EVENT_BEAT_INVALID',
                path: `${eventPath}.beatInMeasure`,
                message: 'Canonical beatInMeasure must match startBeat and beatsPerMeasure.'
            });
        }

        if (!isPlainObject(event.hands) || (!event.hands.left && !event.hands.right)) {
            pushDiagnostic(diagnostics, context, {
                severity: 'error',
                code: 'HAND_PAYLOAD_INVALID',
                path: `${eventPath}.hands`,
                message: 'Canonical events must contain at least one hand payload.'
            });
        } else {
            if (event.hands.left) validateCanonicalHandPayload(event.hands.left, `${eventPath}.hands.left`, diagnostics, context);
            if (event.hands.right) validateCanonicalHandPayload(event.hands.right, `${eventPath}.hands.right`, diagnostics, context);
        }
    });

    if (Math.abs(durationTotal - sequence.loopUnitBeats) > ROUND_TOLERANCE) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'LOOP_UNIT_MISMATCH',
            path: 'loopUnitBeats',
            message: 'Canonical event durations must add up to loopUnitBeats.'
        });
    }

    return diagnostics;
}

export function validatePatternForRegistration(pattern, options = {}) {
    const context = sourceContext(options);
    const sourceDiagnostics = validatePatternSource(pattern, { ...options, ...context });
    if (hasFatalDiagnostics(sourceDiagnostics)) {
        return {
            valid: false,
            diagnostics: sourceDiagnostics,
            sourceDiagnostics,
            sequenceDiagnostics: [],
            sequence: null
        };
    }

    const sequence = resolvePatternSequence(pattern, {
        patternId: context.sourceId,
        key: options.key || pattern?.nativeKey || 'C'
    });
    const sequenceDiagnostics = validateResolvedSequence(sequence, { ...options, ...context });
    const diagnostics = [...sourceDiagnostics, ...sequenceDiagnostics];

    return {
        valid: !hasFatalDiagnostics(diagnostics),
        diagnostics,
        sourceDiagnostics,
        sequenceDiagnostics,
        sequence
    };
}
