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

// ── Lookahead scheduler constants ─────────────────────────────────────────────
const SCHEDULE_AHEAD = 0.15; // seconds to look ahead when scheduling notes
const POLL_INTERVAL  = 25;   // ms between scheduler polls

export class Player {
    constructor(audioEngine, piano, settings) {
        this.audioEngine     = audioEngine;
        this.piano           = piano;
        this.settings        = settings;
        this.isPlaying        = false;
        this.schedulerTimer   = null;
        this._visualTimeouts  = [];
        this.onNoteHighlight  = null; // callback(noteIndex) fired when a note is visually highlighted
        this.currentPattern   = null;
        this.currentKey      = null;
        this.leftHandNotes   = null;
        this.rightHandNotes  = null;
        this.currentTiming   = null;
        this.noteIndex       = 0;
        this.nextNoteTime    = 0; // AudioContext seconds
        this.beatPosition    = 0; // beats, tracks swing phase
    }

    play(pattern, key) {
        if (this.isPlaying) return;
        this.audioEngine.init();
        this.isPlaying      = true;
        this.currentPattern = pattern;
        this.currentKey     = key;
        this.leftHandNotes  = _resolveNotesP(pattern, 'leftHand',  key);
        this.rightHandNotes = _resolveNotesP(pattern, 'rightHand', key) || null;
        this.currentTiming  = pattern.timing;
        this.noteIndex      = 0;
        this.beatPosition   = 0;
        this.nextNoteTime   = this.audioEngine.getCurrentTime();
        this._scheduleLoop();
    }

    // Convert raw beats to seconds, applying swing to eighth notes.
    // Swing ratio r (0.5 = straight, 0.75 = heavy swing):
    //   downbeat eighth (even half-beat) → r × beatSec
    //   upbeat   eighth (odd  half-beat) → (1-r) × beatSec
    // Two consecutive swung eighths still total exactly 1 beat. ✓
    _noteDurationSec(rawBeats) {
        const beatSec = this.settings.getBeatDuration() / 1000;
        const swing   = this.settings.getSwingRatio();
        if (swing > 0.501 && rawBeats === 0.5) {
            const halfBeat = Math.round(this.beatPosition * 2);
            return (halfBeat % 2 === 0 ? swing : (1 - swing)) * beatSec;
        }
        return rawBeats * beatSec;
    }

    _scheduleLoop() {
        if (!this.isPlaying) return;

        const ctx        = this.audioEngine.audioContext;
        const useSustain = this.settings.getSustain();
        const maxLen     = Math.max(
            this.leftHandNotes.length,
            this.rightHandNotes ? this.rightHandNotes.length : 0
        );

        while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
            const idx           = this.noteIndex;
            const rawBeats      = this.currentTiming[idx % this.currentTiming.length];
            const durSec        = this._noteDurationSec(rawBeats);
            const startTime     = this.nextNoteTime;
            // Delay in ms from now until this note's scheduled start, for visual sync
            const visualMs      = Math.max(0, (startTime - ctx.currentTime) * 1000);
            const unhighlightMs = visualMs + durSec * 900;

            const leftNote = this.leftHandNotes[idx % this.leftHandNotes.length];
            if (leftNote) {
                this.audioEngine.playNote(leftNote, durSec, useSustain, 0.8, startTime);
                this._visualTimeouts.push(
                    setTimeout(() => this.piano.highlightKey(leftNote),   visualMs),
                    setTimeout(() => this.piano.unhighlightKey(leftNote), unhighlightMs)
                );
            }

            // Fire notation highlight callback once per note position
            if (this.onNoteHighlight) {
                const notifIdx = idx;
                this._visualTimeouts.push(
                    setTimeout(() => { if (this.onNoteHighlight) this.onNoteHighlight(notifIdx); }, visualMs)
                );
            }

            if (this.rightHandNotes) {
                const rightNote = this.rightHandNotes[idx % this.rightHandNotes.length];
                if (rightNote) {
                    this.audioEngine.playNote(rightNote, durSec, useSustain, 0.8, startTime);
                    this._visualTimeouts.push(
                        setTimeout(() => this.piano.highlightKey(rightNote),   visualMs),
                        setTimeout(() => this.piano.unhighlightKey(rightNote), unhighlightMs)
                    );
                }
            }

            this.beatPosition += rawBeats;
            this.nextNoteTime += durSec;
            if (++this.noteIndex >= maxLen) {
                this.noteIndex    = 0;
                this.beatPosition = 0;
            }
        }

        this.schedulerTimer = setTimeout(() => this._scheduleLoop(), POLL_INTERVAL);
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.schedulerTimer);
        this.schedulerTimer = null;
        this._visualTimeouts.forEach(t => clearTimeout(t));
        this._visualTimeouts = [];
        this.piano.clearAllHighlights();
        this.currentPattern = null;
        this.noteIndex      = 0;
        this.leftHandNotes  = null;
        this.rightHandNotes = null;
        this.currentTiming  = null;
        this.currentKey     = null;
        this.nextNoteTime   = 0;
        this.beatPosition   = 0;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentPattern() {
        return this.currentPattern;
    }
}
