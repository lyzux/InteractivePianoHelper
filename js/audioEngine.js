// Simple Clean Piano Audio Engine
export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.mainFilter = null;
        this.activeNotes = new Map(); // Track active oscillators for stopping
        this.sustainEnabled = true;  // Mirrors the sustain checkbox; set via setSustainEnabled()
        this.sampleBuffers = new Map(); // sampleKey (e.g. 'Db4') → AudioBuffer

        // Simple piano parameters (6-12 essential controls)
        this.params = {
            // Sample blend (0 = pure synth, 1 = sample dominant)
            sampleBlend: 0.7,

            // Core sound parameters
            volume: 0.3,
            brightness: 0.67,      // Controls high-frequency content
            warmth: 0.72,         // Controls low-frequency emphasis
            attack: 0.01,         // Note attack time
            release: 4.0,         // Note release/sustain time

            // Harmonic content
            harmonics: 0.84,      // Amount of harmonic content
            detune: 0.16,        // Slight detuning for realism

            // Effects (0 = off; these were previously no-ops, defaults restore original sound)
            chorus: 0.0,         // Subtle chorus effect
            roomSize: 0.0,       // Room ambience
            damping: 0.0,        // String damping simulation

            // Piano mechanics
            lidPosition: 1.0,    // Piano lid (0=closed, 1=open); 1.0 = full brightness = original behaviour
            pedalResonance: 0.0  // Sustain pedal resonance
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

            // Master gain
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
            this.harmonicGain.gain.value = 0.6;

            // Post-effects mix bus — dry + chorus + reverb merge here
            this.postFxBus = this.audioContext.createGain();
            this.postFxBus.gain.value = 1.0;

            // --- Chorus: short delay line modulated by a slow LFO ---
            this.chorusDelay = this.audioContext.createDelay(0.1);
            this.chorusDelay.delayTime.value = 0.02; // 20ms base delay
            this.chorusGain = this.audioContext.createGain();
            this.chorusLFO = this.audioContext.createOscillator();
            this.chorusLFOGain = this.audioContext.createGain();
            this.chorusLFO.type = 'sine';
            this.chorusLFO.frequency.value = 0.7; // 0.7 Hz sweep rate
            this.updateChorus(); // sets chorusGain and LFO depth from params
            this.chorusLFO.connect(this.chorusLFOGain);
            this.chorusLFOGain.connect(this.chorusDelay.delayTime);
            this.chorusLFO.start();

            // --- Reverb: ConvolverNode with a synthesised impulse response ---
            this.convolver = this.audioContext.createConvolver();
            this.reverbGain = this.audioContext.createGain();
            this.updateReverb(); // generates impulse buffer and sets reverbGain from params

            // --- Main output filter (brightness × lidPosition) ---
            this.mainFilter = this.audioContext.createBiquadFilter();
            this.mainFilter.type = 'lowpass';
            this.updateFilter();

            // --- Signal routing ---
            // Harmonics → compressor → harmonicGain → masterGain
            this.harmonicCompressor.connect(this.harmonicGain);
            this.harmonicGain.connect(this.masterGain);

            // masterGain → dry → postFxBus
            this.masterGain.connect(this.postFxBus);

            // masterGain → chorusDelay → chorusGain → postFxBus  (wet chorus)
            this.masterGain.connect(this.chorusDelay);
            this.chorusDelay.connect(this.chorusGain);
            this.chorusGain.connect(this.postFxBus);

            // masterGain → convolver → reverbGain → postFxBus  (wet reverb)
            this.masterGain.connect(this.convolver);
            this.convolver.connect(this.reverbGain);
            this.reverbGain.connect(this.postFxBus);

            // postFxBus → mainFilter → destination
            this.postFxBus.connect(this.mainFilter);
            this.mainFilter.connect(this.audioContext.destination);

            // Load piano samples in the background (notes play synth-only until done)
            this._loadSamples();
        }
    }

    updateFilter() {
        if (!this.mainFilter) return;
        const baseFreq = 800;
        const maxFreq = 4000;
        const brightnessFreq = baseFreq + this.params.brightness * (maxFreq - baseFreq);
        // lidPosition: 0=closed (muffled, 60% of brightness freq), 1=open (full brightness freq)
        const lidMultiplier = 0.6 + this.params.lidPosition * 0.4;
        this.mainFilter.frequency.value = brightnessFreq * lidMultiplier;
        this.mainFilter.Q.value = 0.5;
    }

    updateChorus() {
        // chorus=0: silent wet path; chorus=1: 40% wet, ±8ms LFO sweep
        if (this.chorusGain) {
            this.chorusGain.gain.value = this.params.chorus * 0.4;
        }
        if (this.chorusLFOGain) {
            this.chorusLFOGain.gain.value = this.params.chorus * 0.008;
        }
    }

    updateReverb() {
        // Generates a stereo impulse response and assigns it to the ConvolverNode.
        // roomSize=0: ~0.1s very dry; roomSize=1: ~2.6s long hall, 35% wet.
        if (!this.audioContext || !this.convolver) return;
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.1 + this.params.roomSize * 2.5;
        const decay = 1.5 + (1 - this.params.roomSize) * 3; // slower decay for larger rooms
        const length = Math.floor(sampleRate * duration);
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        this.convolver.buffer = impulse;
        if (this.reverbGain) {
            this.reverbGain.gain.value = this.params.roomSize * 0.35;
        }
    }

    /** Maps any note name (including sharps) to the flat-based key used in sampleBuffers. */
    _toSampleKey(noteName) {
        const SHARP_TO_FLAT = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
        const m = noteName.match(/^([A-G][#b]?)(\d+)$/);
        if (!m) return null;
        const [, pitch, octave] = m;
        return (SHARP_TO_FLAT[pitch] ?? pitch) + octave;
    }

    /** Fetches and decodes all 88 MP3 samples in parallel. Failed fetches are silently skipped. */
    async _loadSamples() {
        const BASE = './third-party/piano-mp3/';
        const KEYS = [
            'A0','Bb0','B0',
            'C1','Db1','D1','Eb1','E1','F1','Gb1','G1','Ab1','A1','Bb1','B1',
            'C2','Db2','D2','Eb2','E2','F2','Gb2','G2','Ab2','A2','Bb2','B2',
            'C3','Db3','D3','Eb3','E3','F3','Gb3','G3','Ab3','A3','Bb3','B3',
            'C4','Db4','D4','Eb4','E4','F4','Gb4','G4','Ab4','A4','Bb4','B4',
            'C5','Db5','D5','Eb5','E5','F5','Gb5','G5','Ab5','A5','Bb5','B5',
            'C6','Db6','D6','Eb6','E6','F6','Gb6','G6','Ab6','A6','Bb6','B6',
            'C7','Db7','D7','Eb7','E7','F7','Gb7','G7','Ab7','A7','Bb7','B7',
            'C8','Db8'
        ];
        await Promise.all(KEYS.map(async key => {
            try {
                const resp = await fetch(`${BASE}${key}.mp3`);
                if (!resp.ok) return;
                const buf = await this.audioContext.decodeAudioData(await resp.arrayBuffer());
                this.sampleBuffers.set(key, buf);
            } catch (_) { /* graceful fallback to synth-only for this note */ }
        }));
        console.log(`Loaded ${this.sampleBuffers.size} piano samples`);
    }

    setParam(name, value) {
        if (this.params.hasOwnProperty(name)) {
            this.params[name] = value;

            // Update audio components based on parameter changes
            if (name === 'volume' && this.masterGain) {
                this.masterGain.gain.value = value;
            } else if (name === 'brightness' || name === 'lidPosition') {
                this.updateFilter();
            } else if (name === 'chorus') {
                this.updateChorus();
            } else if (name === 'roomSize') {
                this.updateReverb();
            }
            // damping, pedalResonance, warmth, attack, release, harmonics, detune:
            // per-note parameters — take effect on the next note played
        }
    }

    getParam(name) {
        return this.params[name] || 0;
    }

    setSustainEnabled(enabled) {
        this.sustainEnabled = enabled;
    }

    playNote(note, duration = 0.5, useSustain = true, velocity = 0.8, startTime = null) {
        this.init();

        if (Array.isArray(note)) {
            note.forEach(n => this.playNote(n, duration, useSustain, velocity, startTime));
            return;
        }

        const frequency = this.noteFrequencies[note];
        if (!frequency) return;

        const now = startTime ?? this.audioContext.currentTime;
        const isManualClick = duration > 5;

        // For manual clicks, stop existing note to prevent accumulation
        if (isManualClick) {
            this.forceStopNote(note, now);
        }

        // For automatic playback, just play the note for its exact duration - no complex logic needed
        const actualDuration = useSustain ? duration * this.params.release : duration;

        this.createCleanPianoNote(note, frequency, velocity, now, actualDuration, isManualClick, useSustain);
    }

    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    }

    stopNote(note) {
        if (this.activeNotes.has(note)) {
            const noteData = this.activeNotes.get(note);
            const now = this.audioContext ? this.audioContext.currentTime : 0;

            // Check sustain pedal setting (kept in sync via setSustainEnabled())
            const sustainEnabled = this.sustainEnabled;

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

            // Sample fades with the fundamental and stops after release
            if (noteData.sampleLevelGain && noteData.sampleLevelGain.gain) {
                noteData.sampleLevelGain.gain.cancelScheduledValues(now);
                noteData.sampleLevelGain.gain.setValueAtTime(noteData.sampleLevelGain.gain.value, now);
                noteData.sampleLevelGain.gain.exponentialRampToValueAtTime(0.001, now + fundamentalReleaseTime);
            }
            if (noteData.sampleSource) {
                try { noteData.sampleSource.stop(now + fundamentalReleaseTime + 0.05); } catch (_) {}
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
                        harmGain.gain.cancelScheduledValues(currentTime);
                        harmGain.gain.setValueAtTime(harmGain.gain.value, currentTime);
                        harmGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
                    }
                });
            }

            if (noteData.sampleLevelGain && noteData.sampleLevelGain.gain) {
                noteData.sampleLevelGain.gain.cancelScheduledValues(currentTime);
                noteData.sampleLevelGain.gain.setValueAtTime(noteData.sampleLevelGain.gain.value, currentTime);
                noteData.sampleLevelGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
            }
            if (noteData.sampleSource) {
                try { noteData.sampleSource.stop(currentTime + 0.02); } catch (_) {}
            }

            this.activeNotes.delete(key);
        });
    }

    createCleanPianoNote(noteName, frequency, velocity, startTime, duration, isManualClick = false, useSustain = true) {
        // Simple approach: For manual clicks use note name, for automatic use unique key
        const noteKey = isManualClick ? noteName : `${noteName}_${startTime}_${Math.random()}`;

        // Create fundamental tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const noteFilter = this.audioContext.createBiquadFilter();

        // Use triangle wave for warm, non-harsh tone
        osc.type = 'triangle';
        osc.frequency.value = frequency + (this.params.detune * (Math.random() - 0.5) * 10);

        // Per-note lowpass filter — starts bright, sweeps down based on damping
        noteFilter.type = 'lowpass';
        noteFilter.Q.value = 0.3;
        const initialCutoff = frequency * (2 + this.params.brightness);
        noteFilter.frequency.setValueAtTime(initialCutoff, startTime);
        if (this.params.damping > 0.05) {
            // Higher damping = more aggressive high-frequency rolloff during decay
            const finalCutoff = Math.max(initialCutoff * (1 - this.params.damping * 0.85), 50);
            const sweepTime = duration > 5
                ? 1.0 + (1 - this.params.damping) * 3.0   // manual hold: 1–4 s
                : duration * (0.3 + (1 - this.params.damping) * 0.5); // auto: 30–80% of note
            noteFilter.frequency.exponentialRampToValueAtTime(
                finalCutoff,
                startTime + this.params.attack + sweepTime
            );
        }

        // Connect: Oscillator → Filter → Gain → Master
        osc.connect(noteFilter);
        noteFilter.connect(gain);
        gain.connect(this.masterGain);

        // Determine if a sample is available to blend in
        const sampleKey = this._toSampleKey(noteName);
        const hasSample = this.params.sampleBlend > 0.001 && this.sampleBuffers.has(sampleKey);

        // Envelope with sustain (no automatic fade for long notes)
        // Synth amplitude is reduced when a sample is present (sample fills the gap)
        const amplitude = 0.3 * velocity * (hasSample ? (1 - this.params.sampleBlend * 0.75) : 1.0);
        const attackTime = this.params.attack;
        const warmthBoost = this.params.warmth;
        const sustainLevel = amplitude * 0.7;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(amplitude * (0.8 + warmthBoost * 0.2), startTime + attackTime);
        gain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + 0.1);

        // Manual clicks hold at sustain level; automatic (player) notes always fade.
        // Note: `isManualClick` is computed from the *original* duration parameter in
        // playNote(), NOT from `actualDuration` (which can exceed 5 s for slow-tempo
        // patterns with sustain on).  Using `duration > 5` here would incorrectly hold
        // automatic notes at sustainLevel when actualDuration > 5.
        if (isManualClick) {
            // Hold at sustain level — will be stopped manually via stopNote()
            gain.gain.setValueAtTime(sustainLevel, startTime + duration - 1);
        } else {
            // Normal fade for automatic (player) notes
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
            const { oscillators: harmOscs, gains: harmGains } = this.addHarmonic(noteName, frequency, velocity, startTime, duration, isManualClick);
            oscillators.push(...harmOscs);
            harmonicGains = harmGains;
            harmonicOscillators = harmOscs;
        }

        // Sample path: AudioBufferSourceNode → sampleLevelGain → masterGain (parallel to synth)
        // The sample preserves its natural piano attack; we only schedule a fade on sampleLevelGain.
        let sampleSource = null, sampleLevelGain = null;
        if (hasSample) {
            sampleSource = this.audioContext.createBufferSource();
            sampleSource.buffer = this.sampleBuffers.get(sampleKey);
            sampleLevelGain = this.audioContext.createGain();
            const sampleAmp = this.params.sampleBlend * 0.5 * velocity;
            sampleLevelGain.gain.setValueAtTime(sampleAmp, startTime);
            sampleSource.connect(sampleLevelGain);
            sampleLevelGain.connect(this.masterGain);
            // start() must be called before stop() — calling stop() on an unstarted
            // AudioBufferSourceNode throws InvalidStateError per the Web Audio spec.
            sampleSource.start(startTime);
            if (!isManualClick) {
                sampleLevelGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                sampleSource.stop(startTime + duration + 0.05);
            }
        }

        // Pedal resonance: sympathetic string bloom when sustain is engaged.
        // Adds a faint 2nd-harmonic sine that blooms in ~150ms then fades, simulating
        // other strings resonating sympathetically with the sustain pedal held down.
        if (useSustain && this.params.pedalResonance > 0.05) {
            const resOsc = this.audioContext.createOscillator();
            const resGain = this.audioContext.createGain();
            resOsc.type = 'sine';
            resOsc.frequency.value = frequency * 2; // 2nd harmonic sympathetic resonance
            const resAmp = 0.012 * this.params.pedalResonance * velocity;
            const resDur = duration > 5
                ? 4.0                                           // manual hold: bloom for ~4 s then fade
                : duration * (1 + this.params.pedalResonance * 0.5); // auto: slightly longer than note
            resGain.gain.setValueAtTime(0, startTime);
            resGain.gain.linearRampToValueAtTime(resAmp, startTime + 0.15); // delayed bloom
            resGain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(resDur, 0.2));
            resOsc.connect(resGain);
            resGain.connect(this.masterGain);
            resOsc.start(startTime);
            resOsc.stop(startTime + Math.max(resDur, 0.2) + 0.1);
            oscillators.push(resOsc); // tracked for early stop; gain fades on its own schedule
        }

        // Store note data for potential stopping
        this.activeNotes.set(noteKey, {
            oscillators: oscillators,
            gain: gain,
            harmonicGains: harmonicGains,
            harmonicOscillators: harmonicOscillators,
            sampleSource: sampleSource,
            sampleLevelGain: sampleLevelGain,
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

    addHarmonic(noteName, frequency, velocity, startTime, duration, isManualClick = false) {
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

        // Manual clicks hold at sustain level; automatic (player) notes always fade.
        if (isManualClick) {
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
