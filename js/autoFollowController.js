function findMeasureForEvent(notationMaps, event) {
    const measureIndex = Number(event?.measureIndex);
    if (!(notationMaps?.measureMap instanceof Map) || !Number.isInteger(measureIndex)) return null;
    return notationMaps.measureMap.get(measureIndex) || null;
}

export function createAutoFollowController(options = {}) {
    const viewport = options.viewport || document.getElementById('vexflow-notation');
    const statusEl = options.statusEl || document.getElementById('autoFollowStatus');
    const resumeButton = options.resumeButton || document.getElementById('resumeAutoFollowBtn');

    let notationMaps = null;
    let playing = false;
    let paused = false;
    let programmaticScroll = false;
    let scrollTimer = null;

    function renderStatus() {
        if (!statusEl) return;
        if (paused) {
            statusEl.hidden = false;
            statusEl.textContent = 'Auto-follow paused';
        } else {
            statusEl.hidden = true;
            statusEl.textContent = '';
        }
        if (resumeButton) resumeButton.hidden = !paused;
    }

    function pauseForManualScroll(event) {
        if (!playing) return;
        if (programmaticScroll && event?.type === 'scroll') return;
        paused = true;
        renderStatus();
    }

    function resume() {
        paused = false;
        renderStatus();
    }

    function startPlayback() {
        playing = true;
        resume();
    }

    function stopPlayback() {
        playing = false;
    }

    function updateNotationMaps(nextMaps) {
        notationMaps = nextMaps || null;
    }

    function scrollToPlaybackEvent(event) {
        if (!playing || paused) return;
        const measureEntry = findMeasureForEvent(notationMaps, event);
        const target = measureEntry?.element;
        if (!target) return;

        programmaticScroll = true;
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            programmaticScroll = false;
        }, 350);
    }

    viewport?.addEventListener('scroll', pauseForManualScroll, { passive: true });
    viewport?.addEventListener('wheel', pauseForManualScroll, { passive: true });
    viewport?.addEventListener('touchstart', pauseForManualScroll, { passive: true });
    window.addEventListener('scroll', pauseForManualScroll, { passive: true });
    window.addEventListener('wheel', pauseForManualScroll, { passive: true });
    resumeButton?.addEventListener('click', resume);
    renderStatus();

    return {
        handlePlaybackEvent: scrollToPlaybackEvent,
        resume,
        startPlayback,
        stopPlayback,
        updateNotationMaps
    };
}
