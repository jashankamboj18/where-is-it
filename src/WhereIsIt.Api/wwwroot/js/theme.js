// ============================================================
// theme.js — Dark/Light Mode
// ============================================================

// Theme Management
function applyTheme(themeName) {
    state.theme = themeName;
    localStorage.setItem('whereisit_theme', themeName);
    document.body.className = `${themeName}-theme`;

    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (themeName === 'light') {
        if (icon) icon.textContent = 'dark_mode';
        if (label) label.textContent = 'Dark';
    } else {
        if (icon) icon.textContent = 'light_mode';
        if (label) label.textContent = 'Light';
    }
}

function toggleTheme() {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
    showToast(`Switched to ${state.theme === 'light' ? 'Light' : 'Dark'} Mode`, 'info');
}
