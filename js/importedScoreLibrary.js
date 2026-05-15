import { MUSICXML_SOURCE_TYPE } from './musicXmlAdapterContract.js';
import { createDiagnostic } from './patternValidator.js';

const IMPORTED_ID_PREFIX = 'imported-score';

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeExistingTitles(existing = []) {
    return new Set(existing
        .map(item => normalizeText(item?.title || item?.name || item?.label, ''))
        .filter(Boolean));
}

function slugifyTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'score';
}

export function assignDuplicateImportedTitle(title, existing = []) {
    const baseTitle = normalizeText(title, 'Imported score');
    const existingTitles = normalizeExistingTitles(existing);
    if (!existingTitles.has(baseTitle)) return baseTitle;

    let suffix = 2;
    let candidate = `${baseTitle} (${suffix})`;
    while (existingTitles.has(candidate)) {
        suffix += 1;
        candidate = `${baseTitle} (${suffix})`;
    }
    return candidate;
}

export function createImportedScoreRecord(input = {}) {
    const descriptor = input.descriptor && typeof input.descriptor === 'object' ? { ...input.descriptor } : {};
    const sourceId = normalizeText(input.id || input.sourceId || descriptor.sourceId || descriptor.id, '');
    const filename = normalizeText(input.filename || descriptor.filename, '');
    const title = normalizeText(input.title || descriptor.title, filename || sourceId || 'Imported score');
    const id = sourceId || `${IMPORTED_ID_PREFIX}:${slugifyTitle(title)}`;
    const diagnostics = Array.isArray(input.diagnostics)
        ? input.diagnostics
        : (Array.isArray(descriptor.diagnostics) ? descriptor.diagnostics : []);

    return {
        id,
        sourceId: id,
        sourceType: MUSICXML_SOURCE_TYPE,
        name: title,
        title,
        filename,
        xmlText: typeof input.xmlText === 'string' ? input.xmlText : '',
        createdAt: normalizeText(input.createdAt, new Date().toISOString()),
        displayMode: 'score',
        libraryType: 'complete-score',
        isCompleteScore: true,
        isImported: true,
        descriptor: {
            ...descriptor,
            id,
            sourceId: id,
            title,
            filename,
            sourceType: MUSICXML_SOURCE_TYPE
        },
        diagnostics: diagnostics.map(diagnostic => createDiagnostic({
            ...diagnostic,
            sourceId: diagnostic.sourceId || id,
            sourceType: MUSICXML_SOURCE_TYPE
        }))
    };
}

export function registerImportedScore(loader, recordInput) {
    if (!loader || typeof loader.registerImportedSource !== 'function') {
        return {
            ok: false,
            diagnostics: [createDiagnostic({
                sourceId: recordInput?.id || recordInput?.sourceId || 'musicxml-import',
                sourceType: MUSICXML_SOURCE_TYPE,
                severity: 'error',
                code: 'MUSICXML_LOADER_UNAVAILABLE',
                path: 'SimplePatternLoader.registerImportedSource',
                message: 'Imported scores require a loader that supports MusicXML source registration.'
            })]
        };
    }

    const record = createImportedScoreRecord(recordInput);
    return loader.registerImportedSource(record.id, record);
}

export function removeImportedScore(loader, sourceId) {
    if (!loader || typeof loader.unregisterImportedSource !== 'function') {
        return { ok: false, id: sourceId };
    }
    return loader.unregisterImportedSource(sourceId);
}

export function listCompleteScoreOptions(loader, options = {}) {
    if (!loader || typeof loader.getPatternOptions !== 'function') return [];
    return loader.getPatternOptions({
        ...options,
        completeScoresOnly: true
    });
}
