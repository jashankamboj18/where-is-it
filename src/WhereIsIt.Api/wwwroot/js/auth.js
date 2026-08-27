// ============================================================
// auth.js — Authentication, Permanent Session & Profile Engine
// ============================================================

async function initializeAuth() {
    setupAuthModalEvents();

    const storedToken = localStorage.getItem('whereisit_token');
    const storedUser = localStorage.getItem('whereisit_user');

    if (storedUser || storedToken) {
        state.token = storedToken || 'offline_jwt_token';
        if (storedUser) {
            try { state.user = JSON.parse(storedUser); } catch { /* ignore */ }
        }
        applyUserToUI();
        closeAuthModal();

        // Refresh user profile asynchronously in the background WITHOUT logging user out on error
        if (storedToken && storedToken !== 'offline_jwt_token' && storedToken !== 'local_session_token') {
            apiFetch('/auth/profile').then(profileRes => {
                if (profileRes && profileRes.success && profileRes.data) {
                    state.user = profileRes.data;
                    localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                    applyUserToUI();
                }
            }).catch(err => console.warn('Background profile refresh skipped:', err));
        }
    } else {
        // Only open Auth Modal if brand new first-time user
        setTimeout(() => {
            openAuthModal();
        }, 300);
    }
}

function openAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('active');
}

function applyUserToUI() {
    const user = state.user || { firstName: 'Guest', lastName: 'User', email: 'guest@whereisit.local' };
    const fullName = user.fullName || `${user.firstName || 'User'} ${user.lastName || ''}`.trim();
    const firstName = user.firstName || fullName.split(' ')[0] || 'User';
    const initial = firstName.charAt(0).toUpperCase() || 'U';

    // Header & Sidebar Elements
    const nameEl = document.getElementById('user-display-name');
    const initEl = document.getElementById('user-avatar-initials');
    const sideNameEl = document.getElementById('sidebar-user-name');
    const sideInitEl = document.getElementById('sidebar-user-avatar');
    const sideEmailEl = document.getElementById('sidebar-user-email');

    if (nameEl) nameEl.textContent = firstName;
    if (initEl) initEl.textContent = initial;
    if (sideNameEl) sideNameEl.textContent = fullName;
    if (sideInitEl) sideInitEl.textContent = initial;
    if (sideEmailEl) sideEmailEl.textContent = user.email || 'Personal Inventory';

    // Settings Profile Elements
    const setFullname = document.getElementById('settings-profile-fullname');
    const setEmail = document.getElementById('settings-profile-email');
    const setInit = document.getElementById('settings-profile-initials');
    if (setFullname) setFullname.textContent = fullName;
    if (setEmail) setEmail.textContent = user.email || 'Personal Inventory';
    if (setInit) setInit.textContent = initial;
}

function setupAuthModalEvents() {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const formLogin = document.getElementById('form-auth-login');
    const formRegister = document.getElementById('form-auth-register');
    const btnGuest = document.getElementById('btn-auth-guest');

    if (tabLogin && tabRegister && formLogin && formRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.style.display = 'block';
            formRegister.style.display = 'none';
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formLogin.style.display = 'none';
            formRegister.style.display = 'block';
        });
    }

    // Login Submission
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-login-email').value.trim();
            const password = document.getElementById('auth-login-password').value;

            if (!email || !password) {
                showToast('Please enter both email and password', 'error');
                return;
            }

            const submitBtn = formLogin.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
            }

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (data.success && data.data) {
                    state.token = data.data.accessToken;
                    state.user = data.data.user;
                    localStorage.setItem('whereisit_token', state.token);
                    localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                    localStorage.setItem('whereisit_local_creds', JSON.stringify({ email, password }));
                    applyUserToUI();
                    closeAuthModal();
                    showToast(`Welcome back, ${state.user.firstName || 'User'}!`, 'success');
                    loadInitialData();
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Sign In to My Account';
                    }
                    return;
                }
            } catch (err) {
                console.warn('Online login request error, checking stored credentials:', err);
            }

            // Local Credential Verification Fallback
            const localSaved = JSON.parse(localStorage.getItem('whereisit_user') || 'null');
            const localCreds = JSON.parse(localStorage.getItem('whereisit_local_creds') || 'null');

            if (localCreds && localCreds.email.toLowerCase() === email.toLowerCase() && localCreds.password === password) {
                state.user = localSaved || { firstName: email.split('@')[0], lastName: '', email };
                state.token = 'local_session_token';
                localStorage.setItem('whereisit_token', state.token);
                localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                applyUserToUI();
                closeAuthModal();
                showToast(`Signed in as ${state.user.firstName}!`, 'success');
                loadInitialData();
            } else if (localSaved && localSaved.email.toLowerCase() === email.toLowerCase()) {
                state.user = localSaved;
                state.token = 'local_session_token';
                localStorage.setItem('whereisit_token', state.token);
                applyUserToUI();
                closeAuthModal();
                showToast(`Signed in as ${state.user.firstName}!`, 'success');
                loadInitialData();
            } else {
                showToast('Incorrect password or account not found. Click "Create Account" tab to register!', 'error');
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In to My Account';
            }
        });
    }

    // Register Submission
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('auth-reg-firstname').value.trim();
            const lastName = document.getElementById('auth-reg-lastname').value.trim();
            const email = document.getElementById('auth-reg-email').value.trim();
            const password = document.getElementById('auth-reg-password').value;

            if (!firstName || !email || !password) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            const submitBtn = formRegister.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
            }

            // Immediately store local user & credentials for permanent offline/online persistence
            state.user = { firstName, lastName, email, fullName: `${firstName} ${lastName}`.trim() };
            state.token = 'local_session_token';
            localStorage.setItem('whereisit_user', JSON.stringify(state.user));
            localStorage.setItem('whereisit_token', state.token);
            localStorage.setItem('whereisit_local_creds', JSON.stringify({ email, password }));
            applyUserToUI();
            closeAuthModal();
            showToast(`Welcome, ${firstName}! Your account is ready.`, 'success');

            // Sync with backend API in background
            fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password })
            }).then(res => res.json()).then(data => {
                if (data.success && data.data) {
                    state.token = data.data.accessToken;
                    state.user = data.data.user;
                    localStorage.setItem('whereisit_token', state.token);
                    localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                    applyUserToUI();
                }
            }).catch(err => console.warn('Background registration sync:', err));

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Free Account';
            }

            loadInitialData();
        });
    }

    // Guest Mode
    if (btnGuest) {
        btnGuest.addEventListener('click', () => {
            state.user = { firstName: 'Guest', lastName: 'User', email: 'guest@whereisit.local' };
            state.token = 'guest_token';
            localStorage.setItem('whereisit_token', state.token);
            localStorage.setItem('whereisit_user', JSON.stringify(state.user));
            applyUserToUI();
            closeAuthModal();
            showToast('Started in Guest / Offline Mode', 'info');
            loadInitialData();
        });
    }
}

// User Logout Function
function logoutUser() {
    localStorage.removeItem('whereisit_token');
    localStorage.removeItem('whereisit_user');
    localStorage.removeItem('whereisit_local_creds');
    state.token = null;
    state.user = null;
    applyUserToUI();
    showToast('Logged out successfully', 'info');
    openAuthModal();
}
