// Oktav-Bass/Orgelpunkt Pattern
export const oktav = {
    name: 'Oktav-Bass/Orgelpunkt',
    description: 'Konstanter Basston oder Oktavsprünge. Der Grundton bleibt als Orgelpunkt liegen oder springt zur Oktave.',
    notation: 'Orgelpunkt:\nC2 - C3 - C2 - C3\nFingersatz: 5 - 1 - 5 - 1',
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