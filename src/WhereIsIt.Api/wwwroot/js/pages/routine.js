// ============================================================
// pages/routine.js — Daily Carry (EDC) Checklist
// ============================================================

function renderRoutineView() {
    renderDashboardRoutineChips();
    renderFullRoutineGrid();
}

function renderDashboardRoutineChips() {
    const container = document.getElementById('dashboard-routine-chips');
    if (!container) return;

    container.innerHTML = state.routineItems.map(item => `
        <div class="routine-chip ${item.packed ? 'checked' : ''}" data-routine-id="${item.id}">
            <span class="material-symbols-outlined" style="font-size: 18px;">${item.packed ? 'check_circle' : (item.icon || 'inventory_2')}</span>
            <span>${item.name}</span>
            <span class="chip-loc">📍 ${item.defaultLoc}</span>
        </div>
    `).join('');

    container.querySelectorAll('.routine-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.getAttribute('data-routine-id');
            toggleRoutineItem(id);
        });
    });
}

function renderFullRoutineGrid() {
    const grid = document.getElementById('routine-full-items-grid');
    if (!grid) return;

    const total = state.routineItems.length;
    const packedCount = state.routineItems.filter(i => i.packed).length;
    const percent = total > 0 ? Math.round((packedCount / total) * 100) : 0;

    const progressFill = document.getElementById('routine-progress-fill');
    const percentText = document.getElementById('routine-percent');
    const subtitle = document.getElementById('routine-progress-subtitle');

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `${percent}%`;
    if (subtitle) subtitle.textContent = `${packedCount} of ${total} essentials packed`;

    grid.innerHTML = state.routineItems.map(item => `
        <div class="routine-item-card ${item.packed ? 'packed' : ''}" data-routine-id="${item.id}">
            <div class="routine-item-checkbox">
                <span class="material-symbols-outlined">check</span>
            </div>
            <div class="routine-item-info">
                <div class="routine-item-name">${item.name}</div>
                <div class="routine-item-loc">📍 Kept at: <strong>${item.defaultLoc}</strong></div>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.routine-item-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-routine-id');
            toggleRoutineItem(id);
        });
    });
}

function toggleRoutineItem(id) {
    const item = state.routineItems.find(i => i.id === id);
    if (item) {
        item.packed = !item.packed;
        saveRoutineState();
        renderRoutineView();
        if (item.packed) {
            showToast(`Packed "${item.name}"!`, 'success');
        }
    }
}

function saveRoutineState() {
    localStorage.setItem('whereisit_routine', JSON.stringify(state.routineItems));
}
