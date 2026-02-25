// Simple Pattern Loader — extracted from index.html inline script
import { PATTERN_IDS } from '../patterns/index.js';

// ── MIDI Transposition Helpers ────────────────────────────────────────────────

const _SHARP   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const _FLAT    = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const _ENARH   = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' };
// Semitone offset above C for each key root
const _KEY_ST  = {
    C:0, G:7, D:2, A:9, E:4, B:11, 'F#':6,
    F:5, Bb:10, Eb:3, Ab:8, Db:1,
    Am:9, Dm:2  // minor key roots
};
const _FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Dm']);

function _toMidi(note) {
    if (!note) return null;
    const oct = parseInt(note.slice(-1));
    const nm  = note.slice(0, -1);
    const idx = _SHARP.indexOf(_ENARH[nm] || nm);
    return idx === -1 ? null : (oct + 1) * 12 + idx;
}

function _fromMidi(midi, flat) {
    return (flat ? _FLAT : _SHARP)[midi % 12] + (Math.floor(midi / 12) - 1);
}

function _transposeNote(note, semitones, flat) {
    if (note === null || note === undefined) return null;
    if (Array.isArray(note)) return note.map(n => _transposeNote(n, semitones, flat));
    const m = _toMidi(note);
    return m === null ? note : _fromMidi(m + semitones, flat);
}

/**
 * Resolve notes for a given hand and key.
 * Patterns with nativeKey (e.g. furelise) bypass transposition — fn(key) is used directly.
 * All other patterns: always resolve from fn('C') and transpose chromatically.
 */
function _resolveNotes(pattern, hand, key) {
    const fn = pattern[hand] || (hand === 'leftHand' ? pattern.pattern : null);
    if (!fn) return null;
    if (pattern.nativeKey) return fn(key) || null;
    const base = fn('C');
    if (!base) return null;
    if (key === 'C') return base;
    const semitones = _KEY_ST[key] ?? 0;
    const flat      = _FLAT_KEYS.has(key);
    return base.map(n => _transposeNote(n, semitones, flat));
}

export class SimplePatternLoader {
    constructor() {
        this.patterns = new Map();
    }

    registerPattern(id, pattern) {
        this.patterns.set(id, pattern);
    }

    getPattern(id) {
        return this.patterns.get(id);
    }

    getAllPatterns() {
        return Array.from(this.patterns.entries()).map(([id, pattern]) => ({
            id, ...pattern
        }));
    }

    getPatternOptions() {
        return this.getAllPatterns().map(pattern => ({
            value: pattern.id,
            label: pattern.name
        }));
    }

    generateVexFlowNotation(patternId, key) {
        const pattern = this.getPattern(patternId);
        if (!pattern) return null;

        const timing = pattern.timing;

        // Resolve notes — uses native key data for C/G/F/Am/Dm, transposes from C otherwise
        const bassClefNotes   = _resolveNotes(pattern, 'leftHand',  key) || [];
        const trebleClefNotes = _resolveNotes(pattern, 'rightHand', key);
        const bassClefFingering = pattern.leftHandFingering || pattern.fingering;
        const trebleClefFingering = pattern.rightHandFingering;

        return {
            bassClef: {
                notes: bassClefNotes,
                fingering: bassClefFingering,
                timing: timing
            },
            trebleClef: trebleClefNotes ? {
                notes: trebleClefNotes,
                fingering: trebleClefFingering,
                timing: timing
            } : null,
            timeSignature: pattern.timeSignature || '4/4',
            key: key
        };
    }

    // Convert note string to VexFlow format
    convertToVexFlowNote(note, clef = 'treble') {
        if (!note) return null; // Rest

        if (Array.isArray(note)) {
            // Chord - return array of note strings
            return note.map(n => this.convertSingleNoteToVexFlow(n, clef));
        }

        return this.convertSingleNoteToVexFlow(note, clef);
    }

    // Helper function to convert single note to VexFlow format
    convertSingleNoteToVexFlow(note, clef = 'treble') {
        let noteName = note.charAt(0).toLowerCase();
        let octave = parseInt(note.slice(-1));
        let accidental = note.slice(1, -1);

        // Handle accidentals - VexFlow uses # and b directly
        if (accidental === '#') {
            noteName += '#';
        } else if (accidental === 'b') {
            noteName += 'b';
        }

        // VexFlow octave mapping - no adjustment needed when clef is properly specified
        const adjustedOctave = octave;

        return `${noteName}/${adjustedOctave}`;
    }

    // Convert timing to VexFlow duration
    convertTimingToVexFlowDuration(timing) {
        if (timing === 0.25) return '16'; // Sixteenth note
        if (timing === 0.5) return '8';   // Eighth note
        if (timing === 0.75) return '8d'; // Dotted eighth
        if (timing === 1) return 'q';     // Quarter note
        if (timing === 1.5) return 'qd';  // Dotted quarter
        if (timing === 2) return 'h';     // Half note
        if (timing === 3) return 'hd';    // Dotted half
        if (timing === 4) return 'w';     // Whole note
        return 'q'; // Default to quarter note
    }

    // Load all patterns listed in patterns/index.js in parallel
    async autoLoadPatterns() {
        const timestamp = Date.now();
        await Promise.all(PATTERN_IDS.map(async (patternId) => {
            try {
                const module = await import(`../patterns/${patternId}.js?v=${timestamp}`);
                const pattern = module[patternId];
                if (pattern) this.registerPattern(patternId, pattern);
            } catch (_) { /* pattern file not found — skip silently */ }
        }));
        console.log(`${this.patterns.size} patterns loaded`);
        return this.patterns.size > 0;
    }
}
