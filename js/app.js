/* ============================================================
   DevVault - Application Initialization
   js/app.js
   ============================================================ */

'use strict';

(function () {

  /* ─── Application Bootstrap ─── */

  async function initApp() {

    try {
      // 1. Initialize settings (theme, etc.) - must be first to avoid flash
      if (window.DevVaultSettings) {
        window.DevVaultSettings.init();
      }

      // 2. Initialize notifications system
      if (window.DevVaultNotifications) {
        window.DevVaultNotifications.init();
      }

      // 3. Initialize auth system
      if (window.DevVaultAuth) {
        window.DevVaultAuth.init();
      }

      // 4. Initialize sub-modules that don't need auth
      if (window.DevVaultModal) window.DevVaultModal.init();
      if (window.DevVaultCategories) window.DevVaultCategories.init();
      if (window.DevVaultPages) window.DevVaultPages.init();
      if (window.DevVaultBlocks) window.DevVaultBlocks.init();
      if (window.DevVaultSnippets) window.DevVaultSnippets.init();

      // 5. Initialize sidebar
      if (window.DevVaultSidebar) {
        window.DevVaultSidebar.init();
      }

      // 6. Initialize search
      if (window.DevVaultSearch) {
        window.DevVaultSearch.init();
      }

      // 7. Initialize shortcuts (after other systems ready)
      if (window.DevVaultShortcuts) {
        window.DevVaultShortcuts.init();
      }

      // 8. Load saved tabs
      if (window.DevVaultState) {
        window.DevVaultState.loadTabs();
      }

      // 9. Restore auth session
      if (window.DevVaultAuth) {
        await window.DevVaultAuth.restoreSession();
      }

      // 10. Initialize router (triggers initial route render)
      if (window.DevVaultRouter) {
        window.DevVaultRouter.init();
      }

      // 11. Initialize Supabase auth state listener (if available)
      setupSupabaseAuthListener();

    } catch (err) {
      console.error('[DevVault] Critical initialization error:', err);
      showCriticalError(err);
    }
  }

  /* ─── Supabase Auth State Listener ─── */

  function setupSupabaseAuthListener() {
    if (!window.supabaseClient) return;

    window.DevVaultAuth?.onAuthChange((user) => {
      // Sync admin UI elements
      const adminEls = document.querySelectorAll('.admin-only');
      const guestEls = document.querySelectorAll('.guest-only');
      const isAdmin = !!user;

      adminEls.forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
      });
      guestEls.forEach(el => {
        el.style.display = isAdmin ? 'none' : '';
      });

      // Reload sidebar data when auth changes
      if (window.DevVaultSidebar) {
        window.DevVaultSidebar.loadSidebarData();
      }

      // Update notification visibility
      const notifWrapper = document.querySelector('#notification-btn-wrapper');
      if (notifWrapper) {
        notifWrapper.style.display = isAdmin ? '' : 'none';
      }
    });
  }

  /* ─── Critical Error Fallback ─── */

  function showCriticalError(err) {
    const main = document.querySelector('#main-content');
    if (main) {
      main.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 32px;
          text-align: center;
          gap: 16px;
        ">
          <div style="
            width: 56px; height: 56px;
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.3);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            color: #ef4444; font-size: 24px;
          ">⚠</div>
          <h2 style="color: #f8fafc; font-size: 1.25rem; font-weight: 600;">
            Application Failed to Load
          </h2>
          <p style="color: #94a3b8; font-size: 0.875rem; max-width: 400px;">
            ${err?.message || 'An unexpected error occurred during initialization.'}
          </p>
          <p style="color: #64748b; font-size: 0.75rem;">
            Check the browser console for details, or try refreshing the page.
          </p>
          <button
            onclick="window.location.reload()"
            style="
              background: #38bdf8; color: #0b1120;
              border: none; border-radius: 6px;
              padding: 8px 16px; font-size: 0.875rem;
              font-weight: 600; cursor: pointer;
            ">
            Reload Page
          </button>
        </div>
      `;
    }
  }

  /* ─── DOM Ready Check ─── */

  function onSupabaseReady() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }

  /* ─── Wait for Supabase ─── */

  if (window.isSupabaseConfigured) {
    // Supabase is being loaded - wait for ready event
    document.addEventListener('supabase:ready', onSupabaseReady);

    // Safety timeout in case supabase:ready never fires
    setTimeout(() => {
      if (!document.querySelector('#main-content')?.children?.length ||
          document.querySelector('#main-content')?.querySelector('.loading-overlay')) {
        console.warn('[DevVault] Supabase ready timeout - initializing anyway');
        onSupabaseReady();
      }
    }, 5000);
  } else {
    // No Supabase - initialize immediately when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      // supabase.js dispatches supabase:ready after DOMContentLoaded
      document.addEventListener('supabase:ready', initApp);
      // Fallback: also listen for DOMContentLoaded
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (!window._appInitialized) initApp();
        }, 100);
      });
    }

    // Mark as initialized to prevent double init
    document.addEventListener('supabase:ready', () => {
      window._appInitialized = true;
    });
  }

})();
