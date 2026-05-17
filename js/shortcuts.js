/* ============================================================
   DevVault - Keyboard Shortcuts System
   js/shortcuts.js
   ============================================================ */

'use strict';

window.DevVaultShortcuts = (function () {
  const { qs, on, sanitize, show, hide, debounce } = window.DevVaultUtils;

  /* ─── Command Palette State ─── */
  let cmdPaletteOpen = false;
  let cmdFocusIndex = -1;
  let cmdResults = [];
  let allPages = [];
  let cmdInput = null;

  /* ─── Keyboard Shortcut Handler ─── */

  function handleKeyDown(e) {
    const ctrl = e.ctrlKey || e.metaKey;

    // Ignore when typing in inputs/textareas (except specific shortcuts)
    const target = e.target;
    const isInputField = target.matches('input, textarea, select, [contenteditable]');

    // Command Palette: Ctrl+K
    if (ctrl && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
      return;
    }

    // Search: Ctrl+F
    if (ctrl && e.key === 'f') {
      e.preventDefault();
      if (window.DevVaultSearch) window.DevVaultSearch.openSearch();
      return;
    }

    // Toggle Sidebar: Ctrl+B
    if (ctrl && e.key === 'b') {
      e.preventDefault();
      if (window.DevVaultSidebar) window.DevVaultSidebar.toggleSidebar();
      return;
    }

    // Dashboard: Ctrl+Shift+D
    if (ctrl && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      window.location.hash = '#/dashboard';
      return;
    }

    // Categories: Ctrl+Shift+C
    if (ctrl && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      window.location.hash = '#/categories';
      return;
    }

    // Trash (admin): Ctrl+Shift+T
    if (ctrl && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      if (window.DevVaultAuth?.isAdmin()) window.location.hash = '#/trash';
      return;
    }

    // Shortcuts help: Ctrl+Shift+H
    if (ctrl && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      window.location.hash = '#/settings';
      return;
    }

    // Reading Mode: Ctrl+Shift+Q
    if (ctrl && e.shiftKey && e.key === 'Q') {
      e.preventDefault();
      if (window.DevVaultSettings) window.DevVaultSettings.toggleReadingMode();
      return;
    }

    // Toggle Theme: Ctrl+Shift+L
    if (ctrl && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      if (window.DevVaultSettings) window.DevVaultSettings.toggleTheme();
      return;
    }

    // Save (admin): Ctrl+S - currently prevents default browser save
    if (ctrl && e.key === 's') {
      e.preventDefault();
      if (window.DevVaultAuth?.isAdmin()) {
        window.DevVaultNotifications.info('Auto-save enabled', 'Changes are saved automatically');
      }
      return;
    }

    // Escape: close modals / command palette
    if (e.key === 'Escape') {
      if (cmdPaletteOpen) {
        closeCommandPalette();
        return;
      }
    }

    // Command palette navigation
    if (cmdPaletteOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocus(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocus(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectFocused();
      }
    }
  }

  /* ─── Command Palette ─── */

  function toggleCommandPalette() {
    if (cmdPaletteOpen) closeCommandPalette();
    else openCommandPalette();
  }

  async function openCommandPalette() {
    const overlay = qs('#cmd-palette-overlay');
    if (!overlay) return;

    cmdPaletteOpen = true;
    cmdFocusIndex = -1;

    show(overlay, 'flex');
    window.DevVaultUtils.lockScroll();

    // Focus input
    cmdInput = qs('#cmd-input');
    if (cmdInput) {
      cmdInput.value = '';
      cmdInput.focus();
    }

    // Load pages for command palette
    await loadCmdPages();
    renderCmdResults('');
  }

  function closeCommandPalette() {
    const overlay = qs('#cmd-palette-overlay');
    if (!overlay) return;

    cmdPaletteOpen = false;
    cmdFocusIndex = -1;
    hide(overlay);
    window.DevVaultUtils.unlockScroll();
  }

  async function loadCmdPages() {
    try {
      const isAdmin = window.DevVaultAuth?.isAdmin();
      const { data } = await window.DevVaultAPI.getPages(isAdmin);
      allPages = (data || []).filter(p => !p.deleted);
    } catch {
      allPages = [];
    }
  }

  function renderCmdResults(query) {
    const container = qs('#cmd-results');
    if (!container) return;

    query = (query || '').toLowerCase().trim();

    // Static commands
    const commands = [
      { type: 'nav', icon: 'layout-dashboard', label: 'Dashboard', action: () => { window.location.hash = '#/dashboard'; closeCommandPalette(); } },
      { type: 'nav', icon: 'code-2', label: 'Snippets', action: () => { window.location.hash = '#/snippets'; closeCommandPalette(); } },
      { type: 'nav', icon: 'folder', label: 'Categories', action: () => { window.location.hash = '#/categories'; closeCommandPalette(); } },
      { type: 'nav', icon: 'settings', label: 'Settings', action: () => { window.location.hash = '#/settings'; closeCommandPalette(); } },
    ];

    if (window.DevVaultAuth?.isAdmin()) {
      commands.push(
        { type: 'action', icon: 'plus', label: 'New Page', action: () => { closeCommandPalette(); window.DevVaultPages.openCreateModal(); } },
        { type: 'action', icon: 'code', label: 'New Snippet', action: () => { closeCommandPalette(); window.DevVaultSnippets.openCreateModal(); } },
        { type: 'action', icon: 'folder-plus', label: 'New Category', action: () => { closeCommandPalette(); window.DevVaultCategories.openCreateModal(); } },
        { type: 'nav', icon: 'trash-2', label: 'Trash', action: () => { window.location.hash = '#/trash'; closeCommandPalette(); } },
        { type: 'action', icon: 'download', label: 'Export All Data', action: () => { closeCommandPalette(); window.DevVaultExport?.exportAll(); } },
        { type: 'action', icon: 'log-out', label: 'Logout', action: () => { closeCommandPalette(); window.DevVaultAuth.logout(); } }
      );
    } else {
      commands.push(
        { type: 'action', icon: 'lock', label: 'Login as Admin', action: () => { closeCommandPalette(); window.DevVaultAuth.showLoginModal(); } }
      );
    }

    // Filter commands
    const filteredCmds = query
      ? commands.filter(c => c.label.toLowerCase().includes(query))
      : commands;

    // Filter pages
    const filteredPages = query
      ? allPages.filter(p => p.title.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query))
      : allPages.slice(0, 6);

    // Build results
    cmdResults = [];
    let html = '';

    if (filteredCmds.length > 0) {
      html += `<div class="cmd-result-category">Commands</div>`;
      filteredCmds.forEach((cmd, i) => {
        const idx = cmdResults.length;
        cmdResults.push({ ...cmd });
        html += `
          <div class="cmd-result-item ${idx === cmdFocusIndex ? 'focused' : ''}"
            data-cmd-index="${idx}"
            role="option"
            aria-selected="${idx === cmdFocusIndex}"
            tabindex="-1">
            <i data-lucide="${cmd.icon}" aria-hidden="true"></i>
            <span>${sanitize(cmd.label)}</span>
            <span style="margin-left:auto;font-size:0.7rem;color:var(--color-text-muted);">
              ${cmd.type === 'nav' ? 'Navigate' : 'Action'}
            </span>
          </div>
        `;
      });
    }

    if (filteredPages.length > 0) {
      html += `<div class="cmd-result-category">Pages</div>`;
      filteredPages.forEach((page) => {
        const idx = cmdResults.length;
        cmdResults.push({
          type: 'page',
          icon: 'file-text',
          label: page.title,
          action: () => {
            window.location.hash = `#/${page.id}`;
            closeCommandPalette();
          },
        });
        html += `
          <div class="cmd-result-item ${idx === cmdFocusIndex ? 'focused' : ''}"
            data-cmd-index="${idx}"
            role="option"
            aria-selected="${idx === cmdFocusIndex}"
            tabindex="-1">
            <i data-lucide="file-text" aria-hidden="true"></i>
            <span>${sanitize(page.title)}</span>
            ${page.categories ? `<span style="font-size:0.7rem;color:var(--color-text-muted);margin-left:auto;">${sanitize(page.categories.name || '')}</span>` : ''}
          </div>
        `;
      });
    }

    if (cmdResults.length === 0) {
      html = `<div class="cmd-empty">No results for "${sanitize(query)}"</div>`;
    }

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Bind click
    container.querySelectorAll('.cmd-result-item').forEach(item => {
      on(item, 'click', () => {
        const idx = parseInt(item.dataset.cmdIndex, 10);
        if (cmdResults[idx]) {
          try { cmdResults[idx].action(); } catch {}
        }
      });

      on(item, 'mouseenter', () => {
        cmdFocusIndex = parseInt(item.dataset.cmdIndex, 10);
        updateFocusState(container);
      });
    });
  }

  function moveFocus(direction) {
    const container = qs('#cmd-results');
    if (!container || cmdResults.length === 0) return;

    cmdFocusIndex += direction;
    if (cmdFocusIndex < 0) cmdFocusIndex = cmdResults.length - 1;
    if (cmdFocusIndex >= cmdResults.length) cmdFocusIndex = 0;

    updateFocusState(container);

    // Scroll into view
    const focused = container.querySelector(`[data-cmd-index="${cmdFocusIndex}"]`);
    if (focused) focused.scrollIntoView({ block: 'nearest' });
  }

  function updateFocusState(container) {
    container.querySelectorAll('.cmd-result-item').forEach(item => {
      const idx = parseInt(item.dataset.cmdIndex, 10);
      item.classList.toggle('focused', idx === cmdFocusIndex);
      item.setAttribute('aria-selected', idx === cmdFocusIndex);
    });
  }

  function selectFocused() {
    if (cmdFocusIndex >= 0 && cmdResults[cmdFocusIndex]) {
      try { cmdResults[cmdFocusIndex].action(); } catch {}
    }
  }

  /* ─── Initialize ─── */

  const debouncedCmdSearch = debounce((query) => {
    renderCmdResults(query);
  }, 150);

  function init() {
    // Global keydown listener
    on(document, 'keydown', handleKeyDown);

    // Command palette button
    const cmdBtn = qs('#cmd-palette-btn');
    if (cmdBtn) on(cmdBtn, 'click', () => toggleCommandPalette());

    // Command palette input
    const cmdInputEl = qs('#cmd-input');
    if (cmdInputEl) {
      on(cmdInputEl, 'input', (e) => debouncedCmdSearch(e.target.value));
    }

    // Close command palette on overlay click
    const cmdOverlay = qs('#cmd-palette-overlay');
    if (cmdOverlay) {
      on(cmdOverlay, 'click', (e) => {
        if (e.target === cmdOverlay) closeCommandPalette();
      });
    }

    // Close command palette buttons
    document.querySelectorAll('[data-modal="cmd-palette-overlay"].modal-close').forEach(btn => {
      on(btn, 'click', closeCommandPalette);
    });
  }

  /* ─── Public API ─── */
  return {
    init,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    get isPaletteOpen() { return cmdPaletteOpen; },
  };
})();
