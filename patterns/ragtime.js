// Ragtime Pattern
export const ragtime = {
    name: 'Ragtime',
    description: 'Syncopated American style with "ragged" rhythm. Popular in the early 20th century, known through Scott Joplin.',
    pattern: () => ['C2', ['E3', 'G3'], 'G2', ['E3', 'G3'], 'C2', ['E3', 'G3', 'C4']],
    timing: [1, 0.75, 1, 0.75, 1, 1.5],
    fingering: [5, [3, 2], 5, [3, 2], 5, [3, 2, 1]],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};
