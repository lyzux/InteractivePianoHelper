// Piano Module - Reusable Piano Component
export class Piano {
    constructor(containerId, audioEngine) {
        console.log('🚨 PIANO CONSTRUCTOR CALLED!');
        console.log('Container ID:', containerId);
        console.log('AudioEngine:', audioEngine);
        
        this.container = document.getElementById(containerId);
        console.log('Container element:', this.container);
        
        this.audioEngine = audioEngine;
        this.activeKeys = new Set();
        this.heldKeys = new Set(); // Keys held with Ctrl+click
        this.keyPressStartTimes = new Map(); // Track when keys were pressed
        this.currentNoteStops = new Map(); // Store timeout/stop functions for active notes
        
        console.log('🚨 ABOUT TO CALL INIT');
        this.init();
        console.log('🚨 INIT COMPLETED');
    }

    init() {
        this.createPiano();
        this.attachEventListeners();
    }

    createPiano() {
        console.log('🎹 Creating piano...');
        this.container.innerHTML = '';
        
        // Define the complete 88-key layout
        const octaves = [
            // Octave 0 (partial - only A, A#, B)
            {
                number: 0,
                whiteKeys: ['A', 'B'],
                blackKeys: {'A#': 16}
            },
            // Octaves 1-7 (complete)
            ...Array.from({length: 7}, (_, i) => ({
                number: i + 1,
                whiteKeys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                blackKeys: {'C#': 18, 'D#': 42, 'F#': 90, 'G#': 114, 'A#': 138}
            })),
            // Octave 8 (partial - only C)
            {
                number: 8,
                whiteKeys: ['C'],
                blackKeys: {}
            }
        ];
        
        octaves.forEach(octave => {
            const octaveGroup = document.createElement('div');
            octaveGroup.className = 'octave-group';
            
            // Add octave label for C keys
            if (octave.whiteKeys.includes('C')) {
                const label = document.createElement('div');
                label.className = 'octave-label';
                label.textContent = `C${octave.number}`;
                octaveGroup.appendChild(label);
            }
            
            // Create white keys
            octave.whiteKeys.forEach((note) => {
                const key = document.createElement('div');
                key.className = 'key white-key';
                const fullNote = note + octave.number;
                key.dataset.note = fullNote;
                
                // Only label C keys and middle C area
                if (note === 'C' || (octave.number === 4 && note === 'A')) {
                    const label = document.createElement('div');
                    label.className = 'key-label';
                    label.textContent = note === 'C' ? `C${octave.number}` : 'A4';
                    key.appendChild(label);
                }
                
                // Attach individual key listeners
                console.log(`🎹 About to attach listeners to white key: ${fullNote}`);
                this.attachKeyListeners(key, fullNote);
                console.log(`🎹 Attached listeners to white key: ${fullNote}`);
                
                octaveGroup.appendChild(key);
            });
            
            // Create black keys
            Object.entries(octave.blackKeys).forEach(([note, position]) => {
                const key = document.createElement('div');
                key.className = 'key black-key';
                const fullNote = note + octave.number;
                key.dataset.note = fullNote;
                key.style.left = position + 'px';
                
                // Label only specific black keys for reference
                if (octave.number === 4 && note === 'F#') {
                    const label = document.createElement('div');
                    label.className = 'key-label';
                    label.textContent = 'F#4';
                    key.appendChild(label);
                }
                
                // Attach individual key listeners
                console.log(`🎹 About to attach listeners to black key: ${fullNote}`);
                this.attachKeyListeners(key, fullNote);
                console.log(`🎹 Attached listeners to black key: ${fullNote}`);
                
                octaveGroup.appendChild(key);
            });
            
            this.container.appendChild(octaveGroup);
        });
        
        // Scroll to middle of piano (around C4)
        setTimeout(() => {
            const container = this.container.parentElement;
            if (container && container.classList.contains('piano-container')) {
                // Scroll to approximately middle C area
                container.scrollLeft = (this.container.scrollWidth - container.clientWidth) / 2;
            }
        }, 100);
    }

    attachEventListeners() {
        console.log('🎵 Setting up global event listeners');
        
        // Global mouseup to catch mouseup anywhere on the page
        document.addEventListener('mouseup', (e) => {
            console.log('🎵 GLOBAL MOUSEUP - stopping all non-held notes');
            // Create a copy of activeKeys to avoid modification during iteration
            const keysToStop = Array.from(this.activeKeys).filter(note => !this.heldKeys.has(note));
            keysToStop.forEach(note => this.stopNote(note));
        });
        
        // Global mouseleave on document to catch edge cases
        document.addEventListener('mouseleave', (e) => {
            console.log('🎵 MOUSE LEFT DOCUMENT - emergency stop all non-held notes');
            this.emergencyStopAllNotes();
        });
        
        // Global keyup listener to release held keys when Ctrl is released
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                console.log('🎵 Ctrl released - releasing all held keys');
                this.releaseAllHeldKeys();
            }
        });

        // Prevent context menu on right-click
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // Attach individual key listeners (called after creating each key)
    attachKeyListeners(keyElement, note) {
        console.log(`Attaching listeners to key: ${note}`);
        
        keyElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🎵 MOUSEDOWN EVENT on ${note}, Ctrl: ${e.ctrlKey || e.metaKey}`);
            this.startNote(note, e.ctrlKey || e.metaKey);
        });

        // Removed individual mouseup - using global mouseup instead

        keyElement.addEventListener('mouseenter', (e) => {
            console.log(`🎵 MOUSEENTER on ${note}, buttons: ${e.buttons}`);
            // Only start note if mouse button is down, note isn't already playing, and not held
            if (e.buttons === 1 && !this.keyPressStartTimes.has(note) && !this.heldKeys.has(note)) {
                this.startNote(note, e.ctrlKey || e.metaKey);
            }
        });

        keyElement.addEventListener('mouseleave', (e) => {
            console.log(`🎵 MOUSELEAVE on ${note}, buttons: ${e.buttons}`);
            // Stop note when leaving key, but only if:
            // 1. Not held with Ctrl AND
            // 2. Either mouse button is not pressed OR this was a drag operation
            if (!this.heldKeys.has(note) && this.keyPressStartTimes.has(note)) {
                this.stopNote(note);
            }
        });

        // Test if the key element is getting the events
        keyElement.addEventListener('click', (e) => {
            console.log(`🎵 CLICK EVENT on ${note} (should not happen for manual control)`);
        });
    }

    // Legacy method for backward compatibility
    playKey(note, duration = 0.5) {
        if (this.audioEngine) {
            const sustainEnabled = document.getElementById('sustain')?.checked || true;
            this.audioEngine.playNote(note, duration, sustainEnabled);
            this.highlightKey(note);
            setTimeout(() => this.unhighlightKey(note), duration * 1000);
        }
    }

    // Start a note (mousedown)
    startNote(note, isCtrlHeld = false) {
        if (this.audioEngine) {
            console.log(`Starting note: ${note}, Ctrl: ${isCtrlHeld}`);
            
            // Don't start if already playing
            if (this.keyPressStartTimes.has(note)) {
                console.log(`Note ${note} already playing`);
                return;
            }
            
            // Ensure any previous note data is cleaned up
            this.stopNote(note);
            
            // Record when the note started
            this.keyPressStartTimes.set(note, Date.now());
            
            // If Ctrl is held, add to held keys
            if (isCtrlHeld) {
                this.heldKeys.add(note);
                console.log(`Added ${note} to held keys`);
            }
            
            // Start playing the note immediately with a very long duration
            const sustainEnabled = document.getElementById('sustain')?.checked || true;
            const duration = 30; // Very long duration, we'll stop it manually
            this.audioEngine.playNote(note, duration, sustainEnabled, 0.8);
            
            this.highlightKey(note);
            this.activeKeys.add(note);
        }
    }

    // Stop a note (mouseup or when leaving key)
    stopNote(note) {
        console.log(`Stopping note: ${note}`);
        
        // Always clean up tracking regardless of whether note was properly started
        const wasPlaying = this.keyPressStartTimes.has(note);
        this.keyPressStartTimes.delete(note);
        this.activeKeys.delete(note);
        
        // Stop the audio if it was playing
        if (wasPlaying && this.audioEngine && this.audioEngine.stopNote) {
            this.audioEngine.stopNote(note);
        }
        
        // Always unhighlight to ensure visual consistency
        this.unhighlightKey(note);
    }

    // Release all keys held with Ctrl
    releaseAllHeldKeys() {
        // Create a copy to avoid modification during iteration
        const heldKeysCopy = new Set(this.heldKeys);
        for (const note of heldKeysCopy) {
            this.stopNote(note);
            this.heldKeys.delete(note);
        }
    }
    
    // Emergency stop for all non-held notes (for edge cases like mouse leaving window)
    emergencyStopAllNotes() {
        // Stop all notes except held ones
        const allActiveKeys = new Set([
            ...this.activeKeys,
            ...this.keyPressStartTimes.keys()
        ]);
        
        for (const note of allActiveKeys) {
            if (!this.heldKeys.has(note)) {
                this.stopNote(note);
            }
        }
    }

    highlightKey(note) {
        if (Array.isArray(note)) {
            note.forEach(n => this.highlightKey(n));
            return;
        }
        
        // Try exact match first
        let key = this.container.querySelector(`[data-note="${note}"]`);
        
        // If not found and note contains 'b' (flat), try with '#' (sharp) of previous note
        if (!key && note.includes('b')) {
            const noteLetter = note[0];
            const octave = note.slice(-1);
            const prevNote = String.fromCharCode(noteLetter.charCodeAt(0) - 1);
            const sharpNote = prevNote + '#' + octave;
            key = this.container.querySelector(`[data-note="${sharpNote}"]`);
        }
        
        if (key) {
            key.classList.add('active');
            this.activeKeys.add(note);
            
            // Scroll key into view if needed
            const container = this.container.parentElement;
            if (container && container.classList.contains('piano-container')) {
                const keyRect = key.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                if (keyRect.left < containerRect.left || keyRect.right > containerRect.right) {
                    key.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                }
            }
        }
    }

    unhighlightKey(note) {
        if (Array.isArray(note)) {
            note.forEach(n => this.unhighlightKey(n));
            return;
        }
        
        // Try exact match first
        let key = this.container.querySelector(`[data-note="${note}"]`);
        
        // If not found and note contains 'b' (flat), try with '#' (sharp) of previous note
        if (!key && note.includes('b')) {
            const noteLetter = note[0];
            const octave = note.slice(-1);
            const prevNote = String.fromCharCode(noteLetter.charCodeAt(0) - 1);
            const sharpNote = prevNote + '#' + octave;
            key = this.container.querySelector(`[data-note="${sharpNote}"]`);
        }
        
        if (key) {
            key.classList.remove('active');
            this.activeKeys.delete(note);
        }
    }

    clearAllHighlights() {
        this.container.querySelectorAll('.key.active').forEach(key => {
            key.classList.remove('active');
        });
        this.activeKeys.clear();
        this.heldKeys.clear();
        this.keyPressStartTimes.clear();
        this.currentNoteStops.clear();
    }

    destroy() {
        this.container.innerHTML = '';
        this.activeKeys.clear();
        this.heldKeys.clear();
        this.keyPressStartTimes.clear();
        this.currentNoteStops.clear();
    }
}