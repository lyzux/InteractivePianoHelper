# Phase 5: MusicXML Import And Practice UX - Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 19 likely new/modified files
**Analogs found:** 18 / 19

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `js/musicXmlParser.js` | service | transform | `js/musicXmlAdapterContract.js` + `js/patternValidator.js` | role-match |
| `js/musicXmlCanonicalAdapter.js` | service | transform | `js/canonicalPatternResolver.js` | exact |
| `js/importedScoreStore.js` | service | CRUD | `js/settings.js` + `js/pianoResizeHandler.js` | partial |
| `js/importedScoreLibrary.js` | service | CRUD | `js/simplePatternLoader.js` | exact |
| `js/simplePatternLoader.js` | service | CRUD | existing file | exact |
| `js/patternValidator.js` | service | transform | existing file | exact |
| `js/musicXmlAdapterContract.js` | config | transform | existing file | exact |
| `js/staffNotationRenderer.js` | component | event-driven | existing file | exact |
| `js/musicXmlScoreRenderer.js` | component | event-driven | `js/staffNotationRenderer.js` | role-match |
| `js/practiceRangeController.js` | component | event-driven | `js/mobileMenu.js` + `js/staffNotationRenderer.js` | role-match |
| `js/autoFollowController.js` | component | event-driven | `js/mobileMenu.js` + `js/player.js` | role-match |
| `js/player.js` | service | event-driven | existing file | exact |
| `index.html` | route | event-driven | existing file | exact |
| `css/styles.css` | config | request-response | existing file | exact |
| `css/mobile.css` | config | request-response | existing file | exact |
| `tests/musicXmlParser.test.js` | test | transform | `tests/musicXmlAdapterContract.test.js` | role-match |
| `tests/importedScoreStore.test.js` | test | CRUD | no direct analog | none |
| `tests/musicXmlCanonicalAdapter.test.js` | test | transform | `tests/patternValidator.test.js` + `tests/canonicalPatternResolver.test.js` | exact |
| `tests/browser-smoke/musicXmlImportPractice.test.js` | test | event-driven | `tests/browser-smoke/appBoot.test.js` | exact |

## Pattern Assignments

### `js/musicXmlParser.js` (service, transform)

**Analog:** `js/musicXmlAdapterContract.js`, `js/patternValidator.js`

**Imports/source identity pattern** (`js/musicXmlAdapterContract.js` lines 1-5):
```javascript
export const MUSICXML_SOURCE_TYPE = 'musicxml';
export const MUSICXML_ADAPTER_VERSION = 'phase-04-foundation';

export const SUPPORTED_MUSICXML_ROOTS = Object.freeze(['score-partwise']);
export const DEFERRED_MUSICXML_ROOTS = Object.freeze(['score-timewise']);
```

**Diagnostics pattern** (`js/patternValidator.js` lines 308-317):
```javascript
export function createDiagnostic(input = {}) {
    const severity = VALID_SEVERITIES.has(input.severity) ? input.severity : 'error';
    return {
        sourceId: input.sourceId || DEFAULT_SOURCE_ID,
        sourceType: input.sourceType || DEFAULT_SOURCE_TYPE,
        severity,
        code: input.code || 'VALIDATION_ERROR',
        path: input.path || '',
        message: input.message || 'Validation failed.'
    };
}
```

**Parser boundary from contract** (`docs/MUSICXML-ADAPTER.md` lines 11-19):
```text
1. Parse MusicXML as data.
2. Build a source descriptor with sourceType: musicxml.
3. Convert score metadata, parts, measures, layout hints, and playable events into canonical score data.
4. Validate the resulting sequence with validateResolvedSequence().
5. Register either a valid source or rejected source diagnostics through the same loader boundary used by built-in sources.
```

Apply this shape: pure function accepts XML text and filename metadata, uses `DOMParser` in browser or injectable parser in tests, returns `{ ok, document, descriptor, diagnostics }`, and never mutates DOM or loader state.

---

### `js/musicXmlCanonicalAdapter.js` (service, transform)

**Analog:** `js/canonicalPatternResolver.js`

**Pure-module convention** (`js/canonicalPatternResolver.js` lines 1-4):
```javascript
// Canonical Pattern Resolver
// Adapts current JavaScript pattern modules into a shared event sequence for
// playback and notation. This module intentionally has no DOM, Web Audio, or
// VexFlow dependency so it can be unit-tested in Node and reused by the app.
```

**Canonical event shape** (`js/canonicalPatternResolver.js` lines 177-188):
```javascript
const event = {
    id: `${patternId}-event-${eventOrdinal}`,
    sourceIndex,
    startBeat: roundBeat(startBeat),
    durationBeats: roundBeat(durationBeats),
    measureIndex: Math.floor(startBeat / measureBeats),
    beatInMeasure: roundBeat(startBeat % measureBeats),
    hands: {}
};
```

**Hand payload pattern** (`js/canonicalPatternResolver.js` lines 75-86):
```javascript
function normalizeHandPayload(note, fingering) {
    const notes = normalizeNotes(note);
    return {
        notes,
        isRest: notes.length === 0,
        fingering: fingering ?? null
    };
}
```

MusicXML adapter output should extend this with `sourceId`, `sourceType: 'musicxml'`, `measures`, and `pageLayout` while preserving event IDs, `startBeat`, `durationBeats`, `measureIndex`, `beatInMeasure`, and `hands`.

---

### `js/importedScoreStore.js` (service, CRUD)

**Analog:** `js/settings.js`, `js/pianoResizeHandler.js`

**localStorage save/load error pattern** (`js/settings.js` lines 132-147):
```javascript
save() {
    localStorage.setItem('pianoHelperSettings', JSON.stringify(this.export()));
}

load() {
    const saved = localStorage.getItem('pianoHelperSettings');
    if (saved) {
        try {
            const settingsData = JSON.parse(saved);
            this.import(settingsData);
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
    }
}
```

**Storage key constants and constrained restore** (`js/pianoResizeHandler.js` lines 5-6, 42-46):
```javascript
const PIANO_HEIGHT_STORAGE_KEY = 'pianoHeight';
const PIANO_EXPANDED_STORAGE_KEY = 'pianoKeyboardExpanded';

function getSavedHeight() {
    const savedHeight = localStorage.getItem(PIANO_HEIGHT_STORAGE_KEY);
    if (!savedHeight || isNaN(savedHeight)) return null;
    return Math.min(Math.max(parseInt(savedHeight, 10), minHeight), maxHeight);
}
```

Use the same small constant-at-top style, but prefer IndexedDB for XML payloads. Keep a thin async CRUD wrapper: `openStore()`, `listImportedScores()`, `saveImportedScore(record)`, `deleteImportedScore(id)`, `getImportedScore(id)`. Return structured failures instead of throwing through UI event handlers.

---

### `js/importedScoreLibrary.js` (service, CRUD)

**Analog:** `js/simplePatternLoader.js`

**Registration/rejection boundary** (`js/simplePatternLoader.js` lines 13-41):
```javascript
registerPattern(id, pattern, options = {}) {
    const sourceType = options.sourceType || 'pattern';
    const result = validatePatternForRegistration(pattern, {
        ...options,
        patternId: id,
        sourceId: id,
        sourceType,
        key: options.key || pattern?.nativeKey || 'C'
    });

    this.validationResults.set(id, {
        id,
        sourceType,
        diagnostics: result.diagnostics
    });

    if (!result.valid) {
        this.patterns.delete(id);
        this.rejectedSources.set(id, {
            id,
            sourceType,
            diagnostics: result.diagnostics
        });
        return { ok: false, diagnostics: result.diagnostics };
    }

    this.patterns.set(id, pattern);
    this.rejectedSources.delete(id);
    return { ok: true, diagnostics: result.diagnostics };
}
```

**Rejected source pattern** (`js/simplePatternLoader.js` lines 44-65):
```javascript
recordRejectedSource(id, diagnostics, options = {}) {
    const sourceType = options.sourceType || 'pattern';
    const normalizedDiagnostics = diagnostics.map(diagnostic => createDiagnostic({
        ...diagnostic,
        sourceId: diagnostic.sourceId || id,
        sourceType: diagnostic.sourceType || sourceType
    }));

    this.patterns.delete(id);
    this.rejectedSources.set(id, {
        id,
        sourceType,
        diagnostics: normalizedDiagnostics
    });
    this.validationResults.set(id, {
        id,
        sourceType,
        diagnostics: normalizedDiagnostics
    });

    return { ok: false, diagnostics: normalizedDiagnostics };
}
```

Imported score registration should reuse the same valid/rejected maps and `getPatternOptions()` path, with `sourceType: 'musicxml'`. Add duplicate title suffixing before registration, not in renderer/player.

---

### `js/simplePatternLoader.js` (service, CRUD)

**Analog:** existing file

**Options shape for selector** (`js/simplePatternLoader.js` lines 99-103):
```javascript
getPatternOptions() {
    return this.getAllPatterns().map(pattern => ({
        value: pattern.id,
        label: pattern.name
    }));
}
```

**Validation summaries** (`js/simplePatternLoader.js` lines 114-122):
```javascript
getValidationSummary() {
    const rejectedSources = this.getRejectedSources();
    return {
        validCount: this.patterns.size,
        rejectedCount: rejectedSources.length,
        hasFailures: rejectedSources.length > 0,
        rejectedSources
    };
}
```

Extend, do not fork: add imported/library metadata while keeping `getPattern()`, `getPatternOptions()`, `resolvePatternSequenceForDisplay()`, and `getDiagnosticsForSource()` stable for `index.html`, renderer, and tests.

---

### `js/patternValidator.js` (service, transform)

**Analog:** existing file

**Fatal diagnostic helpers** (`js/patternValidator.js` lines 320-326):
```javascript
export function isFatalDiagnostic(diagnostic) {
    return diagnostic?.severity === 'error';
}

export function hasFatalDiagnostics(diagnostics) {
    return diagnostics.some(isFatalDiagnostic);
}
```

**Canonical sequence invariants** (`js/patternValidator.js` lines 411-459):
```javascript
export function validateResolvedSequence(sequence, options = {}) {
    const context = sourceContext(options);
    const diagnostics = [];

    if (!isPlainObject(sequence)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'SEQUENCE_INVALID',
            path: '',
            message: 'Resolved sequence must be an object.'
        });
        return diagnostics;
    }

    if (sequence.isKeySupported !== true) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'SEQUENCE_UNSUPPORTED',
            path: 'isKeySupported',
            message: 'Resolved sequence must support the authored display key.'
        });
    }

    if (!Array.isArray(sequence.events) || sequence.events.length === 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'SEQUENCE_EMPTY',
            path: 'events',
            message: 'Resolved sequence must contain canonical events.'
        });
        return diagnostics;
    }
```

**Event/hand validation** (`js/patternValidator.js` lines 467-538):
```javascript
sequence.events.forEach((event, index) => {
    const eventPath = `events[${index}]`;

    if (!event?.id || typeof event.id !== 'string') {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'EVENT_ID_INVALID',
            path: `${eventPath}.id`,
            message: 'Canonical events must have stable string IDs.'
        });
    }

    if (!Number.isFinite(event.durationBeats) || event.durationBeats <= 0) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'EVENT_DURATION_INVALID',
            path: `${eventPath}.durationBeats`,
            message: 'Canonical event durations must be positive.'
        });
    }

    if (!isPlainObject(event.hands) || (!event.hands.left && !event.hands.right)) {
        pushDiagnostic(diagnostics, context, {
            severity: 'error',
            code: 'HAND_PAYLOAD_INVALID',
            path: `${eventPath}.hands`,
            message: 'Canonical events must contain at least one hand payload.'
        });
    }
});
```

Add MusicXML-specific measure/page validation beside canonical checks, using the same `pushDiagnostic(... createDiagnostic)` style and fatal semantics.

---

### `js/musicXmlAdapterContract.js` (config, transform)

**Analog:** existing file

**Required canonical/page fields** (`js/musicXmlAdapterContract.js` lines 7-25, 27-36):
```javascript
export const MUSICXML_REQUIRED_CANONICAL_FIELDS = Object.freeze([
    'sourceId',
    'sourceType',
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
```

Update deferred feature lists as Phase 5 implements file picker/local library, and keep `describeMusicXmlAdapterContract()` serializable for contract tests.

---

### `js/staffNotationRenderer.js` and `js/musicXmlScoreRenderer.js` (component, event-driven)

**Analog:** `js/staffNotationRenderer.js`

**Page scaling pattern** (`js/staffNotationRenderer.js` lines 20-28):
```javascript
function scaleScoreSheet(sheetView, pageGrid) {
    const availableWidth = sheetView.clientWidth || pageGrid.offsetWidth;
    const intrinsicWidth = pageGrid.classList.contains('single-page')
        ? PAGE_WIDTH
        : PAGE_WIDTH * 2 + PAGE_GRID_GAP;
    const scale = Math.min(1, availableWidth / intrinsicWidth);
    pageGrid.style.setProperty('--score-scale', scale.toString());
    sheetView.style.height = `${Math.ceil(pageGrid.offsetHeight * scale)}px`;
}
```

**Page DOM construction** (`js/staffNotationRenderer.js` lines 345-366):
```javascript
const pages = planScorePages(scoreMeasures.measureCount);
const sheetView = document.createElement('div');
sheetView.className = pages.length === 1 ? 'score-sheet-view single-page' : 'score-sheet-view';
const pageGrid = document.createElement('div');
pageGrid.className = pages.length === 1 ? 'score-page-grid single-page' : 'score-page-grid';
sheetView.appendChild(pageGrid);
vexFlowDiv.appendChild(sheetView);

pages.forEach(pagePlan => {
    const pageEl = document.createElement('div');
    pageEl.className = 'score-page';
    pageEl.dataset.page = String(pagePlan.pageIndex + 1);
    pageGrid.appendChild(pageEl);

    const renderer = new VF.Renderer(pageEl, VF.Renderer.Backends.SVG);
    renderer.resize(PAGE_WIDTH, PAGE_HEIGHT);
```

**Highlight map return** (`js/staffNotationRenderer.js` lines 445-473):
```javascript
bass.staveNotes.forEach((note, noteIndex) => {
    appendHighlightedElement(eventHighlightMap, bass.eventIds[noteIndex], note);
});
treble.staveNotes.forEach((note, noteIndex) => {
    appendHighlightedElement(eventHighlightMap, treble.eventIds[noteIndex], note);
});

return {
    eventMap: eventHighlightMap,
    sequence: notationData,
    pages
};
```

Any OSMD-backed renderer should return the same practical contract plus measure metadata: `{ eventMap, measureMap, sequence, pages }`. Preserve `.score-sheet-view`, `.score-page-grid`, `.score-page`, scale-without-reflow behavior, and SVG/DOM highlightability.

---

### `js/practiceRangeController.js` (component, event-driven)

**Analog:** `js/mobileMenu.js`, `js/staffNotationRenderer.js`

**DOM state toggle/event dispatch pattern** (`js/mobileMenu.js` lines 13-28):
```javascript
function setPanelExpanded(isExpanded) {
    physicsSidebar.classList.toggle('is-collapsed', !isExpanded);
    document.body.classList.toggle('sound-panel-expanded', isExpanded);
    panelToggle.setAttribute('aria-expanded', String(isExpanded));
    panelToggle.title = isExpanded ? 'Hide piano controls' : 'Show piano controls';
    const label = panelToggle.querySelector('.sound-panel-label');
    if (label) label.textContent = isExpanded ? 'Hide' : 'Sound';
    localStorage.setItem(SOUND_PANEL_STORAGE_KEY, isExpanded ? 'true' : 'false');

    window.dispatchEvent(new CustomEvent('score-layout-change'));
    setTimeout(() => window.dispatchEvent(new CustomEvent('score-layout-change')), 280);
}
```

**Measure/page map source** (`js/staffNotationRenderer.js` lines 240-279):
```javascript
export function planScorePages(measureCount, options = {}) {
    if (!measureCount || measureCount < 1) return [];
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
```

Implement as a small stateful controller with `setRangeStart`, `setRangeEnd`, `clearRange`, `getPlaybackRange`, and event binding for `Shift+click`. Do not put range parsing in `index.html` handlers.

---

### `js/autoFollowController.js` (component, event-driven)

**Analog:** `js/player.js`, `js/mobileMenu.js`

**Playback callback bridge** (`js/player.js` lines 102-106):
```javascript
if (this.onNoteHighlight) {
    this._visualTimeouts.push(
        setTimeout(() => { if (this.onNoteHighlight) this.onNoteHighlight(event.id, event); }, visualMs)
    );
}
```

**Layout-change custom event pattern** (`js/mobileMenu.js` lines 26-27):
```javascript
window.dispatchEvent(new CustomEvent('score-layout-change'));
setTimeout(() => window.dispatchEvent(new CustomEvent('score-layout-change')), 280);
```

Attach auto-follow to the same playback highlight callback path. Manual scroll pauses follow state; resume updates UI and scrolls the current system/page into view without moving the fixed piano.

---

### `js/player.js` (service, event-driven)

**Analog:** existing file

**Play setup pattern** (`js/player.js` lines 26-39):
```javascript
play(sequence, { loop = false } = {}) {
    if (this.isPlaying) return;
    if (!sequence || !sequence.isKeySupported || !sequence.events?.length) return;
    this.audioEngine.init();
    this.isPlaying      = true;
    this.currentPattern = sequence;
    this.currentKey     = sequence.selectedKey;
    this.sequenceEvents = sequence.events;
    this.loopEnabled    = loop;
    this.noteIndex      = 0;
    this.beatPosition   = 0;
    this.nextNoteTime   = this.audioEngine.getCurrentTime();
    this._scheduleLoop();
}
```

**Loop/end behavior** (`js/player.js` lines 118-129):
```javascript
this.beatPosition += rawBeats;
this.nextNoteTime += durSec;
if (++this.noteIndex >= maxLen) {
    if (this.loopEnabled) {
        this.noteIndex    = 0;
        this.beatPosition = 0;
    } else {
        const endMs = unhighlightMs + 25;
        this.schedulerTimer = setTimeout(() => this._finishPlayback(), endMs);
        return;
    }
}
```

Extend `play(sequence, { loop, range })` by slicing or indexing `sequence.events` at setup time. Keep `onNoteHighlight(event.id, event)`, `_visualTimeouts`, `setLoopEnabled()`, and `stop()` cleanup behavior intact.

---

### `index.html` (route, event-driven)

**Analog:** existing file

**Dynamic import composition root** (`index.html` lines 321-342):
```javascript
const [
    { AudioEngine },
    { Piano },
    { Settings },
    { Player },
    { SimplePatternLoader },
    { drawStaffNotation: _drawStaffNotation },
    { generatePhysicsControls: _generatePhysicsControls },
    { initializeMobileMenu },
    { initializePianoResize }
] = await Promise.all([
    import(`./js/audioEngine.js?v=${APP_VERSION}`),
    import(`./js/piano.js?v=${APP_VERSION}`),
    import(`./js/settings.js?v=${APP_VERSION}`),
    import(`./js/player.js?v=${APP_VERSION}`),
    import(`./js/simplePatternLoader.js?v=${APP_VERSION}`),
    import(`./js/staffNotationRenderer.js?v=${APP_VERSION}`),
    import(`./js/physicsControlsPanel.js?v=${APP_VERSION}`),
    import(`./js/mobileMenu.js?v=${APP_VERSION}`),
    import(`./js/pianoResizeHandler.js?v=${APP_VERSION}`)
]);
```

**Notation highlight bridge** (`index.html` lines 377-388):
```javascript
function clearNotationHighlights() {
    for (const el of activeHighlightEls) el.classList.remove('vf-note-highlight');
    activeHighlightEls = [];
}

function highlightNotationNote(eventId) {
    if (!currentNotationMaps) return;
    clearNotationHighlights();
    const els = currentNotationMaps.eventMap?.get(eventId) || [];
    for (const el of els) el.classList.add('vf-note-highlight');
    activeHighlightEls = els;
}
```

**Play/loop wiring** (`index.html` lines 782-800, 843-849):
```javascript
function handlePlayStop() {
    const button = document.getElementById('playStopBtn');
    if (!button || button.disabled) return;

    if (player.isCurrentlyPlaying()) {
        player.stop();
        resetPlaybackButton();
    } else {
        player.stop();
        setTimeout(() => {
            const sequence = currentPatternSequence || resolveCurrentPatternSequence();
            if (sequence?.isKeySupported && sequence.events.length) {
                const loop = document.getElementById('loopPlayback')?.checked === true;
                player.play(sequence, { loop });
```

Add new modules to the existing parallel import block. Keep UI handlers thin: file input reads text, then calls parser/adapter/store/library services; range/auto-follow state goes through controllers.

---

### `css/styles.css` (config, request-response)

**Analog:** existing file

**Validation status style** (`css/styles.css` lines 137-174):
```css
.validation-status {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 960px;
    margin: 0 auto 24px;
    padding: 16px;
    border-left: 4px solid;
    border-radius: 8px;
    color: #1f2933;
    line-height: 1.45;
}

.validation-status-warning {
    background: #fff7e6;
    border-color: #b7791f;
}

.validation-status-error {
    background: #fff5f5;
    border-color: #c53030;
}
```

**Score page visual language** (`css/styles.css` lines 220-289):
```css
.staff-notation {
    background: #f4f1ea;
    padding: 24px clamp(12px, 2vw, 32px);
    border-radius: 0;
    margin-bottom: 30px;
    box-shadow: none;
    overflow-x: auto;
    width: 100%;
}

.score-page-grid {
    display: grid;
    grid-template-columns: repeat(2, 794px);
    gap: var(--score-page-gap);
    justify-content: center;
    align-items: start;
    width: calc(794px * 2 + var(--score-page-gap));
    transform: scale(var(--score-scale));
    transform-origin: top center;
}

.score-page {
    width: 794px;
    height: 1123px;
    background: #ffffff;
    border: 1px solid #d8dee6;
    box-shadow: 0 12px 32px rgba(31, 41, 51, 0.18);
    overflow: hidden;
    justify-self: center;
}
```

Use mint `#6ee7b7` only for range selection UI per UI-SPEC. Keep playback highlight amber separate.

---

### `css/mobile.css` (config, request-response)

**Analog:** existing file

**Mobile stack and bottom keyboard padding** (`css/mobile.css` lines 139-183):
```css
.controls {
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
}

.control-group {
    width: 100%;
}

.validation-status {
    width: 100%;
    margin-bottom: 16px;
    padding: 16px;
    overflow-wrap: anywhere;
}

.staff-notation {
    margin-bottom: 20px;
    padding: 16px 8px;
    width: calc(100vw - 16px);
}

#vexflow-notation {
    min-height: 150px;
    padding-bottom: calc(25vh + 32px);
}
```

For Phase 5, preserve one-page vertical layout on narrow screens and ensure import details, range badge, and auto-follow notice wrap with `overflow-wrap: anywhere`.

---

### `tests/musicXmlParser.test.js` (test, transform)

**Analog:** `tests/musicXmlAdapterContract.test.js`

**Node test imports and assertions** (`tests/musicXmlAdapterContract.test.js` lines 1-12):
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createMusicXmlSourceDescriptor,
    DEFERRED_MUSICXML_ROOTS,
    describeMusicXmlAdapterContract,
    MUSICXML_REQUIRED_CANONICAL_FIELDS,
    MUSICXML_REQUIRED_PAGE_LAYOUT_FIELDS,
    MUSICXML_SOURCE_TYPE,
    SUPPORTED_MUSICXML_ROOTS
} from '../js/musicXmlAdapterContract.js';
```

**Descriptor diagnostic expectations** (`tests/musicXmlAdapterContract.test.js` lines 33-54):
```javascript
test('normalizes MusicXML source descriptors and diagnostic source identity', () => {
    const descriptor = createMusicXmlSourceDescriptor({
        id: 'fur-elise-import',
        filename: 'fur-elise.musicxml',
        composer: 'Beethoven',
        diagnostics: [{
            severity: 'warning',
            code: 'MUSICXML_DEFERRED_FEATURE',
            path: 'score-partwise.part[0]',
            message: 'Fixture warning.'
        }]
    });

    assert.equal(descriptor.sourceId, 'fur-elise-import');
    assert.equal(descriptor.sourceType, 'musicxml');
    assert.equal(descriptor.diagnostics[0].sourceType, 'musicxml');
});
```

Test accepted `score-partwise`, rejected malformed XML/parsererror, rejected `score-timewise`, missing part-list, empty parts/measures, unsupported features, and diagnostic path/code shape.

---

### `tests/musicXmlCanonicalAdapter.test.js` (test, transform)

**Analog:** `tests/patternValidator.test.js`, `tests/canonicalPatternResolver.test.js`

**Canonical invariant test pattern** (`tests/patternValidator.test.js` lines 134-147):
```javascript
test('validates canonical duplicate IDs, duration, order, and loop mismatch', () => {
    const sequence = cloneSequence(resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' }));
    sequence.events[1].id = sequence.events[0].id;
    sequence.events[2].durationBeats = 0;
    sequence.events[3].startBeat = -1;
    sequence.loopUnitBeats = 99;

    const diagnostics = validateResolvedSequence(sequence, { patternId: 'canonical-broken' });

    assert.equal(diagnosticFor(diagnostics, 'EVENT_ID_DUPLICATE').path, 'events[1].id');
    assert.equal(diagnosticFor(diagnostics, 'EVENT_DURATION_INVALID').path, 'events[2].durationBeats');
});
```

**Event order and position expectations** (`tests/canonicalPatternResolver.test.js` lines 28-51):
```javascript
test('creates stable unique event IDs for canonical maps', () => {
    const sequence = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'C' });
    const ids = sequence.events.map(event => event.id);
    const eventMap = new Map(sequence.events.map(event => [event.id, event]));

    assert.equal(new Set(ids).size, ids.length);
    assert.equal(eventMap.size, sequence.events.length);
});

test('orders canonical events by playback and notation position', () => {
    const sequence = resolvePatternSequence(lombardisch, { patternId: 'lombardisch', key: 'G' });
    const positions = sequence.events.map(event => event.startBeat);

    assert.deepEqual(positions, [0, 0.25, 1, 1.25, 2, 2.25, 3, 3.25]);
});
```

Cover MusicXML divisions-to-beats, chord same-onset merge, rest payloads, backup/forward cursor placement, measure metadata, pageLayout print hints, and final `validateResolvedSequence()` fatal-free acceptance.

---

### `tests/browser-smoke/musicXmlImportPractice.test.js` (test, event-driven)

**Analog:** `tests/browser-smoke/appBoot.test.js`

**Static server helper** (`tests/browser-smoke/appBoot.test.js` lines 33-63):
```javascript
function resolveStaticPath(requestUrl) {
    const url = new URL(requestUrl, `http://${HOST}`);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const absolutePath = resolve(join(PROJECT_ROOT, normalizedPath));
    if (!absolutePath.startsWith(PROJECT_ROOT)) return null;
    return absolutePath;
}

async function startStaticServer() {
    const server = createServer((request, response) => {
        const filePath = resolveStaticPath(request.url || '/');
        if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
            response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
            response.end('Not found');
            return;
        }
```

**Browser smoke assertions** (`tests/browser-smoke/appBoot.test.js` lines 80-112):
```javascript
await page.goto(origin, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.Vex && document.querySelectorAll('#pattern option').length > 0);
await page.waitForSelector('#vexflow-notation svg', { timeout: 15000 });
await page.waitForSelector('.score-page', { timeout: 15000 });

await page.click('#playStopBtn');
await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Stop');
await page.click('#playStopBtn');
await page.waitForFunction(() => document.getElementById('playStopBtn')?.textContent?.trim() === 'Play');

const cleanupState = await page.evaluate(() => ({
    activePianoKeys: document.querySelectorAll('.key.active').length,
    notationHighlights: document.querySelectorAll('.vf-note-highlight').length
}));
```

Extend this style with a tiny fixture file upload, imported option appears, selected range via Shift+click, playback starts from range, auto-follow paused/resumed state, remove confirmation, and no page errors. Avoid full SVG snapshots.

## Shared Patterns

### Static Vanilla ES Modules
**Source:** `index.html` lines 321-342  
**Apply to:** all new browser modules

Add modules through the existing cache-busted dynamic `Promise.all` import block. Keep modules named exports only and relative import paths.

### Structured Diagnostics
**Source:** `js/patternValidator.js` lines 308-317; `js/simplePatternLoader.js` lines 44-65  
**Apply to:** parser, adapter, validation, imported library, UI details

All failures should become diagnostics with `sourceId`, `sourceType`, `severity`, `code`, `path`, `message`. Fatal import failures should call the rejected-source path and show concise UI copy plus expandable details.

### Canonical Event Model
**Source:** `js/canonicalPatternResolver.js` lines 177-224  
**Apply to:** MusicXML adapter, player, renderer, tests

Preserve event IDs, ordered `startBeat`, positive `durationBeats`, `measureIndex`, `beatInMeasure`, and hand payloads. Imported MusicXML must pass `validateResolvedSequence()` before display/playback.

### Page Fidelity And Highlight Mapping
**Source:** `js/staffNotationRenderer.js` lines 345-473; `css/styles.css` lines 252-289  
**Apply to:** current VexFlow renderer or OSMD wrapper

Score pages are fixed 794 x 1123 framed pages, arranged in a two-page grid unless single-page, scaled with `--score-scale`, and return DOM/SVG maps for playback highlights.

### Playback Cleanup
**Source:** `js/player.js` lines 141-155; `index.html` lines 774-780  
**Apply to:** range playback, auto-follow, stop behavior

Stopping playback clears timers, piano highlights, transient notation highlights, and resets button text. Selected practice range should persist across stop.

### Responsive Bottom Keyboard Constraint
**Source:** `js/pianoResizeHandler.js` lines 24-28; `css/mobile.css` lines 180-183  
**Apply to:** import controls, validation details, score viewport, auto-follow UI

Use `--piano-bottom-space` and bottom padding so fixed keyboard does not cover active score controls or feedback.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `js/importedScoreStore.js` | service | CRUD | No existing IndexedDB wrapper exists. Borrow storage-key/error handling from `js/settings.js` and `js/pianoResizeHandler.js`, but implement IndexedDB as a new thin async wrapper. |
| `tests/importedScoreStore.test.js` | test | CRUD | No IndexedDB tests exist. Prefer browser-smoke verification unless a lightweight fake/injected storage backend is added. |

## Metadata

**Analog search scope:** `js/`, `tests/`, `tests/browser-smoke/`, `css/`, `index.html`, `docs/`  
**Files scanned:** 43 source/test/doc files from `find`, plus targeted `rg` pattern search  
**Pattern extraction date:** 2026-05-15
