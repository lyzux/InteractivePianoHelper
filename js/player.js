// Player Module - Handles canonical pattern playback

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
        this.onNoteHighlight  = null; // callback(eventId, event) fired when a note is visually highlighted
        this.currentPattern   = null;
        this.currentKey      = null;
        this.sequenceEvents   = [];
        this.noteIndex       = 0;
        this.nextNoteTime    = 0; // AudioContext seconds
        this.beatPosition    = 0; // beats, tracks swing phase
    }

    play(sequence) {
        if (this.isPlaying) return;
        if (!sequence || !sequence.isKeySupported || !sequence.events?.length) return;
        this.audioEngine.init();
        this.isPlaying      = true;
        this.currentPattern = sequence;
        this.currentKey     = sequence.selectedKey;
        this.sequenceEvents = sequence.events;
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
        const maxLen     = this.sequenceEvents.length;
        if (!maxLen) {
            this.stop();
            return;
        }

        while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
            const idx           = this.noteIndex;
            const event         = this.sequenceEvents[idx];
            const rawBeats      = event.durationBeats;
            const durSec        = this._noteDurationSec(rawBeats);
            const startTime     = this.nextNoteTime;
            // Delay in ms from now until this note's scheduled start, for visual sync
            const visualMs      = Math.max(0, (startTime - ctx.currentTime) * 1000);
            const unhighlightMs = visualMs + durSec * 900;

            const leftNote = event.hands.left && !event.hands.left.isRest ? event.hands.left.notes : null;
            if (leftNote?.length) {
                this.audioEngine.playNote(leftNote, durSec, useSustain, 0.8, startTime);
                this._visualTimeouts.push(
                    setTimeout(() => this.piano.highlightKey(leftNote),   visualMs),
                    setTimeout(() => this.piano.unhighlightKey(leftNote), unhighlightMs)
                );
            }

            // Fire notation highlight callback once per canonical event.
            if (this.onNoteHighlight) {
                this._visualTimeouts.push(
                    setTimeout(() => { if (this.onNoteHighlight) this.onNoteHighlight(event.id, event); }, visualMs)
                );
            }

            const rightNote = event.hands.right && !event.hands.right.isRest ? event.hands.right.notes : null;
            if (rightNote?.length) {
                this.audioEngine.playNote(rightNote, durSec, useSustain, 0.8, startTime);
                this._visualTimeouts.push(
                    setTimeout(() => this.piano.highlightKey(rightNote),   visualMs),
                    setTimeout(() => this.piano.unhighlightKey(rightNote), unhighlightMs)
                );
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
        this.sequenceEvents = [];
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
