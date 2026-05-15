const RANGE_SELECTED_TEXT = 'Measures {start}-{end} selected';

function normalizeMeasureEntry(entry) {
    if (!entry?.element) return null;
    const measureIndex = Number(entry.measureIndex);
    const measureNumber = entry.measureNumber ?? measureIndex + 1;
    if (!Number.isInteger(measureIndex)) return null;
    return {
        ...entry,
        measureIndex,
        measureNumber
    };
}

function sortedMeasureEntries(measureMap) {
    if (!(measureMap instanceof Map)) return [];
    return [...measureMap.values()]
        .map(normalizeMeasureEntry)
        .filter(Boolean)
        .sort((a, b) => a.measureIndex - b.measureIndex);
}

function formatRangeText(range) {
    return RANGE_SELECTED_TEXT
        .replace('{start}', range.startMeasureNumber)
        .replace('{end}', range.endMeasureNumber);
}

export function createPracticeRangeController(options = {}) {
    const container = options.container || document.getElementById('vexflow-notation');
    const statusEl = options.statusEl || document.getElementById('practiceRangeStatus');
    const clearButton = options.clearButton || document.getElementById('clearPracticeRangeBtn');
    const rangeModeButton = options.rangeModeButton || document.getElementById('practiceRangeModeBtn');

    let measureMap = new Map();
    let entries = [];
    let pendingStart = null;
    let selectedRange = null;
    let rangeModeActive = false;

    function emitUpdate() {
        if (typeof options.onChange === 'function') {
            options.onChange({
                range: selectedRange,
                pendingStart,
                rangeModeActive
            });
        }
    }

    function setRangeMode(active) {
        rangeModeActive = active === true;
        if (rangeModeButton) {
            rangeModeButton.setAttribute('aria-pressed', String(rangeModeActive));
            rangeModeButton.classList.toggle('is-active', rangeModeActive);
        }
        updateStatus();
        emitUpdate();
    }

    function clearMeasureClasses() {
        entries.forEach(entry => {
            entry.element.classList.remove('range-selected', 'range-boundary', 'range-pending');
            entry.element.removeAttribute('aria-current');
        });
    }

    function applyRangeClasses() {
        clearMeasureClasses();
        if (pendingStart && !selectedRange) {
            pendingStart.element.classList.add('range-pending', 'range-boundary');
            pendingStart.element.setAttribute('aria-current', 'true');
            return;
        }
        if (!selectedRange) return;

        entries.forEach(entry => {
            if (entry.measureIndex < selectedRange.startMeasureIndex || entry.measureIndex > selectedRange.endMeasureIndex) {
                return;
            }
            entry.element.classList.add('range-selected');
            entry.element.setAttribute('aria-current', 'true');
            if (entry.measureIndex === selectedRange.startMeasureIndex || entry.measureIndex === selectedRange.endMeasureIndex) {
                entry.element.classList.add('range-boundary');
            }
        });
    }

    function updateStatus() {
        if (statusEl) {
            statusEl.classList.toggle('has-selected-range', Boolean(selectedRange));
            if (selectedRange) {
                statusEl.textContent = formatRangeText(selectedRange);
            } else if (pendingStart) {
                statusEl.textContent = `Measure ${pendingStart.measureNumber} selected. Choose an end measure.`;
            } else {
                statusEl.textContent = rangeModeActive
                    ? 'Range mode active. Choose a start measure.'
                    : 'No range selected';
            }
        }

        if (clearButton) {
            clearButton.hidden = !selectedRange && !pendingStart;
        }
    }

    function makeRange(a, b) {
        const start = a.measureIndex <= b.measureIndex ? a : b;
        const end = a.measureIndex <= b.measureIndex ? b : a;
        return {
            startMeasureIndex: start.measureIndex,
            endMeasureIndex: end.measureIndex,
            startMeasureNumber: start.measureNumber,
            endMeasureNumber: end.measureNumber,
            pageNumber: start.pageNumber,
            systemIndex: start.systemIndex
        };
    }

    function selectMeasure(entry, options = {}) {
        const normalized = normalizeMeasureEntry(entry);
        if (!normalized) return;

        const explicitGesture = options.shiftKey === true || rangeModeActive;
        if (!explicitGesture) return;

        if (!pendingStart || selectedRange) {
            pendingStart = normalized;
            selectedRange = null;
        } else {
            selectedRange = makeRange(pendingStart, normalized);
            pendingStart = null;
            if (rangeModeActive) setRangeMode(false);
        }

        applyRangeClasses();
        updateStatus();
        emitUpdate();
    }

    function findEntryFromElement(element) {
        if (!element) return null;
        const measureIndex = Number(element.dataset.measureIndex);
        return entries.find(entry => entry.measureIndex === measureIndex) || null;
    }

    function handleMeasureClick(event) {
        const target = event.target.closest?.('.score-measure-hit-target');
        if (!target || !container?.contains(target)) return;
        selectMeasure(findEntryFromElement(target), { shiftKey: event.shiftKey === true });
    }

    function clearRange() {
        pendingStart = null;
        selectedRange = null;
        applyRangeClasses();
        updateStatus();
        emitUpdate();
    }

    function updateNotationMaps(notationMaps) {
        measureMap = notationMaps?.measureMap instanceof Map ? notationMaps.measureMap : new Map();
        entries = sortedMeasureEntries(measureMap);
        clearRange();
    }

    function getPlaybackRange() {
        const range = selectedRange || makeRangeFromDomSelection();
        if (!range) return null;
        return {
            startMeasureNumber: range.startMeasureNumber,
            endMeasureNumber: range.endMeasureNumber,
            startMeasureIndex: range.startMeasureIndex,
            endMeasureIndex: range.endMeasureIndex
        };
    }

    function makeRangeFromDomSelection() {
        const selectedEntries = entries.filter(entry => entry.element.classList.contains('range-selected'));
        if (!selectedEntries.length) return null;
        return makeRange(selectedEntries[0], selectedEntries[selectedEntries.length - 1]);
    }

    container?.addEventListener('click', handleMeasureClick);
    clearButton?.addEventListener('click', clearRange);
    rangeModeButton?.addEventListener('click', () => setRangeMode(!rangeModeActive));

    updateStatus();

    return {
        clearRange,
        getPlaybackRange,
        selectMeasure,
        setRangeMode,
        updateNotationMaps
    };
}
