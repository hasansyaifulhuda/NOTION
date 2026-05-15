/* DEVVAULT - Sidebar Module */

const Sidebar = {
  isOpen: true,
  categories: [],
  pages: [],

  async init() {
    this.isOpen = Utils.storage.get('sidebar_open', !Utils.isMobile());
    await this.loadData();
    this.render();
    this.bindEvents();
    this.applySidebarState();
  },

  async loadData() {
    try {
      this.categories = await SupabaseAPI.getCategories();
      this.pages = await SupabaseAPI.getPages(Auth.isAdmin);
    } catch(e) {
      console.warn('Sidebar data error:', e);
      this.categories = [];
      this.pages = [];
    }
  },

  async refresh() {
    await this.loadData();
    this.renderNavItems();
  },

  render() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <a href="#/dashboard" class="devvault-logo" onclick="App.router.navigate('/dashboard')">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span class="logo-text">DEV<span>VAULT</span></span>
        </a>
        <button class="sidebar-close-btn" id="sidebar-close-btn" title="Tutup Sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <div class="sidebar-search">
        <div class="sidebar-search-input" id="sidebar-search-trigger" title="Cari (Ctrl+F)">
          <div class="sidebar-search-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <span class="sidebar-search-text">Cari halaman...</span>
            <span class="sidebar-search-kbd">Ctrl+F</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        <div id="sidebar-nav-items"></div>
      </nav>

      <div class="sidebar-footer">
        <div id="sidebar-admin-items"></div>
      </div>
    `;

    this.renderNavItems();
  },

  renderNavItems() {
    const navEl = document.getElementById('sidebar-nav-items');
    const footerEl = document.getElementById('sidebar-admin-items');
    if (!navEl) return;

    const pinnedPages = this.pages.filter(p => p.is_pinned && !p.deleted_at);
    const recentSlugs = Utils.storage.get('recent_pages', []);
    const recentPages = recentSlugs
      .map(slug => this.pages.find(p => p.slug === slug))
      .filter(Boolean)
      .slice(0, 5);

    let html = '';

    // Dashboard
    html += `
      <a class="sidebar-item" href="#/dashboard" onclick="event.preventDefault(); App.router.navigate('/dashboard')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span class="sidebar-item-text">Dashboard</span>
      </a>
    `;

    // Pinned pages
    if (pinnedPages.length > 0) {
      html += `<div class="sidebar-section-label">Dipin</div>`;
      pinnedPages.forEach(page => {
        html += `
          <a class="sidebar-page-item sidebar-item" href="#/${page.slug}" onclick="event.preventDefault(); App.router.navigate('/${page.slug}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 17 8 11 16 11"/></svg>
            <span class="sidebar-page-item-text">${Utils.escapeHtml(page.title)}</span>
            <svg class="sidebar-page-pin" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 17 8 11 16 11"/></svg>
          </a>
        `;
      });
    }

    // Categories with pages
    if (this.categories.length > 0) {
      html += `<div class="sidebar-section-label">Kategori</div>`;
      this.categories.forEach(cat => {
        const catPages = this.pages.filter(p => p.category_id === cat.id && !p.deleted_at);
        const iconName = cat.icon || Utils.getCategoryIcon(cat.slug);
        const savedState = Utils.storage.get(`cat_open_${cat.id}`, true);
        const isOpen = savedState !== false;
        
        html += `
          <div class="sidebar-category ${isOpen ? 'open' : ''}" id="cat-${cat.id}">
            <div class="sidebar-category-header" onclick="Sidebar.toggleCategory('${cat.id}')">
              <svg class="sidebar-category-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${this.getIconPath(iconName)}</svg>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(cat.name)}</span>
              <span class="sidebar-item-badge">${catPages.length}</span>
              <svg class="sidebar-category-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div class="sidebar-category-pages">
              ${catPages.length === 0 
                ? `<div style="padding:6px 16px 6px 36px;font-size:12px;color:var(--text-muted);font-style:italic;">Belum ada halaman</div>` 
                : catPages.map(page => `
                  <a class="sidebar-page-item" href="#/${page.slug}" onclick="event.preventDefault(); App.router.navigate('/${page.slug}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span class="sidebar-page-item-text">${Utils.escapeHtml(page.title)}</span>
                    ${page.is_pinned ? `<svg class="sidebar-page-pin" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 17 8 11 16 11"/></svg>` : ''}
                    ${Auth.isAdmin && page.status === 'draft' ? `<span style="font-size:9px;color:var(--warning);margin-left:4px;">DRAFT</span>` : ''}
                  </a>
                `).join('')}
              ${Auth.isAdmin ? `
                <div style="padding:4px 16px 4px 36px;">
                  <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 8px;" onclick="Pages.showCreateModal('${cat.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    Tambah Halaman
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
    }

    // Snippets
    html += `
      <div class="sidebar-section-label">Library</div>
      <a class="sidebar-item" href="#/snippets" onclick="event.preventDefault(); App.router.navigate('/snippets')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>
        <span class="sidebar-item-text">Snippets</span>
      </a>
    `;

    navEl.innerHTML = html;

    // Footer items
    let footerHtml = '';
    if (Auth.isAdmin) {
      footerHtml += `
        <a class="sidebar-item" href="#/trash" onclick="event.preventDefault(); App.router.navigate('/trash')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          <span class="sidebar-item-text">Trash</span>
        </a>
      `;
    }
    footerHtml += `
      <a class="sidebar-item" href="#/settings" onclick="event.preventDefault(); App.router.navigate('/settings')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        <span class="sidebar-item-text">Pengaturan</span>
      </a>
    `;
    if (footerEl) footerEl.innerHTML = footerHtml;

    this.updateActiveItem();
  },

  getIconPath(name) {
    const paths = {
      'code-2': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      'palette': '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
      'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
      'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
      'github': '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
      'scissors': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.47" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/>',
      'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'
    };
    return paths[name] || paths['folder'];
  },

  toggleCategory(catId) {
    const el = document.getElementById(`cat-${catId}`);
    if (!el) return;
    el.classList.toggle('open');
    Utils.storage.set(`cat_open_${catId}`, el.classList.contains('open'));
  },

  toggle() {
    this.isOpen = !this.isOpen;
    this.applySidebarState();
    Utils.storage.set('sidebar_open', this.isOpen);
  },

  open() {
    this.isOpen = true;
    this.applySidebarState();
    Utils.storage.set('sidebar_open', true);
  },

  close() {
    this.isOpen = false;
    this.applySidebarState();
    Utils.storage.set('sidebar_open', false);
  },

  applySidebarState() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!sidebar) return;

    if (Utils.isMobile()) {
      sidebar.classList.toggle('sidebar-open', this.isOpen);
      if (overlay) overlay.classList.toggle('active', this.isOpen);
    } else {
      sidebar.classList.toggle('sidebar-collapsed', !this.isOpen);
      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        mainWrapper.style.marginLeft = '';
      }
    }
  },

  updateActiveItem() {
    const route = Utils.getHashRoute();
    // Remove all active classes
    document.querySelectorAll('.sidebar-item.active, .sidebar-page-item.active').forEach(el => {
      el.classList.remove('active');
    });

    // Find matching item
    const allLinks = document.querySelectorAll('.sidebar-item, .sidebar-page-item');
    allLinks.forEach(el => {
      const href = el.getAttribute('href');
      if (href && href.replace('#', '') === route) {
        el.classList.add('active');
        // Expand parent category
        const catContainer = el.closest('.sidebar-category');
        if (catContainer) {
          catContainer.classList.add('open');
        }
      }
    });
  },

  bindEvents() {
    // Close button
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#sidebar-close-btn');
      if (closeBtn) this.close();

      // Outside click on tablet
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay && e.target === overlay) this.close();
    });

    // Search trigger
    document.addEventListener('click', (e) => {
      if (e.target.closest('#sidebar-search-trigger')) {
        const searchInput = document.getElementById('header-search');
        if (searchInput) {
          searchInput.focus();
          if (Utils.isMobile()) {
            Search.openMobileSearch();
          }
        }
      }
    });
  }
};

window.Sidebar = Sidebar;
