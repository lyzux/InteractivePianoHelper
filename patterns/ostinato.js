// Ostinato Bass Pattern
export const ostinato = {
    name: 'Ostinato Bass',
    description: 'Repetitive bass pattern that is continuously repeated. Characteristic of Baroque and modern music.',
    notation: 'Ostinato Pattern:\nC3 - G2 - A2 - F2\nFingering: 1 - 5 - 4 - 2\n(Continuous repetition)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'G2', 'A2', 'F2'],
            'G': ['G2', 'D2', 'E2', 'C2'],
            'F': ['F3', 'C3', 'D3', 'Bb2'],
            'Am': ['A2', 'E2', 'F2', 'D2'],
            'Dm': ['D3', 'A2', 'Bb2', 'G2']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1],
    fingering: [1, 5, 4, 2],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};