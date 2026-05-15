// MusicXML Canonical Adapter
// Converts strict parsed MusicXML documents into the app's canonical score
// sequence without depending on DOM, rendering, or playback modules.

import { beatsPerMeasure } from './canonicalPatternResolver.js';
import {
    createMusicXmlSourceDescriptor,
    MUSICXML_ADAPTER_VERSION,
    MUSICXML_SOURCE_TYPE
} from './musicXmlAdapterContract.js';
import { validateMusicXmlDocument } from './musicXmlParser.js';
import {
    createDiagnostic,
    hasFatalDiagnostics,
    validateMusicXmlCanonicalScore as validateMusicXmlCanonicalScoreShape,
    validateResolvedSequence
} from './patternValidator.js';

const DEFAULT_SOURCE_ID = 'musicxml-import';
const DEFAULT_PAGE_SIZE = Object.freeze({ width: 1190, height: 1683 });
const DEFAULT_PAGE_MARGINS = Object.freeze({ left: 56, right: 56, top: 56, bottom: 56 });
const ROUND_TOLERANCE = 0.001;
const SUPPORTED_RENDER_DURATIONS = new Set([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]);
const SUPPORTED_NOTE_CHILDREN = new Set([
    'pitch',
    'rest',
    'duration',
    'voice',
    'type',
    'staff',
    'chord',
    'tie',
    'accidental',
    'dot'
]);

function roundBeat(value) {
    return Math.round(value * 1000) / 1000;
}

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function childrenByName(element, name) {
    return (element?.children || []).filter(child => child.name === name);
}

function firstChild(element, name) {
    return childrenByName(element, name)[0] || null;
}

function childText(element, path) {
    const parts = path.split('.');
    let current = element;
    for (const part of parts) {
        current = firstChild(current, part);
        if (!current) return '';
    }
    return normalizeText(current.text, '');
}

function numericChild(element, path, fallback = null) {
    const text = childText(element, path);
    if (text === '') return fallback;
    const value = Number(text);
    return Number.isFinite(value) ? value : fallback;
}

function diagnostic(context, input) {
    return createDiagnostic({
        sourceId: context.sourceId,
        sourceType: MUSICXML_SOURCE_TYPE,
        ...input
    });
}

function contextFromOptions(options = {}) {
    const descriptor = options.descriptor || {};
    const sourceId = normalizeText(options.sourceId, normalizeText(descriptor.sourceId, DEFAULT_SOURCE_ID));
    const filename = normalizeText(options.filename, normalizeText(descriptor.filename, ''));
    return {
        sourceId,
        filename,
        descriptor
    };
}

function readTitle(root, context) {
    return childText(root, 'work.work-title')
        || childText(root, 'movement-title')
        || context.descriptor.title
        || context.filename
        || context.sourceId;
}

function readComposer(root, context) {
    if (context.descriptor.composer) return context.descriptor.composer;
    const creators = childrenByName(firstChild(root, 'identification'), 'creator');
    const composer = creators.find(creator => creator.attributes.type === 'composer') || creators[0];
    return normalizeText(composer?.text, '');
}

function parsePageLayout(root) {
    const pageLayout = firstChild(firstChild(root, 'defaults'), 'page-layout');
    const pageMargins = firstChild(pageLayout, 'page-margins');
    return {
        pageSize: {
            width: numericChild(pageLayout, 'page-width', DEFAULT_PAGE_SIZE.width),
            height: numericChild(pageLayout, 'page-height', DEFAULT_PAGE_SIZE.height)
        },
        pageMargins: {
            left: numericChild(pageMargins, 'left-margin', DEFAULT_PAGE_MARGINS.left),
            right: numericChild(pageMargins, 'right-margin', DEFAULT_PAGE_MARGINS.right),
            top: numericChild(pageMargins, 'top-margin', DEFAULT_PAGE_MARGINS.top),
            bottom: numericChild(pageMargins, 'bottom-margin', DEFAULT_PAGE_MARGINS.bottom)
        },
        systemLayout: {},
        printBreaks: [],
        measureLayout: []
    };
}

function readTimeSignature(attributes, previous) {
    const beats = childText(attributes, 'time.beats');
    const beatType = childText(attributes, 'time.beat-type');
    return beats && beatType ? `${beats}/${beatType}` : previous;
}

function readKeySignature(attributes, previous) {
    const fifths = childText(attributes, 'key.fifths');
    if (fifths === '') return previous;
    return {
        fifths: Number(fifths)
    };
}

function readClefs(attributes, previous) {
    const clefs = { ...previous };
    childrenByName(attributes, 'clef').forEach(clef => {
        const number = clef.attributes.number || '1';
        clefs[number] = {
            sign: childText(clef, 'sign'),
            line: numericChild(clef, 'line', null)
        };
    });
    return clefs;
}

function pitchToNote(noteElement) {
    const pitch = firstChild(noteElement, 'pitch');
    if (!pitch) return null;
    const step = childText(pitch, 'step');
    const octave = childText(pitch, 'octave');
    const alter = numericChild(pitch, 'alter', 0);
    const accidental = alter === 1 ? '#' : (alter === -1 ? 'b' : '');
    return step && octave ? `${step}${accidental}${octave}` : null;
}

function handForNote(noteElement) {
    const staff = childText(noteElement, 'staff');
    if (staff === '1') return 'right';
    if (staff === '2') return 'left';

    const note = pitchToNote(noteElement);
    const octave = note ? Number.parseInt(note.slice(-1), 10) : NaN;
    return Number.isFinite(octave) && octave >= 4 ? 'right' : 'left';
}

function tieForNote(noteElement) {
    const ties = childrenByName(noteElement, 'tie').map(tie => tie.attributes.type).filter(Boolean);
    if (ties.includes('start') && ties.includes('stop')) return 'continue';
    return ties[0] || null;
}

function makeHandPayload(noteElement) {
    if (firstChild(noteElement, 'rest')) {
        return {
            notes: [],
            isRest: true,
            fingering: null
        };
    }

    return {
        notes: [pitchToNote(noteElement)].filter(Boolean),
        isRest: false,
        fingering: null,
        ...(tieForNote(noteElement) ? { tie: tieForNote(noteElement) } : {})
    };
}

function mergeHandPayload(existing, incoming) {
    if (!existing) return incoming;
    if (existing.isRest && !incoming.isRest) return incoming;
    if (!existing.isRest && incoming.isRest) return existing;
    return {
        ...existing,
        notes: [...existing.notes, ...incoming.notes],
        isRest: existing.isRest && incoming.isRest,
        tie: existing.tie || incoming.tie || null
    };
}

function eventKey(measureIndex, startBeat) {
    return `${measureIndex}:${roundBeat(startBeat).toFixed(3)}`;
}

function readPartNames(root) {
    const partList = firstChild(root, 'part-list');
    const names = new Map();
    childrenByName(partList, 'score-part').forEach(scorePart => {
        names.set(scorePart.attributes.id, childText(scorePart, 'part-name') || scorePart.attributes.id);
    });
    return names;
}

function readPrintHints(printElement, measureNumber, pageState) {
    if (!printElement) return null;
    if (printElement.attributes['new-page'] === 'yes') {
        pageState.pageNumber = Number(printElement.attributes['page-number']) || pageState.pageNumber + 1;
        pageState.systemIndex = 0;
    } else if (printElement.attributes['new-system'] === 'yes') {
        pageState.systemIndex += 1;
    }

    return {
        measureNumber,
        pageNumber: pageState.pageNumber,
        systemIndex: pageState.systemIndex,
        newPage: printElement.attributes['new-page'] === 'yes',
        newSystem: printElement.attributes['new-system'] === 'yes'
    };
}

function pushUnsupportedDiagnosticIfNeeded(child, diagnostics, context, path) {
    if (['attributes', 'print', 'note', 'backup', 'forward', 'barline'].includes(child.name)) {
        return;
    }
    diagnostics.push(diagnostic(context, {
        severity: 'error',
        code: 'MUSICXML_ELEMENT_UNSUPPORTED',
        path,
        message: `Unsupported MusicXML element "${child.name}" cannot be imported in strict mode.`
    }));
}

function validateNoteElement(noteElement, diagnostics, context, path, divisions) {
    noteElement.children.forEach((child, index) => {
        if (!SUPPORTED_NOTE_CHILDREN.has(child.name)) {
            diagnostics.push(diagnostic(context, {
                severity: 'error',
                code: 'MUSICXML_ELEMENT_UNSUPPORTED',
                path: `${path}.${child.name}[${index}]`,
                message: `Unsupported MusicXML note element "${child.name}" cannot be imported in strict mode.`
            }));
        }
    });

    if (firstChild(noteElement, 'grace')) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_GRACE_UNSUPPORTED',
            path,
            message: 'Grace notes are not supported by strict import.'
        }));
    }
    if (firstChild(noteElement, 'time-modification')) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_TUPLET_UNSUPPORTED',
            path,
            message: 'Tuplets are not supported by strict import.'
        }));
    }
    if (!firstChild(noteElement, 'rest') && !firstChild(noteElement, 'pitch')) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_NOTE_UNSUPPORTED',
            path,
            message: 'Only pitched notes and rests are supported.'
        }));
    }
    const alterText = childText(noteElement, 'pitch.alter');
    if (alterText !== '') {
        const alter = Number(alterText);
        if (!Number.isFinite(alter) || ![-1, 0, 1].includes(alter)) {
            diagnostics.push(diagnostic(context, {
                severity: 'error',
                code: 'MUSICXML_ACCIDENTAL_UNSUPPORTED',
                path: `${path}.pitch.alter`,
                message: 'Only natural, sharp, and flat accidentals are supported by strict import.'
            }));
        }
    }
    const duration = Number(childText(noteElement, 'duration'));
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(divisions) || divisions <= 0) {
        diagnostics.push(diagnostic(context, {
            severity: 'error',
            code: 'MUSICXML_DURATION_INVALID',
            path: `${path}.duration`,
            message: 'MusicXML notes must have a positive duration and active divisions value.'
        }));
    } else {
        const durationBeats = roundBeat(duration / divisions);
        if (!SUPPORTED_RENDER_DURATIONS.has(durationBeats)) {
            diagnostics.push(diagnostic(context, {
                severity: 'error',
                code: 'MUSICXML_DURATION_UNSUPPORTED',
                path: `${path}.duration`,
                message: 'Strict import only supports durations that can be rendered and played consistently.'
            }));
        }
    }
}

function sortEvents(events) {
    return events.sort((a, b) => {
        if (Math.abs(a.startBeat - b.startBeat) > ROUND_TOLERANCE) return a.startBeat - b.startBeat;
        return a._ordinal - b._ordinal;
    });
}

function stripInternalEventFields(event, sourceId, index, measureNumber) {
    return {
        id: `${sourceId}-m${measureNumber}-event-${index}`,
        sourceIndex: index,
        startBeat: roundBeat(event.startBeat),
        durationBeats: roundBeat(event.durationBeats),
        measureIndex: event.measureIndex,
        beatInMeasure: roundBeat(event.beatInMeasure),
        hands: event.hands
    };
}

function convertDocument(document, context) {
    const diagnostics = validateMusicXmlDocument(document, context);
    if (hasFatalDiagnostics(diagnostics)) {
        return { sequence: null, diagnostics };
    }

    const root = document.root;
    const parts = childrenByName(root, 'part');
    const part = parts[0];
    const partNames = readPartNames(root);
    const partId = part.attributes.id || 'P1';
    const pageLayout = parsePageLayout(root);
    const eventsByKey = new Map();
    const measures = [];
    const pageState = { pageNumber: 1, systemIndex: 0 };
    let divisions = 1;
    let timeSignature = '4/4';
    let keySignature = null;
    let clefs = {};
    let scoreBeat = 0;
    let eventOrdinal = 0;
    let firstTimeSignature = null;
    let firstMeasureBeats = null;

    childrenByName(part, 'measure').forEach((measure, measureIndex) => {
        const measureNumber = normalizeText(measure.attributes.number, String(measureIndex + 1));
        let cursorBeat = 0;
        const printHint = readPrintHints(firstChild(measure, 'print'), measureNumber, pageState);
        if (printHint) {
            pageLayout.printBreaks.push(printHint);
        }

        measure.children.forEach((child, childIndex) => {
            const path = `score-partwise.part[0].measure[${measureIndex}].${child.name}[${childIndex}]`;
            pushUnsupportedDiagnosticIfNeeded(child, diagnostics, context, path);

            if (child.name === 'attributes') {
                const nextDivisions = numericChild(child, 'divisions', divisions);
                if (!Number.isFinite(nextDivisions) || nextDivisions <= 0) {
                    diagnostics.push(diagnostic(context, {
                        severity: 'error',
                        code: 'MUSICXML_DIVISIONS_INVALID',
                        path: `${path}.divisions`,
                        message: 'MusicXML divisions must be a positive number.'
                    }));
                } else {
                    divisions = nextDivisions;
                }
                timeSignature = readTimeSignature(child, timeSignature);
                keySignature = readKeySignature(child, keySignature);
                clefs = readClefs(child, clefs);
                if (!firstTimeSignature) {
                    firstTimeSignature = timeSignature;
                    firstMeasureBeats = beatsPerMeasure(timeSignature);
                }
                return;
            }

            if (child.name === 'backup' || child.name === 'forward') {
                const duration = Number(childText(child, 'duration'));
                if (!Number.isFinite(duration) || duration <= 0 || divisions <= 0) {
                    diagnostics.push(diagnostic(context, {
                        severity: 'error',
                        code: 'MUSICXML_CURSOR_INVALID',
                        path: `${path}.duration`,
                        message: 'Backup and forward elements require positive duration values.'
                    }));
                    return;
                }
                const delta = duration / divisions;
                cursorBeat = roundBeat(child.name === 'backup' ? cursorBeat - delta : cursorBeat + delta);
                if (cursorBeat < -ROUND_TOLERANCE) {
                    diagnostics.push(diagnostic(context, {
                        severity: 'error',
                        code: 'MUSICXML_CURSOR_INVALID',
                        path,
                        message: 'Backup moved the MusicXML cursor before the start of a measure.'
                    }));
                }
                return;
            }

            if (child.name !== 'note') return;

            validateNoteElement(child, diagnostics, context, path, divisions);
            if (hasFatalDiagnostics(diagnostics)) return;

            const isChord = firstChild(child, 'chord') !== null;
            const durationBeats = roundBeat(Number(childText(child, 'duration')) / divisions);
            const startBeat = isChord && eventOrdinal > 0
                ? [...eventsByKey.values()][eventsByKey.size - 1].startBeat
                : roundBeat(scoreBeat + cursorBeat);
            const key = eventKey(measureIndex, startBeat);
            let event = eventsByKey.get(key);
            if (!event) {
                event = {
                    _ordinal: eventOrdinal,
                    startBeat,
                    durationBeats,
                    measureIndex,
                    beatInMeasure: roundBeat(startBeat - scoreBeat),
                    hands: {}
                };
                eventsByKey.set(key, event);
                eventOrdinal += 1;
            } else {
                event.durationBeats = Math.max(event.durationBeats, durationBeats);
            }

            const hand = handForNote(child);
            event.hands[hand] = mergeHandPayload(event.hands[hand], makeHandPayload(child));

            if (!isChord) {
                cursorBeat = roundBeat(cursorBeat + durationBeats);
            }
        });

        const measureDuration = beatsPerMeasure(timeSignature);
        const measureEventKeys = [...eventsByKey.entries()]
            .filter(([, event]) => event.measureIndex === measureIndex)
            .sort((a, b) => a[1].startBeat - b[1].startBeat || a[1]._ordinal - b[1]._ordinal)
            .map(([key]) => key);

        measures.push({
            measureIndex,
            measureNumber,
            partId,
            partName: partNames.get(partId) || partId,
            startBeat: roundBeat(scoreBeat),
            durationBeats: roundBeat(measureDuration),
            timeSignature,
            keySignature,
            staves: {
                count: numericChild(firstChild(measure, 'attributes'), 'staves', Object.keys(clefs).length || 1),
                clefs
            },
            eventIds: measureEventKeys,
            canonicalEventIds: measureEventKeys,
            pageNumber: pageState.pageNumber,
            systemIndex: pageState.systemIndex
        });
        pageLayout.measureLayout.push({
            measureNumber,
            measureIndex,
            partId,
            pageNumber: pageState.pageNumber,
            systemIndex: pageState.systemIndex
        });
        scoreBeat = roundBeat(scoreBeat + measureDuration);
    });

    if (hasFatalDiagnostics(diagnostics)) {
        return { sequence: null, diagnostics };
    }

    const sortedEvents = sortEvents([...eventsByKey.values()])
        .map((event, index) => {
            const measure = measures[event.measureIndex];
            return stripInternalEventFields(event, context.sourceId, index, measure.measureNumber);
        });
    const eventIdByKey = new Map();
    sortEvents([...eventsByKey.entries()].map(([key, event]) => ({ key, ...event })))
        .forEach((event, index) => {
            const measure = measures[event.measureIndex];
            eventIdByKey.set(event.key, `${context.sourceId}-m${measure.measureNumber}-event-${index}`);
        });
    measures.forEach(measure => {
        measure.eventIds = measure.eventIds.map(key => eventIdByKey.get(key)).filter(Boolean);
        measure.canonicalEventIds = [...measure.eventIds];
    });

    const descriptor = createMusicXmlSourceDescriptor({
        ...context.descriptor,
        sourceId: context.sourceId,
        filename: context.filename,
        title: readTitle(root, context),
        composer: readComposer(root, context),
        adapterVersion: MUSICXML_ADAPTER_VERSION,
        metadata: {
            ...(context.descriptor.metadata || {}),
            partId,
            partName: partNames.get(partId) || partId,
            measureCount: measures.length
        },
        pageLayout,
        diagnostics
    });

    const sequence = {
        sourceId: context.sourceId,
        sourceType: MUSICXML_SOURCE_TYPE,
        patternId: context.sourceId,
        patternName: descriptor.title,
        selectedKey: null,
        nativeKey: null,
        isKeySupported: true,
        displayMode: 'score',
        metadata: {
            ...descriptor.metadata,
            title: descriptor.title,
            composer: descriptor.composer,
            filename: context.filename,
            adapterVersion: MUSICXML_ADAPTER_VERSION
        },
        timeSignature: firstTimeSignature || timeSignature,
        beatsPerMeasure: firstMeasureBeats || beatsPerMeasure(firstTimeSignature || timeSignature),
        loopUnitBeats: measures.reduce((sum, measure) => roundBeat(sum + measure.durationBeats), 0),
        events: sortedEvents,
        measures,
        pageLayout,
        descriptor
    };

    const validationDiagnostics = validateMusicXmlCanonicalScore(sequence, context);
    return {
        sequence: hasFatalDiagnostics(validationDiagnostics) ? null : sequence,
        diagnostics: [...diagnostics, ...validationDiagnostics]
    };
}

export function validateMusicXmlCanonicalScore(sequence, options = {}) {
    const context = {
        sourceId: options.sourceId || sequence?.sourceId || DEFAULT_SOURCE_ID,
        sourceType: MUSICXML_SOURCE_TYPE
    };
    return [
        ...validateResolvedSequence(sequence, context),
        ...validateMusicXmlCanonicalScoreShape(sequence, context)
    ];
}

export function adaptMusicXmlDocumentToCanonical(document, options = {}) {
    const context = contextFromOptions(options);
    const { sequence, diagnostics } = convertDocument(document, context);
    return {
        ok: !hasFatalDiagnostics(diagnostics),
        sequence,
        diagnostics,
        descriptor: sequence?.descriptor || createMusicXmlSourceDescriptor({
            sourceId: context.sourceId,
            filename: context.filename,
            diagnostics
        })
    };
}
