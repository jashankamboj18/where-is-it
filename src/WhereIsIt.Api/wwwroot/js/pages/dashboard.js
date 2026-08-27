// ============================================================
// pages/dashboard.js — Dashboard View & Control Elements
// ============================================================

function renderDashboard() {
    const totalEl = document.getElementById('stat-total-items');
    const placesEl = document.getElementById('stat-total-places');
    const starredEl = document.getElementById('stat-starred-items');
    const cntEl = document.getElementById('stat-total-containers');

    if (totalEl) totalEl.textContent = state.items.length;
    if (placesEl) placesEl.textContent = state.places.length;
    if (starredEl) starredEl.textContent = state.items.filter(i => i.isImportant).length;
    if (cntEl) cntEl.textContent = state.containers.length;

    const countBadge = document.getElementById('badge-items-count');
    const cntBadge = document.getElementById('badge-containers-count');
    const remBadge = document.getElementById('badge-reminders-count');
    if (countBadge) countBadge.textContent = state.items.length;
    if (cntBadge) cntBadge.textContent = state.containers.length;
    if (remBadge) remBadge.textContent = state.reminders.length;

    renderDashboardRoutineChips();

    // Starred Items
    const starredList = document.getElementById('starred-items-list');
    if (starredList) {
        const starredItems = state.items.filter(i => i.isImportant);
        if (starredItems.length === 0) {
            starredList.innerHTML = `
                <div class="empty-state-box">
                    <span class="material-symbols-outlined">star_outline</span>
                    <p>No starred items yet. Star frequently accessed items for 1-tap lookup.</p>
                </div>`;
        } else {
            starredList.innerHTML = starredItems.map(i => renderItemCardHtml(i, false)).join('');
        }
    }

    // Reminders List
    const remList = document.getElementById('dashboard-reminders-list');
    if (remList) {
        if (state.reminders.length === 0) {
            remList.innerHTML = `
                <div class="empty-state-box">
                    <span class="material-symbols-outlined">event_available</span>
                    <p>No upcoming reminders. Add warranties, passports, or insurance renewal alerts.</p>
                </div>`;
        } else {
            remList.innerHTML = state.reminders.slice(0, 5).map(r => `
                <div class="item-path-box mt-2" style="justify-content: space-between;">
                    <div>
                        <strong>${r.itemName}</strong>
                        <div style="font-size: 0.76rem; color: var(--text-muted);">${formatReminderType(r.reminderType)} · Due ${new Date(r.reminderDate).toLocaleDateString()}</div>
                    </div>
                    <span class="nav-pill ${r.daysRemaining <= 7 ? 'pill-warning' : ''}">${r.daysRemaining} days left</span>
                </div>
            `).join('');
        }
    }

    // Recent items
    const recentList = document.getElementById('recent-items-container');
    if (recentList) {
        if (state.items.length === 0) {
            recentList.innerHTML = `
                <div class="empty-state-box">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <p>No items added yet. Click "+ Add Item" above or ask Finder AI!</p>
                </div>`;
        } else {
            recentList.innerHTML = state.items.slice(0, 6).map(i => renderItemCardHtml(i, false)).join('');
        }
    }
}

// UI Dropdowns & Selects
function updatePlaceSelector() {
    const select = document.getElementById('active-place-select');
    if (!select) return;
    select.innerHTML = '';
    state.places.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === state.activePlaceId) opt.selected = true;
        select.appendChild(opt);
    });

    const locPlaceSelect = document.getElementById('loc-place-id');
    if (locPlaceSelect) locPlaceSelect.innerHTML = select.innerHTML;
}

function populateCategoryDropdowns() {
    const itemCat = document.getElementById('item-category');
    if (!itemCat) return;
    itemCat.innerHTML = '';

    state.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        itemCat.appendChild(opt);
    });
}

function renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    let html = `
        <button class="cat-pill ${state.selectedCategoryFilter === '' ? 'active' : ''}" data-category="">All Items</button>
        <button class="cat-pill ${state.selectedCategoryFilter === 'starred' ? 'active' : ''}" data-category="starred">⭐ Starred</button>
    `;

    state.categories.forEach(c => {
        const isAct = state.selectedCategoryFilter === c.id;
        html += `<button class="cat-pill ${isAct ? 'active' : ''}" data-category="${c.id}">${c.name}</button>`;
    });

    container.innerHTML = html;

    container.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedCategoryFilter = btn.getAttribute('data-category');
            renderCategoryPills();
            renderAllItemsView();
        });
    });
}

function populateLocationDropdowns() {
    const itemLoc = document.getElementById('item-location');
    const moveLoc = document.getElementById('move-new-location');
    const bulkLoc = document.getElementById('bulk-move-target-location');
    const cntLoc = document.getElementById('cnt-location');
    const parentLoc = document.getElementById('loc-parent-id');

    if (itemLoc) itemLoc.innerHTML = '';
    if (moveLoc) moveLoc.innerHTML = '';
    if (bulkLoc) bulkLoc.innerHTML = '';
    if (cntLoc) cntLoc.innerHTML = '';
    if (parentLoc) parentLoc.innerHTML = '<option value="">Top Level (Directly in Premise e.g. Bedroom)</option>';

    state.locations.forEach(l => {
        const path = l.fullPath || l.name;
        
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = path;
        if (itemLoc) itemLoc.appendChild(opt.cloneNode(true));
        if (moveLoc) moveLoc.appendChild(opt.cloneNode(true));
        if (bulkLoc) bulkLoc.appendChild(opt.cloneNode(true));
        if (cntLoc) cntLoc.appendChild(opt.cloneNode(true));

        if (parentLoc) {
            const parentOpt = document.createElement('option');
            parentOpt.value = l.id;
            parentOpt.textContent = path;
            parentLoc.appendChild(parentOpt);
        }
    });
}

function populateContainerDropdowns() {
    const itemCnt = document.getElementById('item-container');
    if (!itemCnt) return;
    itemCnt.innerHTML = '<option value="">None (Directly on spot/shelf)</option>';
    state.containers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.locationPath || 'Location'})`;
        itemCnt.appendChild(opt);
    });
}

function populateItemDropdownsForReminders() {
    const remItem = document.getElementById('rem-item-id');
    if (!remItem) return;
    remItem.innerHTML = '';
    state.items.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.id;
        opt.textContent = `${i.name} (${i.locationPath})`;
        remItem.appendChild(opt);
    });
}

function populateLentItemDropdown() {
    const lentSelect = document.getElementById('lent-item-id');
    if (!lentSelect) return;
    lentSelect.innerHTML = '';
    state.items.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.id;
        opt.textContent = `${i.name} (${i.locationPath})`;
        lentSelect.appendChild(opt);
    });
}
