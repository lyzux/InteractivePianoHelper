// Boogie-Woogie Pattern
export const boogie = {
    name: 'Boogie-Woogie',
    description: 'Swinging blues rhythm with walking bass. The left hand plays a repetitive pattern in eighth notes with swing feel.',
    
    // Legacy support
    pattern: (key) => {
        const patterns = {
            'C': ['C3', 'E3', 'G3', 'A3', 'Bb3', 'A3', 'G3', 'E3'],
            'G': ['G2', 'B2', 'D3', 'E3', 'F3', 'E3', 'D3', 'B2'],
            'F': ['F3', 'A3', 'C4', 'D4', 'Eb4', 'D4', 'C4', 'A3'],
            'Am': ['A2', 'C3', 'E3', 'F3', 'G3', 'F3', 'E3', 'C3'],
            'Dm': ['D3', 'F3', 'A3', 'Bb3', 'C4', 'Bb3', 'A3', 'F3']
        };
        return patterns[key];
    },
    
    // Left hand (Bass clef) - Walking bass line only
    leftHand: (key) => {
        const patterns = {
            'C': ['C3', 'E3', 'G3', 'A3', 'Bb3', 'A3', 'G3', 'E3'],
            'G': ['G2', 'B2', 'D3', 'E3', 'F3', 'E3', 'D3', 'B2'],
            'F': ['F3', 'A3', 'C4', 'D4', 'Eb4', 'D4', 'C4', 'A3'],
            'Am': ['A2', 'C3', 'E3', 'F3', 'G3', 'F3', 'E3', 'C3'],
            'Dm': ['D3', 'F3', 'A3', 'Bb3', 'C4', 'Bb3', 'A3', 'F3']
        };
        return patterns[key];
    },
    
    // No right hand pattern - boogie woogie bass is left hand only
    
    timing: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // Eighth notes
    
    // Legacy fingering
    fingering: [5, 4, 3, 2, 1, 2, 3, 4],
    
    // Left hand fingering
    leftHandFingering: [5, 4, 3, 2, 1, 2, 3, 4],
    
    timeSignature: '4/4',
    tempo: { min: 120, max: 160, default: 140 }
};