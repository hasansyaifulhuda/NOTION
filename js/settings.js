/* DEVVAULT - Settings Page Module */

const SettingsPage = {
  activeSection: 'penampilan',

  async render() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    Utils.setPageTitle('Pengaturan');

    const isConnected = await this.checkConnection();

    mainContent.innerHTML = `
      <div class="content-reading-wrapper page-view">
        <div class="page-header">
          <div class="page-breadcrumb">
            <a href="#/dashboard" onclick="event.preventDefault(); App.router.navigate('/dashboard')">Home</a>
            <span class="page-breadcrumb-sep">/</span>
            <span>Pengaturan</span>
          </div>
          <h1 class="page-header-title">Pengaturan</h1>
        </div>

        <div class="settings-layout">
          <nav class="settings-nav">
            <div class="settings-nav-item active" onclick="SettingsPage.switchSection('penampilan', this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              Penampilan
            </div>
            <div class="settings-nav-item" onclick="SettingsPage.switchSection('editor', this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Editor
            </div>
            <div class="settings-nav-item" onclick="SettingsPage.switchSection('sidebar', this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
              Sidebar
            </div>
            ${Auth.isAdmin ? `
              <div class="settings-nav-item" onclick="SettingsPage.switchSection('supabase', this)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                Supabase
              </div>
              <div class="settings-nav-item" onclick="SettingsPage.switchSection('akun', this)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Akun
              </div>
              <div class="settings-nav-item" onclick="SettingsPage.switchSection('kategori', this)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                Kategori
              </div>
            ` : ''}
          </nav>

          <div class="settings-content">
            <!-- PENAMPILAN -->
            <div class="settings-section active" id="section-penampilan">
              <div class="settings-section-title">Penampilan</div>
              <div class="settings-card">
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Tema</div>
                    <div class="settings-row-desc">Pilih antara mode gelap dan mode terang</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" class="toggle-switch-input" id="theme-toggle" ${document.documentElement.getAttribute('data-theme') === 'light' ? 'checked' : ''} onchange="SettingsPage.toggleTheme(this.checked)">
                    <div class="toggle-switch-track">
                      <div class="toggle-switch-thumb"></div>
                    </div>
                    <span class="toggle-switch-label">Mode Terang</span>
                  </label>
                </div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Lebar Bacaan</div>
                    <div class="settings-row-desc">Lebar area konten dokumentasi</div>
                  </div>
                  <select class="form-select" style="width:160px;" id="reading-width-select" onchange="SettingsPage.setReadingWidth(this.value)">
                    <option value="720px" ${Utils.storage.get('reading_width') === '720px' ? 'selected' : ''}>Sempit (720px)</option>
                    <option value="900px" ${!Utils.storage.get('reading_width') || Utils.storage.get('reading_width') === '900px' ? 'selected' : ''}>Normal (900px)</option>
                    <option value="1100px" ${Utils.storage.get('reading_width') === '1100px' ? 'selected' : ''}>Lebar (1100px)</option>
                    <option value="100%" ${Utils.storage.get('reading_width') === '100%' ? 'selected' : ''}>Full Width</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- EDITOR -->
            <div class="settings-section" id="section-editor">
              <div class="settings-section-title">Editor & Kode</div>
              <div class="settings-card">
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Ukuran Font Kode</div>
                    <div class="settings-row-desc">Ukuran font pada blok kode (dalam px)</div>
                  </div>
                  <select class="form-select" style="width:160px;" id="code-font-size" onchange="SettingsPage.setCodeFontSize(this.value)">
                    ${['11','12','12.5','13','13.5','14','15','16'].map(s => 
                      `<option value="${s}px" ${Utils.storage.get('code_font_size', '13.5px') === s+'px' ? 'selected' : ''}>${s}px</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Font Kode</div>
                    <div class="settings-row-desc">Font yang digunakan untuk blok kode</div>
                  </div>
                  <div style="font-size:13px;color:var(--text-secondary);padding:4px 8px;background:var(--bg-primary);border-radius:var(--radius-sm);font-family:var(--font-code);">JetBrains Mono</div>
                </div>
              </div>
            </div>

            <!-- SIDEBAR -->
            <div class="settings-section" id="section-sidebar">
              <div class="settings-section-title">Sidebar</div>
              <div class="settings-card">
                <div class="settings-row">
                  <div class="settings-row-info">
                    <div class="settings-row-label">Default Sidebar</div>
                    <div class="settings-row-desc">Kondisi sidebar saat pertama kali dibuka</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" class="toggle-switch-input" id="sidebar-default-open" 
                      ${Utils.storage.get('sidebar_open', true) ? 'checked' : ''} 
                      onchange="SettingsPage.setSidebarDefault(this.checked)">
                    <div class="toggle-switch-track">
                      <div class="toggle-switch-thumb"></div>
                    </div>
                    <span class="toggle-switch-label">Terbuka</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- ADMIN-ONLY SETTINGS -->
            ${Auth.isAdmin ? `
              <!-- SUPABASE -->
              <div class="settings-section" id="section-supabase">
                <div class="settings-section-title">Status Supabase</div>
                <div class="settings-card">
                  <div class="settings-row">
                    <div class="settings-row-info">
                      <div class="settings-row-label">Status Koneksi</div>
                      <div class="settings-row-desc">Status koneksi ke Supabase database</div>
                    </div>
                    <div class="settings-connection-status ${isConnected ? 'connected' : 'disconnected'}">
                      <div class="settings-connection-dot"></div>
                      ${isConnected ? 'Terhubung' : (window.isSupabaseConfigured ? 'Tidak Terhubung' : 'Supabase belum dikonfigurasi')}
                    </div>
                  </div>
                  <div class="settings-row">
                    <div class="settings-row-info">
                      <div class="settings-row-label">Konfigurasi</div>
                      <div class="settings-row-desc">Edit file <code class="inline-code">supabase.js</code> untuk mengubah konfigurasi</div>
                    </div>
                    <span class="version-badge">supabase.js</span>
                  </div>
                  <div class="settings-row">
                    <div class="settings-row-info">
                      <div class="settings-row-label">Versi Aplikasi</div>
                      <div class="settings-row-desc">Versi DEVVAULT yang sedang digunakan</div>
                    </div>
                    <span class="version-badge">v1.0.0</span>
                  </div>
                </div>
              </div>

              <!-- AKUN (ADMIN ONLY) -->
              <div class="settings-section" id="section-akun">
                <div class="settings-section-title">Akun Admin</div>
                <div class="settings-card">
                  <div class="settings-row">
                    <div class="settings-row-info">
                      <div class="settings-row-label">Email</div>
                      <div class="settings-row-desc">${Utils.escapeHtml(Auth.currentUser?.email || '-')}</div>
                    </div>
                    <span class="admin-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Admin
                    </span>
                  </div>
                  <div class="settings-row">
                    <div class="settings-row-info">
                      <div class="settings-row-label">Logout</div>
                      <div class="settings-row-desc">Keluar dari akun admin</div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="SettingsPage.logout()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <!-- KATEGORI -->
              <div class="settings-section" id="section-kategori">
                <div class="settings-section-title">Manajemen Kategori</div>
                <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
                  <button class="btn btn-primary btn-sm" onclick="SettingsPage.showCreateCategoryModal()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    Tambah Kategori
                  </button>
                </div>
                <div id="categories-list">
                  ${this.renderCategoriesList()}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderCategoriesList() {
    const cats = Sidebar.categories;
    if (cats.length === 0) return `<div class="empty-state"><div class="empty-state-title">Belum ada kategori</div></div>`;
    return `
      <div class="settings-card">
        ${cats.map(cat => `
          <div class="settings-row">
            <div class="settings-row-info" style="display:flex;align-items:center;gap:10px;">
              <div class="category-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${Sidebar.getIconPath(cat.icon || 'folder')}</svg>
              </div>
              <div>
                <div class="settings-row-label">${Utils.escapeHtml(cat.name)}</div>
                <div class="settings-row-desc">slug: ${Utils.escapeHtml(cat.slug)}</div>
              </div>
            </div>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" onclick="SettingsPage.showEditCategoryModal('${cat.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                Edit
              </button>
              <button class="btn btn-ghost btn-sm" onclick="SettingsPage.deleteCategory('${cat.id}')" style="color:var(--error)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  switchSection(section, el) {
    if (!Auth.isAdmin && ['supabase', 'akun', 'kategori'].includes(section)) {
      section = 'penampilan';
      el = document.querySelector('.settings-nav-item');
    }
    this.activeSection = section;
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
    const sectionEl = document.getElementById(`section-${section}`);
    if (sectionEl) sectionEl.classList.add('active');
    if (el) el.classList.add('active');
  },

  toggleTheme(isLight) {
    const theme = isLight ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    Utils.storage.set('theme', theme);
    Notifications.addToast(`Mode ${isLight ? 'terang' : 'gelap'} aktif`, 'info');
  },

  setReadingWidth(width) {
    document.documentElement.style.setProperty('--reading-width', width);
    Utils.storage.set('reading_width', width);
  },

  setCodeFontSize(size) {
    document.documentElement.style.setProperty('--code-font-size', size);
    Utils.storage.set('code_font_size', size);
    if (typeof Prism !== 'undefined') Prism.highlightAll();
  },

  setSidebarDefault(isOpen) {
    Utils.storage.set('sidebar_open', isOpen);
  },

  async logout() {
    if (!confirm('Anda yakin ingin logout?')) return;
    const result = await Auth.logout();
    if (result.success) {
      Notifications.addToast('Logout berhasil', 'info');
      App.router.navigate('/dashboard');
    } else {
      Notifications.addToast('Gagal logout: ' + result.error, 'error');
    }
  },

  async checkConnection() {
    if (!window.isSupabaseConfigured || !window.supabaseClient) return false;
    try {
      const categories = await SupabaseAPI.getCategories();
      return Array.isArray(categories);
    } catch(e) {
      return false;
    }
  },

  showCreateCategoryModal() {
    this.showCategoryModal(null);
  },

  showEditCategoryModal(catId) {
    const cat = Sidebar.categories.find(c => c.id === catId);
    if (!cat) return;
    this.showCategoryModal(cat);
  },

  showCategoryModal(cat) {
    const iconOptions = ['folder','code-2','palette','zap','database','github','scissors','file','book','bookmark','tag','star','heart','globe','server','terminal','layers','layout','grid','box'];
    Modals.show({
      title: cat ? 'Edit Kategori' : 'Tambah Kategori',
      body: `
        <div class="form-group">
          <label class="form-label">Nama <span>*</span></label>
          <input type="text" class="form-input" id="cat-name" value="${cat ? Utils.escapeHtml(cat.name) : ''}" placeholder="Nama kategori..." autofocus />
        </div>
        <div class="form-group">
          <label class="form-label">Slug</label>
          <input type="text" class="form-input" id="cat-slug" value="${cat ? Utils.escapeHtml(cat.slug) : ''}" placeholder="auto-generate dari nama" />
        </div>
        <div class="form-group">
          <label class="form-label">Icon (Lucide icon name)</label>
          <select class="form-select" id="cat-icon">
            ${iconOptions.map(i => `<option value="${i}" ${cat?.icon === i ? 'selected' : ''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Urutan</label>
          <input type="number" class="form-input" id="cat-order" value="${cat?.sort_order ?? Sidebar.categories.length + 1}" min="0" />
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modals.close()">Batal</button>
        <button class="btn btn-primary" onclick="SettingsPage.saveCategory('${cat?.id || ''}')">Simpan</button>
      `
    });
  },

  async saveCategory(catId) {
    const name = document.getElementById('cat-name')?.value?.trim();
    if (!name) { Notifications.addToast('Nama kategori wajib diisi', 'error'); return; }
    const data = {
      name,
      slug: document.getElementById('cat-slug')?.value?.trim() || Utils.slugify(name),
      icon: document.getElementById('cat-icon')?.value || 'folder',
      sort_order: parseInt(document.getElementById('cat-order')?.value) || 0
    };
    try {
      if (catId) {
        await SupabaseAPI.updateCategory(catId, data);
        Notifications.addToast('Kategori diperbarui', 'success');
      } else {
        await SupabaseAPI.createCategory(data);
        Notifications.addToast('Kategori berhasil dibuat', 'success');
      }
      Modals.close();
      await Sidebar.refresh();
      // Re-render categories list
      const catList = document.getElementById('categories-list');
      if (catList) catList.innerHTML = this.renderCategoriesList();
    } catch(e) {
      Notifications.addToast('Gagal menyimpan kategori: ' + e.message, 'error');
    }
  },

  async deleteCategory(catId) {
    const cat = Sidebar.categories.find(c => c.id === catId);
    if (!cat) return;
    if (!confirm(`Hapus kategori "${cat.name}"? Semua halaman di kategori ini tidak akan terhapus, tapi tidak akan terkategori.`)) return;
    try {
      await SupabaseAPI.deleteCategory(catId);
      await Sidebar.refresh();
      const catList = document.getElementById('categories-list');
      if (catList) catList.innerHTML = this.renderCategoriesList();
      Notifications.addToast('Kategori dihapus', 'info');
    } catch(e) {
      Notifications.addToast('Gagal menghapus kategori: ' + e.message, 'error');
    }
  }
};

window.SettingsPage = SettingsPage;
