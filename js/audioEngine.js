// Audio Engine Module
export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.compressor = null;
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
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 0.5;
            
            // Create compressor for more realistic dynamics
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            
            // Connect audio chain
            this.masterGainNode.connect(this.compressor);
            this.compressor.connect(this.audioContext.destination);
        }
    }

    playNote(note, duration = 0.5, useSustain = true) {
        this.init();
        
        if (Array.isArray(note)) {
            note.forEach(n => this.playNote(n, duration, useSustain));
            return;
        }
        
        const frequency = this.noteFrequencies[note];
        if (!frequency) return;
        
        const actualDuration = useSustain ? duration * 2.5 : duration;
        
        // Create multiple oscillators for richer sound (fundamental + harmonics)
        const oscillators = [];
        const gains = [];
        
        // Fundamental frequency
        oscillators[0] = this.audioContext.createOscillator();
        gains[0] = this.audioContext.createGain();
        oscillators[0].frequency.value = frequency;
        oscillators[0].type = 'sine';
        
        // 2nd harmonic (octave)
        oscillators[1] = this.audioContext.createOscillator();
        gains[1] = this.audioContext.createGain();
        oscillators[1].frequency.value = frequency * 2;
        oscillators[1].type = 'sine';
        
        // 3rd harmonic
        oscillators[2] = this.audioContext.createOscillator();
        gains[2] = this.audioContext.createGain();
        oscillators[2].frequency.value = frequency * 3;
        oscillators[2].type = 'sine';
        
        // 4th harmonic
        oscillators[3] = this.audioContext.createOscillator();
        gains[3] = this.audioContext.createGain();
        oscillators[3].frequency.value = frequency * 4;
        oscillators[3].type = 'sine';
        
        // 5th harmonic
        oscillators[4] = this.audioContext.createOscillator();
        gains[4] = this.audioContext.createGain();
        oscillators[4].frequency.value = frequency * 5;
        oscillators[4].type = 'sine';
        
        // Set harmonic amplitudes (decreasing for higher harmonics)
        const harmonicAmplitudes = [0.6, 0.3, 0.15, 0.08, 0.04];
        
        // Calculate velocity based on note register (lower notes louder)
        const noteNumber = parseInt(note.slice(-1));
        const velocityMultiplier = 1 - (noteNumber * 0.08);
        
        // Create envelope for each oscillator
        const now = this.audioContext.currentTime;
        const attackTime = 0.01;
        const decayTime = 0.1;
        const sustainLevel = useSustain ? 0.4 : 0.2;
        const releaseTime = useSustain ? actualDuration : actualDuration * 0.8;
        
        oscillators.forEach((osc, i) => {
            // Connect oscillator through gain to master
            osc.connect(gains[i]);
            gains[i].connect(this.masterGainNode);
            
            // ADSR envelope
            gains[i].gain.setValueAtTime(0, now);
            gains[i].gain.linearRampToValueAtTime(
                harmonicAmplitudes[i] * velocityMultiplier, 
                now + attackTime
            );
            gains[i].gain.exponentialRampToValueAtTime(
                harmonicAmplitudes[i] * sustainLevel * velocityMultiplier, 
                now + attackTime + decayTime
            );
            gains[i].gain.exponentialRampToValueAtTime(
                0.001, 
                now + releaseTime
            );
            
            // Start and stop oscillator
            osc.start(now);
            osc.stop(now + releaseTime + 0.1);
        });
        
        // Add slight detuning for richness
        oscillators[1].detune.value = 2;
        oscillators[2].detune.value = -3;
        oscillators[3].detune.value = 5;
        oscillators[4].detune.value = -7;
    }

    close() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}