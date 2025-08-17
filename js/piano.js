// Piano Module - Reusable Piano Component
export class Piano {
    constructor(containerId, audioEngine) {
        this.container = document.getElementById(containerId);
        this.audioEngine = audioEngine;
        this.activeKeys = new Set();
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
                key.dataset.note = note + octave.number;
                
                // Only label C keys and middle C area
                if (note === 'C' || (octave.number === 4 && note === 'A')) {
                    const label = document.createElement('div');
                    label.className = 'key-label';
                    label.textContent = note === 'C' ? `C${octave.number}` : 'A4';
                    key.appendChild(label);
                }
                
                octaveGroup.appendChild(key);
            });
            
            // Create black keys
            Object.entries(octave.blackKeys).forEach(([note, position]) => {
                const key = document.createElement('div');
                key.className = 'key black-key';
                key.dataset.note = note + octave.number;
                key.style.left = position + 'px';
                
                // Label only specific black keys for reference
                if (octave.number === 4 && note === 'F#') {
                    const label = document.createElement('div');
                    label.className = 'key-label';
                    label.textContent = 'F#4';
                    key.appendChild(label);
                }
                
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
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('key')) {
                const note = e.target.dataset.note;
                if (note) {
                    this.playKey(note);
                }
            }
        });
    }

    playKey(note, duration = 0.5) {
        if (this.audioEngine) {
            const sustainEnabled = document.getElementById('sustain')?.checked || true;
            this.audioEngine.playNote(note, duration, sustainEnabled);
            this.highlightKey(note);
            setTimeout(() => this.unhighlightKey(note), duration * 1000);
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
    }

    destroy() {
        this.container.innerHTML = '';
        this.activeKeys.clear();
    }
}