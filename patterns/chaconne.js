// Chaconne/Passacaglia Pattern
export const chaconne = {
    name: 'Chaconne/Passacaglia',
    description: 'Baroque variation dance over an ostinato harmonic pattern. Often features chromatic bass descent.',
    pattern: () => ['C3', 'B2', 'Bb2', 'A2', 'Ab2', 'G2'],
    timing: [1, 1, 1, 1, 1, 1],
    fingering: [1, 2, 3, 4, 3, 5],
    timeSignature: '4/4',
    tempo: { min: 80, max: 120, default: 100 }
};
