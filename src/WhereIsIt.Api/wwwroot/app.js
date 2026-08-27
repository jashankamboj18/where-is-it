// ============================================================
// app.js — Main Application Entry Point & Fast Lifecycle Bootstrapper
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log(`[${APP_NAME}] Initializing engine v${APP_VERSION}...`);
    applyTheme(state.theme);
    setupEventListeners();
    initVoiceAgent();
    
    // 1. Immediately display Dashboard in 0ms (instant 60fps load)
    switchTab('dashboard');

    // 2. Asynchronous background session & data hydration (non-blocking)
    initializeAuth().then(() => {
        loadInitialData().then(() => {
            if (state.currentTab === 'dashboard') {
                renderDashboardView();
            }
        });
    });

    console.log(`[${APP_NAME}] Engine ready.`);
});
