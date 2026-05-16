export const PROFESSIONAL_MUSICXML_RENDERER_VERSION = 'phase6-osmd-facade-v1';
export const DEFAULT_OSMD_SCRIPT_PATH = '/node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js';
export const DEFAULT_HIGHLIGHT_COLOR = '#2fd7a3';
export const DEFAULT_RANGE_COLOR = '#98f5d2';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_GRID_GAP = 32;

const DEFAULT_OSMD_OPTIONS = {
    backend: 'svg',
    autoResize: false,
    disableCursor: false,
    drawCredits: true,
    drawTitle: true,
    drawSubtitle: true,
    drawComposer: true,
    useXMLMeasureNumbers: true,
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

function getElementId(element) {
    if (!element) return '';
    return element.id || element.getAttribute?.('id') || '';
}

function clearChildren(container) {
    if (!container) return;
    if (typeof container.replaceChildren === 'function') {
        container.replaceChildren();
    } else {
        container.innerHTML = '';
    }
}

function firstSvgDimension(svg, attribute, fallback) {
    const raw = svg?.getAttribute?.(attribute) || '';
    const numeric = Number.parseFloat(raw);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const viewBox = svg?.getAttribute?.('viewBox') || '';
    const parts = viewBox.split(/\s+/).map(Number);
    const index = attribute === 'width' ? 2 : 3;
    return Number.isFinite(parts[index]) && parts[index] > 0 ? parts[index] : fallback;
}

function normalizePageSize(pageElements, svgElements) {
    const firstSvg = svgElements[0] || pageElements[0]?.querySelector?.('svg') || null;
    const rawWidth = firstSvgDimension(firstSvg, 'width', PAGE_WIDTH);
    const rawHeight = firstSvgDimension(firstSvg, 'height', PAGE_HEIGHT);
    const ratio = rawHeight / rawWidth;
    return {
        width: PAGE_WIDTH,
        height: Math.round(PAGE_WIDTH * (Number.isFinite(ratio) && ratio > 0 ? ratio : PAGE_HEIGHT / PAGE_WIDTH))
    };
}

function scaleScoreSheet(sheetView, pageGrid) {
    if (!sheetView || !pageGrid) return;
    const availableWidth = sheetView.clientWidth || pageGrid.offsetWidth || PAGE_WIDTH;
    const pageCount = pageGrid.children?.length || 1;
    const columnCount = pageGrid.classList.contains('single-page') || pageCount <= 1 ? 1 : 2;
    const pageWidth = Number.parseFloat(pageGrid.style.getPropertyValue('--score-page-width')) || PAGE_WIDTH;
    const gap = Number.parseFloat(pageGrid.style.getPropertyValue('--score-page-gap')) || PAGE_GRID_GAP;
    const intrinsicWidth = columnCount === 1 ? pageWidth : (pageWidth * 2 + gap);
    const scale = Math.min(1, availableWidth / intrinsicWidth);
    pageGrid.style.setProperty('--score-scale', scale.toString());
    sheetView.style.height = `${Math.ceil(pageGrid.offsetHeight * scale)}px`;
}

function installPageWrappers(container, osmd) {
    const existingPages = asElementList(container, '[id^="osmdCanvasPage"]');
    const directSvgs = asElementList(container, ':scope > svg');
    const pageElements = existingPages.length ? existingPages : directSvgs;
    if (!pageElements.length) return null;

    const svgElements = pageElements
        .map(page => page.tagName?.toLowerCase?.() === 'svg' ? page : page.querySelector?.('svg'))
        .filter(Boolean);
    const pageSize = normalizePageSize(pageElements, svgElements);
    const sheetView = container.ownerDocument?.createElement
        ? container.ownerDocument.createElement('div')
        : globalThis.document?.createElement?.('div');
    const pageGrid = container.ownerDocument?.createElement
        ? container.ownerDocument.createElement('div')
        : globalThis.document?.createElement?.('div');
    if (!sheetView || !pageGrid) return null;

    const singlePage = pageElements.length <= 1;
    sheetView.className = singlePage ? 'score-sheet-view single-page professional-score-view' : 'score-sheet-view professional-score-view';
    pageGrid.className = singlePage ? 'score-page-grid single-page professional-score-grid' : 'score-page-grid professional-score-grid';
    pageGrid.style.setProperty('--score-page-width', `${pageSize.width}px`);
    pageGrid.style.setProperty('--score-page-height', `${pageSize.height}px`);
    pageGrid.style.setProperty('--score-page-gap', `${PAGE_GRID_GAP}px`);
    pageGrid.style.width = singlePage
        ? `${pageSize.width}px`
        : `${(pageSize.width * 2) + PAGE_GRID_GAP}px`;
    sheetView.appendChild(pageGrid);

    pageElements.forEach((pageElement, index) => {
        addClass(pageElement, 'score-page', 'professional-score-page');
        setDatasetValue(pageElement, 'page', index + 1);
        pageElement.style.width = `${pageSize.width}px`;
        pageElement.style.height = `${pageSize.height}px`;
        pageGrid.appendChild(pageElement);
    });

    clearChildren(container);
    container.appendChild(sheetView);
    scaleScoreSheet(sheetView, pageGrid);

    return {
        sheetView,
        pageGrid,
        pageSize,
        musicPages: osmd?.GraphicSheet?.musicPages || []
    };
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

function getElementRect(element) {
    const rect = element?.getBoundingClientRect?.();
    if (rect && Number.isFinite(rect.x) && Number.isFinite(rect.y)) {
        return {
            x: rect.x,
            y: rect.y,
            width: rect.width || 0,
            height: rect.height || 0
        };
    }

    return {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
}

function groupElementsByVisualRows(elements) {
    const sorted = elements
        .map(element => ({ element, rect: getElementRect(element) }))
        .sort((a, b) => (a.rect.y - b.rect.y) || (a.rect.x - b.rect.x));

    const rows = [];
    sorted.forEach(item => {
        const tolerance = Math.max(36, item.rect.height * 1.4);
        const row = rows.find(candidate => Math.abs(candidate.y - item.rect.y) <= tolerance);
        if (row) {
            row.items.push(item);
            row.y = row.items.reduce((sum, value) => sum + value.rect.y, 0) / row.items.length;
        } else {
            rows.push({ y: item.rect.y, items: [item] });
        }
    });

    return rows
        .map(row => ({
            ...row,
            items: row.items.sort((a, b) => a.rect.x - b.rect.x)
        }))
        .sort((a, b) => a.y - b.y);
}

function getSequenceMeasures(sequence) {
    return Array.isArray(sequence?.measures) ? sequence.measures : [];
}

function getStavesPerSystem(sequenceMeasures) {
    const firstCount = Number(sequenceMeasures.find(measure => Number(measure?.staves?.count) > 0)?.staves?.count);
    return Number.isInteger(firstCount) && firstCount > 0 ? firstCount : 1;
}

function groupRowsBySystem(rows, stavesPerSystem) {
    const systems = [];
    for (let index = 0; index < rows.length; index += stavesPerSystem) {
        systems.push({
            systemIndex: systems.length,
            rows: rows.slice(index, index + stavesPerSystem)
        });
    }
    return systems;
}

function closestRowItem(row, targetX) {
    return row?.items?.reduce((best, item) => {
        if (!best) return item;
        return Math.abs(item.rect.x - targetX) < Math.abs(best.rect.x - targetX) ? item : best;
    }, null) || null;
}

function sequenceMeasuresBySystem(sequenceMeasures) {
    const bySystem = new Map();
    sequenceMeasures.forEach((measure, index) => {
        const systemIndex = Number.isInteger(measure?.systemIndex) ? measure.systemIndex : 0;
        if (!bySystem.has(systemIndex)) bySystem.set(systemIndex, []);
        bySystem.get(systemIndex).push({ measure, sourceOrder: index });
    });
    return bySystem;
}

function selectVisualMeasureTargets(measureElements, sequenceMeasures) {
    if (!sequenceMeasures.length) {
        return measureElements.map((element, index) => ({
            element,
            elements: [element],
            measure: { measureIndex: index, measureNumber: index + 1 },
            sourceOrder: index
        }));
    }

    if (!measureElements.length) return [];

    const rows = groupElementsByVisualRows(measureElements);
    const stavesPerSystem = getStavesPerSystem(sequenceMeasures);
    const systems = groupRowsBySystem(rows, stavesPerSystem);
    const bySystem = sequenceMeasuresBySystem(sequenceMeasures);
    const selected = [];

    systems.forEach(system => {
        const measuresForSystem = bySystem.get(system.systemIndex) || [];
        const topRow = system.rows[0];
        if (!topRow || !measuresForSystem.length) return;

        measuresForSystem.forEach(({ measure, sourceOrder }, localIndex) => {
            const topItem = topRow.items[Math.min(localIndex, topRow.items.length - 1)] || null;
            if (!topItem) return;
            const elements = system.rows
                .map(row => closestRowItem(row, topItem.rect.x)?.element)
                .filter(Boolean);
            selected[sourceOrder] = {
                element: topItem.element,
                elements: [...new Set([topItem.element, ...elements])],
                measure,
                sourceOrder
            };
        });
    });

    const complete = selected.filter(Boolean);
    if (complete.length === sequenceMeasures.length) return complete;

    const preferredElements = measureElements.filter(element => getElementId(element) !== '-1');
    const fallbackElements = preferredElements.length >= sequenceMeasures.length ? preferredElements : measureElements;
    return sequenceMeasures.map((measure, index) => {
        const scaledIndex = sequenceMeasures.length === 1
            ? 0
            : Math.round(index * (fallbackElements.length - 1) / (sequenceMeasures.length - 1));
        const element = fallbackElements[Math.min(scaledIndex, fallbackElements.length - 1)] || measureElements[0];
        return {
            element,
            elements: [element],
            measure,
            sourceOrder: index
        };
    });
}

function collectMeasures(container, sequence = null) {
    const measureMap = new Map();
    const measureElements = asElementList(container, 'g.vf-measure');
    const sequenceMeasures = getSequenceMeasures(sequence);
    const selectedTargets = selectVisualMeasureTargets(measureElements, sequenceMeasures);
    const selectedElements = new Set(selectedTargets.map(target => target.element));

    measureElements.forEach((element, index) => {
        if (!selectedElements.has(element)) {
            addClass(element, 'professional-musicxml-measure-part');
            return;
        }

        const target = selectedTargets.find(item => item.element === element);
        const measure = target?.measure || {};
        const measureIndex = Number.isInteger(measure.measureIndex)
            ? measure.measureIndex
            : getDatasetNumber(element, 'measureIndex', index);
        const measureNumber = String(measure.measureNumber ?? getDatasetValue(element, 'measureNumber', measureIndex + 1));
        setDatasetValue(element, 'musicxmlMeasure', 'true');
        setDatasetValue(element, 'measureIndex', measureIndex);
        setDatasetValue(element, 'measureNumber', measureNumber);
        setAttribute(element, 'role', 'button');
        setAttribute(element, 'tabindex', '0');
        setAttribute(element, 'aria-label', `Measure ${measureNumber}`);
        addClass(element, 'score-measure-hit-target', 'professional-musicxml-measure');

        measureMap.set(measureIndex, {
            element,
            elements: target?.elements || [element],
            pageNumber: Number.isInteger(measure.pageNumber) ? measure.pageNumber : getDatasetNumber(element, 'pageNumber', 1),
            systemIndex: Number.isInteger(measure.systemIndex) ? measure.systemIndex : getDatasetNumber(element, 'systemIndex', 0),
            measureIndex,
            measureNumber,
            eventIds: [...(measure.canonicalEventIds || measure.eventIds || [])]
        });
    });

    return measureMap;
}

function collectNotes(container, measureMap, sequence = null) {
    const noteMap = new Map();
    const eventMap = new Map();
    const playbackTimeline = [];
    const noteElements = asElementList(container, 'g.vf-stavenote');
    const sequenceEvents = Array.isArray(sequence?.events) ? sequence.events : [];

    noteElements.forEach((element, index) => {
        const sequenceEvent = sequenceEvents[index] || null;
        const eventId = sequenceEvent?.id || getDatasetValue(element, 'musicxmlEventId', `osmd-event-${index + 1}`);
        const measureIndex = Number.isInteger(sequenceEvent?.measureIndex)
            ? sequenceEvent.measureIndex
            : getDatasetNumber(element, 'measureIndex', null);
        setDatasetValue(element, 'musicxmlEventId', eventId);
        if (Number.isInteger(measureIndex)) setDatasetValue(element, 'measureIndex', measureIndex);
        setAttribute(element, 'role', 'button');
        setAttribute(element, 'tabindex', '0');
        setAttribute(element, 'aria-label', `Score event ${index + 1}`);
        addClass(element, 'professional-musicxml-note');

        const noteEntry = {
            eventId,
            element,
            index,
            measureIndex,
            source: sequenceEvent
        };
        noteMap.set(eventId, noteEntry);
        if (!eventMap.has(eventId)) eventMap.set(eventId, []);
        eventMap.get(eventId).push(element);
        playbackTimeline.push({
            eventId,
            index,
            measureIndex,
            beat: sequenceEvent?.startBeat ?? null,
            durationBeats: sequenceEvent?.durationBeats ?? null
        });

        if (Number.isInteger(measureIndex) && measureMap.has(measureIndex)) {
            const measureEntry = measureMap.get(measureIndex);
            if (!measureEntry.eventIds.includes(eventId)) measureEntry.eventIds.push(eventId);
        }
    });

    const diagnostics = [];
    const unmappedEvents = sequenceEvents.filter(event => !eventMap.has(event.id));
    if (unmappedEvents.length) {
        diagnostics.push({
            severity: 'warning',
            code: 'OSMD_EVENT_MAPPING_INCOMPLETE',
            message: `${unmappedEvents.length} canonical playback events did not receive OSMD note elements.`,
            eventIds: unmappedEvents.map(event => event.id)
        });
    }

    if (noteElements.length > sequenceEvents.length && sequenceEvents.length > 0) {
        diagnostics.push({
            severity: 'info',
            code: 'OSMD_EXTRA_NOTE_ELEMENTS',
            message: `${noteElements.length - sequenceEvents.length} OSMD note elements did not map to canonical playback events.`
        });
    }

    return { eventMap, noteMap, playbackTimeline, diagnostics };
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
        this.diagnostics = [];
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
        this.pageLayout = installPageWrappers(container, this.osmd);

        this.pages = collectPages(container, this.osmd);
        this.measureMap = collectMeasures(container, options.sequence);
        const noteState = collectNotes(container, this.measureMap, options.sequence);
        this.eventMap = noteState.eventMap;
        this.noteMap = noteState.noteMap;
        this.playbackTimeline = noteState.playbackTimeline;
        this.diagnostics = noteState.diagnostics;
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
            diagnostics: this.diagnostics,
            osmd: this.osmd,
            clearHighlights: () => this.clearHighlights(),
            highlightEvents: (eventIds, color) => this.highlightEvents(eventIds, color),
            clearRange: () => this.clearRange(),
            setRange: (startMeasure, endMeasure, color) => this.setRange(startMeasure, endMeasure, color),
            onMeasureClick: handler => this.onMeasureClick(handler),
            onNoteClick: handler => this.onNoteClick(handler),
            getPlaybackTimeline: () => this.getPlaybackTimeline()
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
            const elements = entry.elements?.length ? entry.elements : [entry.element];
            elements.forEach(element => {
                addClass(element, 'professional-musicxml-range', 'range-selected');
                setDatasetValue(element, 'rangeSelected', 'true');
                setAttribute(element, 'data-range-color', color);
                if (entry.measureIndex === low || entry.measureIndex === high) {
                    addClass(element, 'range-boundary');
                }
                this.rangeElements.add(element);
            });
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
