// ============================================================
// pages/trips.js — Travel Packing Manifests & Insurance Valuation
// ============================================================

function renderTripsView() {
    const container = document.getElementById('trips-container');
    if (!container) return;

    if (state.tripManifests.length === 0) {
        container.innerHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">luggage</span>
                <p>No packing manifests created. Create one for your next trip, move, or event!</p>
            </div>`;
    } else {
        container.innerHTML = state.tripManifests.map(t => {
            const packedCount = t.items.filter(i => i.packed).length;
            const percent = t.items.length > 0 ? Math.round((packedCount / t.items.length) * 100) : 0;
            return `
                <div class="trip-manifest-card" data-trip-id="${t.id}">
                    <div class="trip-manifest-header">
                        <div class="trip-manifest-title">${t.name}</div>
                        <span class="nav-pill pill-success">${percent}% Packed</span>
                    </div>
                    <div class="text-muted" style="font-size: 0.8rem;">Target: ${t.targetDate || 'No date'} ${t.destination ? `· ${t.destination}` : ''}</div>
                    
                    <div class="progress-track-bar">
                        <div class="progress-fill-indicator" style="width: ${percent}%;"></div>
                    </div>

                    <ul class="manifest-items-list">
                        ${t.items.map((item, idx) => `
                            <li class="manifest-item-row ${item.packed ? 'packed-done' : ''}" data-trip-id="${t.id}" data-idx="${idx}">
                                <span class="material-symbols-outlined" style="font-size: 18px; color: ${item.packed ? 'var(--accent-emerald)' : 'var(--text-faint)'};">${item.packed ? 'check_box' : 'check_box_outline_blank'}</span>
                                <span>${item.name}</span>
                            </li>
                        `).join('')}
                    </ul>

                    <div class="item-card-actions">
                        <button class="btn btn-secondary btn-xs btn-add-trip-item" data-trip-id="${t.id}">+ Add Item</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function saveTripState() {
    localStorage.setItem('whereisit_trips', JSON.stringify(state.tripManifests));
}

// Home Insurance & Asset Net Worth Valuation
async function renderValuationView() {
    const res = await apiFetch('/items/valuation');
    if (!res.success) return;

    const data = res.data;
    const totalAmount = document.getElementById('val-total-amount');
    const pricedCount = document.getElementById('val-priced-count');
    const categoryGrid = document.getElementById('valuation-category-breakdown');

    if (totalAmount) totalAmount.textContent = `₹${data.totalEstimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (pricedCount) pricedCount.textContent = `${data.itemsWithPrice} of ${data.totalItems} possessions have purchase valuations`;

    if (categoryGrid) {
        categoryGrid.innerHTML = data.categoryBreakdown.map(c => `
            <div class="val-cat-card">
                <div class="val-cat-name">${c.categoryName}</div>
                <div class="val-cat-amt">₹${c.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div class="val-cat-count">${c.itemCount} possessions tracked</div>
            </div>
        `).join('');
    }
}
