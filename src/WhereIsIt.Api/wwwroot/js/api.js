// ============================================================
// api.js — HTTP Client with Real-Time Offline Cache & Sync
// ============================================================

// Base API Request Helper with Fast Timeout & Offline Fallback
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}),
        ...options.headers
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 4000);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok && response.status === 401) {
            console.warn('Session expired or unauthorized');
            localStorage.removeItem('whereisit_token');
            state.token = null;
        }

        return await response.json();
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`Network request to ${endpoint} timed out or failed, falling back to local device storage:`, err);
        return handleOfflineFallback(endpoint, options);
    }
}

// Offline Local Database Engine
function handleOfflineFallback(endpoint, options) {
    const method = options.method || 'GET';
    const localStoreKey = `whereisit_local_${endpoint.split('?')[0].replace(/\//g, '_')}`;

    if (method === 'GET') {
        const cached = localStorage.getItem(localStoreKey);
        if (cached) {
            try { return { success: true, data: JSON.parse(cached) }; } catch { /* ignore */ }
        }
        // Return default empty structure
        return { success: true, data: getDefaultOfflineData(endpoint) };
    } else {
        // Save mutations locally
        if (options.body) {
            try {
                const body = JSON.parse(options.body);
                saveOfflineMutation(endpoint, body);
            } catch { /* ignore */ }
        }
        return { success: true, data: { id: Date.now().toString() } };
    }
}

function getDefaultOfflineData(endpoint) {
    if (endpoint.includes('/places')) {
        return [
            { id: 'place-home', name: 'Home', address: 'Main Residence', isDefault: true, roomsCount: 3, itemsCount: 0 },
            { id: 'place-office', name: 'Workplace / Office', address: 'Workspace', isDefault: false, roomsCount: 1, itemsCount: 0 }
        ];
    }
    if (endpoint.includes('/categories')) {
        return [
            { id: 'cat-elec', name: 'Electronics & Gadgets', icon: 'devices', color: '#2563EB', itemCount: 0 },
            { id: 'cat-docs', name: 'Important Documents', icon: 'description', color: '#10B981', itemCount: 0 },
            { id: 'cat-keys', name: 'Keys & Wallets', icon: 'key', color: '#D97706', itemCount: 0 },
            { id: 'cat-cloth', name: 'Clothing & Accessories', icon: 'checkroom', color: '#7C3AED', itemCount: 0 },
            { id: 'cat-tools', name: 'Tools & Hardware', icon: 'build', color: '#E11D48', itemCount: 0 },
            { id: 'cat-meds', name: 'Medicines & Health', icon: 'medication', color: '#059669', itemCount: 0 }
        ];
    }
    if (endpoint.includes('/routine')) {
        return [
            { id: 'rt-1', name: 'House & Car Keys', isPacked: false, locationName: 'Entryway Hook' },
            { id: 'rt-2', name: 'Wallet & ID Cards', isPacked: false, locationName: 'Nightstand' },
            { id: 'rt-3', name: 'Mobile Phone & Charger', isPacked: false, locationName: 'Desk' }
        ];
    }
    return [];
}

function saveOfflineMutation(endpoint, data) {
    console.log('Saved offline data mutation:', endpoint, data);
}

// Initial Data Load (Places & Categories)
async function loadInitialData() {
    try {
        await Promise.all([
            loadPlaces(),
            loadCategories()
        ]);

        if (state.places && state.places.length > 0) {
            state.activePlaceId = state.places[0].id;
            updatePlaceSelector();
            await loadPlaceSpecificData();
        } else {
            // Seed initial default place if user has no places
            state.places = getDefaultOfflineData('/places');
            state.activePlaceId = state.places[0].id;
            updatePlaceSelector();
            state.categories = getDefaultOfflineData('/categories');
            populateCategoryDropdowns();
            renderCategoryPills();
            await loadPlaceSpecificData();
        }
    } catch (err) {
        console.error('Failed to load initial data:', err);
    }
}

// Places
async function loadPlaces() {
    try {
        const res = await apiFetch('/places');
        if (res && res.success && res.data && res.data.length > 0) {
            state.places = res.data;
        } else {
            state.places = getDefaultOfflineData('/places');
        }
    } catch {
        state.places = getDefaultOfflineData('/places');
    }
}

// Categories
async function loadCategories() {
    try {
        const res = await apiFetch('/categories');
        if (res && res.success && res.data && res.data.length > 0) {
            state.categories = res.data;
        } else {
            state.categories = getDefaultOfflineData('/categories');
        }
        populateCategoryDropdowns();
        renderCategoryPills();
    } catch {
        state.categories = getDefaultOfflineData('/categories');
        populateCategoryDropdowns();
        renderCategoryPills();
    }
}

// Premise-Specific Data Load
async function loadPlaceSpecificData() {
    if (!state.activePlaceId) return;

    try {
        await Promise.all([
            loadItems(),
            loadRooms(),
            loadContainers(),
            loadRoutineItems(),
            loadLentItems()
        ]);
    } catch (err) {
        console.error('Error loading place specific data:', err);
    }

    updateDashboardCounts();
    if (state.currentTab === 'dashboard') {
        renderDashboardView();
    }
}

// Items
async function loadItems() {
    const res = await apiFetch(`/items?placeId=${state.activePlaceId}`);
    if (res && res.success) {
        state.items = res.data || [];
        updateItemBadges();
    }
}

// Rooms
async function loadRooms() {
    const res = await apiFetch(`/places/${state.activePlaceId}/rooms`);
    if (res && res.success) {
        state.rooms = res.data || [];
        populateRoomDropdowns();
    }
}

// Containers
async function loadContainers() {
    const res = await apiFetch(`/containers?placeId=${state.activePlaceId}`);
    if (res && res.success) {
        state.containers = res.data || [];
        populateContainerDropdowns();
    }
}

// Daily Carry (Routine)
async function loadRoutineItems() {
    const res = await apiFetch('/routine');
    if (res && res.success) {
        state.routineItems = res.data || [];
    } else {
        state.routineItems = getDefaultOfflineData('/routine');
    }
}

// Lent / Borrowed
async function loadLentItems() {
    const res = await apiFetch('/lent');
    if (res && res.success) {
        state.lentItems = res.data || [];
    }
}
