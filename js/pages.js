/* ============================================================
   DevVault - Pages System
   js/pages.js
   ============================================================ */

'use strict';

window.DevVaultPages = (function () {
  const { qs, sanitize, show, hide, on, formatDate, timeAgo, estimateReadTime } = window.DevVaultUtils;

  /* ─── State ─── */
  let currentPage = null;
  let editingPageId = null;

  /* ─── Render Dashboard ─── */

  async function renderDashboard(container) {
    if (!container) return;

    const isAdmin = window.DevVaultAuth?.isAdmin();

    container.innerHTML = `
      <div class="page-wide">
        <div class="page-header">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <h1 class="page-header-title">
              DevVault
            </h1>
            ${!window.isSupabaseConfigured ? `
              <span class="badge badge-warning">
                <i data-lucide="alert-triangle" style="width:10px;height:10px;margin-right:4px;" aria-hidden="true"></i>
                Demo Mode
              </span>
            ` : ''}
          </div>
          <p style="color:var(--color-text-muted);font-size:0.875rem;margin-top:4px;">
            </p>
          ${isAdmin ? `
            <div class="page-header-actions">
              <button class="btn btn-primary" id="dashboard-add-page-btn" aria-label="buat halaman baru">
                <i data-lucide="plus" aria-hidden="true"></i>
                New Page
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Stats -->
        <div class="dashboard-stats" id="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon"><i data-lucide="file-text" aria-hidden="true"></i></div>
            <div class="stat-value" id="stat-pages">-</div>
            <div class="stat-label">Pages</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i data-lucide="folder" aria-hidden="true"></i></div>
            <div class="stat-value" id="stat-categories">-</div>
            <div class="stat-label">Categories</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i data-lucide="code-2" aria-hidden="true"></i></div>
            <div class="stat-value" id="stat-snippets">-</div>
            <div class="stat-label">Snippets</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i data-lucide="check-circle" aria-hidden="true"></i></div>
            <div class="stat-value" id="stat-published">-</div>
            <div class="stat-label">Published</div>
          </div>
        </div>

        <!-- Recent Pages -->
        <div style="margin-top:32px;">
          <div class="section-header" style="margin-bottom:16px;padding-bottom:12px;">
            <h2 style="font-size:1rem;font-weight:600;color:var(--color-text-secondary);"Halaman terbaru</h2>
            ${isAdmin ? `
              <button class="btn btn-ghost btn-sm" id="dashboard-add-page-btn2" aria-label="halaman baru">
                <i data-lucide="plus" aria-hidden="true"></i> baru
              </button>
            ` : ''}
          </div>
          <div id="recent-pages-grid" class="card-grid" role="list" aria-label="Recent pages">
            <div class="loading-overlay" style="position:relative;min-height:150px;">
              <div class="loading-spinner" aria-hidden="true"></div>
              <span>Loading pages...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Load stats and pages
    await Promise.all([
      loadDashboardStats(),
      loadRecentPages(container, isAdmin),
    ]);

    // Bind add page buttons
    const addBtn = container.querySelector('#dashboard-add-page-btn');
    const addBtn2 = container.querySelector('#dashboard-add-page-btn2');
    if (addBtn) on(addBtn, 'click', () => openCreateModal());
    if (addBtn2) on(addBtn2, 'click', () => openCreateModal());
  }

  async function loadDashboardStats() {
    try {
      const stats = await window.DevVaultAPI.getStats();
      const pages = qs('#stat-pages');
      const cats = qs('#stat-categories');
      const snips = qs('#stat-snippets');
      const pub = qs('#stat-published');
      if (pages) pages.textContent = stats.pages;
      if (cats) cats.textContent = stats.categories;
      if (snips) snips.textContent = stats.snippets;
      if (pub) pub.textContent = stats.published;
    } catch (err) {
      console.error('[Pages] Stats error:', err);
    }
  }

  async function loadRecentPages(container, isAdmin) {
    const grid = container?.querySelector('#recent-pages-grid') || qs('#recent-pages-grid');
    if (!grid) return;

    try {
      const { data, error } = await window.DevVaultAPI.getPages(isAdmin);
      if (error) throw error;

      const pages = (data || []).filter(p => !p.deleted_at).slice(0, 8);

      if (pages.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;min-height:160px;">
            <div class="empty-state-icon">
              <i data-lucide="file-text" aria-hidden="true"></i>
            </div>
            <p class="empty-state-title">No pages yet</p>
            <p class="empty-state-desc">
              ${isAdmin ? 'Buat halaman dokumentasi pertamamu untuk memulai.' : 'Belum ada dokumentasi yang dipublikasikan.'}
            </p>
            ${isAdmin ? `<button class="btn btn-primary" id="empty-add-page-btn">
              <i data-lucide="plus" aria-hidden="true"></i> Create First Page
            </button>` : ''}
          </div>
        `;
        if (window.lucide) window.lucide.createIcons({ nodes: [grid] });
        const emptyBtn = grid.querySelector('#empty-add-page-btn');
        if (emptyBtn) on(emptyBtn, 'click', () => openCreateModal());
        return;
      }

      grid.innerHTML = pages.map(page => renderPageCard(page, isAdmin)).join('');
      if (window.lucide) window.lucide.createIcons({ nodes: [grid] });
      bindPageCardEvents(grid, isAdmin);
    } catch (err) {
      console.error('[Pages] Load error:', err);
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <p style="color:var(--color-error);">gagal memuat halaman.</p>
        </div>
      `;
    }
  }

  function renderPageCard(page, isAdmin) {
    const catName = page.categories?.name || '';
    const catColor = page.categories?.color || 'var(--color-accent)';

    return `
      <div class="card" style="cursor:pointer;" data-page-card="${page.id}" role="listitem" tabindex="0"
        aria-label="${sanitize(page.title)} page">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">
          <div>
            ${page.pinned ? `<div class="pin-badge" aria-label="Pinned"><i data-lucide="pin" aria-hidden="true"></i></div>` : ''}
            <h3 style="font-size:1rem;font-weight:600;color:var(--color-text-primary);margin-top:${page.pinned ? '4px' : '0'};">
              ${sanitize(page.title)}
            </h3>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            <span class="badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}">${page.status}</span>
          </div>
        </div>
        ${page.description ? `<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:12px;line-height:1.5;">${sanitize(page.description)}</p>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
          <div style="display:flex;align-items:center;gap:8px;">
            ${catName ? `<span style="font-size:0.75rem;color:${catColor};">${sanitize(catName)}</span>` : ''}
            <span style="font-size:0.75rem;color:var(--color-text-muted);">${timeAgo(page.updated_at)}</span>
          </div>
          ${isAdmin ? `
            <div style="display:flex;gap:4px;" onclick="event.stopPropagation()">
              <button class="icon-btn" data-edit-page="${page.id}" aria-label="Edit page" title="Edit">
                <i data-lucide="pencil" style="width:12px;height:12px;" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-pin-page="${page.id}" aria-label="${page.pinned ? 'Unpin' : 'Pin'} page" title="${page.pinned ? 'Unpin' : 'Pin'}">
                <i data-lucide="pin" style="width:12px;height:12px;${page.pinned ? 'color:var(--color-warning);' : ''}" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" style="color:var(--color-error);" data-delete-page="${page.id}" aria-label="Delete page" title="Delete">
                <i data-lucide="trash-2" style="width:12px;height:12px;" aria-hidden="true"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function bindPageCardEvents(container, isAdmin) {
    container.querySelectorAll('[data-page-card]').forEach(card => {
      on(card, 'click', (e) => {
        if (e.target.closest('[data-edit-page],[data-pin-page],[data-delete-page]')) return;
        const pageId = card.dataset.pageCard;
        window.location.hash = `#/${pageId}`;
      });
      on(card, 'keydown', (e) => {
        if (e.key === 'Enter') {
          const pageId = card.dataset.pageCard;
          window.location.hash = `#/${pageId}`;
        }
      });
    });

    if (!isAdmin) return;

    container.querySelectorAll('[data-edit-page]').forEach(btn => {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        openEditModal(btn.dataset.editPage);
      });
    });

    container.querySelectorAll('[data-pin-page]').forEach(btn => {
      on(btn, 'click', async (e) => {
        e.stopPropagation();
        await togglePinPage(btn.dataset.pinPage);
      });
    });

    container.querySelectorAll('[data-delete-page]').forEach(btn => {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        deletePageConfirm(btn.dataset.deletePage);
      });
    });
  }

  /* ─── Render Page View ─── */

  async function renderPage(pageId, container) {
    if (!container) return;

    container.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner" aria-hidden="true"></div>
        <span>Loading page...</span>
      </div>
    `;

    try {
      const isAdmin = window.DevVaultAuth?.isAdmin();

      const [pageResult, blocksResult] = await Promise.all([
        window.DevVaultAPI.getPageById(pageId),
        window.DevVaultAPI.getBlocksByPage(pageId),
      ]);

      if (pageResult.error || !pageResult.data) {
        renderPageNotFound(container);
        return;
      }

      const page = pageResult.data;

      // Access control
      if (!isAdmin && (page.status !== 'published' || page.visibility !== 'public')) {
        renderPageAccessDenied(container, isAdmin);
        return;
      }

      currentPage = page;

      // Update breadcrumb
      if (window.DevVaultSidebar) {
        window.DevVaultSidebar.setBreadcrumbPage(page);
      }

      // Update document title
      document.title = `${page.title} - DevVault`;

      // Add tab
      if (window.DevVaultState) {
        window.DevVaultState.addTab({ id: pageId, title: page.title, route: `/${pageId}` });
      }

      const blocks = blocksResult.data || [];
      const readTime = estimateReadTime(blocks.map(b => {
        const c = b.content || {};
        return c.text || c.code || (c.items || []).join(' ') || '';
      }).join(' '));

      container.innerHTML = `
        <div class="page-view" id="page-view-content">
          <div class="page-header">
            <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">
              <h1 class="page-header-title">${sanitize(page.title)}</h1>
              ${page.pinned ? `<div class="pin-badge" aria-label="Pinned"><i data-lucide="pin" aria-hidden="true"></i></div>` : ''}
            </div>
            <div class="page-header-meta">
              ${page.categories ? `
                <span style="display:flex;align-items:center;gap:4px;color:${page.categories.color || 'var(--color-accent)'};">
                  <i data-lucide="${page.categories.icon || 'folder'}" style="width:12px;height:12px;" aria-hidden="true"></i>
                  ${sanitize(page.categories.name)}
                </span>
              ` : ''}
              <span class="badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}">${page.status}</span>
              <span>${readTime}</span>
              <span>Updated ${timeAgo(page.updated_at)}</span>
            </div>
            ${page.description ? `
              <p style="margin-top:12px;color:var(--color-text-muted);font-size:0.95rem;line-height:1.6;">
                ${sanitize(page.description)}
              </p>
            ` : ''}
            ${isAdmin ? `
              <div class="page-header-actions">
                <button class="btn btn-secondary btn-sm" id="page-add-block-btn" aria-label="Add block">
                  <i data-lucide="plus" aria-hidden="true"></i>
                  Add Block
                </button>
                <button class="btn btn-secondary btn-sm" id="page-edit-btn" aria-label="Edit page settings">
                  <i data-lucide="settings" aria-hidden="true"></i>
                  Edit Page
                </button>
                <button class="btn btn-secondary btn-sm" id="page-export-btn" aria-label="Export page">
                  <i data-lucide="download" aria-hidden="true"></i>
                  Export
                </button>
                <button class="btn btn-ghost btn-sm" style="color:var(--color-error);" id="page-delete-btn" aria-label="Delete page">
                  <i data-lucide="trash-2" aria-hidden="true"></i>
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Blocks Container -->
          <div id="blocks-container" role="article" aria-label="Page content">
            <div class="loading-overlay" style="position:relative;min-height:120px;">
              <div class="loading-spinner" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons({ nodes: [container] });

      // Render blocks
      const blocksContainer = qs('#blocks-container');
      if (blocksContainer && window.DevVaultBlocks) {
        window.DevVaultBlocks.renderBlocks(blocks, pageId, blocksContainer);
      }

      // Bind admin page actions
      if (isAdmin) {
        const addBlockBtn = qs('#page-add-block-btn');
        if (addBlockBtn) on(addBlockBtn, 'click', () => window.DevVaultBlocks.openAddModal(pageId));

        const editBtn = qs('#page-edit-btn');
        if (editBtn) on(editBtn, 'click', () => openEditModal(pageId));

        const exportBtn = qs('#page-export-btn');
        if (exportBtn) on(exportBtn, 'click', () => {
          if (window.DevVaultExport) window.DevVaultExport.exportPage(page, blocks);
        });

        const deleteBtn = qs('#page-delete-btn');
        if (deleteBtn) on(deleteBtn, 'click', () => deletePageConfirm(pageId));
      }

      // Init reading progress
      const mainContent = qs('#main-content');
      if (window.DevVaultTOC) {
        window.DevVaultTOC.initReadingProgress(mainContent);
      }

    } catch (err) {
      console.error('[Pages] Render page error:', err);
      container.innerHTML = `
        <div class="page-view">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="alert-circle" aria-hidden="true"></i></div>
            <p class="empty-state-title">gagal memuat halaman</p>
            <p class="empty-state-desc">${sanitize(err.message || 'error tidak di ketahui')}</p>
            <button class="btn btn-primary" onclick="window.history.back()">Go Back</button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    }
  }

  function renderPageNotFound(container) {
    container.innerHTML = `
      <div class="page-view">
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="file-x" aria-hidden="true"></i></div>
          <p class="empty-state-title">Page Not Found</p>
          <p class="empty-state-desc">Halaman ini tidak ada atau sudah dihapus.</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">Go to Dashboard</button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
  }

  function renderPageAccessDenied(container, isAdmin) {
    container.innerHTML = `
      <div class="page-view">
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="lock" aria-hidden="true"></i></div>
          <p class="empty-state-title">Access dibatasi</p>
          <p class="empty-state-desc">This page is private or not yet published.</p>
          ${!isAdmin ? `<button class="btn btn-primary" id="access-login-btn">
            <i data-lucide="log-in" aria-hidden="true"></i> masuk sebagai admin
          </button>` : ''}
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    const loginBtn = container.querySelector('#access-login-btn');
    if (loginBtn) on(loginBtn, 'click', () => window.DevVaultAuth.showLoginModal());
  }

  /* ─── Categories Page ─── */

  async function renderCategoriesPage(container) {
    if (!container) return;

    const isAdmin = window.DevVaultAuth?.isAdmin();

    container.innerHTML = `
      <div class="page-wide">
        <div class="section-header">
          <h1 class="section-title">
            <i data-lucide="folder" style="width:24px;height:24px;margin-right:8px;vertical-align:middle;color:var(--color-accent);" aria-hidden="true"></i>
            Categories
          </h1>
          ${isAdmin ? `
            <button class="btn btn-primary" id="add-cat-page-btn" aria-label="Create category">
              <i data-lucide="plus" aria-hidden="true"></i> New Category
            </button>
          ` : ''}
        </div>
        <div id="categories-grid" class="card-grid" role="list" aria-label="Categories">
          <div class="loading-overlay" style="position:relative;min-height:200px;">
            <div class="loading-spinner" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    const addBtn = container.querySelector('#add-cat-page-btn');
    if (addBtn) on(addBtn, 'click', () => window.DevVaultCategories?.openCreateModal());

    await loadCategoriesGrid(container, isAdmin);
  }

  async function loadCategoriesGrid(container, isAdmin) {
    const grid = container?.querySelector('#categories-grid') || qs('#categories-grid');
    if (!grid) return;

    try {
      const [catsResult, pagesResult] = await Promise.all([
        window.DevVaultAPI.getCategories(),
        window.DevVaultAPI.getPages(isAdmin),
      ]);

      const cats = catsResult.data || [];
      const pages = pagesResult.data || [];

      if (cats.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-state-icon"><i data-lucide="folder-open" aria-hidden="true"></i></div>
            <p class="empty-state-title">No categories yet</p>
            <p class="empty-state-desc">${isAdmin ? 'Buat kategori pertamamu untuk mengatur dokumentasi.' : 'No categories available yet.'}</p>
            ${isAdmin ? `<button class="btn btn-primary" onclick="window.DevVaultCategories?.openCreateModal()">
              <i data-lucide="plus" aria-hidden="true"></i> Create Category
            </button>` : ''}
          </div>
        `;
        if (window.lucide) window.lucide.createIcons({ nodes: [grid] });
        return;
      }

      grid.innerHTML = cats.map(cat => {
        const catPages = pages.filter(p => p.category_id === cat.id && !p.deleted_at);
        return `
          <div class="card" role="listitem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:${cat.color || 'var(--color-accent)'}22;border-radius:8px;display:flex;align-items:center;justify-content:center;color:${cat.color || 'var(--color-accent)'};">
                  <i data-lucide="${cat.icon || 'folder'}" style="width:18px;height:18px;" aria-hidden="true"></i>
                </div>
                <div>
                  <div style="font-weight:600;color:var(--color-text-primary);">${sanitize(cat.name)}</div>
                  <div style="font-size:0.75rem;color:var(--color-text-muted);">${catPages.length} page${catPages.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              ${isAdmin ? `
                <div style="display:flex;gap:4px;">
                  <button class="icon-btn" data-edit-cat="${cat.id}" aria-label="Edit category">
                    <i data-lucide="pencil" style="width:12px;height:12px;" aria-hidden="true"></i>
                  </button>
                  <button class="icon-btn" style="color:var(--color-error);" data-delete-cat="${cat.id}" aria-label="Delete category">
                    <i data-lucide="trash-2" style="width:12px;height:12px;" aria-hidden="true"></i>
                  </button>
                </div>
              ` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              ${catPages.slice(0, 3).map(p => `
                <a href="#/${p.id}" style="font-size:0.875rem;color:var(--color-text-secondary);text-decoration:none;display:flex;align-items:center;gap:6px;padding:4px;border-radius:4px;transition:background 150ms;">
                  <i data-lucide="file-text" style="width:12px;height:12px;flex-shrink:0;" aria-hidden="true"></i>
                  ${sanitize(p.title)}
                </a>
              `).join('')}
              ${catPages.length > 3 ? `
                <span style="font-size:0.75rem;color:var(--color-text-muted);padding:2px 4px;">+${catPages.length - 3} lainya</span>
              ` : ''}
              ${catPages.length === 0 ? `
                <span style="font-size:0.75rem;color:var(--color-text-muted);font-style:italic;">No pages yet</span>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons({ nodes: [grid] });

      if (isAdmin) {
        grid.querySelectorAll('[data-edit-cat]').forEach(btn => {
          on(btn, 'click', () => window.DevVaultCategories?.openEditModal(btn.dataset.editCat));
        });
        grid.querySelectorAll('[data-delete-cat]').forEach(btn => {
          on(btn, 'click', () => window.DevVaultCategories?.deleteCategoryConfirm(btn.dataset.deleteCat));
        });
      }
    } catch (err) {
      console.error('[Pages] Categories grid error:', err);
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <p style="color:var(--color-error);">gagal memuat kategori.</p>
        </div>
      `;
    }
  }

  /* ─── Trash Page ─── */

  async function renderTrashPage(container) {
    if (!window.DevVaultAuth?.isAdmin()) {
      container.innerHTML = `
        <div class="page-view">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="lock" aria-hidden="true"></i></div>
            <p class="empty-state-title">Access Restricted</p>
            <p class="empty-state-desc">Trash management requires admin access.</p>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [container] });
      return;
    }

    container.innerHTML = `
      <div class="page-wide">
        <div class="section-header">
          <h1 class="section-title">
            <i data-lucide="trash-2" style="width:24px;height:24px;margin-right:8px;vertical-align:middle;color:var(--color-error);" aria-hidden="true"></i>
            Trash
          </h1>
        </div>
        <div class="alert alert-warning">
          <i data-lucide="alert-triangle" aria-hidden="true"></i>
          Item di sampah tidak dapat diakses pengunjung. Pulihkan atau hapus permanen item tersebut.
        </div>
        <div id="trash-list" role="list" style="display:flex;flex-direction:column;gap:8px;">
          <div class="loading-overlay" style="position:relative;min-height:120px;">
            <div class="loading-spinner" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    await loadTrashList();
  }

  async function loadTrashList() {
    const list = qs('#trash-list');
    if (!list) return;

    try {
      const { data, error } = await window.DevVaultAPI.getTrashedPages();
      if (error) throw error;

      const trashed = data || [];

      if (trashed.length === 0) {
        list.innerHTML = `
          <div class="empty-state" style="min-height:160px;">
            <div class="empty-state-icon"><i data-lucide="trash-2" aria-hidden="true"></i></div>
            <p class="empty-state-title">sampah kosong</p>
            <p class="empty-state-desc">Halaman yang dihapus akan muncul di sini.</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons({ nodes: [list] });
        return;
      }

      list.innerHTML = trashed.map(page => `
        <div class="card" style="display:flex;align-items:center;gap:12px;" role="listitem">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;color:var(--color-text-primary);">${sanitize(page.title)}</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);">
              ${page.categories?.name ? sanitize(page.categories.name) + ' · ' : ''}
              Deleted ${timeAgo(page.updated_at)}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            <button class="btn btn-secondary btn-sm" data-restore-page="${page.id}" aria-label="Restore page">
              <i data-lucide="rotate-ccw" aria-hidden="true"></i>
              Restore
            </button>
            <button class="btn btn-danger btn-sm" data-perm-delete-page="${page.id}" aria-label="hapus permanen halaman">
              <i data-lucide="trash-2" aria-hidden="true"></i>
              Delete
            </button>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons({ nodes: [list] });

      list.querySelectorAll('[data-restore-page]').forEach(btn => {
        on(btn, 'click', async () => {
          try {
            const { error } = await window.DevVaultAPI.restorePage(btn.dataset.restorePage);
            if (error) throw error;
            window.DevVaultNotifications.success('halaman berhasil di pulihkan');
            await loadTrashList();
            window.DevVaultSidebar?.loadSidebarData();
          } catch (err) {
            window.DevVaultNotifications.error('gagal memulihkan halaman', err.message);
          }
        });
      });

      list.querySelectorAll('[data-perm-delete-page]').forEach(btn => {
        on(btn, 'click', () => {
          if (window.DevVaultModal) {
            window.DevVaultModal.confirm(
              'Permanently Delete',
              'Halaman dan seluruh bloknya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
              async () => {
                try {
                  const { error } = await window.DevVaultAPI.permanentDeletePage(btn.dataset.permDeletePage);
                  if (error) throw error;
                  window.DevVaultNotifications.success('halaman berhasil di hapus permanen');
                  await loadTrashList();
                } catch (err) {
                  window.DevVaultNotifications.error('Gagal menghapus halaman', err.message);
                }
              }
            );
          }
        });
      });

    } catch (err) {
      console.error('[Pages] Trash load error:', err);
      list.innerHTML = `<p style="color:var(--color-error);">Failed to load trash.</p>`;
    }
  }

  /* ─── Page Create Modal ─── */

  async function openCreateModal(defaultCategoryId = '') {
    if (!window.DevVaultAuth.requireAdmin()) return;

    editingPageId = null;
    const modal = qs('#page-modal');
    const title = qs('#page-modal-title');
    const form = qs('#page-form');
    const submitBtn = qs('#page-form-submit');
    const btnText = qs('#page-form-btn-text');

    if (!modal) return;

    if (title) title.textContent = 'Create Page';
    if (btnText) btnText.textContent = 'Create Page';
    if (form) form.reset();
    qs('#page-form-id').value = '';
    qs('#page-title-error').textContent = '';

    await populatePageCategoryDropdown(qs('#page-form-category'), defaultCategoryId);

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();
    setTimeout(() => qs('#page-form-title')?.focus(), 100);
  }

  /* ─── Page Edit Modal ─── */

  async function openEditModal(pageId) {
    if (!window.DevVaultAuth.requireAdmin()) return;

    editingPageId = pageId;
    const modal = qs('#page-modal');
    const title = qs('#page-modal-title');
    const btnText = qs('#page-form-btn-text');

    if (!modal) return;

    if (title) title.textContent = 'Edit halaman';
    if (btnText) btnText.textContent = 'Simpan perubahan';

    try {
      const { data, error } = await window.DevVaultAPI.getPageById(pageId);
      if (error || !data) throw error || new Error('Page not found');

      qs('#page-form-id').value = pageId;
      qs('#page-form-title').value = data.title || '';
      qs('#page-form-status').value = data.status || 'draft';
      qs('#page-form-visibility').value = data.visibility || 'public';
      qs('#page-form-description').value = data.description || '';
      qs('#page-title-error').textContent = '';

      await populatePageCategoryDropdown(qs('#page-form-category'), data.category_id);

      show(modal, 'flex');
      window.DevVaultUtils.lockScroll();
      setTimeout(() => qs('#page-form-title')?.focus(), 100);
    } catch (err) {
      window.DevVaultNotifications.error('Failed to load page', err.message);
    }
  }

  async function populatePageCategoryDropdown(select, selectedId = '') {
    if (!select) return;
    try {
      const { data } = await window.DevVaultAPI.getCategories();
      const cats = data || [];
      select.innerHTML = `<option value="">No category</option>` +
        cats.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${sanitize(c.name)}</option>`).join('');
    } catch {}
  }

  /* ─── Handle Page Form Submit ─── */

  async function handlePageFormSubmit(e) {
    e.preventDefault();

    if (!window.DevVaultAuth.isAdmin()) {
      window.DevVaultAuth.showLoginModal();
      return;
    }

    const title = qs('#page-form-title')?.value?.trim() || '';
    const titleError = qs('#page-title-error');

    if (!title) {
      if (titleError) titleError.textContent = 'Title is required';
      return;
    }
    if (titleError) titleError.textContent = '';

    const payload = {
      title,
      category_id: qs('#page-form-category')?.value || null,
      status: qs('#page-form-status')?.value || 'draft',
      visibility: qs('#page-form-visibility')?.value || 'public',
      description: qs('#page-form-description')?.value?.trim() || '',
    };

    const submitBtn = qs('#page-form-submit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingPageId) {
        const { error } = await window.DevVaultAPI.updatePage(editingPageId, payload);
        if (error) throw error;
        window.DevVaultNotifications.success('Page updated');
        window.DevVaultNotifications.addNotification('Page updated', 'success', title);
      } else {
        const { data, error } = await window.DevVaultAPI.createPage(payload);
        if (error) throw error;
        window.DevVaultNotifications.success('Page created');
        window.DevVaultNotifications.addNotification('halaman baru di buat', 'success', title);

        // Navigate to new page
        if (data) {
          closePageModal();
          window.DevVaultSidebar?.loadSidebarData();
          window.location.hash = `#/${data.id}`;
          return;
        }
      }

      closePageModal();
      window.DevVaultSidebar?.loadSidebarData();

      // Refresh current view
      if (window.DevVaultRouter) {
        window.DevVaultRouter.navigate(window.DevVaultUtils.getCurrentRoute(), true);
      }
    } catch (err) {
      console.error('[Pages] Save page error:', err);
      window.DevVaultNotifications.error('Failed to save page', err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /* ─── Toggle Pin ─── */

  async function togglePinPage(pageId) {
    if (!window.DevVaultAuth.requireAdmin()) return;
    try {
      const { data } = await window.DevVaultAPI.getPageById(pageId);
      if (!data) return;
      const { error } = await window.DevVaultAPI.updatePage(pageId, { pinned: !data.pinned });
      if (error) throw error;
      window.DevVaultNotifications.success(data.pinned ? 'Page unpinned' : 'Page pinned');
      if (window.DevVaultRouter) {
        window.DevVaultRouter.navigate(window.DevVaultUtils.getCurrentRoute(), true);
      }
    } catch (err) {
      window.DevVaultNotifications.error('Failed to update page', err.message);
    }
  }

  /* ─── Delete Page ─── */

  function deletePageConfirm(pageId) {
    if (window.DevVaultModal) {
      window.DevVaultModal.confirm(
        'Move to Trash',
        'Halaman ini akan dipindahkan ke tempat sampah. Anda dapat memulihkannya nanti dari bagian Sampah.',
        async () => {
          try {
            const { error } = await window.DevVaultAPI.softDeletePage(pageId);
            if (error) throw error;
            window.DevVaultNotifications.success('Page moved to trash');
            window.DevVaultNotifications.addNotification('Page moved to trash', 'info');
            window.DevVaultSidebar?.loadSidebarData();

            // Close tab if open
            if (window.DevVaultState) {
              window.DevVaultState.closeTab(pageId);
            }

            window.location.hash = '#/dashboard';
          } catch (err) {
            window.DevVaultNotifications.error('Failed to delete page', err.message);
          }
        }
      );
    }
  }

  /* ─── Close Page Modal ─── */

  function closePageModal() {
    const modal = qs('#page-modal');
    if (modal) hide(modal);
    window.DevVaultUtils.unlockScroll();
    editingPageId = null;
  }

  /* ─── Initialize ─── */

  function init() {
    // Page form submit
    const pageForm = qs('#page-form');
    if (pageForm) on(pageForm, 'submit', handlePageFormSubmit);

    // Close modal buttons
    document.querySelectorAll('[data-modal="page-modal"].modal-close').forEach(btn => {
      on(btn, 'click', closePageModal);
    });

    const pageModal = qs('#page-modal');
    if (pageModal) {
      on(pageModal, 'click', (e) => {
        if (e.target === pageModal) closePageModal();
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = qs('#page-modal');
        if (modal && modal.style.display !== 'none') closePageModal();
      }
    });
  }

  /* ─── Public API ─── */
  return {
    init,
    renderDashboard,
    renderPage,
    renderCategoriesPage,
    renderTrashPage,
    openCreateModal,
    openEditModal,
    closePageModal,
    deletePageConfirm,
    get currentPage() { return currentPage; },
  };
})();

/* ─── Categories Sub-module ─── */
window.DevVaultCategories = (function () {
  const { qs, sanitize, show, hide, on } = window.DevVaultUtils;

  let editingCategoryId = null;

  function openCreateModal() {
    if (!window.DevVaultAuth.requireAdmin()) return;
    editingCategoryId = null;
    const modal = qs('#category-modal');
    const title = qs('#category-modal-title');
    const form = qs('#category-form');
    const submitBtn = qs('#category-form-submit');

    if (!modal) return;
    if (title) title.textContent = 'Create Category';
    if (submitBtn) submitBtn.textContent = 'Create Category';
    if (form) form.reset();
    qs('#category-form-id').value = '';
    qs('#category-name-error').textContent = '';
    qs('#category-form-color').value = '#38bdf8';

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();
    setTimeout(() => qs('#category-form-name')?.focus(), 100);
  }

  async function openEditModal(catId) {
    if (!window.DevVaultAuth.requireAdmin()) return;
    editingCategoryId = catId;

    const modal = qs('#category-modal');
    const title = qs('#category-modal-title');
    const submitBtn = qs('#category-form-submit');

    if (!modal) return;
    if (title) title.textContent = 'Edit Category';
    if (submitBtn) submitBtn.textContent = 'Save Changes';

    try {
      const { data: cats } = await window.DevVaultAPI.getCategories();
      const cat = (cats || []).find(c => c.id === catId);
      if (!cat) return;

      qs('#category-form-id').value = catId;
      qs('#category-form-name').value = cat.name || '';
      qs('#category-form-icon').value = cat.icon || 'folder';
      qs('#category-form-color').value = cat.color || '#38bdf8';
      qs('#category-name-error').textContent = '';

      show(modal, 'flex');
      window.DevVaultUtils.lockScroll();
    } catch (err) {
      window.DevVaultNotifications.error('Failed to load category', err.message);
    }
  }

  function deleteCategoryConfirm(catId) {
    if (window.DevVaultModal) {
      window.DevVaultModal.confirm(
        'Delete Category',
        'Menghapus kategori ini tidak akan menghapus halamannya. Halaman akan menjadi tanpa kategori.',
        async () => {
          try {
            const { error } = await window.DevVaultAPI.deleteCategory(catId);
            if (error) throw error;
            window.DevVaultNotifications.success('Category deleted');
            window.DevVaultSidebar?.loadSidebarData();
            if (window.DevVaultRouter) {
              window.DevVaultRouter.navigate(window.DevVaultUtils.getCurrentRoute(), true);
            }
          } catch (err) {
            window.DevVaultNotifications.error('Failed to delete category', err.message);
          }
        }
      );
    }
  }

  async function handleCategoryFormSubmit(e) {
    e.preventDefault();

    if (!window.DevVaultAuth.isAdmin()) {
      window.DevVaultAuth.showLoginModal();
      return;
    }

    const name = qs('#category-form-name')?.value?.trim() || '';
    const nameError = qs('#category-name-error');

    if (!name) {
      if (nameError) nameError.textContent = 'Name is required';
      return;
    }
    if (nameError) nameError.textContent = '';

    const payload = {
      name,
      icon: qs('#category-form-icon')?.value?.trim() || 'folder',
      color: qs('#category-form-color')?.value || '#38bdf8',
    };

    const submitBtn = qs('#category-form-submit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingCategoryId) {
        const { error } = await window.DevVaultAPI.updateCategory(editingCategoryId, payload);
        if (error) throw error;
        window.DevVaultNotifications.success('Category updated');
        window.DevVaultNotifications.addNotification('Category updated', 'success', name);
      } else {
        const { error } = await window.DevVaultAPI.createCategory(payload);
        if (error) throw error;
        window.DevVaultNotifications.success('Category created');
        window.DevVaultNotifications.addNotification('Category created', 'success', name);
      }

      closeCategoryModal();
      window.DevVaultSidebar?.loadSidebarData();
      if (window.DevVaultRouter) {
        window.DevVaultRouter.navigate(window.DevVaultUtils.getCurrentRoute(), true);
      }
    } catch (err) {
      window.DevVaultNotifications.error('Failed to save category', err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function closeCategoryModal() {
    const modal = qs('#category-modal');
    if (modal) hide(modal);
    window.DevVaultUtils.unlockScroll();
    editingCategoryId = null;
  }

  function init() {
    const catForm = qs('#category-form');
    if (catForm) on(catForm, 'submit', handleCategoryFormSubmit);

    document.querySelectorAll('[data-modal="category-modal"].modal-close').forEach(btn => {
      on(btn, 'click', closeCategoryModal);
    });

    const catModal = qs('#category-modal');
    if (catModal) {
      on(catModal, 'click', (e) => {
        if (e.target === catModal) closeCategoryModal();
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = qs('#category-modal');
        if (modal && modal.style.display !== 'none') closeCategoryModal();
      }
    });
  }

  return {
    init,
    openCreateModal,
    openEditModal,
    closeCategoryModal,
    deleteCategoryConfirm,
  };
})();

/* ─── Confirm Modal Helper ─── */
window.DevVaultModal = (function () {
  const { qs, show, hide, sanitize, on } = window.DevVaultUtils;

  let confirmCallback = null;

  function confirm(title, message, onConfirm) {
    confirmCallback = onConfirm;
    const modal = qs('#confirm-modal');
    const titleEl = qs('#confirm-modal-title');
    const msgEl = qs('#confirm-modal-message');

    if (!modal) {
      if (window.confirm(message)) onConfirm();
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();
  }

  function init() {
    const okBtn = qs('#confirm-modal-ok');
    if (okBtn) {
      on(okBtn, 'click', () => {
        hide(qs('#confirm-modal'));
        window.DevVaultUtils.unlockScroll();
        if (confirmCallback) {
          confirmCallback();
          confirmCallback = null;
        }
      });
    }

    document.querySelectorAll('[data-modal="confirm-modal"].modal-close').forEach(btn => {
      on(btn, 'click', () => {
        hide(qs('#confirm-modal'));
        window.DevVaultUtils.unlockScroll();
        confirmCallback = null;
      });
    });

    const confirmModal = qs('#confirm-modal');
    if (confirmModal) {
      on(confirmModal, 'click', (e) => {
        if (e.target === confirmModal) {
          hide(confirmModal);
          window.DevVaultUtils.unlockScroll();
          confirmCallback = null;
        }
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = qs('#confirm-modal');
        if (modal && modal.style.display !== 'none') {
          hide(modal);
          window.DevVaultUtils.unlockScroll();
          confirmCallback = null;
        }
      }
    });
  }

  return { init, confirm };
})();
