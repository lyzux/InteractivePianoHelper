// Hymn Pattern - Both Hands
export const hymn = {
    name: 'Chorale/Hymn (Both Hands)',
    description: 'Four-part chorale setting with melody in the right hand (soprano) and bass in the left hand. Typical for church music and chorales.',
    
    // Legacy support - returns left hand pattern
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'F3', 'G3', 'C3'],
            'G': ['G2', 'C3', 'D3', 'G2'],
            'F': ['F3', 'Bb3', 'C4', 'F3'],
            'Am': ['A2', 'D3', 'E3', 'A2'],
            'Dm': ['D3', 'G3', 'A3', 'D3']
        };
        return patterns[key];
    },
    
    // Left hand (Bass clef) - Bass line
    leftHand: (key) => {
        const patterns = {
            'C': ['C3', 'F3', 'G3', 'C3'],
            'G': ['G2', 'C3', 'D3', 'G2'],
            'F': ['F3', 'Bb3', 'C4', 'F3'],
            'Am': ['A2', 'D3', 'E3', 'A2'],
            'Dm': ['D3', 'G3', 'A3', 'D3']
        };
        return patterns[key];
    },
    
    // Right hand (Treble clef) - Three-part harmony (triads)
    rightHand: (key) => {
        const patterns = {
            'C': [['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4']],
            'G': [['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4']],
            'F': [['F4', 'A4', 'C5'], ['Bb4', 'D5', 'F5'], ['C5', 'E5', 'G5'], ['F4', 'A4', 'C5']],
            'Am': [['A3', 'C4', 'E4'], ['D4', 'F4', 'A4'], ['E4', 'G4', 'B4'], ['A3', 'C4', 'E4']],
            'Dm': [['D4', 'F4', 'A4'], ['G4', 'Bb4', 'D5'], ['A4', 'C5', 'E5'], ['D4', 'F4', 'A4']]
        };
        return patterns[key];
    },
    
    timing: [1, 1, 1, 1], // Whole notes - slow and stately
    
    // Legacy fingering - left hand
    fingering: [5, 1, 2, 5],
    
    // Left hand fingering
    leftHandFingering: [5, 1, 2, 5],
    
    // Right hand fingering for triads (highest notes get finger 1)
    rightHandFingering: [[1, 3, 5], [1, 2, 4], [2, 3, 5], [1, 3, 5]],
    
    timeSignature: '4/4',
    tempo: { min: 60, max: 100, default: 80 }
};