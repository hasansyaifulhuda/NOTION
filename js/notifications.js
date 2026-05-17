/* ============================================================
   DevVault - Notification & Toast System
   js/notifications.js
   ============================================================ */

'use strict';

window.DevVaultNotifications = (function () {
  const { qs, sanitize, show, hide, on, generateId, timeAgo } = window.DevVaultUtils;

  /* ─── State ─── */
  let notifications = [];
  let toastQueue = [];
  let isProcessingToast = false;
  const MAX_TOASTS = 5;
  const MAX_NOTIFICATIONS = 50;

  /* ─── DOM References ─── */
  let toastContainer = null;
  let notifBadge = null;
  let notifList = null;
  let notifCenter = null;

  function initDOMRefs() {
    toastContainer = qs('#toast-container');
    notifBadge = qs('#notif-badge');
    notifList = qs('#notif-list');
    notifCenter = qs('#notification-center');
  }

  /* ─── Toast System ─── */

  const TOAST_ICONS = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info',
  };

  /**
   * Show a toast notification
   * @param {string} title
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
   */
  function toast(title, message = '', type = 'info', duration = 4000) {
    if (!toastContainer) initDOMRefs();

    // Limit max visible toasts
    const existing = toastContainer ? toastContainer.querySelectorAll('.toast') : [];
    if (existing.length >= MAX_TOASTS) {
      const oldest = existing[0];
      if (oldest) removeToast(oldest);
    }

    const id = generateId();
    const icon = TOAST_ICONS[type] || 'info';

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.dataset.id = id;
    toastEl.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${icon}" aria-hidden="true"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${sanitize(title)}</div>
        ${message ? `<div class="toast-msg">${sanitize(message)}</div>` : ''}
      </div>
      <button class="icon-btn toast-close" aria-label="Dismiss notification">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    `;

    if (toastContainer) {
      toastContainer.appendChild(toastEl);
    }

    // Init icons
    if (window.lucide) window.lucide.createIcons({ nodes: [toastEl] });

    // Close on click
    const closeBtn = toastEl.querySelector('.toast-close');
    if (closeBtn) {
      on(closeBtn, 'click', (e) => {
        e.stopPropagation();
        removeToast(toastEl);
      });
    }

    on(toastEl, 'click', () => removeToast(toastEl));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => removeToast(toastEl), duration);
    }

    return id;
  }

  function removeToast(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;
    toastEl.classList.add('removing');
    setTimeout(() => {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }, 250);
  }

  /* ─── Convenience toast methods ─── */
  function success(title, message, duration) {
    return toast(title, message, 'success', duration);
  }

  function error(title, message, duration = 6000) {
    return toast(title, message, 'error', duration);
  }

  function warning(title, message, duration) {
    return toast(title, message, 'warning', duration);
  }

  function info(title, message, duration) {
    return toast(title, message, 'info', duration);
  }

  /* ─── Notification Center (Admin-only) ─── */

  /**
   * Add notification to center
   */
  function addNotification(title, type = 'info', meta = '') {
    if (!window.DevVaultState || !window.DevVaultState.isAdmin()) return;

    const notif = {
      id: generateId(),
      title,
      type,
      meta,
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(notif);
    if (notifications.length > MAX_NOTIFICATIONS) {
      notifications.pop();
    }

    renderNotificationBadge();
    renderNotificationList();
    return notif.id;
  }

  /**
   * Mark all notifications as read
   */
  function markAllRead() {
    notifications.forEach(n => (n.read = true));
    renderNotificationBadge();
    renderNotificationList();
  }

  /**
   * Mark single notification as read
   */
  function markRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    renderNotificationBadge();
    renderNotificationList();
  }

  /**
   * Get unread count
   */
  function getUnreadCount() {
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Render notification badge
   */
  function renderNotificationBadge() {
    if (!notifBadge) initDOMRefs();
    const count = getUnreadCount();
    if (notifBadge) {
      notifBadge.textContent = count > 9 ? '9+' : count;
      notifBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Render notification list
   */
  function renderNotificationList() {
    if (!notifList) initDOMRefs();
    if (!notifList) return;

    if (notifications.length === 0) {
      notifList.innerHTML = `
        <div class="empty-state" style="min-height:140px; padding: 24px;">
          <p style="color:var(--color-text-muted);font-size:0.875rem;">No notifications yet</p>
        </div>
      `;
      return;
    }

    const NOTIF_ICONS = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info',
    };

    const NOTIF_COLORS = {
      success: 'rgba(34,197,94,0.1)',
      error: 'rgba(239,68,68,0.1)',
      warning: 'rgba(245,158,11,0.1)',
      info: 'rgba(56,189,248,0.1)',
    };

    const NOTIF_ICON_COLORS = {
      success: 'var(--color-success)',
      error: 'var(--color-error)',
      warning: 'var(--color-warning)',
      info: 'var(--color-accent)',
    };

    notifList.innerHTML = notifications.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}" role="listitem">
        <div class="notif-item-icon" style="background:${NOTIF_COLORS[n.type] || NOTIF_COLORS.info}; color:${NOTIF_ICON_COLORS[n.type] || NOTIF_ICON_COLORS.info};">
          <i data-lucide="${NOTIF_ICONS[n.type] || 'info'}" aria-hidden="true"></i>
        </div>
        <div class="notif-item-body">
          <div class="notif-item-title">${sanitize(n.title)}</div>
          ${n.meta ? `<div class="notif-item-time" style="color:var(--color-text-muted);font-size:0.75rem;">${sanitize(n.meta)}</div>` : ''}
          <div class="notif-item-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons({ nodes: [notifList] });

    // Bind click handlers
    notifList.querySelectorAll('.notif-item').forEach(item => {
      on(item, 'click', () => {
        markRead(item.dataset.id);
        item.classList.remove('unread');
        renderNotificationBadge();
      });
    });
  }

  /**
   * Toggle notification center panel
   */
  function toggleNotificationCenter() {
    if (!notifCenter) initDOMRefs();
    if (!notifCenter) return;

    const isVisible = notifCenter.style.display !== 'none' && notifCenter.style.display !== '';
    if (isVisible) {
      hide(notifCenter);
    } else {
      show(notifCenter, 'block');
      renderNotificationList();
    }
  }

  /**
   * Hide notification center
   */
  function hideNotificationCenter() {
    if (notifCenter) hide(notifCenter);
  }

  /* ─── Initialize ─── */
  function init() {
    initDOMRefs();

    // Bind mark all read button
    const markAllBtn = qs('#notif-mark-all-read');
    if (markAllBtn) {
      on(markAllBtn, 'click', () => {
        markAllRead();
      });
    }

    // Bind notification button
    const notifBtn = qs('#notification-btn');
    if (notifBtn) {
      on(notifBtn, 'click', (e) => {
        e.stopPropagation();
        toggleNotificationCenter();
      });
    }

    // Close notification center on outside click
    on(document, 'click', (e) => {
      if (notifCenter && notifCenter.style.display !== 'none') {
        if (!notifCenter.contains(e.target) && e.target.id !== 'notification-btn') {
          hideNotificationCenter();
        }
      }
    });
  }

  /* ─── Public API ─── */
  return {
    init,
    toast,
    success,
    error,
    warning,
    info,
    addNotification,
    markAllRead,
    markRead,
    getUnreadCount,
    renderNotificationBadge,
    renderNotificationList,
    toggleNotificationCenter,
    hideNotificationCenter,
  };
})();
