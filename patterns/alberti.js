// Alberti Bass Pattern
export const alberti = {
    name: 'Alberti-Bass',
    description: 'A classic accompaniment pattern, named after Domenico Alberti. The notes of a chord are played in the order low-high-middle-high. Very common in classical music, especially in Mozart and Haydn. Left hand only.',
    pattern: () => ['C3', 'G3', 'E3', 'G3'],
    timing: [0.25, 0.25, 0.25, 0.25],
    fingering: [1, 5, 3, 5],
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 120 }
};
