// Mobile Menu — extracted from index.html inline script
// Wires the hamburger toggle, close button, and overlay for the mobile sidebar drawer.

export function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const physicsSidebar = document.getElementById('physicsSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            physicsSidebar.classList.add('mobile-open');
            mobileOverlay.classList.add('active');
            mobileMenuToggle.classList.add('menu-open');
        });
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', () => {
            physicsSidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('menu-open');
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            physicsSidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('menu-open');
        });
    }
}
