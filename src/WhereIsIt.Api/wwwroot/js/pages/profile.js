// ============================================================
// pages/profile.js — User Profile Page
// ============================================================

function renderProfileView() {
    const container = document.getElementById('profile-page-content');
    if (!container) return;

    const user = state.user || {};
    const totalItems = state.items.length;
    const totalLocations = state.locations.length;
    const totalContainers = state.containers.length;
    const recentItems = state.items.slice(-5).reverse();
    const initials = ((user.firstName || 'B')[0] + (user.lastName || 'S')[0]).toUpperCase();

    container.innerHTML = `
        <!-- Profile Hero Banner -->
        <div class="profile-hero-card">
            <div class="profile-avatar-large">${initials}</div>
            <div class="profile-hero-info">
                <h2 class="profile-name">${user.fullName || `${user.firstName || 'Balvinder'} ${user.lastName || 'Singh'}`}</h2>
                <p class="profile-email">${user.email || 'balvinder@whereisit.local'}</p>
                <span class="profile-badge">
                    <span class="material-symbols-outlined" style="font-size:14px;">verified</span>
                    Active Workspace Member
                </span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openEditProfileModal()">
                <span class="material-symbols-outlined">edit</span>
                Edit Profile
            </button>
        </div>

        <!-- Stats Row -->
        <div class="profile-stats-row">
            <div class="profile-stat-card">
                <span class="material-symbols-outlined" style="color:var(--primary)">inventory_2</span>
                <div>
                    <div class="profile-stat-num">${totalItems}</div>
                    <div class="profile-stat-label">Items Tracked</div>
                </div>
            </div>
            <div class="profile-stat-card">
                <span class="material-symbols-outlined" style="color:var(--accent-emerald)">location_on</span>
                <div>
                    <div class="profile-stat-num">${totalLocations}</div>
                    <div class="profile-stat-label">Locations</div>
                </div>
            </div>
            <div class="profile-stat-card">
                <span class="material-symbols-outlined" style="color:var(--accent-amber)">archive</span>
                <div>
                    <div class="profile-stat-num">${totalContainers}</div>
                    <div class="profile-stat-label">Containers</div>
                </div>
            </div>
            <div class="profile-stat-card">
                <span class="material-symbols-outlined" style="color:var(--accent-purple)">checklist</span>
                <div>
                    <div class="profile-stat-num">${state.routineItems.filter(i=>i.packed).length}/${state.routineItems.length}</div>
                    <div class="profile-stat-label">Daily Carry</div>
                </div>
            </div>
        </div>

        <div class="profile-two-col">
            <!-- Recent Activity -->
            <div class="profile-section-card">
                <h3 class="profile-section-title">
                    <span class="material-symbols-outlined">history</span>
                    Recently Tracked Items
                </h3>
                ${recentItems.length > 0 ? `
                    <div class="profile-activity-list">
                        ${recentItems.map(item => `
                            <div class="profile-activity-item">
                                <div class="profile-activity-icon">
                                    <span class="material-symbols-outlined">inventory_2</span>
                                </div>
                                <div class="profile-activity-info">
                                    <div class="profile-activity-title">${item.name}</div>
                                    <div class="profile-activity-meta">${item.locationPath || 'Location'} · Condition: ${item.condition || 'Good'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-muted" style="padding:12px">No items tracked yet.</p>'}
            </div>

            <!-- Premises / Places -->
            <div class="profile-section-card">
                <h3 class="profile-section-title">
                    <span class="material-symbols-outlined">home_work</span>
                    My Physical Premises
                </h3>
                <div class="profile-activity-list">
                    ${state.places.map(place => `
                        <div class="profile-activity-item">
                            <div class="profile-activity-icon" style="background:var(--primary-surface)">
                                <span class="material-symbols-outlined" style="color:var(--primary)">home</span>
                            </div>
                            <div class="profile-activity-info">
                                <div class="profile-activity-title">${place.name}</div>
                                <div class="profile-activity-meta">${place.address || 'Physical Premise'}</div>
                            </div>
                            ${place.id === state.activePlaceId ? '<span class="nav-pill pill-success">Active</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary btn-sm" style="margin-top:12px;width:100%" onclick="openModal('modal-place')">
                    <span class="material-symbols-outlined">add</span>
                    Add New Premise
                </button>
            </div>
        </div>

        <!-- Lent Items Summary -->
        <div class="profile-section-card" style="margin-top:16px">
            <h3 class="profile-section-title">
                <span class="material-symbols-outlined">handshake</span>
                Lent Items Status
            </h3>
            <div class="profile-lent-grid">
                ${state.lentItems.map(item => `
                    <div class="profile-lent-card">
                        <strong>${item.itemName}</strong>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin: 4px 0;">Lent to: <strong>${item.borrowerName}</strong></div>
                        <span class="nav-pill ${item.status === 'Returned' ? 'pill-success' : 'pill-warning'}">${item.status}</span>
                    </div>
                `).join('')}
                ${state.lentItems.length === 0 ? '<p class="text-muted">No items currently lent out.</p>' : ''}
            </div>
        </div>
    `;
}

function openEditProfileModal() {
    const user = state.user || {};
    const modal = document.getElementById('modal-edit-profile');
    if (modal) {
        document.getElementById('edit-profile-firstname').value = user.firstName || '';
        document.getElementById('edit-profile-lastname').value = user.lastName || '';
        document.getElementById('edit-profile-email').value = user.email || '';
        openModal('modal-edit-profile');
    } else {
        showToast('Edit profile modal ready', 'info');
    }
}

async function saveProfile() {
    const firstName = document.getElementById('edit-profile-firstname')?.value?.trim();
    const lastName = document.getElementById('edit-profile-lastname')?.value?.trim();
    if (!firstName) { showToast('First name required', 'error'); return; }
    
    const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName })
    });
    
    if (res.success) {
        state.user = { ...state.user, firstName, lastName, fullName: `${firstName} ${lastName}`.trim() };
        
        const fullName = state.user.fullName;
        const initial = firstName[0].toUpperCase();

        const nameEl = document.getElementById('user-display-name');
        const initEl = document.getElementById('user-avatar-initials');
        const sideNameEl = document.getElementById('sidebar-user-name');
        const sideInitEl = document.getElementById('sidebar-user-avatar');

        if (nameEl) nameEl.textContent = firstName;
        if (initEl) initEl.textContent = initial;
        if (sideNameEl) sideNameEl.textContent = fullName;
        if (sideInitEl) sideInitEl.textContent = initial;

        closeModal('modal-edit-profile');
        renderProfileView();
        showToast('Profile updated successfully!', 'success');
    } else {
        showToast(res.message || 'Could not update profile.', 'error');
    }
}
