// Stride Piano Pattern
export const stride = {
    name: 'Stride Piano',
    description: 'Jazz style with large leaps between bass and chord. The left hand "strides" across the keyboard.',
    pattern: () => ['C2', ['E3', 'G3', 'C4'], 'G2', ['E3', 'G3', 'C4']],
    timing: [1, 1, 1, 1],
    fingering: [5, [3, 2, 1], 5, [3, 2, 1]],
    timeSignature: '4/4',
    tempo: { min: 100, max: 160, default: 120 }
};
