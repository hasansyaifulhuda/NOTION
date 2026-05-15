/* DEVVAULT - Keyboard Shortcuts Module */

const Shortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      // ESC - Close modals/panels/search
      if (e.key === 'Escape') {
        if (document.getElementById('login-modal-overlay')) {
          LoginPage.closeModal();
          return;
        }
        if (document.getElementById('block-editor-overlay')) {
          document.getElementById('block-editor-overlay').remove();
          return;
        }
        if (document.querySelector('.modal-overlay')) {
          Modals.close();
          return;
        }
        if (document.querySelector('.command-palette-overlay')) {
          CommandPalette.close();
          return;
        }
        if (document.querySelector('#mobile-search-overlay')) {
          Search.closeMobileSearch();
          return;
        }
        if (document.getElementById('search-dropdown')?.classList.contains('visible')) {
          Search.clear();
          return;
        }
        if (Utils.isMobile() && Sidebar.isOpen) {
          Sidebar.close();
          return;
        }
        return;
      }

      // Skip most shortcuts when typing in inputs (except ESC)
      if (inInput) {
        // TAB inside code editor
        if (e.key === 'Tab' && target.classList.contains('code-input')) {
          e.preventDefault();
          const start = target.selectionStart;
          const end = target.selectionEnd;
          if (e.shiftKey) {
            // Outdent - remove leading spaces
            const value = target.value;
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const line = value.substring(lineStart, start);
            const trimmed = line.replace(/^  /, '');
            target.value = value.substring(0, lineStart) + trimmed + value.substring(start);
            target.selectionStart = target.selectionEnd = start - (line.length - trimmed.length);
          } else {
            target.value = target.value.substring(0, start) + '  ' + target.value.substring(end);
            target.selectionStart = target.selectionEnd = start + 2;
          }
        }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // CTRL + K - Command Palette
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        CommandPalette.toggle();
        return;
      }

      // CTRL + B - Toggle Sidebar
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        Sidebar.toggle();
        return;
      }

      // CTRL + F - Focus Search
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        if (Utils.isMobile()) {
          Search.openMobileSearch();
        } else {
          const searchInput = document.getElementById('header-search');
          if (searchInput) searchInput.focus();
        }
        return;
      }

      // CTRL + / - Show shortcuts
      if (ctrl && e.key === '/') {
        e.preventDefault();
        this.showShortcutsModal();
        return;
      }

      // CTRL + SHIFT + D - Toggle Theme
      if (ctrl && shift && e.key === 'D') {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        Utils.storage.set('theme', next);
        Notifications.addToast(`Mode ${next === 'light' ? 'terang' : 'gelap'} aktif`, 'info');
        return;
      }

      // ALT + number - Navigate categories
      if (alt && !ctrl && !shift) {
        const navMap = {
          '1': 'html',
          '2': 'css',
          '3': 'javascript',
          '4': 'snippets',
          '5': 'pinned',
          '6': 'settings'
        };
        if (navMap[e.key]) {
          e.preventDefault();
          if (e.key === '4') App.router.navigate('/snippets');
          else if (e.key === '5') App.router.navigate('/pinned');
          else if (e.key === '6') App.router.navigate('/settings');
          else App.router.navigate('/' + navMap[e.key]);
          return;
        }
      }

      // Admin-only shortcuts
      if (!Auth.isAdmin) return;

      // CTRL + N - New page
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        Pages.showCreateModal();
        return;
      }

      // CTRL + P - Pin/unpin page
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        if (Pages.currentPage) {
          Pages.togglePin(Pages.currentPage.id);
        }
        return;
      }

      // CTRL + DELETE - Delete page
      if (ctrl && e.key === 'Delete') {
        e.preventDefault();
        if (Pages.currentPage) {
          Pages.confirmDeletePage(Pages.currentPage.id);
        }
        return;
      }

      // CTRL + SHIFT + C - Add code block
      if (ctrl && shift && e.key === 'C') {
        e.preventDefault();
        if (Pages.currentPage) Blocks.addBlock('code');
        return;
      }

      // CTRL + SHIFT + T - Add text block
      if (ctrl && shift && e.key === 'T') {
        e.preventDefault();
        if (Pages.currentPage) Blocks.addBlock('text');
        return;
      }

      // CTRL + SHIFT + Q - Add quote block
      if (ctrl && shift && e.key === 'Q') {
        e.preventDefault();
        if (Pages.currentPage) Blocks.addBlock('quote');
        return;
      }

      // CTRL + SHIFT + H - Add heading block
      if (ctrl && shift && e.key === 'H') {
        e.preventDefault();
        if (Pages.currentPage) Blocks.addBlock('heading');
        return;
      }

      // CTRL + SHIFT + L - Add link block
      if (ctrl && shift && e.key === 'L') {
        e.preventDefault();
        if (Pages.currentPage) Blocks.addBlock('link');
        return;
      }
    });
  },

  showShortcutsModal() {
    const shortcuts = [
      { group: 'Umum', items: [
        { desc: 'Command Palette', keys: ['Ctrl', 'K'] },
        { desc: 'Toggle Sidebar', keys: ['Ctrl', 'B'] },
        { desc: 'Fokus Pencarian', keys: ['Ctrl', 'F'] },
        { desc: 'Tampilkan Shortcuts', keys: ['Ctrl', '/'] },
        { desc: 'Toggle Tema', keys: ['Ctrl', 'Shift', 'D'] },
        { desc: 'Tutup Modal/Pencarian', keys: ['Esc'] },
      ]},
      { group: 'Navigasi', items: [
        { desc: 'Buka HTML', keys: ['Alt', '1'] },
        { desc: 'Buka CSS', keys: ['Alt', '2'] },
        { desc: 'Buka JavaScript', keys: ['Alt', '3'] },
        { desc: 'Buka Snippets', keys: ['Alt', '4'] },
        { desc: 'Buka Pinned', keys: ['Alt', '5'] },
        { desc: 'Buka Settings', keys: ['Alt', '6'] },
      ]},
      { group: 'Pencarian', items: [
        { desc: 'Hasil Berikutnya', keys: ['Enter'] },
        { desc: 'Hasil Sebelumnya', keys: ['Shift', 'Enter'] },
      ]},
      { group: 'Admin — Halaman', items: [
        { desc: 'Halaman Baru', keys: ['Ctrl', 'N'] },
        { desc: 'Pin/Unpin Halaman', keys: ['Ctrl', 'P'] },
        { desc: 'Hapus Halaman', keys: ['Ctrl', 'Delete'] },
      ]},
      { group: 'Admin — Blok', items: [
        { desc: 'Tambah Blok Kode', keys: ['Ctrl', 'Shift', 'C'] },
        { desc: 'Tambah Blok Teks', keys: ['Ctrl', 'Shift', 'T'] },
        { desc: 'Tambah Blok Kutipan', keys: ['Ctrl', 'Shift', 'Q'] },
        { desc: 'Tambah Blok Judul', keys: ['Ctrl', 'Shift', 'H'] },
        { desc: 'Tambah Blok Tautan', keys: ['Ctrl', 'Shift', 'L'] },
      ]},
    ];

    const html = shortcuts.map(group => `
      <div>
        <div class="shortcut-group-title">${group.group}</div>
        ${group.items.map(item => `
          <div class="shortcut-item">
            <span class="shortcut-desc">${item.desc}</span>
            <div class="shortcut-keys">
              ${item.keys.map((k, i) => `
                <kbd class="kbd">${k}</kbd>
                ${i < item.keys.length - 1 ? '<span style="color:var(--text-muted);font-size:11px;">+</span>' : ''}
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');

    Modals.show({
      title: 'Keyboard Shortcuts',
      body: `<div class="shortcuts-grid">${html}</div>`,
      footer: `<button class="btn btn-secondary" onclick="Modals.close()">Tutup</button>`,
      wide: true
    });
  }
};

// Command Palette
const CommandPalette = {
  isOpen: false,
  highlightedIndex: -1,
  items: [],

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    this.isOpen = true;
    const overlay = document.createElement('div');
    overlay.className = 'command-palette-overlay';
    overlay.id = 'command-palette-overlay';
    overlay.innerHTML = `
      <div class="command-palette-container">
        <div class="command-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          <input type="text" class="command-input" id="command-input" placeholder="Ketik perintah atau nama halaman..." autocomplete="off" />
        </div>
        <div class="command-results" id="command-results"></div>
        <div class="command-footer">
          <div class="command-hint"><kbd>↑↓</kbd> Navigasi</div>
          <div class="command-hint"><kbd>Enter</kbd> Pilih</div>
          <div class="command-hint"><kbd>Esc</kbd> Tutup</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('command-input');
    input?.focus();

    this.buildItems();
    this.renderResults('');

    input?.addEventListener('input', (e) => this.renderResults(e.target.value));
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); this.moveHighlight(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); this.moveHighlight(-1); }
      if (e.key === 'Enter') { e.preventDefault(); this.selectHighlighted(); }
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  },

  buildItems() {
    this.items = [];

    // Pages
    const pages = Sidebar.pages?.filter(p => !p.deleted_at) || [];
    pages.forEach(p => {
      this.items.push({
        label: p.title,
        sub: p.categories?.name || 'Halaman',
        type: 'page',
        icon: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>`,
        action: () => App.router.navigate('/' + p.slug)
      });
    });

    // Categories
    (Sidebar.categories || []).forEach(c => {
      this.items.push({
        label: c.name,
        sub: 'Kategori',
        type: 'category',
        icon: Sidebar.getIconPath(c.icon || 'folder'),
        action: () => App.router.navigate('/' + c.slug)
      });
    });

    // Static routes
    this.items.push(
      { label: 'Dashboard', sub: 'Navigasi', type: 'route', icon: `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`, action: () => App.router.navigate('/dashboard') },
      { label: 'Snippets', sub: 'Navigasi', type: 'route', icon: `<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/>`, action: () => App.router.navigate('/snippets') },
      { label: 'Pengaturan', sub: 'Navigasi', type: 'route', icon: `<circle cx="12" cy="12" r="3"/>`, action: () => App.router.navigate('/settings') },
      { label: 'Keyboard Shortcuts', sub: 'Bantuan', type: 'action', icon: `<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>`, action: () => Shortcuts.showShortcutsModal() }
    );

    if (Auth.isAdmin) {
      this.items.push(
        { label: 'Buat Halaman Baru', sub: 'Admin', type: 'admin', icon: `<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>`, action: () => Pages.showCreateModal() },
        { label: 'Trash', sub: 'Admin', type: 'admin', icon: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>`, action: () => App.router.navigate('/trash') },
        { label: 'Tambah Snippet', sub: 'Admin', type: 'admin', icon: `<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>`, action: () => { App.router.navigate('/snippets'); setTimeout(() => SnippetsPage.showCreateModal(), 300); } }
      );
    }
  },

  renderResults(query) {
    const q = (query || '').toLowerCase().trim();
    const container = document.getElementById('command-results');
    if (!container) return;

    const filtered = q 
      ? this.items.filter(i => i.label.toLowerCase().includes(q) || i.sub?.toLowerCase().includes(q))
      : this.items;

    this.highlightedIndex = filtered.length > 0 ? 0 : -1;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Tidak ada hasil</div>`;
      return;
    }

    // Group by type
    const groups = {};
    filtered.forEach((item, idx) => {
      const group = item.type === 'page' ? 'Halaman' : item.type === 'category' ? 'Kategori' : item.type === 'admin' ? 'Admin' : item.type === 'action' ? 'Aksi' : 'Navigasi';
      if (!groups[group]) groups[group] = [];
      groups[group].push({ ...item, idx });
    });

    container.innerHTML = Object.entries(groups).map(([groupName, items]) => `
      <div class="command-group-label">${groupName}</div>
      ${items.map((item, localIdx) => `
        <div class="command-item ${item.idx === 0 && this.highlightedIndex === 0 ? 'highlighted' : ''}" 
             data-idx="${item.idx}"
             onclick="CommandPalette.executeItem(${item.idx})">
          <div class="command-item-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.icon}</svg>
          </div>
          <div>
            <div class="command-item-text">${Utils.highlightText(item.label, query)}</div>
            ${item.sub ? `<div class="command-item-sub">${item.sub}</div>` : ''}
          </div>
        </div>
      `).join('')}
    `).join('');

    this._filteredItems = filtered;
  },

  moveHighlight(dir) {
    const items = document.querySelectorAll('.command-item');
    if (!items.length) return;
    items.forEach(i => i.classList.remove('highlighted'));
    this.highlightedIndex = Math.max(0, Math.min((this.highlightedIndex + dir), items.length - 1));
    items[this.highlightedIndex]?.classList.add('highlighted');
    items[this.highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  },

  selectHighlighted() {
    const items = document.querySelectorAll('.command-item');
    const highlighted = items[this.highlightedIndex];
    if (highlighted) {
      const idx = parseInt(highlighted.dataset.idx);
      this.executeItem(idx);
    }
  },

  executeItem(idx) {
    const filteredItems = this._filteredItems || this.items;
    const item = filteredItems[idx];
    if (item?.action) {
      this.close();
      item.action();
    }
  },

  close() {
    this.isOpen = false;
    document.getElementById('command-palette-overlay')?.remove();
  }
};

window.Shortcuts = Shortcuts;
window.CommandPalette = CommandPalette;
