/* ============================================================
   DevVault - Snippets System
   js/snippets.js
   ============================================================ */

'use strict';

window.DevVaultSnippets = (function () {
  const { qs, sanitize, show, hide, on, copyToClipboard } = window.DevVaultUtils;

  /* ─── State ─── */
  let snippets = [];
  let editingSnippetId = null;
  let filterLanguage = 'all';
  let filterCategory = 'all';
  let searchQuery = '';

  /* ─── Render Snippets Page ─── */

  async function renderSnippetsPage(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="page-full">
        <div class="section-header">
          <h1 class="section-title">
            <i data-lucide="code-2" style="width:24px;height:24px;margin-right:8px;vertical-align:middle;color:var(--color-accent);" aria-hidden="true"></i>
            Snippets
          </h1>
          <div class="section-actions">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <input type="text" id="snippets-search" class="form-input" style="width:200px;"
                placeholder="Search snippets..." aria-label="Search snippets" />
              <select id="snippets-lang-filter" class="form-select" style="width:130px;" aria-label="Filter by language">
                <option value="all">All Languages</option>
                <option value="javascript">JavaScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="bash">Bash</option>
                <option value="python">Python</option>
              </select>
            </div>
            <button id="add-snippet-btn" class="btn btn-primary admin-only" style="display:none;" aria-label="Add snippet">
              <i data-lucide="plus" aria-hidden="true"></i>
              Add Snippet
            </button>
          </div>
        </div>
        <div id="snippets-grid" class="card-grid" role="list" aria-label="Code snippets">
          <div class="loading-overlay" style="position:relative;min-height:200px;">
            <div class="loading-spinner"></div>
            <span>Loading snippets...</span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Show admin button if admin
    const addBtn = container.querySelector('#add-snippet-btn');
    if (addBtn && window.DevVaultAuth?.isAdmin()) addBtn.style.display = '';

    // Load snippets
    await loadSnippets(container);

    // Bind filters
    const searchInput = container.querySelector('#snippets-search');
    if (searchInput) {
      on(searchInput, 'input', window.DevVaultUtils.debounce((e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderSnippetGrid(container);
      }, 250));
    }

    const langFilter = container.querySelector('#snippets-lang-filter');
    if (langFilter) {
      on(langFilter, 'change', (e) => {
        filterLanguage = e.target.value;
        renderSnippetGrid(container);
      });
    }

    if (addBtn) {
      on(addBtn, 'click', () => openCreateModal());
    }
  }

  async function loadSnippets(container) {
    try {
      const isAdmin = window.DevVaultAuth?.isAdmin();
      const { data, error } = await window.DevVaultAPI.getSnippets(!isAdmin);
      if (error) throw error;
      snippets = data || [];
      renderSnippetGrid(container);
    } catch (err) {
      console.error('[Snippets] Load error:', err);
      const grid = container?.querySelector('#snippets-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="alert-circle"></i></div>
            <p class="empty-state-title">Failed to load snippets</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons({ nodes: [grid] });
      }
    }
  }

  function renderSnippetGrid(container) {
    const grid = container?.querySelector('#snippets-grid') || qs('#snippets-grid');
    if (!grid) return;

    const isAdmin = window.DevVaultAuth?.isAdmin();

    // Filter snippets
    let filtered = snippets.filter(s => !s.deleted_at);
    if (!isAdmin) filtered = filtered.filter(s => s.is_public);
    if (filterLanguage !== 'all') filtered = filtered.filter(s => s.language === filterLanguage);
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(searchQuery) ||
        (s.description || '').toLowerCase().includes(searchQuery) ||
        (s.code || '').toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">
            <i data-lucide="code" aria-hidden="true"></i>
          </div>
          <p class="empty-state-title">No snippets found</p>
          <p class="empty-state-desc">
            ${isAdmin ? 'Create your first snippet using the Add Snippet button above.' : 'No public snippets available yet.'}
          </p>
          ${isAdmin ? `<button class="btn btn-primary" onclick="window.DevVaultSnippets.openCreateModal()">
            <i data-lucide="plus" aria-hidden="true"></i> Add Snippet
          </button>` : ''}
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [grid] });
      return;
    }

    grid.innerHTML = filtered.map(snippet => renderSnippetCard(snippet, isAdmin)).join('');
    if (window.lucide) window.lucide.createIcons({ nodes: [grid] });

    // Bind events
    grid.querySelectorAll('[data-copy-snippet]').forEach(btn => {
      on(btn, 'click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.copySnippet;
        const snippet = snippets.find(s => s.id === id);
        if (snippet) {
          const ok = await copyToClipboard(snippet.code || '');
          if (ok) {
            btn.innerHTML = `<i data-lucide="check" aria-hidden="true"></i>`;
            if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
            window.DevVaultNotifications.success('Copied!', 'Snippet copied to clipboard');
            setTimeout(() => {
              btn.innerHTML = `<i data-lucide="copy" aria-hidden="true"></i>`;
              if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
            }, 2000);
          }
        }
      });
    });

    if (isAdmin) {
      grid.querySelectorAll('[data-edit-snippet]').forEach(btn => {
        on(btn, 'click', (e) => {
          e.stopPropagation();
          openEditModal(btn.dataset.editSnippet);
        });
      });

      grid.querySelectorAll('[data-delete-snippet]').forEach(btn => {
        on(btn, 'click', (e) => {
          e.stopPropagation();
          deleteSnippetConfirm(btn.dataset.deleteSnippet);
        });
      });
    }
  }

  function renderSnippetCard(snippet, isAdmin) {
    const catName = snippet.categories?.name || '';
    return `
      <div class="snippet-card" role="listitem" aria-label="${sanitize(snippet.title)} snippet">
        <div class="snippet-card-header">
          <div>
            <div class="snippet-card-title">${sanitize(snippet.title)}</div>
            ${snippet.description ? `<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px;">${sanitize(snippet.description)}</div>` : ''}
          </div>
          <div class="snippet-card-meta">
            <span class="badge badge-accent">${sanitize(snippet.language)}</span>
            ${!snippet.is_public ? `<span class="badge badge-ghost" title="Private"><i data-lucide="lock" style="width:10px;height:10px;" aria-hidden="true"></i></span>` : ''}
          </div>
        </div>
        <div class="code-block-wrapper" style="border-radius:0;border-left:none;border-right:none;border-top:none;margin:0;">
          <div class="code-block-toolbar">
            <span class="code-block-lang">${sanitize(snippet.language)}</span>
            <div class="code-block-actions">
              <button class="code-action-btn" data-copy-snippet="${snippet.id}" aria-label="Copy snippet code" title="Copy">
                <i data-lucide="copy" aria-hidden="true"></i>
              </button>
              ${isAdmin ? `
                <button class="code-action-btn" data-edit-snippet="${snippet.id}" aria-label="Edit snippet" title="Edit">
                  <i data-lucide="pencil" aria-hidden="true"></i>
                </button>
                <button class="code-action-btn" style="color:var(--color-error);" data-delete-snippet="${snippet.id}" aria-label="Delete snippet" title="Delete">
                  <i data-lucide="trash-2" aria-hidden="true"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="code-block-body" style="max-height:200px;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom, black 60%, transparent 100%);mask-image:linear-gradient(to bottom, black 60%, transparent 100%);">
            <pre class="language-${sanitize(snippet.language)}"><code class="language-${sanitize(snippet.language)}">${escapeHTML(snippet.code || '')}</code></pre>
          </div>
        </div>
        <div style="padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          ${catName ? `<span style="font-size:0.75rem;color:var(--color-text-muted);">${sanitize(catName)}</span>` : `<span></span>`}
          <button class="code-action-btn" data-copy-snippet="${snippet.id}" aria-label="Copy full snippet" title="Copy code">
            <i data-lucide="copy" aria-hidden="true"></i>
            <span>Copy</span>
          </button>
        </div>
      </div>
    `;
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ─── Create Modal ─── */

  async function openCreateModal() {
    if (!window.DevVaultAuth.requireAdmin()) return;

    editingSnippetId = null;
    const modal = qs('#snippet-modal');
    const title = qs('#snippet-modal-title');
    const form = qs('#snippet-form');
    const submitBtn = qs('#snippet-form-submit');

    if (!modal) return;

    if (title) title.textContent = 'Create Snippet';
    if (submitBtn) submitBtn.textContent = 'Create Snippet';
    if (form) form.reset();
    qs('#snippet-form-id').value = '';

    // Clear errors
    qs('#snippet-title-error').textContent = '';
    qs('#snippet-code-error').textContent = '';

    // Populate categories
    await populateCategoryDropdown(qs('#snippet-form-category'));

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();
    setTimeout(() => qs('#snippet-form-title')?.focus(), 100);
  }

  /* ─── Edit Modal ─── */

  async function openEditModal(snippetId) {
    if (!window.DevVaultAuth.requireAdmin()) return;

    const snippet = snippets.find(s => s.id === snippetId);
    if (!snippet) return;

    editingSnippetId = snippetId;
    const modal = qs('#snippet-modal');
    const title = qs('#snippet-modal-title');
    const submitBtn = qs('#snippet-form-submit');

    if (!modal) return;

    if (title) title.textContent = 'Edit Snippet';
    if (submitBtn) submitBtn.textContent = 'Save Changes';

    qs('#snippet-form-id').value = snippetId;
    qs('#snippet-form-title').value = snippet.title || '';
    qs('#snippet-form-language').value = snippet.language || 'javascript';
    qs('#snippet-form-description').value = snippet.description || '';
    qs('#snippet-form-code').value = snippet.code || '';
    qs('#snippet-form-public').checked = snippet.is_public !== false;

    await populateCategoryDropdown(qs('#snippet-form-category'), snippet.category_id);

    // Clear errors
    qs('#snippet-title-error').textContent = '';
    qs('#snippet-code-error').textContent = '';

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();
  }

  async function populateCategoryDropdown(select, selectedId = '') {
    if (!select) return;
    try {
      const { data } = await window.DevVaultAPI.getCategories();
      const cats = data || [];
      select.innerHTML = `<option value="">No category</option>` +
        cats.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${sanitize(c.name)}</option>`).join('');
    } catch {}
  }

  /* ─── Handle Form Submit ─── */

  async function handleSnippetFormSubmit(e) {
    e.preventDefault();

    if (!window.DevVaultAuth.isAdmin()) {
      window.DevVaultAuth.showLoginModal();
      return;
    }

    const title = qs('#snippet-form-title')?.value?.trim() || '';
    const code = qs('#snippet-form-code')?.value || '';
    const titleError = qs('#snippet-title-error');
    const codeError = qs('#snippet-code-error');

    // Validate
    let hasError = false;
    if (!title) {
      if (titleError) titleError.textContent = 'Title is required';
      hasError = true;
    } else {
      if (titleError) titleError.textContent = '';
    }
    if (!code.trim()) {
      if (codeError) codeError.textContent = 'Code is required';
      hasError = true;
    } else {
      if (codeError) codeError.textContent = '';
    }
    if (hasError) return;

    const payload = {
      title,
      description: qs('#snippet-form-description')?.value?.trim() || '',
      language: qs('#snippet-form-language')?.value || 'javascript',
      code,
      category_id: qs('#snippet-form-category')?.value || null,
      is_public: qs('#snippet-form-public')?.checked ?? true,
    };

    const submitBtn = qs('#snippet-form-submit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingSnippetId) {
        const { data, error } = await window.DevVaultAPI.updateSnippet(editingSnippetId, payload);
        if (error) throw error;
        const idx = snippets.findIndex(s => s.id === editingSnippetId);
        if (idx !== -1 && data) snippets[idx] = data;
        window.DevVaultNotifications.success('Snippet updated');
        window.DevVaultNotifications.addNotification('Snippet updated', 'success', title);
      } else {
        const { data, error } = await window.DevVaultAPI.createSnippet(payload);
        if (error) throw error;
        if (data) snippets.unshift(data);
        window.DevVaultNotifications.success('Snippet created');
        window.DevVaultNotifications.addNotification('New snippet created', 'success', title);
      }

      closeSnippetModal();

      // Re-render grid
      const grid = qs('#snippets-grid');
      if (grid) {
        const container = grid.closest('.page-full')?.parentElement || qs('#main-content');
        renderSnippetGrid({ querySelector: (sel) => document.querySelector(sel) });
      }
    } catch (err) {
      console.error('[Snippets] Save error:', err);
      window.DevVaultNotifications.error('Failed to save snippet', err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /* ─── Delete Snippet ─── */

  function deleteSnippetConfirm(snippetId) {
    if (window.DevVaultModal) {
      window.DevVaultModal.confirm(
        'Delete Snippet',
        'Are you sure you want to delete this snippet? It will be moved to trash.',
        async () => {
          try {
            const { error } = await window.DevVaultAPI.deleteSnippet(snippetId);
            if (error) throw error;
            snippets = snippets.filter(s => s.id !== snippetId);
            const grid = qs('#snippets-grid');
            if (grid) renderSnippetGrid({ querySelector: (sel) => document.querySelector(sel) });
            window.DevVaultNotifications.success('Snippet deleted');
            window.DevVaultNotifications.addNotification('Snippet deleted', 'info');
          } catch (err) {
            window.DevVaultNotifications.error('Failed to delete snippet', err.message);
          }
        }
      );
    }
  }

  /* ─── Close Modal ─── */

  function closeSnippetModal() {
    const modal = qs('#snippet-modal');
    if (modal) hide(modal);
    window.DevVaultUtils.unlockScroll();
    editingSnippetId = null;
  }

  /* ─── Initialize ─── */

  function init() {
    const snippetForm = qs('#snippet-form');
    if (snippetForm) on(snippetForm, 'submit', handleSnippetFormSubmit);

    document.querySelectorAll('[data-modal="snippet-modal"].modal-close').forEach(btn => {
      on(btn, 'click', closeSnippetModal);
    });

    const snippetModal = qs('#snippet-modal');
    if (snippetModal) {
      on(snippetModal, 'click', (e) => {
        if (e.target === snippetModal) closeSnippetModal();
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = qs('#snippet-modal');
        if (modal && modal.style.display !== 'none') closeSnippetModal();
      }
    });
  }

  /* ─── Public API ─── */
  return {
    init,
    renderSnippetsPage,
    openCreateModal,
    openEditModal,
    closeSnippetModal,
    get snippets() { return snippets; },
  };
})();
