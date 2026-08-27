// ============================================================
// pages/locations.js — Location Hierarchy & Tree Explorer
// ============================================================

function renderLocationTree() {
    const treeRoot = document.getElementById('locations-tree-root');
    if (!treeRoot) return;
    if (state.locations.length === 0) {
        treeRoot.innerHTML = '<p class="text-muted">No locations added yet.</p>';
        return;
    }

    const rootNodes = state.locations.filter(l => !l.parentLocationId);
    treeRoot.innerHTML = rootNodes.map(r => renderTreeNodeHtml(r)).join('');
}

function renderTreeNodeHtml(node) {
    const children = state.locations.filter(l => l.parentLocationId === node.id);
    return `
        <div class="tree-node">
            <div class="tree-node-item" data-location-id="${node.id}" onclick="selectLocationNode('${node.id}')">
                <span class="material-symbols-outlined">${node.icon || 'room'}</span>
                <span>${node.name}</span>
                <span class="nav-pill" style="margin-left: auto;">${node.itemsCount || 0}</span>
            </div>
            ${children.length > 0 ? `<div class="tree-children">${children.map(c => renderTreeNodeHtml(c)).join('')}</div>` : ''}
        </div>
    `;
}

function selectLocationNode(locationId) {
    state.selectedLocationId = locationId;
    document.querySelectorAll('.tree-node-item').forEach(el => {
        el.classList.toggle('selected', el.getAttribute('data-location-id') === locationId);
    });

    const location = state.locations.find(l => l.id === locationId);
    const locItems = state.items.filter(i => i.locationId === locationId);
    const locContainers = state.containers.filter(c => c.locationId === locationId);

    const detailsBox = document.getElementById('selected-location-details');
    if (!detailsBox) return;
    detailsBox.innerHTML = `
        <div class="location-detail-header">
            <h3>${location ? (location.fullPath || location.name) : 'Location'}</h3>
            <span class="text-muted">${locItems.length} items · ${locContainers.length} containers</span>
        </div>
        <div class="mt-4">
            <h4>Items Stored Here:</h4>
            ${locItems.length > 0 
                ? `<div class="item-cards-grid mt-2">${locItems.map(i => renderItemCardHtml(i, false)).join('')}</div>`
                : '<p class="text-muted mt-2">No items placed directly here yet.</p>'
            }
        </div>
    `;
}
window.selectLocationNode = selectLocationNode;
