// Alberti Bass Pattern
export const alberti = {
    name: 'Alberti-Bass',
    description: 'Ein klassisches Begleitmuster, benannt nach Domenico Alberti. Die Töne eines Akkords werden in der Reihenfolge tief-hoch-mittel-hoch gespielt. Sehr häufig in der Klassik, besonders bei Mozart und Haydn.',
    notation: 'Takt 1: C - G - E - G  |  Takt 2: C - G - E - G\n        (1 - 5 - 3 - 5)      (1 - 5 - 3 - 5)',
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