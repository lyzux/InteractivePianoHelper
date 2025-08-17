// Pattern Loader Module
export class PatternLoader {
    constructor() {
        this.patterns = new Map();
        this.loadedPatterns = [];
    }

    // Register a pattern
    registerPattern(id, pattern) {
        this.patterns.set(id, pattern);
        this.loadedPatterns.push(id);
    }

    // Automatisches Laden aller Patterns aus dem patterns/ Ordner
    async autoLoadPatterns() {
        try {
            console.log('🚀 Starte automatische Pattern-Erkennung...');
            
            // Verwende den Auto-Pattern-Loader
            const { AutoPatternLoader } = await import('./autoPatternLoader.js');
            const autoLoader = new AutoPatternLoader();
            
            // Lade alle Patterns automatisch aus dem Ordner
            const patterns = await autoLoader.loadPatternsFromDirectory();
            
            // Registriere alle gefundenen Patterns
            let registeredCount = 0;
            patterns.forEach((pattern, id) => {
                this.registerPattern(id, pattern);
                registeredCount++;
            });
            
            console.log(`🎉 ${registeredCount} Patterns automatisch registriert!`);
            console.log('📁 Ordner-basierte Auto-Erkennung erfolgreich!');
            
            return registeredCount > 0;
        } catch (error) {
            console.error('❌ Fehler beim automatischen Ordner-Scan:', error);
            return false;
        }
    }

    // Get a pattern by ID
    getPattern(id) {
        return this.patterns.get(id);
    }

    // Get all loaded patterns
    getAllPatterns() {
        return Array.from(this.patterns.entries()).map(([id, pattern]) => ({
            id,
            ...pattern
        }));
    }

    // Load pattern dynamically (for future use)
    async loadPattern(id) {
        try {
            const module = await import(`../patterns/${id}.js`);
            const pattern = module[id];
            if (pattern) {
                this.registerPattern(id, pattern);
                return pattern;
            }
        } catch (error) {
            console.warn(`Failed to load pattern ${id}:`, error);
        }
        return null;
    }

    // Bulk load patterns from a list
    async loadPatterns(patternIds) {
        const promises = patternIds.map(id => this.loadPattern(id));
        const results = await Promise.allSettled(promises);
        
        const loaded = [];
        const failed = [];
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                loaded.push(patternIds[index]);
            } else {
                failed.push(patternIds[index]);
            }
        });
        
        return { loaded, failed };
    }

    // Check if a pattern is loaded
    isPatternLoaded(id) {
        return this.patterns.has(id);
    }

    // Get pattern names for UI
    getPatternOptions() {
        return this.getAllPatterns().map(pattern => ({
            value: pattern.id,
            label: pattern.name
        }));
    }

    // Generate ABC notation for a pattern
    generateABCNotation(patternId, key) {
        const pattern = this.getPattern(patternId);
        if (!pattern) return '';

        const notes = pattern.pattern(key);
        const timing = pattern.timing;
        
        // ABC header
        let abc = 'X:1\n';
        abc += `T:${pattern.name}\n`;
        abc += `K:${key} clef=bass\n`;
        abc += `M:${pattern.timeSignature || '4/4'}\n`;
        abc += 'L:1/4\n';
        
        // Convert notes to ABC notation with fingerings
        let abcNotes = [];
        notes.forEach((note, index) => {
            // Get fingering for this note
            const fingering = pattern.fingering ? pattern.fingering[index % pattern.fingering.length] : '';
            
            // Add fingering annotation BEFORE the note
            let abcNote = '';
            if (fingering && note !== null) {
                if (Array.isArray(fingering)) {
                    abcNote += `"${fingering.join(',')}"`;
                } else {
                    abcNote += `"${fingering}"`;
                }
            }
            
            // Convert note to ABC notation
            abcNote += this.convertToABCNote(note);
            
            // Add rhythm notation based on timing AFTER the note
            const duration = timing[index % timing.length];
            if (duration === 0.25) {
                abcNote += '/4';
            } else if (duration === 0.5) {
                abcNote += '/2';
            } else if (duration === 0.75) {
                abcNote += '3/4';
            } else if (duration === 1.5) {
                abcNote += '3/2';
            } else if (duration === 2) {
                abcNote += '2';
            }
            
            abcNotes.push(abcNote);
        });
        
        abc += abcNotes.join(' ') + ' |\n';
        return abc;
    }

    // Convert note to ABC notation format
    convertToABCNote(note) {
        if (!note) return 'z'; // Rest
        
        if (Array.isArray(note)) {
            // Chord notation in ABC: [CEG]
            return '[' + note.map(this.convertSingleNoteToABC).join('') + ']';
        }
        
        return this.convertSingleNoteToABC(note);
    }
    
    // Helper function to convert single note
    convertSingleNoteToABC(note) {
        let noteName = note.charAt(0);
        let octave = parseInt(note.slice(-1));
        let accidental = note.slice(1, -1);
        
        // Handle accidentals
        if (accidental === '#') {
            noteName = '^' + noteName;
        } else if (accidental === 'b') {
            noteName = '_' + noteName;
        }
        
        // ABC octave notation for bass clef
        if (octave === 1) {
            noteName = noteName.toUpperCase() + ',,,';
        } else if (octave === 2) {
            noteName = noteName.toUpperCase() + ',,';
        } else if (octave === 3) {
            noteName = noteName.toUpperCase() + ',';
        } else if (octave === 4) {
            noteName = noteName.toUpperCase();
        } else if (octave === 5) {
            noteName = noteName.toLowerCase();
        } else if (octave >= 6) {
            noteName = noteName.toLowerCase();
            for (let i = 6; i <= octave; i++) {
                noteName += "'";
            }
        }
        
        return noteName;
    }
}