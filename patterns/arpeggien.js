// Arpeggien Pattern
export const arpeggien = {
    name: 'Arpeggien (aufgebrochene Akkorde)',
    description: 'Akkordtöne werden einzeln nacheinander gespielt statt gleichzeitig. Sehr melodisch und fließend.',
    notation: 'Arpeggio:\nC3 - E3 - G3 - C4 - G3 - E3 - C3\nFingersatz: 5 - 3 - 2 - 1 - 2 - 3 - 5\n(Legato, melodisch)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'E3', 'G3', 'C4', 'G3', 'E3', 'C3'],
            'G': ['G2', 'B2', 'D3', 'G3', 'D3', 'B2', 'G2'],
            'F': ['F3', 'A3', 'C4', 'F4', 'C4', 'A3', 'F3'],
            'Am': ['A2', 'C3', 'E3', 'A3', 'E3', 'C3', 'A2'],
            'Dm': ['D3', 'F3', 'A3', 'D4', 'A3', 'F3', 'D3']
        };
        return patterns[key];
    },
    timing: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    fingering: [5, 3, 2, 1, 2, 3, 5],
    timeSignature: '4/4',
    tempo: { min: 80, max: 120, default: 100 }
};