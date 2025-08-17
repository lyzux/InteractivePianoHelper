// Lombardischer Rhythmus Pattern
export const lombardisch = {
    name: 'Lombardischer Rhythmus',
    description: 'Charakteristischer punktierter Rhythmus: kurz-lang. Auch "Schottischer Snap" genannt.',
    notation: 'Lombardischer Rhythmus:\nC3(kurz) - G2(lang) - E3(kurz) - C3(lang)\nFingersatz: 1 - 5 - 3 - 1\n(Punktiert: kurz-lang)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'G2', 'E3', 'C3'],
            'G': ['G2', 'D2', 'B2', 'G2'],
            'F': ['F3', 'C3', 'A3', 'F3'],
            'Am': ['A2', 'E2', 'C3', 'A2'],
            'Dm': ['D3', 'A2', 'F3', 'D3']
        };
        return patterns[key];
    },
    timing: [0.25, 0.75, 0.25, 0.75],
    fingering: [1, 5, 3, 1],
    timeSignature: '4/4',
    tempo: { min: 100, max: 160, default: 130 }
};