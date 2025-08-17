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
        
        this.currentNotes = pattern.pattern(key);
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
            // Spiele aktuelle Note
            const note = this.currentNotes[this.currentNoteIndex];
            const noteDuration = this.currentTiming[this.currentNoteIndex % this.currentTiming.length] * (currentBeatDuration / 1000);
            
            if (note) {
                this.audioEngine.playNote(note, noteDuration, this.settings.getSustain());
                this.piano.highlightKey(note);
                setTimeout(() => this.piano.unhighlightKey(note), noteDuration * 1000);
            }
            
            // Nächste Note vorbereiten
            this.currentNoteIndex++;
            if (this.currentNoteIndex >= this.currentNotes.length) {
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
        this.currentNotes = null;
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