// Simple Pattern Loader — extracted from index.html inline script
import { PATTERN_IDS } from '../patterns/index.js';
import { resolvePatternSequence } from './canonicalPatternResolver.js';

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

    getAuthoredKey(patternId) {
        const pattern = this.getPattern(patternId);
        return pattern?.nativeKey || 'C';
    }

    getDisplayMode(patternId) {
        const pattern = this.getPattern(patternId);
        return pattern?.displayMode || 'score';
    }

    resolvePatternSequenceForDisplay(patternId) {
        const sequence = this.resolvePatternSequence(patternId, this.getAuthoredKey(patternId));
        if (!sequence) return null;
        return {
            ...sequence,
            displayMode: sequence.displayMode || this.getDisplayMode(patternId)
        };
    }

    generateVexFlowNotation(patternId, key) {
        const sequence = this.resolvePatternSequence(patternId, key);
        if (!sequence || !sequence.isKeySupported || !sequence.events.length) return null;

        const bassNotes = [];
        const bassTiming = [];
        const bassFingering = [];
        const trebleNotes = [];
        const trebleTiming = [];
        const trebleFingering = [];

        sequence.events.forEach(event => {
            const left = event.hands.left;
            const right = event.hands.right;

            if (left) {
                bassNotes.push(left.isRest ? null : (left.notes.length === 1 ? left.notes[0] : left.notes));
                bassTiming.push(event.durationBeats);
                bassFingering.push(left.fingering);
            }

            if (right) {
                trebleNotes.push(right.isRest ? null : (right.notes.length === 1 ? right.notes[0] : right.notes));
                trebleTiming.push(event.durationBeats);
                trebleFingering.push(right.fingering);
            }
        });

        return {
            bassClef: {
                notes: bassNotes,
                fingering: bassFingering,
                timing: bassTiming
            },
            trebleClef: trebleNotes.length ? {
                notes: trebleNotes,
                fingering: trebleFingering,
                timing: trebleTiming
            } : null,
            timeSignature: sequence.timeSignature,
            key: sequence.selectedKey,
            sequence
        };
    }

    resolvePatternSequence(patternId, key) {
        const pattern = this.getPattern(patternId);
        if (!pattern) return null;
        return resolvePatternSequence(pattern, { patternId, key });
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
