// ============================================================
// pages/lent.js — Lent & Borrowed Items Tracker
// ============================================================

function renderLentView() {
    const container = document.getElementById('lent-items-container');
    const badge = document.getElementById('badge-lent-count');
    const activeLoans = state.lentItems.filter(l => l.status === 'Lent Out');
    if (badge) badge.textContent = activeLoans.length;

    if (!container) return;
    if (state.lentItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">handshake</span>
                <p>No active item loans. Click "+ Record Loaned Item" when you lend your tools, books, or gadgets!</p>
            </div>`;
    } else {
        container.innerHTML = state.lentItems.map(l => `
            <div class="item-card">
                <div class="item-card-top">
                    <div>
                        <div class="item-card-title">${l.itemName}</div>
                        <span class="lent-badge-status ${l.status === 'Lent Out' ? 'lent-active' : 'lent-returned'}">${l.status}</span>
                    </div>
                    <span class="text-muted" style="font-size: 0.8rem;">Lent: ${l.dateLent}</span>
                </div>
                <div class="item-path-box">
                    <span class="material-symbols-outlined">person</span>
                    <span>Borrower: <strong>${l.borrowerName}</strong> ${l.borrowerPhone ? `(${l.borrowerPhone})` : ''}</span>
                </div>
                <div class="item-details-row">
                    ${l.dueDate ? `<span>Due Back: <strong>${l.dueDate}</strong></span>` : ''}
                    ${l.notes ? `<span>Notes: ${l.notes}</span>` : ''}
                </div>
                <div class="item-card-actions">
                    ${l.status === 'Lent Out' ? `
                        <button class="btn btn-secondary btn-xs btn-return-lent" data-id="${l.id}">
                            <span class="material-symbols-outlined">assignment_turned_in</span> Mark Returned
                        </button>
                    ` : '<span class="text-muted" style="font-size: 0.78rem;">✓ Returned to Shelf</span>'}
                </div>
            </div>
        `).join('');
    }
}

function saveLentState() {
    localStorage.setItem('whereisit_lent', JSON.stringify(state.lentItems));
}
