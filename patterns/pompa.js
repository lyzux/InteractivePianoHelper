// Pompa/Hymn Bass Pattern
export const pompa = {
    name: 'Pompa/Hymn Bass',
    description: 'Ceremonial, hymnic bass with strong quarter notes. Typical for marches and church music.',
    notation: 'Pompa Bass:\nC3 - C3 - G2 - G2 - C3 - G2 - C3\nFingering: 1 - 1 - 5 - 5 - 1 - 5 - 1\n(Pompous, ceremonial)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'C3', 'G2', 'G2', 'C3', 'G2', 'C3'],
            'G': ['G2', 'G2', 'D2', 'D2', 'G2', 'D2', 'G2'],
            'F': ['F3', 'F3', 'C3', 'C3', 'F3', 'C3', 'F3'],
            'Am': ['A2', 'A2', 'E2', 'E2', 'A2', 'E2', 'A2'],
            'Dm': ['D3', 'D3', 'A2', 'A2', 'D3', 'A2', 'D3']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1, 1, 1, 1],
    fingering: [1, 1, 5, 5, 1, 5, 1],
    timeSignature: '4/4',
    tempo: { min: 80, max: 120, default: 100 }
};