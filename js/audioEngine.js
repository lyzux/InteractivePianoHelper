// Audio Engine Module
export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.compressor = null;
        this.reverbNode = null;
        this.roomFilter = null;
        this.stringResonanceNodes = new Map();
        this.sustainedNotes = new Map();
        this.pedalResonance = null;
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
            
            // Create subtle compressor for natural dynamics
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -12;
            this.compressor.knee.value = 15;
            this.compressor.ratio.value = 3;
            this.compressor.attack.value = 0.005;
            this.compressor.release.value = 0.25;
            
            // Simple room tone filter
            this.roomFilter = this.audioContext.createBiquadFilter();
            this.roomFilter.type = 'highshelf';
            this.roomFilter.frequency.value = 8000;
            this.roomFilter.gain.value = -1;
            this.roomFilter.Q.value = 0.5;
            
            // Connect simple audio chain
            this.masterGainNode.connect(this.roomFilter);
            this.roomFilter.connect(this.compressor);
            this.compressor.connect(this.audioContext.destination);
        }
    }

    playNote(note, duration = 0.5, useSustain = true, velocity = 0.8) {
        this.init();
        
        if (Array.isArray(note)) {
            note.forEach(n => this.playNote(n, duration, useSustain, velocity));
            return;
        }
        
        const frequency = this.noteFrequencies[note];
        if (!frequency) return;
        
        const actualDuration = useSustain ? duration * 3.5 : duration;
        
        // Multiple unison strings per note (2-3 strings with slight detuning)
        const unisonCount = noteNumber < 30 ? 1 : (noteNumber < 60 ? 2 : 3);
        const oscillators = [];
        const gains = [];
        const filters = [];
        
        // Add mechanical action noise
        this.addActionNoise(frequency, velocity, now);
        
        // Inharmonic overtones - string stiffness makes overtones sharp
        const B = 0.0001 * Math.pow(frequency / 440, -0.5); // Inharmonicity coefficient
        const harmonicNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const harmonicRatios = harmonicNumbers.map(n => n * Math.sqrt(1 + B * n * n));
        const harmonicAmplitudes = [1.0, 0.6, 0.35, 0.2, 0.12, 0.08, 0.05, 0.03, 0.02, 0.015];
        
        // Calculate note-dependent parameters with realistic velocity response
        const noteNumber = this.getNoteNumber(note);
        const velocityMultiplier = Math.pow(0.92, Math.max(0, noteNumber - 40)); // Lower notes stronger
        
        // Realistic velocity-dependent brightness (higher velocity = brighter sound)
        const basebrightness = Math.min(1, 0.25 + (noteNumber - 20) * 0.018);
        const brightness = Math.min(1, basebrightness * (0.6 + velocity * 0.7));
        
        // Velocity-dependent attack characteristics
        const velocityAttack = Math.max(0.001, 0.008 - velocity * 0.006);
        const velocityVolume = Math.pow(velocity, 0.8); // Realistic volume curve
        
        const now = this.audioContext.currentTime;
        
        // Create unison strings with harmonics
        for (let unison = 0; unison < unisonCount; unison++) {
            // Unison string detuning (creates beating and shimmer)
            const unisonDetune = unison === 0 ? 0 : (Math.random() - 0.5) * 8;
            
            harmonicRatios.forEach((ratio, i) => {
                if (i >= harmonicAmplitudes.length) return;
                
                const oscIndex = unison * harmonicRatios.length + i;
                oscillators[oscIndex] = this.audioContext.createOscillator();
                gains[oscIndex] = this.audioContext.createGain();
                filters[oscIndex] = this.audioContext.createBiquadFilter();
                
                // Inharmonic frequency with unison detuning
                oscillators[oscIndex].frequency.value = frequency * ratio;
                oscillators[oscIndex].detune.value = unisonDetune + (Math.random() - 0.5) * 2;
                oscillators[oscIndex].type = 'sine';
                
                // Soundboard resonance filter
                filters[oscIndex].type = 'peaking';
                filters[oscIndex].frequency.value = frequency * ratio;
                filters[oscIndex].Q.value = 1.5 + Math.random() * 2;
                filters[oscIndex].gain.value = (Math.random() - 0.5) * 3; // Random resonance
                
                // Connect audio chain
                oscillators[oscIndex].connect(filters[oscIndex]);
                filters[oscIndex].connect(gains[oscIndex]);
                gains[oscIndex].connect(this.masterGainNode);
            
                // Hammer strike variability - felt compression randomness
                const hammerVariation = 0.9 + Math.random() * 0.2; // ±10% variation
                const attackJitter = velocityAttack * (0.8 + Math.random() * 0.4);
                
                // Irregular decay - different frequencies sustain differently
                const decayTime = (0.08 + noteNumber * 0.001) * (0.7 + Math.random() * 0.6);
                const sustainLevel = useSustain ? 0.3 * (1 - i * 0.04) * hammerVariation : 0.08;
                const releaseTime = useSustain ? actualDuration * (0.8 + Math.random() * 0.3) : actualDuration * 0.6;
                
                // Amplitude with unison scaling and harmonic variation
                const unisonScale = 1.0 / Math.sqrt(unisonCount); // Prevent volume buildup
                const amplitude = harmonicAmplitudes[i] * velocityMultiplier * velocityVolume * 0.3 * unisonScale * hammerVariation;
            
                // Natural envelope with felt compression characteristics
                gains[oscIndex].gain.setValueAtTime(0, now);
                gains[oscIndex].gain.linearRampToValueAtTime(amplitude * 1.1, now + attackJitter);
                gains[oscIndex].gain.exponentialRampToValueAtTime(amplitude * 0.7, now + attackJitter + decayTime * 0.2);
                gains[oscIndex].gain.exponentialRampToValueAtTime(amplitude * sustainLevel, now + attackJitter + decayTime);
                gains[oscIndex].gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
            
                // String vibration irregularities
                if (i === 0 && unison === 0) {
                    const stringLfo = this.audioContext.createOscillator();
                    const stringLfoGain = this.audioContext.createGain();
                    stringLfo.frequency.value = 6 + Math.random() * 3;
                    stringLfo.type = 'triangle';
                    stringLfoGain.gain.value = frequency * 0.002;
                    stringLfo.connect(stringLfoGain);
                    stringLfoGain.connect(oscillators[oscIndex].frequency);
                    stringLfo.start(now + 0.1);
                    stringLfo.stop(now + releaseTime);
                }
            
                // Start and stop oscillator with slight timing variation
                const startTime = now + attackJitter * 0.1 + (Math.random() - 0.5) * 0.001;
                oscillators[oscIndex].start(startTime);
                oscillators[oscIndex].stop(now + releaseTime + 0.2);
            });
        }
        
        // Sympathetic string resonance
        this.addSympatheticResonance(frequency, velocityVolume, now, actualDuration);
        
        // Soundboard body resonance
        this.addSoundboardResonance(frequency, velocityVolume, now, actualDuration);
    }
    
    // Add mechanical action noise (key clicks, hammer thumps)
    addActionNoise(frequency, velocity, startTime) {
        // Key click noise
        const clickNoise = this.audioContext.createBufferSource();
        const clickBuffer = this.audioContext.createBuffer(1, 0.005 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        const clickData = clickBuffer.getChannelData(0);
        
        for (let i = 0; i < clickData.length; i++) {
            clickData[i] = (Math.random() - 0.5) * 0.1 * velocity;
        }
        
        const clickGain = this.audioContext.createGain();
        const clickFilter = this.audioContext.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.value = 2000 + Math.random() * 1000;
        
        clickNoise.buffer = clickBuffer;
        clickNoise.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.masterGainNode);
        
        clickGain.gain.setValueAtTime(0.02 * velocity, startTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.01);
        
        clickNoise.start(startTime);
    }
    
    // Add sympathetic string resonance
    addSympatheticResonance(frequency, velocity, startTime, duration) {
        const harmonicFreqs = [frequency * 2, frequency * 3, frequency * 0.5, frequency * 1.5];
        
        harmonicFreqs.forEach((freq, index) => {
            if (freq >= 20 && freq <= 20000) {
                const sympOsc = this.audioContext.createOscillator();
                const sympGain = this.audioContext.createGain();
                const sympFilter = this.audioContext.createBiquadFilter();
                
                sympOsc.frequency.value = freq;
                sympOsc.type = 'sine';
                sympOsc.detune.value = (Math.random() - 0.5) * 5;
                
                sympFilter.type = 'bandpass';
                sympFilter.frequency.value = freq;
                sympFilter.Q.value = 20;
                
                sympOsc.connect(sympFilter);
                sympFilter.connect(sympGain);
                sympGain.connect(this.masterGainNode);
                
                const amp = velocity * 0.015 / (index + 1);
                sympGain.gain.setValueAtTime(0, startTime);
                sympGain.gain.linearRampToValueAtTime(amp, startTime + 0.1);
                sympGain.gain.exponentialRampToValueAtTime(amp * 0.3, startTime + 0.5);
                sympGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.5);
                
                sympOsc.start(startTime + 0.02);
                sympOsc.stop(startTime + duration * 1.5 + 0.1);
            }
        });
    }
    
    // Add soundboard body resonance
    addSoundboardResonance(frequency, velocity, startTime, duration) {
        // Wooden soundboard has characteristic resonant frequencies
        const bodyFreqs = [200, 400, 800, 1200];
        
        bodyFreqs.forEach((bodyFreq, index) => {
            const bodyOsc = this.audioContext.createOscillator();
            const bodyGain = this.audioContext.createGain();
            const bodyFilter = this.audioContext.createBiquadFilter();
            
            bodyOsc.frequency.value = bodyFreq + (Math.random() - 0.5) * 50;
            bodyOsc.type = 'sine';
            
            bodyFilter.type = 'peaking';
            bodyFilter.frequency.value = bodyFreq;
            bodyFilter.Q.value = 3 + Math.random() * 2;
            bodyFilter.gain.value = 2;
            
            bodyOsc.connect(bodyFilter);
            bodyFilter.connect(bodyGain);
            bodyGain.connect(this.masterGainNode);
            
            const coupling = Math.max(0, 1 - Math.abs(frequency - bodyFreq) / bodyFreq);
            const amp = velocity * 0.02 * coupling;
            
            bodyGain.gain.setValueAtTime(0, startTime);
            bodyGain.gain.linearRampToValueAtTime(amp, startTime + 0.05);
            bodyGain.gain.exponentialRampToValueAtTime(amp * 0.4, startTime + 0.3);
            bodyGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.2);
            
            bodyOsc.start(startTime + 0.01);
            bodyOsc.stop(startTime + duration * 1.2 + 0.1);
        });
    }
    
    // Helper function to get MIDI note number
    getNoteNumber(note) {
        const noteMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        const noteName = note.charAt(0);
        const octave = parseInt(note.slice(-1));
        let noteNumber = noteMap[noteName] + (octave + 1) * 12;
        
        // Handle accidentals
        if (note.includes('#')) noteNumber += 1;
        if (note.includes('b')) noteNumber -= 1;
        
        return noteNumber;
    }

    close() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}