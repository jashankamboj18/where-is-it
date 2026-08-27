// ============================================================
// pages/reminders.js — Smart Reminders & Maintenance Alerts
// ============================================================

function renderRemindersView() {
    const container = document.getElementById('reminders-table-container');
    if (!container) return;
    if (state.reminders.length === 0) {
        container.innerHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">event_available</span>
                <p>No reminders scheduled. Add warranty expirations or document renewal dates.</p>
            </div>`;
    } else {
        container.innerHTML = state.reminders.map(r => `
            <div class="item-card">
                <div class="item-card-top">
                    <div>
                        <div class="item-card-title">${r.itemName}</div>
                        <span class="nav-pill pill-warning">${formatReminderType(r.reminderType)}</span>
                    </div>
                    <span class="nav-pill">${r.daysRemaining} days remaining</span>
                </div>
                <p class="text-muted" style="font-size: 0.85rem;">Due: <strong>${new Date(r.reminderDate).toLocaleDateString()}</strong> ${r.note ? `— ${r.note}` : ''}</p>
                <div class="item-card-actions">
                    <button class="btn btn-secondary btn-xs btn-complete-reminder" data-id="${r.id}">
                        <span class="material-symbols-outlined">done</span> Mark Completed
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function formatReminderType(type) {
    switch (type) {
        case 1: return 'Warranty Expiry';
        case 2: return 'Item Expiration';
        case 3: return 'Document Renewal';
        case 4: return 'Battery Replacement';
        case 5: return 'Appliance Service';
        default: return 'Custom Alert';
    }
}
