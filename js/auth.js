/* ============================================================
   DevVault - Authentication System
   js/auth.js
   ============================================================ */

'use strict';

window.DevVaultAuth = (function () {
  const {
    qs, show, hide, toggle, on, lsGet, lsSet, lsRemove,
    isValidEmail, isNonEmpty, lockScroll, unlockScroll, sanitize
  } = window.DevVaultUtils;

  /* ─── State ─── */
  let currentUser = null;
  let authLoading = false;
  let authCallbacks = [];

  /* ─── DOM References ─── */
  const getLoginModal = () => qs('#login-modal');
  const getLoginForm = () => qs('#login-form');
  const getLoginEmailInput = () => qs('#login-email');
  const getLoginPasswordInput = () => qs('#login-password');
  const getLoginEmailError = () => qs('#login-email-error');
  const getLoginPasswordError = () => qs('#login-password-error');
  const getLoginGeneralError = () => qs('#login-general-error');
  const getLoginBtnText = () => qs('#login-btn-text');
  const getLoginBtnLoading = () => qs('#login-btn-loading');
  const getLoginSubmitBtn = () => qs('#login-submit-btn');
  const getLoginWarning = () => qs('#login-supabase-warning');

  /* ─── Auth State ─── */

  function isAdmin() {
    return currentUser !== null;
  }

  function getUser() {
    return currentUser;
  }

  function getUserEmail() {
    return currentUser?.email || 'Guest';
  }

  /* ─── Auth Callbacks ─── */

  function onAuthChange(callback) {
    authCallbacks.push(callback);
  }

  function dispatchAuthChange(user) {
    authCallbacks.forEach(cb => {
      try { cb(user); } catch (e) { console.error('[Auth] Callback error:', e); }
    });
  }

  /* ─── UI Sync ─── */

  function syncAuthUI(user) {
    const isAdminUser = !!user;

    // Update user badge
    const emailEl = qs('#user-email');
    const roleEl = qs('#user-role');
    if (emailEl) emailEl.textContent = user ? (user.email || 'Admin') : 'Guest';
    if (roleEl) roleEl.textContent = isAdminUser ? 'Admin' : 'Reader';

    // Admin-only elements
    const adminEls = document.querySelectorAll('.admin-only');
    adminEls.forEach(el => {
      el.style.display = isAdminUser ? '' : 'none';
    });

    // Guest-only elements
    const guestEls = document.querySelectorAll('.guest-only');
    guestEls.forEach(el => {
      el.style.display = isAdminUser ? 'none' : '';
    });

    // Mobile nav active states
    updateMobileNavActive();
  }

  function updateMobileNavActive() {
    const route = window.location.hash.replace('#', '') || '/dashboard';
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      item.classList.toggle('active', route === itemRoute || route.startsWith(itemRoute + '/'));
    });
  }

  /* ─── Login ─── */

  function showLoginModal() {
    const modal = getLoginModal();
    if (!modal) return;

    // Check Supabase configured
    const warning = getLoginWarning();
    if (warning) {
      toggle(warning, !window.isSupabaseConfigured, 'flex');
    }

    // Reset form
    const form = getLoginForm();
    if (form) form.reset();
    clearLoginErrors();

    show(modal, 'flex');
    lockScroll();

    // Focus email input
    setTimeout(() => {
      const email = getLoginEmailInput();
      if (email) email.focus();
    }, 100);
  }

  function hideLoginModal() {
    const modal = getLoginModal();
    if (!modal) return;
    hide(modal);
    unlockScroll();
    clearLoginErrors();
  }

  function clearLoginErrors() {
    const emailErr = getLoginEmailError();
    const passErr = getLoginPasswordError();
    const genErr = getLoginGeneralError();
    if (emailErr) emailErr.textContent = '';
    if (passErr) passErr.textContent = '';
    if (genErr) { genErr.textContent = ''; hide(genErr); }
  }

  function setLoginLoading(loading) {
    authLoading = loading;
    const submitBtn = getLoginSubmitBtn();
    const btnText = getLoginBtnText();
    const btnLoading = getLoginBtnLoading();
    if (submitBtn) submitBtn.disabled = loading;
    if (btnText) toggle(btnText, !loading, 'inline');
    if (btnLoading) toggle(btnLoading, loading, 'inline');
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (authLoading) return;

    clearLoginErrors();

    const email = getLoginEmailInput()?.value?.trim() || '';
    const password = getLoginPasswordInput()?.value || '';

    // Validate
    let hasError = false;
    const emailErr = getLoginEmailError();
    const passErr = getLoginPasswordError();

    if (!isNonEmpty(email)) {
      if (emailErr) emailErr.textContent = 'Email is required';
      hasError = true;
    } else if (!isValidEmail(email)) {
      if (emailErr) emailErr.textContent = 'Please enter a valid email';
      hasError = true;
    }

    if (!isNonEmpty(password)) {
      if (passErr) passErr.textContent = 'Password is required';
      hasError = true;
    }

    if (hasError) return;

    if (!window.isSupabaseConfigured || !window.supabaseClient) {
      const genErr = getLoginGeneralError();
      if (genErr) {
        genErr.textContent = 'Supabase is not configured. Please set up your Supabase credentials.';
        show(genErr, 'block');
      }
      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        currentUser = data.user;
        syncAuthUI(currentUser);
        dispatchAuthChange(currentUser);
        hideLoginModal();
        window.DevVaultNotifications.success('Welcome back!', data.user.email);
        window.DevVaultNotifications.addNotification('Admin session started', 'success', data.user.email);
        lsSet('last_user_email', data.user.email);

        // Re-render current route with admin privileges
        if (window.DevVaultRouter) {
          window.DevVaultRouter.navigate(window.location.hash.replace('#', '') || '/dashboard', true);
        }
      }
    } catch (err) {
      console.error('[Auth] Login error:', err);
      const genErr = getLoginGeneralError();
      if (genErr) {
        const msg = err.message || 'Login failed. Please check your credentials.';
        genErr.textContent = msg;
        show(genErr, 'block');
      }
    } finally {
      setLoginLoading(false);
    }
  }

  /* ─── Logout ─── */

  async function logout() {
    try {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
      }
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    } finally {
      currentUser = null;
      syncAuthUI(null);
      dispatchAuthChange(null);
      window.DevVaultNotifications.info('Logged out', 'You are now in guest mode');

      // Close any open tabs, go to dashboard
      if (window.DevVaultState) {
        window.DevVaultState.clearTabs();
      }
      if (window.DevVaultRouter) {
        window.DevVaultRouter.navigate('/dashboard');
      }
    }
  }

  /* ─── Session Restore ─── */

  async function restoreSession() {
    if (!window.isSupabaseConfigured || !window.supabaseClient) {
      console.log('[Auth] Supabase not configured - running in guest mode');
      syncAuthUI(null);
      dispatchAuthChange(null);
      return null;
    }

    try {
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        currentUser = session.user;
        console.log('[Auth] Session restored for:', currentUser.email);
        syncAuthUI(currentUser);
        dispatchAuthChange(currentUser);
        return currentUser;
      } else {
        syncAuthUI(null);
        dispatchAuthChange(null);
        return null;
      }
    } catch (err) {
      console.error('[Auth] Session restore error:', err);
      syncAuthUI(null);
      dispatchAuthChange(null);
      return null;
    }
  }

  /* ─── Route Guard ─── */

  function requireAdmin(callback) {
    if (!isAdmin()) {
      window.DevVaultNotifications.warning('Access Denied', 'You need to login as admin to perform this action.');
      showLoginModal();
      return false;
    }
    if (callback) callback();
    return true;
  }

  /* ─── Initialize ─── */

  function init() {
    // Bind login form
    const loginForm = getLoginForm();
    if (loginForm) on(loginForm, 'submit', handleLogin);

    // Bind login button
    const loginBtn = qs('#login-btn');
    if (loginBtn) on(loginBtn, 'click', showLoginModal);

    // Bind logout button
    const logoutBtn = qs('#logout-btn');
    if (logoutBtn) on(logoutBtn, 'click', logout);

    // Bind modal close buttons
    document.querySelectorAll('[data-modal="login-modal"].modal-close').forEach(btn => {
      on(btn, 'click', hideLoginModal);
    });

    // Close modal on overlay click
    const loginModal = getLoginModal();
    if (loginModal) {
      on(loginModal, 'click', (e) => {
        if (e.target === loginModal) hideLoginModal();
      });
    }

    // ESC to close modal
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = getLoginModal();
        if (modal && modal.style.display !== 'none') hideLoginModal();
      }
    });

    // Supabase auth state changes
    if (window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          currentUser = session.user;
          syncAuthUI(currentUser);
        } else if (event === 'SIGNED_OUT') {
          currentUser = null;
          syncAuthUI(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          currentUser = session.user;
        }
      });
    }
  }

  /* ─── Public API ─── */
  return {
    init,
    restoreSession,
    isAdmin,
    getUser,
    getUserEmail,
    showLoginModal,
    hideLoginModal,
    logout,
    requireAdmin,
    onAuthChange,
    syncAuthUI,
  };
})();
