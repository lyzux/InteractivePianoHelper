// Simple Clean Piano Audio Engine
export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.mainFilter = null;
        this.activeNotes = new Map(); // Track active oscillators for stopping
        
        // Simple piano parameters (6-12 essential controls)
        this.params = {
            // Core sound parameters
            volume: 0.3,
            brightness: 0.5,        // Controls high-frequency content
            warmth: 0.7,           // Controls low-frequency emphasis
            attack: 0.01,          // Note attack time
            release: 0.5,          // Note release/sustain time (reduced from 2.0)
            
            // Harmonic content
            harmonics: 0.3,        // Amount of harmonic content
            detune: 0.0,          // Slight detuning for realism
            
            // Effects
            chorus: 0.2,          // Subtle chorus effect
            roomSize: 0.3,        // Room ambience
            damping: 0.5,         // String damping simulation
            
            // Piano mechanics
            lidPosition: 0.0,     // Piano lid (0=closed, 1=open)
            pedalResonance: 0.4   // Sustain pedal resonance
        };
        
        this.noteFrequencies = {
            'A0': 27.50, 'A#0': 29.14, 'Bb0': 29.14, 'B0': 30.87,
            'C1': 32.70, 'C#1': 34.65, 'Db1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'Eb1': 38.89, 'E1': 41.20, 'F1': 43.65,
            'F#1': 46.25, 'Gb1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'Ab1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'Bb1': 58.27, 'B1': 61.74,
            'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31,
            'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
            'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61,
            'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46,
            'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
            'C6': 1046.50, 'C#6': 1108.73, 'Db6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'Eb6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
            'F#6': 1479.98, 'Gb6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'Ab6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'Bb6': 1864.66, 'B6': 1975.53,
            'C7': 2093.00, 'C#7': 2217.46, 'Db7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'Eb7': 2489.02, 'E7': 2637.02, 'F7': 2793.83,
            'F#7': 2959.96, 'Gb7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'Ab7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'Bb7': 3729.31, 'B7': 3951.07,
            'C8': 4186.01
        };
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create separate buses for fundamental and harmonic content
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.params.volume;
            
            // Harmonic bus with compression to prevent buildup
            this.harmonicGain = this.audioContext.createGain();
            this.harmonicCompressor = this.audioContext.createDynamicsCompressor();
            this.harmonicCompressor.threshold.value = -20;
            this.harmonicCompressor.knee.value = 10;
            this.harmonicCompressor.ratio.value = 6;
            this.harmonicCompressor.attack.value = 0.003;
            this.harmonicCompressor.release.value = 0.25;
            this.harmonicGain.gain.value = 0.6; // Reduce harmonic bus volume
            
            this.mainFilter = this.audioContext.createBiquadFilter();
            this.mainFilter.type = 'lowpass';
            this.updateFilter();
            
            // Connect: Harmonics -> Compressor -> Harmonic Gain -> Master -> Filter -> Destination
            this.harmonicCompressor.connect(this.harmonicGain);
            this.harmonicGain.connect(this.masterGain);
            this.masterGain.connect(this.mainFilter);
            this.mainFilter.connect(this.audioContext.destination);
        }
    }

    updateFilter() {
        if (this.mainFilter) {
            // Brightness controls filter frequency
            const baseFreq = 800;
            const maxFreq = 4000;
            this.mainFilter.frequency.value = baseFreq + (this.params.brightness * (maxFreq - baseFreq));
            this.mainFilter.Q.value = 0.5;
        }
    }

    setParam(name, value) {
        if (this.params.hasOwnProperty(name)) {
            this.params[name] = value;
            
            // Update audio components based on parameter changes
            if (name === 'volume' && this.masterGain) {
                this.masterGain.gain.value = value;
            } else if (name === 'brightness') {
                this.updateFilter();
            }
        }
    }

    getParam(name) {
        return this.params[name] || 0;
    }

    playNote(note, duration = 0.5, useSustain = true, velocity = 0.8) {
        this.init();
        
        if (Array.isArray(note)) {
            note.forEach(n => this.playNote(n, duration, useSustain, velocity));
            return;
        }
        
        const frequency = this.noteFrequencies[note];
        if (!frequency) return;
        
        const now = this.audioContext.currentTime;
        const isManualClick = duration > 5;
        
        // For manual clicks, stop existing note to prevent accumulation
        if (isManualClick) {
            this.forceStopNote(note, now);
        }
        
        // For automatic playback, just play the note for its exact duration - no complex logic needed
        const actualDuration = useSustain ? duration * this.params.release : duration;
        
        this.createCleanPianoNote(note, frequency, velocity, now, actualDuration, isManualClick);
    }

    stopNote(note) {
        if (this.activeNotes.has(note)) {
            const noteData = this.activeNotes.get(note);
            const now = this.audioContext ? this.audioContext.currentTime : 0;
            
            // Check sustain pedal setting
            const sustainEnabled = document.getElementById('sustain')?.checked || false;
            
            // Adjust release times based on sustain pedal
            const fundamentalReleaseTime = sustainEnabled ? 1.5 : 0.6; // Longer with sustain
            const harmonicReleaseTime = sustainEnabled ? 0.8 : 0.3;     // Harmonics also longer with sustain
            
            // Immediately remove from active notes to prevent race conditions
            this.activeNotes.delete(note);
            
            // Stop oscillators after their natural release (prevents 30s humming)
            if (noteData.oscillators) {
                noteData.oscillators.forEach(osc => {
                    try {
                        osc.stop(now + fundamentalReleaseTime + 0.1);
                    } catch (e) {
                        // Already stopped
                    }
                });
            }
            if (noteData.harmonicOscillators) {
                noteData.harmonicOscillators.forEach(harmOsc => {
                    try {
                        harmOsc.stop(now + harmonicReleaseTime + 0.1);
                    } catch (e) {
                        // Already stopped
                    }
                });
            }
            
            // Natural gain fade for musical sound
            if (noteData.gain && noteData.gain.gain) {
                noteData.gain.gain.cancelScheduledValues(now);
                noteData.gain.gain.setValueAtTime(noteData.gain.gain.value, now);
                // Natural piano release curve
                noteData.gain.gain.exponentialRampToValueAtTime(0.001, now + fundamentalReleaseTime);
            }
            
            // Harmonics fade faster but still naturally
            if (noteData.harmonicGains && noteData.harmonicGains.length > 0) {
                noteData.harmonicGains.forEach((harmGain, index) => {
                    if (harmGain && harmGain.gain) {
                        harmGain.gain.cancelScheduledValues(now);
                        harmGain.gain.setValueAtTime(harmGain.gain.value, now);
                        // Harmonics fade faster but still musical
                        harmGain.gain.exponentialRampToValueAtTime(0.001, now + harmonicReleaseTime);
                    }
                });
            }
        }
    }


    // Force stop only manual notes (automatic notes are protected)
    forceStopNote(noteName, currentTime) {
        // Stop only manual notes - automatic notes should not be interrupted
        const notesToStop = [];
        
        // Find all notes that should be stopped (only manual ones)
        for (const [key, noteData] of this.activeNotes) {
            if (noteData.originalNoteName === noteName && !noteData.isAutomatic) {
                notesToStop.push(key);
            }
        }
        
        // Stop the manual notes
        notesToStop.forEach(key => {
            const noteData = this.activeNotes.get(key);
            
            // Stop oscillators immediately
            if (noteData.oscillators) {
                noteData.oscillators.forEach(osc => {
                    try {
                        osc.stop(currentTime + 0.01);
                    } catch (e) {
                        // Already stopped
                    }
                });
            }
            if (noteData.harmonicOscillators) {
                noteData.harmonicOscillators.forEach(harmOsc => {
                    try {
                        harmOsc.stop(currentTime + 0.01);
                    } catch (e) {
                        // Already stopped
                    }
                });
            }
            
            // Quick gain fade
            if (noteData.gain && noteData.gain.gain) {
                noteData.gain.gain.cancelScheduledValues(currentTime);
                noteData.gain.gain.setValueAtTime(noteData.gain.gain.value, currentTime);
                noteData.gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
            }
            
            if (noteData.harmonicGains && noteData.harmonicGains.length > 0) {
                noteData.harmonicGains.forEach((harmGain, index) => {
                    if (harmGain && harmGain.gain) {
                        harmGain.gain.gain.cancelScheduledValues(currentTime);
                        harmGain.gain.setValueAtTime(harmGain.gain.value, currentTime);
                        harmGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
                    }
                });
            }
            
            this.activeNotes.delete(key);
        });
    }

    createCleanPianoNote(noteName, frequency, velocity, startTime, duration, isManualClick = false) {
        // Simple approach: For manual clicks use note name, for automatic use unique key
        const noteKey = isManualClick ? noteName : `${noteName}_${startTime}_${Math.random()}`;
        
        // Create fundamental tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const noteFilter = this.audioContext.createBiquadFilter();
        
        // Use triangle wave for warm, non-harsh tone
        osc.type = 'triangle';
        osc.frequency.value = frequency + (this.params.detune * (Math.random() - 0.5) * 10);
        
        // Note-specific filtering
        noteFilter.type = 'lowpass';
        noteFilter.frequency.value = frequency * (2 + this.params.brightness);
        noteFilter.Q.value = 0.3;
        
        // Connect: Oscillator -> Filter -> Gain -> Master
        osc.connect(noteFilter);
        noteFilter.connect(gain);
        gain.connect(this.masterGain);
        
        // Envelope with sustain (no automatic fade for long notes)
        const amplitude = 0.3 * velocity;
        const attackTime = this.params.attack;
        const warmthBoost = this.params.warmth;
        const sustainLevel = amplitude * 0.7;
        
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(amplitude * (0.8 + warmthBoost * 0.2), startTime + attackTime);
        gain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + 0.1);
        
        // For long durations, hold at sustain level (don't fade to 0.001)
        if (duration > 5) {
            // Hold at sustain level - will be stopped manually
            gain.gain.setValueAtTime(sustainLevel, startTime + duration - 1);
        } else {
            // Normal fade for short notes
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        }
        
        // Track this note for potential stopping
        const oscillators = [osc];
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
        
        // Add subtle harmonic if harmonics parameter > 0
        let harmonicGains = [];
        let harmonicOscillators = [];
        if (this.params.harmonics > 0.1) {
            const { oscillators: harmOscs, gains: harmGains } = this.addHarmonic(noteName, frequency, velocity, startTime, duration);
            oscillators.push(...harmOscs);
            harmonicGains = harmGains;
            harmonicOscillators = harmOscs;
        }
        
        // Store note data for potential stopping
        this.activeNotes.set(noteKey, {
            oscillators: oscillators,
            gain: gain,
            harmonicGains: harmonicGains,
            harmonicOscillators: harmonicOscillators,
            startTime: startTime,
            duration: duration,
            originalNoteName: noteName,
            isAutomatic: !isManualClick  // Flag to protect automatic notes from stuck key logic
        });
        
        // Clean up after note naturally ends
        setTimeout(() => {
            if (this.activeNotes.has(noteKey)) {
                this.activeNotes.delete(noteKey);
            }
        }, (duration + 0.2) * 1000);
    }

    addHarmonic(noteName, frequency, velocity, startTime, duration) {
        const harmOsc = this.audioContext.createOscillator();
        const harmGain = this.audioContext.createGain();
        const harmFilter = this.audioContext.createBiquadFilter();
        
        harmOsc.type = 'sine';
        harmOsc.frequency.value = frequency * 2; // Octave harmonic
        
        harmFilter.type = 'lowpass';
        harmFilter.frequency.value = frequency * 3;
        harmFilter.Q.value = 0.5;
        
        harmOsc.connect(harmFilter);
        harmFilter.connect(harmGain);
        harmGain.connect(this.harmonicCompressor); // Connect to harmonic bus with compression
        
        // Restore original harmonic amplitude - compression will handle buildup
        const harmAmp = 0.08 * velocity * this.params.harmonics; // Slightly higher since compressor will control it
        
        harmGain.gain.setValueAtTime(0.001, startTime);
        harmGain.gain.linearRampToValueAtTime(harmAmp, startTime + this.params.attack + 0.01);
        
        // For long durations, hold at sustain level like fundamental
        if (duration > 5) {
            harmGain.gain.setValueAtTime(harmAmp * 0.7, startTime + duration - 1);
        } else {
            harmGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);
        }
        
        harmOsc.start(startTime);
        harmOsc.stop(startTime + duration);
        
        return { 
            oscillators: [harmOsc], 
            gains: [harmGain] 
        };
    }

    close() {
        // Stop all active notes
        this.activeNotes.forEach((noteData, note) => {
            this.stopNote(note);
        });
        this.activeNotes.clear();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}