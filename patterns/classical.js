// Classical Pattern - Both Hands
export const classical = {
    name: 'Classical (Both Hands)',
    description: 'Classical pattern with Alberti bass in the left hand and a simple melody in the right hand. Typical of the Viennese Classical period.',
    
    // Legacy support - returns left hand pattern
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'G3', 'E3', 'G3'],
            'G': ['G2', 'D3', 'B2', 'D3'],
            'F': ['F3', 'C4', 'A3', 'C4'],
            'Am': ['A2', 'E3', 'C3', 'E3'],
            'Dm': ['D3', 'A3', 'F3', 'A3']
        };
        return patterns[key];
    },
    
    // Left hand - Alberti bass
    leftHand: (key) => {
        const patterns = {
            'C': ['C3', 'G3', 'E3', 'G3'],
            'G': ['G2', 'D3', 'B2', 'D3'],
            'F': ['F3', 'C4', 'A3', 'C4'],
            'Am': ['A2', 'E3', 'C3', 'E3'],
            'Dm': ['D3', 'A3', 'F3', 'A3']
        };
        return patterns[key];
    },
    
    // Right hand - Simple scale melody
    rightHand: (key) => {
        const patterns = {
            'C': ['C5', 'D5', 'E5', 'F5'],
            'G': ['G4', 'A4', 'B4', 'C5'],
            'F': ['F4', 'G4', 'A4', 'Bb4'],
            'Am': ['A4', 'B4', 'C5', 'D5'],
            'Dm': ['D4', 'E4', 'F4', 'G4']
        };
        return patterns[key];
    },
    
    timing: [0.25, 0.25, 0.25, 0.25], // Sixteenth notes
    
    // Legacy fingering - left hand
    fingering: [1, 5, 3, 5],
    
    // Left hand fingering
    leftHandFingering: [1, 5, 3, 5],

    // Right hand fingering
    rightHandFingering: [1, 2, 3, 4],
    
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 110 }
};