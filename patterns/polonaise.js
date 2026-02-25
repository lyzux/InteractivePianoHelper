// Polonaise Bass Pattern
export const polonaise = {
    name: 'Polonaise Bass',
    description: 'Polish dance in 3/4 time with characteristic rhythm. Emphasis on the first and third beats.',
    pattern: () => ['C3', null, 'C3', 'G2', null, 'G2'],
    timing: [1, 1, 1, 1, 1, 1],
    fingering: [5, null, 5, 5, null, 5],
    timeSignature: '3/4',
    tempo: { min: 120, max: 160, default: 140 }
};
