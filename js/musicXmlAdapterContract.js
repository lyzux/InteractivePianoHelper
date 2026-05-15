export const MUSICXML_SOURCE_TYPE = 'musicxml';
export const MUSICXML_ADAPTER_VERSION = 'phase-05-canonical-adapter';

export const SUPPORTED_MUSICXML_ROOTS = Object.freeze(['score-partwise']);
export const DEFERRED_MUSICXML_ROOTS = Object.freeze(['score-timewise']);

export const MUSICXML_REQUIRED_CANONICAL_FIELDS = Object.freeze([
    'sourceId',
    'sourceType',
    'patternId',
    'patternName',
    'metadata',
    'timeSignature',
    'beatsPerMeasure',
    'loopUnitBeats',
    'events',
    'events.id',
    'events.startBeat',
    'events.durationBeats',
    'events.hands',
    'measures',
    'measures.measureNumber',
    'measures.startBeat',
    'measures.durationBeats',
    'measures.eventIds',
    'pageLayout',
    'pageLayout.measureLayout'
]);

export const MUSICXML_REQUIRED_PAGE_LAYOUT_FIELDS = Object.freeze([
    'pageNumber',
    'pageSize',
    'pageSize.width',
    'pageSize.height',
    'pageMargins',
    'systemLayout',
    'printBreaks',
    'measureLayout'
]);

export const MUSICXML_DEFERRED_FEATURES = Object.freeze([
    'file-picker',
    'local-import-library',
    'score-timewise',
    'arbitrary-multipart-playback',
    'grace-notes',
    'tuplets',
    'full-repeat-navigation',
    'lyrics',
    'ornaments',
    'renderer-replacement',
    'visual-snapshots'
]);

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function createMusicXmlSourceDescriptor(input = {}) {
    const sourceId = normalizeText(input.sourceId, normalizeText(input.id, 'musicxml-source'));
    const filename = normalizeText(input.filename, '');
    const title = normalizeText(input.title, filename || sourceId);

    return {
        sourceId,
        id: sourceId,
        sourceType: MUSICXML_SOURCE_TYPE,
        title,
        composer: normalizeText(input.composer, ''),
        filename,
        adapterVersion: input.adapterVersion || MUSICXML_ADAPTER_VERSION,
        root: input.root || SUPPORTED_MUSICXML_ROOTS[0],
        metadata: {
            ...(input.metadata || {})
        },
        pageLayout: input.pageLayout || null,
        diagnostics: Array.isArray(input.diagnostics)
            ? input.diagnostics.map(diagnostic => ({
                ...diagnostic,
                sourceId: diagnostic.sourceId || sourceId,
                sourceType: diagnostic.sourceType || MUSICXML_SOURCE_TYPE
            }))
            : []
    };
}

export function describeMusicXmlAdapterContract() {
    return {
        sourceType: MUSICXML_SOURCE_TYPE,
        adapterVersion: MUSICXML_ADAPTER_VERSION,
        supportedRoots: [...SUPPORTED_MUSICXML_ROOTS],
        deferredRoots: [...DEFERRED_MUSICXML_ROOTS],
        requiredCanonicalFields: [...MUSICXML_REQUIRED_CANONICAL_FIELDS],
        requiredPageLayoutFields: [...MUSICXML_REQUIRED_PAGE_LAYOUT_FIELDS],
        deferredFeatures: [...MUSICXML_DEFERRED_FEATURES],
        validation: {
            canonicalValidator: 'validateResolvedSequence',
            musicXmlValidator: 'validateMusicXmlCanonicalScore',
            rejectedSourcePath: 'SimplePatternLoader.recordRejectedSource',
            diagnostics: ['sourceId', 'sourceType', 'severity', 'code', 'path', 'message']
        },
        pageFidelity: {
            preservePages: true,
            responsiveBehavior: 'scale-within-page-not-reflow'
        }
    };
}
