// ============================================================
// pages/containers.js — Container & QR Box Management
// ============================================================

function renderContainersView() {
    const grid = document.getElementById('containers-grid-container');
    if (!grid) return;
    if (state.containers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">all_inbox</span>
                <p>No storage containers created yet. Create a box or bag and generate a printable QR label!</p>
            </div>`;
    } else {
        grid.innerHTML = state.containers.map(c => `
            <div class="item-card">
                <div class="item-card-top">
                    <div class="item-card-header">
                        <div class="item-card-title">${c.name}</div>
                        <span class="nav-pill">${c.type}</span>
                    </div>
                    <button class="btn btn-secondary btn-xs btn-show-qr" data-name="${c.name}" data-token="${c.qrToken || c.id}" data-path="${c.locationPath || 'Location'}" data-code="${c.qrCode || 'BOX-01'}">
                        <span class="material-symbols-outlined">qr_code</span> QR Label
                    </button>
                </div>
                <div class="item-path-box">
                    <span class="material-symbols-outlined">pin_drop</span>
                    <span>${c.locationPath || 'Location'}</span>
                </div>
                <div class="item-details-row">
                    <span>Stored Items: <strong>${c.itemsCount || 0}</strong></span>
                    <span>Label: <strong>${c.qrCode || 'N/A'}</strong></span>
                </div>
            </div>
        `).join('');
    }
}

function openQrSheetModal() {
    const grid = document.getElementById('printable-qr-grid');
    if (!grid) return;

    if (state.containers.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1; text-align: center;">No containers to generate stickers for. Create boxes first.</p>';
    } else {
        grid.innerHTML = state.containers.map(c => `
            <div class="qr-sheet-cell">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(c.qrToken || c.id)}" alt="QR">
                <h5>${c.name}</h5>
                <p>${c.locationPath || ''}</p>
                <div style="font-size: 0.65rem; font-family: monospace; color: #64748B;">TOKEN: ${(c.qrToken || c.id).slice(0, 12)}...</div>
            </div>
        `).join('');
    }

    openModal('modal-qr-sheet');
}
