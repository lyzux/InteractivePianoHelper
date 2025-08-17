// Ragtime Pattern
export const ragtime = {
    name: 'Ragtime',
    description: 'Synkopierter amerikanischer Stil mit "ragged" Rhythmus. Populär im frühen 20. Jahrhundert, bekannt durch Scott Joplin.',
    notation: 'Bass - Akkord - Bass - Akkord (synkopiert)\nC2 - (E3,G3) - G2 - (E3,G3)\nMit charakteristischen Synkopen',
    pattern: (key) => {
        const patterns = {
            'C': ['C2', ['E3', 'G3'], 'G2', ['E3', 'G3'], 'C2', ['E3', 'G3', 'C4']],
            'G': ['G1', ['B2', 'D3'], 'D2', ['B2', 'D3'], 'G1', ['B2', 'D3', 'G3']],
            'F': ['F2', ['A3', 'C4'], 'C2', ['A3', 'C4'], 'F2', ['A3', 'C4', 'F4']],
            'Am': ['A1', ['C3', 'E3'], 'E2', ['C3', 'E3'], 'A1', ['C3', 'E3', 'A3']],
            'Dm': ['D2', ['F3', 'A3'], 'A2', ['F3', 'A3'], 'D2', ['F3', 'A3', 'D4']]
        };
        return patterns[key];
    },
    timing: [1, 0.75, 1, 0.75, 1, 1.5],
    fingering: [5, [3, 2], 5, [3, 2], 5, [3, 2, 1]],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};