// Classical Pattern - Both Hands
export const classical = {
    name: 'Classical (Both Hands)',
    description: 'Classical pattern with Alberti bass in the left hand and a simple melody in the right hand. Typical of the Viennese Classical period.',
    leftHand:  () => ['C3', 'G3', 'E3', 'G3'],
    rightHand: () => ['C5', 'D5', 'E5', 'F5'],
    timing: [0.25, 0.25, 0.25, 0.25],
    fingering: [1, 5, 3, 5],
    leftHandFingering:  [1, 5, 3, 5],
    rightHandFingering: [1, 2, 3, 4],
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 110 }
};
