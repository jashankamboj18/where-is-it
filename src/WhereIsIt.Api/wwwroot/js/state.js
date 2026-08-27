// ============================================================
// state.js — Instant Local-First Global Application Store
// ============================================================

const defaultPlaces = [
    { id: 'place-home', name: 'Home', address: 'Main House', isDefault: true, roomsCount: 3, itemsCount: 0 },
    { id: 'place-office', name: 'Office / Studio', address: 'Workplace', isDefault: false, roomsCount: 1, itemsCount: 0 }
];

const defaultCategories = [
    { id: 'cat-elec', name: 'Electronics & Gadgets', icon: 'devices', colorHex: '#2563EB', itemCount: 0 },
    { id: 'cat-docs', name: 'Important Documents', icon: 'description', colorHex: '#10B981', itemCount: 0 },
    { id: 'cat-keys', name: 'Keys & Wallets', icon: 'key', colorHex: '#D97706', itemCount: 0 },
    { id: 'cat-cloth', name: 'Clothing & Accessories', icon: 'checkroom', colorHex: '#7C3AED', itemCount: 0 },
    { id: 'cat-tools', name: 'Tools & Hardware', icon: 'build', colorHex: '#E11D48', itemCount: 0 },
    { id: 'cat-meds', name: 'Medicines & Health', icon: 'medication', colorHex: '#059669', itemCount: 0 },
    { id: 'cat-valuables', name: 'Jewelry & Valuables', icon: 'diamond', colorHex: '#F59E0B', itemCount: 0 },
    { id: 'cat-other', name: 'Miscellaneous', icon: 'inventory_2', colorHex: '#64748B', itemCount: 0 }
];

const defaultRooms = [
    { id: 'room-1', name: 'Master Bedroom', placeId: 'place-home' },
    { id: 'room-2', name: 'Living Room', placeId: 'place-home' },
    { id: 'room-3', name: 'Kitchen & Dining', placeId: 'place-home' }
];

const defaultContainers = [
    { id: 'box-1', name: 'Storage Box #1', qrToken: 'BOX-101', roomName: 'Master Bedroom Wardrobe', placeId: 'place-home' }
];

let state = {
    theme: localStorage.getItem('whereisit_theme') || 'light',
    user: JSON.parse(localStorage.getItem('whereisit_user') || 'null'),
    token: localStorage.getItem('whereisit_token') || null,

    places: JSON.parse(localStorage.getItem('whereisit_places') || 'null') || defaultPlaces,
    activePlaceId: localStorage.getItem('whereisit_active_place') || 'place-home',
    categories: JSON.parse(localStorage.getItem('whereisit_categories') || 'null') || defaultCategories,
    rooms: JSON.parse(localStorage.getItem('whereisit_rooms') || 'null') || defaultRooms,
    locations: JSON.parse(localStorage.getItem('whereisit_locations') || 'null') || defaultRooms,
    containers: JSON.parse(localStorage.getItem('whereisit_containers') || 'null') || defaultContainers,
    items: JSON.parse(localStorage.getItem('whereisit_items') || 'null') || [],
    reminders: JSON.parse(localStorage.getItem('whereisit_reminders') || 'null') || [],
    
    selectedLocationId: null,
    selectedCategoryFilter: '',
    selectedItemIdsForBulk: new Set(),
    
    // Daily Routine (Everyday Carry - EDC) checklist
    routineItems: JSON.parse(localStorage.getItem('whereisit_routine') || 'null') || [
        { id: 'keys', name: 'House & Car Keys', defaultLoc: 'Living Room → Key Hook', packed: false, icon: 'key' },
        { id: 'wallet', name: 'Wallet & Cards', defaultLoc: 'Bedroom → Bedside Table', packed: false, icon: 'wallet' },
        { id: 'phone', name: 'Smartphone & Charger', defaultLoc: 'Bedroom → Study Table', packed: false, icon: 'smartphone' },
        { id: 'badge', name: 'Office ID / Access Badge', defaultLoc: 'Living Room → Entry Table', packed: false, icon: 'badge' },
        { id: 'laptop', name: 'Laptop & Charger', defaultLoc: 'Bedroom → Study Table', packed: false, icon: 'laptop_mac' }
    ],

    // Lent & Borrowed Items Tracker
    lentItems: JSON.parse(localStorage.getItem('whereisit_lent') || 'null') || [],

    // Trips & Travel Packing Manifests
    tripManifests: JSON.parse(localStorage.getItem('whereisit_trips') || 'null') || []
};

// State Persistence Helper
function persistLocalState() {
    try {
        localStorage.setItem('whereisit_places', JSON.stringify(state.places));
        localStorage.setItem('whereisit_active_place', state.activePlaceId);
        localStorage.setItem('whereisit_categories', JSON.stringify(state.categories));
        localStorage.setItem('whereisit_rooms', JSON.stringify(state.rooms));
        localStorage.setItem('whereisit_locations', JSON.stringify(state.locations));
        localStorage.setItem('whereisit_containers', JSON.stringify(state.containers));
        localStorage.setItem('whereisit_items', JSON.stringify(state.items));
        localStorage.setItem('whereisit_routine', JSON.stringify(state.routineItems));
        localStorage.setItem('whereisit_lent', JSON.stringify(state.lentItems));
        localStorage.setItem('whereisit_trips', JSON.stringify(state.tripManifests));
        localStorage.setItem('whereisit_reminders', JSON.stringify(state.reminders));
    } catch (e) {
        console.warn('Could not persist to local storage:', e);
    }
}

// Global Media & PWA references
let videoStream = null;
let pwaInstallPrompt = null;
