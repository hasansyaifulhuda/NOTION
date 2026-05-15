/* DEVVAULT - Search Module (In-page search) */

const Search = {
  currentBlocks: [],
  currentResults: [],
  currentIndex: -1,
  query: '',
  isOpen: false,
  dropdown: null,

  init() {
    this.dropdown = document.getElementById('search-dropdown');
    const input = document.getElementById('header-search');
    if (!input) return;

    input.addEventListener('input', Utils.debounce((e) => {
      this.query = e.target.value.trim();
      if (this.query.length >= 2) {
        this.performSearch(this.query);
      } else {
        this.clearResults();
      }
    }, 200));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) this.prevResult();
        else this.nextResult();
      }
      if (e.key === 'Escape') {
        this.clear();
        input.blur();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.highlightNext();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.highlightPrev();
      }
    });

    input.addEventListener('focus', () => {
      if (this.query.length >= 2) {
        this.showDropdown();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-search-container')) {
        this.hideDropdown();
      }
    });
  },

  setBlocks(blocks) {
    this.currentBlocks = blocks || [];
    this.clear();
  },

  performSearch(query) {
    if (!query || !this.currentBlocks.length) {
      this.clearResults();
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    this.currentBlocks.forEach(block => {
      const text = Utils.blockToSearchText(block);
      if (!text) return;

      const lowerText = text.toLowerCase();
      if (lowerText.includes(q)) {
        // Find context around match
        const idx = lowerText.indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(text.length, idx + query.length + 40);
        const context = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

        // Get block label
        let label = block.type;
        if (block.type === 'heading') {
          try {
            const c = JSON.parse(block.content);
            label = `H${c.level || 2}`;
          } catch(e) {}
        }

        // Find the anchor for heading
        let anchor = null;
        if (block.type === 'heading') {
          try {
            const c = JSON.parse(block.content);
            anchor = Utils.slugify(c.text || '');
          } catch(e) {}
        }

        results.push({
          block,
          text,
          context,
          label,
          anchor,
          score: idx === 0 ? 2 : 1
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    this.currentResults = results;
    this.currentIndex = -1;
    this.renderDropdown(results, query);
  },

  renderDropdown(results, query) {
    const dd = this.dropdown;
    if (!dd) return;

    if (results.length === 0) {
      dd.innerHTML = `<div class="search-empty">Tidak ada hasil untuk "<strong>${Utils.escapeHtml(query)}</strong>"</div>`;
      dd.classList.add('visible');
      return;
    }

    const typeLabels = {
      heading: 'Judul',
      text: 'Teks',
      code: 'Kode',
      quote: 'Kutipan',
      link: 'Tautan',
      checklist: 'Checklist',
      snippet_embed: 'Snippet'
    };

    const typeIcons = {
      heading: `<path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/>`,
      text: `<path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/>`,
      code: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
      quote: `<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>`,
      link: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
      checklist: `<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
      snippet_embed: `<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M13 6h3a2 2 0 0 1 2 2v3"/><rect width="8" height="8" x="13" y="13" rx="2"/>`
    };

    const html = results.slice(0, 8).map((r, i) => `
      <div class="search-result-item" data-index="${i}" onclick="Search.selectResult(${i})">
        <div class="search-result-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${typeIcons[r.block.type] || typeIcons.text}</svg>
        </div>
        <div class="search-result-content">
          <div class="search-result-title">${Utils.highlightText(Utils.truncate(r.text, 60), query)}</div>
          <div class="search-result-context">${Utils.highlightText(r.context, query)}</div>
        </div>
        <div class="search-result-type">${typeLabels[r.block.type] || r.block.type}</div>
      </div>
    `).join('');

    dd.innerHTML = html;
    dd.classList.add('visible');
  },

  selectResult(index) {
    if (index < 0 || index >= this.currentResults.length) return;
    this.currentIndex = index;
    const result = this.currentResults[index];
    this.scrollToBlock(result);
    this.hideDropdown();
    document.getElementById('header-search')?.blur();
  },

  scrollToBlock(result) {
    let el = null;

    if (result.anchor) {
      el = document.getElementById(result.anchor);
    }

    if (!el) {
      el = document.querySelector(`[data-block-id="${result.block.id}"]`);
    }

    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight effect
    el.classList.add('search-highlight-block');
    setTimeout(() => el.classList.remove('search-highlight-block'), 2000);
  },

  nextResult() {
    if (this.currentResults.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.currentResults.length;
    this.scrollToBlock(this.currentResults[this.currentIndex]);
    this.highlightDropdownItem(this.currentIndex);
  },

  prevResult() {
    if (this.currentResults.length === 0) return;
    this.currentIndex = this.currentIndex <= 0 
      ? this.currentResults.length - 1 
      : this.currentIndex - 1;
    this.scrollToBlock(this.currentResults[this.currentIndex]);
    this.highlightDropdownItem(this.currentIndex);
  },

  highlightNext() {
    const items = document.querySelectorAll('.search-result-item');
    if (!items.length) return;
    const highlighted = document.querySelector('.search-result-item.highlighted');
    const idx = highlighted ? parseInt(highlighted.dataset.index) : -1;
    const next = Math.min(idx + 1, items.length - 1);
    items.forEach(i => i.classList.remove('highlighted'));
    items[next]?.classList.add('highlighted');
  },

  highlightPrev() {
    const items = document.querySelectorAll('.search-result-item');
    if (!items.length) return;
    const highlighted = document.querySelector('.search-result-item.highlighted');
    const idx = highlighted ? parseInt(highlighted.dataset.index) : items.length;
    const prev = Math.max(idx - 1, 0);
    items.forEach(i => i.classList.remove('highlighted'));
    items[prev]?.classList.add('highlighted');
  },

  highlightDropdownItem(index) {
    const items = document.querySelectorAll('.search-result-item');
    items.forEach(i => i.classList.remove('highlighted'));
    items[index]?.classList.add('highlighted');
  },

  showDropdown() {
    if (this.dropdown) this.dropdown.classList.add('visible');
  },

  hideDropdown() {
    if (this.dropdown) this.dropdown.classList.remove('visible');
  },

  clearResults() {
    this.currentResults = [];
    this.currentIndex = -1;
    this.hideDropdown();
  },

  clear() {
    this.query = '';
    this.clearResults();
    const input = document.getElementById('header-search');
    if (input) input.value = '';
  },

  // Mobile fullscreen search
  openMobileSearch() {
    const overlay = document.createElement('div');
    overlay.id = 'mobile-search-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: var(--bg-primary);
      z-index: 9000; display: flex; flex-direction: column;
    `;
    overlay.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border-color);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
        <input id="mobile-search-input" type="text" placeholder="Cari di halaman ini..." 
          style="flex:1;background:transparent;border:none;font-size:16px;color:var(--text-primary);outline:none;" 
          autocomplete="off" />
        <button onclick="Search.closeMobileSearch()" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>
      <div id="mobile-search-results" style="flex:1;overflow-y:auto;padding:8px;"></div>
    `;
    document.body.appendChild(overlay);

    const mobileInput = overlay.querySelector('#mobile-search-input');
    mobileInput.focus();

    mobileInput.addEventListener('input', Utils.debounce((e) => {
      const q = e.target.value.trim();
      if (q.length >= 2) {
        this.performSearch(q);
        this.renderMobileResults(q);
      } else {
        document.getElementById('mobile-search-results').innerHTML = '';
      }
    }, 200));
  },

  renderMobileResults(query) {
    const container = document.getElementById('mobile-search-results');
    if (!container) return;

    if (this.currentResults.length === 0) {
      container.innerHTML = `<div class="search-empty">Tidak ada hasil untuk "${Utils.escapeHtml(query)}"</div>`;
      return;
    }

    container.innerHTML = this.currentResults.slice(0, 15).map((r, i) => `
      <div class="search-result-item" onclick="Search.selectMobileResult(${i})" style="border-radius:var(--radius-sm);margin-bottom:4px;">
        <div class="search-result-content">
          <div class="search-result-title">${Utils.highlightText(Utils.truncate(r.text, 60), query)}</div>
          <div class="search-result-context">${Utils.highlightText(r.context, query)}</div>
        </div>
        <div class="search-result-type">${r.block.type}</div>
      </div>
    `).join('');
  },

  selectMobileResult(index) {
    this.currentIndex = index;
    this.scrollToBlock(this.currentResults[index]);
    this.closeMobileSearch();
  },

  closeMobileSearch() {
    const overlay = document.getElementById('mobile-search-overlay');
    if (overlay) overlay.remove();
  }
};

window.Search = Search;
