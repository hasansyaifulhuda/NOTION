/* ============================================================
   DevVault - Table of Contents System
   js/toc.js
   ============================================================ */

'use strict';

window.DevVaultTOC = (function () {
  const { qs, sanitize, on, throttle } = window.DevVaultUtils;

  /* ─── State ─── */
  let headings = [];
  let activeHeadingId = null;
  let scrollObserver = null;
  let progressEl = null;
  let scrollContainer = null;

  /* ─── DOM References ─── */
  const getTOCContent = () => qs('#toc-content');
  const getTOCPanel = () => qs('#toc-panel');

  /* ─── Build TOC from page content ─── */

  function buildTOC(contentEl) {
    const tocContent = getTOCContent();
    const tocPanel = getTOCPanel();
    if (!tocContent || !tocPanel) return;

    // Find all headings in the content
    headings = [];
    if (contentEl) {
      const headingEls = contentEl.querySelectorAll('[data-heading-level]');
      headingEls.forEach(el => {
        const level = parseInt(el.dataset.headingLevel, 10) || 1;
        const text = el.textContent.trim();
        const id = el.id;
        if (text && id) {
          headings.push({ el, level, text, id });
        }
      });
    }

    if (headings.length === 0) {
      tocContent.innerHTML = `
        <p style="color:var(--color-text-muted);font-size:0.75rem;font-style:italic;">
          No headings found
        </p>
      `;
      return;
    }

    tocContent.innerHTML = headings.map(h => `
      <a href="#${h.id}"
        class="toc-item h${h.level} ${activeHeadingId === h.id ? 'active' : ''}"
        data-toc-id="${h.id}"
        title="${sanitize(h.text)}"
        aria-label="Jump to ${sanitize(h.text)}">
        ${sanitize(h.text)}
      </a>
    `).join('');

    // Bind TOC link clicks
    tocContent.querySelectorAll('.toc-item').forEach(link => {
      on(link, 'click', (e) => {
        e.preventDefault();
        const id = link.dataset.tocId;
        const targetEl = qs(`#${CSS.escape(id)}`);
        if (targetEl) {
          const topbarHeight = 56;
          const offset = topbarHeight + 16;
          const top = targetEl.getBoundingClientRect().top + (scrollContainer?.scrollTop || window.scrollY) - offset;
          if (scrollContainer) {
            scrollContainer.scrollTo({ top, behavior: 'smooth' });
          } else {
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }
      });
    });

    // Start intersection observer
    startObserver();
  }

  /* ─── Intersection Observer for Active Heading ─── */

  function startObserver() {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }

    if (!headings.length) return;

    const options = {
      rootMargin: '-60px 0px -70% 0px',
      threshold: 0,
    };

    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveHeading(entry.target.id);
        }
      });
    }, options);

    headings.forEach(h => {
      if (h.el) scrollObserver.observe(h.el);
    });
  }

  function setActiveHeading(id) {
    if (activeHeadingId === id) return;
    activeHeadingId = id;

    const tocContent = getTOCContent();
    if (!tocContent) return;

    tocContent.querySelectorAll('.toc-item').forEach(link => {
      link.classList.toggle('active', link.dataset.tocId === id);
    });
  }

  /* ─── Reading Progress Bar ─── */

  function initReadingProgress(scrollEl) {
    progressEl = qs('#reading-progress');
    scrollContainer = scrollEl;

    if (!progressEl) return;

    const updateProgress = throttle(() => {
      if (!scrollEl) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) {
        progressEl.style.width = '0%';
        progressEl.setAttribute('aria-valuenow', 0);
        return;
      }
      const percent = Math.min(100, Math.round((scrollTop / scrollable) * 100));
      progressEl.style.width = `${percent}%`;
      progressEl.setAttribute('aria-valuenow', percent);
    }, 50);

    on(scrollEl, 'scroll', updateProgress);
  }

  /* ─── Clear ─── */

  function clear() {
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
    headings = [];
    activeHeadingId = null;

    const tocContent = getTOCContent();
    if (tocContent) tocContent.innerHTML = '';

    if (progressEl) {
      progressEl.style.width = '0%';
      progressEl.setAttribute('aria-valuenow', 0);
    }
  }

  /* ─── Public API ─── */
  return {
    buildTOC,
    clear,
    initReadingProgress,
    setActiveHeading,
  };
})();
