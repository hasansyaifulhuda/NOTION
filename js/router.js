/* DEVVAULT - Hash-based SPA Router */

const Router = {
  routes: {},
  currentRoute: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  navigate(path) {
    const newHash = '#' + path;
    if (window.location.hash !== newHash) {
      window.location.hash = path;
    } else {
      this.handleRoute();
    }
  },

  handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const path = hash.replace('#', '');
    this.currentRoute = path;

    // Update sidebar active
    if (typeof Sidebar !== 'undefined') {
      Sidebar.updateActiveItem();
    }

    // Update header breadcrumb to default
    const bc = document.getElementById('header-breadcrumb');
    if (bc) bc.innerHTML = '';

    // Close sidebar on mobile
    if (Utils.isMobile() && typeof Sidebar !== 'undefined' && Sidebar.isOpen) {
      Sidebar.close();
    }

    // Route matching
    if (path === '/dashboard' || path === '/' || path === '') {
      this.renderDashboard();
    } else if (path === '/login') {
      this.renderLogin();
    } else if (path === '/snippets') {
      SnippetsPage.render();
    } else if (path === '/settings') {
      SettingsPage.render();
    } else if (path === '/trash') {
      this.renderTrash();
    } else if (path === '/pinned') {
      this.renderPinned();
    } else {
      // Try as page slug (remove leading /)
      const slug = path.replace(/^\//, '');
      if (slug) {
        Pages.openPage(slug);
      } else {
        this.renderDashboard();
      }
    }

    // Scroll to top
    const pageContent = document.querySelector('.page-content');
    if (pageContent) pageContent.scrollTop = 0;
    window.scrollTo(0, 0);
  },

  renderLogin() {
    if (Auth.isAdmin) {
      this.navigate('/dashboard');
      return;
    }

    // Login is now a transparent popup, not a full page.
    // Keep the current Devvault layout/header/sidebar visible in the background.
    const fallbackRoute = (this.currentRoute && this.currentRoute !== '/login') ? this.currentRoute : '/dashboard';
    if (window.location.hash === '#/login') {
      history.replaceState(null, '', '#/dashboard');
    }
    this.renderDashboard();
    setTimeout(() => LoginPage.showModal(), 80);
  },

  async renderDashboard() {
    // Show app chrome
    document.getElementById('sidebar')?.classList.remove('hidden');
    document.getElementById('page-tabs-bar')?.classList.remove('hidden');

    Utils.setPageTitle('Dashboard');
    Pages.currentPage = null;
    Search.setBlocks([]);
    TOC.destroy();

    const bc = document.getElementById('header-breadcrumb');
    if (bc) bc.innerHTML = `<span class="header-breadcrumb-item">Dashboard</span>`;

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `<div class="content-reading-wrapper"><div class="loading-spinner" style="margin:60px auto;"></div></div>`;

    try {
      const [pinnedPages, stats] = await Promise.all([
        SupabaseAPI.getPinnedPages(Auth.isAdmin),
        SupabaseAPI.getStats(Auth.isAdmin)
      ]);

      const recentSlugs = Utils.storage.get('recent_pages', []);
      const allPages = Sidebar.pages || [];
      const recentPages = recentSlugs
        .map(slug => allPages.find(p => p.slug === slug))
        .filter(Boolean)
        .slice(0, 6);

      const welcomeTitle = `<span>DEVVAULT</span>`;

      const subMsg = Auth.isAdmin
        ? 'Kelola dan tulis dokumentasi developer Anda.'
        : '';

      mainContent.innerHTML = `
        <div class="dashboard-view page-view">
          <div class="dashboard-welcome">
            <h1 class="dashboard-welcome-title">${welcomeTitle}</h1>
            <p class="dashboard-welcome-sub">${subMsg}</p>
          </div>

          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-card-value">${stats.pages}</div>
              <div class="stat-card-label">${Auth.isAdmin ? 'Total Halaman' : 'Halaman Publik'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.snippets}</div>
              <div class="stat-card-label">${Auth.isAdmin ? 'Total Snippet' : 'Snippet Publik'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.categories}</div>
              <div class="stat-card-label">Kategori</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${recentPages.length}</div>
              <div class="stat-card-label">Baru Dibuka</div>
            </div>
          </div>

          ${Auth.isAdmin ? `
            <div class="dashboard-section">
              <div class="dashboard-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                Aksi Cepat
              </div>
              <div class="dashboard-quick-actions">
                <div class="quick-action-card" onclick="Pages.showCreateModal()">
                  <div class="quick-action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><line x1="12" x2="12" y1="10" y2="16"/><line x1="9" x2="15" y1="13" y2="13"/></svg>
                  </div>
                  <span class="quick-action-text">Halaman Baru</span>
                </div>
                <div class="quick-action-card" onclick="App.router.navigate('/snippets')">
                  <div class="quick-action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>
                  </div>
                  <span class="quick-action-text">Kelola Snippet</span>
                </div>
                <div class="quick-action-card" onclick="App.router.navigate('/settings')">
                  <div class="quick-action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <span class="quick-action-text">Pengaturan</span>
                </div>
              </div>
            </div>
          ` : ''}

          ${pinnedPages.length > 0 ? `
            <div class="dashboard-section">
              <div class="dashboard-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 17 8 11 16 11"/></svg>
                Halaman Dipin
              </div>
              <div class="dashboard-pages-grid">
                ${pinnedPages.map(p => `
                  <div class="dashboard-page-card" onclick="App.router.navigate('/${p.slug}')">
                    <div class="dashboard-page-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/></svg>
                    </div>
                    <div class="dashboard-page-info">
                      <div class="dashboard-page-title">${Utils.escapeHtml(p.title)}</div>
                      <div class="dashboard-page-meta">${p.categories?.name || ''} · ${Utils.timeAgo(p.updated_at)}</div>
                    </div>
                    <span class="page-badge pinned" style="font-size:10px;">Dipin</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${recentPages.length > 0 ? `
            <div class="dashboard-section">
              <div class="dashboard-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Baru Dibuka
              </div>
              <div class="dashboard-pages-grid">
                ${recentPages.map(p => `
                  <div class="dashboard-page-card" onclick="App.router.navigate('/${p.slug}')">
                    <div class="dashboard-page-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/></svg>
                    </div>
                    <div class="dashboard-page-info">
                      <div class="dashboard-page-title">${Utils.escapeHtml(p.title)}</div>
                      <div class="dashboard-page-meta">${p.categories?.name || ''} · ${Utils.timeAgo(p.updated_at)}</div>
                    </div>
                    ${Auth.isAdmin && p.status === 'draft' ? `<span class="page-badge draft" style="font-size:10px;">Draft</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="dashboard-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/></svg>
              <br>Belum ada halaman yang dibuka.<br>
              <span style="font-size:12px;color:var(--text-muted);">Mulai menjelajahi dokumentasi dari sidebar.</span>
            </div>
          `}

          <div style="margin-top:3rem;display:flex;align-items:center;justify-content:center;gap:12px;">
            <span class="version-badge">DEVVAULT v1.0.0</span>
            <span style="font-size:11px;color:var(--text-muted);"></span>
          </div>
        </div>
      `;
    } catch(e) {
      mainContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Gagal memuat dashboard</div>
          <div class="empty-state-desc">${Utils.escapeHtml(e.message)}</div>
        </div>
      `;
    }
  },

  async renderTrash() {
    if (!Auth.isAdmin) { this.navigate('/dashboard'); return; }
    Utils.setPageTitle('Trash');
    Pages.currentPage = null;
    Search.setBlocks([]);
    TOC.destroy();

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `<div class="content-reading-wrapper"><div class="loading-spinner" style="margin:60px auto;"></div></div>`;

    try {
      const trashedPages = await SupabaseAPI.getTrashPages();
      mainContent.innerHTML = `
        <div class="content-reading-wrapper page-view">
          <div class="page-header">
            <div class="page-breadcrumb">
              <a href="#/dashboard" onclick="event.preventDefault(); App.router.navigate('/dashboard')">Home</a>
              <span class="page-breadcrumb-sep">/</span>
              <span>Trash</span>
            </div>
            <h1 class="page-header-title">Trash</h1>
            <p style="font-size:13.5px;color:var(--text-muted);margin-top:8px;">Halaman yang dihapus. Dapat dipulihkan atau dihapus permanen.</p>
          </div>
          ${trashedPages.length === 0 ? `
            <div class="empty-state">
              <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              <div class="empty-state-title">Trash kosong</div>
              <div class="empty-state-desc">Tidak ada halaman yang dihapus.</div>
            </div>
          ` : `
            <div class="trash-list">
              ${trashedPages.map(p => `
                <div class="trash-item">
                  <div class="trash-item-info">
                    <div class="trash-item-title">${Utils.escapeHtml(p.title)}</div>
                    <div class="trash-item-meta">
                      ${p.categories?.name ? p.categories.name + ' · ' : ''}
                      Dihapus: ${Utils.formatDate(p.deleted_at, true)}
                    </div>
                  </div>
                  <div class="trash-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="App.router.restorePage('${p.id}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      Pulihkan
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="App.router.permanentDelete('${p.id}', '${Utils.escapeHtml(p.title)}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } catch(e) {
      mainContent.innerHTML = `<div class="empty-state"><div class="empty-state-title">Gagal memuat trash</div></div>`;
    }
  },

  async restorePage(pageId) {
    if (!Auth.isAdmin) return;
    try {
      await SupabaseAPI.restorePage(pageId);
      Notifications.addToast('Halaman berhasil dipulihkan!', 'success');
      await Sidebar.refresh();
      this.renderTrash();
    } catch(e) {
      Notifications.addToast('Gagal memulihkan: ' + e.message, 'error');
    }
  },

  async permanentDelete(pageId, title) {
    if (!confirm(`Hapus permanen "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await SupabaseAPI.permanentDeletePage(pageId);
      Notifications.addToast('Halaman dihapus permanen', 'info');
      await Sidebar.refresh();
      this.renderTrash();
    } catch(e) {
      Notifications.addToast('Gagal menghapus permanen: ' + e.message, 'error');
    }
  },

  async renderPinned() {
    Utils.setPageTitle('Halaman Dipin');
    Pages.currentPage = null;
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `<div class="content-reading-wrapper"><div class="loading-spinner" style="margin:60px auto;"></div></div>`;

    try {
      const pinnedPages = await SupabaseAPI.getPinnedPages(Auth.isAdmin);
      mainContent.innerHTML = `
        <div class="content-reading-wrapper page-view">
          <div class="page-header">
            <div class="page-breadcrumb">
              <a href="#/dashboard" onclick="event.preventDefault(); App.router.navigate('/dashboard')">Home</a>
              <span class="page-breadcrumb-sep">/</span>
              <span>Halaman Dipin</span>
            </div>
            <h1 class="page-header-title">Halaman Dipin</h1>
          </div>
          ${pinnedPages.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-title">Belum ada halaman dipin</div>
              <div class="empty-state-desc">Pin halaman dari tombol "Pin" di setiap halaman.</div>
            </div>
          ` : `
            <div class="dashboard-pages-grid">
              ${pinnedPages.map(p => `
                <div class="dashboard-page-card" onclick="App.router.navigate('/${p.slug}')">
                  <div class="dashboard-page-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/></svg>
                  </div>
                  <div class="dashboard-page-info">
                    <div class="dashboard-page-title">${Utils.escapeHtml(p.title)}</div>
                    <div class="dashboard-page-meta">${p.categories?.name || ''} · ${Utils.timeAgo(p.updated_at)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } catch(e) {
      mainContent.innerHTML = `<div class="empty-state"><div class="empty-state-title">Gagal memuat</div></div>`;
    }
  }
};

window.Router = Router;
