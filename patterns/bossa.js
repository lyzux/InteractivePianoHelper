// Bossa Nova Pattern
export const bossa = {
    name: 'Bossa Nova',
    description: 'Brazilian rhythm with syncopated pattern. Soft and flowing, typical for Latin American music.',
    pattern: () => ['C3', null, 'G3', null, 'C3', null, 'G3', null],
    timing: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    fingering: [5, null, 3, null, 5, null, 3, null],
    timeSignature: '4/4',
    tempo: { min: 120, max: 160, default: 140 }
};
