// ============================================================
// state.js — Global Application State & Reactive Store
// ============================================================

let state = {
    theme: localStorage.getItem('whereisit_theme') || 'light',
    user: null,
    token: localStorage.getItem('whereisit_token') || null,
    places: [],
    activePlaceId: null,
    locations: [],
    categories: [],
    items: [],
    containers: [],
    reminders: [],
    selectedLocationId: null,
    selectedCategoryFilter: '',
    selectedItemIdsForBulk: new Set(),
    
    // Daily Routine (Everyday Carry - EDC) checklist
    routineItems: JSON.parse(localStorage.getItem('whereisit_routine') || 'null') || [
        { id: 'keys', name: 'House & Car Keys', defaultLoc: 'Living Room → Key Hook', packed: false, icon: 'key' },
        { id: 'wallet', name: 'Wallet & Cards', defaultLoc: 'Bedroom → Bedside Table', packed: false, icon: 'wallet' },
        { id: 'phone', name: 'Smartphone & Charger', defaultLoc: 'Bedroom → Study Table', packed: false, icon: 'smartphone' },
        { id: 'badge', name: 'Office ID / Access Badge', defaultLoc: 'Living Room → Entry Table', packed: false, icon: 'badge' },
        { id: 'metro', name: 'Transit / Metro Card', defaultLoc: 'Wallet / Cardholder', packed: false, icon: 'directions_subway' },
        { id: 'laptop', name: 'Laptop & Charger', defaultLoc: 'Bedroom → Study Table', packed: false, icon: 'laptop_mac' },
        { id: 'water', name: 'Water Bottle', defaultLoc: 'Kitchen → Counter', packed: false, icon: 'water_bottle' },
        { id: 'medicine', name: 'Daily Vitamins / Medicine', defaultLoc: 'Kitchen → Medicine Box', packed: false, icon: 'medication' }
    ],

    // Lent & Borrowed Items Tracker
    lentItems: JSON.parse(localStorage.getItem('whereisit_lent') || 'null') || [
        { id: 'loan_1', itemName: 'Bosch Power Drill', borrowerName: 'Rahul Sharma', borrowerPhone: '+91 98765 43210', dateLent: '2026-08-20', dueDate: '2026-08-30', status: 'Lent Out', notes: 'Home painting & repair work' }
    ],

    // Trips & Travel Packing Manifests
    tripManifests: JSON.parse(localStorage.getItem('whereisit_trips') || 'null') || [
        {
            id: 'trip_1',
            name: 'Goa Holiday Vacation (Suitcase #1)',
            targetDate: '2026-09-15',
            destination: 'North Goa',
            items: [
                { name: 'Passport / ID Proof', packed: false },
                { name: 'Sunglasses & Sunscreen', packed: false },
                { name: 'MacBook & Charger', packed: false },
                { name: 'Power Bank', packed: false },
                { name: 'Beachwear & Slippers', packed: false }
            ]
        }
    ]
};

// Global Media & PWA references
let videoStream = null;
let pwaInstallPrompt = null;
