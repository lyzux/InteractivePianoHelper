// Habanera Pattern
export const habanera = {
    name: 'Habanera',
    description: 'Kubanischer Rhythmus, bekannt aus Bizets Carmen. Charakteristisches punktiertes Muster mit treibendem Charakter.',
    notation: 'Habanera-Rhythmus:\nC3 (lang) - E3 (kurz) - G3 - G3\n(Punktierter Rhythmus: lang-kurz-kurz-kurz)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'E3', 'G3', 'G3'],
            'G': ['G2', 'B2', 'D3', 'D3'],
            'F': ['F3', 'A3', 'C4', 'C4'],
            'Am': ['A2', 'C3', 'E3', 'E3'],
            'Dm': ['D3', 'F3', 'A3', 'A3']
        };
        return patterns[key];
    },
    timing: [1.5, 0.5, 1, 1],
    fingering: [5, 3, 2, 2],
    timeSignature: '4/4',
    tempo: { min: 110, max: 140, default: 120 }
};