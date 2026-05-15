// Piano Resize Handler — extracted from index.html inline script
// Lets the user drag a handle to change the piano keyboard height.
// Persists the chosen height and expanded/collapsed state to localStorage.

const PIANO_HEIGHT_STORAGE_KEY = 'pianoHeight';
const PIANO_EXPANDED_STORAGE_KEY = 'pianoKeyboardExpanded';
const COLLAPSED_HEIGHT = 44;

export function initializePianoResize() {
    const resizeHandle = document.getElementById('pianoResizeHandle');
    const pianoContainer = document.getElementById('pianoKeyboardContainer');
    const toggleButton = document.getElementById('pianoKeyboardToggle');

    if (!resizeHandle || !pianoContainer) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const minHeight = 80;  // Minimum height in pixels
    const maxHeight = window.innerHeight * 0.6; // Maximum 60% of screen height
    let lastExpandedHeight = getSavedHeight();

    function setBodyPadding(height) {
        const bottomSpace = (height + 20) + 'px';
        document.documentElement.style.setProperty('--piano-bottom-space', bottomSpace);
        document.body.style.paddingBottom = bottomSpace;
    }

    function setTogglePresentation(isExpanded) {
        if (!toggleButton) return;
        const icon = toggleButton.querySelector('.material-icons');
        toggleButton.setAttribute('aria-expanded', String(isExpanded));
        toggleButton.title = isExpanded ? 'Hide keyboard' : 'Show keyboard';
        if (icon) icon.textContent = isExpanded ? 'expand_more' : 'expand_less';
    }

    function getSavedExpandedState() {
        return localStorage.getItem(PIANO_EXPANDED_STORAGE_KEY) !== 'false';
    }

    function getSavedHeight() {
        const savedHeight = localStorage.getItem(PIANO_HEIGHT_STORAGE_KEY);
        if (!savedHeight || isNaN(savedHeight)) return null;
        return Math.min(Math.max(parseInt(savedHeight, 10), minHeight), maxHeight);
    }

    function setKeyboardExpanded(isExpanded, { persist = true } = {}) {
        const wasCollapsed = pianoContainer.classList.contains('is-collapsed');
        const currentHeight = parseInt(getComputedStyle(pianoContainer).height, 10);
        if (!isExpanded && !wasCollapsed && currentHeight > COLLAPSED_HEIGHT) {
            lastExpandedHeight = Math.min(Math.max(currentHeight, minHeight), maxHeight);
            localStorage.setItem(PIANO_HEIGHT_STORAGE_KEY, lastExpandedHeight);
        }

        pianoContainer.classList.toggle('is-collapsed', !isExpanded);
        document.body.classList.toggle('keyboard-collapsed', !isExpanded);
        setTogglePresentation(isExpanded);

        if (persist) {
            localStorage.setItem(PIANO_EXPANDED_STORAGE_KEY, isExpanded ? 'true' : 'false');
        }

        if (!isExpanded) {
            setBodyPadding(COLLAPSED_HEIGHT);
            return;
        }

        const restoredHeight = lastExpandedHeight || getSavedHeight() || Math.max(parseInt(getComputedStyle(pianoContainer).height, 10), minHeight);
        lastExpandedHeight = restoredHeight;
        pianoContainer.style.height = restoredHeight + 'px';
        setBodyPadding(restoredHeight);
        setTimeout(() => adjustPianoKeySizes(restoredHeight), 0);
    }

    // Mouse events for desktop
    resizeHandle.addEventListener('mousedown', initResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);

    // Touch events for mobile
    resizeHandle.addEventListener('touchstart', initResizeTouch, { passive: false });
    document.addEventListener('touchmove', doResizeTouch, { passive: false });
    document.addEventListener('touchend', stopResize);

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            setKeyboardExpanded(pianoContainer.classList.contains('is-collapsed'));
        });
    }

    function initResize(e) {
        if (pianoContainer.classList.contains('is-collapsed')) return;
        isResizing = true;
        startY = e.clientY;
        startHeight = parseInt(getComputedStyle(pianoContainer).height, 10);
        pianoContainer.classList.add('resizing');
        e.preventDefault();
    }

    function initResizeTouch(e) {
        if (pianoContainer.classList.contains('is-collapsed')) return;
        isResizing = true;
        startY = e.touches[0].clientY;
        startHeight = parseInt(getComputedStyle(pianoContainer).height, 10);
        pianoContainer.classList.add('resizing');
        e.preventDefault();
    }

    function doResize(e) {
        if (!isResizing) return;

        const currentY = e.clientY;
        const diff = startY - currentY; // Positive diff = dragging up (increasing height)
        const newHeight = Math.min(Math.max(startHeight + diff, minHeight), maxHeight);

        pianoContainer.style.height = newHeight + 'px';

        // Update body padding to account for new piano height
        setBodyPadding(newHeight);

        // Adjust piano key sizes proportionally
        adjustPianoKeySizes(newHeight);
    }

    function doResizeTouch(e) {
        if (!isResizing) return;

        const currentY = e.touches[0].clientY;
        const diff = startY - currentY; // Positive diff = dragging up (increasing height)
        const newHeight = Math.min(Math.max(startHeight + diff, minHeight), maxHeight);

        pianoContainer.style.height = newHeight + 'px';

        // Update body padding to account for new piano height
        setBodyPadding(newHeight);

        // Adjust piano key sizes proportionally
        adjustPianoKeySizes(newHeight);

        e.preventDefault();
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        pianoContainer.classList.remove('resizing');

        // Save the preferred height to localStorage
        const currentHeight = parseInt(getComputedStyle(pianoContainer).height, 10);
        lastExpandedHeight = currentHeight;
        localStorage.setItem(PIANO_HEIGHT_STORAGE_KEY, currentHeight);
    }

    function adjustPianoKeySizes(containerHeight) {
        const piano = document.getElementById('piano');
        const whiteKeys = piano.querySelectorAll('.white-key');
        const blackKeys = piano.querySelectorAll('.black-key');

        // Calculate proportional key heights based on container height
        const availableHeight = containerHeight - 20; // Account for padding
        const whiteKeyHeight = Math.max(availableHeight * 0.8, 40);
        const blackKeyHeight = Math.max(whiteKeyHeight * 0.6, 25);

        whiteKeys.forEach(key => {
            key.style.height = whiteKeyHeight + 'px';
        });

        blackKeys.forEach(key => {
            key.style.height = blackKeyHeight + 'px';
        });

        // Adjust piano overall height
        piano.style.height = whiteKeyHeight + 'px';
    }

    setKeyboardExpanded(getSavedExpandedState(), { persist: false });
}
