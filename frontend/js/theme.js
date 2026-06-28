/* ============================================================
   theme.js  —  Light / Dark mode toggle (persists via localStorage)
   ============================================================ */

(function () {
  const STORAGE_KEY = 'wms-theme';

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Smooth transition class
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300);

    // Update all toggle buttons on the page
    document.querySelectorAll('.toggle-icon').forEach(el => {
      el.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
    document.querySelectorAll('.toggle-label').forEach(el => {
      el.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
  }

  function toggleTheme() {
    const current = getTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply saved theme immediately (before paint) to avoid flash
  applyTheme(getTheme());

  // Expose globally
  window.toggleTheme = toggleTheme;
  window.applyTheme  = applyTheme;
  window.getTheme    = getTheme;

  // Re-apply after DOM loads (updates icons/labels in case DOM wasn't ready)
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());
  });
})();
