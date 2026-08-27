// ============================================================
// modules/search.js — Fast Search & Natural Query Assistant
// ============================================================

let searchDebounceTimer = null;

async function performGlobalSearch(query) {
    if (!query || query.trim().length === 0) {
        const searchResultsView = document.getElementById('view-search-results');
        if (searchResultsView) searchResultsView.style.display = 'none';
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) clearBtn.style.display = 'none';
        const activeNav = document.querySelector('.nav-btn.active');
        if (activeNav) activeNav.click();
        return;
    }

    const cleanedQuery = query.toLowerCase().trim();
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) clearBtn.style.display = 'flex';

    // Handle Natural Queries (Smart Assistant routing)
    if (cleanedQuery.includes('lent') || cleanedQuery.includes('borrowed') || cleanedQuery.includes('who has')) {
        const navLent = document.getElementById('nav-lent');
        if (navLent) navLent.click();
        return;
    }
    if (cleanedQuery.includes('trip') || cleanedQuery.includes('pack') || cleanedQuery.includes('vacation')) {
        const navTrips = document.getElementById('nav-trips');
        if (navTrips) navTrips.click();
        return;
    }
    if (cleanedQuery.includes('value') || cleanedQuery.includes('worth') || cleanedQuery.includes('insurance')) {
        const navVal = document.getElementById('nav-valuation');
        if (navVal) navVal.click();
        return;
    }
    if (cleanedQuery.includes('expir') || cleanedQuery.includes('warranty') || cleanedQuery.includes('alert')) {
        const navRem = document.getElementById('nav-reminders');
        if (navRem) navRem.click();
        return;
    }

    // Strip question words for core keyword search
    let term = cleanedQuery
        .replace(/where is my/g, '')
        .replace(/where is the/g, '')
        .replace(/where is/g, '')
        .replace(/where did i put/g, '')
        .replace(/where did i keep/g, '')
        .replace(/find my/g, '')
        .trim();

    if (!term) term = cleanedQuery;

    document.querySelectorAll('.view-panel').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const searchView = document.getElementById('view-search-results');
    if (searchView) {
        searchView.style.display = 'block';
        searchView.classList.add('active');
    }

    const feedback = document.getElementById('search-query-feedback');
    if (feedback) feedback.textContent = `Showing instant matches for "${query}"`;

    const res = await apiFetch(`/search?q=${encodeURIComponent(term)}`);
    const container = document.getElementById('search-results-container');
    if (!container) return;

    if (res.success && res.data.totalMatches > 0) {
        container.innerHTML = res.data.items.map(i => renderItemCardHtml(i, false)).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">search_off</span>
                <p>No possessions found matching "<strong>${query}</strong>". Try searching a room or container name.</p>
            </div>`;
    }
}
