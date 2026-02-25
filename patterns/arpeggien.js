// Arpeggien Pattern
export const arpeggien = {
    name: 'Arpeggios (Broken Chords)',
    description: 'Chord tones are played individually in sequence instead of simultaneously. Very melodic and flowing.',
    pattern: () => ['C3', 'E3', 'G3', 'C4', 'G3', 'E3', 'C3'],
    timing: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    fingering: [5, 3, 2, 1, 2, 3, 5],
    timeSignature: '4/4',
    tempo: { min: 80, max: 120, default: 100 }
};
