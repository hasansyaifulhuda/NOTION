/* DEVVAULT - Pages Module */

const Pages = {
  currentPage: null,
  openTabs: [],
  unsavedChanges: false,
  saveLock: false,

  async openPage(slug) {
    // Clear active state
    this.currentPage = null;
    Search.setBlocks([]);
    TOC.destroy();

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Skeleton loading
    mainContent.innerHTML = this.renderSkeleton();

    try {
      const page = await SupabaseAPI.getPage(slug, Auth.isAdmin);
      if (!page) {
        this.renderNotFound(slug);
        return;
      }

      // Track as admin or public
      if (!Auth.isAdmin && (page.status !== 'published' || page.visibility !== 'public' || page.deleted_at)) {
        this.renderNotFound(slug);
        return;
      }

      this.currentPage = page;
      Utils.setPageTitle(page.title);

      // Add to recent pages
      this.addToRecent(slug);

      // Add to tabs
      this.addTab(page);

      // Load and render blocks
      const blocks = await Blocks.load(page.id);

      // Render page
      mainContent.innerHTML = this.renderPageView(page);
      Blocks.render(blocks, Auth.isAdmin);
      TOC.build(blocks);
      Search.setBlocks(blocks);

      // Update sidebar active
      Sidebar.updateActiveItem();

      // Breadcrumb
      this.updateHeaderBreadcrumb(page);

      // Reading progress
      this.initReadingProgress();

      // Syntax highlighting
      if (typeof Prism !== 'undefined') {
        setTimeout(() => Prism.highlightAll(), 100);
      }

    } catch(e) {
      console.error('Page load error:', e);
      mainContent.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <div class="empty-state-title">Gagal Memuat Halaman</div>
          <div class="empty-state-desc">${Utils.escapeHtml(e.message)}</div>
          <button class="btn btn-secondary" onclick="App.router.navigate('/dashboard')" style="margin-top:12px;">Kembali ke Dashboard</button>
        </div>
      `;
    }
  },

  renderPageView(page) {
    const catName = page.categories?.name || '';
    const catSlug = page.categories?.slug || '';
    const catIcon = page.categories?.icon || 'folder';
    const createdAt = Utils.formatDate(page.created_at);
    const updatedAt = Utils.formatDate(page.updated_at, true);

    const adminActions = Auth.isAdmin ? `
      <div class="admin-toolbar">
        <div class="admin-toolbar-left">
          <span class="page-badge ${page.status}">${page.status === 'published' ? 'Published' : 'Draft'}</span>
          <span class="page-badge ${page.visibility}">${page.visibility === 'public' ? 'Publik' : 'Privat'}</span>
          ${page.is_pinned ? `<span class="page-badge pinned"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 17 8 11 16 11"/></svg> Dipin</span>` : ''}
        </div>
        <div class="admin-toolbar-right">
          <button class="btn btn-secondary btn-sm" onclick="Pages.showEditPageModal('${page.id}')" title="Edit metadata">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Edit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="Pages.togglePin('${page.id}')" title="${page.is_pinned ? 'Lepas pin' : 'Pin halaman'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 17 8 11 16 11"/></svg>
            ${page.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="Pages.duplicatePage('${page.id}')" title="Duplikat halaman">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Duplikat
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ExportJSON.exportPage('${page.id}')" title="Export JSON">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export
          </button>
          <button class="btn btn-danger btn-sm" onclick="Pages.confirmDeletePage('${page.id}')" title="Hapus halaman">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Hapus
          </button>
        </div>
      </div>
    ` : '';

    return `
      <div class="page-view content-reading-wrapper">
        <div class="page-header">
          <div class="page-breadcrumb">
            <a href="#/dashboard" onclick="event.preventDefault(); App.router.navigate('/dashboard')">Home</a>
            <span class="page-breadcrumb-sep">/</span>
            ${catSlug ? `<a href="#/${catSlug}" onclick="event.preventDefault(); App.router.navigate('/${catSlug}')">${Utils.escapeHtml(catName)}</a><span class="page-breadcrumb-sep">/</span>` : ''}
            <span>${Utils.escapeHtml(page.title)}</span>
          </div>
          <div class="page-header-top">
            <div class="page-header-title-area">
              ${catIcon ? `
                <div class="page-category-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${Sidebar.getIconPath(catIcon)}</svg>
                </div>
              ` : ''}
              <h1 class="page-header-title">${Utils.escapeHtml(page.title)}</h1>
            </div>
          </div>
          <div class="page-meta">
            <div class="page-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Dibuat: ${createdAt}
            </div>
            <div class="page-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Diperbarui: ${updatedAt}
            </div>
            ${page.description ? `<div class="page-meta-item" style="display:block;color:var(--text-secondary);font-size:13px;margin-top:8px;max-width:600px;">${Utils.escapeHtml(page.description)}</div>` : ''}
          </div>
          ${adminActions}
        </div>
        <div id="blocks-container"></div>
      </div>
    `;
  },

  renderSkeleton() {
    return `
      <div class="content-reading-wrapper" style="padding:2rem 0;">
        <div class="skeleton skeleton-line" style="width:30%;height:12px;margin-bottom:24px;"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-line" style="width:50%;"></div>
        <div class="skeleton skeleton-line" style="width:40%;margin-bottom:32px;"></div>
        <div class="skeleton skeleton-block"></div>
        <div class="skeleton skeleton-block" style="height:120px;"></div>
        <div class="skeleton skeleton-block" style="height:200px;"></div>
      </div>
    `;
  },

  renderNotFound(slug) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
      <div class="content-reading-wrapper">
        <div class="empty-state">
          <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><line x1="9" x2="15" y1="13" y2="13"/><line x1="9" x2="15" y1="17" y2="17"/><polyline points="14 2 14 8 20 8"/></svg>
          <div class="empty-state-title">Halaman Tidak Ditemukan</div>
          <div class="empty-state-desc">Halaman "<strong>${Utils.escapeHtml(slug)}</strong>" tidak ada atau tidak dapat diakses.</div>
          <button class="btn btn-secondary" onclick="App.router.navigate('/dashboard')" style="margin-top:12px;">Kembali ke Dashboard</button>
        </div>
      </div>
    `;
    Utils.setPageTitle('Halaman Tidak Ditemukan');
  },

  updateHeaderBreadcrumb(page) {
    const bc = document.getElementById('header-breadcrumb');
    if (!bc) return;
    const catName = page.categories?.name || '';
    const catSlug = page.categories?.slug || '';
    bc.innerHTML = `
      <span class="header-breadcrumb-item">
        <a href="#/dashboard" style="color:var(--text-muted);text-decoration:none;" onclick="event.preventDefault(); App.router.navigate('/dashboard')">Home</a>
      </span>
      <span class="header-breadcrumb-sep">/</span>
      ${catSlug ? `
        <span class="header-breadcrumb-item">
          <a href="#/${catSlug}" style="color:var(--text-muted);text-decoration:none;" onclick="event.preventDefault(); App.router.navigate('/${catSlug}')">${Utils.escapeHtml(catName)}</a>
        </span>
        <span class="header-breadcrumb-sep">/</span>
      ` : ''}
      <span class="header-breadcrumb-item">${Utils.escapeHtml(page.title)}</span>
    `;
  },

  initReadingProgress() {
    const fill = document.getElementById('reading-progress-fill');
    if (!fill) return;

    const content = document.querySelector('.page-content');
    const handler = () => {
      const scrollEl = content || window;
      const scrollTop = scrollEl instanceof Element ? scrollEl.scrollTop : window.scrollY;
      const scrollHeight = scrollEl instanceof Element ? scrollEl.scrollHeight - scrollEl.clientHeight : document.body.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      fill.style.width = Math.min(100, progress) + '%';
    };

    (content || window).addEventListener('scroll', handler, { passive: true });
  },

  // Tabs
  addTab(page) {
    const exists = this.openTabs.find(t => t.slug === page.slug);
    if (!exists) {
      this.openTabs.push({ slug: page.slug, title: page.title });
    }
    this.renderTabs();
    this.setActiveTab(page.slug);
  },

  renderTabs() {
    const tabsBar = document.getElementById('page-tabs-bar');
    if (!tabsBar) return;

    if (this.openTabs.length === 0) {
      tabsBar.innerHTML = '';
      return;
    }

    tabsBar.innerHTML = this.openTabs.map(tab => `
      <div class="page-tab ${this.currentPage?.slug === tab.slug ? 'active' : ''}" 
           data-slug="${tab.slug}" 
           onclick="App.router.navigate('/${tab.slug}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/></svg>
        <span>${Utils.escapeHtml(tab.title)}</span>
        ${tab.unsaved ? `<span class="page-tab-unsaved" title="Perubahan belum disimpan">●</span>` : ''}
        <button class="page-tab-close" onclick="event.stopPropagation(); Pages.closeTab('${tab.slug}')" title="Tutup tab">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>
    `).join('');
  },

  setActiveTab(slug) {
    document.querySelectorAll('.page-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.slug === slug);
    });
  },

  closeTab(slug) {
    const tab = this.openTabs.find(t => t.slug === slug);
    if (tab?.unsaved && !confirm('Tab ini memiliki perubahan yang belum disimpan. Tutup tetap?')) return;
    
    this.openTabs = this.openTabs.filter(t => t.slug !== slug);
    
    if (this.currentPage?.slug === slug) {
      const last = this.openTabs[this.openTabs.length - 1];
      if (last) {
        App.router.navigate('/' + last.slug);
      } else {
        App.router.navigate('/dashboard');
      }
    } else {
      this.renderTabs();
    }
  },

  markUnsaved(state = true) {
    this.unsavedChanges = state;
    if (this.currentPage) {
      const tab = this.openTabs.find(t => t.slug === this.currentPage.slug);
      if (tab) {
        tab.unsaved = state;
        this.renderTabs();
      }
    }
  },

  addToRecent(slug) {
    let recent = Utils.storage.get('recent_pages', []);
    recent = recent.filter(s => s !== slug);
    recent.unshift(slug);
    recent = recent.slice(0, 10);
    Utils.storage.set('recent_pages', recent);
  },

  // Admin actions
  showCreateModal(categoryId = null) {
    if (!Auth.requireAdmin()) return;

    Modals.show({
      title: 'Buat Halaman Baru',
      body: `
        <div class="form-group">
          <label class="form-label">Judul <span>*</span></label>
          <input type="text" class="form-input" id="new-page-title" placeholder="Judul halaman..." autofocus />
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-select" id="new-page-category">
            <option value="">-- Tanpa Kategori --</option>
            ${Sidebar.categories.map(c => `<option value="${c.id}" ${c.id === categoryId ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea class="form-textarea" id="new-page-desc" rows="3" placeholder="Deskripsi singkat..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="new-page-status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Visibility</label>
            <select class="form-select" id="new-page-visibility">
              <option value="private">Privat</option>
              <option value="public">Publik</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Template</label>
          <select class="form-select" id="new-page-template">
            <option value="">Halaman Kosong</option>
            <option value="html-lesson">Template: Pelajaran HTML</option>
            <option value="css-lesson">Template: Pelajaran CSS</option>
            <option value="js-lesson">Template: Pelajaran JavaScript</option>
            <option value="snippet-page">Template: Halaman Snippet</option>
            <option value="docs-page">Template: Dokumentasi</option>
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modals.close()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.createPage()">Buat Halaman</button>
      `
    });
  },

  async createPage() {
    const title = document.getElementById('new-page-title')?.value?.trim();
    if (!title) {
      Notifications.addToast('Judul halaman wajib diisi', 'error');
      return;
    }

    const categoryId = document.getElementById('new-page-category')?.value || null;
    const description = document.getElementById('new-page-desc')?.value?.trim() || '';
    const status = document.getElementById('new-page-status')?.value || 'draft';
    const visibility = document.getElementById('new-page-visibility')?.value || 'private';
    const template = document.getElementById('new-page-template')?.value || '';

    let slug = Utils.slugify(title);

    try {
      const page = await SupabaseAPI.createPage({
        title,
        slug,
        category_id: categoryId || null,
        description,
        status,
        visibility,
        is_pinned: false,
        sort_order: 0,
        created_by: Auth.currentUser?.id
      });

      // Apply template blocks
      if (template) {
        await this.applyTemplate(page.id, template);
      }

      Modals.close();
      await Sidebar.refresh();
      Notifications.addToast(`Halaman "${title}" berhasil dibuat!`, 'success');
      await Notifications.addAdminNotification('success', 'Halaman Dibuat', `"${title}" berhasil dibuat.`);
      App.router.navigate('/' + page.slug);
    } catch(e) {
      Notifications.addToast('Gagal membuat halaman: ' + e.message, 'error');
    }
  },

  async applyTemplate(pageId, template) {
    const templates = {
      'html-lesson': [
        { type: 'heading', content: JSON.stringify({ level: 1, text: 'Pelajaran HTML' }), sort_order: 10 },
        { type: 'text', content: JSON.stringify({ text: 'Deskripsi pelajaran HTML ini...' }), sort_order: 20 },
        { type: 'heading', content: JSON.stringify({ level: 2, text: 'Pengenalan' }), sort_order: 30 },
        { type: 'text', content: JSON.stringify({ text: 'HTML (HyperText Markup Language) adalah bahasa markup standar untuk membuat halaman web.' }), sort_order: 40 },
        { type: 'code', content: '<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Judul</title>\n</head>\n<body>\n  <h1>Halo!</h1>\n</body>\n</html>', language: 'html', sort_order: 50 },
      ],
      'css-lesson': [
        { type: 'heading', content: JSON.stringify({ level: 1, text: 'Pelajaran CSS' }), sort_order: 10 },
        { type: 'text', content: JSON.stringify({ text: 'CSS (Cascading Style Sheets) digunakan untuk mendesain tampilan halaman web.' }), sort_order: 20 },
        { type: 'code', content: '/* Contoh CSS */\nbody {\n  margin: 0;\n  font-family: Arial, sans-serif;\n  background: #f0f0f0;\n}', language: 'css', sort_order: 30 },
      ],
      'js-lesson': [
        { type: 'heading', content: JSON.stringify({ level: 1, text: 'Pelajaran JavaScript' }), sort_order: 10 },
        { type: 'text', content: JSON.stringify({ text: 'JavaScript adalah bahasa pemrograman yang membuat halaman web menjadi interaktif.' }), sort_order: 20 },
        { type: 'code', content: '// Contoh JavaScript\nconsole.log("Halo Dunia!");\n\nconst nama = "Developer";\nalert(`Selamat datang, ${nama}!`);', language: 'javascript', sort_order: 30 },
      ],
      'snippet-page': [
        { type: 'heading', content: JSON.stringify({ level: 1, text: 'Koleksi Snippet' }), sort_order: 10 },
        { type: 'text', content: JSON.stringify({ text: 'Kumpulan snippet kode yang berguna untuk referensi sehari-hari.' }), sort_order: 20 },
        { type: 'heading', content: JSON.stringify({ level: 2, text: 'Snippet 1' }), sort_order: 30 },
      ],
      'docs-page': [
        { type: 'heading', content: JSON.stringify({ level: 1, text: 'Judul Dokumentasi' }), sort_order: 10 },
        { type: 'quote', content: JSON.stringify({ variant: 'info', label: 'Info', text: 'Ini adalah halaman dokumentasi.' }), sort_order: 20 },
        { type: 'heading', content: JSON.stringify({ level: 2, text: 'Pendahuluan' }), sort_order: 30 },
        { type: 'text', content: JSON.stringify({ text: 'Tulis konten pendahuluan di sini...' }), sort_order: 40 },
        { type: 'heading', content: JSON.stringify({ level: 2, text: 'Cara Penggunaan' }), sort_order: 50 },
        { type: 'checklist', content: JSON.stringify({ items: [{ text: 'Langkah 1', checked: false }, { text: 'Langkah 2', checked: false }, { text: 'Langkah 3', checked: false }] }), sort_order: 60 },
      ]
    };

    const templateBlocks = templates[template] || [];
    for (const block of templateBlocks) {
      await SupabaseAPI.createBlock({ page_id: pageId, ...block, metadata: {} });
    }
  },

  showEditPageModal(pageId) {
    if (!Auth.requireAdmin()) return;
    const page = this.currentPage;
    if (!page || page.id !== pageId) return;

    Modals.show({
      title: 'Edit Metadata Halaman',
      body: `
        <div class="form-group">
          <label class="form-label">Judul <span>*</span></label>
          <input type="text" class="form-input" id="edit-page-title" value="${Utils.escapeHtml(page.title)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Slug (URL)</label>
          <input type="text" class="form-input" id="edit-page-slug" value="${Utils.escapeHtml(page.slug)}" />
          <div class="form-hint">Hati-hati mengubah slug, dapat memutus link yang ada.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-select" id="edit-page-category">
            <option value="">-- Tanpa Kategori --</option>
            ${Sidebar.categories.map(c => `<option value="${c.id}" ${c.id === page.category_id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea class="form-textarea" id="edit-page-desc" rows="3">${Utils.escapeHtml(page.description || '')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="edit-page-status">
              <option value="draft" ${page.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="published" ${page.status === 'published' ? 'selected' : ''}>Published</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Visibility</label>
            <select class="form-select" id="edit-page-visibility">
              <option value="private" ${page.visibility === 'private' ? 'selected' : ''}>Privat</option>
              <option value="public" ${page.visibility === 'public' ? 'selected' : ''}>Publik</option>
            </select>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modals.close()">Batal</button>
        <button class="btn btn-primary" onclick="Pages.saveEditPage('${pageId}')">Simpan</button>
      `
    });
  },

  async saveEditPage(pageId) {
    const title = document.getElementById('edit-page-title')?.value?.trim();
    if (!title) { Notifications.addToast('Judul wajib diisi', 'error'); return; }

    const updates = {
      title,
      slug: document.getElementById('edit-page-slug')?.value?.trim() || Utils.slugify(title),
      category_id: document.getElementById('edit-page-category')?.value || null,
      description: document.getElementById('edit-page-desc')?.value?.trim() || '',
      status: document.getElementById('edit-page-status')?.value || 'draft',
      visibility: document.getElementById('edit-page-visibility')?.value || 'private'
    };

    try {
      await SupabaseAPI.updatePage(pageId, updates);
      Modals.close();
      await Sidebar.refresh();
      Notifications.addToast('Halaman berhasil diperbarui', 'success');
      await Notifications.addAdminNotification('success', 'Halaman Diperbarui', `"${title}" berhasil diperbarui.`);
      
      // Update tab
      if (this.currentPage) {
        this.currentPage = { ...this.currentPage, ...updates };
        const tab = this.openTabs.find(t => t.slug === this.currentPage.slug || t.slug === pageId);
        if (tab) {
          tab.title = title;
          tab.slug = updates.slug;
        }
        this.renderTabs();
      }

      // Navigate to new slug if changed
      App.router.navigate('/' + updates.slug);
    } catch(e) {
      Notifications.addToast('Gagal menyimpan: ' + e.message, 'error');
    }
  },

  async togglePin(pageId) {
    if (!Auth.requireAdmin()) return;
    if (!this.currentPage) return;

    const newPinState = !this.currentPage.is_pinned;
    try {
      await SupabaseAPI.updatePage(pageId, { is_pinned: newPinState });
      this.currentPage.is_pinned = newPinState;
      await Sidebar.refresh();
      Notifications.addToast(newPinState ? 'Halaman dipin!' : 'Pin dilepas', 'success');
      // Reload page view to update badges
      await this.openPage(this.currentPage.slug);
    } catch(e) {
      Notifications.addToast('Gagal mengubah pin: ' + e.message, 'error');
    }
  },

  async duplicatePage(pageId) {
    if (!Auth.requireAdmin()) return;
    if (!this.currentPage) return;

    try {
      const page = this.currentPage;
      const newTitle = `${page.title} (Salinan)`;
      const newSlug = Utils.slugify(newTitle) + '-' + Date.now();

      const newPage = await SupabaseAPI.createPage({
        title: newTitle,
        slug: newSlug,
        category_id: page.category_id,
        description: page.description,
        status: 'draft',
        visibility: 'private',
        is_pinned: false,
        sort_order: page.sort_order + 1,
        created_by: Auth.currentUser?.id
      });

      // Duplicate blocks
      const blocks = await SupabaseAPI.getBlocks(page.id);
      for (const block of blocks) {
        await SupabaseAPI.createBlock({
          page_id: newPage.id,
          type: block.type,
          content: block.content,
          language: block.language,
          metadata: block.metadata || {},
          sort_order: block.sort_order
        });
      }

      await Sidebar.refresh();
      Notifications.addToast(`"${newTitle}" berhasil diduplikat`, 'success');
      App.router.navigate('/' + newPage.slug);
    } catch(e) {
      Notifications.addToast('Gagal menduplikat halaman: ' + e.message, 'error');
    }
  },

  confirmDeletePage(pageId) {
    if (!Auth.requireAdmin()) return;

    Modals.show({
      title: 'Hapus Halaman',
      body: `
        <div class="confirm-icon danger">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </div>
        <div class="confirm-title">Pindahkan ke Trash?</div>
        <div class="confirm-message">Halaman akan dipindahkan ke Trash. Anda dapat memulihkannya dari halaman Trash.</div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modals.close()">Batal</button>
        <button class="btn btn-danger" onclick="Pages.deletePage('${pageId}')">Pindahkan ke Trash</button>
      `
    });
  },

  async deletePage(pageId) {
    if (!Auth.requireAdmin()) return;
    try {
      await SupabaseAPI.softDeletePage(pageId);
      Modals.close();
      this.openTabs = this.openTabs.filter(t => t.slug !== this.currentPage?.slug);
      this.renderTabs();
      await Sidebar.refresh();
      Notifications.addToast('Halaman dipindahkan ke Trash', 'info');
      await Notifications.addAdminNotification('info', 'Halaman Dihapus', `Halaman dipindahkan ke Trash.`);
      App.router.navigate('/dashboard');
    } catch(e) {
      Notifications.addToast('Gagal menghapus halaman: ' + e.message, 'error');
    }
  }
};

window.Pages = Pages;
