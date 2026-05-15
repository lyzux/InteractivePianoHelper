export const PROFESSIONAL_MUSICXML_RENDERER_VERSION = 'phase6-osmd-facade-v1';
export const DEFAULT_OSMD_SCRIPT_PATH = '/node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js';
export const DEFAULT_HIGHLIGHT_COLOR = '#2fd7a3';
export const DEFAULT_RANGE_COLOR = '#98f5d2';

const DEFAULT_OSMD_OPTIONS = {
    backend: 'svg',
    autoResize: false,
    drawTitle: true,
    pageFormat: 'A4_P',
    newSystemFromXML: true,
    newPageFromXML: true
};

function toArray(value) {
    if (value === null || value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

function asElementList(container, selector) {
    if (!container || typeof container.querySelectorAll !== 'function') return [];
    return Array.from(container.querySelectorAll(selector));
}

function setDatasetValue(element, key, value) {
    if (!element) return;
    if (element.dataset) {
        element.dataset[key] = String(value);
    } else if (typeof element.setAttribute === 'function') {
        element.setAttribute(`data-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`, String(value));
    }
}

function addClass(element, ...classNames) {
    if (!element?.classList) return;
    classNames.filter(Boolean).forEach(className => element.classList.add(className));
}

function removeClass(element, ...classNames) {
    if (!element?.classList) return;
    classNames.filter(Boolean).forEach(className => element.classList.remove(className));
}

function setAttribute(element, name, value) {
    if (typeof element?.setAttribute === 'function') element.setAttribute(name, String(value));
}

function removeAttribute(element, name) {
    if (typeof element?.removeAttribute === 'function') element.removeAttribute(name);
}

function getDatasetNumber(element, key, fallback) {
    const raw = element?.dataset?.[key];
    const number = Number(raw);
    return Number.isFinite(number) ? number : fallback;
}

function getDatasetValue(element, key, fallback) {
    const value = element?.dataset?.[key];
    return value === undefined || value === null || value === '' ? fallback : value;
}

function clearChildren(container) {
    if (!container) return;
    if (typeof container.replaceChildren === 'function') {
        container.replaceChildren();
    } else {
        container.innerHTML = '';
    }
}

function makeRenderError(message, code = 'PROFESSIONAL_RENDERER_ERROR') {
    const error = new Error(message);
    error.code = code;
    return error;
}

function defaultScriptLoader(src, documentRef = globalThis.document) {
    if (!documentRef?.createElement || !documentRef.head) {
        return Promise.reject(makeRenderError('OSMD script loading requires a browser document.', 'OSMD_SCRIPT_LOAD_UNAVAILABLE'));
    }

    const existing = documentRef.querySelector?.(`script[data-professional-musicxml-osmd="${src}"]`);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
        const script = documentRef.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.professionalMusicxmlOsmd = src;
        script.addEventListener('load', () => resolve(script), { once: true });
        script.addEventListener('error', () => {
            reject(makeRenderError(`OSMD script could not be loaded from ${src}.`, 'OSMD_SCRIPT_LOAD_FAILED'));
        }, { once: true });
        documentRef.head.appendChild(script);
    });
}

function getGlobalOsmdClass(globalRef = globalThis) {
    return globalRef?.opensheetmusicdisplay?.OpenSheetMusicDisplay || null;
}

function normalizeSource(source, metadata = {}) {
    if (typeof source === 'string') {
        return {
            xmlText: source,
            metadata
        };
    }

    if (source?.xmlText && typeof source.xmlText === 'string') {
        return {
            xmlText: source.xmlText,
            metadata: {
                ...metadata,
                ...source.metadata,
                sourceId: source.sourceId ?? source.metadata?.sourceId ?? metadata.sourceId,
                filename: source.filename ?? source.metadata?.filename ?? metadata.filename
            }
        };
    }

    throw makeRenderError('Professional MusicXML renderer requires MusicXML text.', 'MUSICXML_SOURCE_REQUIRED');
}

function collectPages(container, osmd) {
    const pageElements = asElementList(container, '[id^="osmdCanvasPage"]');
    const svgElements = asElementList(container, 'svg');
    const pageCount = Math.max(pageElements.length, svgElements.length, osmd?.GraphicSheet?.musicPages?.length || 0);

    return Array.from({ length: pageCount }, (_, index) => ({
        pageIndex: index,
        pageNumber: index + 1,
        element: pageElements[index] || svgElements[index] || null,
        svg: svgElements[index] || null,
        source: osmd?.GraphicSheet?.musicPages?.[index] || null
    }));
}

function collectMeasures(container) {
    const measureMap = new Map();
    const measureElements = asElementList(container, 'g.vf-measure');

    measureElements.forEach((element, index) => {
        const measureIndex = getDatasetNumber(element, 'measureIndex', index);
        const measureNumber = getDatasetValue(element, 'measureNumber', measureIndex + 1);
        setDatasetValue(element, 'musicxmlMeasure', 'true');
        setDatasetValue(element, 'measureIndex', measureIndex);
        setDatasetValue(element, 'measureNumber', measureNumber);
        setAttribute(element, 'role', 'button');
        setAttribute(element, 'tabindex', '0');
        setAttribute(element, 'aria-label', `Measure ${measureNumber}`);
        addClass(element, 'score-measure-hit-target', 'professional-musicxml-measure');

        measureMap.set(measureIndex, {
            element,
            pageNumber: getDatasetNumber(element, 'pageNumber', 1),
            systemIndex: getDatasetNumber(element, 'systemIndex', 0),
            measureIndex,
            measureNumber,
            eventIds: []
        });
    });

    return measureMap;
}

function collectNotes(container, measureMap) {
    const noteMap = new Map();
    const eventMap = new Map();
    const playbackTimeline = [];
    const noteElements = asElementList(container, 'g.vf-stavenote');

    noteElements.forEach((element, index) => {
        const eventId = getDatasetValue(element, 'musicxmlEventId', `osmd-event-${index + 1}`);
        const measureIndex = getDatasetNumber(element, 'measureIndex', null);
        setDatasetValue(element, 'musicxmlEventId', eventId);
        setAttribute(element, 'role', 'button');
        setAttribute(element, 'tabindex', '0');
        setAttribute(element, 'aria-label', `Score event ${index + 1}`);
        addClass(element, 'professional-musicxml-note');

        const noteEntry = {
            eventId,
            element,
            index,
            measureIndex,
            source: null
        };
        noteMap.set(eventId, noteEntry);
        eventMap.set(eventId, [element]);
        playbackTimeline.push({
            eventId,
            index,
            measureIndex,
            beat: null,
            durationBeats: null
        });

        if (Number.isInteger(measureIndex) && measureMap.has(measureIndex)) {
            measureMap.get(measureIndex).eventIds.push(eventId);
        }
    });

    return { eventMap, noteMap, playbackTimeline };
}

export function describeProfessionalRendererContract() {
    return {
        version: PROFESSIONAL_MUSICXML_RENDERER_VERSION,
        preferredRenderer: 'osmd',
        requiredMethods: [
            'load',
            'render',
            'destroy',
            'highlightEvents',
            'clearHighlights',
            'setRange',
            'clearRange',
            'onMeasureClick',
            'onNoteClick',
            'getPlaybackTimeline'
        ],
        renderResultFields: ['pages', 'eventMap', 'measureMap', 'noteMap', 'playbackTimeline', 'renderer']
    };
}

export class ProfessionalMusicXmlRenderer {
    constructor(options = {}) {
        this.options = options;
        this.documentRef = options.documentRef || globalThis.document || null;
        this.globalRef = options.globalRef || globalThis;
        this.scriptSrc = options.scriptSrc || DEFAULT_OSMD_SCRIPT_PATH;
        this.scriptLoader = options.scriptLoader || defaultScriptLoader;
        this.osmdClass = options.osmdClass || options.OpenSheetMusicDisplay || null;
        this.osmdOptions = {
            ...DEFAULT_OSMD_OPTIONS,
            ...(options.osmdOptions || {})
        };
        this.measureHandlers = new Set();
        this.noteHandlers = new Set();
        this.domListeners = [];
        this.highlightedElements = new Set();
        this.highlightOriginalAttributes = new WeakMap();
        this.rangeElements = new Set();
        this.resetState();
    }

    resetState() {
        this.xmlText = '';
        this.metadata = {};
        this.container = null;
        this.osmd = null;
        this.pages = [];
        this.eventMap = new Map();
        this.measureMap = new Map();
        this.noteMap = new Map();
        this.playbackTimeline = [];
    }

    async load(source, metadata = {}) {
        const normalized = normalizeSource(source, metadata);
        this.xmlText = normalized.xmlText;
        this.metadata = normalized.metadata;
        return this;
    }

    async resolveOsmdClass() {
        if (this.osmdClass) return this.osmdClass;
        const globalClass = getGlobalOsmdClass(this.globalRef);
        if (globalClass) {
            this.osmdClass = globalClass;
            return globalClass;
        }

        await this.scriptLoader(this.scriptSrc, this.documentRef);
        const loadedClass = getGlobalOsmdClass(this.globalRef);
        if (!loadedClass) {
            throw makeRenderError('OSMD loaded but OpenSheetMusicDisplay was not available.', 'OSMD_CLASS_UNAVAILABLE');
        }
        this.osmdClass = loadedClass;
        return loadedClass;
    }

    async render(container, options = {}) {
        if (!this.xmlText) {
            throw makeRenderError('Load MusicXML before rendering.', 'MUSICXML_NOT_LOADED');
        }
        if (!container) {
            throw makeRenderError('A render container is required.', 'RENDER_CONTAINER_REQUIRED');
        }

        this.unwireDomEvents();
        this.clearHighlights();
        this.clearRange();
        this.container = container;
        clearChildren(container);

        const OsmdClass = await this.resolveOsmdClass();
        this.osmd = new OsmdClass(container, {
            ...this.osmdOptions,
            ...(options.osmdOptions || {})
        });
        await this.osmd.load(this.xmlText);
        this.osmd.render();

        this.pages = collectPages(container, this.osmd);
        this.measureMap = collectMeasures(container);
        const noteState = collectNotes(container, this.measureMap);
        this.eventMap = noteState.eventMap;
        this.noteMap = noteState.noteMap;
        this.playbackTimeline = noteState.playbackTimeline;
        this.wireDomEvents();

        return this.getRenderResult();
    }

    getRenderResult() {
        return {
            renderer: 'osmd',
            rendererVersion: this.globalRef?.opensheetmusicdisplay?.version || '1.9.9',
            metadata: this.metadata,
            pages: this.pages,
            eventMap: this.eventMap,
            measureMap: this.measureMap,
            noteMap: this.noteMap,
            playbackTimeline: this.playbackTimeline,
            osmd: this.osmd
        };
    }

    wireDomEvents() {
        for (const entry of this.measureMap.values()) {
            const handler = event => {
                for (const callback of this.measureHandlers) callback({ ...entry, event });
            };
            entry.element?.addEventListener?.('click', handler);
            this.domListeners.push({ element: entry.element, type: 'click', handler });
        }

        for (const entry of this.noteMap.values()) {
            const handler = event => {
                for (const callback of this.noteHandlers) callback({ ...entry, event });
            };
            entry.element?.addEventListener?.('click', handler);
            this.domListeners.push({ element: entry.element, type: 'click', handler });
        }
    }

    unwireDomEvents() {
        this.domListeners.forEach(({ element, type, handler }) => {
            element?.removeEventListener?.(type, handler);
        });
        this.domListeners = [];
    }

    highlightEvents(eventIds, color = DEFAULT_HIGHLIGHT_COLOR) {
        for (const eventId of toArray(eventIds)) {
            const elements = this.eventMap.get(eventId) || [];
            elements.forEach(element => {
                addClass(element, 'professional-musicxml-highlight');
                setDatasetValue(element, 'highlighted', 'true');
                this.highlightedElements.add(element);
                asElementList(element, 'path, rect, text').forEach(shape => {
                    if (!this.highlightOriginalAttributes.has(shape)) {
                        this.highlightOriginalAttributes.set(shape, {
                            fill: shape.getAttribute?.('fill'),
                            stroke: shape.getAttribute?.('stroke')
                        });
                    }
                    setAttribute(shape, 'fill', color);
                    setAttribute(shape, 'stroke', color);
                });
            });
        }
    }

    clearHighlights() {
        for (const element of this.highlightedElements) {
            removeClass(element, 'professional-musicxml-highlight');
            if (element?.dataset) delete element.dataset.highlighted;
            asElementList(element, 'path, rect, text').forEach(shape => {
                const original = this.highlightOriginalAttributes.get(shape) || {};
                if (original.fill === null || original.fill === undefined) {
                    removeAttribute(shape, 'fill');
                } else {
                    setAttribute(shape, 'fill', original.fill);
                }
                if (original.stroke === null || original.stroke === undefined) {
                    removeAttribute(shape, 'stroke');
                } else {
                    setAttribute(shape, 'stroke', original.stroke);
                }
                this.highlightOriginalAttributes.delete(shape);
            });
        }
        this.highlightedElements.clear();
    }

    setRange(startMeasure, endMeasure, color = DEFAULT_RANGE_COLOR) {
        this.clearRange();
        const entries = [...this.measureMap.values()]
            .sort((a, b) => a.measureIndex - b.measureIndex);
        const start = this.findMeasureEntry(entries, startMeasure);
        const end = this.findMeasureEntry(entries, endMeasure ?? startMeasure);
        if (!start || !end) return null;

        const low = Math.min(start.measureIndex, end.measureIndex);
        const high = Math.max(start.measureIndex, end.measureIndex);
        const selected = entries.filter(entry => entry.measureIndex >= low && entry.measureIndex <= high);
        selected.forEach(entry => {
            addClass(entry.element, 'professional-musicxml-range', 'range-selected');
            setDatasetValue(entry.element, 'rangeSelected', 'true');
            setAttribute(entry.element, 'data-range-color', color);
            if (entry.measureIndex === low || entry.measureIndex === high) {
                addClass(entry.element, 'range-boundary');
            }
            this.rangeElements.add(entry.element);
        });

        return {
            startMeasureIndex: low,
            endMeasureIndex: high,
            startMeasureNumber: start.measureNumber,
            endMeasureNumber: end.measureNumber
        };
    }

    findMeasureEntry(entries, target) {
        if (target && typeof target === 'object' && target.element) return target;
        if (Number.isInteger(target)) {
            return entries.find(entry => entry.measureIndex === target) || null;
        }
        return entries.find(entry => (
            String(entry.measureIndex) === String(target)
            || String(entry.measureNumber) === String(target)
        )) || null;
    }

    clearRange() {
        for (const element of this.rangeElements) {
            removeClass(element, 'professional-musicxml-range', 'range-selected', 'range-boundary');
            if (element?.dataset) delete element.dataset.rangeSelected;
            removeAttribute(element, 'data-range-color');
        }
        this.rangeElements.clear();
    }

    onMeasureClick(handler) {
        this.measureHandlers.add(handler);
        return () => this.measureHandlers.delete(handler);
    }

    onNoteClick(handler) {
        this.noteHandlers.add(handler);
        return () => this.noteHandlers.delete(handler);
    }

    getPlaybackTimeline() {
        return this.playbackTimeline.map(item => ({ ...item }));
    }

    destroy() {
        this.unwireDomEvents();
        this.clearHighlights();
        this.clearRange();
        if (this.container) clearChildren(this.container);
        this.resetState();
    }
}

export function createProfessionalMusicXmlRenderer(options = {}) {
    return new ProfessionalMusicXmlRenderer(options);
}
