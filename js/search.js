/* ============================================================
   DevVault - Search System
   js/search.js
   ============================================================ */

'use strict';

window.DevVaultSearch = (function () {
  const { qs, on, show, hide, sanitize, highlightText, debounce, lockScroll, unlockScroll } = window.DevVaultUtils;

  /* ─── State ─── */
  let searchIndex = [];
  let currentResults = [];
  let currentResultIndex = -1;
  let searchModal = null;
  let searchInput = null;
  let searchResults = null;
  let searchCount = null;
  let isOpen = false;

  /* ─── Build Search Index from blocks ─── */

  function buildIndex(blocks, page) {
    searchIndex = [];

    if (!blocks || !blocks.length) return;

    blocks.forEach(block => {
      if (!block.content) return;

      switch (block.type) {
        case 'heading': {
          const text = block.content.text || '';
          if (text) {
            searchIndex.push({
              blockId: block.id,
              type: 'Heading',
              text,
              level: block.content.level || 1,
            });
          }
          break;
        }
        case 'text': {
          const text = block.content.text || '';
          if (text) {
            searchIndex.push({
              blockId: block.id,
              type: 'Text',
              text,
            });
          }
          break;
        }
        case 'code': {
          const code = block.content.code || '';
          const lang = block.content.language || 'code';
          if (code) {
            searchIndex.push({
              blockId: block.id,
              type: `Code (${lang})`,
              text: code,
            });
          }
          break;
        }
        case 'quote': {
          const text = block.content.text || '';
          if (text) {
            searchIndex.push({
              blockId: block.id,
              type: 'Quote',
              text,
            });
          }
          break;
        }
        case 'checklist': {
          const items = block.content.items || [];
          items.forEach((item, i) => {
            if (item) {
              searchIndex.push({
                blockId: block.id,
                type: 'Checklist',
                text: item,
                itemIndex: i,
              });
            }
          });
          break;
        }
        case 'link': {
          const text = block.content.text || block.content.url || '';
          if (text) {
            searchIndex.push({
              blockId: block.id,
              type: 'Link',
              text,
            });
          }
          break;
        }
        default:
          break;
      }
    });
  }

  /* ─── Perform Search ─── */

  function performSearch(query) {
    query = (query || '').trim().toLowerCase();
    currentResults = [];
    currentResultIndex = -1;

    if (!query || query.length < 1) {
      renderResults([]);
      updateCount();
      clearHighlights();
      return;
    }

    currentResults = searchIndex.filter(item =>
      item.text.toLowerCase().includes(query)
    );

    renderResults(currentResults, query);
    updateCount();

    if (currentResults.length > 0) {
      currentResultIndex = 0;
      scrollToResult(currentResults[0]);
    }
  }

  /* ─── Render Results ─── */

  function renderResults(results, query = '') {
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML = query ? `
        <div style="padding:16px;text-align:center;color:var(--color-text-muted);font-size:0.875rem;">
          No results found for "${sanitize(query)}"
        </div>
      ` : '';
      return;
    }

    searchResults.innerHTML = results.slice(0, 30).map((item, index) => {
      const highlighted = highlightText(item.text.slice(0, 120) + (item.text.length > 120 ? '...' : ''), query);
      return `
        <div class="search-result-item" data-result-index="${index}" data-block-id="${item.blockId}"
          role="listitem" tabindex="0"
          aria-label="${sanitize(item.type)}: ${sanitize(item.text.slice(0, 50))}">
          <div class="result-type">${sanitize(item.type)}</div>
          <div class="result-text">${highlighted}</div>
        </div>
      `;
    }).join('');

    // Bind click handlers
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      on(item, 'click', () => {
        const idx = parseInt(item.dataset.resultIndex, 10);
        jumpToResult(idx);
      });
      on(item, 'keydown', (e) => {
        if (e.key === 'Enter') {
          const idx = parseInt(item.dataset.resultIndex, 10);
          jumpToResult(idx);
        }
      });
    });
  }

  /* ─── Jump to Result ─── */

  function jumpToResult(index) {
    if (index < 0 || index >= currentResults.length) return;
    currentResultIndex = index;

    // Highlight current result item in list
    if (searchResults) {
      searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.style.background = i === index ? 'var(--color-bg)' : '';
        el.style.borderLeft = i === index ? '3px solid var(--color-accent)' : '';
      });
    }

    scrollToResult(currentResults[index]);
    updateCount();
  }

  function scrollToResult(result) {
    if (!result) return;

    // Find block element in page content
    const blockEl = qs(`[data-block-id="${result.blockId}"]`);
    if (blockEl) {
      const mainContent = qs('#main-content');
      if (mainContent) {
        const topbarHeight = 56;
        const offsetTop = blockEl.offsetTop - topbarHeight - 16;
        mainContent.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }

      // Highlight the block temporarily
      blockEl.style.transition = 'background 0.3s ease';
      blockEl.style.background = 'rgba(56, 189, 248, 0.08)';
      blockEl.style.borderRadius = '6px';
      setTimeout(() => {
        blockEl.style.background = '';
        blockEl.style.borderRadius = '';
      }, 2000);
    }
  }

  /* ─── Navigation ─── */

  function navigatePrev() {
    if (currentResults.length === 0) return;
    currentResultIndex = currentResultIndex <= 0 ? currentResults.length - 1 : currentResultIndex - 1;
    jumpToResult(currentResultIndex);
  }

  function navigateNext() {
    if (currentResults.length === 0) return;
    currentResultIndex = currentResultIndex >= currentResults.length - 1 ? 0 : currentResultIndex + 1;
    jumpToResult(currentResultIndex);
  }

  /* ─── Count Display ─── */

  function updateCount() {
    if (!searchCount) return;
    if (currentResults.length === 0) {
      searchCount.textContent = '';
    } else {
      searchCount.textContent = `${currentResultIndex + 1} of ${currentResults.length} result${currentResults.length !== 1 ? 's' : ''}`;
    }
  }

  /* ─── Highlight Clearing ─── */

  function clearHighlights() {
    // Remove block highlights
    const mainContent = qs('#main-content');
    if (mainContent) {
      mainContent.querySelectorAll('[data-block-id]').forEach(el => {
        el.style.background = '';
        el.style.borderRadius = '';
        el.style.borderLeft = '';
      });
    }
  }

  /* ─── Open/Close Modal ─── */

  function openSearch() {
    searchModal = qs('#search-modal');
    searchInput = qs('#search-input');
    searchResults = qs('#search-results');
    searchCount = qs('#search-count');

    if (!searchModal) return;

    show(searchModal, 'flex');
    lockScroll();
    isOpen = true;

    // Clear previous state
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    if (searchResults) searchResults.innerHTML = '';
    if (searchCount) searchCount.textContent = '';
    currentResults = [];
    currentResultIndex = -1;
  }

  function closeSearch() {
    if (!searchModal) searchModal = qs('#search-modal');
    if (searchModal) hide(searchModal);
    unlockScroll();
    isOpen = false;
    clearHighlights();
  }

  /* ─── Initialize ─── */

  const debouncedSearch = debounce((query) => {
    performSearch(query);
  }, 250);

  function init() {
    searchModal = qs('#search-modal');
    searchInput = qs('#search-input');
    searchResults = qs('#search-results');
    searchCount = qs('#search-count');

    // Search input handler
    if (searchInput) {
      on(searchInput, 'input', (e) => {
        debouncedSearch(e.target.value);
      });

      on(searchInput, 'keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateNext();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigatePrev();
        } else if (e.key === 'Enter') {
          navigateNext();
        }
      });
    }

    // Navigation buttons
    const prevBtn = qs('#search-prev-btn');
    const nextBtn = qs('#search-next-btn');
    if (prevBtn) on(prevBtn, 'click', navigatePrev);
    if (nextBtn) on(nextBtn, 'click', navigateNext);

    // Mobile search button
    const mobileSearchBtn = qs('#mobile-search-btn');
    if (mobileSearchBtn) on(mobileSearchBtn, 'click', openSearch);

    // Close buttons
    const closeButtons = document.querySelectorAll('[data-modal="search-modal"].modal-close');
    closeButtons.forEach(btn => on(btn, 'click', closeSearch));

    // Overlay click to close
    if (searchModal) {
      on(searchModal, 'click', (e) => {
        if (e.target === searchModal) closeSearch();
      });
    }

    // ESC to close
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeSearch();
    });
  }

  /* ─── Public API ─── */
  return {
    init,
    buildIndex,
    openSearch,
    closeSearch,
    performSearch,
    get isOpen() { return isOpen; },
  };
})();
