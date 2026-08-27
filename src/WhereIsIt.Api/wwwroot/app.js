// ============================================================
// app.js — Main Application Entry Point & Lifecycle Bootstrapper
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log(`[${APP_NAME}] Initializing engine v${APP_VERSION}...`);
    applyTheme(state.theme);
    setupEventListeners();
    initVoiceAgent();
    
    // Immediately display and activate Dashboard view on initial load
    switchTab('dashboard');

    await initializeAuth();
    await loadInitialData();

    // Re-sync dashboard view with freshly loaded backend data
    switchTab('dashboard');
    console.log(`[${APP_NAME}] Engine ready.`);
});
