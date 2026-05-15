// Staff Notation Renderer — extracted from index.html inline script
// Renders two staves (treble + bass) using VexFlow (loaded from CDN as global `Vex`).
// Supports responsive width, multiple measures with bar lines, and cross-measure ties.
// `patternLoader` and `settings` are passed in from the caller.

const VALID_BEATS = new Set([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]);
const REST_FILL_SIZES = [4, 3, 2, 1, 0.5, 0.25]; // descending for greedy fill; no dotted values
const MAX_DISPLAY_MEASURES = 8; // cap long pieces; prevents overwhelming multi-line output

function r3(v) {
    return Math.round(v * 1000) / 1000;
}

/**
 * Split a note/timing stream into per-measure arrays.
 * Notes that straddle a bar line are split into two tied notes when both
 * parts are standard VexFlow durations.  Rests (null) are split into two
 * separate rests without a tie.  Notes that can't be split cleanly are
 * moved to the next measure intact.
 */
function groupIntoMeasures(notes, timings, fingerings, bpm, eventIds = []) {
    const measures = [];
    let cur = { notes: [], timings: [], fingerings: [], tieF: [], tieB: [], eventIds: [] };
    let beat = 0;

    function flush() {
        if (cur.notes.length) measures.push(cur);
        cur = { notes: [], timings: [], fingerings: [], tieF: [], tieB: [], eventIds: [] };
        beat = 0;
    }

    function add(note, tim, fing, tf, tb, eventId) {
        cur.notes.push(note);
        cur.timings.push(tim);
        cur.fingerings.push(fing);
        cur.tieF.push(tf);
        cur.tieB.push(tb);
        cur.eventIds.push(eventId);
        beat = r3(beat + tim);
    }

    for (let i = 0; i < notes.length; i++) {
        const note   = notes[i];
        const timing = r3(timings[i % timings.length]);
        const fing   = fingerings ? fingerings[i % fingerings.length] : null;
        const eventId = eventIds[i] || null;
        const left   = r3(bpm - beat);

        if (timing <= left + 0.001) {
            add(note, timing, fing, false, false, eventId);
            if (beat >= bpm - 0.001) flush();
        } else {
            const over = r3(timing - left);
            if (left > 0.001 && VALID_BEATS.has(left) && VALID_BEATS.has(over)) {
                if (note === null) {
                    // Rests are never tied — just split into two separate rests
                    add(null, left, null, false, false, null);
                    flush();
                    add(null, over, null, false, false, null);
                } else {
                    add(note, left, fing, true, false, eventId);
                    flush();
                    add(note, over, null, false, true, eventId);
                }
                if (beat >= bpm - 0.001) flush();
            } else {
                // Can't split cleanly — close current measure, put full note in next
                flush();
                add(note, timing, fing, false, false, eventId);
                if (beat >= bpm - 0.001) flush();
            }
        }
    }

    if (cur.notes.length) flush();
    return measures;
}

/**
 * Fill the last beat(s) of every measure with rests so the voice is complete.
 * Uses a greedy largest-value-first algorithm.
 */
function fillMeasureRests(measures, bpm) {
    for (const m of measures) {
        const used = m.timings.reduce((s, t) => r3(s + t), 0);
        let remaining = r3(bpm - used);
        if (remaining < 0.001) continue;
        for (const sz of REST_FILL_SIZES) {
            while (remaining >= sz - 0.001) {
                m.notes.push(null);
                m.timings.push(sz);
                m.fingerings.push(null);
                m.tieF.push(false);
                m.tieB.push(false);
                m.eventIds.push(null);
                remaining = r3(remaining - sz);
            }
            if (remaining < 0.001) break;
        }
    }
}

/** Build VF.StaveNote objects for one measure. Returns staveNotes, tieItems, and eventIds arrays. */
function buildMeasureNotes(VF, measureData, clef, patternLoader) {
    const staveNotes   = [];
    const tieItems     = [];
    const eventIds     = [];
    if (!measureData || !measureData.notes.length) return { staveNotes, tieItems, eventIds };

    const vjust = clef === 'treble'
        ? VF.Annotation.VerticalJustify.TOP
        : VF.Annotation.VerticalJustify.BOTTOM;

    for (let i = 0; i < measureData.notes.length; i++) {
        const note = measureData.notes[i];
        const tim  = measureData.timings[i];
        const fing = measureData.fingerings[i];
        const dur  = patternLoader.convertTimingToVexFlowDuration(tim);

        // VexFlow 4: the 'd' suffix in the duration string sets the correct tick count
        // but does NOT render the augmentation dot visually — that requires an explicit
        // Dot modifier.  For rests we strip the 'd' to avoid 'xdr' parsing issues;
        // REST_FILL_SIZES contains only non-dotted values so this is safe in practice.
        const isDotted = dur.endsWith('d');
        const baseDur  = isDotted ? dur.slice(0, -1) : dur;

        // Rest glyph anchor: must be on/near the middle of the current clef's staff.
        // 'b/4' = B4 = middle line of treble; 'd/3' = D3 = middle line of bass.
        // Using 'b/4' for bass clef places rests far above the staff.
        const restKey = clef === 'bass' ? 'd/3' : 'b/4';

        let sn;
        if (note === null) {
            sn = new VF.StaveNote({ keys: [restKey], duration: baseDur + 'r', clef });
        } else {
            const vn   = patternLoader.convertToVexFlowNote(note, clef);
            const keys = Array.isArray(vn) ? vn : [vn];
            sn = new VF.StaveNote({ keys, duration: dur, clef });

            if (fing != null) {
                try {
                    if (Array.isArray(fing)) {
                        fing.forEach((f, fi) => {
                            if (f != null && fi < keys.length) {
                                const ann = new VF.Annotation(f.toString());
                                ann.setVerticalJustification(vjust);
                                sn.addModifier(ann, fi);
                            }
                        });
                    } else {
                        const ann = new VF.Annotation(fing.toString());
                        ann.setVerticalJustification(vjust);
                        sn.addModifier(ann, 0);
                    }
                } catch (_) { /* ignore annotation errors */ }
            }
        }

        if (isDotted) {
            VF.Dot.buildAndAttach([sn], { all: true });
        }

        staveNotes.push(sn);
        eventIds.push(note === null ? null : (measureData.eventIds?.[i] || null));
        if (measureData.tieF[i]) tieItems.push({ noteIndex: i, direction: 'forward' });
        if (measureData.tieB[i]) tieItems.push({ noteIndex: i, direction: 'back' });
    }

    return { staveNotes, tieItems, eventIds };
}

function handNote(payload) {
    if (!payload || payload.isRest) return null;
    return payload.notes.length === 1 ? payload.notes[0] : payload.notes;
}

function buildHandStream(sequence, hand) {
    const stream = { notes: [], timings: [], fingerings: [], eventIds: [] };
    sequence.events.forEach(event => {
        const payload = event.hands[hand];
        if (!payload) return;
        stream.notes.push(handNote(payload));
        stream.timings.push(event.durationBeats);
        stream.fingerings.push(payload.fingering);
        stream.eventIds.push(payload.isRest ? null : event.id);
    });
    return stream;
}

export function drawStaffNotation(patternLoader, settings, sequence = null) {
    const patternType = document.getElementById('pattern').value;

    let key = 'C';
    if (settings && typeof settings.getKey === 'function') {
        key = settings.getKey();
    } else {
        const ks = document.getElementById('key');
        if (ks) key = ks.value;
    }

    console.log(`Drawing staff notation for pattern: ${patternType}, key: ${key}`);

    const vexFlowDiv = document.getElementById('vexflow-notation');
    vexFlowDiv.innerHTML = '';

    const notationData = sequence || patternLoader.resolvePatternSequence(patternType, key);
    if (!notationData || !notationData.isKeySupported || !notationData.events.length) {
        const msg = notationData?.unsupportedReason || 'No notation available for this pattern.';
        vexFlowDiv.innerHTML = `<p>${msg}</p>`;
        return null;
    }

    if (typeof Vex === 'undefined') {
        console.error('VexFlow is not loaded properly');
        vexFlowDiv.innerHTML = '<p>Notation library loading... Please wait.</p>';
        setTimeout(() => drawStaffNotation(patternLoader, settings), 1000);
        return null;
    }

    const eventHighlightMap = new Map(); // eventId → SVGElement[]

    try {
        const VF = Vex;

        const W = Math.max((vexFlowDiv.clientWidth || vexFlowDiv.offsetWidth || 840) - 40, 400);

        const [numBeats, beatValue] = notationData.timeSignature.split('/').map(Number);
        const bpm = numBeats * (4 / beatValue);   // beats per measure in quarter-note units

        // ── Group canonical events into measures ──────────────────────────────
        const bc = buildHandStream(notationData, 'left');
        const tc = buildHandStream(notationData, 'right');

        const bassMeasures = groupIntoMeasures(bc.notes, bc.timings, bc.fingerings, bpm, bc.eventIds);
        fillMeasureRests(bassMeasures, bpm);

        let trebleMeasures;
        if (tc.notes.length) {
            trebleMeasures = groupIntoMeasures(tc.notes, tc.timings, tc.fingerings, bpm, tc.eventIds);
            fillMeasureRests(trebleMeasures, bpm);
        } else {
            // No right-hand data: one whole-measure rest per measure (greedy fill from empty)
            trebleMeasures = bassMeasures.map(() => {
                const m = { notes: [], timings: [], fingerings: [], tieF: [], tieB: [], eventIds: [] };
                fillMeasureRests([m], bpm);
                return m;
            });
        }

        // Cap at MAX_DISPLAY_MEASURES so very long pieces don't overflow the page
        const numMeasures = Math.min(
            Math.max(bassMeasures.length, trebleMeasures.length),
            MAX_DISPLAY_MEASURES
        );
        if (!numMeasures) return null;

        while (bassMeasures.length   < numMeasures) bassMeasures.push(  { notes: [], timings: [], fingerings: [], tieF: [], tieB: [], eventIds: [] });
        while (trebleMeasures.length < numMeasures) trebleMeasures.push({ notes: [], timings: [], fingerings: [], tieF: [], tieB: [], eventIds: [] });

        // ── Layout ────────────────────────────────────────────────────────────
        const TREBLE_Y   = 40;
        const BASS_OFF   = 100;
        const SYS_HEIGHT = 220;
        const HDR        = 100;
        const CONT_HDR   = 60;
        const MIN_MW     = 80;

        const systems = [];
        for (let i = 0; i < numMeasures; ) {
            const hdr = systems.length === 0 ? HDR : CONT_HDR;
            const cap = Math.max(1, Math.floor((W - hdr) / MIN_MW));
            const cnt = Math.min(cap, numMeasures - i);
            systems.push({ start: i, count: cnt, hdr });
            i += cnt;
        }

        const totalH = TREBLE_Y + systems.length * SYS_HEIGHT + 40;

        const renderer = new VF.Renderer(vexFlowDiv, VF.Renderer.Backends.SVG);
        renderer.resize(W, totalH);
        const ctx = renderer.getContext();

        const tNotes = [];
        const bNotes = [];
        const sysOfM = [];

        // ── Render each system ────────────────────────────────────────────────
        for (let si = 0; si < systems.length; si++) {
            const { start, count, hdr } = systems[si];
            const trebleY = si * SYS_HEIGHT + TREBLE_Y;
            const bassY   = trebleY + BASS_OFF;
            const measW   = Math.floor((W - hdr) / count);
            const isFirst = si === 0;

            let firstTS = null, firstBS = null;

            for (let m = 0; m < count; m++) {
                const mi   = start + m;
                const isM0 = m === 0;

                const sX = isM0 ? 0 : hdr + m * measW;
                const sW = isM0 ? hdr + measW : measW;

                const ts = new VF.Stave(sX, trebleY, sW);
                const bs = new VF.Stave(sX, bassY,   sW);

                if (isM0) {
                    ts.addClef('treble');
                    bs.addClef('bass');
                    ts.addKeySignature(key);
                    bs.addKeySignature(key);
                    if (isFirst) {
                        ts.addTimeSignature(notationData.timeSignature);
                        bs.addTimeSignature(notationData.timeSignature);
                    }
                    firstTS = ts;
                    firstBS = bs;
                }

                ts.setContext(ctx).draw();
                bs.setContext(ctx).draw();

                const { staveNotes: tn, tieItems: tti, eventIds: tei } = buildMeasureNotes(VF, trebleMeasures[mi], 'treble', patternLoader);
                const { staveNotes: bn, tieItems: bti, eventIds: bei } = buildMeasureNotes(VF, bassMeasures[mi],   'bass',   patternLoader);

                const fw = Math.max(30, measW - 20);

                if (tn.length) {
                    const v = new VF.Voice({ num_beats: numBeats, beat_value: beatValue });
                    v.setStrict(false);
                    v.addTickables(tn);
                    new VF.Formatter().joinVoices([v]).format([v], fw);
                    v.draw(ctx, ts);
                }

                if (bn.length) {
                    const v = new VF.Voice({ num_beats: numBeats, beat_value: beatValue });
                    v.setStrict(false);
                    v.addTickables(bn);
                    new VF.Formatter().joinVoices([v]).format([v], fw);
                    v.draw(ctx, bs);
                }

                // Collect SVG elements for canonical event highlight maps.
                for (let ni = 0; ni < bn.length; ni++) {
                    const eventId = bei[ni];
                    if (!eventId) continue;
                    const el = bn[ni].attrs?.id ? document.getElementById(`vf-${bn[ni].attrs.id}`) : null;
                    if (!el) continue;
                    if (!eventHighlightMap.has(eventId)) eventHighlightMap.set(eventId, []);
                    eventHighlightMap.get(eventId).push(el);
                }
                for (let ni = 0; ni < tn.length; ni++) {
                    const eventId = tei[ni];
                    if (!eventId) continue;
                    const el = tn[ni].attrs?.id ? document.getElementById(`vf-${tn[ni].attrs.id}`) : null;
                    if (!el) continue;
                    if (!eventHighlightMap.has(eventId)) eventHighlightMap.set(eventId, []);
                    eventHighlightMap.get(eventId).push(el);
                }

                tNotes.push({ staveNotes: tn, tieItems: tti });
                bNotes.push({ staveNotes: bn, tieItems: bti });
                sysOfM.push(si);
            }

            if (firstTS && firstBS) {
                [VF.StaveConnector.type.BRACE, VF.StaveConnector.type.SINGLE_LEFT].forEach(type => {
                    const c = new VF.StaveConnector(firstTS, firstBS);
                    c.setType(type);
                    c.setContext(ctx).draw();
                });
            }
        }

        // ── Draw cross-measure ties (same system only) ────────────────────────
        const drawTies = (cur, nxt) => {
            const fwds = cur.tieItems.filter(t => t.direction === 'forward');
            const baks = nxt.tieItems.filter(t => t.direction === 'back');
            for (let t = 0; t < Math.min(fwds.length, baks.length); t++) {
                const fn = cur.staveNotes[fwds[t].noteIndex];
                const ln = nxt.staveNotes[baks[t].noteIndex];
                if (!fn || !ln) continue;
                try {
                    new VF.StaveTie({
                        first_note: fn, last_note: ln,
                        first_indices: [0], last_indices: [0],
                    }).setContext(ctx).draw();
                } catch (_) { /* ignore tie errors */ }
            }
        };

        for (let mi = 0; mi < numMeasures - 1; mi++) {
            if (sysOfM[mi] !== sysOfM[mi + 1]) continue;
            drawTies(tNotes[mi], tNotes[mi + 1]);
            drawTies(bNotes[mi], bNotes[mi + 1]);
        }

        return {
            eventMap: eventHighlightMap,
            sequence: notationData,
        };

    } catch (error) {
        console.error('VexFlow rendering error:', error);
        document.getElementById('vexflow-notation').innerHTML = '<p>Error rendering notation</p>';
        return null;
    }
}
