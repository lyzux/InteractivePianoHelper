// Sound panel controller.
// Keeps the right-side piano controls expandable/retractable and persists state.

const SOUND_PANEL_STORAGE_KEY = 'soundPanelExpanded';

export function initializeMobileMenu() {
    const panelToggle = document.getElementById('mobileMenuToggle');
    const physicsSidebar = document.getElementById('physicsSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (!panelToggle || !physicsSidebar) return;

    function setPanelExpanded(isExpanded) {
        physicsSidebar.classList.toggle('is-collapsed', !isExpanded);
        document.body.classList.toggle('sound-panel-expanded', isExpanded);
        panelToggle.setAttribute('aria-expanded', String(isExpanded));
        panelToggle.title = isExpanded ? 'Hide piano controls' : 'Show piano controls';
        const label = panelToggle.querySelector('.sound-panel-label');
        if (label) label.textContent = isExpanded ? 'Hide' : 'Sound';
        localStorage.setItem(SOUND_PANEL_STORAGE_KEY, isExpanded ? 'true' : 'false');

        if (mobileOverlay) {
            mobileOverlay.classList.toggle('active', isExpanded && window.matchMedia('(max-width: 768px)').matches);
        }

        window.dispatchEvent(new CustomEvent('score-layout-change'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('score-layout-change')), 280);
    }

    const savedExpanded = localStorage.getItem(SOUND_PANEL_STORAGE_KEY) === 'true';
    setPanelExpanded(savedExpanded);

    panelToggle.addEventListener('click', () => {
        setPanelExpanded(physicsSidebar.classList.contains('is-collapsed'));
    });

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => setPanelExpanded(false));
    }

    window.addEventListener('resize', () => {
        const isExpanded = !physicsSidebar.classList.contains('is-collapsed');
        if (mobileOverlay) {
            mobileOverlay.classList.toggle('active', isExpanded && window.matchMedia('(max-width: 768px)').matches);
        }
    });
}
