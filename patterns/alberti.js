// Alberti Bass Pattern
export const alberti = {
    name: 'Alberti-Bass',
    description: 'Ein klassisches Begleitmuster, benannt nach Domenico Alberti. Die Töne eines Akkords werden in der Reihenfolge tief-hoch-mittel-hoch gespielt. Sehr häufig in der Klassik, besonders bei Mozart und Haydn. Nur linke Hand.',
    
    // Legacy support
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
    
    // Bass clef - Alberti bass pattern only
    bassClef: (key) => {
        const patterns = {
            'C': ['C3', 'G3', 'E3', 'G3'],
            'G': ['G2', 'D3', 'B2', 'D3'],
            'F': ['F3', 'C4', 'A3', 'C4'],
            'Am': ['A2', 'E3', 'C3', 'E3'],
            'Dm': ['D3', 'A3', 'F3', 'A3']
        };
        return patterns[key];
    },
    
    // No treble clef pattern - Alberti bass is bass clef only
    
    timing: [0.25, 0.25, 0.25, 0.25], // Sixteenth notes
    
    // Legacy fingering
    fingering: [1, 5, 3, 5],
    
    // Bass clef fingering (textbook correct)
    bassClefFingering: [1, 5, 3, 5],
    
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 120 }
};