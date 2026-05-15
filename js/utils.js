/* DEVVAULT - Utility Functions */

const Utils = {
  // Generate slug from text
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  },

  // Generate unique ID
  uid() {
    return crypto.randomUUID ? crypto.randomUUID() : 
      Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  // Format date
  formatDate(dateStr, includeTime = false) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('id-ID', options) + (includeTime ? ' WIB' : '');
  },

  // Format relative time
  timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 30) return `${days} hari lalu`;
    return this.formatDate(dateStr);
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Throttle
  throttle(fn, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Escape HTML
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Highlight text matches
  highlightText(text, query) {
    if (!query || !text) return this.escapeHtml(text);
    const escaped = this.escapeHtml(text);
    if (!query.trim()) return escaped;
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  // Escape regex special chars
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  // Truncate text
  truncate(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  },

  // Deep clone
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Local storage helpers
  storage: {
    get(key, fallback = null) {
      try {
        const val = localStorage.getItem('devvault_' + key);
        return val ? JSON.parse(val) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem('devvault_' + key, JSON.stringify(value));
      } catch(e) { console.warn('Storage error:', e); }
    },
    remove(key) {
      localStorage.removeItem('devvault_' + key);
    }
  },

  // Parse block content
  parseBlockContent(block) {
    if (!block.content) return {};
    if (typeof block.content === 'object') return block.content;
    try {
      const parsed = JSON.parse(block.content);
      return parsed;
    } catch {
      return { text: block.content };
    }
  },

  // Build text content for search
  blockToSearchText(block) {
    const content = this.parseBlockContent(block);
    switch (block.type) {
      case 'heading': return content.text || '';
      case 'text': return content.text || block.content || '';
      case 'code': return block.content || '';
      case 'quote': return content.text || block.content || '';
      case 'link': return [content.title, content.url, content.description].filter(Boolean).join(' ');
      case 'checklist': 
        if (Array.isArray(content.items)) return content.items.map(i => i.text || i).join(' ');
        return block.content || '';
      default: return block.content || '';
    }
  },

  // Capitalize first letter
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      }
    } catch(e) {
      console.error('Copy failed:', e);
      return false;
    }
  },

  // Get icon name for category slug
  getCategoryIcon(slug) {
    const icons = {
      html: 'code-2',
      css: 'palette',
      javascript: 'zap',
      supabase: 'database',
      github: 'github',
      snippets: 'scissors',
    };
    return icons[slug] || 'folder';
  },

  // Create Lucide icon SVG string
  icon(name, size = 16) {
    if (typeof lucide !== 'undefined') {
      const iconData = lucide.icons[name] || lucide.icons['file'];
      if (!iconData) return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
      const [tag, attrs, children] = iconData;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${this.renderLucideChildren(children)}</svg>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  },

  renderLucideChildren(children) {
    if (!children) return '';
    return children.map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs || {}).map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tag} ${attrStr}/>`;
    }).join('');
  },

  // Wait
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Is mobile
  isMobile() {
    return window.innerWidth < 768;
  },

  // Get page slug from url hash
  getHashRoute() {
    return window.location.hash.replace('#', '') || '/dashboard';
  },

  // Set page title
  setPageTitle(title) {
    document.title = title ? `${title} - DEVVAULT` : 'DEVVAULT';
  }
};

// Export for use
window.Utils = Utils;
