/* DEVVAULT - Snippets Module */

const SnippetsPage = {
  snippets: [],

  async render() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    Utils.setPageTitle('Snippets');

    mainContent.innerHTML = `
      <div class="content-reading-wrapper page-view">
        <div class="page-header">
          <div class="page-breadcrumb">
            <a href="#/dashboard" onclick="event.preventDefault(); App.router.navigate('/dashboard')">Home</a>
            <span class="page-breadcrumb-sep">/</span>
            <span>Snippets</span>
          </div>
          <div class="page-header-top">
            <div class="page-header-title-area">
              <div class="page-category-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>
              </div>
              <h1 class="page-header-title">Snippets</h1>
            </div>
            ${Auth.isAdmin ? `
              <div class="page-header-actions">
                <button class="btn btn-primary btn-sm" onclick="SnippetsPage.showCreateModal()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                  Tambah Snippet
                </button>
              </div>
            ` : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="text" id="snippet-search" class="form-input" placeholder="Cari snippet..." style="width:240px;" oninput="SnippetsPage.filterSnippets(this.value)" />
            <select id="snippet-lang-filter" class="form-select" style="width:150px;" onchange="SnippetsPage.filterSnippets()">
              <option value="">Semua Bahasa</option>
              ${['html','css','javascript','sql','json','bash','python'].map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join('')}
            </select>
          </div>
          <div id="snippet-count" style="font-size:12px;color:var(--text-muted);">Memuat...</div>
        </div>
        <div id="snippets-grid-container">
          <div class="empty-state">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>
    `;

    await this.loadSnippets();
  },

  async loadSnippets() {
    try {
      this.snippets = await SupabaseAPI.getSnippets(Auth.isAdmin);
      this.renderSnippets(this.snippets);
    } catch(e) {
      document.getElementById('snippets-grid-container').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Gagal memuat snippets</div>
          <div class="empty-state-desc">${Utils.escapeHtml(e.message)}</div>
        </div>
      `;
    }
  },

  renderSnippets(snippets) {
    const container = document.getElementById('snippets-grid-container');
    const countEl = document.getElementById('snippet-count');
    if (!container) return;

    if (countEl) countEl.textContent = `${snippets.length} snippet`;

    if (snippets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>
          <div class="empty-state-title">Belum ada snippet</div>
          <div class="empty-state-desc">${Auth.isAdmin ? 'Klik "Tambah Snippet" untuk membuat snippet pertama Anda.' : 'Belum ada snippet publik yang tersedia.'}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="snippets-grid">
        ${snippets.map(s => this.renderSnippetCard(s)).join('')}
      </div>
    `;

    // Apply syntax highlighting
    if (typeof Prism !== 'undefined') {
      setTimeout(() => Prism.highlightAll(), 50);
    }
  },

  renderSnippetCard(snippet) {
    const canCopy = Auth.isAdmin || snippet.copy_permission === 'public';
    const preview = (snippet.code || '').slice(0, 200);

    return `
      <div class="snippet-card" id="snippet-${snippet.id}">
        <div class="snippet-card-header">
          <div>
            <div class="snippet-card-title">${Utils.escapeHtml(snippet.title)}</div>
            ${!Auth.isAdmin && snippet.visibility === 'public' ? '' : 
              Auth.isAdmin ? `<div style="font-size:11px;color:${snippet.visibility === 'public' ? 'var(--success)' : 'var(--text-muted)'};margin-top:2px;">${snippet.visibility === 'public' ? '● Publik' : '● Privat'}</div>` : ''}
          </div>
          <span class="snippet-card-lang">${Utils.escapeHtml(snippet.language || 'code')}</span>
        </div>
        <div class="snippet-card-preview">${Utils.escapeHtml(preview)}${snippet.code?.length > 200 ? '\n...' : ''}</div>
        <div class="snippet-card-footer">
          <div class="snippet-card-desc">${Utils.escapeHtml(snippet.description || '')}</div>
          <div class="snippet-card-actions">
            ${canCopy ? `
              <button class="btn btn-ghost btn-sm" onclick="SnippetsPage.copySnippet(this, '${snippet.id}')" title="Salin kode">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                Salin
              </button>
            ` : `
              <span style="font-size:11px;color:var(--text-muted);padding:4px 8px;display:flex;align-items:center;gap:3px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="11" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Admin only
              </span>
            `}
            <button class="btn btn-ghost btn-sm" onclick="SnippetsPage.viewSnippet('${snippet.id}')" title="Lihat detail">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            ${Auth.isAdmin ? `
              <button class="btn btn-ghost btn-sm" onclick="SnippetsPage.showEditModal('${snippet.id}')" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="SnippetsPage.deleteSnippet('${snippet.id}')" title="Hapus" style="color:var(--error)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  filterSnippets(query) {
    const q = (query || document.getElementById('snippet-search')?.value || '').toLowerCase();
    const lang = document.getElementById('snippet-lang-filter')?.value || '';

    let filtered = this.snippets.filter(s => {
      const matchQuery = !q || 
        s.title.toLowerCase().includes(q) || 
        (s.description || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q);
      const matchLang = !lang || s.language === lang;
      return matchQuery && matchLang;
    });

    this.renderSnippets(filtered);
  },

  async copySnippet(btn, snippetId) {
    const snippet = this.snippets.find(s => s.id === snippetId);
    if (!snippet) return;
    const success = await Utils.copyToClipboard(snippet.code);
    if (success) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Disalin!`;
      btn.style.color = 'var(--success)';
      setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
      Notifications.addToast('Snippet disalin!', 'success');
    }
  },

  viewSnippet(snippetId) {
    const snippet = this.snippets.find(s => s.id === snippetId);
    if (!snippet) return;

    Modals.show({
      title: snippet.title,
      body: `
        ${snippet.description ? `<p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:16px;">${Utils.escapeHtml(snippet.description)}</p>` : ''}
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span class="snippet-card-lang">${Utils.escapeHtml(snippet.language || '')}</span>
          ${snippet.copy_permission === 'public' ? `<span style="font-size:11px;color:var(--success);">● Salin Publik</span>` : `<span style="font-size:11px;color:var(--text-muted);">● Admin Only</span>`}
          <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">ID: <code style="font-family:var(--font-code);font-size:10px;">${snippet.id}</code></span>
          <button class="btn btn-ghost btn-sm" onclick="Utils.copyToClipboard('${snippet.id}').then(() => Notifications.addToast('ID disalin!','success'))" title="Salin ID">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <div class="code-block-wrapper">
          <div class="code-block-content">
            <pre class="line-numbers"><code class="language-${Utils.escapeHtml(snippet.language || 'javascript')}">${Utils.escapeHtml(snippet.code || '')}</code></pre>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modals.close()">Tutup</button>
        ${Auth.isAdmin || snippet.copy_permission === 'public' ? `<button class="btn btn-primary" onclick="SnippetsPage.copySnippet(this, '${snippet.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Salin Kode
        </button>` : ''}
      `
    });

    if (typeof Prism !== 'undefined') setTimeout(() => Prism.highlightAll(), 50);
  },

  showCreateModal() {
    if (!Auth.requireAdmin()) return;
    this.showSnippetModal(null);
  },

  showEditModal(snippetId) {
    if (!Auth.requireAdmin()) return;
    const snippet = this.snippets.find(s => s.id === snippetId);
    if (!snippet) return;
    this.showSnippetModal(snippet);
  },

  showSnippetModal(snippet) {
    Modals.show({
      title: snippet ? 'Edit Snippet' : 'Tambah Snippet Baru',
      body: `
        <div class="form-group">
          <label class="form-label">Judul <span>*</span></label>
          <input type="text" class="form-input" id="snip-title" value="${snippet ? Utils.escapeHtml(snippet.title) : ''}" placeholder="Nama snippet..." autofocus />
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <input type="text" class="form-input" id="snip-desc" value="${snippet ? Utils.escapeHtml(snippet.description || '') : ''}" placeholder="Deskripsi singkat..." />
        </div>
        <div class="form-group">
          <label class="form-label">Bahasa</label>
          <select class="form-select" id="snip-lang">
            ${['html','css','javascript','sql','json','bash','python','typescript','php','java'].map(l => 
              `<option value="${l}" ${snippet?.language === l ? 'selected' : ''}>${l.toUpperCase()}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kode <span>*</span></label>
          <textarea class="form-textarea code-input" id="snip-code" rows="12" placeholder="Paste kode di sini...">${snippet ? Utils.escapeHtml(snippet.code || '') : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Visibility</label>
            <select class="form-select" id="snip-visibility">
              <option value="private" ${snippet?.visibility === 'private' || !snippet ? 'selected' : ''}>Privat</option>
              <option value="public" ${snippet?.visibility === 'public' ? 'selected' : ''}>Publik</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Izin Salin</label>
            <select class="form-select" id="snip-copy-perm">
              <option value="public" ${snippet?.copy_permission === 'public' ? 'selected' : ''}>Publik</option>
              <option value="admin" ${snippet?.copy_permission === 'admin' || !snippet ? 'selected' : ''}>Admin Only</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select class="form-select" id="snip-category">
            <option value="">-- Tanpa Kategori --</option>
            ${Sidebar.categories.map(c => `<option value="${c.id}" ${c.id === snippet?.category_id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modals.close()">Batal</button>
        <button class="btn btn-primary" onclick="SnippetsPage.saveSnippet('${snippet?.id || ''}')">Simpan</button>
      `
    });
  },

  async saveSnippet(snippetId) {
    const title = document.getElementById('snip-title')?.value?.trim();
    const code = document.getElementById('snip-code')?.value;
    if (!title) { Notifications.addToast('Judul wajib diisi', 'error'); return; }
    if (!code?.trim()) { Notifications.addToast('Kode wajib diisi', 'error'); return; }

    const data = {
      title,
      description: document.getElementById('snip-desc')?.value?.trim() || '',
      code,
      language: document.getElementById('snip-lang')?.value || 'javascript',
      visibility: document.getElementById('snip-visibility')?.value || 'private',
      copy_permission: document.getElementById('snip-copy-perm')?.value || 'admin',
      category_id: document.getElementById('snip-category')?.value || null,
    };

    try {
      if (snippetId) {
        await SupabaseAPI.updateSnippet(snippetId, data);
        Notifications.addToast('Snippet diperbarui!', 'success');
      } else {
        data.created_by = Auth.currentUser?.id;
        await SupabaseAPI.createSnippet(data);
        Notifications.addToast('Snippet berhasil dibuat!', 'success');
      }
      Modals.close();
      await this.loadSnippets();
    } catch(e) {
      Notifications.addToast('Gagal menyimpan snippet: ' + e.message, 'error');
    }
  },

  async deleteSnippet(snippetId) {
    if (!confirm('Hapus snippet ini?')) return;
    try {
      await SupabaseAPI.deleteSnippet(snippetId);
      this.snippets = this.snippets.filter(s => s.id !== snippetId);
      this.renderSnippets(this.snippets);
      Notifications.addToast('Snippet dihapus', 'info');
    } catch(e) {
      Notifications.addToast('Gagal menghapus snippet', 'error');
    }
  }
};

window.SnippetsPage = SnippetsPage;
