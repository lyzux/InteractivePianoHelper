// Tango Pattern
export const tango = {
    name: 'Tango',
    description: 'Dramatic Argentinian rhythm with distinctive accents and pauses. Passionate and rhythmically expressive.',
    notation: 'Tango Rhythm:\nC3 - C3 - G2 - G2 - (Rest) - C3\n(Staccato with dramatic pauses)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'C3', 'G2', 'G2', null, 'C3'],
            'G': ['G2', 'G2', 'D2', 'D2', null, 'G2'],
            'F': ['F3', 'F3', 'C3', 'C3', null, 'F3'],
            'Am': ['A2', 'A2', 'E2', 'E2', null, 'A2'],
            'Dm': ['D3', 'D3', 'A2', 'A2', null, 'D3']
        };
        return patterns[key];
    },
    timing: [0.5, 0.5, 1, 1, 0.5, 0.5],
    fingering: [5, 5, 5, 5, null, 5],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};