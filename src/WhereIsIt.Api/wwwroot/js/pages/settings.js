// ============================================================
// pages/settings.js — App Preferences & Data Management
// ============================================================

function renderSettingsView() {
    const container = document.getElementById('settings-page-content');
    if (!container) return;

    const theme = state.theme || 'light';
    const totalItems = state.items.length;
    const totalLocations = state.locations.length;
    const totalContainers = state.containers.length;
    const user = state.user || {};

    container.innerHTML = `
        <div class="settings-grid">

            <!-- Account & Profile -->
            <div class="settings-section-card">
                <h3 class="settings-section-title">
                    <span class="material-symbols-outlined">person</span>
                    Account & Workspace
                </h3>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>${user.fullName || user.firstName || 'User Account'}</strong>
                        <span>${user.email || 'Free Tier Account'}</span>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm" onclick="openEditProfileModal()">
                            <span class="material-symbols-outlined">edit</span> Edit Profile
                        </button>
                        <button class="btn btn-secondary btn-sm" style="color: #E11D48;" onclick="logoutUser()">
                            <span class="material-symbols-outlined">logout</span> Sign Out
                        </button>
                    </div>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Inventory Footprint</strong>
                        <span>${totalItems} items tracked across ${totalLocations} locations & ${totalContainers} storage boxes</span>
                    </div>
                    <span class="badge badge-success">
                        <span class="material-symbols-outlined" style="font-size: 14px;">cloud_done</span> Synced
                    </span>
                </div>
            </div>

            <!-- Appearance -->
            <div class="settings-section-card">
                <h3 class="settings-section-title">
                    <span class="material-symbols-outlined">palette</span>
                    Appearance
                </h3>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>App Theme</strong>
                        <span>Select your preferred visual style</span>
                    </div>
                    <div class="settings-theme-pills">
                        <button class="settings-theme-pill ${theme === 'light' ? 'active' : ''}" onclick="applyTheme('light'); renderSettingsView()">
                            <span class="material-symbols-outlined">light_mode</span> Light
                        </button>
                        <button class="settings-theme-pill ${theme === 'dark' ? 'active' : ''}" onclick="applyTheme('dark'); renderSettingsView()">
                            <span class="material-symbols-outlined">dark_mode</span> Dark
                        </button>
                    </div>
                </div>
            </div>

            <!-- Voice AI -->
            <div class="settings-section-card">
                <h3 class="settings-section-title">
                    <span class="material-symbols-outlined">mic</span>
                    Voice AI Assistant — Hey Finder
                </h3>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Multilingual Understanding</strong>
                        <span>Auto-detect Hindi (हिन्दी), Punjabi (ਪੰਜਾਬੀ), English & more</span>
                    </div>
                    <div class="settings-badge-ok">
                        <span class="material-symbols-outlined" style="color:var(--accent-emerald);font-size:18px">check_circle</span>
                        Active
                    </div>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Voice Feedback (Spoken Responses)</strong>
                        <span>Finder answers your questions out loud with natural voice</span>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" id="setting-speech-enabled" ${localStorage.getItem('setting_speech') !== 'false' ? 'checked' : ''}
                            onchange="localStorage.setItem('setting_speech', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Smart Echo Cancellation</strong>
                        <span>Microphone mutes during AI responses to prevent audio loops</span>
                    </div>
                    <div class="settings-badge-ok">
                        <span class="material-symbols-outlined" style="color:var(--accent-emerald);font-size:18px">check_circle</span>
                        Enabled
                    </div>
                </div>
            </div>

            <!-- Notifications & Reminders -->
            <div class="settings-section-card">
                <h3 class="settings-section-title">
                    <span class="material-symbols-outlined">notifications</span>
                    Notifications & Reminders
                </h3>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Warranty & Due Date Alerts</strong>
                        <span>Get alerted before item warranties and document renewals expire</span>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" id="setting-notifs" ${localStorage.getItem('setting_notifs') !== 'false' ? 'checked' : ''}
                            onchange="localStorage.setItem('setting_notifs', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Daily Carry (EDC) Checklist Reminder</strong>
                        <span>Remind to check everyday items (Keys, Wallet, Phone) before leaving</span>
                    </div>
                    <label class="settings-toggle">
                        <input type="checkbox" id="setting-edc-reminder" ${localStorage.getItem('setting_edc') === 'true' ? 'checked' : ''}
                            onchange="localStorage.setItem('setting_edc', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Data Backup & Export -->
            <div class="settings-section-card">
                <h3 class="settings-section-title">
                    <span class="material-symbols-outlined">cloud_sync</span>
                    Backup & Data Management
                </h3>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Export Complete Inventory Backup</strong>
                        <span>Download all possessions, locations, containers & notes as JSON</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="exportAllData()">
                        <span class="material-symbols-outlined">download</span>
                        Export JSON
                    </button>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info">
                        <strong>Export Spreadsheet (CSV)</strong>
                        <span>Download a structured CSV table for Excel / Google Sheets</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="exportInventoryCsv()">
                        <span class="material-symbols-outlined">table_chart</span>
                        Export CSV
                    </button>
                </div>
                <div class="settings-row settings-row-danger">
                    <div class="settings-row-info">
                        <strong>Refresh Local Cache</strong>
                        <span>Clear local browser cache and re-sync from secure cloud storage</span>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="clearLocalCache()">
                        <span class="material-symbols-outlined">refresh</span>
                        Refresh Cache
                    </button>
                </div>
            </div>

            <!-- About App -->
            <div class="settings-section-card">
                <h3 class="settings-section-title">
                    <span class="material-symbols-outlined">verified_user</span>
                    About & Security
                </h3>
                <div class="settings-row">
                    <div class="settings-row-info"><strong>Application</strong></div>
                    <span class="text-muted">WHERE IS IT — Finder AI</span>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info"><strong>Version</strong></div>
                    <span class="text-muted">v2.0.0 (Production Build)</span>
                </div>
                <div class="settings-row">
                    <div class="settings-row-info"><strong>Data Protection</strong></div>
                    <span class="badge badge-success">
                        <span class="material-symbols-outlined" style="font-size: 14px;">lock</span> Encrypted & Protected
                    </span>
                </div>
            </div>
        </div>
    `;
}

function exportAllData() {
    const data = {
        app: 'WHERE IS IT — Finder AI',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        items: state.items,
        locations: state.locations,
        containers: state.containers,
        lentItems: state.lentItems,
        tripManifests: state.tripManifests,
        routineItems: state.routineItems
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WhereIsIt_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Inventory backup exported successfully!', 'success');
}

function clearLocalCache() {
    if (!confirm('Re-sync local cache from cloud storage?')) return;
    const keysToKeep = ['whereisit_token', 'whereisit_theme'];
    Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) localStorage.removeItem(key);
    });
    showToast('Cache refreshed! Re-syncing...', 'success');
    location.reload();
}
