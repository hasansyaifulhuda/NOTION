/* DEVVAULT - Block System Module */

const Blocks = {
  currentPageId: null,
  blocks: [],
  editingBlockId: null,

  async load(pageId) {
    this.currentPageId = pageId;
    try {
      this.blocks = await SupabaseAPI.getBlocks(pageId);
    } catch(e) {
      console.warn('Blocks load error:', e);
      this.blocks = [];
    }
    return this.blocks;
  },

  render(blocks, isAdmin = false) {
    const container = document.getElementById('blocks-container');
    if (!container) return;

    if (!blocks || blocks.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 24px;">
          <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div class="empty-state-title">Halaman ini masih kosong</div>
          <div class="empty-state-desc">${isAdmin ? 'Klik tombol "Tambah Blok" untuk mulai menulis dokumentasi.' : 'Belum ada konten di halaman ini.'}</div>
        </div>
        ${isAdmin ? `<div id="add-block-area"></div>` : ''}
      `;
      if (isAdmin) this.renderAddBlockBtn();
      return;
    }

    const html = blocks.map((block, index) => this.renderBlock(block, index, isAdmin, blocks.length)).join('');
    container.innerHTML = `
      <div class="blocks-container" id="blocks-inner">
        ${html}
      </div>
      ${isAdmin ? `<div id="add-block-area"></div>` : ''}
    `;

    if (isAdmin) this.renderAddBlockBtn();

    // Apply syntax highlighting
    setTimeout(() => {
      if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
      }
    }, 50);
  },

  renderBlock(block, index, isAdmin, total) {
    let blockContent = '';

    try {
      switch(block.type) {
        case 'heading':
          blockContent = this.renderHeading(block);
          break;
        case 'text':
          blockContent = this.renderText(block);
          break;
        case 'code':
          blockContent = this.renderCode(block, isAdmin);
          break;
        case 'quote':
          blockContent = this.renderQuote(block);
          break;
        case 'link':
          blockContent = this.renderLink(block);
          break;
        case 'checklist':
          blockContent = this.renderChecklist(block, isAdmin);
          break;
        case 'snippet_embed':
          blockContent = this.renderSnippetEmbed(block, isAdmin);
          break;
        default:
          blockContent = `<div class="block-text"><p>${Utils.escapeHtml(block.content || '')}</p></div>`;
      }
    } catch(e) {
      blockContent = `<div class="block-text"><p style="color:var(--error);">Error rendering block: ${e.message}</p></div>`;
    }

    const adminControls = isAdmin ? `
      <div class="block-controls">
        ${index > 0 ? `<button class="block-ctrl-btn" title="Pindah ke atas" onclick="Blocks.moveBlock('${block.id}', 'up')">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
        </button>` : ''}
        ${index < total - 1 ? `<button class="block-ctrl-btn" title="Pindah ke bawah" onclick="Blocks.moveBlock('${block.id}', 'down')">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>` : ''}
        <button class="block-ctrl-btn" title="Edit blok" onclick="Blocks.editBlock('${block.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button class="block-ctrl-btn" title="Hapus blok" onclick="Blocks.deleteBlock('${block.id}')" style="color:var(--error)">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    ` : '';

    return `
      <div class="block-wrapper" data-block-id="${block.id}" data-block-type="${block.type}">
        ${adminControls}
        ${blockContent}
      </div>
    `;
  },

  renderHeading(block) {
    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = { level: 2, text: block.content || '' };
    }
    const level = content.level || 2;
    const text = content.text || '';
    const id = Utils.slugify(text);
    const anchor = `<span class="heading-anchor" onclick="Utils.copyToClipboard(window.location.href.split('#')[0] + '#' + window.location.hash + '/' + '${id}').then(() => Notifications.addToast('Link disalin!', 'success'))" title="Salin link">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    </span>`;
    return `<div class="block-heading"><h${level} id="${id}">${Utils.escapeHtml(text)}${anchor}</h${level}></div>`;
  },

  renderText(block) {
    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = { text: block.content || '' };
    }
    const text = content.text || block.content || '';
    // Process inline code: `code`
    const processed = Utils.escapeHtml(text).replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Process line breaks
    const withBreaks = processed.replace(/\n/g, '<br>');
    return `<div class="block-text"><p>${withBreaks}</p></div>`;
  },

  renderCode(block, isAdmin) {
    const lang = block.language || 'javascript';
    const code = block.content || '';
    const meta = block.metadata || {};
    const copyPerm = meta.copy_permission || 'public';
    const canCopy = isAdmin || copyPerm === 'public';

    const copyBtn = canCopy ? `
      <button class="code-action-btn" onclick="Blocks.copyCode(this, \`${this.escapeForAttr(code)}\`)" title="Salin kode">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Salin</span>
      </button>
    ` : `
      <span style="font-size:10.5px;color:var(--text-muted);padding:4px 8px;display:flex;align-items:center;gap:4px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="11" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Admin only
      </span>
    `;

    return `
      <div class="code-block-wrapper">
        <div class="code-block-toolbar">
          <span class="code-block-lang">${Utils.escapeHtml(lang)}</span>
          <div class="code-block-actions">
            ${copyBtn}
            <button class="code-action-btn" onclick="Blocks.toggleCollapse(this)" title="Perluas/Ciutkan">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>Ciutkan</span>
            </button>
            <button class="code-action-btn" onclick="Blocks.openFullscreen(this)" title="Layar penuh">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
              <span>Fullscreen</span>
            </button>
          </div>
        </div>
        <div class="code-block-content">
          <pre class="line-numbers"><code class="language-${Utils.escapeHtml(lang)}">${Utils.escapeHtml(code)}</code></pre>
        </div>
      </div>
    `;
  },

  renderQuote(block) {
    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = { text: block.content || '', variant: 'info' };
    }
    const variant = content.variant || 'info';
    const text = content.text || block.content || '';
    const label = content.label || '';

    const variantConfig = {
      info: { icon: `<path d="M12 16v-4"/><path d="M12 8h.01"/><circle cx="12" cy="12" r="10"/>`, label: 'Info' },
      warning: { icon: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`, label: 'Peringatan' },
      error: { icon: `<circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>`, label: 'Error' },
      success: { icon: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`, label: 'Tips' },
      note: { icon: `<path d="M12 16v-4"/><path d="M12 8h.01"/><circle cx="12" cy="12" r="10"/>`, label: 'Catatan' }
    };

    const config = variantConfig[variant] || variantConfig.info;
    const displayLabel = label || config.label;

    return `
      <div class="block-quote ${variant}">
        <div class="quote-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${config.icon}</svg>
          ${Utils.escapeHtml(displayLabel)}
        </div>
        <div>${Utils.escapeHtml(text).replace(/\n/g, '<br>')}</div>
      </div>
    `;
  },

  renderLink(block) {
    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = { url: block.content || '', title: block.content || '' };
    }
    const { url, title, description } = content;
    return `
      <a class="block-link-card" href="${Utils.escapeHtml(url || '#')}" target="_blank" rel="noopener noreferrer">
        <div class="block-link-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <div class="block-link-content">
          <div class="block-link-title">${Utils.escapeHtml(title || url || 'Tautan')}</div>
          <div class="block-link-url">${Utils.escapeHtml(url || '')}</div>
          ${description ? `<div class="block-link-desc">${Utils.escapeHtml(description)}</div>` : ''}
        </div>
        <svg class="block-link-external" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
      </a>
    `;
  },

  renderChecklist(block, isAdmin) {
    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = { items: [] };
    }
    const items = content.items || [];
    const listHtml = items.map((item, i) => {
      const text = typeof item === 'string' ? item : item.text || '';
      const checked = typeof item === 'object' ? item.checked : false;
      return `
        <div class="checklist-item">
          <input type="checkbox" ${checked ? 'checked' : ''} ${isAdmin ? '' : 'disabled'}
            ${isAdmin ? `onchange="Blocks.updateChecklistItem('${block.id}', ${i}, this.checked)"` : ''}
          />
          <span class="checklist-item-text ${checked ? 'checked' : ''}">${Utils.escapeHtml(text)}</span>
        </div>
      `;
    }).join('');
    return `<div class="block-checklist">${listHtml || '<div style="color:var(--text-muted);font-size:13px;">Checklist kosong</div>'}</div>`;
  },

  renderSnippetEmbed(block, isAdmin) {
    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = {};
    }

    const snippetId = content.snippet_id;
    const title = content.title || 'Snippet';
    const code = content.code || '';
    const lang = content.language || 'javascript';
    const copyPerm = content.copy_permission || 'admin';
    const canCopy = isAdmin || copyPerm === 'public';

    const copyBtn = canCopy ? `
      <button class="code-action-btn" onclick="Blocks.copyCode(this, \`${this.escapeForAttr(code)}\`)" title="Salin">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Salin</span>
      </button>
    ` : '';

    return `
      <div class="snippet-embed-block">
        <div class="snippet-embed-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>
          <span class="snippet-embed-label">Snippet Embed</span>
          <span class="snippet-embed-title">${Utils.escapeHtml(title)}</span>
          <span class="code-block-lang" style="margin-left:auto">${Utils.escapeHtml(lang)}</span>
        </div>
        <div class="code-block-toolbar" style="background:rgba(0,0,0,0.15)">
          <div class="code-block-actions">
            ${copyBtn}
          </div>
        </div>
        <div class="code-block-content">
          <pre class="line-numbers"><code class="language-${Utils.escapeHtml(lang)}">${Utils.escapeHtml(code)}</code></pre>
        </div>
      </div>
    `;
  },

  escapeForAttr(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  },

  async copyCode(btn, code) {
    const success = await Utils.copyToClipboard(code);
    if (success) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Disalin!</span>`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove('copied');
      }, 2000);
      Notifications.addToast('Kode berhasil disalin!', 'success');
    }
  },

  toggleCollapse(btn) {
    const wrapper = btn.closest('.code-block-wrapper');
    const content = wrapper?.querySelector('.code-block-content');
    if (!content) return;
    const isCollapsed = content.classList.toggle('collapsed');
    const span = btn.querySelector('span');
    if (span) span.textContent = isCollapsed ? 'Perluas' : 'Ciutkan';
    const icon = btn.querySelector('svg');
    if (icon) {
      icon.style.transform = isCollapsed ? 'rotate(-90deg)' : '';
    }
  },

  openFullscreen(btn) {
    const wrapper = btn.closest('.code-block-wrapper');
    const codeEl = wrapper?.querySelector('code');
    const langEl = wrapper?.querySelector('.code-block-lang');
    if (!codeEl) return;

    const code = codeEl.textContent;
    const lang = langEl?.textContent || '';

    const modal = document.createElement('div');
    modal.className = 'code-fullscreen-modal';
    modal.innerHTML = `
      <div class="code-block-toolbar">
        <span class="code-block-lang">${Utils.escapeHtml(lang)}</span>
        <div class="code-block-actions">
          <button class="code-action-btn" onclick="Blocks.copyCode(this, \`${this.escapeForAttr(code)}\`)">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Salin</span>
          </button>
          <button class="code-action-btn" onclick="document.querySelector('.code-fullscreen-modal').remove()" title="Tutup">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            <span>Tutup</span>
          </button>
        </div>
      </div>
      <div class="code-block-content" style="flex:1;overflow:auto;">
        <pre class="line-numbers"><code class="language-${Utils.escapeHtml(lang)}">${Utils.escapeHtml(code)}</code></pre>
      </div>
    `;

    document.body.appendChild(modal);
    if (typeof Prism !== 'undefined') Prism.highlightAll();

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    });
  },

  // Admin: Add block
  renderAddBlockBtn() {
    const area = document.getElementById('add-block-area');
    if (!area) return;
    area.innerHTML = `
      <button class="add-block-btn" onclick="Blocks.showBlockTypeSelector(this)">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Tambah Blok
      </button>
    `;
  },

  showBlockTypeSelector(btn) {
    // Remove existing selector
    document.querySelectorAll('.block-type-selector').forEach(el => el.remove());

    const types = [
      { type: 'heading', label: 'Judul', icon: `<path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/>` },
      { type: 'text', label: 'Teks', icon: `<path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/>` },
      { type: 'code', label: 'Kode', icon: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>` },
      { type: 'quote', label: 'Kutipan', icon: `<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>` },
      { type: 'link', label: 'Tautan', icon: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>` },
      { type: 'checklist', label: 'Checklist', icon: `<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
      { type: 'snippet_embed', label: 'Snippet', icon: `<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/>` },
    ];

    const selector = document.createElement('div');
    selector.className = 'block-type-selector';
    selector.innerHTML = `
      <div class="block-type-selector-title">Pilih Tipe Blok</div>
      <div class="block-type-selector-grid">
        ${types.map(t => `
          <div class="block-type-option" onclick="Blocks.addBlock('${t.type}'); document.querySelector('.block-type-selector').remove();">
            <div class="block-type-option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${t.icon}</svg>
            </div>
            <span class="block-type-option-label">${t.label}</span>
          </div>
        `).join('')}
      </div>
    `;

    const rect = btn.getBoundingClientRect();
    selector.style.position = 'fixed';
    selector.style.top = (rect.bottom + 8) + 'px';
    selector.style.left = rect.left + 'px';
    document.body.appendChild(selector);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!selector.contains(e.target) && e.target !== btn) {
          selector.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 100);
  },

  async addBlock(type) {
    if (!this.currentPageId) return;
    if (!Auth.requireAdmin()) return;

    const defaultContent = this.getDefaultContent(type);
    const newBlock = {
      page_id: this.currentPageId,
      type,
      content: typeof defaultContent === 'string' ? defaultContent : JSON.stringify(defaultContent),
      language: type === 'code' ? 'javascript' : null,
      metadata: {},
      sort_order: (this.blocks.length) * 10 + 10
    };

    try {
      const block = await SupabaseAPI.createBlock(newBlock);
      this.blocks.push(block);
      Pages.markUnsaved();
      await this.reloadBlocks();
      Notifications.addToast('Blok berhasil ditambahkan', 'success');
    } catch(e) {
      Notifications.addToast('Gagal menambahkan blok: ' + e.message, 'error');
    }
  },

  getDefaultContent(type) {
    switch(type) {
      case 'heading': return { level: 2, text: 'Judul Baru' };
      case 'text': return { text: 'Tulis teks di sini...' };
      case 'code': return 'console.log("Hello World");';
      case 'quote': return { text: 'Tulis catatan di sini...', variant: 'info', label: 'Info' };
      case 'link': return { title: 'Judul Tautan', url: 'https://', description: 'Deskripsi singkat' };
      case 'checklist': return { items: [{ text: 'Item 1', checked: false }, { text: 'Item 2', checked: false }] };
      case 'snippet_embed': return { snippet_id: null, title: 'Pilih Snippet', code: '', language: 'javascript', copy_permission: 'public' };
      default: return '';
    }
  },

  async editBlock(blockId) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return;
    this.showBlockEditor(block);
  },

  showBlockEditor(block) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'block-editor-overlay';

    let content;
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch(e) {
      content = { text: block.content || '' };
    }

    const editorHtml = this.getBlockEditorHtml(block, content);

    overlay.innerHTML = `
      <div class="modal-container" style="max-width:640px;">
        <div class="modal-header">
          <span class="modal-title">Edit Blok: ${Utils.capitalize(block.type)}</span>
          <button class="modal-close-btn" onclick="document.getElementById('block-editor-overlay').remove()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          ${editorHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('block-editor-overlay').remove()">Batal</button>
          <button class="btn btn-primary" onclick="Blocks.saveBlockEdit('${block.id}', '${block.type}')">Simpan Perubahan</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  },

  getBlockEditorHtml(block, content) {
    switch(block.type) {
      case 'heading':
        return `
          <div class="form-group">
            <label class="form-label">Level Heading</label>
            <select class="form-select" id="edit-heading-level">
              <option value="1" ${content.level == 1 ? 'selected' : ''}>H1 - Judul Utama</option>
              <option value="2" ${!content.level || content.level == 2 ? 'selected' : ''}>H2 - Sub Judul</option>
              <option value="3" ${content.level == 3 ? 'selected' : ''}>H3 - Sub Sub Judul</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Teks Judul <span>*</span></label>
            <input type="text" class="form-input" id="edit-heading-text" value="${Utils.escapeHtml(content.text || '')}" placeholder="Masukkan judul..." />
          </div>
        `;

      case 'text':
        return `
          <div class="form-group">
            <label class="form-label">Konten Teks</label>
            <p class="form-hint">Gunakan \`backtick\` untuk inline code</p>
            <textarea class="form-textarea" id="edit-text-content" rows="6" placeholder="Tulis teks di sini...">${Utils.escapeHtml(content.text || block.content || '')}</textarea>
          </div>
        `;

      case 'code':
        return `
          <div class="form-group">
            <label class="form-label">Bahasa Pemrograman</label>
            <select class="form-select" id="edit-code-lang">
              ${['html','css','javascript','sql','json','bash','python','typescript','php','java'].map(l => 
                `<option value="${l}" ${block.language === l ? 'selected' : ''}>${l.toUpperCase()}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kode</label>
            <textarea class="form-textarea code-input" id="edit-code-content" rows="12" placeholder="Tulis kode di sini...">${Utils.escapeHtml(block.content || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Izin Salin</label>
            <select class="form-select" id="edit-code-copy">
              <option value="public" ${(block.metadata?.copy_permission || 'public') === 'public' ? 'selected' : ''}>Public - Semua bisa menyalin</option>
              <option value="admin" ${(block.metadata?.copy_permission) === 'admin' ? 'selected' : ''}>Admin Only - Hanya admin</option>
            </select>
          </div>
        `;

      case 'quote':
        return `
          <div class="form-group">
            <label class="form-label">Tipe</label>
            <select class="form-select" id="edit-quote-variant">
              <option value="info" ${content.variant === 'info' ? 'selected' : ''}>Info</option>
              <option value="warning" ${content.variant === 'warning' ? 'selected' : ''}>Peringatan</option>
              <option value="error" ${content.variant === 'error' ? 'selected' : ''}>Error</option>
              <option value="success" ${content.variant === 'success' ? 'selected' : ''}>Tips/Success</option>
              <option value="note" ${content.variant === 'note' ? 'selected' : ''}>Catatan</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Label (opsional)</label>
            <input type="text" class="form-input" id="edit-quote-label" value="${Utils.escapeHtml(content.label || '')}" placeholder="e.g., CATATAN PENTING" />
          </div>
          <div class="form-group">
            <label class="form-label">Teks <span>*</span></label>
            <textarea class="form-textarea" id="edit-quote-text" rows="4" placeholder="Tulis kutipan...">${Utils.escapeHtml(content.text || block.content || '')}</textarea>
          </div>
        `;

      case 'link':
        return `
          <div class="form-group">
            <label class="form-label">Judul Tautan <span>*</span></label>
            <input type="text" class="form-input" id="edit-link-title" value="${Utils.escapeHtml(content.title || '')}" placeholder="Nama tautan" />
          </div>
          <div class="form-group">
            <label class="form-label">URL <span>*</span></label>
            <input type="url" class="form-input" id="edit-link-url" value="${Utils.escapeHtml(content.url || '')}" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <input type="text" class="form-input" id="edit-link-desc" value="${Utils.escapeHtml(content.description || '')}" placeholder="Deskripsi singkat (opsional)" />
          </div>
        `;

      case 'checklist':
        const items = content.items || [];
        return `
          <div class="form-group">
            <label class="form-label">Item Checklist (satu per baris)</label>
            <textarea class="form-textarea" id="edit-checklist-items" rows="8" placeholder="Item 1&#10;Item 2&#10;Item 3">${items.map(i => typeof i === 'string' ? i : i.text || '').join('\n')}</textarea>
          </div>
        `;

      case 'snippet_embed':
        return `
          <div class="form-group">
            <label class="form-label">ID Snippet</label>
            <input type="text" class="form-input" id="edit-snippet-id" value="${Utils.escapeHtml(content.snippet_id || '')}" placeholder="UUID snippet (dari halaman Snippets)" />
            <div class="form-hint">Buka halaman Snippets, salin ID snippet yang ingin di-embed.</div>
          </div>
          <div class="form-group">
            <label class="form-label">Judul Tampilan</label>
            <input type="text" class="form-input" id="edit-snippet-title" value="${Utils.escapeHtml(content.title || '')}" placeholder="Judul snippet" />
          </div>
          <div class="form-group">
            <label class="form-label">Kode</label>
            <textarea class="form-textarea code-input" id="edit-snippet-code" rows="8" placeholder="Kode snippet...">${Utils.escapeHtml(content.code || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Bahasa</label>
            <select class="form-select" id="edit-snippet-lang">
              ${['html','css','javascript','sql','json','bash','python'].map(l => 
                `<option value="${l}" ${content.language === l ? 'selected' : ''}>${l.toUpperCase()}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Izin Salin</label>
            <select class="form-select" id="edit-snippet-copy">
              <option value="public" ${(content.copy_permission || 'public') === 'public' ? 'selected' : ''}>Public</option>
              <option value="admin" ${content.copy_permission === 'admin' ? 'selected' : ''}>Admin Only</option>
            </select>
          </div>
        `;

      default:
        return `<textarea class="form-textarea" id="edit-default-content" rows="6">${Utils.escapeHtml(block.content || '')}</textarea>`;
    }
  },

  async saveBlockEdit(blockId, type) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return;

    let updates = {};

    try {
      switch(type) {
        case 'heading': {
          const level = parseInt(document.getElementById('edit-heading-level')?.value) || 2;
          const text = document.getElementById('edit-heading-text')?.value || '';
          updates.content = JSON.stringify({ level, text });
          break;
        }
        case 'text': {
          const text = document.getElementById('edit-text-content')?.value || '';
          updates.content = JSON.stringify({ text });
          break;
        }
        case 'code': {
          updates.content = document.getElementById('edit-code-content')?.value || '';
          updates.language = document.getElementById('edit-code-lang')?.value || 'javascript';
          updates.metadata = { copy_permission: document.getElementById('edit-code-copy')?.value || 'public' };
          break;
        }
        case 'quote': {
          const variant = document.getElementById('edit-quote-variant')?.value || 'info';
          const label = document.getElementById('edit-quote-label')?.value || '';
          const text = document.getElementById('edit-quote-text')?.value || '';
          updates.content = JSON.stringify({ variant, label, text });
          break;
        }
        case 'link': {
          const title = document.getElementById('edit-link-title')?.value || '';
          const url = document.getElementById('edit-link-url')?.value || '';
          const description = document.getElementById('edit-link-desc')?.value || '';
          updates.content = JSON.stringify({ title, url, description });
          break;
        }
        case 'checklist': {
          const raw = document.getElementById('edit-checklist-items')?.value || '';
          const items = raw.split('\n').filter(l => l.trim()).map(text => ({ text: text.trim(), checked: false }));
          updates.content = JSON.stringify({ items });
          break;
        }
        case 'snippet_embed': {
          updates.content = JSON.stringify({
            snippet_id: document.getElementById('edit-snippet-id')?.value || null,
            title: document.getElementById('edit-snippet-title')?.value || '',
            code: document.getElementById('edit-snippet-code')?.value || '',
            language: document.getElementById('edit-snippet-lang')?.value || 'javascript',
            copy_permission: document.getElementById('edit-snippet-copy')?.value || 'public'
          });
          break;
        }
        default: {
          updates.content = document.getElementById('edit-default-content')?.value || '';
        }
      }

      await SupabaseAPI.updateBlock(blockId, updates);
      Object.assign(block, updates);
      Pages.markUnsaved(false);
      document.getElementById('block-editor-overlay')?.remove();
      await this.reloadBlocks();
      Notifications.addToast('Blok berhasil diperbarui', 'success');
    } catch(e) {
      Notifications.addToast('Gagal menyimpan blok: ' + e.message, 'error');
    }
  },

  async deleteBlock(blockId) {
    if (!Auth.requireAdmin()) return;
    if (!confirm('Hapus blok ini?')) return;

    try {
      await SupabaseAPI.deleteBlock(blockId);
      this.blocks = this.blocks.filter(b => b.id !== blockId);
      Pages.markUnsaved();
      await this.reloadBlocks();
      Notifications.addToast('Blok dihapus', 'info');
    } catch(e) {
      Notifications.addToast('Gagal menghapus blok: ' + e.message, 'error');
    }
  },

  async moveBlock(blockId, direction) {
    if (!Auth.requireAdmin()) return;

    const idx = this.blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= this.blocks.length) return;

    // Swap sort orders
    const temp = this.blocks[idx].sort_order;
    this.blocks[idx].sort_order = this.blocks[swapIdx].sort_order;
    this.blocks[swapIdx].sort_order = temp;

    // Swap in array
    [this.blocks[idx], this.blocks[swapIdx]] = [this.blocks[swapIdx], this.blocks[idx]];

    try {
      await SupabaseAPI.reorderBlocks([
        { id: this.blocks[idx].id, sort_order: this.blocks[idx].sort_order },
        { id: this.blocks[swapIdx].id, sort_order: this.blocks[swapIdx].sort_order }
      ]);
      Pages.markUnsaved();
      await this.reloadBlocks();
    } catch(e) {
      Notifications.addToast('Gagal menggeser blok', 'error');
    }
  },

  async updateChecklistItem(blockId, itemIndex, checked) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      let content;
      try { content = JSON.parse(block.content); } catch(e) { content = { items: [] }; }
      if (content.items && content.items[itemIndex] !== undefined) {
        if (typeof content.items[itemIndex] === 'string') {
          content.items[itemIndex] = { text: content.items[itemIndex], checked };
        } else {
          content.items[itemIndex].checked = checked;
        }
      }
      await SupabaseAPI.updateBlock(blockId, { content: JSON.stringify(content) });
      block.content = JSON.stringify(content);
    } catch(e) {
      console.warn('Checklist update error:', e);
    }
  },

  async reloadBlocks() {
    if (!this.currentPageId) return;
    this.blocks = await SupabaseAPI.getBlocks(this.currentPageId);
    this.render(this.blocks, Auth.isAdmin);
    TOC.build(this.blocks);
    Search.setBlocks(this.blocks);
    if (typeof Prism !== 'undefined') {
      setTimeout(() => Prism.highlightAll(), 50);
    }
  }
};

window.Blocks = Blocks;
