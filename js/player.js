// Player Module - Handles pattern playback
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
    }

    play(pattern, key) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentPattern = pattern;
        this.currentNoteIndex = 0;
        
        const notes = pattern.pattern(key);
        const timing = pattern.timing;
        const beatDuration = this.settings.getBeatDuration();
        
        this.playNextNote(notes, timing, beatDuration);
    }

    playNextNote(notes, timing, beatDuration) {
        if (!this.isPlaying || this.currentNoteIndex >= notes.length) {
            if (this.isPlaying && this.currentNoteIndex >= notes.length) {
                // Loop the pattern
                this.currentNoteIndex = 0;
                this.playNextNote(notes, timing, beatDuration);
            }
            return;
        }
        
        const note = notes[this.currentNoteIndex];
        const duration = timing[this.currentNoteIndex % timing.length] * (beatDuration / 1000);
        
        if (note) {
            this.audioEngine.playNote(note, duration, this.settings.getSustain());
            this.piano.highlightKey(note);
            setTimeout(() => this.piano.unhighlightKey(note), duration * 1000);
        }
        
        this.currentNoteIndex++;
        this.currentTimeout = setTimeout(() => {
            this.playNextNote(notes, timing, beatDuration);
        }, duration * 1000);
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
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentPattern() {
        return this.currentPattern;
    }
}