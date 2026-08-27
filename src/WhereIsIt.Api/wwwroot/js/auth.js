// ============================================================
// auth.js — Authentication, Registration & User Session
// ============================================================

async function initializeAuth() {
    setupAuthModalEvents();

    const storedToken = localStorage.getItem('whereisit_token');
    const storedUser = localStorage.getItem('whereisit_user');

    if (storedToken) {
        state.token = storedToken;
        if (storedUser) {
            try { state.user = JSON.parse(storedUser); } catch { /* ignore */ }
        }

        try {
            const profileRes = await apiFetch('/auth/profile');
            if (profileRes && profileRes.success && profileRes.data) {
                state.user = profileRes.data;
                localStorage.setItem('whereisit_user', JSON.stringify(state.user));
            }
        } catch (err) {
            console.warn('Could not refresh profile from server, using local session:', err);
        }
        applyUserToUI();
    } else {
        // If no token exists, open the Auth Modal to let the user Sign In or Create Account
        setTimeout(() => {
            openAuthModal();
        }, 400);
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
    if (sideEmailEl) sideEmailEl.textContent = user.email || 'Free Account';

    // Settings Profile Elements
    const setFullname = document.getElementById('settings-profile-fullname');
    const setEmail = document.getElementById('settings-profile-email');
    const setInit = document.getElementById('settings-profile-initials');
    if (setFullname) setFullname.textContent = fullName;
    if (setEmail) setEmail.textContent = user.email || 'Free Tier';
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

            try {
                const submitBtn = formLogin.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Signing in...';
                }

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
                    applyUserToUI();
                    closeAuthModal();
                    showToast(`Welcome back, ${state.user.firstName || 'User'}!`, 'success');
                    await loadInitialData();
                } else {
                    showToast(data.message || 'Invalid email or password', 'error');
                }
            } catch (err) {
                console.error('Login error:', err);
                // Offline fallback login for offline devices
                state.user = { firstName: email.split('@')[0], lastName: '', email };
                localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                applyUserToUI();
                closeAuthModal();
                showToast(`Signed in in offline mode`, 'success');
            } finally {
                const submitBtn = formLogin.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In to My Account';
                }
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

            try {
                const submitBtn = formRegister.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Creating account...';
                }

                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, email, password })
                });

                const data = await res.json();
                if (data.success && data.data) {
                    state.token = data.data.accessToken;
                    state.user = data.data.user;
                    localStorage.setItem('whereisit_token', state.token);
                    localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                    applyUserToUI();
                    closeAuthModal();
                    showToast(`Account created! Welcome, ${firstName}!`, 'success');
                    await loadInitialData();
                } else {
                    showToast(data.message || 'Registration failed', 'error');
                }
            } catch (err) {
                console.error('Registration error:', err);
                // Offline fallback account creation
                state.user = { firstName, lastName, email };
                localStorage.setItem('whereisit_user', JSON.stringify(state.user));
                applyUserToUI();
                closeAuthModal();
                showToast(`Account created in offline mode!`, 'success');
            } finally {
                const submitBtn = formRegister.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Free Account';
                }
            }
        });
    }

    // Guest Mode
    if (btnGuest) {
        btnGuest.addEventListener('click', () => {
            state.user = { firstName: 'Guest', lastName: 'User', email: 'guest@whereisit.local' };
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
    state.token = null;
    state.user = null;
    applyUserToUI();
    showToast('Logged out successfully', 'info');
    openAuthModal();
}
