// Chaconne/Passacaglia Pattern
export const chaconne = {
    name: 'Chaconne/Passacaglia',
    description: 'Baroque variation dance over an ostinato harmonic pattern. Often features chromatic bass descent.',
    notation: 'Chaconne Bass (Tetrachord):\nC3 - B2 - Bb2 - A2 - Ab2 - G2\nFingering: 1 - 2 - 3 - 4 - 3 - 5\n(Chromatic descent)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'B2', 'Bb2', 'A2', 'Ab2', 'G2'],
            'G': ['G2', 'F#2', 'F2', 'E2', 'Eb2', 'D2'],
            'F': ['F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3'],
            'Am': ['A2', 'G#2', 'G2', 'F#2', 'F2', 'E2'],
            'Dm': ['D3', 'C#3', 'C3', 'B2', 'Bb2', 'A2']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1, 1, 1],
    fingering: [1, 2, 3, 4, 3, 5],
    timeSignature: '4/4',
    tempo: { min: 80, max: 120, default: 100 }
};