// Ballad Pattern
export const ballad = {
    name: 'Ballad',
    description: 'Calm, emotional accompaniment pattern. Broken chords in slow tempo, ideal for romantic pieces.',
    pattern: () => ['C3', 'E3', 'G3', 'C4', 'G3', 'E3'],
    timing: [1, 1, 1, 1, 1, 1],
    fingering: [5, 3, 2, 1, 2, 3],
    timeSignature: '3/4',
    tempo: { min: 60, max: 100, default: 80 }
};
