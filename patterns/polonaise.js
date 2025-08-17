// Polonaise-Bass Pattern
export const polonaise = {
    name: 'Polonaise-Bass',
    description: 'Polnischer Tanz im 3/4-Takt mit charakteristischem Rhythmus. Betonung auf der ersten und dritten Zählzeit.',
    notation: 'Polonaise-Rhythmus:\nC3 - (Pause) - C3 - | G2 - (Pause) - G2\nFingersatz: 5 - - 5 - | 5 - - 5',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', null, 'C3', 'G2', null, 'G2'],
            'G': ['G2', null, 'G2', 'D2', null, 'D2'],
            'F': ['F3', null, 'F3', 'C3', null, 'C3'],
            'Am': ['A2', null, 'A2', 'E2', null, 'E2'],
            'Dm': ['D3', null, 'D3', 'A2', null, 'A2']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1, 1, 1],
    fingering: [5, null, 5, 5, null, 5],
    timeSignature: '3/4',
    tempo: { min: 120, max: 160, default: 140 }
};