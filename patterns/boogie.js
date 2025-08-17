// Boogie-Woogie Pattern
export const boogie = {
    name: 'Boogie-Woogie',
    description: 'Swingender Blues-Rhythmus mit walking bass. Die linke Hand spielt ein repetitives Muster während die rechte Hand improvisiert.',
    notation: 'Walking Bass Pattern:\nC - E - G - A - Bb - A - G - E\n(Shuffle-Rhythmus mit Swing-Feel)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'E3', 'G3', 'A3', 'Bb3', 'A3', 'G3', 'E3'],
            'G': ['G2', 'B2', 'D3', 'E3', 'F3', 'E3', 'D3', 'B2'],
            'F': ['F3', 'A3', 'C4', 'D4', 'Eb4', 'D4', 'C4', 'A3'],
            'Am': ['A2', 'C3', 'E3', 'F3', 'G3', 'F3', 'E3', 'C3'],
            'Dm': ['D3', 'F3', 'A3', 'Bb3', 'C4', 'Bb3', 'A3', 'F3']
        };
        return patterns[key];
    },
    timing: [0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75],
    fingering: [5, 4, 3, 2, 1, 2, 3, 4],
    timeSignature: '4/4',
    tempo: { min: 120, max: 160, default: 140 }
};