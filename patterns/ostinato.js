// Ostinato-Bass Pattern
export const ostinato = {
    name: 'Ostinato-Bass',
    description: 'Repetitives Bassmuster, das kontinuierlich wiederholt wird. Charakteristisch für Barock und moderne Musik.',
    notation: 'Ostinato-Pattern:\nC3 - G2 - A2 - F2\nFingersatz: 1 - 5 - 4 - 2\n(Kontinuierliche Wiederholung)',
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'G2', 'A2', 'F2'],
            'G': ['G2', 'D2', 'E2', 'C2'],
            'F': ['F3', 'C3', 'D3', 'Bb2'],
            'Am': ['A2', 'E2', 'F2', 'D2'],
            'Dm': ['D3', 'A2', 'Bb2', 'G2']
        };
        return patterns[key];
    },
    timing: [1, 1, 1, 1],
    fingering: [1, 5, 4, 2],
    timeSignature: '4/4',
    tempo: { min: 100, max: 140, default: 120 }
};