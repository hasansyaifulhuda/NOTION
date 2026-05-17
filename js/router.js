/* ============================================================
   DevVault - SPA Hash Router
   js/router.js
   ============================================================ */

'use strict';

window.DevVaultRouter = (function () {
  const { qs, show, hide, parseRoute } = window.DevVaultUtils;

  /* ─── State ─── */
  let currentRoute = '';
  let isNavigating = false;

  /* ─── Route Definitions ─── */
  const STATIC_ROUTES = {
    '/dashboard': renderDashboardRoute,
    '/snippets': renderSnippetsRoute,
    '/categories': renderCategoriesRoute,
    '/settings': renderSettingsRoute,
    '/trash': renderTrashRoute,
  };

  /* ─── Get Main Content Container ─── */
  function getContainer() {
    return qs('#main-content');
  }

  /* ─── Navigate ─── */

  function navigate(route, force = false) {
    if (!route || route === '#') route = '/dashboard';
    if (route.startsWith('#')) route = route.substring(1);
    if (!route.startsWith('/')) route = '/' + route;

    if (route === currentRoute && !force) return;

    currentRoute = route;

    // Update hash without triggering hashchange
    const newHash = `#${route}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }

    // Update sidebar active state
    if (window.DevVaultSidebar) {
      window.DevVaultSidebar.setActiveRoute(route);
    }

    // Reset scroll
    const container = getContainer();
    if (container) container.scrollTop = 0;

    // Clear TOC
    if (window.DevVaultTOC) window.DevVaultTOC.clear();

    // Render route
    renderRoute(route);
  }

  /* ─── Render Route ─── */

  async function renderRoute(route) {
    if (isNavigating) return;
    isNavigating = true;

    const container = getContainer();
    if (!container) {
      isNavigating = false;
      return;
    }

    // Show loading
    showLoading(container);

    try {
      // Check static routes
      const handler = STATIC_ROUTES[route];
      if (handler) {
        document.title = getRouteTitle(route);
        await handler(container);
      } else if (isPageRoute(route)) {
        // Page route: /page-id
        const pageId = route.substring(1);
        document.title = 'Loading... - DevVault';
        await renderPageRoute(container, pageId);
      } else {
        // 404
        render404(container);
      }
    } catch (err) {
      console.error('[Router] Route render error:', err);
      renderError(container, err);
    } finally {
      isNavigating = false;
      // Init lucide icons after render
      if (window.lucide) {
        try { window.lucide.createIcons(); } catch {}
      }
    }
  }

  /* ─── Route Handlers ─── */

  async function renderDashboardRoute(container) {
    if (window.DevVaultPages) {
      await window.DevVaultPages.renderDashboard(container);
    }
  }

  async function renderSnippetsRoute(container) {
    if (window.DevVaultSnippets) {
      await window.DevVaultSnippets.renderSnippetsPage(container);
    }
    // Prism highlighting
    setTimeout(() => {
      if (window.Prism) {
        try { window.Prism.highlightAll(); } catch {}
      }
    }, 100);
  }

  async function renderCategoriesRoute(container) {
    if (window.DevVaultPages) {
      await window.DevVaultPages.renderCategoriesPage(container);
    }
  }

  async function renderSettingsRoute(container) {
    if (window.DevVaultSettings) {
      await window.DevVaultSettings.renderSettingsPage(container);
    }
  }

  async function renderTrashRoute(container) {
    if (!window.DevVaultAuth?.isAdmin()) {
      window.DevVaultAuth.showLoginModal();
      navigate('/dashboard');
      return;
    }
    if (window.DevVaultPages) {
      await window.DevVaultPages.renderTrashPage(container);
    }
  }

  async function renderPageRoute(container, pageId) {
    if (window.DevVaultPages) {
      await window.DevVaultPages.renderPage(pageId, container);
    }
    // Prism highlighting
    setTimeout(() => {
      if (window.Prism) {
        try { window.Prism.highlightAll(); } catch {}
      }
    }, 100);
  }

  /* ─── Loading ─── */

  function showLoading(container) {
    container.innerHTML = `
      <div class="loading-overlay" style="min-height:400px;" aria-live="assertive" aria-label="Loading">
        <div class="loading-spinner" aria-hidden="true"></div>
        <span>Loading...</span>
      </div>
    `;
  }

  /* ─── Error States ─── */

  function render404(container) {
    container.innerHTML = `
      <div class="page-view">
        <div class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="map-off" aria-hidden="true"></i>
          </div>
          <p class="empty-state-title">Page Not Found</p>
          <p class="empty-state-desc">The route you're looking for doesn't exist.</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">
            Go to Dashboard
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    document.title = '404 - DevVault';
  }

  function renderError(container, err) {
    container.innerHTML = `
      <div class="page-view">
        <div class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="alert-circle" aria-hidden="true"></i>
          </div>
          <p class="empty-state-title">Something went wrong</p>
          <p class="empty-state-desc">${window.DevVaultUtils.sanitize(err?.message || 'Unknown error occurred')}</p>
          <button class="btn btn-primary" onclick="window.location.hash='#/dashboard'">
            Go to Dashboard
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
  }

  /* ─── Helpers ─── */

  function isPageRoute(route) {
    // A page route is any route that isn't a known static route
    return route.length > 1 && !Object.keys(STATIC_ROUTES).includes(route);
  }

  function getRouteTitle(route) {
    const titles = {
      '/dashboard': 'Dashboard - DevVault',
      '/snippets': 'Snippets - DevVault',
      '/categories': 'Categories - DevVault',
      '/settings': 'Settings - DevVault',
      '/trash': 'Trash - DevVault',
    };
    return titles[route] || 'DevVault';
  }

  /* ─── Initialize ─── */

  function init() {
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const route = parseRoute(window.location.hash);
      navigate(route);
    });

    // Handle initial route
    const initialRoute = parseRoute(window.location.hash) || '/dashboard';
    navigate(initialRoute);
  }

  /* ─── Public API ─── */
  return {
    init,
    navigate,
    get currentRoute() { return currentRoute; },
  };
})();

/* ─── Tab System ─── */
window.DevVaultState = (function () {
  const { qs, lsGet, lsSet, sanitize } = window.DevVaultUtils;

  let tabs = [];
  let activeTabId = null;

  function loadTabs() {
    tabs = lsGet('open_tabs', []);
    activeTabId = lsGet('active_tab', null);
    renderTabs();
  }

  function addTab(tabData) {
    const { id, title, route } = tabData;

    // Check if tab already exists
    const existing = tabs.find(t => t.id === id);
    if (existing) {
      setActiveTab(id);
      return;
    }

    // Limit max tabs
    if (tabs.length >= 8) {
      tabs.shift();
    }

    tabs.push({ id, title, route, unsaved: false });
    activeTabId = id;
    lsSet('open_tabs', tabs);
    lsSet('active_tab', activeTabId);
    renderTabs();
  }

  function closeTab(id) {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;

    tabs.splice(idx, 1);

    if (activeTabId === id) {
      if (tabs.length > 0) {
        activeTabId = tabs[Math.max(0, idx - 1)].id;
      } else {
        activeTabId = null;
      }
    }

    lsSet('open_tabs', tabs);
    lsSet('active_tab', activeTabId);
    renderTabs();
  }

  function setActiveTab(id) {
    activeTabId = id;
    lsSet('active_tab', id);
    renderTabs();
  }

  function clearTabs() {
    tabs = [];
    activeTabId = null;
    lsSet('open_tabs', []);
    lsSet('active_tab', null);
    renderTabs();
  }

  function renderTabs() {
    const container = qs('#tabs-container');
    if (!container) return;

    if (tabs.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = tabs.map(tab => `
      <div class="tab-item ${tab.id === activeTabId ? 'active' : ''}"
        data-tab-id="${tab.id}"
        role="tab"
        aria-selected="${tab.id === activeTabId}"
        tabindex="0"
        aria-label="${sanitize(tab.title)} tab">
        ${tab.unsaved ? `<div class="tab-unsaved" aria-label="Unsaved changes"></div>` : ''}
        <span class="tab-title">${sanitize(tab.title)}</span>
        <span class="tab-close" data-tab-close="${tab.id}" role="button" aria-label="Close ${sanitize(tab.title)} tab" tabindex="0">
          <i data-lucide="x" aria-hidden="true"></i>
        </span>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Bind tab events
    container.querySelectorAll('.tab-item').forEach(tab => {
      window.DevVaultUtils.on(tab, 'click', (e) => {
        if (e.target.closest('[data-tab-close]')) return;
        const tabId = tab.dataset.tabId;
        const tabData = tabs.find(t => t.id === tabId);
        if (tabData) {
          setActiveTab(tabId);
          window.location.hash = `#${tabData.route}`;
        }
      });

      window.DevVaultUtils.on(tab, 'keydown', (e) => {
        if (e.key === 'Enter') {
          const tabId = tab.dataset.tabId;
          const tabData = tabs.find(t => t.id === tabId);
          if (tabData) {
            setActiveTab(tabId);
            window.location.hash = `#${tabData.route}`;
          }
        }
      });
    });

    container.querySelectorAll('[data-tab-close]').forEach(closeBtn => {
      window.DevVaultUtils.on(closeBtn, 'click', (e) => {
        e.stopPropagation();
        closeTab(closeBtn.dataset.tabClose);
      });
      window.DevVaultUtils.on(closeBtn, 'keydown', (e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          closeTab(closeBtn.dataset.tabClose);
        }
      });
    });
  }

  function isAdmin() {
    return window.DevVaultAuth ? window.DevVaultAuth.isAdmin() : false;
  }

  return {
    loadTabs,
    addTab,
    closeTab,
    setActiveTab,
    clearTabs,
    renderTabs,
    isAdmin,
    get tabs() { return tabs; },
    get activeTabId() { return activeTabId; },
  };
})();
