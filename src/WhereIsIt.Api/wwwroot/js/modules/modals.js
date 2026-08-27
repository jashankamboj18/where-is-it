// ============================================================
// modules/modals.js — Modal Windows & Form Submission Handlers
// ============================================================

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        if (id === 'modal-scanner' && videoStream) {
            videoStream.getTracks().forEach(t => t.stop());
            videoStream = null;
        }
    }
}

// Live Camera QR Scanner
async function toggleCameraScanner() {
    const video = document.getElementById('qr-video');
    const btnText = document.getElementById('camera-btn-text');

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        if (video) video.srcObject = null;
        if (btnText) btnText.textContent = 'Start Camera Stream';
        return;
    }

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        if (video) {
            video.srcObject = videoStream;
            video.setAttribute('playsinline', true);
            video.play();
        }
        if (btnText) btnText.textContent = 'Stop Camera Stream';
        showToast('Camera stream active. Point at any container QR label.', 'info');
    } catch (err) {
        console.error('Camera access error:', err);
        showToast('Could not access camera. Please allow permissions or enter token below.', 'error');
    }
}

// Item Create Form
async function handleItemFormSubmit(e) {
    e.preventDefault();
    const dto = {
        name: document.getElementById('item-name').value,
        categoryId: document.getElementById('item-category').value,
        locationId: document.getElementById('item-location').value,
        containerId: document.getElementById('item-container').value || null,
        condition: document.getElementById('item-condition').value,
        brand: document.getElementById('item-brand').value || null,
        serialNumber: document.getElementById('item-serial').value || null,
        purchaseDate: document.getElementById('item-purchase-date').value || null,
        purchasePrice: parseFloat(document.getElementById('item-purchase-price').value) || null,
        quantity: parseInt(document.getElementById('item-quantity').value) || 1,
        description: document.getElementById('item-description').value || null,
        isImportant: document.getElementById('item-important').checked
    };

    const res = await apiFetch('/items', {
        method: 'POST',
        body: JSON.stringify(dto)
    });

    if (res.success) {
        showToast(`Item "${dto.name}" saved!`, 'success');
        closeModal('modal-item');
        document.getElementById('item-form').reset();
        await loadItems();
        renderDashboard();
        renderAllItemsView();
    } else {
        showToast(res.message || 'Failed to save item', 'error');
    }
}

// Lent Form
function handleLentFormSubmit(e) {
    e.preventDefault();
    const select = document.getElementById('lent-item-id');
    const itemName = select.options[select.selectedIndex]?.text || 'Item';
    const loan = {
        id: `loan_${Date.now()}`,
        itemName: itemName,
        borrowerName: document.getElementById('lent-borrower-name').value,
        borrowerPhone: document.getElementById('lent-borrower-phone').value || '',
        dateLent: document.getElementById('lent-date').value,
        dueDate: document.getElementById('lent-due-date').value || '',
        status: 'Lent Out',
        notes: document.getElementById('lent-notes').value || ''
    };

    state.lentItems.unshift(loan);
    saveLentState();
    renderLentView();
    closeModal('modal-lent');
    document.getElementById('lent-form').reset();
    showToast(`Recorded loan of "${loan.itemName}" to ${loan.borrowerName}`, 'success');
}

// Trip Form
function handleTripFormSubmit(e) {
    e.preventDefault();
    const trip = {
        id: `trip_${Date.now()}`,
        name: document.getElementById('trip-name').value,
        targetDate: document.getElementById('trip-date').value || '',
        destination: document.getElementById('trip-dest').value || '',
        items: []
    };

    state.tripManifests.unshift(trip);
    saveTripState();
    renderTripsView();
    closeModal('modal-trip');
    document.getElementById('trip-form').reset();
    showToast(`Manifest "${trip.name}" created!`, 'success');
}

// Bulk Move Form
async function handleBulkMoveFormSubmit(e) {
    e.preventDefault();
    const targetLocationId = document.getElementById('bulk-move-target-location').value;
    const reason = document.getElementById('bulk-move-reason').value;

    const dto = {
        itemIds: Array.from(state.selectedItemIdsForBulk),
        newLocationId: targetLocationId,
        reason: reason
    };

    const res = await apiFetch('/items/bulk-move', {
        method: 'POST',
        body: JSON.stringify(dto)
    });

    if (res.success) {
        showToast(`Relocated ${dto.itemIds.length} items successfully!`, 'success');
        state.selectedItemIdsForBulk.clear();
        closeModal('modal-bulk-move');
        await loadItems();
        renderDashboard();
        renderAllItemsView();
    } else {
        showToast(res.message || 'Failed to bulk relocate', 'error');
    }
}

// Move Item Form
async function handleMoveFormSubmit(e) {
    e.preventDefault();
    const itemId = document.getElementById('move-item-id').value;
    const newLocationId = document.getElementById('move-new-location').value;
    const reason = document.getElementById('move-reason').value;

    const res = await apiFetch(`/items/${itemId}/move`, {
        method: 'POST',
        body: JSON.stringify({ newLocationId, reason })
    });

    if (res.success) {
        showToast('Item moved and location history recorded!', 'success');
        closeModal('modal-move');
        await loadItems();
        renderDashboard();
        renderAllItemsView();
    } else {
        showToast(res.message || 'Failed to move item', 'error');
    }
}

// Location Create Form
async function handleLocationFormSubmit(e) {
    e.preventDefault();
    const dto = {
        placeId: document.getElementById('loc-place-id').value,
        parentLocationId: document.getElementById('loc-parent-id').value || null,
        name: document.getElementById('loc-name').value,
        icon: document.getElementById('loc-icon').value
    };

    const res = await apiFetch('/locations', {
        method: 'POST',
        body: JSON.stringify(dto)
    });

    if (res.success) {
        showToast(`Location "${dto.name}" created!`, 'success');
        closeModal('modal-location');
        document.getElementById('location-form').reset();
        await loadLocations();
        renderLocationTree();
    } else {
        showToast(res.message || 'Failed to create location', 'error');
    }
}

// Place / Premise Create Form
async function handlePlaceFormSubmit(e) {
    e.preventDefault();
    const dto = {
        name: document.getElementById('place-name').value,
        type: parseInt(document.getElementById('place-type').value),
        address: document.getElementById('place-address').value || null
    };

    const res = await apiFetch('/places', {
        method: 'POST',
        body: JSON.stringify(dto)
    });

    if (res.success) {
        showToast(`Premise "${dto.name}" created!`, 'success');
        closeModal('modal-place');
        document.getElementById('place-form').reset();
        await loadPlaces();
        updatePlaceSelector();
    } else {
        showToast(res.message || 'Failed to create premise', 'error');
    }
}

// Container Create Form
async function handleContainerFormSubmit(e) {
    e.preventDefault();
    const dto = {
        name: document.getElementById('cnt-name').value,
        type: document.getElementById('cnt-type').value,
        locationId: document.getElementById('cnt-location').value,
        qrCode: document.getElementById('cnt-code').value || null
    };

    const res = await apiFetch('/containers', {
        method: 'POST',
        body: JSON.stringify(dto)
    });

    if (res.success) {
        showToast(`Storage box "${dto.name}" created!`, 'success');
        closeModal('modal-container');
        document.getElementById('container-form').reset();
        await loadContainers();
        renderContainersView();
    } else {
        showToast(res.message || 'Failed to create box', 'error');
    }
}

// Reminder Create Form
async function handleReminderFormSubmit(e) {
    e.preventDefault();
    const dto = {
        itemId: document.getElementById('rem-item-id').value,
        reminderType: parseInt(document.getElementById('rem-type').value),
        reminderDate: new Date(document.getElementById('rem-date').value).toISOString(),
        note: document.getElementById('rem-notes').value || null
    };

    const res = await apiFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify(dto)
    });

    if (res.success) {
        showToast('Alert scheduled successfully!', 'success');
        closeModal('modal-reminder');
        document.getElementById('reminder-form').reset();
        await loadReminders();
        renderDashboard();
        renderRemindersView();
    } else {
        showToast(res.message || 'Failed to save alert', 'error');
    }
}

// QR Scanner Execution
async function handleQrScanExecution() {
    const token = document.getElementById('scanner-token-input').value.trim();
    if (!token) return;

    const res = await apiFetch(`/containers/scan/${encodeURIComponent(token)}`);
    const panel = document.getElementById('scan-result-panel');

    if (res.success) {
        panel.style.display = 'block';
        document.getElementById('scanned-container-name').textContent = `${res.data.containerName} (${res.data.containerType})`;
        document.getElementById('scanned-location-path').textContent = res.data.locationPath;

        const list = document.getElementById('scanned-items-list');
        if (res.data.items.length === 0) {
            list.innerHTML = '<li class="text-muted">No items inside this container currently.</li>';
        } else {
            list.innerHTML = res.data.items.map(i => `
                <li style="padding: 8px 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 0.86rem; font-weight: 600; display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span class="material-symbols-outlined" style="color: var(--primary); font-size: 18px;">inventory_2</span>
                    <strong>${i.name}</strong> (${i.categoryName}) — Condition: ${i.condition}
                </li>
            `).join('');
        }
    } else {
        showToast(res.message || 'QR Code invalid or expired', 'error');
        panel.style.display = 'none';
    }
}
