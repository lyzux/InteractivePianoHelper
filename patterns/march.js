// March Pattern
export const march = {
    name: 'Marsch',
    description: 'Kraftvoller 4/4-Rhythmus mit alternierenden Basstönen und Akkorden. Typisch für Militärmärsche und festliche Musik.',
    notation: 'Takt 1: C - (E,G,C) - G - (E,G,C)  |  4/4 Takt\n        (1 -    2    - 3 -    4)        Bass-Akkord-Bass-Akkord',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', ['E3', 'G3', 'C4'], 'G2', ['E3', 'G3', 'C4']],
            'G': ['G2', ['B2', 'D3', 'G3'], 'D2', ['B2', 'D3', 'G3']],
            'F': ['F3', ['A3', 'C4', 'F4'], 'C3', ['A3', 'C4', 'F4']],
            'Am': ['A2', ['C3', 'E3', 'A3'], 'E2', ['C3', 'E3', 'A3']],
            'Dm': ['D3', ['F3', 'A3', 'D4'], 'A2', ['F3', 'A3', 'D4']]
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1],
    fingering: [5, [3, 2, 1], 5, [3, 2, 1]],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};