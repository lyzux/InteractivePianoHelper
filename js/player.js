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
        
        // Get both left and right hand patterns
        this.leftHandNotes = pattern.leftHand ? pattern.leftHand(key) : pattern.pattern(key);
        this.rightHandNotes = pattern.rightHand ? pattern.rightHand(key) : null;
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