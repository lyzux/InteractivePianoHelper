// Lombard Rhythm Pattern
export const lombardisch = {
    name: 'Lombard Rhythm',
    description: 'Characteristic dotted rhythm: short-long. Also called "Scotch Snap".',
    pattern: () => ['C3', 'G2', 'E3', 'C3'],
    timing: [0.25, 0.75, 0.25, 0.75],
    fingering: [1, 5, 3, 1],
    timeSignature: '4/4',
    tempo: { min: 100, max: 160, default: 130 }
};
