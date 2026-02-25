// Ostinato Bass Pattern
export const ostinato = {
    name: 'Ostinato Bass',
    description: 'Repetitive bass pattern that is continuously repeated. Characteristic of Baroque and modern music.',
    pattern: () => ['C3', 'G2', 'A2', 'F2'],
    timing: [1, 1, 1, 1],
    fingering: [1, 5, 4, 2],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};
