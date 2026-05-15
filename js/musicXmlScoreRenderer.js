import { drawStaffNotation } from './staffNotationRenderer.js';

const DEFAULT_CONTAINER_ID = 'vexflow-notation';

function emptyRenderResult(sequence = null) {
    return {
        eventMap: new Map(),
        measureMap: new Map(),
        sequence,
        pages: []
    };
}

function resolveContainer(input = {}) {
    if (input.container instanceof Element) return input.container;
    const containerId = input.containerId || DEFAULT_CONTAINER_ID;
    return document.getElementById(containerId);
}

function normalizeRenderResult(result, sequence) {
    if (!result) return emptyRenderResult(sequence);
    return {
        eventMap: result.eventMap instanceof Map ? result.eventMap : new Map(),
        measureMap: result.measureMap instanceof Map ? result.measureMap : new Map(),
        sequence: result.sequence || sequence || null,
        pages: Array.isArray(result.pages) ? result.pages : []
    };
}

export function clearMusicXmlScoreRender(input = {}) {
    const container = resolveContainer(input);
    if (!container) return emptyRenderResult();
    container.innerHTML = '';
    return emptyRenderResult();
}

export function renderMusicXmlScore(input = {}) {
    const container = resolveContainer(input);
    const { patternLoader, settings, sequence } = input;

    if (!container) return emptyRenderResult(sequence || null);
    if (!patternLoader || !sequence) {
        clearMusicXmlScoreRender({ container });
        container.innerHTML = '<div class="score-empty"><h4>This score cannot be displayed.</h4><p>The imported score is missing rendering data.</p></div>';
        return emptyRenderResult(sequence || null);
    }

    const previousId = container.id;
    if (previousId !== DEFAULT_CONTAINER_ID) {
        container.id = DEFAULT_CONTAINER_ID;
    }

    try {
        const result = drawStaffNotation(patternLoader, settings, sequence);
        return normalizeRenderResult(result, sequence);
    } finally {
        if (previousId !== DEFAULT_CONTAINER_ID) {
            container.id = previousId;
        }
    }
}
