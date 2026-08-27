// ============================================================
// api.js — HTTP Client & Data Fetching Service
// ============================================================

// Base API Request Helper
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    return await response.json();
}

// Initial Data Load (Places & Categories)
async function loadInitialData() {
    try {
        await Promise.all([
            loadPlaces(),
            loadCategories()
        ]);

        if (state.places.length > 0) {
            state.activePlaceId = state.places[0].id;
            updatePlaceSelector();
            await loadPlaceSpecificData();
        }
    } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Error connecting to local SQL server', 'error');
    }
}

// Places
async function loadPlaces() {
    const res = await apiFetch('/places');
    if (res.success) {
        state.places = res.data;
    }
}

// Categories
async function loadCategories() {
    const res = await apiFetch('/categories');
    if (res.success) {
        state.categories = res.data;
        populateCategoryDropdowns();
        renderCategoryPills();
    }
}

// Premise-Specific Data Load
async function loadPlaceSpecificData() {
    if (!state.activePlaceId) return;

    await Promise.all([
        loadLocations(),
        loadItems(),
        loadContainers(),
        loadReminders()
    ]);

    renderDashboard();
    renderAllItemsView();
    renderRoutineView();
    renderLentView();
    renderTripsView();
    renderValuationView();
    renderLocationTree();
    renderContainersView();
    renderRemindersView();
}

// Locations in active place
async function loadLocations() {
    const res = await apiFetch(`/locations/by-place/${state.activePlaceId}`);
    if (res.success) {
        state.locations = res.data;
        populateLocationDropdowns();
    }
}

// Items in active place
async function loadItems() {
    const res = await apiFetch(`/items?placeId=${state.activePlaceId}`);
    if (res.success) {
        state.items = res.data.items || [];
        populateLentItemDropdown();
    }
}

// Storage Containers
async function loadContainers() {
    const res = await apiFetch('/containers');
    if (res.success) {
        state.containers = res.data;
        populateContainerDropdowns();
    }
}

// Reminders
async function loadReminders() {
    const res = await apiFetch('/reminders?daysAhead=90');
    if (res.success) {
        state.reminders = res.data;
    }
}
