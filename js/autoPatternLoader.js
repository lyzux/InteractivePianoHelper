// Auto Pattern Loader - Erkennt automatisch alle .js Dateien im patterns/ Ordner
export class AutoPatternLoader {
    constructor() {
        this.patterns = new Map();
    }

    // Lade alle .js Dateien aus dem patterns/ Ordner automatisch
    async loadPatternsFromDirectory() {
        console.log('🔍 Scanne patterns/ Ordner nach .js Dateien...');
        
        // Erweiterte Liste aller möglichen Pattern-Namen
        const possiblePatterns = [
            // Aktuelle Patterns
            'alberti', 'waltz', 'march', 'boogie', 'stride', 'bossa', 'ragtime', 'ballad',
            'tango', 'habanera', 'arpeggien', 'lombardisch', 'chaconne', 'oktav', 
            'ostinato', 'pompa', 'polonaise',
            
            // Klassische Formen
            'minuet', 'menuett', 'sarabande', 'gigue', 'courante', 'allemande',
            
            // Tänze
            'mazurka', 'tarantella', 'gavotte', 'bourree', 'passamezzo', 'pavane',
            'galliard', 'volta', 'forlane', 'musette',
            
            // Jazz/Blues
            'blues', 'swing', 'bebop', 'latin', 'samba', 'rumba', 'mambo', 'cha-cha',
            
            // Moderne Stile
            'rock', 'pop', 'funk', 'gospel', 'country', 'folk', 'celtic',
            
            // Barock
            'invention', 'fugue', 'prelude', 'canon', 'chorale', 'passacaglia'
        ];

        let loadedCount = 0;
        const loadResults = [];
        
        // Lade alle möglichen Patterns parallel
        const loadPromises = possiblePatterns.map(async (patternName) => {
            return await this.tryLoadPattern(patternName);
        });

        const results = await Promise.all(loadPromises);
        
        // Sammle erfolgreiche Loads
        results.forEach((result) => {
            if (result) {
                this.patterns.set(result.id, result.pattern);
                loadedCount++;
                console.log(`✅ Auto-geladen: ${result.pattern.name} (${result.id}.js)`);
            }
        });

        console.log(`🎵 ${loadedCount} Pattern-Dateien automatisch erkannt und geladen!`);
        
        if (loadedCount === 0) {
            console.warn('⚠️ Keine Pattern-Dateien gefunden - verwende Fallback');
            this.createFallbackPattern();
        }

        return this.patterns;
    }

    // Hilfsfunktion: Versuche ein einzelnes Pattern zu laden
    async tryLoadPattern(patternName) {
        try {
            const module = await import(`../patterns/${patternName}.js`);
            const pattern = module[patternName];
            
            if (pattern && pattern.name) {
                return { id: patternName, pattern };
            }
        } catch (error) {
            // Datei existiert nicht oder hat Fehler - das ist OK
        }
        return null;
    }

    // Fallback: Erstelle mindestens ein Pattern wenn nichts gefunden wird
    createFallbackPattern() {
        const fallbackPattern = {
            name: 'Alberti-Bass (Fallback)',
            description: 'Ein klassisches Begleitmuster - Fallback wenn keine Pattern-Dateien gefunden werden.',
            notation: 'C - G - E - G (1 - 5 - 3 - 5)',
            pattern: (key) => {
                const patterns = {
                    'C': ['C3', 'G3', 'E3', 'G3'],
                    'G': ['G2', 'D3', 'B2', 'D3'],
                    'F': ['F3', 'C4', 'A3', 'C4'],
                    'Am': ['A2', 'E3', 'C3', 'E3'],
                    'Dm': ['D3', 'A3', 'F3', 'A3']
                };
                return patterns[key];
            },
            timing: [1, 1, 1, 1],
            fingering: [1, 5, 3, 5],
            timeSignature: '4/4',
            tempo: { min: 80, max: 140, default: 120 }
        };
        
        this.patterns.set('alberti-fallback', fallbackPattern);
        console.log('🔧 Fallback-Pattern erstellt: Alberti-Bass');
    }

    // Alle geladenen Patterns zurückgeben
    getAllPatterns() {
        return this.patterns;
    }

    // Einzelnes Pattern laden (für dynamisches Nachladen)
    async loadSinglePattern(patternName) {
        try {
            const module = await import(`../patterns/${patternName}.js`);
            const pattern = module[patternName];
            
            if (pattern) {
                this.patterns.set(patternName, pattern);
                console.log(`✅ Nachgeladen: ${pattern.name}`);
                return pattern;
            }
        } catch (error) {
            console.log(`❌ Kann ${patternName}.js nicht laden:`, error.message);
        }
        return null;
    }
}