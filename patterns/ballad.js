// Ballad Pattern
export const ballad = {
    name: 'Ballad',
    description: 'Calm, emotional accompaniment pattern. Broken chords in slow tempo, ideal for romantic pieces.',
    notation: 'Arpeggiated Chord:\nC3 - E3 - G3 - C4 - G3 - E3\n(Gently flowing, legato)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
            'G': ['G2', 'B2', 'D3', 'G3', 'D3', 'B2'],
            'F': ['F3', 'A3', 'C4', 'F4', 'C4', 'A3'],
            'Am': ['A2', 'C3', 'E3', 'A3', 'E3', 'C3'],
            'Dm': ['D3', 'F3', 'A3', 'D4', 'A3', 'F3']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1, 1, 1],
    fingering: [5, 3, 2, 1, 2, 3],
    timeSignature: '4/4',
    tempo: { min: 60, max: 100, default: 80 }
};