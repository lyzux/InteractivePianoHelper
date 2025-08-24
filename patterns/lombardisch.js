// Lombard Rhythm Pattern
export const lombardisch = {
    name: 'Lombard Rhythm',
    description: 'Characteristic dotted rhythm: short-long. Also called "Scotch Snap".',
    notation: 'Lombard Rhythm:\nC3(short) - G2(long) - E3(short) - C3(long)\nFingering: 1 - 5 - 3 - 1\n(Dotted: short-long)',
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