// ============================================================
// pwa.js — PWA Service Worker & Android Installation Engine
// ============================================================

// Register Service Worker for Android offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('[PWA] Service Worker registered:', reg.scope);
            })
            .catch(err => {
                console.warn('[PWA] Service Worker registration failed:', err);
            });
    });
}

// Capture the install prompt event before browser consumes it
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pwaInstallPrompt = e;

    // Show install button in header
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) installBtn.style.display = 'flex';

    // Show bottom install banner after 3 seconds if not dismissed
    setTimeout(() => {
        const banner = document.getElementById('pwa-install-banner');
        if (banner && !localStorage.getItem('pwa_banner_dismissed')) {
            banner.style.display = 'flex';
        }
    }, 3000);
});

// When app is successfully installed
window.addEventListener('appinstalled', () => {
    pwaInstallPrompt = null;
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) installBtn.style.display = 'none';
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
    showToast('🎉 WHERE IS IT installed on your device!', 'success');
});

async function triggerPwaInstall() {
    if (!pwaInstallPrompt) {
        showToast('App is already installed or not available for install on this browser.', 'info');
        return;
    }
    pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    if (outcome === 'accepted') {
        showToast('✅ Installing WHERE IS IT on your Android phone!', 'success');
    }
    pwaInstallPrompt = null;
}
