// Octave Bass/Pedal Point Pattern
export const oktav = {
    name: 'Octave Bass/Pedal Point',
    description: 'Constant bass note or octave jumps. The root note remains as a pedal point or jumps to the octave.',
    pattern: () => ['C2', 'C3', 'C2', 'C3'],
    timing: [1, 1, 1, 1],
    fingering: [5, 1, 5, 1],
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 110 }
};
