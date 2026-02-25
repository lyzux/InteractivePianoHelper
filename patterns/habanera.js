// Habanera Pattern
export const habanera = {
    name: 'Habanera',
    description: "Cuban rhythm, known from Bizet's Carmen. Characteristic dotted pattern with driving character.",
    pattern: () => ['C3', 'E3', 'G3', 'G3'],
    timing: [1.5, 0.5, 1, 1],
    fingering: [5, 3, 2, 2],
    timeSignature: '4/4',
    tempo: { min: 110, max: 140, default: 120 }
};
