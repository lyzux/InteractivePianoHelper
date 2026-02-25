// Waltz Pattern
export const waltz = {
    name: 'Waltz',
    description: 'The classic 3/4 time with emphasis on the first beat. Bass on 1, chord on 2 and 3. Typical for Viennese waltzes and many folk songs.',
    pattern: () => ['C3', ['E3', 'G3'], ['E3', 'G3']],
    timing: [1, 1, 1],
    fingering: [5, [3, 2], [3, 2]],
    leftHandFingering: [5, [2, 3], [2, 3]],
    timeSignature: '3/4',
    tempo: { min: 120, max: 180, default: 160 }
};
