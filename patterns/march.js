// March Pattern
export const march = {
    name: 'March',
    description: 'Powerful 4/4 rhythm with alternating bass notes and chords. Typical for military marches and festive music. Bass-chord-bass-chord pattern.',
    pattern: () => ['C3', ['E3', 'G3', 'C4'], 'G2', ['E3', 'G3', 'C4']],
    timing: [1, 1, 1, 1],
    fingering: [5, [3, 2, 1], 5, [3, 2, 1]],
    leftHandFingering: [5, [1, 2, 3], 5, [1, 2, 3]],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};
