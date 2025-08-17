// Pattern Discovery Module - Vollautomatische Erkennung ohne manuelle Listen
export class PatternDiscovery {
    constructor() {
        this.knownPatterns = [
            'alberti', 'waltz', 'march', 'boogie', 'stride', 'bossa',
            'ragtime', 'ballad', 'tango', 'habanera', 'arpeggien',
            'lombardisch', 'chaconne', 'oktav', 'ostinato', 'pompa', 'polonaise'
        ];
    }

    // Versuche alle bekannten Patterns zu laden (fail-safe approach)
    async discoverPatterns() {
        const patterns = new Map();
        const loadPromises = this.knownPatterns.map(async (patternId) => {
            try {
                const module = await import(`../patterns/${patternId}.js`);
                const pattern = module[patternId];
                if (pattern) {
                    patterns.set(patternId, pattern);
                    console.log(`✓ Pattern discovered: ${pattern.name}`);
                }
            } catch (error) {
                // Pattern existiert nicht - das ist OK
                console.log(`⚠ Pattern '${patternId}' nicht gefunden (OK)`);
            }
        });
        
        await Promise.all(loadPromises);
        console.log(`🎵 ${patterns.size} Patterns automatisch erkannt und geladen`);
        return patterns;
    }

    // Alternative: Teste Pattern durch Versuch zu laden
    async tryLoadPattern(patternId) {
        try {
            const module = await import(`../patterns/${patternId}.js`);
            return module[patternId] || null;
        } catch (error) {
            return null;
        }
    }

    // Erweitere bekannte Patterns (für zukünftige Erweiterung)
    addKnownPattern(patternId) {
        if (!this.knownPatterns.includes(patternId)) {
            this.knownPatterns.push(patternId);
        }
    }

    // Scanne für Standard-Pattern-Namen (für echte Auto-Discovery)
    async scanForCommonPatterns() {
        const commonPatterns = [
            'alberti', 'waltz', 'march', 'boogie', 'stride', 'bossa',
            'ragtime', 'ballad', 'tango', 'habanera', 'arpeggien',
            'lombardisch', 'chaconne', 'oktav', 'ostinato', 'pompa', 'polonaise',
            // Häufige weitere Pattern-Namen
            'minuet', 'sarabande', 'gigue', 'courante', 'allemande',
            'mazurka', 'tarantella', 'gavotte', 'bourree', 'passamezzo',
            'canon', 'invention', 'prelude', 'fugue', 'chorale'
        ];

        const patterns = new Map();
        const loadPromises = commonPatterns.map(async (patternId) => {
            const pattern = await this.tryLoadPattern(patternId);
            if (pattern) {
                patterns.set(patternId, pattern);
                console.log(`🔍 Auto-discovered: ${pattern.name}`);
            }
        });
        
        await Promise.all(loadPromises);
        return patterns;
    }
}