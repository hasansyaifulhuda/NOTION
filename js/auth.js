/* DEVVAULT - Authentication Module */

const Auth = {
  currentUser: null,
  currentProfile: null,
  isAdmin: false,
  listeners: [],

  async init() {
    // Listen for auth state changes only when Supabase is configured.
    if (window.isSupabaseConfigured && window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.handleSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          await this.handleSignOut();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          this.currentUser = session.user;
        }
      });
    } else {
      this.currentUser = null;
      this.currentProfile = null;
      this.isAdmin = false;
      console.info('DEVVAULT: Auth nonaktif sementara karena Supabase belum dikonfigurasi.');
    }

    // Check existing session
    try {
      const session = await SupabaseAPI.getSession();
      if (session) {
        await this.handleSignIn(session.user);
      }
    } catch(e) {
      console.warn('Auth init error:', e);
    }
  },

  async handleSignIn(user) {
    this.currentUser = user;
    try {
      this.currentProfile = await SupabaseAPI.getProfile(user.id);
      this.isAdmin = this.currentProfile?.role === 'admin';
    } catch(e) {
      this.isAdmin = false;
    }
    this.notifyListeners('signin', { user, isAdmin: this.isAdmin });
  },

  async handleSignOut() {
    this.currentUser = null;
    this.currentProfile = null;
    this.isAdmin = false;
    this.notifyListeners('signout', {});
  },

  async login(email, password) {
    try {
      const data = await SupabaseAPI.signIn(email, password);
      return { success: true, data };
    } catch(e) {
      const msg = this.getErrorMessage(e.message);
      return { success: false, error: msg };
    }
  },

  async logout() {
    try {
      await SupabaseAPI.signOut();
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  },

  getErrorMessage(msg) {
    if (!msg) return 'Terjadi kesalahan. Silakan coba lagi.';
    if (msg.includes('Invalid login credentials')) return 'Email atau password salah.';
    if (msg.includes('Email not confirmed')) return 'Email belum dikonfirmasi.';
    if (msg.includes('Too many requests')) return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
    if (msg.includes('User not found')) return 'Pengguna tidak ditemukan.';
    if (msg.includes('network')) return 'Gagal terhubung ke server. Cek koneksi internet Anda.';
    return msg;
  },

  onAuthChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },

  notifyListeners(event, data) {
    this.listeners.forEach(fn => {
      try { fn(event, data); } catch(e) {}
    });
  },

  requireAdmin(callback) {
    if (!this.isAdmin) {
      App.router.navigate('/login');
      return false;
    }
    return callback ? callback() : true;
  }
};

// Login Popup Renderer
const LoginPage = {
  renderCard() {
    return `
      <div class="login-container login-modal-container">
        <div class="login-logo">
          <div class="login-logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span class="login-logo-text">DEVVAULT</span>
        </div>
        <div class="login-card">
          <button type="button" class="login-modal-close" onclick="LoginPage.closeModal()" aria-label="Tutup login">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
          <h1 class="login-title">Login Admin</h1>
          <p class="login-subtitle">Masuk untuk mengelola dokumentasi Anda.</p>
          <div id="login-error" class="login-error hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <span id="login-error-text"></span>
          </div>
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email</label>
              <input type="email" id="login-email" class="form-input" placeholder="admin@example.com" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••" autocomplete="current-password" required />
            </div>
            <button type="submit" class="btn btn-primary w-full" id="login-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              Masuk
            </button>
          </form>
          <div class="login-footer">
            Hanya admin yang dapat login. Guest dapat langsung membaca dokumentasi publik.
          </div>
        </div>
      </div>
    `;
  },

  render() {
    return `<div class="login-page">${this.renderCard()}</div>`;
  },

  showModal() {
    if (Auth.isAdmin) return;
    this.closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'login-modal-overlay';
    overlay.className = 'login-modal-overlay';
    overlay.innerHTML = this.renderCard();
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });

    this.bindEvents();
    setTimeout(() => document.getElementById('login-email')?.focus(), 50);
  },

  closeModal() {
    document.getElementById('login-modal-overlay')?.remove();
  },

  bindEvents() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      const errorEl = document.getElementById('login-error');
      const errorText = document.getElementById('login-error-text');

      if (!email || !password) return;

      btn.disabled = true;
      btn.innerHTML = `<div class="loading-spinner" style="width:16px;height:16px;border-width:2px;"></div> Masuk...`;
      errorEl.classList.add('hidden');

      const result = await Auth.login(email, password);

      if (result.success) {
        Notifications.addToast('Login berhasil! Selamat datang, Admin.', 'success');
        this.closeModal();
        App.router.navigate('/dashboard');
      } else {
        errorEl.classList.remove('hidden');
        errorText.textContent = result.error;
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> Masuk`;
      }
    }, { once: true });
  }
};

window.Auth = Auth;
window.LoginPage = LoginPage;
