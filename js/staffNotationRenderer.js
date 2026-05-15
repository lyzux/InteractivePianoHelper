// Score page renderer - VexFlow score-page renderer.
// Renders canonical event sequences as A4-like pages and returns event-ID maps
// for playback highlighting.

const VALID_BEATS = new Set([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]);
const REST_FILL_SIZES = [4, 3, 2, 1, 0.5, 0.25];

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
export const PAGE_MARGIN_X = 48;
export const PAGE_MARGIN_Y = 56;
export const SYSTEM_GAP = 32;

const SYSTEM_HEIGHT = 190;
const BASS_OFFSET = 92;
const SYSTEM_HEADER_WIDTH = 112;
const MIN_MEASURE_WIDTH = 96;
const PAGE_GRID_GAP = 32;
const KEY_SIGNATURE_BY_FIFTHS = new Map([
    [-7, 'Cb'],
    [-6, 'Gb'],
    [-5, 'Db'],
    [-4, 'Ab'],
    [-3, 'Eb'],
    [-2, 'Bb'],
    [-1, 'F'],
    [0, 'C'],
    [1, 'G'],
    [2, 'D'],
    [3, 'A'],
    [4, 'E'],
    [5, 'B'],
    [6, 'F#'],
    [7, 'C#']
]);

function scaleScoreSheet(sheetView, pageGrid) {
    const availableWidth = sheetView.clientWidth || pageGrid.offsetWidth;
    const intrinsicWidth = pageGrid.classList.contains('single-page')
        ? PAGE_WIDTH
        : PAGE_WIDTH * 2 + PAGE_GRID_GAP;
    const scale = Math.min(1, availableWidth / intrinsicWidth);
    pageGrid.style.setProperty('--score-scale', scale.toString());
    sheetView.style.height = `${Math.ceil(pageGrid.offsetHeight * scale)}px`;
}

function r3(v) {
    return Math.round(v * 1000) / 1000;
}

function emptyMeasure() {
    return { notes: [], timings: [], fingerings: [], tieF: [], tieB: [], eventIds: [] };
}

function groupIntoMeasures(notes, timings, fingerings, bpm, eventIds = []) {
    const measures = [];
    let cur = emptyMeasure();
    let beat = 0;

    function flush() {
        if (cur.notes.length) measures.push(cur);
        cur = emptyMeasure();
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
        const note = notes[i];
        const timing = r3(timings[i % timings.length]);
        const fing = fingerings ? fingerings[i % fingerings.length] : null;
        const eventId = eventIds[i] || null;
        const left = r3(bpm - beat);

        if (timing <= left + 0.001) {
            add(note, timing, fing, false, false, eventId);
            if (beat >= bpm - 0.001) flush();
        } else {
            const over = r3(timing - left);
            if (left > 0.001 && VALID_BEATS.has(left) && VALID_BEATS.has(over)) {
                if (note === null) {
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
                flush();
                add(note, timing, fing, false, false, eventId);
                if (beat >= bpm - 0.001) flush();
            }
        }
    }

    if (cur.notes.length) flush();
    return measures;
}

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

function pushRestSegments(measure, duration) {
    let remaining = r3(duration);
    for (const sz of REST_FILL_SIZES) {
        while (remaining >= sz - 0.001) {
            measure.notes.push(null);
            measure.timings.push(sz);
            measure.fingerings.push(null);
            measure.tieF.push(false);
            measure.tieB.push(false);
            measure.eventIds.push(null);
            remaining = r3(remaining - sz);
        }
        if (remaining < 0.001) break;
    }
}

function buildMeasureNotes(VF, measureData, clef, patternLoader) {
    const staveNotes = [];
    const tieItems = [];
    const eventIds = [];
    if (!measureData || !measureData.notes.length) return { staveNotes, tieItems, eventIds };

    const vjust = clef === 'treble'
        ? VF.Annotation.VerticalJustify.TOP
        : VF.Annotation.VerticalJustify.BOTTOM;

    for (let i = 0; i < measureData.notes.length; i++) {
        const note = measureData.notes[i];
        const tim = measureData.timings[i];
        const fing = measureData.fingerings[i];
        const dur = patternLoader.convertTimingToVexFlowDuration(tim);
        const isDotted = dur.endsWith('d');
        const baseDur = isDotted ? dur.slice(0, -1) : dur;
        const restKey = clef === 'bass' ? 'd/3' : 'b/4';

        let sn;
        if (note === null) {
            sn = new VF.StaveNote({ keys: [restKey], duration: baseDur + 'r', clef });
        } else {
            const vexNote = patternLoader.convertToVexFlowNote(note, clef);
            const keys = Array.isArray(vexNote) ? vexNote : [vexNote];
            sn = new VF.StaveNote({ keys, duration: dur, clef });
            keys.forEach((key, keyIndex) => {
                const accidental = key.match(/([#b])\//)?.[1];
                if (accidental) {
                    sn.addModifier(new VF.Accidental(accidental), keyIndex);
                }
            });

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

        if (isDotted) VF.Dot.buildAndAttach([sn], { all: true });

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

function buildMeasureFromEvents(sequence, measure, hand) {
    const renderedMeasure = emptyMeasure();
    const events = sequence.events
        .filter(event => event.measureIndex === measure.measureIndex && event.hands?.[hand])
        .sort((a, b) => a.startBeat - b.startBeat || (a.sourceIndex || 0) - (b.sourceIndex || 0));
    let cursor = 0;

    events.forEach((event, index) => {
        const localStart = r3(event.startBeat - measure.startBeat);
        const gap = r3(localStart - cursor);
        if (gap > 0.001) pushRestSegments(renderedMeasure, gap);

        const payload = event.hands[hand];
        const payloadDuration = payload.durationBeats || event.durationBeats;
        const nextLocalStart = events[index + 1]
            ? r3(events[index + 1].startBeat - measure.startBeat)
            : null;
        const durationUntilNext = nextLocalStart !== null && nextLocalStart > localStart + 0.001
            ? r3(nextLocalStart - localStart)
            : payloadDuration;
        const renderedDuration = Math.max(0.001, Math.min(payloadDuration, durationUntilNext));
        renderedMeasure.notes.push(handNote(payload));
        renderedMeasure.timings.push(renderedDuration);
        renderedMeasure.fingerings.push(payload.fingering);
        renderedMeasure.tieF.push(payload.tie === 'start' || payload.tie === 'continue');
        renderedMeasure.tieB.push(payload.tie === 'stop' || payload.tie === 'continue');
        renderedMeasure.eventIds.push(payload.isRest ? null : event.id);
        cursor = Math.max(cursor, r3(localStart + renderedDuration));
    });

    const remaining = r3(measure.durationBeats - cursor);
    if (remaining > 0.001) pushRestSegments(renderedMeasure, remaining);
    return renderedMeasure;
}

function measureTimeSignatureParts(measure, fallbackTimeSignature) {
    const signature = measure?.timeSignature || fallbackTimeSignature || '4/4';
    const [numBeats, beatValue] = signature.split('/').map(Number);
    return {
        timeSignature: signature,
        numBeats: Number.isFinite(numBeats) ? numBeats : 4,
        beatValue: Number.isFinite(beatValue) ? beatValue : 4,
        beatsPerMeasure: Number.isFinite(numBeats) && Number.isFinite(beatValue)
            ? numBeats * (4 / beatValue)
            : 4
    };
}

function vexKeyFromMeasure(measure, fallbackKey) {
    const fifths = measure?.keySignature?.fifths;
    if (Number.isInteger(fifths) && KEY_SIGNATURE_BY_FIFTHS.has(fifths)) {
        return KEY_SIGNATURE_BY_FIFTHS.get(fifths);
    }
    return fallbackKey || 'C';
}

export function buildScoreMeasures(sequence) {
    if (!sequence?.events?.length || !sequence.timeSignature) {
        return {
            bassMeasures: [],
            trebleMeasures: [],
            measureCount: 0,
            numBeats: 0,
            beatValue: 0,
            beatsPerMeasure: 0
        };
    }

    const musicXmlMeasures = sequence.sourceType === 'musicxml' && Array.isArray(sequence.measures)
        ? sequence.measures
        : null;
    if (musicXmlMeasures?.length) {
        const measureMetadata = musicXmlMeasures.map((measure, index) => ({
            ...measure,
            measureIndex: Number.isInteger(measure.measureIndex) ? measure.measureIndex : index,
            ...measureTimeSignatureParts(measure, sequence.timeSignature)
        }));
        const bassMeasures = measureMetadata.map(measure => buildMeasureFromEvents(sequence, measure, 'left'));
        const trebleMeasures = measureMetadata.map(measure => buildMeasureFromEvents(sequence, measure, 'right'));
        const first = measureMetadata[0] || measureTimeSignatureParts(null, sequence.timeSignature);
        return {
            bassMeasures,
            trebleMeasures,
            measureCount: measureMetadata.length,
            numBeats: first.numBeats,
            beatValue: first.beatValue,
            beatsPerMeasure: first.beatsPerMeasure,
            measureMetadata
        };
    }

    const [numBeats, beatValue] = sequence.timeSignature.split('/').map(Number);
    const beatsPerMeasure = numBeats * (4 / beatValue);
    const bassStream = buildHandStream(sequence, 'left');
    const trebleStream = buildHandStream(sequence, 'right');

    const bassMeasures = groupIntoMeasures(
        bassStream.notes,
        bassStream.timings,
        bassStream.fingerings,
        beatsPerMeasure,
        bassStream.eventIds
    );
    fillMeasureRests(bassMeasures, beatsPerMeasure);

    let trebleMeasures;
    if (trebleStream.notes.length) {
        trebleMeasures = groupIntoMeasures(
            trebleStream.notes,
            trebleStream.timings,
            trebleStream.fingerings,
            beatsPerMeasure,
            trebleStream.eventIds
        );
        fillMeasureRests(trebleMeasures, beatsPerMeasure);
    } else {
        trebleMeasures = bassMeasures.map(() => {
            const measure = emptyMeasure();
            fillMeasureRests([measure], beatsPerMeasure);
            return measure;
        });
    }

    const measureCount = Math.max(bassMeasures.length, trebleMeasures.length);
    while (bassMeasures.length < measureCount) bassMeasures.push(emptyMeasure());
    while (trebleMeasures.length < measureCount) trebleMeasures.push(emptyMeasure());

    const measureMetadata = Array.from({ length: measureCount }, (_, measureIndex) => ({
        measureIndex,
        measureNumber: measureIndex + 1,
        timeSignature: sequence.timeSignature,
        numBeats,
        beatValue,
        beatsPerMeasure,
        keySignature: null
    }));

    return { bassMeasures, trebleMeasures, measureCount, numBeats, beatValue, beatsPerMeasure, measureMetadata };
}

export function planScorePages(measureCount, options = {}) {
    if (!measureCount || measureCount < 1) return [];

    const pageWidth = options.pageWidth || PAGE_WIDTH;
    const pageHeight = options.pageHeight || PAGE_HEIGHT;
    const marginX = options.marginX || PAGE_MARGIN_X;
    const marginY = options.marginY || PAGE_MARGIN_Y;
    const systemGap = options.systemGap || SYSTEM_GAP;
    const minMeasureWidth = options.minMeasureWidth || MIN_MEASURE_WIDTH;
    const systemHeight = options.systemHeight || SYSTEM_HEIGHT;
    const headerWidth = options.headerWidth || SYSTEM_HEADER_WIDTH;

    const systemWidth = pageWidth - marginX * 2;
    const measuresPerSystem = Math.max(
        1,
        Math.floor((systemWidth - headerWidth) / minMeasureWidth)
    );
    const systemsPerPage = Math.max(
        1,
        Math.floor((pageHeight - marginY * 2 + systemGap) / (systemHeight + systemGap))
    );

    const pages = [];
    let nextMeasure = 0;
    while (nextMeasure < measureCount) {
        const page = { pageIndex: pages.length, systems: [] };
        for (let s = 0; s < systemsPerPage && nextMeasure < measureCount; s++) {
            const count = Math.min(measuresPerSystem, measureCount - nextMeasure);
            page.systems.push({
                systemIndex: s,
                start: nextMeasure,
                count,
                end: nextMeasure + count - 1
            });
            nextMeasure += count;
        }
        pages.push(page);
    }

    return pages;
}

function planScorePagesForSequence(sequence, measureCount) {
    if (sequence?.sourceType !== 'musicxml') return planScorePages(measureCount);
    const layout = Array.isArray(sequence.pageLayout?.measureLayout)
        ? sequence.pageLayout.measureLayout
        : [];
    if (layout.length !== measureCount) return planScorePages(measureCount);

    const pagesByNumber = new Map();
    layout.forEach((measureLayout, fallbackIndex) => {
        const measureIndex = Number.isInteger(measureLayout.measureIndex)
            ? measureLayout.measureIndex
            : fallbackIndex;
        const pageNumber = Number(measureLayout.pageNumber) || 1;
        const systemIndex = Number(measureLayout.systemIndex) || 0;
        if (!pagesByNumber.has(pageNumber)) {
            pagesByNumber.set(pageNumber, {
                pageIndex: pagesByNumber.size,
                sourcePageNumber: pageNumber,
                systems: []
            });
        }
        const page = pagesByNumber.get(pageNumber);
        let system = page.systems.find(item => item.systemIndex === systemIndex);
        if (!system) {
            system = {
                systemIndex,
                start: measureIndex,
                count: 0,
                end: measureIndex
            };
            page.systems.push(system);
        }
        system.start = Math.min(system.start, measureIndex);
        system.end = Math.max(system.end, measureIndex);
        system.count = system.end - system.start + 1;
    });

    const pages = [...pagesByNumber.values()]
        .sort((a, b) => a.sourcePageNumber - b.sourcePageNumber)
        .map((page, pageIndex) => ({
            ...page,
            pageIndex,
            systems: page.systems.sort((a, b) => a.systemIndex - b.systemIndex)
        }));

    return pages.length ? pages : planScorePages(measureCount);
}

function appendHighlightedElement(eventHighlightMap, eventId, staveNote) {
    if (!eventId) return;
    const el = staveNote.attrs?.id ? document.getElementById(`vf-${staveNote.attrs.id}`) : null;
    if (!el) return;
    el.dataset.musicxmlEventId = eventId;
    if (!eventHighlightMap.has(eventId)) eventHighlightMap.set(eventId, []);
    eventHighlightMap.get(eventId).push(el);
}

function appendPageCredits(svg, sequence, sourcePageNumber) {
    const credits = sequence?.pageLayout?.credits;
    if (!svg || !Array.isArray(credits) || !credits.length) return;

    const sourcePageSize = sequence.pageLayout?.pageSize || {};
    const sourceWidth = sourcePageSize.width || PAGE_WIDTH;
    const sourceHeight = sourcePageSize.height || PAGE_HEIGHT;
    const scaleX = PAGE_WIDTH / sourceWidth;
    const scaleY = PAGE_HEIGHT / sourceHeight;
    const namespace = 'http://www.w3.org/2000/svg';

    credits
        .filter(credit => (Number(credit.pageNumber) || 1) === sourcePageNumber)
        .forEach(credit => {
            const text = document.createElementNS(namespace, 'text');
            const justify = credit.justify || 'left';
            const fallbackX = justify === 'center'
                ? PAGE_WIDTH / 2
                : (justify === 'right' ? PAGE_WIDTH - PAGE_MARGIN_X : PAGE_MARGIN_X);
            const x = Number.isFinite(credit.defaultX) ? credit.defaultX * scaleX : fallbackX;
            const y = Number.isFinite(credit.defaultY)
                ? (sourceHeight - credit.defaultY) * scaleY
                : PAGE_MARGIN_Y;
            const fontSize = Number.isFinite(credit.fontSize) ? credit.fontSize : 12;

            text.textContent = credit.text;
            text.setAttribute('x', String(x));
            text.setAttribute('y', String(y));
            text.setAttribute('font-family', credit.type === 'title' ? 'Georgia, serif' : 'Georgia, serif');
            text.setAttribute('font-size', String(fontSize));
            text.setAttribute('fill', '#1f2933');
            text.setAttribute('text-anchor', justify === 'center' ? 'middle' : (justify === 'right' ? 'end' : 'start'));
            if (credit.type === 'title') text.setAttribute('font-weight', '600');
            svg.appendChild(text);
        });
}

function appendMeasureHitTarget(pageEl, measureMap, measureInfo) {
    const hitTarget = document.createElement('button');
    hitTarget.type = 'button';
    hitTarget.className = 'score-measure-hit-target';
    hitTarget.dataset.musicxmlMeasure = 'true';
    hitTarget.dataset.page = String(measureInfo.pageNumber);
    hitTarget.dataset.systemIndex = String(measureInfo.systemIndex);
    hitTarget.dataset.measureIndex = String(measureInfo.measureIndex);
    hitTarget.dataset.measureNumber = String(measureInfo.measureNumber);
    hitTarget.setAttribute('role', 'button');
    hitTarget.setAttribute('aria-label', `Measure ${measureInfo.measureNumber}`);
    hitTarget.style.position = 'absolute';
    hitTarget.style.left = `${measureInfo.x}px`;
    hitTarget.style.top = `${measureInfo.y}px`;
    hitTarget.style.width = `${measureInfo.width}px`;
    hitTarget.style.height = `${measureInfo.height}px`;
    hitTarget.style.padding = '0';
    hitTarget.style.margin = '0';
    hitTarget.style.border = '0';
    hitTarget.style.background = 'transparent';
    hitTarget.style.cursor = 'pointer';
    hitTarget.style.opacity = '0';

    pageEl.appendChild(hitTarget);
    measureMap.set(measureInfo.measureIndex, {
        element: hitTarget,
        pageNumber: measureInfo.pageNumber,
        systemIndex: measureInfo.systemIndex,
        measureIndex: measureInfo.measureIndex,
        measureNumber: measureInfo.measureNumber,
        eventIds: measureInfo.eventIds
    });
}

function drawSystemConnectors(VF, ctx, firstTrebleStave, firstBassStave) {
    if (!firstTrebleStave || !firstBassStave) return;
    [VF.StaveConnector.type.BRACE, VF.StaveConnector.type.SINGLE_LEFT].forEach(type => {
        const connector = new VF.StaveConnector(firstTrebleStave, firstBassStave);
        connector.setType(type);
        connector.setContext(ctx).draw();
    });
}

function drawSameSystemTies(VF, ctx, current, next) {
    const forwards = current.tieItems.filter(t => t.direction === 'forward');
    const backs = next.tieItems.filter(t => t.direction === 'back');
    for (let t = 0; t < Math.min(forwards.length, backs.length); t++) {
        const firstNote = current.staveNotes[forwards[t].noteIndex];
        const lastNote = next.staveNotes[backs[t].noteIndex];
        if (!firstNote || !lastNote) continue;
        try {
            new VF.StaveTie({
                first_note: firstNote,
                last_note: lastNote,
                first_indices: [0],
                last_indices: [0]
            }).setContext(ctx).draw();
        } catch (_) { /* ignore tie errors */ }
    }
}

export function drawStaffNotation(patternLoader, settings, sequence = null) {
    const patternType = document.getElementById('pattern')?.value;
    const vexFlowDiv = document.getElementById('vexflow-notation');
    vexFlowDiv.innerHTML = '';

    const notationData = sequence || patternLoader.resolvePatternSequenceForDisplay?.(patternType);
    if (!notationData || !notationData.isKeySupported || !notationData.events.length) {
        vexFlowDiv.innerHTML = '<div class="score-empty"><h4>This score cannot be displayed.</h4><p>The selected source did not pass verification.</p></div>';
        return null;
    }

    if (typeof Vex === 'undefined') {
        console.error('VexFlow is not loaded properly');
        vexFlowDiv.innerHTML = '<div class="score-empty"><h4>Loading sheet music...</h4></div>';
        setTimeout(() => drawStaffNotation(patternLoader, settings, sequence), 1000);
        return null;
    }

    const eventHighlightMap = new Map();
    const measureMap = new Map();

    try {
        const VF = Vex;
        const scoreMeasures = buildScoreMeasures(notationData);
        if (!scoreMeasures.measureCount) {
            vexFlowDiv.innerHTML = '<div class="score-empty"><h4>No score loaded</h4><p>Select a piece to view its sheet music.</p></div>';
            return null;
        }

        const pages = planScorePages(scoreMeasures.measureCount);
        const renderedPages = notationData.sourceType === 'musicxml'
            ? planScorePagesForSequence(notationData, scoreMeasures.measureCount)
            : pages;
        const scoreKey = notationData.selectedKey || notationData.nativeKey || 'C';
        const sheetView = document.createElement('div');
        sheetView.className = renderedPages.length === 1 ? 'score-sheet-view single-page' : 'score-sheet-view';
        const pageGrid = document.createElement('div');
        pageGrid.className = renderedPages.length === 1 ? 'score-page-grid single-page' : 'score-page-grid';
        sheetView.appendChild(pageGrid);
        vexFlowDiv.appendChild(sheetView);

        renderedPages.forEach(pagePlan => {
            const pageEl = document.createElement('div');
            pageEl.className = 'score-page';
            pageEl.dataset.page = String(pagePlan.pageIndex + 1);
            pageEl.style.position = 'relative';
            pageGrid.appendChild(pageEl);

            const renderer = new VF.Renderer(pageEl, VF.Renderer.Backends.SVG);
            renderer.resize(PAGE_WIDTH, PAGE_HEIGHT);
            const svg = pageEl.querySelector('svg');
            if (svg) {
                svg.setAttribute('viewBox', `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`);
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
            const ctx = renderer.getContext();

            const tNotes = [];
            const bNotes = [];
            const systemByMeasure = new Map();
            let globalSystemIndex = pagePlan.pageIndex * 1000;

            pagePlan.systems.forEach((system, pageSystemIndex) => {
                const trebleY = PAGE_MARGIN_Y + pageSystemIndex * (SYSTEM_HEIGHT + SYSTEM_GAP);
                const bassY = trebleY + BASS_OFFSET;
                const systemWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2;
                const measureWidth = Math.floor((systemWidth - SYSTEM_HEADER_WIDTH) / system.count);
                const isFirstSystem = pagePlan.pageIndex === 0 && pageSystemIndex === 0;

                let firstTrebleStave = null;
                let firstBassStave = null;

                for (let m = 0; m < system.count; m++) {
                    const measureIndex = system.start + m;
                    const isFirstMeasure = m === 0;
                    const staveX = PAGE_MARGIN_X + (isFirstMeasure ? 0 : SYSTEM_HEADER_WIDTH + m * measureWidth);
                    const staveWidth = isFirstMeasure ? SYSTEM_HEADER_WIDTH + measureWidth : measureWidth;
                    const measureMeta = scoreMeasures.measureMetadata?.[measureIndex] || {};
                    const previousMeasureMeta = scoreMeasures.measureMetadata?.[measureIndex - 1] || null;
                    const currentTimeSignature = measureMeta.timeSignature || notationData.timeSignature;
                    const previousTimeSignature = previousMeasureMeta?.timeSignature || null;
                    const currentKey = vexKeyFromMeasure(measureMeta, scoreKey);
                    const previousKey = previousMeasureMeta ? vexKeyFromMeasure(previousMeasureMeta, scoreKey) : null;

                    const trebleStave = new VF.Stave(staveX, trebleY, staveWidth);
                    const bassStave = new VF.Stave(staveX, bassY, staveWidth);

                    if (isFirstMeasure) {
                        trebleStave.addClef('treble');
                        bassStave.addClef('bass');
                        trebleStave.addKeySignature(currentKey);
                        bassStave.addKeySignature(currentKey);
                        trebleStave.addTimeSignature(currentTimeSignature);
                        bassStave.addTimeSignature(currentTimeSignature);
                        firstTrebleStave = trebleStave;
                        firstBassStave = bassStave;
                    } else {
                        if (currentKey !== previousKey) {
                            trebleStave.addKeySignature(currentKey);
                            bassStave.addKeySignature(currentKey);
                        }
                        if (currentTimeSignature !== previousTimeSignature) {
                            trebleStave.addTimeSignature(currentTimeSignature);
                            bassStave.addTimeSignature(currentTimeSignature);
                        }
                    }

                    trebleStave.setContext(ctx).draw();
                    bassStave.setContext(ctx).draw();

                    const treble = buildMeasureNotes(
                        VF,
                        scoreMeasures.trebleMeasures[measureIndex],
                        'treble',
                        patternLoader
                    );
                    const bass = buildMeasureNotes(
                        VF,
                        scoreMeasures.bassMeasures[measureIndex],
                        'bass',
                        patternLoader
                    );
                    const formatWidth = Math.max(30, measureWidth - 20);

                    if (treble.staveNotes.length) {
                        const voice = new VF.Voice({
                            num_beats: measureMeta.numBeats || scoreMeasures.numBeats,
                            beat_value: measureMeta.beatValue || scoreMeasures.beatValue
                        });
                        voice.setStrict(false);
                        voice.addTickables(treble.staveNotes);
                        new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
                        voice.draw(ctx, trebleStave);
                    }

                    if (bass.staveNotes.length) {
                        const voice = new VF.Voice({
                            num_beats: measureMeta.numBeats || scoreMeasures.numBeats,
                            beat_value: measureMeta.beatValue || scoreMeasures.beatValue
                        });
                        voice.setStrict(false);
                        voice.addTickables(bass.staveNotes);
                        new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
                        voice.draw(ctx, bassStave);
                    }

                    bass.staveNotes.forEach((note, noteIndex) => {
                        appendHighlightedElement(eventHighlightMap, bass.eventIds[noteIndex], note);
                    });
                    treble.staveNotes.forEach((note, noteIndex) => {
                        appendHighlightedElement(eventHighlightMap, treble.eventIds[noteIndex], note);
                    });

                    tNotes[measureIndex] = treble;
                    bNotes[measureIndex] = bass;
                    systemByMeasure.set(measureIndex, globalSystemIndex + pageSystemIndex);
                    appendMeasureHitTarget(pageEl, measureMap, {
                        pageNumber: pagePlan.pageIndex + 1,
                        systemIndex: pageSystemIndex,
                        measureIndex,
                        measureNumber: notationData.measures?.[measureIndex]?.measureNumber || measureIndex + 1,
                        x: staveX,
                        y: trebleY,
                        width: staveWidth,
                        height: BASS_OFFSET + 80,
                        eventIds: [...new Set([
                            ...treble.eventIds.filter(Boolean),
                            ...bass.eventIds.filter(Boolean)
                        ])]
                    });
                }

                drawSystemConnectors(VF, ctx, firstTrebleStave, firstBassStave);
            });

            for (let measureIndex = 0; measureIndex < scoreMeasures.measureCount - 1; measureIndex++) {
                if (!systemByMeasure.has(measureIndex) || !systemByMeasure.has(measureIndex + 1)) continue;
                if (systemByMeasure.get(measureIndex) !== systemByMeasure.get(measureIndex + 1)) continue;
                drawSameSystemTies(VF, ctx, tNotes[measureIndex], tNotes[measureIndex + 1]);
                drawSameSystemTies(VF, ctx, bNotes[measureIndex], bNotes[measureIndex + 1]);
            }
            appendPageCredits(svg, notationData, pagePlan.sourcePageNumber || pagePlan.pageIndex + 1);
        });

        scaleScoreSheet(sheetView, pageGrid);

        return {
            eventMap: eventHighlightMap,
            measureMap,
            sequence: notationData,
            pages: renderedPages
        };
    } catch (error) {
        console.error('VexFlow rendering error:', error);
        document.getElementById('vexflow-notation').innerHTML = '<div class="score-empty"><h4>Unable to render this score.</h4></div>';
        return null;
    }
}
