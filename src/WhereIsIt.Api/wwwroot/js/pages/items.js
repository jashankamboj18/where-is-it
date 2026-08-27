// ============================================================
// pages/items.js — Possessions View & Item Management
// ============================================================

function renderAllItemsView() {
    const container = document.getElementById('items-table-container');
    if (!container) return;

    let filtered = [...state.items];
    if (state.selectedCategoryFilter === 'starred') {
        filtered = filtered.filter(i => i.isImportant);
    } else if (state.selectedCategoryFilter) {
        filtered = filtered.filter(i => i.categoryId === state.selectedCategoryFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">inventory_2</span>
                <p>No items found in this filter. Click "+ Add Item" to record possessions.</p>
            </div>`;
    } else {
        container.innerHTML = filtered.map(i => renderItemCardHtml(i, true)).join('');
    }

    updateBulkMoveButton();
}

function renderItemCardHtml(item, showCheckbox = false) {
    const isSelected = state.selectedItemIdsForBulk.has(item.id);
    return `
        <div class="item-card" data-item-id="${item.id}">
            <div class="item-card-top" onclick="showItemDetailModal('${item.id}')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${showCheckbox ? `<input type="checkbox" class="item-select-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleBulkItem('${item.id}')">` : ''}
                    <div class="item-card-header">
                        <div class="item-card-title">${item.name}</div>
                        <span class="item-category-tag" style="background: rgba(37, 99, 235, 0.1); color: ${item.categoryColorHex || '#2563EB'};">
                            <span class="material-symbols-outlined" style="font-size: 14px;">${item.categoryIcon || 'category'}</span>
                            ${item.categoryName}
                        </span>
                    </div>
                </div>
                ${item.isImportant ? '<span class="material-symbols-outlined text-amber">star</span>' : ''}
            </div>

            <!-- Structured Location Breadcrumb -->
            <div class="item-path-box" onclick="showItemDetailModal('${item.id}')">
                <span class="material-symbols-outlined">pin_drop</span>
                <span>${item.locationPath || item.locationName || 'Home Location'}</span>
            </div>

            <div class="item-details-row" onclick="showItemDetailModal('${item.id}')">
                ${item.brand ? `<span>Brand: <strong>${item.brand}</strong></span>` : ''}
                ${item.quantity > 1 ? `<span>Qty: <strong>${item.quantity}</strong></span>` : ''}
                ${item.purchasePrice ? `<span>₹<strong>${item.purchasePrice}</strong></span>` : ''}
                ${item.containerName ? `<span>In: <strong>${item.containerName}</strong></span>` : ''}
                <span>Condition: ${item.condition}</span>
            </div>

            <div class="item-card-actions">
                <button class="btn btn-secondary btn-xs btn-move-item" data-id="${item.id}" data-name="${item.name}" data-path="${item.locationPath}">
                    <span class="material-symbols-outlined" style="font-size: 16px;">drive_file_move</span> Move
                </button>
                <button class="btn btn-danger btn-xs btn-delete-item" data-id="${item.id}">
                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                </button>
            </div>
        </div>
    `;
}

function toggleBulkItem(id) {
    if (state.selectedItemIdsForBulk.has(id)) {
        state.selectedItemIdsForBulk.delete(id);
    } else {
        state.selectedItemIdsForBulk.add(id);
    }
    updateBulkMoveButton();
}

function updateBulkMoveButton() {
    const btn = document.getElementById('btn-bulk-move-trigger');
    const count = document.getElementById('bulk-selected-count');
    if (!btn || !count) return;

    if (state.selectedItemIdsForBulk.size > 0) {
        btn.style.display = 'inline-flex';
        count.textContent = state.selectedItemIdsForBulk.size;
    } else {
        btn.style.display = 'none';
    }
}

// Item Details & Movement Timeline Modal
async function showItemDetailModal(itemId) {
    const res = await apiFetch(`/items/${itemId}`);
    if (!res.success) {
        showToast('Could not load item details', 'error');
        return;
    }

    const item = res.data;
    document.getElementById('detail-modal-title').textContent = item.name;
    const content = document.getElementById('detail-modal-content');

    let historyHtml = '<p class="text-muted" style="font-size: 0.85rem;">No past location changes recorded.</p>';
    if (item.locationHistories && item.locationHistories.length > 0) {
        historyHtml = `
            <div class="movement-timeline">
                ${item.locationHistories.map(h => `
                    <div class="timeline-step">
                        <div class="timeline-title">${h.newLocationPath}</div>
                        <div class="timeline-meta">
                            ${h.reason ? `<em>"${h.reason}"</em> · ` : ''}
                            ${new Date(h.changedAt).toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    content.innerHTML = `
        <div class="item-path-box mb-3">
            <span class="material-symbols-outlined">pin_drop</span>
            <strong>${item.locationPath}</strong>
        </div>

        <div class="form-split-row">
            <div><strong>Category:</strong> ${item.categoryName}</div>
            <div><strong>Condition:</strong> ${item.condition}</div>
        </div>

        <div class="form-split-row mt-2">
            <div><strong>Quantity:</strong> ${item.quantity}</div>
            <div><strong>Purchase Price:</strong> ${item.purchasePrice ? `₹${item.purchasePrice}` : 'N/A'}</div>
        </div>

        ${item.description ? `<p class="mt-3 text-muted"><strong>Notes:</strong> ${item.description}</p>` : ''}

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 16px 0;">

        <h4 style="font-size: 0.95rem; font-weight: 800;">📍 Location Movement History</h4>
        ${historyHtml}
    `;

    document.getElementById('btn-detail-move-action').onclick = () => {
        closeModal('modal-item-detail');
        document.getElementById('move-item-id').value = item.id;
        document.getElementById('move-item-name').textContent = item.name;
        document.getElementById('move-current-path').textContent = `Current: ${item.locationPath}`;
        openModal('modal-move');
    };

    openModal('modal-item-detail');
}

// CSV Inventory Export
function exportInventoryCsv() {
    if (state.items.length === 0) {
        showToast('No items to export!', 'error');
        return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Item Name,Category,Location Breadcrumb,Quantity,Condition,Purchase Price,Brand,Serial Number\n';

    state.items.forEach(i => {
        const row = [
            `"${i.name}"`,
            `"${i.categoryName}"`,
            `"${i.locationPath}"`,
            i.quantity,
            `"${i.condition}"`,
            i.purchasePrice || 0,
            `"${i.brand || ''}"`,
            `"${i.serialNumber || ''}"`
        ].join(',');
        csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WhereIsIt_Inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory exported to CSV!', 'success');
}
