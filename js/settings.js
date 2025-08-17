// Settings Module - Reusable Settings Component
export class Settings {
    constructor() {
        this.tempo = 120;
        this.sustainEnabled = true;
        this.key = 'C';
        this.callbacks = {
            tempoChange: [],
            sustainChange: [],
            keyChange: []
        };
    }

    init(tempoSliderId, tempoDisplayId, sustainCheckboxId, keySelectId) {
        this.tempoSlider = document.getElementById(tempoSliderId);
        this.tempoDisplay = document.getElementById(tempoDisplayId);
        this.sustainCheckbox = document.getElementById(sustainCheckboxId);
        this.keySelect = document.getElementById(keySelectId);

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

        if (this.keySelect) {
            this.keySelect.addEventListener('change', (e) => {
                this.setKey(e.target.value);
            });
        }
    }

    setTempo(tempo) {
        this.tempo = tempo;
        this.updateTempoDisplay();
        this.notifyCallbacks('tempoChange', tempo);
    }

    setSustain(enabled) {
        this.sustainEnabled = enabled;
        this.notifyCallbacks('sustainChange', enabled);
    }

    setKey(key) {
        this.key = key;
        this.notifyCallbacks('keyChange', key);
    }

    getTempo() {
        return this.tempo;
    }

    getSustain() {
        return this.sustainEnabled;
    }

    getKey() {
        return this.key;
    }

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
        
        if (this.keySelect) {
            this.keySelect.value = this.key;
        }
    }

    // Callback system for external components to listen to changes
    onTempoChange(callback) {
        this.callbacks.tempoChange.push(callback);
    }

    onSustainChange(callback) {
        this.callbacks.sustainChange.push(callback);
    }

    onKeyChange(callback) {
        this.callbacks.keyChange.push(callback);
    }

    notifyCallbacks(event, value) {
        this.callbacks[event].forEach(callback => callback(value));
    }

    // Export settings for saving/loading
    export() {
        return {
            tempo: this.tempo,
            sustainEnabled: this.sustainEnabled,
            key: this.key
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
        if (settingsData.key !== undefined) {
            this.setKey(settingsData.key);
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