import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import {
    DEFAULT_HIGHLIGHT_COLOR,
    DEFAULT_RANGE_COLOR,
    ProfessionalMusicXmlRenderer,
    createProfessionalMusicXmlRenderer,
    describeProfessionalRendererContract
} from '../js/professionalMusicXmlRenderer.js';
import { readMusicXmlFile } from '../js/musicXmlFileReader.js';
import { adaptMusicXmlDocumentToCanonical } from '../js/musicXmlCanonicalAdapter.js';
import { parseMusicXmlText } from '../js/musicXmlParser.js';

const FIXTURE_SUITE_ROOT = resolve(new URL('.', import.meta.url).pathname, 'fixtures/musicxml-suite');
const MANIFEST_PATH = resolve(FIXTURE_SUITE_ROOT, 'MANIFEST.json');

function readFixtureManifest() {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

async function readManifestFixtureXml(fixture) {
    const filePath = resolve(FIXTURE_SUITE_ROOT, fixture.file);
    if (/\.mxl$/i.test(filePath)) {
        const file = new File([readFileSync(filePath)], basename(filePath), {
            type: 'application/vnd.recordare.musicxml'
        });
        const result = await readMusicXmlFile(file);
        assert.equal(result.ok, true, `${fixture.id} MXL should extract MusicXML`);
        return result.xmlText;
    }
    return readFileSync(filePath, 'utf8');
}

class FakeClassList {
    constructor(initial = []) {
        this.values = new Set(initial);
    }

    add(...classNames) {
        classNames.forEach(className => this.values.add(className));
    }

    remove(...classNames) {
        classNames.forEach(className => this.values.delete(className));
    }

    contains(className) {
        return this.values.has(className);
    }

    toString() {
        return [...this.values].join(' ');
    }
}

class FakeElement {
    constructor(tagName, options = {}) {
        this.tagName = tagName.toUpperCase();
        this.id = options.id || '';
        this.dataset = { ...(options.dataset || {}) };
        this.attributes = new Map();
        this.children = [];
        this.parentElement = null;
        this.classList = new FakeClassList(options.classes || []);
        this.listeners = new Map();
        this.innerHTML = '';
        this.tabIndex = -1;
    }

    appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    replaceChildren(...children) {
        this.children = [];
        children.forEach(child => this.appendChild(child));
        this.innerHTML = '';
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'id') this.id = String(value);
        if (name === 'tabindex') this.tabIndex = Number(value);
        if (name.startsWith('data-')) {
            const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            this.dataset[key] = String(value);
        }
    }

    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    removeAttribute(name) {
        this.attributes.delete(name);
        if (name.startsWith('data-')) {
            const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            delete this.dataset[key];
        }
    }

    addEventListener(type, handler) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(handler);
    }

    removeEventListener(type, handler) {
        this.listeners.get(type)?.delete(handler);
    }

    dispatchEvent(event) {
        event.currentTarget = this;
        event.target = event.target || this;
        this.listeners.get(event.type)?.forEach(handler => handler(event));
    }

    querySelectorAll(selector) {
        const selectors = selector.split(',').map(item => item.trim());
        const matches = [];
        const visit = element => {
            element.children.forEach(child => {
                if (selectors.some(item => child.matchesSelector(item))) matches.push(child);
                visit(child);
            });
        };
        visit(this);
        return matches;
    }

    matchesSelector(selector) {
        if (selector === 'svg') return this.tagName === 'SVG';
        if (selector === 'path') return this.tagName === 'PATH';
        if (selector === 'rect') return this.tagName === 'RECT';
        if (selector === 'text') return this.tagName === 'TEXT';
        if (selector === 'g.vf-measure') return this.tagName === 'G' && this.classList.contains('vf-measure');
        if (selector === 'g.vf-stavenote') return this.tagName === 'G' && this.classList.contains('vf-stavenote');
        if (selector === '[id^="osmdCanvasPage"]') return this.id.startsWith('osmdCanvasPage');
        return false;
    }
}

class FakeOsmd {
    constructor(container, options) {
        this.container = container;
        this.options = options;
        this.GraphicSheet = {
            musicPages: [{ pageNumber: 1 }]
        };
        this.cursor = { iterator: true };
    }

    async load(xmlText) {
        this.xmlText = xmlText;
    }

    render() {
        const page = new FakeElement('div', { id: 'osmdCanvasPage1' });
        const svg = new FakeElement('svg');
        page.appendChild(svg);

        for (let measureIndex = 0; measureIndex < 2; measureIndex += 1) {
            const measure = new FakeElement('g', {
                classes: ['vf-measure'],
                dataset: {
                    pageNumber: '1',
                    systemIndex: '0',
                    measureIndex: String(measureIndex),
                    measureNumber: String(measureIndex + 1)
                }
            });
            svg.appendChild(measure);

            const note = new FakeElement('g', {
                classes: ['vf-stavenote'],
                dataset: {
                    measureIndex: String(measureIndex)
                }
            });
            note.appendChild(new FakeElement('path'));
            measure.appendChild(note);
        }

        this.container.appendChild(page);
    }
}

test('declares the stable professional renderer contract', () => {
    const contract = describeProfessionalRendererContract();

    assert.equal(contract.preferredRenderer, 'osmd');
    [
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
    ].forEach(method => {
        assert.ok(contract.requiredMethods.includes(method), `${method} should be part of the facade`);
    });
    assert.ok(contract.renderResultFields.includes('eventMap'));
    assert.ok(contract.renderResultFields.includes('measureMap'));
    assert.ok(contract.renderResultFields.includes('noteMap'));
});

test('renders through an injected OSMD class and exposes pages maps events and timeline', async () => {
    const container = new FakeElement('div');
    const renderer = createProfessionalMusicXmlRenderer({ osmdClass: FakeOsmd });

    assert.ok(renderer instanceof ProfessionalMusicXmlRenderer);
    await renderer.load('<score-partwise version="4.0"></score-partwise>', { sourceId: 'fake-score' });
    const result = await renderer.render(container);

    assert.equal(result.renderer, 'osmd');
    assert.equal(result.metadata.sourceId, 'fake-score');
    assert.equal(result.pages.length, 1);
    assert.equal(result.measureMap.size, 2);
    assert.equal(result.eventMap.size, 2);
    assert.equal(result.noteMap.size, 2);
    assert.deepEqual(renderer.getPlaybackTimeline().map(item => item.eventId), ['osmd-event-1', 'osmd-event-2']);
});

test('supports measure clicks note clicks highlights ranges and cleanup', async () => {
    const container = new FakeElement('div');
    const renderer = createProfessionalMusicXmlRenderer({ osmdClass: FakeOsmd });
    const clickedMeasures = [];
    const clickedNotes = [];
    renderer.onMeasureClick(entry => clickedMeasures.push(entry.measureNumber));
    renderer.onNoteClick(entry => clickedNotes.push(entry.eventId));

    await renderer.load({ xmlText: '<score-partwise version="4.0"></score-partwise>' });
    const result = await renderer.render(container);

    const firstMeasure = result.measureMap.get(0).element;
    const firstNote = result.noteMap.get('osmd-event-1').element;
    firstMeasure.dispatchEvent({ type: 'click' });
    firstNote.dispatchEvent({ type: 'click' });

    assert.deepEqual(clickedMeasures, ['1']);
    assert.deepEqual(clickedNotes, ['osmd-event-1']);

    renderer.highlightEvents('osmd-event-1', DEFAULT_HIGHLIGHT_COLOR);
    assert.equal(firstNote.classList.contains('professional-musicxml-highlight'), true);
    assert.equal(firstNote.querySelectorAll('path')[0].getAttribute('fill'), DEFAULT_HIGHLIGHT_COLOR);

    const range = renderer.setRange(0, 1, DEFAULT_RANGE_COLOR);
    assert.deepEqual(range, {
        startMeasureIndex: 0,
        endMeasureIndex: 1,
        startMeasureNumber: '1',
        endMeasureNumber: '2'
    });
    assert.equal(firstMeasure.classList.contains('professional-musicxml-range'), true);
    assert.equal(firstMeasure.getAttribute('data-range-color'), DEFAULT_RANGE_COLOR);

    renderer.clearHighlights();
    renderer.clearRange();
    assert.equal(firstNote.classList.contains('professional-musicxml-highlight'), false);
    assert.equal(firstNote.querySelectorAll('path')[0].getAttribute('fill'), null);
    assert.equal(firstMeasure.classList.contains('professional-musicxml-range'), false);
    assert.equal(firstMeasure.getAttribute('data-range-color'), null);

    renderer.destroy();
    assert.equal(container.children.length, 0);
    assert.equal(renderer.eventMap.size, 0);
    assert.equal(renderer.measureMap.size, 0);
    assert.equal(renderer.noteMap.size, 0);
});

test('maps canonical sequence events and measures onto OSMD DOM hooks', async () => {
    const container = new FakeElement('div');
    const renderer = createProfessionalMusicXmlRenderer({ osmdClass: FakeOsmd });
    const sequence = {
        measures: [
            {
                measureIndex: 0,
                measureNumber: 'A',
                systemIndex: 0,
                staves: { count: 1 },
                canonicalEventIds: ['canonical-event-a']
            },
            {
                measureIndex: 1,
                measureNumber: 'B',
                systemIndex: 0,
                staves: { count: 1 },
                canonicalEventIds: ['canonical-event-b']
            }
        ],
        events: [
            { id: 'canonical-event-a', measureIndex: 0, startBeat: 0, durationBeats: 1 },
            { id: 'canonical-event-b', measureIndex: 1, startBeat: 1, durationBeats: 1 }
        ]
    };

    await renderer.load('<score-partwise version="4.0"></score-partwise>');
    const result = await renderer.render(container, { sequence });

    assert.deepEqual([...result.eventMap.keys()], ['canonical-event-a', 'canonical-event-b']);
    assert.equal(result.noteMap.get('canonical-event-a').source, sequence.events[0]);
    assert.deepEqual(result.playbackTimeline.map(item => item.eventId), ['canonical-event-a', 'canonical-event-b']);
    assert.deepEqual([...result.measureMap.values()].map(measure => [measure.measureIndex, measure.measureNumber]), [
        [0, 'A'],
        [1, 'B']
    ]);
    assert.deepEqual(result.measureMap.get(0).eventIds, ['canonical-event-a']);
    assert.equal(result.diagnostics.length, 0);

    result.highlightEvents('canonical-event-a');
    assert.equal(result.eventMap.get('canonical-event-a')[0].classList.contains('professional-musicxml-highlight'), true);
    result.clearHighlights();
    assert.equal(result.eventMap.get('canonical-event-a')[0].classList.contains('professional-musicxml-highlight'), false);
});

test('reports unmapped canonical events instead of assigning misleading OSMD hooks', async () => {
    const container = new FakeElement('div');
    const renderer = createProfessionalMusicXmlRenderer({ osmdClass: FakeOsmd });
    const sequence = {
        measures: [
            { measureIndex: 0, measureNumber: '1', systemIndex: 0, staves: { count: 1 } }
        ],
        events: [
            { id: 'mapped-a', measureIndex: 0, startBeat: 0, durationBeats: 1 },
            { id: 'mapped-b', measureIndex: 0, startBeat: 1, durationBeats: 1 },
            { id: 'missing-c', measureIndex: 0, startBeat: 2, durationBeats: 1 }
        ]
    };

    await renderer.load('<score-partwise version="4.0"></score-partwise>');
    const result = await renderer.render(container, { sequence });
    const warning = result.diagnostics.find(diagnostic => diagnostic.code === 'OSMD_EVENT_MAPPING_INCOMPLETE');

    assert.ok(warning);
    assert.deepEqual(warning.eventIds, ['missing-c']);
    assert.equal(result.eventMap.has('missing-c'), false);
});

test('validates curated MusicXML suite manifest source license and hard gate policy', () => {
    const manifest = readFixtureManifest();
    const licenseText = readFileSync(resolve(FIXTURE_SUITE_ROOT, manifest.source.licenseFile), 'utf8');
    const hardGateStatuses = new Set(manifest.policy.hardGateStatuses);
    const fixtureIds = new Set();
    const categories = new Set();

    assert.equal(manifest.source.name, 'cuthbertLab/musicxmlTestSuite');
    assert.equal(manifest.source.license, 'MIT');
    assert.match(manifest.source.commit, /^[a-f0-9]{40}$/);
    assert.match(licenseText, /MIT License/);
    assert.equal(manifest.policy.fullExternalSuiteHardGate, false);

    for (const fixture of manifest.fixtures) {
        assert.equal(fixtureIds.has(fixture.id), false, `${fixture.id} should be unique`);
        fixtureIds.add(fixture.id);
        categories.add(fixture.category);
        assert.ok(existsSync(resolve(FIXTURE_SUITE_ROOT, fixture.file)), `${fixture.file} should exist`);
        assert.ok(Array.isArray(fixture.gates) && fixture.gates.length > 0, `${fixture.id} should define gates`);
        if (hardGateStatuses.has(fixture.expectedStatus)) {
            assert.ok(fixture.gates.includes('renderer-load'), `${fixture.id} hard gate should exercise renderer load path`);
        }
    }

    manifest.requiredCategories.forEach(category => {
        assert.ok(categories.has(category), `${category} should be represented by the curated subset`);
    });
});

test('runs hard gate MusicXML suite fixtures through parser adapter gates and renderer facade path', async () => {
    const manifest = readFixtureManifest();
    const hardGateStatuses = new Set(manifest.policy.hardGateStatuses);
    const hardGateFixtures = manifest.fixtures.filter(fixture => hardGateStatuses.has(fixture.expectedStatus));

    assert.ok(hardGateFixtures.length >= 4, 'curated suite should start with several hard gate fixtures');

    for (const fixture of hardGateFixtures) {
        const xmlText = await readManifestFixtureXml(fixture);
        const parsed = parseMusicXmlText(xmlText, {
            sourceId: fixture.id,
            filename: basename(fixture.file)
        });

        assert.ok(parsed.document, `${fixture.id} should parse into a MusicXML document`);
        if (fixture.expectedStatus === 'must-pass-import-playback') {
            const adapted = adaptMusicXmlDocumentToCanonical(parsed.document, {
                sourceId: fixture.id,
                filename: basename(fixture.file),
                descriptor: parsed.descriptor
            });
            assert.equal(adapted.ok, true, `${fixture.id} should pass current canonical playback import`);
        }

        const renderer = createProfessionalMusicXmlRenderer({ osmdClass: FakeOsmd });
        await renderer.load(xmlText, { sourceId: fixture.id });
        const result = await renderer.render(new FakeElement('div'));
        assert.ok(result.pages.length > 0, `${fixture.id} should load through the renderer facade path`);
        renderer.destroy();
    }
});
