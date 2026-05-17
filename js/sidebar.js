/* ============================================================
   DevVault - Sidebar System
   js/sidebar.js
   ============================================================ */

'use strict';

window.DevVaultSidebar = (function () {
  const {
    qs, qsa, show, hide, on, toggle, addClass, removeClass,
    lsGet, lsSet, sanitize, renderIcon, initIcons
  } = window.DevVaultUtils;

  /* ─── State ─── */
  let isOpen = false;
  let categories = [];
  let pages = [];
  let expandedCategories = new Set();
  let activeRoute = '';

  /* ─── DOM References ─── */
  const getSidebar = () => qs('#sidebar');
  const getOverlay = () => qs('#sidebar-overlay');
  const getToggleBtn = () => qs('#sidebar-toggle');
  const getCloseBtn = () => qs('#sidebar-close-btn');
  const getCategoriesContainer = () => qs('#sidebar-categories');

  /* ─── Open/Close ─── */

  function open() {
    const sidebar = getSidebar();
    const overlay = getOverlay();
    const toggleBtn = getToggleBtn();

    if (sidebar) addClass(sidebar, 'open');
    if (overlay) addClass(overlay, 'active');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    isOpen = true;
    lsSet('sidebar_open', true);
  }

  function close() {
    const sidebar = getSidebar();
    const overlay = getOverlay();
    const toggleBtn = getToggleBtn();

    if (sidebar) removeClass(sidebar, 'open');
    if (overlay) removeClass(overlay, 'active');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    isOpen = false;
    lsSet('sidebar_open', false);
  }

  function toggleSidebar() {
    if (isOpen) close();
    else open();
  }

  /* ─── Category Expand/Collapse ─── */

  function toggleCategory(categoryId) {
    if (expandedCategories.has(categoryId)) {
      expandedCategories.delete(categoryId);
    } else {
      expandedCategories.add(categoryId);
    }
    lsSet('sidebar_expanded_cats', Array.from(expandedCategories));
    renderCategoryPages(categoryId);
  }

  function renderCategoryPages(categoryId) {
    const pagesEl = qs(`#sidebar-cat-pages-${categoryId}`);
    const chevron = qs(`#sidebar-cat-chevron-${categoryId}`);
    if (!pagesEl) return;

    const expanded = expandedCategories.has(categoryId);
    pagesEl.style.display = expanded ? 'block' : 'none';
    if (chevron) {
      if (expanded) addClass(chevron, 'expanded');
      else removeClass(chevron, 'expanded');
    }
  }

  /* ─── Render Categories ─── */

  function renderCategories(data, pagesData) {
    categories = data || [];
    pages = pagesData || [];

    const container = getCategoriesContainer();
    if (!container) return;

    if (categories.length === 0) {
      container.innerHTML = `
        <div style="padding: 8px 12px; color: var(--color-text-muted); font-size: 0.75rem;">
          No categories yet
        </div>
      `;
      return;
    }

    const isAdmin = window.DevVaultAuth && window.DevVaultAuth.isAdmin();

    container.innerHTML = categories.map(cat => {
      const catPages = pages.filter(p =>
        p.category_id === cat.id &&
        !p.deleted_at &&
        (isAdmin || (p.status === 'published' && p.visibility === 'public'))
      );

      const expanded = expandedCategories.has(cat.id);
      const iconName = cat.icon || 'folder';
      const catColor = cat.color || 'var(--color-accent)';

      return `
        <div class="sidebar-category-item" data-category-id="${cat.id}">
          <div class="sidebar-category-header" role="button" tabindex="0"
            aria-expanded="${expanded}"
            aria-label="${sanitize(cat.name)} category"
            data-cat-toggle="${cat.id}">
            <i data-lucide="${sanitize(iconName)}" style="width:14px;height:14px;color:${sanitize(catColor)};" aria-hidden="true"></i>
            <span style="flex:1;">${sanitize(cat.name)}</span>
            <span style="font-size:0.7rem;color:var(--color-text-muted);">${catPages.length}</span>
            <svg id="sidebar-cat-chevron-${cat.id}" class="category-chevron ${expanded ? 'expanded' : ''}"
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
            ${isAdmin ? `
              <button class="icon-btn" style="width:20px;height:20px;margin-left:4px;" data-edit-cat="${cat.id}" aria-label="Edit category">
                <i data-lucide="more-horizontal" style="width:12px;height:12px;" aria-hidden="true"></i>
              </button>
            ` : ''}
          </div>
          <div id="sidebar-cat-pages-${cat.id}" class="sidebar-category-pages"
            style="display:${expanded ? 'block' : 'none'};"
            role="group" aria-label="${sanitize(cat.name)} pages">
            ${catPages.length === 0 ? `
              <div style="padding:4px 12px;color:var(--color-text-muted);font-size:0.75rem;font-style:italic;">
                No pages
              </div>
            ` : catPages.map(page => `
              <a href="#/${page.id}"
                class="sidebar-page-item ${activeRoute === '/' + page.id ? 'active' : ''}"
                data-page-id="${page.id}"
                role="treeitem"
                aria-label="${sanitize(page.title)}">
                <i data-lucide="file-text" style="width:12px;height:12px;" aria-hidden="true"></i>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  ${sanitize(page.title)}
                </span>
                ${page.pinned ? `<i data-lucide="pin" style="width:10px;height:10px;color:var(--color-warning);" aria-hidden="true"></i>` : ''}
                <span class="page-status-dot ${page.status}" title="${page.status}" aria-hidden="true"></span>
              </a>
            `).join('')}
            ${isAdmin ? `
              <button class="sidebar-page-item" style="cursor:pointer;border:none;background:none;width:100%;text-align:left;"
                data-add-page-to-cat="${cat.id}" aria-label="Add page to ${sanitize(cat.name)}">
                <i data-lucide="plus" style="width:12px;height:12px;color:var(--color-accent);" aria-hidden="true"></i>
                <span style="color:var(--color-accent);">Add page</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Init lucide icons
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Bind events
    bindCategoryEvents(container);
  }

  function bindCategoryEvents(container) {
    // Category toggle
    container.querySelectorAll('[data-cat-toggle]').forEach(el => {
      on(el, 'click', (e) => {
        if (e.target.closest('[data-edit-cat]') || e.target.closest('[data-add-page-to-cat]')) return;
        const catId = el.dataset.catToggle;
        toggleCategory(catId);
      });
      on(el, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const catId = el.dataset.catToggle;
          toggleCategory(catId);
        }
      });
    });

    // Edit category (admin)
    container.querySelectorAll('[data-edit-cat]').forEach(btn => {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        const catId = btn.dataset.editCat;
        if (window.DevVaultCategories) {
          window.DevVaultCategories.openEditModal(catId);
        }
      });
    });

    // Add page to category (admin)
    container.querySelectorAll('[data-add-page-to-cat]').forEach(btn => {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        const catId = btn.dataset.addPageToCat;
        if (window.DevVaultPages) {
          window.DevVaultPages.openCreateModal(catId);
        }
      });
    });

    // Page links - close sidebar on mobile
    container.querySelectorAll('.sidebar-page-item[data-page-id]').forEach(link => {
      on(link, 'click', () => {
        if (window.innerWidth <= 1024) close();
      });
    });
  }

  /* ─── Load Data ─── */

  async function loadSidebarData() {
    const container = getCategoriesContainer();
    if (container) {
      container.innerHTML = `
        <div class="sidebar-skeleton">
          <div class="skeleton-item"></div>
          <div class="skeleton-item"></div>
          <div class="skeleton-item"></div>
        </div>
      `;
    }

    try {
      const isAdmin = window.DevVaultAuth && window.DevVaultAuth.isAdmin();
      const [catsResult, pagesResult] = await Promise.all([
        window.DevVaultAPI.getCategories(),
        window.DevVaultAPI.getPages(isAdmin),
      ]);

      renderCategories(catsResult.data || [], pagesResult.data || []);

      // Show/hide admin add category button
      const addCatBtn = qs('#add-category-btn');
      if (addCatBtn) addCatBtn.style.display = isAdmin ? '' : 'none';

    } catch (err) {
      console.error('[Sidebar] Load error:', err);
      if (container) {
        container.innerHTML = `
          <div style="padding:8px 12px;color:var(--color-error);font-size:0.75rem;">
            Failed to load categories
          </div>
        `;
      }
    }
  }

  /* ─── Set Active Route ─── */

  function setActiveRoute(route) {
    activeRoute = route;

    // Update sidebar nav items
    qsa('.nav-item[data-route]').forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      const isActive = route === itemRoute || route.startsWith(itemRoute + '/');
      item.classList.toggle('active', isActive);
    });

    // Update sidebar page items
    qsa('.sidebar-page-item[data-page-id]').forEach(item => {
      const pageId = item.dataset.pageId;
      item.classList.toggle('active', route === '/' + pageId);
    });

    // Update mobile bottom nav
    qsa('.mobile-nav-item[data-route]').forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      const isActive = route === itemRoute || (itemRoute !== '/dashboard' && route.startsWith(itemRoute));
      item.classList.toggle('active', isActive);
    });

    // Update breadcrumb
    updateBreadcrumb(route);
  }

  /* ─── Update Breadcrumb ─── */

  function updateBreadcrumb(route) {
    const breadcrumb = qs('#breadcrumb');
    if (!breadcrumb) return;

    const routeNames = {
      '/dashboard': 'Dashboard',
      '/snippets': 'Snippets',
      '/categories': 'Categories',
      '/settings': 'Settings',
      '/trash': 'Trash',
    };

    if (routeNames[route]) {
      breadcrumb.innerHTML = `
        <span class="breadcrumb-item">DevVault</span>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <span class="breadcrumb-item">${sanitize(routeNames[route])}</span>
      `;
    } else if (route.startsWith('/') && route.length > 1) {
      // Page route - will be updated by pages.js
      breadcrumb.innerHTML = `
        <span class="breadcrumb-item">DevVault</span>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <span class="breadcrumb-item">Page</span>
      `;
    } else {
      breadcrumb.innerHTML = `<span class="breadcrumb-item">DevVault</span>`;
    }
  }

  function setBreadcrumbPage(page) {
    const breadcrumb = qs('#breadcrumb');
    if (!breadcrumb) return;

    const catName = page.categories?.name || '';
    let html = `<span class="breadcrumb-item">DevVault</span>`;
    if (catName) {
      html += `<span class="breadcrumb-sep" aria-hidden="true">/</span>
               <span class="breadcrumb-item">${sanitize(catName)}</span>`;
    }
    html += `<span class="breadcrumb-sep" aria-hidden="true">/</span>
             <span class="breadcrumb-item">${sanitize(page.title)}</span>`;
    breadcrumb.innerHTML = html;
  }

  /* ─── Initialize ─── */

  function init() {
    // Restore expanded categories from storage
    const savedExpanded = lsGet('sidebar_expanded_cats', []);
    expandedCategories = new Set(savedExpanded);

    // Bind toggle button
    const toggleBtn = getToggleBtn();
    if (toggleBtn) on(toggleBtn, 'click', toggleSidebar);

    // Bind close button (mobile)
    const closeBtn = getCloseBtn();
    if (closeBtn) on(closeBtn, 'click', close);

    // Bind overlay click
    const overlay = getOverlay();
    if (overlay) on(overlay, 'click', close);

    // Bind add category button (admin)
    const addCatBtn = qs('#add-category-btn');
    if (addCatBtn) {
      on(addCatBtn, 'click', () => {
        if (window.DevVaultCategories) {
          window.DevVaultCategories.openCreateModal();
        }
      });
    }

    // Bind search trigger
    const searchTrigger = qs('#sidebar-search-trigger');
    if (searchTrigger) {
      on(searchTrigger, 'click', () => {
        if (window.DevVaultSearch) window.DevVaultSearch.openSearch();
      });
      on(searchTrigger, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (window.DevVaultSearch) window.DevVaultSearch.openSearch();
        }
      });
    }

    // Handle responsive - close on nav links on mobile
    qsa('.nav-item[data-route]').forEach(item => {
      on(item, 'click', () => {
        if (window.innerWidth <= 1024) close();
      });
    });

    qsa('.nav-item-sm[data-route]').forEach(item => {
      on(item, 'click', () => {
        if (window.innerWidth <= 1024) close();
      });
    });

    // Load data
    loadSidebarData();
  }

  /* ─── Public API ─── */
  return {
    init,
    open,
    close,
    toggleSidebar,
    loadSidebarData,
    renderCategories,
    setActiveRoute,
    setBreadcrumbPage,
    get isOpen() { return isOpen; },
  };
})();
