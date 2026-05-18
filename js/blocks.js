/* ============================================================
   DevVault - Block System
   js/blocks.js
   ============================================================ */

'use strict';

window.DevVaultBlocks = (function () {
  const {
    qs, qsa, sanitize, show, hide, on, generateId,
    copyToClipboard, lsGet, lsSet
  } = window.DevVaultUtils;

  /* ─── State ─── */
  let currentPageId = null;
  let blocks = [];
  let editingBlockId = null;
  let dragSrcIndex = null;

  /* ─── Block Form Fields ─── */

  function getBlockFormFields(type, block = null) {
    const content = block?.content || {};

    switch (type) {
      case 'heading':
        return `
          <div class="form-group">
            <label class="form-label">Level</label>
            <select class="form-select" id="block-field-level">
              <option value="1" ${(content.level || 1) === 1 ? 'selected' : ''}>H1</option>
              <option value="2" ${(content.level || 1) === 2 ? 'selected' : ''}>H2</option>
              <option value="3" ${(content.level || 1) === 3 ? 'selected' : ''}>H3</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Text *</label>
            <input type="text" class="form-input" id="block-field-text" value="${sanitize(content.text || '')}" placeholder="Heading text" required />
          </div>
        `;

      case 'text':
        return `
          <div class="form-group">
            <label class="form-label">Content *</label>
            <textarea class="form-textarea" id="block-field-text" rows="5" placeholder="Paragraph text...">${sanitize(content.text || '')}</textarea>
          </div>
        `;

      case 'code':
        return `
          <div class="form-group">
            <label class="form-label">Language</label>
            <select class="form-select" id="block-field-language">
              ${['javascript','html','css','sql','json','bash','python'].map(l =>
                `<option value="${l}" ${(content.language || 'javascript') === l ? 'selected' : ''}>${l.toUpperCase()}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Code *</label>
            <textarea class="form-textarea code-textarea" id="block-field-code" rows="10" placeholder="// Your code here">${sanitize(content.code || '')}</textarea>
          </div>
        `;

      case 'quote':
        return `
          <div class="form-group">
            <label class="form-label">Quote Text *</label>
            <textarea class="form-textarea" id="block-field-text" rows="4" placeholder="Quote text...">${sanitize(content.text || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Author (optional)</label>
            <input type="text" class="form-input" id="block-field-author" value="${sanitize(content.author || '')}" placeholder="Quote author" />
          </div>
        `;

      case 'link':
        return `
          <div class="form-group">
            <label class="form-label">URL *</label>
            <input type="url" class="form-input" id="block-field-url" value="${sanitize(content.url || '')}" placeholder="https://..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Link Text</label>
            <input type="text" class="form-input" id="block-field-text" value="${sanitize(content.text || '')}" placeholder="Display text (optional)" />
          </div>
        `;

      case 'checklist':
        const items = content.items || [''];
        return `
          <div class="form-group">
            <label class="form-label">Checklist Items</label>
            <div id="block-checklist-items">
              ${items.map((item, i) => `
                <div class="checklist-edit-item" style="display:flex;gap:8px;margin-bottom:8px;">
                  <input type="text" class="form-input" id="block-field-item-${i}" value="${sanitize(item)}" placeholder="Item ${i + 1}" />
                  <button type="button" class="btn btn-ghost btn-sm remove-checklist-item" data-index="${i}" aria-label="Remove item">×</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="add-checklist-item" style="margin-top:4px;">
              + Add item
            </button>
          </div>
        `;

      case 'snippet_embed':
        return `
          <div class="form-group">
            <label class="form-label">Snippet ID</label>
            <input type="text" class="form-input" id="block-field-snippet-id" value="${sanitize(content.snippet_id || '')}" placeholder="Snippet ID to embed" />
            <span style="font-size:0.75rem;color:var(--color-text-muted);margin-top:4px;display:block;">
              Enter the snippet ID to embed it in this page
            </span>
          </div>
        `;

      default:
        return `<p style="color:var(--color-text-muted);">Unknown block type</p>`;
    }
  }

  /* ─── Collect Block Content from Form ─── */

  function collectBlockContent(type) {
    switch (type) {
      case 'heading':
        return {
          level: parseInt(qs('#block-field-level')?.value || '1', 10),
          text: qs('#block-field-text')?.value?.trim() || '',
        };
      case 'text':
        return { text: qs('#block-field-text')?.value?.trim() || '' };
      case 'code':
        return {
          language: qs('#block-field-language')?.value || 'javascript',
          code: qs('#block-field-code')?.value || '',
        };
      case 'quote':
        return {
          text: qs('#block-field-text')?.value?.trim() || '',
          author: qs('#block-field-author')?.value?.trim() || '',
        };
      case 'link':
        return {
          url: qs('#block-field-url')?.value?.trim() || '',
          text: qs('#block-field-text')?.value?.trim() || '',
        };
      case 'checklist': {
        const items = [];
        document.querySelectorAll('[id^="block-field-item-"]').forEach(input => {
          const val = input.value.trim();
          if (val) items.push(val);
        });
        return { items };
      }
      case 'snippet_embed':
        return { snippet_id: qs('#block-field-snippet-id')?.value?.trim() || '' };
      default:
        return {};
    }
  }

  /* ─── Validate Block Content ─── */

  function validateBlockContent(type, content) {
    switch (type) {
      case 'heading':
      case 'text':
      case 'quote':
        return content.text && content.text.length > 0;
      case 'code':
        return content.code && content.code.length > 0;
      case 'link':
        return content.url && content.url.length > 0;
      case 'checklist':
        return content.items && content.items.length > 0;
      case 'snippet_embed':
        return content.snippet_id && content.snippet_id.length > 0;
      default:
        return true;
    }
  }

  /* ─── Render Blocks ─── */

  function renderBlocks(blocksData, pageId, container) {
    blocks = blocksData || [];
    currentPageId = pageId;

    if (!container) return;

    const isAdmin = window.DevVaultAuth && window.DevVaultAuth.isAdmin();

    if (blocks.length === 0) {
      container.innerHTML = isAdmin ? `
        <div class="empty-state" style="min-height:240px;">
          <div class="empty-state-icon">
            <i data-lucide="layout" aria-hidden="true"></i>
          </div>
          <p class="empty-state-title">No blocks yet</p>
          <p class="empty-state-desc">Add your first block to start building this page.</p>
        </div>
      ` : `
        <div class="empty-state" style="min-height:240px;">
          <p class="empty-state-desc">This page has no content yet.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [container] });
      return;
    }

    container.innerHTML = blocks.map((block, index) => renderBlock(block, index, isAdmin)).join('');

    // Init Prism highlighting
    if (window.Prism) {
      setTimeout(() => {
        try { window.Prism.highlightAllUnder(container); } catch {}
      }, 50);
    }

    // Init lucide icons
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });

    // Bind block interactions
    bindBlockEvents(container, isAdmin);

    // Build TOC
    if (window.DevVaultTOC) {
      window.DevVaultTOC.buildTOC(container);
    }
  }

  function renderBlock(block, index, isAdmin) {
    const blockInner = renderBlockContent(block);
    const blockId = block.id;

    const adminActions = isAdmin ? `
      <div class="block-actions" role="group" aria-label="Block actions">
        <button class="icon-btn" data-block-edit="${blockId}" aria-label="Edit block" title="Edit">
          <i data-lucide="pencil" style="width:12px;height:12px;" aria-hidden="true"></i>
        </button>
        <button class="icon-btn" data-block-move-up="${blockId}" aria-label="Move up" title="Move up" ${index === 0 ? 'disabled' : ''}>
          <i data-lucide="chevron-up" style="width:12px;height:12px;" aria-hidden="true"></i>
        </button>
        <button class="icon-btn" data-block-move-down="${blockId}" aria-label="Move down" title="Move down">
          <i data-lucide="chevron-down" style="width:12px;height:12px;" aria-hidden="true"></i>
        </button>
        <button class="icon-btn" style="color:var(--color-error);" data-block-delete="${blockId}" aria-label="Delete block" title="Delete">
          <i data-lucide="trash-2" style="width:12px;height:12px;" aria-hidden="true"></i>
        </button>
      </div>
    ` : '';

    return `
  <div
    id="block-${blockId}"
    class="block-container"
    data-block-id="${blockId}"
    data-block-type="${block.type}"
    draggable="${isAdmin}"
  >
        ${blockInner}
        ${adminActions}
      </div>
    `;
  }

  function renderBlockContent(block) {
    const content = block.content || {};

    switch (block.type) {
      case 'heading': {
        const level = content.level || 1;
        const id = `heading-${block.id}`;
        const cls = level === 1 ? 'block-heading-1' : level === 2 ? 'block-heading-2' : 'block-heading-3';
        return `<h${level} id="${id}" class="${cls}" data-heading-level="${level}" tabindex="-1">${sanitize(content.text || '')}</h${level}>`;
      }

      case 'text':
        return `<p class="block-text">${sanitize(content.text || '').replace(/\n/g, '<br>')}</p>`;

      case 'code':
        return renderCodeBlock(block.id, content.language || 'javascript', content.code || '');

      case 'quote':
        return `
          <blockquote class="block-quote">
            <p>${sanitize(content.text || '')}</p>
            ${content.author ? `<footer style="margin-top:8px;font-size:0.875rem;font-style:normal;color:var(--color-text-muted);">— ${sanitize(content.author)}</footer>` : ''}
          </blockquote>
        `;

      case 'link':
        return `
          <a href="${sanitize(content.url || '#')}" class="block-link" target="_blank" rel="noopener noreferrer"
            aria-label="${sanitize(content.text || content.url || 'External link')}">
            <i data-lucide="external-link" aria-hidden="true"></i>
            <span>${sanitize(content.text || content.url || 'Link')}</span>
          </a>
        `;

      case 'checklist': {
        const items = content.items || [];
        return `
          <ul class="block-checklist" aria-label="Checklist">
            ${items.map((item, i) => `
              <li class="checklist-item ${content.checked?.[i] ? 'checked' : ''}"
                data-checklist-block="${block.id}" data-item-index="${i}">
                <input type="checkbox" ${content.checked?.[i] ? 'checked' : ''} aria-label="${sanitize(item)}" />
                <span>${sanitize(item)}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }

      case 'snippet_embed':
        return `
          <div class="snippet-embed-placeholder" data-snippet-embed="${content.snippet_id || ''}"
            style="padding:16px;border:1px dashed var(--color-border);border-radius:8px;text-align:center;color:var(--color-text-muted);">
            <i data-lucide="code" style="width:16px;height:16px;" aria-hidden="true"></i>
            <span style="margin-left:8px;">Snippet: ${sanitize(content.snippet_id || 'Not configured')}</span>
          </div>
        `;

      default:
        return `<div style="color:var(--color-text-muted);font-size:0.875rem;">Unknown block type: ${sanitize(block.type)}</div>`;
    }
  }

  /* ─── Render Code Block ─── */

  function renderCodeBlock(blockId, language, code) {
    return `
      <div class="code-block-wrapper" data-code-block="${blockId}">
        <div class="code-block-toolbar" role="toolbar" aria-label="Code block controls">
          <span class="code-block-lang" aria-label="Language: ${sanitize(language)}">${sanitize(language)}</span>
          <div class="code-block-actions">
            <button class="code-action-btn" data-code-collapse="${blockId}" aria-label="Toggle collapse" title="Collapse">
              <i data-lucide="minimize-2" aria-hidden="true"></i>
              <span>Collapse</span>
            </button>
            <button class="code-action-btn" data-code-fullscreen="${blockId}" aria-label="Fullscreen" title="Fullscreen">
              <i data-lucide="maximize-2" aria-hidden="true"></i>
              <span>Full</span>
            </button>
            <button class="code-action-btn" data-code-copy="${blockId}" aria-label="Copy code" title="Copy">
              <i data-lucide="copy" aria-hidden="true"></i>
              <span>Copy</span>
            </button>
          </div>
        </div>
        <div class="code-block-body line-numbers" id="code-body-${blockId}">
          <pre class="language-${sanitize(language)} line-numbers"><code class="language-${sanitize(language)}">${escapeHTML(code)}</code></pre>
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

  /* ─── Bind Block Events ─── */

  function bindBlockEvents(container, isAdmin) {
    // Checklist item toggle
    container.querySelectorAll('.checklist-item').forEach(item => {
      on(item.querySelector('input[type="checkbox"]'), 'change', (e) => {
        const blockId = item.dataset.checklistBlock;
        const itemIndex = parseInt(item.dataset.itemIndex, 10);
        const checked = e.target.checked;
        if (checked) item.classList.add('checked');
        else item.classList.remove('checked');
        handleChecklistToggle(blockId, itemIndex, checked);
      });
    });

    // Code block actions
    container.querySelectorAll('[data-code-copy]').forEach(btn => {
      on(btn, 'click', async () => {
        const blockId = btn.dataset.codeCopy;
        const block = blocks.find(b => b.id === blockId);
        if (block && block.content?.code) {
          const success = await copyToClipboard(block.content.code);
          if (success) {
            btn.classList.add('copied');
            btn.innerHTML = `<i data-lucide="check" aria-hidden="true"></i><span>Copied!</span>`;
            if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
            window.DevVaultNotifications.success('Copied!', 'Code copied to clipboard');
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.innerHTML = `<i data-lucide="copy" aria-hidden="true"></i><span>Copy</span>`;
              if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
            }, 2000);
          }
        }
      });
    });

    container.querySelectorAll('[data-code-collapse]').forEach(btn => {
      on(btn, 'click', () => {
        const blockId = btn.dataset.codeCollapse;
        const body = qs(`#code-body-${blockId}`);
        if (body) {
          body.classList.toggle('collapsed');
          const isCollapsed = body.classList.contains('collapsed');
          btn.innerHTML = isCollapsed
            ? `<i data-lucide="maximize-2" aria-hidden="true"></i><span>Expand</span>`
            : `<i data-lucide="minimize-2" aria-hidden="true"></i><span>Collapse</span>`;
          if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
          btn.setAttribute('aria-label', isCollapsed ? 'Expand code' : 'Collapse code');
        }
      });
    });

    container.querySelectorAll('[data-code-fullscreen]').forEach(btn => {
      on(btn, 'click', () => {
        const blockId = btn.dataset.codeFullscreen;
        const wrapper = qs(`[data-code-block="${blockId}"]`, container);
        if (wrapper) {
          wrapper.classList.toggle('fullscreen');
          const isFullscreen = wrapper.classList.contains('fullscreen');
          btn.innerHTML = isFullscreen
            ? `<i data-lucide="minimize" aria-hidden="true"></i><span>Exit</span>`
            : `<i data-lucide="maximize-2" aria-hidden="true"></i><span>Full</span>`;
          if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
          btn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
        }
      });
    });

    if (!isAdmin) return;

    // Admin: Edit block
    container.querySelectorAll('[data-block-edit]').forEach(btn => {
      on(btn, 'click', () => {
        openEditModal(btn.dataset.blockEdit);
      });
    });

    // Admin: Delete block
    container.querySelectorAll('[data-block-delete]').forEach(btn => {
      on(btn, 'click', () => {
        deleteBlockConfirm(btn.dataset.blockDelete);
      });
    });

    // Admin: Move up
    container.querySelectorAll('[data-block-move-up]').forEach(btn => {
      on(btn, 'click', () => {
        moveBlock(btn.dataset.blockMoveUp, 'up');
      });
    });

    // Admin: Move down
    container.querySelectorAll('[data-block-move-down]').forEach(btn => {
      on(btn, 'click', () => {
        moveBlock(btn.dataset.blockMoveDown, 'down');
      });
    });
  }

  /* ─── Checklist Toggle ─── */

  async function handleChecklistToggle(blockId, itemIndex, checked) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newContent = { ...block.content };
    if (!newContent.checked) newContent.checked = {};
    newContent.checked[itemIndex] = checked;

    try {
      await window.DevVaultAPI.updateBlock(blockId, { content: newContent });
      block.content = newContent;
    } catch (err) {
      console.error('[Blocks] Checklist toggle error:', err);
    }
  }

  /* ─── Move Block ─── */

  async function moveBlock(blockId, direction) {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    // Swap
    const temp = blocks[index];
    blocks[index] = blocks[newIndex];
    blocks[newIndex] = temp;

    const orderedIds = blocks.map(b => b.id);

    try {
      await window.DevVaultAPI.reorderBlocks(currentPageId, orderedIds);
      // Re-render
      const container = qs('#blocks-container');
      if (container) {
        const isAdmin = window.DevVaultAuth && window.DevVaultAuth.isAdmin();
        renderBlocks(blocks, currentPageId, container);
      }
    } catch (err) {
      console.error('[Blocks] Move error:', err);
      window.DevVaultNotifications.error('Failed to reorder blocks');
    }
  }

  /* ─── Add Block Modal ─── */

  function openAddModal(pageId) {
    currentPageId = pageId;
    editingBlockId = null;

    const modal = qs('#block-modal');
    const title = qs('#block-modal-title');
    const typeSelect = qs('#block-form-type');
    const fieldsContainer = qs('#block-form-fields');
    const submitBtn = qs('#block-form-submit');
    const pageIdField = qs('#block-form-page-id');
    const blockIdField = qs('#block-form-id');

    if (!modal) return;

    if (title) title.textContent = 'Add Block';
    if (submitBtn) submitBtn.textContent = 'Add Block';
    if (pageIdField) pageIdField.value = pageId;
    if (blockIdField) blockIdField.value = '';

    if (typeSelect) {
      typeSelect.value = 'heading';
      if (fieldsContainer) fieldsContainer.innerHTML = getBlockFormFields('heading');

      // Type change handler
      const existingHandler = typeSelect._changeHandler;
      if (existingHandler) typeSelect.removeEventListener('change', existingHandler);
      typeSelect._changeHandler = () => {
        if (fieldsContainer) {
          fieldsContainer.innerHTML = getBlockFormFields(typeSelect.value);
          bindChecklistFieldEvents(fieldsContainer);
        }
      };
      typeSelect.addEventListener('change', typeSelect._changeHandler);
      bindChecklistFieldEvents(fieldsContainer);
    }

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();

    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /* ─── Edit Block Modal ─── */

  function openEditModal(blockId) {
    editingBlockId = blockId;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const modal = qs('#block-modal');
    const title = qs('#block-modal-title');
    const typeSelect = qs('#block-form-type');
    const fieldsContainer = qs('#block-form-fields');
    const submitBtn = qs('#block-form-submit');
    const blockIdField = qs('#block-form-id');

    if (!modal) return;

    if (title) title.textContent = 'Edit Block';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    if (blockIdField) blockIdField.value = blockId;
    if (typeSelect) {
      typeSelect.value = block.type;
      typeSelect.disabled = true;
    }
    if (fieldsContainer) {
      fieldsContainer.innerHTML = getBlockFormFields(block.type, block);
      bindChecklistFieldEvents(fieldsContainer);
    }

    show(modal, 'flex');
    window.DevVaultUtils.lockScroll();

    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function bindChecklistFieldEvents(container) {
    if (!container) return;

    const addBtn = container.querySelector('#add-checklist-item');
    if (addBtn) {
      on(addBtn, 'click', () => {
        const itemsContainer = qs('#block-checklist-items');
        if (!itemsContainer) return;
        const count = itemsContainer.querySelectorAll('[id^="block-field-item-"]').length;
        const div = document.createElement('div');
        div.className = 'checklist-edit-item';
        div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
        div.innerHTML = `
          <input type="text" class="form-input" id="block-field-item-${count}" placeholder="Item ${count + 1}" />
          <button type="button" class="btn btn-ghost btn-sm remove-checklist-item" data-index="${count}" aria-label="Remove">×</button>
        `;
        itemsContainer.appendChild(div);
        bindRemoveChecklistEvents(itemsContainer);
      });
    }
    bindRemoveChecklistEvents(container);
  }

  function bindRemoveChecklistEvents(container) {
    container.querySelectorAll('.remove-checklist-item').forEach(btn => {
      btn.onclick = () => {
        btn.closest('.checklist-edit-item')?.remove();
      };
    });
  }

  /* ─── Handle Block Form Submit ─── */

  async function handleBlockFormSubmit(e) {
    e.preventDefault();

    if (!window.DevVaultAuth.isAdmin()) {
      window.DevVaultAuth.showLoginModal();
      return;
    }

    const typeSelect = qs('#block-form-type');
    const type = typeSelect?.value || 'text';
    const content = collectBlockContent(type);

    if (!validateBlockContent(type, content)) {
      window.DevVaultNotifications.warning('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const submitBtn = qs('#block-form-submit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (editingBlockId) {
        // Update block
        const { data, error } = await window.DevVaultAPI.updateBlock(editingBlockId, { content });
        if (error) throw error;

        // Update in local state
        const idx = blocks.findIndex(b => b.id === editingBlockId);
        if (idx !== -1 && data) blocks[idx] = data;

        window.DevVaultNotifications.success('Block updated');
      } else {
        // Create block
        const pageId = qs('#block-form-page-id')?.value || currentPageId;
        const orderIndex = blocks.length;
        const { data, error } = await window.DevVaultAPI.createBlock(pageId, { type, content, order_index: orderIndex });
        if (error) throw error;

        if (data) blocks.push(data);
        window.DevVaultNotifications.success('Block added');
        window.DevVaultNotifications.addNotification(`Block added to page`, 'success');
      }

      // Re-render
      const container = qs('#blocks-container');
      if (container) renderBlocks(blocks, currentPageId, container);

      closeBlockModal();
    } catch (err) {
      console.error('[Blocks] Save error:', err);
      window.DevVaultNotifications.error('Failed to save block', err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /* ─── Delete Block ─── */

  function deleteBlockConfirm(blockId) {
    if (window.DevVaultModal) {
      window.DevVaultModal.confirm(
        'Delete Block',
        'Are you sure you want to delete this block? This action cannot be undone.',
        async () => {
          try {
            const { error } = await window.DevVaultAPI.deleteBlock(blockId);
            if (error) throw error;
            blocks = blocks.filter(b => b.id !== blockId);
            const container = qs('#blocks-container');
            if (container) renderBlocks(blocks, currentPageId, container);
            window.DevVaultNotifications.success('Block deleted');
          } catch (err) {
            window.DevVaultNotifications.error('Failed to delete block', err.message);
          }
        }
      );
    }
  }

  /* ─── Close Modal ─── */

  function closeBlockModal() {
    const modal = qs('#block-modal');
    if (modal) hide(modal);
    window.DevVaultUtils.unlockScroll();
    editingBlockId = null;

    const typeSelect = qs('#block-form-type');
    if (typeSelect) typeSelect.disabled = false;
  }

  /* ─── Initialize ─── */

  function init() {
    // Block form submit
    const blockForm = qs('#block-form');
    if (blockForm) on(blockForm, 'submit', handleBlockFormSubmit);

    // Close modal buttons
    document.querySelectorAll('[data-modal="block-modal"].modal-close').forEach(btn => {
      on(btn, 'click', closeBlockModal);
    });

    // Overlay click
    const blockModal = qs('#block-modal');
    if (blockModal) {
      on(blockModal, 'click', (e) => {
        if (e.target === blockModal) closeBlockModal();
      });
    }

    // ESC key
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = qs('#block-modal');
        if (modal && modal.style.display !== 'none') closeBlockModal();
      }
    });
  }

  /* ─── Public API ─── */
  return {
    init,
    renderBlocks,
    renderCodeBlock,
    openAddModal,
    openEditModal,
    closeBlockModal,
    get blocks() { return blocks; },
  };
})();
