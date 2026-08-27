// ============================================================
// auth.js — Authentication & User Identity Management
// ============================================================

async function initializeAuth() {
    if (!state.token) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'balvinder@whereisit.local', password: 'Password123!' })
            });
            const data = await res.json();
            if (data.success) {
                state.token = data.data.accessToken;
                state.user = data.data.user;
                localStorage.setItem('whereisit_token', state.token);
            } else {
                const regRes = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName: 'Balvinder',
                        lastName: 'Singh',
                        email: 'balvinder@whereisit.local',
                        password: 'Password123!'
                    })
                });
                const regData = await regRes.json();
                if (regData.success) {
                    state.token = regData.data.accessToken;
                    state.user = regData.data.user;
                    localStorage.setItem('whereisit_token', state.token);
                }
            }
        } catch (err) {
            console.error('Auth initialization error:', err);
        }
    } else {
        try {
            const profileRes = await apiFetch('/auth/profile');
            if (profileRes.success) {
                state.user = profileRes.data;
            }
        } catch {
            localStorage.removeItem('whereisit_token');
            state.token = null;
            await initializeAuth();
        }
    }

    if (state.user) {
        const fullName = state.user.fullName || `${state.user.firstName || 'Balvinder'} ${state.user.lastName || ''}`.trim();
        const initial = (state.user.firstName || 'B')[0].toUpperCase();

        const nameEl = document.getElementById('user-display-name');
        const initEl = document.getElementById('user-avatar-initials');
        const sideNameEl = document.getElementById('sidebar-user-name');
        const sideInitEl = document.getElementById('sidebar-user-avatar');

        if (nameEl) nameEl.textContent = state.user.firstName || fullName;
        if (initEl) initEl.textContent = initial;
        if (sideNameEl) sideNameEl.textContent = fullName;
        if (sideInitEl) sideInitEl.textContent = initial;
    }
}
