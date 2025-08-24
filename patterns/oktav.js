// Octave Bass/Pedal Point Pattern
export const oktav = {
    name: 'Octave Bass/Pedal Point',
    description: 'Constant bass note or octave jumps. The root note remains as a pedal point or jumps to the octave.',
    notation: 'Pedal Point:\nC2 - C3 - C2 - C3\nFingering: 5 - 1 - 5 - 1',
    pattern: (key) => {
        const patterns = {
            'C': ['C2', 'C3', 'C2', 'C3'],
            'G': ['G1', 'G2', 'G1', 'G2'],
            'F': ['F2', 'F3', 'F2', 'F3'],
            'Am': ['A1', 'A2', 'A1', 'A2'],
            'Dm': ['D2', 'D3', 'D2', 'D3']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1],
    fingering: [5, 1, 5, 1],
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 110 }
};