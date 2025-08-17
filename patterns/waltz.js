// Waltz Pattern
export const waltz = {
    name: 'Walzer',
    description: 'Der klassische 3/4-Takt mit Betonung auf der ersten Zählzeit. Bass auf 1, Akkord auf 2 und 3. Typisch für Wiener Walzer und viele Volkslieder.',
    notation: 'Takt 1: C - (E,G) - (E,G)  |  3/4 Takt\n        (1 -   2   -   3)       Boom - Cha - Cha',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', ['E3', 'G3'], ['E3', 'G3']],
            'G': ['G2', ['B2', 'D3'], ['B2', 'D3']],
            'F': ['F3', ['A3', 'C4'], ['A3', 'C4']],
            'Am': ['A2', ['C3', 'E3'], ['C3', 'E3']],
            'Dm': ['D3', ['F3', 'A3'], ['F3', 'A3']]
        };
        return patterns[key];
    },
    timing: [1.5, 1, 1],
    fingering: [5, [3, 2], [3, 2]],
    timeSignature: '3/4',
    tempo: { min: 120, max: 180, default: 160 }
};