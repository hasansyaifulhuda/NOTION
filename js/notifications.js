/* DEVVAULT - Notification & Toast System */

const Notifications = {
  toastContainer: null,
  notificationPanel: null,
  notifications: [],
  unreadCount: 0,

  init() {
    this.toastContainer = document.getElementById('toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  },

  // Show toast notification
  addToast(message, type = 'info', duration = 4000, title = null) {
    const id = Utils.uid();
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
      info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
    };

    const toastTitle = title || { success: 'Berhasil', error: 'Gagal', warning: 'Peringatan', info: 'Info' }[type];

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = `toast-${id}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${Utils.escapeHtml(toastTitle)}</div>
        <div class="toast-message">${Utils.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" onclick="Notifications.removeToast('${id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
      </button>
    `;

    this.toastContainer.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => this.removeToast(id), duration);
    }

    return id;
  },

  removeToast(id) {
    const el = document.getElementById(`toast-${id}`);
    if (!el) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), 250);
  },

  // Admin notification panel
  async loadNotifications() {
    if (!Auth.isAdmin || !Auth.currentUser) return;
    try {
      this.notifications = await SupabaseAPI.getNotifications(Auth.currentUser.id);
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      this.updateBadge();
      this.renderPanel();
    } catch(e) {
      console.warn('Notification load error:', e);
    }
  },

  updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  },

  renderPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;

    if (this.notifications.length === 0) {
      panel.querySelector('.notification-list').innerHTML = `
        <div class="notification-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:8px;opacity:0.3"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <br>Tidak ada notifikasi
        </div>
      `;
      return;
    }

    const listHtml = this.notifications.slice(0, 20).map(n => `
      <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="Notifications.markRead('${n.id}')">
        <div class="notification-dot ${n.type}"></div>
        <div class="notification-content">
          <div class="notification-title">${Utils.escapeHtml(n.title)}</div>
          ${n.message ? `<div class="notification-message">${Utils.escapeHtml(n.message)}</div>` : ''}
        </div>
        <div class="notification-time">${Utils.timeAgo(n.created_at)}</div>
      </div>
    `).join('');

    panel.querySelector('.notification-list').innerHTML = listHtml;
  },

  async markRead(id) {
    try {
      await SupabaseAPI.markNotificationRead(id);
      const notif = this.notifications.find(n => n.id === id);
      if (notif) notif.is_read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.updateBadge();
      this.renderPanel();
    } catch(e) {}
  },

  async markAllRead() {
    if (!Auth.currentUser) return;
    try {
      await SupabaseAPI.markAllNotificationsRead(Auth.currentUser.id);
      this.notifications.forEach(n => n.is_read = true);
      this.unreadCount = 0;
      this.updateBadge();
      this.renderPanel();
    } catch(e) {}
  },

  togglePanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    const isVisible = panel.classList.contains('visible');
    document.querySelectorAll('.notification-panel.visible').forEach(p => p.classList.remove('visible'));
    if (!isVisible) {
      panel.classList.add('visible');
      this.loadNotifications();
    }
  },

  // Create admin notification in DB
  async addAdminNotification(type, title, message) {
    if (!Auth.isAdmin || !Auth.currentUser) return;
    try {
      const notif = {
        user_id: Auth.currentUser.id,
        type,
        title,
        message,
        is_read: false
      };
      await SupabaseAPI.createNotification(notif);
      await this.loadNotifications();
    } catch(e) {
      console.warn('Could not save notification:', e);
    }
  }
};

window.Notifications = Notifications;
