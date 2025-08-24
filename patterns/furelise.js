// Für Elise Pattern - Beethoven's Original Opening (Authentic)
export const furelise = {
    name: 'Für Elise (Original)',
    description: 'Beethoven\'s authentic "Für Elise" - the complete opening theme for both hands, exactly as composed in the original.',
    
    // Legacy support - returns right hand melody (original A minor only)
    pattern: (key) => {
        if (key === 'Am') {
            return [
                // First phrase: E-D#-E-D#-E-B-D-C-A
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
                // Rest and bass pickup
                null, null, 'C4', 'E4', 'A4',
                // Second phrase: B
                'B4', null, null, 'E4', 'G#4', 'B4',
                // Third phrase: C
                'C5', null, null, 'E4',
                // Return of main theme
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
                // Final phrase
                null, null, 'C4', 'E4', 'A4', 'B4', null, null, 'E4', 'C5', 'B4', 'A4'
            ];
        }
        // Simplified version for other keys
        return ['E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4'];
    },
    
    // Treble clef - Extended authentic melody (A and B sections)
    trebleClef: (key) => {
        if (key === 'Am') {
            return [
                // A Section - Opening theme (measures 1-8)
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
                null, null, 'C4', 'E4', 'A4',
                'B4', null, null, 'E4', 'G#4', 'B4',
                'C5', null, null, 'E4',
                
                // A Section repeat (measures 9-16)
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
                null, null, 'C4', 'E4', 'A4', 
                'B4', null, null, 'E4', 'C5', 'B4', 'A4', null,
                
                // B Section - Middle section in C major (measures 17-24)
                'G4', 'C5', 'D5', 'E5', null, null, 'G4', 'F5', 'E5', 'D5',
                null, null, 'F4', 'E5', 'D5', 'C5',
                null, null, 'E4', 'D5', 'C5', 'B4',
                null, null, 'E4',
                
                // B Section development (measures 25-32) 
                'E5', 'E5', null, 'E5', 'E6', null, 'D#5', 'E5',
                null, null, null, 'B4', 'E5', 'D#5', 'E5',
                null, null, null, 'B4', 'E5', 'D#5', 'E5', 'D#5',
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'D#5', 'E5',
                
                // Return to A Section (measures 33-40)
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
                null, null, 'C4', 'E4', 'A4',
                'B4', null, null, 'E4', 'G#4', 'B4',
                'C5', null, null, 'E4',
                
                // Final A Section (measures 41-48)
                'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
                null, null, 'C4', 'E4', 'A4',
                'B4', null, null, 'E4', 'C5', 'B4', 'A4'
            ];
        }
        // For other keys, return simplified version
        const transposed = {
            'C': ['G5', 'F#5', 'G5', 'F#5', 'G5', 'D5', 'F5', 'E5', 'C5'],
            'G': ['D5', 'C#5', 'D5', 'C#5', 'D5', 'A4', 'C5', 'B4', 'G4'],
            'F': ['C5', 'B4', 'C5', 'B4', 'C5', 'G4', 'Bb4', 'A4', 'F4'],
            'Dm': ['A4', 'G#4', 'A4', 'G#4', 'A4', 'E4', 'G4', 'F4', 'D4']
        };
        return transposed[key] || transposed['C'];
    },
    
    // Bass clef - Extended authentic accompaniment
    bassClef: (key) => {
        if (key === 'Am') {
            return [
                // A Section - measures 1-8
                null, null, null, null, null, null, null, null, null,
                'A2', 'E3', null, null, null,
                'E2', 'E3', 'G#3', null, null, null,
                'A2', 'E3', 'A3', null,
                
                // A Section repeat - measures 9-16
                null, null, null, null, null, null, null, null, null,
                'A2', 'E3', null, null, null,
                'E2', 'E3', 'G#3', null, 'E3', 'A3', 'C4', null,
                
                // B Section - C major section (measures 17-24)
                'C3', 'G3', 'C4', 'G3', null, null, 'F3', 'C4', 'F4', 'C4',
                null, null, 'Am3', 'C4', 'F4', 'C4',
                null, null, 'G3', 'B3', 'F4', 'B3',
                null, null, 'E3',
                
                // B Section development (measures 25-32)
                'E3', 'B3', null, 'E3', 'B3', null, 'E3', 'B3',
                null, null, null, 'E3', 'B3', 'E4', 'B3',
                null, null, null, 'E3', 'B3', 'E4', 'B3', 'E4',
                'B3', 'E4', 'B3', 'E4', 'B3', 'E4', 'B3',
                
                // Return to A Section (measures 33-40)
                null, null, null, null, null, null, null, null, null,
                'A2', 'E3', null, null, null,
                'E2', 'E3', 'G#3', null, null, null,
                'A2', 'E3', 'A3', null,
                
                // Final A Section (measures 41-48)
                null, null, null, null, null, null, null, null, null,
                'A2', 'E3', null, null, null,
                'E2', 'E3', 'G#3', null, 'E3', 'A3', 'A2'
            ];
        }
        // Simplified bass for other keys
        const bassParts = {
            'C': [null, null, null, null, null, null, null, null, 'C3'],
            'G': [null, null, null, null, null, null, null, null, 'G2'],
            'F': [null, null, null, null, null, null, null, null, 'F2'],
            'Dm': [null, null, null, null, null, null, null, null, 'D2']
        };
        return bassParts[key] || bassParts['C'];
    },
    
    // Extended complex timing for complete form
    timing: [
        // A Section (measures 1-8)
        0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5,
        0.75, 0.25, 0.25, 0.25, 0.25,
        1, 0.5, 0.25, 0.25, 0.25, 0.25,
        1, 0.5, 0.5, 0.5,
        
        // A Section repeat (measures 9-16)
        0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5,
        0.75, 0.25, 0.25, 0.25, 0.25,
        1, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5,
        
        // B Section - C major (measures 17-24)
        0.25, 0.25, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25,
        0.5, 0.25, 0.25, 0.25, 0.25, 0.25,
        0.5, 0.25, 0.25, 0.25, 0.25, 0.25,
        0.5, 0.5, 0.5,
        
        // B Section development (measures 25-32)
        0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
        0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25,
        0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
        0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
        
        // Return A Section (measures 33-40)
        0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5,
        0.75, 0.25, 0.25, 0.25, 0.25,
        1, 0.5, 0.25, 0.25, 0.25, 0.25,
        1, 0.5, 0.5, 0.5,
        
        // Final A Section (measures 41-48)
        0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5,
        0.75, 0.25, 0.25, 0.25, 0.25,
        1, 0.5, 0.25, 0.25, 0.25, 0.25, 1
    ],
    
    // Extended authentic fingering for treble clef
    trebleClefFingering: [
        // A Section (measures 1-8)
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 4, 2,
        1, null, null, 3,
        
        // A Section repeat (measures 9-16)
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 1, 2, 1, null,
        
        // B Section - C major (measures 17-24)
        3, 1, 2, 3, null, null, 3, 1, 2, 3,
        null, null, 1, 2, 3, 1,
        null, null, 3, 2, 1, 2,
        null, null, 3,
        
        // B Section development (measures 25-32)
        3, 3, null, 3, 5, null, 4, 3,
        null, null, null, 2, 3, 4, 3,
        null, null, null, 2, 3, 4, 3, 4,
        3, 4, 3, 4, 3, 4, 3,
        
        // Return A Section (measures 33-40)
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 4, 2,
        1, null, null, 3,
        
        // Final A Section (measures 41-48)
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 1, 2, 1
    ],
    
    // Bass clef fingering (left hand)
    bassClefFingering: [
        null, null, null, null, null, null, null, null, null,
        5, 2, null, null, null,
        5, 3, 2, null, null, null,
        5, 2, 1, null,
        null, null, null, null, null, null, null, null, null,
        5, 2, null, null, null, 5, 3, 2, null, null, null, null
    ],
    
    // Legacy fingering
    fingering: [5, 4, 5, 4, 5, 2, 4, 3, 1, null, null, 1, 3, 1, 2, null, null, 3, 4, 2, 1, null, null, 3, 5, 4, 5, 4, 5, 2, 4, 3, 1, null, null, 1, 3, 1, 2, null, null, 3, 1, 2, 1],
    
    timeSignature: '3/8',
    tempo: { min: 80, max: 140, default: 110 }
};