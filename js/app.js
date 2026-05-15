/* DEVVAULT - Main Application Bootstrap */

// Modal helper
const Modals = {
  show({ title, body, footer, wide = false }) {
    this.close();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'global-modal-overlay';
    overlay.innerHTML = `
      <div class="modal-container" style="${wide ? 'max-width:700px;' : ''}">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close-btn" onclick="Modals.close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  },

  close() {
    document.getElementById('global-modal-overlay')?.remove();
  }
};

const App = {
  router: null,

  async init() {
    // Apply saved theme
    const theme = Utils.storage.get('theme', 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    // Apply saved reading width
    const readingWidth = Utils.storage.get('reading_width', '900px');
    document.documentElement.style.setProperty('--reading-width', readingWidth);

    // Apply saved code font size
    const codeFontSize = Utils.storage.get('code_font_size', '13.5px');
    document.documentElement.style.setProperty('--code-font-size', codeFontSize);

    // Init notifications/toast
    Notifications.init();

    try {
      // Init auth (wait for session check)
      await Auth.init();

      // Load sidebar data
      await Sidebar.init();

      // Render full app layout
      this.renderAppLayout();

      // Init modules
      Search.init();
      Shortcuts.init();
      this.initMobileBar();
      this.initReadingProgress();

      // Init notifications for admin
      if (Auth.isAdmin) {
        await Notifications.loadNotifications();
      }

      // Listen for auth changes
      Auth.onAuthChange(async (event, data) => {
        if (event === 'signin') {
          this.updateHeaderForAuth();
          await Sidebar.refresh();
          await Notifications.loadNotifications();
        } else if (event === 'signout') {
          this.updateHeaderForAuth();
          await Sidebar.refresh();
          App.router.navigate('/dashboard');
        }
      });

      // Init router LAST (after all modules ready)
      this.router = Router;
      Router.init();

      // Hide loading screen
      await Utils.wait(300);
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.remove(), 500);
      }

    } catch(e) {
      console.error('App init error:', e);
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.innerHTML = `
          <div style="text-align:center;padding:40px;max-width:400px;">
            <div style="color:var(--error);font-size:16px;margin-bottom:12px;">Gagal memuat aplikasi</div>
            <div style="color:var(--text-muted);font-size:13px;margin-bottom:20px;">${Utils.escapeHtml(e.message)}</div>
            <div style="color:var(--text-muted);font-size:12px;background:var(--bg-card);padding:12px;border-radius:8px;text-align:left;">
              <strong>Pastikan:</strong><br>
              1. File <code>supabase.js</code> sudah dikonfigurasi dengan URL dan anon key yang benar<br>
              2. Koneksi internet tersedia<br>
              3. Project Supabase aktif
            </div>
            <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;background:var(--accent);color:#0b1120;border:none;border-radius:6px;cursor:pointer;font-weight:600;">
              Muat Ulang
            </button>
          </div>
        `;
      }
    }
  },

  renderAppLayout() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <!-- Sidebar Overlay (mobile) -->
      <div id="sidebar-overlay" class="sidebar-overlay"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="sidebar"></aside>

      <!-- Main Wrapper -->
      <div class="main-wrapper">
        <!-- Header -->
        <header class="app-header" id="app-header">
          <button class="toggle-sidebar-btn" id="toggle-sidebar-btn" onclick="Sidebar.toggle()" title="Toggle Sidebar (Ctrl+B)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
          </button>

          <!-- Breadcrumb (desktop) -->
          <div id="header-breadcrumb" class="header-breadcrumb" style="display:none;"></div>

          <!-- Search -->
          <div class="header-search-container" id="header-search-container">
            <svg class="header-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input type="text" id="header-search" class="header-search-input" placeholder="Cari di halaman ini... (Ctrl+F)" autocomplete="off" />
            <div id="search-dropdown" class="search-dropdown"></div>
          </div>

          <!-- Header Right -->
          <div class="header-right" id="header-right">
            <!-- Mobile search button -->
            <button class="search-mobile-btn" id="mobile-search-btn" onclick="Search.openMobileSearch()" title="Cari">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            </button>

            <!-- Command palette -->
            <button class="header-btn" onclick="CommandPalette.toggle()" title="Command Palette (Ctrl+K)">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
            </button>

            <!-- Admin: Notification bell (populated by auth change) -->
            <div id="notif-btn-container"></div>

            <!-- Admin badge or login button (populated by auth change) -->
            <div id="auth-status-container"></div>
          </div>
        </header>

        <!-- Page Tabs -->
        <div class="page-tabs-bar" id="page-tabs-bar"></div>

        <!-- Main Content Area -->
        <div class="main-content-area">
          <main class="page-content" id="main-content-wrapper">
            <div id="main-content" style="min-height:100%;"></div>
          </main>

          <!-- Table of Contents -->
          <aside class="toc-panel" id="toc-panel">
            <div class="toc-title">Daftar Isi</div>
            <ul class="toc-list" id="toc-list"></ul>
          </aside>
        </div>

        <!-- Mobile Bottom Bar -->
        <nav class="mobile-bottom-bar" id="mobile-bottom-bar">
          <button class="mobile-bar-btn" onclick="Sidebar.toggle()" title="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            <span class="mobile-bar-label">Menu</span>
          </button>
          <button class="mobile-bar-btn" onclick="Search.openMobileSearch()" title="Cari">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <span class="mobile-bar-label">Cari</span>
          </button>
          <button class="mobile-bar-btn" onclick="App.router.navigate('/dashboard')" title="Home">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="mobile-bar-label">Home</span>
          </button>
          <button class="mobile-bar-btn" onclick="App.router.navigate('/settings')" title="Pengaturan">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span class="mobile-bar-label">Pengaturan</span>
          </button>
        </nav>
      </div>

      <!-- Toast Container -->
      <div id="toast-container" class="toast-container"></div>

      <!-- Reading Progress -->
      <div class="reading-progress-bar">
        <div class="reading-progress-fill" id="reading-progress-fill"></div>
      </div>
    `;

    // Render sidebar
    Sidebar.render();
    this.updateHeaderForAuth();

    // Show page content wrapper correctly
    const mainContentWrapper = document.getElementById('main-content-wrapper');
    if (mainContentWrapper) {
      mainContentWrapper.addEventListener('scroll', () => {
        const fill = document.getElementById('reading-progress-fill');
        if (fill) {
          const scrollTop = mainContentWrapper.scrollTop;
          const scrollHeight = mainContentWrapper.scrollHeight - mainContentWrapper.clientHeight;
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          fill.style.width = Math.min(100, progress) + '%';
        }
      }, { passive: true });
    }
  },

  updateHeaderForAuth() {
    const notifContainer = document.getElementById('notif-btn-container');
    const authContainer = document.getElementById('auth-status-container');

    if (!notifContainer || !authContainer) return;

    if (Auth.isAdmin) {
      // Notification bell stays in the top-right header only.
      notifContainer.innerHTML = `
        <div class="header-notification-wrapper">
          <button class="header-btn" onclick="Notifications.togglePanel()" title="Notifikasi" id="notif-bell-btn" aria-label="Buka notifikasi admin">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <div class="header-btn-badge" id="notif-badge" style="display:none;"></div>
          </button>
          <div class="notification-panel" id="notification-panel">
            <div class="notification-panel-header">
              <span class="notification-panel-title">Notifikasi</span>
              <button class="notification-mark-read-btn" onclick="Notifications.markAllRead()">Tandai dibaca</button>
            </div>
            <div class="notification-list"></div>
          </div>
        </div>
      `;

      authContainer.innerHTML = `
        <div class="account-menu-wrapper">
          <button class="account-menu-trigger" id="account-menu-trigger" onclick="App.toggleAccountMenu(event)" title="Menu akun admin" aria-label="Menu akun admin" aria-expanded="false">
            <span class="account-role-badge admin" title="Mode Admin aktif">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin
            </span>
            <span class="account-avatar">${this.getAccountInitial()}</span>
            <svg class="account-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="account-dropdown" id="account-dropdown">
            <div class="account-dropdown-header">
              <div class="account-dropdown-avatar">${this.getAccountInitial()}</div>
              <div class="account-dropdown-meta">
                <div class="account-dropdown-title">Mode Admin</div>
                <div class="account-dropdown-email">${Utils.escapeHtml(Auth.currentUser?.email || 'Admin')}</div>
              </div>
            </div>
            <button class="account-dropdown-item" onclick="App.closeAccountMenu(); App.router.navigate('/settings')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Pengaturan
            </button>
            <button class="account-dropdown-item danger" onclick="App.handleLogout()">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      `;
    } else {
      notifContainer.innerHTML = '';
      authContainer.innerHTML = `
        <div class="account-menu-wrapper">
          <button class="account-menu-trigger" id="account-menu-trigger" onclick="App.toggleAccountMenu(event)" title="Menu akun guest" aria-label="Menu akun guest" aria-expanded="false">
            <span class="account-role-badge guest">Guest</span>
            <span class="account-avatar guest">G</span>
            <svg class="account-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="account-dropdown" id="account-dropdown">
            <div class="account-dropdown-header">
              <div class="account-dropdown-avatar guest">G</div>
              <div class="account-dropdown-meta">
                <div class="account-dropdown-title">Mode Guest</div>
                <div class="account-dropdown-email">Read-only access</div>
              </div>
            </div>
            <button class="account-dropdown-item" onclick="App.closeAccountMenu(); App.router.navigate('/settings')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Pengaturan
            </button>
            <button class="account-dropdown-item primary" onclick="App.closeAccountMenu(); LoginPage.showModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              Login Admin
            </button>
          </div>
        </div>
      `;
    }

    if (!this._accountOutsideListenerBound) {
      document.addEventListener('click', (e) => {
        const accountWrapper = document.querySelector('.account-menu-wrapper');
        const notificationWrapper = document.querySelector('.header-notification-wrapper');
        const panel = document.getElementById('notification-panel');

        if (accountWrapper && !accountWrapper.contains(e.target)) {
          this.closeAccountMenu();
        }

        if (panel && notificationWrapper && !notificationWrapper.contains(e.target)) {
          panel.classList.remove('visible');
        }
      });
      this._accountOutsideListenerBound = true;
    }
  },

  getAccountInitial() {
    const email = Auth.currentUser?.email || 'A';
    return email.trim().charAt(0).toUpperCase();
  },

  toggleAccountMenu(event) {
    event?.stopPropagation();
    const dropdown = document.getElementById('account-dropdown');
    const trigger = document.getElementById('account-menu-trigger');
    if (!dropdown || !trigger) return;
    const willOpen = !dropdown.classList.contains('visible');
    dropdown.classList.toggle('visible', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  },

  closeAccountMenu() {
    const dropdown = document.getElementById('account-dropdown');
    const trigger = document.getElementById('account-menu-trigger');
    dropdown?.classList.remove('visible');
    trigger?.setAttribute('aria-expanded', 'false');
  },

  async handleLogout() {
    this.closeAccountMenu();
    const result = await Auth.logout();
    if (result?.success) {
      Notifications.addToast('Logout berhasil.', 'success');
    }
    App.router.navigate('/dashboard');
  },

  initMobileBar() {
    // The mobile bottom bar is already in the HTML
    // Update active state based on route
    window.addEventListener('hashchange', () => this.updateMobileBarActive());
    this.updateMobileBarActive();
  },

  updateMobileBarActive() {
    const hash = window.location.hash || '#/dashboard';
    const btns = document.querySelectorAll('.mobile-bar-btn');
    btns.forEach(btn => btn.classList.remove('active'));
  },

  initReadingProgress() {
    // Progress bar managed by page-content scroll
  }
};

// Override Router to attach to App
Object.assign(App, {
  get router() { return Router; }
});

window.App = App;
window.Modals = Modals;

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});


/* Additional global helpers moved from index.html */

    // Additional global helpers
    // Expose router's page actions for inline onclick
    document.addEventListener('DOMContentLoaded', () => {
      // Ensure App.router works as expected
      if (typeof App !== 'undefined' && typeof Router !== 'undefined') {
        // Patch router restorePage and permanentDelete into App.router
        App.router.restorePage = Router.restorePage.bind(Router);
        App.router.permanentDelete = Router.permanentDelete.bind(Router);
      }
    });

    // Prevent default anchor behavior for hash navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#/"]');
      if (link) {
        e.preventDefault();
        const path = link.getAttribute('href').replace('#', '');
        if (typeof App !== 'undefined' && App.router) {
          App.router.navigate(path);
        }
      }
    });

