// Tango Pattern
export const tango = {
    name: 'Tango',
    description: 'Dramatic Argentinian rhythm with distinctive accents and pauses. Passionate and rhythmically expressive.',
    pattern: () => ['C3', 'C3', 'G2', 'G2', null, 'C3'],
    timing: [0.5, 0.5, 1, 1, 0.5, 0.5],
    fingering: [5, 5, 5, 5, null, 5],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};
