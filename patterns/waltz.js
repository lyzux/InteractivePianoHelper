// Waltz Pattern
export const waltz = {
    name: 'Walzer',
    description: 'Der klassische 3/4-Takt mit Betonung auf der ersten Zählzeit. Bass auf 1, Akkord auf 2 und 3. Typisch für Wiener Walzer und viele Volkslieder.',
    
    // Legacy support
    pattern: (key) => {
        const patterns = {
            'C': ['C3', ['E3', 'G3'], ['E3', 'G3']],
            'G': ['G2', ['B2', 'D3'], ['B2', 'D3']],
            'F': ['F3', ['A3', 'C4'], ['A3', 'C4']],
            'Am': ['A2', ['C3', 'E3'], ['C3', 'E3']],
            'Dm': ['D3', ['F3', 'A3'], ['F3', 'A3']]
        };
        return patterns[key];
    },
    
    // Bass clef - Traditional waltz bass only
    bassClef: (key) => {
        const patterns = {
            'C': ['C3', ['E3', 'G3'], ['E3', 'G3']],
            'G': ['G2', ['B2', 'D3'], ['B2', 'D3']],
            'F': ['F3', ['A3', 'C4'], ['A3', 'C4']],
            'Am': ['A2', ['C3', 'E3'], ['C3', 'E3']],
            'Dm': ['D3', ['F3', 'A3'], ['F3', 'A3']]
        };
        return patterns[key];
    },
    
    // No treble clef pattern - waltz accompaniment is bass clef only
    
    timing: [1, 1, 1], // Three quarter notes in 3/4 time
    
    // Legacy fingering
    fingering: [5, [3, 2], [3, 2]],
    
    // Bass clef fingering with stacked chord fingering (corrected: higher notes get lower finger numbers)
    bassClefFingering: [5, [2, 3], [2, 3]],
    
    timeSignature: '3/4',
    tempo: { min: 120, max: 180, default: 160 }
};