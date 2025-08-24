// Bossa Nova Pattern
export const bossa = {
    name: 'Bossa Nova',
    description: 'Brazilian rhythm with syncopated pattern. Soft and flowing, typical for Latin American music.',
    notation: 'Syncopated Pattern:\nC3 - - G3 - C3 - G3 -\n(1 e + a 2 e + a)\nEmphasis on off-beats',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', null, 'G3', null, 'C3', null, 'G3', null],
            'G': ['G2', null, 'D3', null, 'G2', null, 'D3', null],
            'F': ['F3', null, 'C4', null, 'F3', null, 'C4', null],
            'Am': ['A2', null, 'E3', null, 'A2', null, 'E3', null],
            'Dm': ['D3', null, 'A3', null, 'D3', null, 'A3', null]
        };
        return patterns[key];
    },
    timing: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    fingering: [5, null, 3, null, 5, null, 3, null],
    timeSignature: '4/4',
    tempo: { min: 120, max: 160, default: 140 }
};