// Player Module - Handles pattern playback

// ── MIDI Transposition (same logic as simplePatternLoader.js) ─────────────────
const _SHARP_P   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const _FLAT_P    = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const _ENARH_P   = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' };
const _KEY_ST_P  = {
    C:0, G:7, D:2, A:9, E:4, B:11, 'F#':6,
    F:5, Bb:10, Eb:3, Ab:8, Db:1, Am:9, Dm:2
};
const _FLAT_KEYS_P = new Set(['F','Bb','Eb','Ab','Db','Dm']);

function _toMidiP(note) {
    if (!note) return null;
    const oct = parseInt(note.slice(-1));
    const nm  = note.slice(0, -1);
    const idx = _SHARP_P.indexOf(_ENARH_P[nm] || nm);
    return idx === -1 ? null : (oct + 1) * 12 + idx;
}

function _transposeP(note, semitones, flat) {
    if (note === null || note === undefined) return null;
    if (Array.isArray(note)) return note.map(n => _transposeP(n, semitones, flat));
    const m = _toMidiP(note);
    return m === null ? note : (flat ? _FLAT_P : _SHARP_P)[(m + semitones) % 12] + (Math.floor((m + semitones) / 12) - 1);
}

function _resolveNotesP(pattern, hand, key) {
    const fn = pattern[hand] || (hand === 'leftHand' ? pattern.pattern : null);
    if (!fn) return [];
    if (pattern.nativeKey) return fn(key) || [];
    const base = fn('C');
    if (!base) return [];
    if (key === 'C') return base;
    const semitones = _KEY_ST_P[key] ?? 0;
    const flat      = _FLAT_KEYS_P.has(key);
    return base.map(n => _transposeP(n, semitones, flat));
}

export class Player {
    constructor(audioEngine, piano, settings) {
        this.audioEngine = audioEngine;
        this.piano = piano;
        this.settings = settings;
        this.isPlaying = false;
        this.currentTimeout = null;
        this.noteTimeouts = [];
        this.currentPattern = null;
        this.currentNoteIndex = 0;
        this.currentNotes = null;
        this.currentTiming = null;
        this.currentKey = null;
        this.playStartTime = null;
        this.noteStartTime = null;
    }

    play(pattern, key) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentPattern = pattern;
        this.currentNoteIndex = 0;
        this.currentKey = key;
        
        // Resolve notes with chromatic transposition for unsupported keys
        this.leftHandNotes  = _resolveNotesP(pattern, 'leftHand',  key);
        this.rightHandNotes = _resolveNotesP(pattern, 'rightHand', key) || null;
        this.currentTiming = pattern.timing;
        this.playStartTime = Date.now();
        this.noteStartTime = Date.now();
        
        this.playLoop();
    }

    playLoop() {
        if (!this.isPlaying) return;
        
        const currentTime = Date.now();
        const currentBeatDuration = this.settings.getBeatDuration();
        
        // Prüfe ob es Zeit für die nächste Note ist
        const noteElapsed = currentTime - this.noteStartTime;
        const requiredNoteDuration = this.currentTiming[this.currentNoteIndex % this.currentTiming.length] * currentBeatDuration;
        
        if (noteElapsed >= requiredNoteDuration) {
            const noteDuration = this.currentTiming[this.currentNoteIndex % this.currentTiming.length] * (currentBeatDuration / 1000);
            
            // Play left hand note
            const leftNote = this.leftHandNotes[this.currentNoteIndex];
            if (leftNote) {
                this.audioEngine.playNote(leftNote, noteDuration, this.settings.getSustain());
                this.piano.highlightKey(leftNote);
                setTimeout(() => this.piano.unhighlightKey(leftNote), noteDuration * 1000);
            }
            
            // Play right hand note if it exists
            if (this.rightHandNotes && this.currentNoteIndex < this.rightHandNotes.length) {
                const rightNote = this.rightHandNotes[this.currentNoteIndex];
                if (rightNote) {
                    this.audioEngine.playNote(rightNote, noteDuration, this.settings.getSustain());
                    this.piano.highlightKey(rightNote);
                    setTimeout(() => this.piano.unhighlightKey(rightNote), noteDuration * 1000);
                }
            }
            
            // Nächste Note vorbereiten
            this.currentNoteIndex++;
            const maxLength = Math.max(
                this.leftHandNotes.length,
                this.rightHandNotes ? this.rightHandNotes.length : 0
            );
            if (this.currentNoteIndex >= maxLength) {
                this.currentNoteIndex = 0; // Loop pattern
            }
            
            this.noteStartTime = currentTime;
        }
        
        // Weiter im Loop (alle 20ms für sehr responsive Tempo-Änderungen)
        this.currentTimeout = setTimeout(() => this.playLoop(), 20);
    }

    stop() {
        this.isPlaying = false;
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        this.noteTimeouts.forEach(timeout => clearTimeout(timeout));
        this.noteTimeouts = [];
        
        this.piano.clearAllHighlights();
        this.currentPattern = null;
        this.currentNoteIndex = 0;
        this.leftHandNotes = null;
        this.rightHandNotes = null;
        this.currentTiming = null;
        this.currentKey = null;
        this.playStartTime = null;
        this.noteStartTime = null;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentPattern() {
        return this.currentPattern;
    }
}