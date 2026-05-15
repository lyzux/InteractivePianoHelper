// Player Module - Handles canonical pattern playback

// ── Lookahead scheduler constants ─────────────────────────────────────────────
const SCHEDULE_AHEAD = 0.15; // seconds to look ahead when scheduling notes
const POLL_INTERVAL  = 25;   // ms between scheduler polls

export class Player {
    constructor(audioEngine, piano, settings) {
        this.audioEngine     = audioEngine;
        this.piano           = piano;
        this.settings        = settings;
        this.isPlaying        = false;
        this.schedulerTimer   = null;
        this._visualTimeouts  = [];
        this.onNoteHighlight  = null; // callback(eventId, event) fired when a note is visually highlighted
        this.currentPattern   = null;
        this.currentKey      = null;
        this.sequenceEvents   = [];
        this.playbackRange    = null;
        this.noteIndex       = 0;
        this.nextNoteTime    = 0; // AudioContext seconds
        this.beatPosition    = 0; // beats, tracks swing phase
        this.loopEnabled     = false;
        this.onPlaybackEnd   = null;
    }

    play(sequence, { loop = false, range = null } = {}) {
        if (this.isPlaying) return;
        if (!sequence || !sequence.isKeySupported || !sequence.events?.length) return;
        const resolvedRange = this._resolvePlaybackRange(sequence, range);
        if (!resolvedRange || resolvedRange.events.length === 0) return;
        this.audioEngine.init();
        this.isPlaying      = true;
        this.currentPattern = sequence;
        this.currentKey     = sequence.selectedKey;
        this.sequenceEvents = resolvedRange.events;
        this.playbackRange  = resolvedRange;
        this.loopEnabled    = loop;
        this.noteIndex      = 0;
        this.beatPosition   = resolvedRange.startBeat;
        this.nextNoteTime   = this.audioEngine.getCurrentTime();
        this._scheduleLoop();
    }

    setLoopEnabled(enabled) {
        this.loopEnabled = enabled === true;
        if (!this.isPlaying || !this.loopEnabled || this.noteIndex < this.sequenceEvents.length) {
            return;
        }

        clearTimeout(this.schedulerTimer);
        this.schedulerTimer = null;
        this.noteIndex = 0;
        this.beatPosition = this.playbackRange?.startBeat || 0;

        const ctx = this.audioEngine.audioContext;
        const delayMs = Math.max(0, (this.nextNoteTime - ctx.currentTime) * 1000);
        this.schedulerTimer = setTimeout(() => this._scheduleLoop(), delayMs);
    }

    _resolvePlaybackRange(sequence, range) {
        const events = Array.isArray(sequence.events) ? sequence.events : [];
        if (!range) {
            return {
                events,
                startBeat: events[0]?.startBeat || 0,
                endBeat: Number.isFinite(sequence.loopUnitBeats)
                    ? sequence.loopUnitBeats
                    : this._eventEndBeat(events[events.length - 1])
            };
        }

        let startIndex = null;
        let endIndex = null;
        const measures = this._resolveMeasures(sequence);

        if (range.startEventId || range.endEventId) {
            startIndex = range.startEventId
                ? events.findIndex(event => event.id === range.startEventId)
                : 0;
            endIndex = range.endEventId
                ? events.findIndex(event => event.id === range.endEventId)
                : events.length - 1;
        } else if (range.startMeasureNumber || range.endMeasureNumber) {
            const startMeasure = this._findMeasure(measures, range.startMeasureNumber)
                || measures[0]
                || null;
            const endMeasure = this._findMeasure(measures, range.endMeasureNumber)
                || startMeasure
                || measures[measures.length - 1]
                || null;

            if (!startMeasure || !endMeasure) return null;
            const startBeat = startMeasure.startBeat;
            const endBeat = endMeasure.startBeat + endMeasure.durationBeats;
            startIndex = events.findIndex(event => event.startBeat >= startBeat - 0.001);
            endIndex = events.findLastIndex(event => event.startBeat < endBeat - 0.001);
        }

        if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return null;
        if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return null;

        const selected = events.slice(startIndex, endIndex + 1);
        return {
            events: selected,
            startBeat: selected[0]?.startBeat || 0,
            endBeat: this._rangeEndBeat(sequence, range, selected)
        };
    }

    _findMeasure(measures, measureNumber) {
        if (measureNumber === null || measureNumber === undefined || measureNumber === '') return null;
        return measures.find(measure => (
            String(measure.measureNumber) === String(measureNumber)
            || String(measure.measureIndex) === String(measureNumber)
            || String(measure.measureIndex + 1) === String(measureNumber)
        )) || null;
    }

    _resolveMeasures(sequence) {
        if (Array.isArray(sequence.measures) && sequence.measures.length) return sequence.measures;
        const events = Array.isArray(sequence.events) ? sequence.events : [];
        const byMeasure = new Map();
        events.forEach(event => {
            const measureIndex = Number.isInteger(event.measureIndex)
                ? event.measureIndex
                : Math.floor((event.startBeat || 0) / (sequence.beatsPerMeasure || 4));
            if (!byMeasure.has(measureIndex)) {
                byMeasure.set(measureIndex, {
                    measureIndex,
                    measureNumber: measureIndex + 1,
                    startBeat: Number.POSITIVE_INFINITY,
                    durationBeats: 0,
                    eventIds: []
                });
            }
            const measure = byMeasure.get(measureIndex);
            measure.startBeat = Math.min(measure.startBeat, event.startBeat || 0);
            measure.durationBeats = Math.max(
                measure.durationBeats,
                this._eventEndBeat(event) - measure.startBeat
            );
            measure.eventIds.push(event.id);
        });
        return [...byMeasure.values()]
            .filter(measure => Number.isFinite(measure.startBeat) && measure.durationBeats > 0)
            .sort((a, b) => a.measureIndex - b.measureIndex);
    }

    _eventEndBeat(event) {
        if (!event) return 0;
        return (event.startBeat || 0) + (event.durationBeats || 0);
    }

    _rangeEndBeat(sequence, range, selectedEvents) {
        const measures = this._resolveMeasures(sequence);
        if (range?.endMeasureNumber) {
            const endMeasure = this._findMeasure(measures, range.endMeasureNumber);
            if (endMeasure) return endMeasure.startBeat + endMeasure.durationBeats;
        }
        return this._eventEndBeat(selectedEvents[selectedEvents.length - 1]);
    }

    _beatsUntilNextEvent(event, nextEvent) {
        if (nextEvent) {
            return Math.max(0, nextEvent.startBeat - event.startBeat);
        }

        if (this.loopEnabled && this.playbackRange) {
            const rangeEndBeat = Math.max(this.playbackRange.endBeat, this._eventEndBeat(event));
            return Math.max(0, rangeEndBeat - event.startBeat + this.playbackRange.startBeat - this.sequenceEvents[0].startBeat);
        }

        return event.durationBeats;
    }

    // Convert raw beats to seconds, applying swing to eighth notes.
    // Swing ratio r (0.5 = straight, 0.75 = heavy swing):
    //   downbeat eighth (even half-beat) → r × beatSec
    //   upbeat   eighth (odd  half-beat) → (1-r) × beatSec
    // Two consecutive swung eighths still total exactly 1 beat. ✓
    _noteDurationSec(rawBeats) {
        const beatSec = this.settings.getBeatDuration() / 1000;
        const swing   = this.settings.getSwingRatio();
        if (swing > 0.501 && rawBeats === 0.5) {
            const halfBeat = Math.round(this.beatPosition * 2);
            return (halfBeat % 2 === 0 ? swing : (1 - swing)) * beatSec;
        }
        return rawBeats * beatSec;
    }

    _scheduleLoop() {
        if (!this.isPlaying) return;

        const ctx        = this.audioEngine.audioContext;
        const useSustain = this.settings.getSustain();
        const maxLen     = this.sequenceEvents.length;
        if (!maxLen) {
            this.stop();
            return;
        }

        while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
            const idx           = this.noteIndex;
            const event         = this.sequenceEvents[idx];
            const rawBeats      = event.durationBeats;
            this.beatPosition   = event.startBeat;
            const durSec        = this._noteDurationSec(rawBeats);
            const startTime     = this.nextNoteTime;
            // Delay in ms from now until this note's scheduled start, for visual sync
            const visualMs      = Math.max(0, (startTime - ctx.currentTime) * 1000);
            const unhighlightMs = visualMs + durSec * 900;

            const leftNote = event.hands.left && !event.hands.left.isRest ? event.hands.left.notes : null;
            if (leftNote?.length) {
                this.audioEngine.playNote(leftNote, durSec, useSustain, 0.8, startTime);
                this._visualTimeouts.push(
                    setTimeout(() => this.piano.highlightKey(leftNote),   visualMs),
                    setTimeout(() => this.piano.unhighlightKey(leftNote), unhighlightMs)
                );
            }

            // Fire notation highlight callback once per canonical event.
            if (this.onNoteHighlight) {
                this._visualTimeouts.push(
                    setTimeout(() => { if (this.onNoteHighlight) this.onNoteHighlight(event.id, event); }, visualMs)
                );
            }

            const rightNote = event.hands.right && !event.hands.right.isRest ? event.hands.right.notes : null;
            if (rightNote?.length) {
                this.audioEngine.playNote(rightNote, durSec, useSustain, 0.8, startTime);
                this._visualTimeouts.push(
                    setTimeout(() => this.piano.highlightKey(rightNote),   visualMs),
                    setTimeout(() => this.piano.unhighlightKey(rightNote), unhighlightMs)
                );
            }

            const nextEvent = this.sequenceEvents[idx + 1] || null;
            const beatDelta = this._beatsUntilNextEvent(event, nextEvent);
            this.beatPosition = nextEvent?.startBeat ?? (event.startBeat + beatDelta);
            this.nextNoteTime += this._noteDurationSec(beatDelta);
            if (++this.noteIndex >= maxLen) {
                if (this.loopEnabled) {
                    this.noteIndex    = 0;
                    this.beatPosition = this.playbackRange?.startBeat || 0;
                } else {
                    const endMs = unhighlightMs + 25;
                    this.schedulerTimer = setTimeout(() => this._finishPlayback(), endMs);
                    return;
                }
            }
        }

        this.schedulerTimer = setTimeout(() => this._scheduleLoop(), POLL_INTERVAL);
    }

    _finishPlayback() {
        if (!this.isPlaying) return;
        this.stop();
        if (this.onPlaybackEnd) this.onPlaybackEnd();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.schedulerTimer);
        this.schedulerTimer = null;
        this._visualTimeouts.forEach(t => clearTimeout(t));
        this._visualTimeouts = [];
        this.piano.clearAllHighlights();
        this.currentPattern = null;
        this.noteIndex      = 0;
        this.sequenceEvents = [];
        this.playbackRange  = null;
        this.currentKey     = null;
        this.nextNoteTime   = 0;
        this.beatPosition   = 0;
        this.loopEnabled    = false;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentPattern() {
        return this.currentPattern;
    }
}
