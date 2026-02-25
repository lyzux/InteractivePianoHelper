// Hymn Pattern - Both Hands
export const hymn = {
    name: 'Chorale/Hymn (Both Hands)',
    description: 'Four-part chorale setting with melody in the right hand (soprano) and bass in the left hand. Typical for church music and chorales.',
    leftHand: () => ['C3', 'F3', 'G3', 'C3'],
    rightHand: () => [['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4']],
    timing: [1, 1, 1, 1],
    fingering: [5, 1, 2, 5],
    leftHandFingering: [5, 1, 2, 5],
    rightHandFingering: [[1, 3, 5], [1, 2, 4], [2, 3, 5], [1, 3, 5]],
    timeSignature: '4/4',
    tempo: { min: 60, max: 100, default: 80 }
};
