/* ============================================================
   DevVault - Settings System
   js/settings.js
   ============================================================ */

'use strict';

window.DevVaultSettings = (function () {
  const { qs, sanitize, show, hide, on, lsGet, lsSet, toggle } = window.DevVaultUtils;

  /* ─── Defaults ─── */
  const DEFAULTS = {
    theme: 'dark',
    sidebarOpen: true,
    readingWidth: 'normal',
    codeFontSize: 14,
    readingMode: false,
  };

  /* ─── Current Settings ─── */
  let settings = { ...DEFAULTS };

  /* ─── Load Settings ─── */

  function loadSettings() {
    settings.theme = lsGet('theme', 'dark');
    settings.sidebarOpen = lsGet('sidebar_open', true);
    settings.readingWidth = lsGet('reading_width', 'normal');
    settings.codeFontSize = lsGet('code_font_size', 14);
    settings.readingMode = lsGet('reading_mode', false);
    return settings;
  }

  /* ─── Apply Settings ─── */

  function applySettings(opts = {}) {
    const s = { ...settings, ...opts };

    // Theme
    applyTheme(s.theme);

    // Reading width
    applyReadingWidth(s.readingWidth);

    // Code font size
    applyCodeFontSize(s.codeFontSize);

    // Reading mode
    if (s.readingMode) {
      document.body.classList.add('reading-mode');
    } else {
      document.body.classList.remove('reading-mode');
    }
  }

  /* ─── Theme ─── */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    settings.theme = theme;
    lsSet('theme', theme);

    // Update theme toggle button icon
    const themeBtn = qs('#theme-toggle-btn');
    if (themeBtn) {
      const icon = themeBtn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
        if (window.lucide) window.lucide.createIcons({ nodes: [themeBtn] });
      }
      themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      themeBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    }
  }

  function toggleTheme() {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    window.DevVaultNotifications.info(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme applied`);
  }

  /* ─── Reading Width ─── */

  function applyReadingWidth(width) {
    settings.readingWidth = width;
    lsSet('reading_width', width);

    const maxWidths = {
      narrow: '600px',
      normal: '720px',
      wide: '960px',
      full: '100%',
    };

    document.documentElement.style.setProperty('--content-max-width', maxWidths[width] || '720px');
  }

  /* ─── Code Font Size ─── */

  function applyCodeFontSize(size) {
    settings.codeFontSize = size;
    lsSet('code_font_size', size);
    document.documentElement.style.setProperty('--code-font-size', `${size}px`);
  }

  /* ─── Reading Mode ─── */

  function toggleReadingMode() {
    settings.readingMode = !settings.readingMode;
    lsSet('reading_mode', settings.readingMode);
    document.body.classList.toggle('reading-mode', settings.readingMode);

    const readingBtn = qs('#reading-mode-btn');
    if (readingBtn) {
      readingBtn.classList.toggle('active', settings.readingMode);
      readingBtn.setAttribute('aria-label', settings.readingMode ? 'Exit reading mode' : 'Enter reading mode');
      readingBtn.setAttribute('title', settings.readingMode ? 'Exit reading mode' : 'Reading mode');
    }

    window.DevVaultNotifications.info(settings.readingMode ? 'Reading mode on' : 'Reading mode off');
  }

  /* ─── Render Settings Page ─── */

  async function renderSettingsPage(container) {
    if (!container) return;

    const isAdmin = window.DevVaultAuth?.isAdmin();
    const userEmail = window.DevVaultAuth?.getUserEmail() || 'Guest';

    container.innerHTML = `
      <div class="page-view">
        <div class="page-header">
          <h1 class="page-header-title">
            <i data-lucide="settings" style="width:28px;height:28px;margin-right:8px;vertical-align:middle;" aria-hidden="true"></i>
            Settings
          </h1>
        </div>

        ${!window.isSupabaseConfigured ? `
          <div class="alert alert-warning" style="margin-bottom:24px;">
            <i data-lucide="alert-triangle" aria-hidden="true"></i>
            <div>
              <strong>Supabase Not Configured</strong><br>
              Configure your Supabase credentials in <code>supabase.js</code> to enable full functionality.
              The app is running in demo mode with local storage.
            </div>
          </div>
        ` : `
          <div class="alert alert-success" style="margin-bottom:24px;">
            <i data-lucide="check-circle" aria-hidden="true"></i>
            Supabase is configured and connected.
          </div>
        `}

        <!-- Appearance -->
        <div class="settings-section">
          <div class="settings-section-title">Appearance</div>

          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Theme</div>
              <div class="settings-row-desc">Choose between dark and light mode</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="theme-dark-btn">
                <i data-lucide="moon" aria-hidden="true"></i> Dark
              </button>
              <button class="btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="theme-light-btn">
                <i data-lucide="sun" aria-hidden="true"></i> Light
              </button>
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Reading Width</div>
              <div class="settings-row-desc">Content column width for documentation pages</div>
            </div>
            <select class="form-select" style="width:130px;" id="settings-reading-width" aria-label="Reading width">
              <option value="narrow" ${settings.readingWidth === 'narrow' ? 'selected' : ''}>Narrow</option>
              <option value="normal" ${settings.readingWidth === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="wide" ${settings.readingWidth === 'wide' ? 'selected' : ''}>Wide</option>
              <option value="full" ${settings.readingWidth === 'full' ? 'selected' : ''}>Full</option>
            </select>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Code Font Size</div>
              <div class="settings-row-desc">Font size for code blocks (px)</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="icon-btn" id="code-font-decrease" aria-label="Decrease code font size">
                <i data-lucide="minus" aria-hidden="true"></i>
              </button>
              <span id="code-font-size-display" style="font-family:var(--font-code);min-width:30px;text-align:center;">
                ${settings.codeFontSize}px
              </span>
              <button class="icon-btn" id="code-font-increase" aria-label="Increase code font size">
                <i data-lucide="plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Reading Mode</div>
              <div class="settings-row-desc">Distraction-free reading experience</div>
            </div>
            <label class="toggle-label">
              <input type="checkbox" id="settings-reading-mode" class="toggle-input" ${settings.readingMode ? 'checked' : ''} />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>

        <!-- Account -->
        <div class="settings-section">
          <div class="settings-section-title">Account</div>

          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Status</div>
              <div class="settings-row-desc">${isAdmin ? userEmail : 'Guest user - read-only access'}</div>
            </div>
            <span class="badge ${isAdmin ? 'badge-success' : 'badge-ghost'}">${isAdmin ? 'Admin' : 'Guest'}</span>
          </div>

          ${isAdmin ? `
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Logout</div>
                <div class="settings-row-desc">End your admin session</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="settings-logout-btn">
                <i data-lucide="log-out" aria-hidden="true"></i> Logout
              </button>
            </div>
          ` : `
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Admin Access</div>
                <div class="settings-row-desc">Login to manage documentation</div>
              </div>
              <button class="btn btn-primary btn-sm" id="settings-login-btn">
                <i data-lucide="lock" aria-hidden="true"></i> Login
              </button>
            </div>
          `}
        </div>

        <!-- Data & Export (Admin only) -->
        ${isAdmin ? `
          <div class="settings-section">
            <div class="settings-section-title">Data & Export</div>

            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Export All Data</div>
                <div class="settings-row-desc">Download all pages, blocks, and snippets as JSON backup</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="settings-export-all-btn">
                <i data-lucide="download" aria-hidden="true"></i> Export JSON
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Keyboard Shortcuts -->
        <div class="settings-section">
          <div class="settings-section-title">Keyboard Shortcuts</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">
            ${[
              ['Ctrl+K', 'Command Palette'],
              ['Ctrl+F', 'Search'],
              ['Ctrl+B', 'Toggle Sidebar'],
              ['Ctrl+Shift+D', 'Dashboard'],
              ['Ctrl+Shift+C', 'Categories'],
              ['Ctrl+Shift+T', 'Trash'],
              ['Ctrl+Shift+H', 'Shortcuts Help'],
              ['Ctrl+Shift+Q', 'Reading Mode'],
              ['Ctrl+Shift+L', 'Toggle Theme'],
            ].map(([key, desc]) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--color-border-light);">
                <span style="font-size:0.875rem;color:var(--color-text-secondary);">${desc}</span>
                <kbd class="shortcut-badge">${key}</kbd>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- About -->
        <div class="settings-section">
          <div class="settings-section-title">About</div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">DevVault</div>
              <div class="settings-row-desc">Developer Knowledge Workspace</div>
            </div>
            <span class="badge badge-ghost">v1.0.0</span>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Supabase Status</div>
            </div>
            <span class="badge ${window.isSupabaseConfigured ? 'badge-success' : 'badge-warning'}">
              ${window.isSupabaseConfigured ? 'Connected' : 'Not configured'}
            </span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Bind theme buttons
    const darkBtn = qs('#theme-dark-btn', container);
    const lightBtn = qs('#theme-light-btn', container);
    if (darkBtn) {
      on(darkBtn, 'click', () => {
        applyTheme('dark');
        darkBtn.className = 'btn btn-primary btn-sm';
        if (lightBtn) lightBtn.className = 'btn btn-secondary btn-sm';
        if (window.lucide) window.lucide.createIcons({ nodes: [container] });
      });
    }
    if (lightBtn) {
      on(lightBtn, 'click', () => {
        applyTheme('light');
        lightBtn.className = 'btn btn-primary btn-sm';
        if (darkBtn) darkBtn.className = 'btn btn-secondary btn-sm';
        if (window.lucide) window.lucide.createIcons({ nodes: [container] });
      });
    }

    // Reading width
    const widthSelect = qs('#settings-reading-width', container);
    if (widthSelect) {
      on(widthSelect, 'change', (e) => {
        applyReadingWidth(e.target.value);
        window.DevVaultNotifications.success('Reading width updated');
      });
    }

    // Code font size
    const decreaseBtn = qs('#code-font-decrease', container);
    const increaseBtn = qs('#code-font-increase', container);
    const fontDisplay = qs('#code-font-size-display', container);

    if (decreaseBtn) {
      on(decreaseBtn, 'click', () => {
        const newSize = Math.max(11, settings.codeFontSize - 1);
        applyCodeFontSize(newSize);
        if (fontDisplay) fontDisplay.textContent = `${newSize}px`;
      });
    }

    if (increaseBtn) {
      on(increaseBtn, 'click', () => {
        const newSize = Math.min(20, settings.codeFontSize + 1);
        applyCodeFontSize(newSize);
        if (fontDisplay) fontDisplay.textContent = `${newSize}px`;
      });
    }

    // Reading mode toggle
    const readingToggle = qs('#settings-reading-mode', container);
    if (readingToggle) {
      on(readingToggle, 'change', (e) => {
        settings.readingMode = e.target.checked;
        lsSet('reading_mode', settings.readingMode);
        document.body.classList.toggle('reading-mode', settings.readingMode);

        const readingBtn = qs('#reading-mode-btn');
        if (readingBtn) readingBtn.classList.toggle('active', settings.readingMode);
      });
    }

    // Auth actions
    const logoutBtn = qs('#settings-logout-btn', container);
    if (logoutBtn) on(logoutBtn, 'click', () => window.DevVaultAuth.logout());

    const loginBtn = qs('#settings-login-btn', container);
    if (loginBtn) on(loginBtn, 'click', () => window.DevVaultAuth.showLoginModal());

    // Export
    const exportBtn = qs('#settings-export-all-btn', container);
    if (exportBtn) {
      on(exportBtn, 'click', () => {
        if (window.DevVaultExport) window.DevVaultExport.exportAll();
      });
    }
  }

  /* ─── Initialize ─── */

  function init() {
    loadSettings();
    applySettings();

    // Theme toggle button
    const themeBtn = qs('#theme-toggle-btn');
    if (themeBtn) on(themeBtn, 'click', toggleTheme);

    // Reading mode button
    const readingBtn = qs('#reading-mode-btn');
    if (readingBtn) {
      on(readingBtn, 'click', toggleReadingMode);
      if (settings.readingMode) readingBtn.classList.add('active');
    }
  }

  /* ─── Public API ─── */
  return {
    init,
    loadSettings,
    applySettings,
    applyTheme,
    toggleTheme,
    applyReadingWidth,
    applyCodeFontSize,
    toggleReadingMode,
    renderSettingsPage,
    get settings() { return settings; },
  };
})();
