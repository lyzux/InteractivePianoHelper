// Settings Module - Reusable Settings Component
export class Settings {
    constructor() {
        this.tempo = 120;
        this.sustainEnabled = true;
        this.swingRatio = 0.5; // 0.5 = straight, 0.75 = heavy swing
        this.callbacks = {
            tempoChange: [],
            sustainChange: []
        };
    }

    init(tempoSliderId, tempoDisplayId, sustainCheckboxId) {
        this.tempoSlider = document.getElementById(tempoSliderId);
        this.tempoDisplay = document.getElementById(tempoDisplayId);
        this.sustainCheckbox = document.getElementById(sustainCheckboxId);

        this.attachEventListeners();
        this.updateDisplays();
    }

    attachEventListeners() {
        if (this.tempoSlider) {
            this.tempoSlider.addEventListener('input', (e) => {
                this.setTempo(parseInt(e.target.value));
            });
        }

        if (this.sustainCheckbox) {
            this.sustainCheckbox.addEventListener('change', (e) => {
                this.setSustain(e.target.checked);
            });
        }

    }

    setTempo(tempo) {
        console.log(`🎵 Settings: Tempo changed to ${tempo} BPM`);
        this.tempo = tempo;
        this.updateTempoDisplay();
        this.notifyCallbacks('tempoChange', tempo);
    }

    setSustain(enabled) {
        this.sustainEnabled = enabled;
        if (this.sustainCheckbox) this.sustainCheckbox.checked = enabled;
        this.notifyCallbacks('sustainChange', enabled);
    }

    setKey() {
        // Legacy no-op: scores now resolve in their authored key.
    }

    getTempo() {
        return this.tempo;
    }

    getSustain() {
        return this.sustainEnabled;
    }

    getKey() {
        return 'C';
    }

    getSwingRatio() { return this.swingRatio; }
    setSwingRatio(r) { this.swingRatio = r; }

    getBeatDuration() {
        return 60000 / this.tempo; // milliseconds per beat
    }

    updateTempoDisplay() {
        if (this.tempoDisplay) {
            this.tempoDisplay.textContent = `${this.tempo} BPM`;
        }
    }

    updateDisplays() {
        this.updateTempoDisplay();
        
        if (this.tempoSlider) {
            this.tempoSlider.value = this.tempo;
        }
        
        if (this.sustainCheckbox) {
            this.sustainCheckbox.checked = this.sustainEnabled;
        }
        
    }

    // Callback system for external components to listen to changes
    onTempoChange(callback) {
        this.callbacks.tempoChange.push(callback);
    }

    onSustainChange(callback) {
        this.callbacks.sustainChange.push(callback);
    }

    onKeyChange() {
        // Legacy no-op: kept so older fallback wiring cannot crash.
    }

    notifyCallbacks(event, value) {
        this.callbacks[event]?.forEach(callback => callback(value));
    }

    // Export settings for saving/loading
    export() {
        return {
            tempo: this.tempo,
            sustainEnabled: this.sustainEnabled,
            swingRatio: this.swingRatio
        };
    }

    // Import settings from saved data
    import(settingsData) {
        if (settingsData.tempo !== undefined) {
            this.setTempo(settingsData.tempo);
        }
        if (settingsData.sustainEnabled !== undefined) {
            this.setSustain(settingsData.sustainEnabled);
        }
        if (settingsData.swingRatio !== undefined) {
            this.setSwingRatio(settingsData.swingRatio);
        }
        this.updateDisplays();
    }

    // Save settings to localStorage
    save() {
        localStorage.setItem('pianoHelperSettings', JSON.stringify(this.export()));
    }

    // Load settings from localStorage
    load() {
        const saved = localStorage.getItem('pianoHelperSettings');
        if (saved) {
            try {
                const settingsData = JSON.parse(saved);
                this.import(settingsData);
            } catch (e) {
                console.warn('Failed to load settings from localStorage:', e);
            }
        }
    }
}
