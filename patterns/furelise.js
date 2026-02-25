// Für Elise Pattern - Beethoven's Original Opening (Authentic)
// nativeKey: 'Am' -- this is a piece in A minor; transposition to other keys is not supported.
export const furelise = {
    name: 'Für Elise (Original)',
    description: 'Beethoven\'s authentic "Für Elise" — the complete opening theme for both hands. Only available in A minor.',
    nativeKey: 'Am',

    rightHand: (key) => {
        if (key !== 'Am') return null;
        return [
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            null, null, 'C4', 'E4', 'A4',
            'B4', null, null, 'E4', 'G#4', 'B4',
            'C5', null, null, 'E4',
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            null, null, 'C4', 'E4', 'A4',
            'B4', null, null, 'E4', 'C5', 'B4', 'A4', null,
            'G4', 'C5', 'D5', 'E5', null, null, 'G4', 'F5', 'E5', 'D5',
            null, null, 'F4', 'E5', 'D5', 'C5',
            null, null, 'E4', 'D5', 'C5', 'B4',
            null, null, 'E4',
            'E5', 'E5', null, 'E5', 'E6', null, 'D#5', 'E5',
            null, null, null, 'B4', 'E5', 'D#5', 'E5',
            null, null, null, 'B4', 'E5', 'D#5', 'E5', 'D#5',
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'D#5', 'E5',
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            null, null, 'C4', 'E4', 'A4',
            'B4', null, null, 'E4', 'G#4', 'B4',
            'C5', null, null, 'E4',
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            null, null, 'C4', 'E4', 'A4',
            'B4', null, null, 'E4', 'C5', 'B4', 'A4'
        ];
    },

    leftHand: (key) => {
        if (key !== 'Am') return null;
        return [
            null, null, null, null, null, null, null, null, null,
            'A2', 'E3', null, null, null,
            'E2', 'E3', 'G#3', null, null, null,
            'A2', 'E3', 'A3', null,
            null, null, null, null, null, null, null, null, null,
            'A2', 'E3', null, null, null,
            'E2', 'E3', 'G#3', null, 'E3', 'A3', 'C4', null,
            'C3', 'G3', 'C4', 'G3', null, null, 'F3', 'C4', 'F4', 'C4',
            null, null, 'A3', 'C4', 'F4', 'C4',
            null, null, 'G3', 'B3', 'F4', 'B3',
            null, null, 'E3',
            'E3', 'B3', null, 'E3', 'B3', null, 'E3', 'B3',
            null, null, null, 'E3', 'B3', 'E4', 'B3',
            null, null, null, 'E3', 'B3', 'E4', 'B3', 'E4',
            'B3', 'E4', 'B3', 'E4', 'B3', 'E4', 'B3',
            null, null, null, null, null, null, null, null, null,
            'A2', 'E3', null, null, null,
            'E2', 'E3', 'G#3', null, null, null,
            'A2', 'E3', 'A3', null,
            null, null, null, null, null, null, null, null, null,
            'A2', 'E3', null, null, null,
            'E2', 'E3', 'G#3', null, 'E3', 'A3', 'A2'
        ];
    },

    timing: [
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0,
        1.5, 0.5, 0.5, 0.5, 0.5,
        2, 1, 0.5, 0.5, 0.5, 0.5,
        2, 1, 1, 1,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0,
        1.5, 0.5, 0.5, 0.5, 0.5,
        2, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 1,
        0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5,
        1, 0.5, 0.5, 0.5, 0.5, 0.5,
        1, 0.5, 0.5, 0.5, 0.5, 0.5,
        1, 1, 1,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        1, 1, 0.5, 0.5, 0.5, 0.5, 0.5,
        1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0,
        1.5, 0.5, 0.5, 0.5, 0.5,
        2, 1, 0.5, 0.5, 0.5, 0.5,
        2, 1, 1, 1,
        0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0,
        1.5, 0.5, 0.5, 0.5, 0.5,
        2, 1, 0.5, 0.5, 0.5, 0.5, 2
    ],

    rightHandFingering: [
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 4, 2,
        1, null, null, 3,
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 1, 2, 1, null,
        3, 1, 2, 3, null, null, 3, 1, 2, 3,
        null, null, 1, 2, 3, 1,
        null, null, 3, 2, 1, 2,
        null, null, 3,
        3, 3, null, 3, 5, null, 4, 3,
        null, null, null, 2, 3, 4, 3,
        null, null, null, 2, 3, 4, 3, 4,
        3, 4, 3, 4, 3, 4, 3,
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 4, 2,
        1, null, null, 3,
        5, 4, 5, 4, 5, 2, 4, 3, 1,
        null, null, 1, 3, 1,
        2, null, null, 3, 1, 2, 1
    ],

    leftHandFingering: [
        null, null, null, null, null, null, null, null, null,
        5, 2, null, null, null,
        5, 3, 2, null, null, null,
        5, 2, 1, null,
        null, null, null, null, null, null, null, null, null,
        5, 2, null, null, null, 5, 3, 2, null, null, null, null
    ],

    timeSignature: '3/8',
    tempo: { min: 80, max: 140, default: 110 }
};
