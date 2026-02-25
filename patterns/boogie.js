// Boogie-Woogie Pattern
export const boogie = {
    name: 'Boogie-Woogie',
    description: 'Swinging blues rhythm with walking bass. The left hand plays a repetitive pattern in eighth notes with swing feel.',
    pattern: () => ['C3', 'E3', 'G3', 'A3', 'Bb3', 'A3', 'G3', 'E3'],
    timing: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    fingering: [5, 4, 3, 2, 1, 2, 3, 4],
    timeSignature: '4/4',
    tempo: { min: 120, max: 160, default: 140 }
};
