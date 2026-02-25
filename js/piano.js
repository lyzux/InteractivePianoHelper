// Piano Module - Reusable Piano Component

// QWERTY → piano note mapping (two octaves centred on C4)
//   Physical layout:   w e   t y u   o p
//                    a s d f g h j k l ;
const KEYBOARD_MAP = {
    'a': 'C4',  'w': 'C#4',
    's': 'D4',  'e': 'D#4',
    'd': 'E4',
    'f': 'F4',  't': 'F#4',
    'g': 'G4',  'y': 'G#4',
    'h': 'A4',  'u': 'A#4',
    'j': 'B4',
    'k': 'C5',  'o': 'C#5',
    'l': 'D5',  'p': 'D#5',
    ';': 'E5',
};

export class Piano {
    constructor(containerId, audioEngine) {
        this.container = document.getElementById(containerId);
        this.audioEngine = audioEngine;
        this.activeKeys = new Set();
        this.heldKeys = new Set(); // Keys held with Ctrl+click
        this.keyPressStartTimes = new Map(); // Track when keys were pressed
        this.currentNoteStops = new Map(); // Store timeout/stop functions for active notes
        this.keyboardActiveNotes = new Set(); // Tracks which keyboard keys are currently pressed
        this.touchNotes = new Map(); // Maps touch identifier → note name

        this.init();
    }

    init() {
        this.createPiano();
        this.attachEventListeners();
    }

    createPiano() {
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

                this.attachKeyListeners(key, fullNote);
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

                this.attachKeyListeners(key, fullNote);
                octaveGroup.appendChild(key);
            });

            this.container.appendChild(octaveGroup);
        });

        // Scroll to middle of piano (around C4)
        setTimeout(() => {
            const container = this.container.parentElement;
            if (container && container.classList.contains('piano-container')) {
                container.scrollLeft = (this.container.scrollWidth - container.clientWidth) / 2;
            }
        }, 100);
    }

    attachEventListeners() {
        // Global mouseup to catch mouseup anywhere on the page
        document.addEventListener('mouseup', () => {
            const keysToStop = Array.from(this.activeKeys).filter(note => !this.heldKeys.has(note));
            keysToStop.forEach(note => this.stopNote(note));
        });

        // Global mouseleave on document to catch edge cases
        document.addEventListener('mouseleave', () => {
            this.emergencyStopAllNotes();
        });

        // Keyboard note on (skip repeat events and inputs)
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
            const note = KEYBOARD_MAP[e.key];
            if (note) {
                e.preventDefault();
                this.startNote(note);
                this.keyboardActiveNotes.add(e.key);
            }
        });

        // Keyboard note off + Ctrl-release for held keys
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.releaseAllHeldKeys();
            }
            const note = KEYBOARD_MAP[e.key];
            if (note && this.keyboardActiveNotes.has(e.key)) {
                this.stopNote(note);
                this.keyboardActiveNotes.delete(e.key);
            }
        });

        // Touch: glissando — detect which key the finger has moved to
        document.addEventListener('touchmove', (e) => {
            Array.from(e.changedTouches).forEach(touch => {
                const currentNote = this.touchNotes.get(touch.identifier);
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const newNote = el?.dataset?.note;
                if (newNote && newNote !== currentNote) {
                    if (currentNote) this.stopNote(currentNote);
                    this.startNote(newNote);
                    this.touchNotes.set(touch.identifier, newNote);
                }
            });
        }, { passive: true });

        // Touch: lift finger(s)
        const endTouch = (e) => {
            Array.from(e.changedTouches).forEach(touch => {
                const note = this.touchNotes.get(touch.identifier);
                if (note) {
                    this.stopNote(note);
                    this.touchNotes.delete(touch.identifier);
                }
            });
        };
        document.addEventListener('touchend',    endTouch, { passive: true });
        document.addEventListener('touchcancel', endTouch, { passive: true });

        // Prevent context menu on right-click
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // Attach individual key listeners (called after creating each key)
    attachKeyListeners(keyElement, note) {
        keyElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startNote(note, e.ctrlKey || e.metaKey);
        });

        keyElement.addEventListener('mouseenter', (e) => {
            if (e.buttons === 1 && !this.keyPressStartTimes.has(note) && !this.heldKeys.has(note)) {
                this.startNote(note, e.ctrlKey || e.metaKey);
            }
        });

        keyElement.addEventListener('mouseleave', () => {
            if (!this.heldKeys.has(note) && this.keyPressStartTimes.has(note)) {
                this.stopNote(note);
            }
        });

        // Touch: finger first contacts this key
        keyElement.addEventListener('touchstart', (e) => {
            e.preventDefault(); // prevent synthetic mouse events
            Array.from(e.changedTouches).forEach(touch => {
                if (!this.touchNotes.has(touch.identifier)) {
                    this.startNote(note);
                    this.touchNotes.set(touch.identifier, note);
                }
            });
        }, { passive: false });
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

    // Start a note (mousedown / keyboard / touch)
    startNote(note, isCtrlHeld = false) {
        if (!this.audioEngine) return;
        if (this.keyPressStartTimes.has(note)) return;

        // Ensure any previous note data is cleaned up
        this.stopNote(note);

        this.keyPressStartTimes.set(note, Date.now());

        if (isCtrlHeld) {
            this.heldKeys.add(note);
        }

        const sustainEnabled = document.getElementById('sustain')?.checked || true;
        this.audioEngine.playNote(note, 30, sustainEnabled, 0.8); // long duration, stopped manually

        this.highlightKey(note);
        this.activeKeys.add(note);
    }

    // Stop a note (mouseup / keyboard-up / touch-end)
    stopNote(note) {
        const wasPlaying = this.keyPressStartTimes.has(note);
        this.keyPressStartTimes.delete(note);
        this.activeKeys.delete(note);

        if (wasPlaying && this.audioEngine?.stopNote) {
            this.audioEngine.stopNote(note);
        }

        this.unhighlightKey(note);
    }

    // Release all keys held with Ctrl
    releaseAllHeldKeys() {
        const heldKeysCopy = new Set(this.heldKeys);
        for (const note of heldKeysCopy) {
            this.stopNote(note);
            this.heldKeys.delete(note);
        }
    }

    // Emergency stop for all non-held notes (e.g. mouse leaves window)
    emergencyStopAllNotes() {
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

        let key = this.container.querySelector(`[data-note="${note}"]`);

        // Flat → sharp fallback (e.g. Bb3 → A#3)
        if (!key && note.includes('b')) {
            const noteLetter = note[0];
            const octave = note.slice(-1);
            const prevNote = String.fromCharCode(noteLetter.charCodeAt(0) - 1);
            key = this.container.querySelector(`[data-note="${prevNote}#${octave}"]`);
        }

        if (key) {
            key.classList.add('active');
            this.activeKeys.add(note);

            // Scroll key into view if needed
            const container = this.container.parentElement;
            if (container?.classList.contains('piano-container')) {
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

        let key = this.container.querySelector(`[data-note="${note}"]`);

        // Flat → sharp fallback
        if (!key && note.includes('b')) {
            const noteLetter = note[0];
            const octave = note.slice(-1);
            const prevNote = String.fromCharCode(noteLetter.charCodeAt(0) - 1);
            key = this.container.querySelector(`[data-note="${prevNote}#${octave}"]`);
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
