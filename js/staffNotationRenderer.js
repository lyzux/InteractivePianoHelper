// Staff Notation Renderer — extracted from index.html inline script
// Renders two staves (treble + bass) using VexFlow (loaded from CDN as global `Vex`).
// `patternLoader` and `settings` are passed in from the caller so this module
// has no hard dependency on the page's closure variables.

export function drawStaffNotation(patternLoader, settings) {
    const patternType = document.getElementById('pattern').value;

    // Safe key determination
    let key = 'C'; // Fallback
    if (settings && typeof settings.getKey === 'function') {
        key = settings.getKey();
    } else {
        // Read directly from DOM if settings not yet available
        const keySelect = document.getElementById('key');
        if (keySelect) {
            key = keySelect.value;
        }
    }

    console.log(`Drawing staff notation for pattern: ${patternType}, key: ${key}`);

    const notationData = patternLoader.generateVexFlowNotation(patternType, key);
    if (!notationData) return;

    // Clear previous notation
    const vexFlowDiv = document.getElementById('vexflow-notation');
    vexFlowDiv.innerHTML = '';

    // Check if VexFlow is loaded - version 4.x uses different namespace
    if (typeof Vex === 'undefined') {
        console.error('VexFlow is not loaded properly');
        vexFlowDiv.innerHTML = '<p>Notation library loading... Please wait.</p>';
        // Try again in a second, passing the same dependencies through the closure
        setTimeout(() => drawStaffNotation(patternLoader, settings), 1000);
        return;
    }

    try {
        // VexFlow 4.x direct access
        const VF = Vex;

        // Create SVG renderer
        const renderer = new VF.Renderer(vexFlowDiv, VF.Renderer.Backends.SVG);
        renderer.resize(800, 300);
        const context = renderer.getContext();

        // Create treble clef stave (top)
        const trebleStave = new VF.Stave(10, 40, 750);
        trebleStave.addClef('treble');
        trebleStave.addTimeSignature(notationData.timeSignature);
        trebleStave.addKeySignature(key);
        trebleStave.setContext(context).draw();

        // Create bass clef stave (bottom)
        const bassStave = new VF.Stave(10, 140, 750);
        bassStave.addClef('bass');
        bassStave.addTimeSignature(notationData.timeSignature);
        bassStave.addKeySignature(key);
        bassStave.setContext(context).draw();

        // Connect the staves with a brace
        const connector = new VF.StaveConnector(trebleStave, bassStave);
        connector.setType(VF.StaveConnector.type.BRACE);
        connector.setContext(context).draw();

        // Create notes for both hands
        const trebleNotes = [];
        const bassNotes = [];

        // Process bass clef
        if (notationData.bassClef) {
            notationData.bassClef.notes.forEach((note, index) => {
                const duration = patternLoader.convertTimingToVexFlowDuration(
                    notationData.bassClef.timing[index % notationData.bassClef.timing.length]
                );

                if (note === null) {
                    // Rest
                    bassNotes.push(new VF.StaveNote({ keys: ['b/4'], duration: duration + 'r', clef: 'bass' }));
                } else {
                    const vexNote = patternLoader.convertToVexFlowNote(note, 'bass');
                    if (Array.isArray(vexNote)) {
                        // Chord
                        const staveNote = new VF.StaveNote({ keys: vexNote, duration: duration, clef: 'bass' });

                        // Add fingering annotations for chords - stacked vertically
                        try {
                            const fingering = notationData.bassClef.fingering[index % notationData.bassClef.fingering.length];
                            if (fingering && Array.isArray(fingering)) {
                                // Add each fingering number to its corresponding note in the chord
                                fingering.forEach((finger, fingerIndex) => {
                                    if (finger !== null && fingerIndex < vexNote.length) {
                                        const annotation = new VF.Annotation(finger.toString());
                                        annotation.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
                                        staveNote.addModifier(annotation, fingerIndex);
                                    }
                                });
                            }
                        } catch (e) {
                            console.log('Annotation error:', e);
                        }

                        bassNotes.push(staveNote);
                    } else {
                        // Single note
                        const staveNote = new VF.StaveNote({ keys: [vexNote], duration: duration, clef: 'bass' });

                        // Add fingering annotation
                        try {
                            const fingering = notationData.bassClef.fingering[index % notationData.bassClef.fingering.length];
                            if (fingering && fingering !== null && !Array.isArray(fingering)) {
                                const annotation = new VF.Annotation(fingering.toString());
                                annotation.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
                                staveNote.addModifier(annotation, 0);
                            }
                        } catch (e) {
                            console.log('Annotation error:', e);
                        }

                        bassNotes.push(staveNote);
                    }
                }
            });
        }

        // Process treble clef
        if (notationData.trebleClef) {
            notationData.trebleClef.notes.forEach((note, index) => {
                const duration = patternLoader.convertTimingToVexFlowDuration(
                    notationData.trebleClef.timing[index % notationData.trebleClef.timing.length]
                );

                if (note === null) {
                    // Rest
                    trebleNotes.push(new VF.StaveNote({ keys: ['b/4'], duration: duration + 'r', clef: 'treble' }));
                } else {
                    const vexNote = patternLoader.convertToVexFlowNote(note, 'treble');
                    if (Array.isArray(vexNote)) {
                        // Chord
                        const staveNote = new VF.StaveNote({ keys: vexNote, duration: duration, clef: 'treble' });

                        // Add fingering annotations for chords - stacked vertically
                        try {
                            const fingering = notationData.trebleClef.fingering[index % notationData.trebleClef.fingering.length];
                            if (fingering && Array.isArray(fingering)) {
                                // Add each fingering number to its corresponding note in the chord
                                fingering.forEach((finger, fingerIndex) => {
                                    if (finger !== null && fingerIndex < vexNote.length) {
                                        const annotation = new VF.Annotation(finger.toString());
                                        annotation.setVerticalJustification(VF.Annotation.VerticalJustify.TOP);
                                        staveNote.addModifier(annotation, fingerIndex);
                                    }
                                });
                            }
                        } catch (e) {
                            console.log('Annotation error:', e);
                        }

                        trebleNotes.push(staveNote);
                    } else {
                        // Single note
                        const staveNote = new VF.StaveNote({ keys: [vexNote], duration: duration, clef: 'treble' });

                        // Add fingering annotation
                        try {
                            const fingering = notationData.trebleClef.fingering[index % notationData.trebleClef.fingering.length];
                            if (fingering && fingering !== null && !Array.isArray(fingering)) {
                                const annotation = new VF.Annotation(fingering.toString());
                                annotation.setVerticalJustification(VF.Annotation.VerticalJustify.TOP);
                                staveNote.addModifier(annotation, 0);
                            }
                        } catch (e) {
                            console.log('Annotation error:', e);
                        }

                        trebleNotes.push(staveNote);
                    }
                }
            });
        } else {
            // Fill treble staff with rests if no treble clef
            notationData.bassClef.notes.forEach((note, index) => {
                const duration = patternLoader.convertTimingToVexFlowDuration(
                    notationData.bassClef.timing[index % notationData.bassClef.timing.length]
                );
                trebleNotes.push(new VF.StaveNote({ keys: ['b/4'], duration: duration + 'r', clef: 'treble' }));
            });
        }

        // Calculate the total beats for the voice
        const timeSignatureParts = notationData.timeSignature.split('/');
        const numBeats = parseInt(timeSignatureParts[0]);
        const beatValue = parseInt(timeSignatureParts[1]);

        // Create voices and format
        if (trebleNotes.length > 0) {
            const trebleVoice = new VF.Voice({ num_beats: numBeats, beat_value: beatValue });
            trebleVoice.setStrict(false); // Allow incomplete voices
            trebleVoice.addTickables(trebleNotes);
            new VF.Formatter().joinVoices([trebleVoice]).format([trebleVoice], 700);
            trebleVoice.draw(context, trebleStave);
        }

        if (bassNotes.length > 0) {
            const bassVoice = new VF.Voice({ num_beats: numBeats, beat_value: beatValue });
            bassVoice.setStrict(false); // Allow incomplete voices
            bassVoice.addTickables(bassNotes);
            new VF.Formatter().joinVoices([bassVoice]).format([bassVoice], 700);
            bassVoice.draw(context, bassStave);
        }

    } catch (error) {
        console.error('VexFlow rendering error:', error);
        document.getElementById('vexflow-notation').innerHTML = '<p>Error rendering notation</p>';
    }
}
