// Stride Piano Pattern
export const stride = {
    name: 'Stride Piano',
    description: 'Jazz-Stil mit großen Sprüngen zwischen Bass und Akkord. Die linke Hand "schreitet" über die Tastatur.',
    notation: 'Takt 1: C2 - (E3,G3,C4) - G2 - (E3,G3,C4)\n        Bass - Akkord - Bass - Akkord\n        (Große Sprünge zwischen tiefen und hohen Tönen)',
    pattern: (key) => {
        const patterns = {
            'C': ['C2', ['E3', 'G3', 'C4'], 'G2', ['E3', 'G3', 'C4']],
            'G': ['G1', ['B2', 'D3', 'G3'], 'D2', ['B2', 'D3', 'G3']],
            'F': ['F2', ['A3', 'C4', 'F4'], 'C2', ['A3', 'C4', 'F4']],
            'Am': ['A1', ['C3', 'E3', 'A3'], 'E2', ['C3', 'E3', 'A3']],
            'Dm': ['D2', ['F3', 'A3', 'D4'], 'A2', ['F3', 'A3', 'D4']]
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1],
    fingering: [5, [3, 2, 1], 5, [3, 2, 1]],
    timeSignature: '4/4',
    tempo: { min: 100, max: 160, default: 120 }
};