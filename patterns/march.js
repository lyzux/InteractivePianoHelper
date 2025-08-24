// March Pattern
export const march = {
    name: 'March',
    description: 'Powerful 4/4 rhythm with alternating bass notes and chords. Typical for military marches and festive music. Bass-chord-bass-chord pattern.',
    
    // Legacy support
    pattern: (key) => {
        const patterns = {
            'C': ['C3', ['E3', 'G3', 'C4'], 'G2', ['E3', 'G3', 'C4']],
            'G': ['G2', ['B2', 'D3', 'G3'], 'D2', ['B2', 'D3', 'G3']],
            'F': ['F3', ['A3', 'C4', 'F4'], 'C3', ['A3', 'C4', 'F4']],
            'Am': ['A2', ['C3', 'E3', 'A3'], 'E2', ['C3', 'E3', 'A3']],
            'Dm': ['D3', ['F3', 'A3', 'D4'], 'A2', ['F3', 'A3', 'D4']]
        };
        return patterns[key];
    },
    
    // Left hand (Bass clef) - March bass pattern only
    leftHand: (key) => {
        const patterns = {
            'C': ['C3', ['E3', 'G3', 'C4'], 'G2', ['E3', 'G3', 'C4']],
            'G': ['G2', ['B2', 'D3', 'G3'], 'D2', ['B2', 'D3', 'G3']],
            'F': ['F3', ['A3', 'C4', 'F4'], 'C3', ['A3', 'C4', 'F4']],
            'Am': ['A2', ['C3', 'E3', 'A3'], 'E2', ['C3', 'E3', 'A3']],
            'Dm': ['D3', ['F3', 'A3', 'D4'], 'A2', ['F3', 'A3', 'D4']]
        };
        return patterns[key];
    },
    
    // No right hand pattern - march accompaniment is left hand only
    
    timing: [1, 1, 1, 1], // Four quarter notes
    
    // Legacy fingering
    fingering: [5, [3, 2, 1], 5, [3, 2, 1]],
    
    // Left hand fingering with stacked chord fingering (corrected: higher notes get lower finger numbers)
    leftHandFingering: [5, [1, 2, 3], 5, [1, 2, 3]],
    
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};