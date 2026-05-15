/* DEVVAULT - Table of Contents Module */

const TOC = {
  headings: [],
  observer: null,
  activeId: null,

  build(blocks) {
    this.headings = [];
    if (!blocks) return;

    blocks.forEach(block => {
      if (block.type === 'heading') {
        try {
          const content = typeof block.content === 'string'
            ? JSON.parse(block.content)
            : block.content;
          if (content && content.text) {
            const level = content.level || 2;
            const id = Utils.slugify(content.text);
            this.headings.push({ id, text: content.text, level });
          }
        } catch(e) {}
      }
    });

    this.render();
    this.setupObserver();
  },

  render() {
    const tocEl = document.getElementById('toc-list');
    const tocPanel = document.getElementById('toc-panel');

    if (!tocEl) return;

    if (this.headings.length === 0) {
      if (tocPanel) tocPanel.style.display = 'none';
      return;
    }

    if (tocPanel) tocPanel.style.display = '';

    const html = this.headings.map(h => `
      <li class="toc-item">
        <a class="toc-link toc-link-h${h.level}" 
           href="#${h.id}" 
           data-toc-id="${h.id}"
           onclick="TOC.scrollTo('${h.id}', event)">
          ${Utils.escapeHtml(h.text)}
        </a>
      </li>
    `).join('');

    tocEl.innerHTML = html;
  },

  scrollTo(id, event) {
    if (event) event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const headerHeight = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height')) || 56;

    const rect = el.getBoundingClientRect();
    const scrollContainer = document.querySelector('.page-content') || window;
    
    if (scrollContainer instanceof Element) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + rect.top - headerHeight - 16,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: window.scrollY + rect.top - headerHeight - 16,
        behavior: 'smooth'
      });
    }

    // Update URL anchor
    history.pushState(null, null, window.location.hash.split('#')[0] + window.location.hash);
  },

  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.headings.length === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-56px 0px -70% 0px',
        threshold: 0
      }
    );

    this.headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) this.observer.observe(el);
    });
  },

  setActive(id) {
    if (this.activeId === id) return;
    this.activeId = id;

    document.querySelectorAll('.toc-link.active').forEach(el => {
      el.classList.remove('active');
    });

    const activeLink = document.querySelector(`.toc-link[data-toc-id="${id}"]`);
    if (activeLink) {
      activeLink.classList.add('active');

      // Scroll TOC to show active item
      const tocPanel = document.getElementById('toc-panel');
      if (tocPanel) {
        const linkRect = activeLink.getBoundingClientRect();
        const panelRect = tocPanel.getBoundingClientRect();
        if (linkRect.top < panelRect.top || linkRect.bottom > panelRect.bottom) {
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  },

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.headings = [];
    this.activeId = null;
  }
};

window.TOC = TOC;
