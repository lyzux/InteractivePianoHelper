// Piano Resize Handler — extracted from index.html inline script
// Lets the user drag a handle to change the piano keyboard height.
// Persists the chosen height to localStorage and restores it on load.

export function initializePianoResize() {
    const resizeHandle = document.getElementById('pianoResizeHandle');
    const pianoContainer = document.getElementById('pianoKeyboardContainer');

    if (!resizeHandle || !pianoContainer) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const minHeight = 80;  // Minimum height in pixels
    const maxHeight = window.innerHeight * 0.6; // Maximum 60% of screen height

    // Mouse events for desktop
    resizeHandle.addEventListener('mousedown', initResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);

    // Touch events for mobile
    resizeHandle.addEventListener('touchstart', initResizeTouch, { passive: false });
    document.addEventListener('touchmove', doResizeTouch, { passive: false });
    document.addEventListener('touchend', stopResize);

    function initResize(e) {
        isResizing = true;
        startY = e.clientY;
        startHeight = parseInt(getComputedStyle(pianoContainer).height, 10);
        pianoContainer.classList.add('resizing');
        e.preventDefault();
    }

    function initResizeTouch(e) {
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
        document.body.style.paddingBottom = (newHeight + 20) + 'px';

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
        document.body.style.paddingBottom = (newHeight + 20) + 'px';

        // Adjust piano key sizes proportionally
        adjustPianoKeySizes(newHeight);

        e.preventDefault();
    }

    function stopResize() {
        isResizing = false;
        pianoContainer.classList.remove('resizing');

        // Save the preferred height to localStorage
        const currentHeight = parseInt(getComputedStyle(pianoContainer).height, 10);
        localStorage.setItem('pianoHeight', currentHeight);
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

    // Restore saved height on page load
    const savedHeight = localStorage.getItem('pianoHeight');
    if (savedHeight && !isNaN(savedHeight)) {
        const height = Math.min(Math.max(parseInt(savedHeight), minHeight), maxHeight);
        pianoContainer.style.height = height + 'px';
        document.body.style.paddingBottom = (height + 20) + 'px';

        // Wait for piano to be rendered, then adjust key sizes
        setTimeout(() => {
            adjustPianoKeySizes(height);
        }, 1000);
    }
}
