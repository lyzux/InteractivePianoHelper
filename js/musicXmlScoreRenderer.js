import { createProfessionalMusicXmlRenderer } from './professionalMusicXmlRenderer.js';

const DEFAULT_CONTAINER_ID = 'vexflow-notation';
let activeRenderer = null;

function emptyRenderResult(sequence = null) {
    return {
        renderer: null,
        eventMap: new Map(),
        measureMap: new Map(),
        noteMap: new Map(),
        playbackTimeline: [],
        sequence,
        pages: [],
        diagnostics: []
    };
}

function resolveContainer(input = {}) {
    if (typeof Element !== 'undefined' && input.container instanceof Element) return input.container;
    const containerId = input.containerId || DEFAULT_CONTAINER_ID;
    return document.getElementById(containerId);
}

function normalizeRenderResult(result, sequence) {
    if (!result) return emptyRenderResult(sequence);
    return {
        ...result,
        renderer: result.renderer || 'osmd',
        eventMap: result.eventMap instanceof Map ? result.eventMap : new Map(),
        measureMap: result.measureMap instanceof Map ? result.measureMap : new Map(),
        noteMap: result.noteMap instanceof Map ? result.noteMap : new Map(),
        playbackTimeline: Array.isArray(result.playbackTimeline) ? result.playbackTimeline : [],
        sequence: result.sequence || sequence || null,
        pages: Array.isArray(result.pages) ? result.pages : [],
        diagnostics: Array.isArray(result.diagnostics) ? result.diagnostics : []
    };
}

export function clearMusicXmlScoreRender(input = {}) {
    const container = resolveContainer(input);
    activeRenderer?.destroy?.();
    activeRenderer = null;
    if (!container) return emptyRenderResult();
    return emptyRenderResult();
}

function resolveMusicXmlSource(input = {}) {
    const sequence = input.sequence || null;
    const patternLoader = input.patternLoader || null;
    const sourceId = sequence?.sourceId || sequence?.patternId || sequence?.descriptor?.sourceId || '';
    const sourceRecord = sourceId && typeof patternLoader?.getPattern === 'function'
        ? patternLoader.getPattern(sourceId)
        : null;
    const xmlText = sequence?.xmlText
        || sourceRecord?.xmlText
        || sequence?.metadata?.xmlText
        || sequence?.descriptor?.xmlText
        || '';

    return {
        xmlText,
        metadata: {
            sourceId,
            filename: sourceRecord?.filename || sequence?.metadata?.filename || sequence?.descriptor?.filename || '',
            title: sourceRecord?.title || sourceRecord?.name || sequence?.metadata?.title || sequence?.descriptor?.title || '',
            sequence
        }
    };
}

function showRenderFailure(container, message = 'The imported score could not be rendered.') {
    container.innerHTML = `
        <div class="score-empty">
            <h4>This score cannot be displayed.</h4>
            <p>${message}</p>
        </div>
    `;
}

export async function renderMusicXmlScore(input = {}) {
    const container = resolveContainer(input);
    const { sequence } = input;

    if (!container) return emptyRenderResult(sequence || null);
    if (!sequence) {
        clearMusicXmlScoreRender({ container });
        showRenderFailure(container, 'The imported score is missing rendering data.');
        return emptyRenderResult(sequence || null);
    }

    try {
        const source = resolveMusicXmlSource(input);
        if (!source.xmlText) {
            clearMusicXmlScoreRender({ container });
            showRenderFailure(container, 'The imported score is missing its MusicXML source.');
            return emptyRenderResult(sequence);
        }

        activeRenderer?.destroy?.();
        activeRenderer = createProfessionalMusicXmlRenderer(input.rendererOptions || {});
        await activeRenderer.load({ xmlText: source.xmlText, metadata: source.metadata });
        const result = await activeRenderer.render(container, {
            sequence,
            osmdOptions: input.osmdOptions
        });
        return normalizeRenderResult({ ...result, sequence }, sequence);
    } catch (error) {
        console.error('OSMD MusicXML rendering error:', error);
        showRenderFailure(container, error?.message || 'The imported score could not be rendered.');
        return {
            ...emptyRenderResult(sequence),
            renderer: 'osmd',
            diagnostics: [{
                severity: 'error',
                code: error?.code || 'OSMD_RENDER_FAILED',
                message: error?.message || String(error)
            }]
        };
    }
}
