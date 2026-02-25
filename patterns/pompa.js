// Pompa/Hymn Bass Pattern
export const pompa = {
    name: 'Pompa/Hymn Bass',
    description: 'Ceremonial, hymnic bass with strong quarter notes. Typical for marches and church music.',
    pattern: () => ['C3', 'C3', 'G2', 'G2', 'C3', 'G2', 'C3'],
    timing: [1, 1, 1, 1, 1, 1, 1],
    fingering: [1, 1, 5, 5, 1, 5, 1],
    timeSignature: '4/4',
    tempo: { min: 80, max: 120, default: 100 }
};
