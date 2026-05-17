/* ============================================================
   DevVault - Utility Functions
   js/utils.js
   ============================================================ */

'use strict';

window.DevVaultUtils = (function () {

  /* ─── DOM Utilities ─── */

  /**
   * Query selector with optional parent context
   */
  function qs(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * Query selector all
   */
  function qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  /**
   * Create element with attributes and content
   */
  function createElement(tag, attrs = {}, content = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'class') el.className = val;
      else if (key === 'dataset') {
        Object.entries(val).forEach(([dk, dv]) => {
          el.dataset[dk] = dv;
        });
      } else el.setAttribute(key, val);
    });
    if (content) {
      if (typeof content === 'string') {
        el.innerHTML = content;
      } else {
        el.appendChild(content);
      }
    }
    return el;
  }

  /**
   * Safe innerHTML setter to prevent XSS
   * Use textContent for plain text, innerHTML only for trusted HTML
   */
  function setHTML(el, html) {
    if (el) el.innerHTML = html;
  }

  /**
   * Clear element's children
   */
  function clearEl(el) {
    if (el) el.innerHTML = '';
  }

  /**
   * Show/hide elements safely
   */
  function show(el, displayType = 'flex') {
    if (el) el.style.display = displayType;
  }

  function hide(el) {
    if (el) el.style.display = 'none';
  }

  function toggle(el, condition, displayType = 'flex') {
    if (el) el.style.display = condition ? displayType : 'none';
  }

  /**
   * Add class safely
   */
  function addClass(el, ...classes) {
    if (el) el.classList.add(...classes);
  }

  /**
   * Remove class safely
   */
  function removeClass(el, ...classes) {
    if (el) el.classList.remove(...classes);
  }

  /**
   * Toggle class safely
   */
  function toggleClass(el, cls, force) {
    if (el) {
      if (force !== undefined) el.classList.toggle(cls, force);
      else el.classList.toggle(cls);
    }
  }

  /**
   * Has class check
   */
  function hasClass(el, cls) {
    return el ? el.classList.contains(cls) : false;
  }

  /* ─── String Utilities ─── */

  /**
   * Sanitize text for display (escape HTML entities)
   */
  function sanitize(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
  }

  /**
   * Truncate string to max length
   */
  function truncate(str, max = 60) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  /**
   * Slugify string for URL/ID use
   */
  function slugify(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Capitalize first letter
   */
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Highlight search term in text
   */
  function highlightText(text, term) {
    if (!term) return sanitize(text);
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeTerm})`, 'gi');
    return sanitize(text).replace(regex, '<mark>$1</mark>');
  }

  /* ─── Date/Time Utilities ─── */

  /**
   * Format date relative to now
   */
  function timeAgo(dateStr) {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }

  /**
   * Format date as readable string
   */
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  /**
   * ISO string for current time
   */
  function nowISO() {
    return new Date().toISOString();
  }

  /* ─── UUID Generation ─── */

  /**
   * Generate a UUID v4
   */
  function generateId() {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /* ─── Function Utilities ─── */

  /**
   * Debounce function
   */
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Throttle function
   */
  function throttle(fn, limit = 100) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= limit) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  }

  /* ─── LocalStorage Utilities ─── */

  const STORAGE_PREFIX = 'devvault_';

  /**
   * Get from localStorage safely
   */
  function lsGet(key, fallback = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * Set to localStorage safely
   */
  function lsSet(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      console.warn('[DevVault] localStorage write failed for key:', key);
      return false;
    }
  }

  /**
   * Remove from localStorage
   */
  function lsRemove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // silent
    }
  }

  /* ─── Clipboard Utilities ─── */

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const success = document.execCommand('copy');
      document.body.removeChild(ta);
      return success;
    } catch (err) {
      console.error('[DevVault] Clipboard copy failed:', err);
      return false;
    }
  }

  /* ─── Scroll Utilities ─── */

  /**
   * Scroll element into view smoothly
   */
  function scrollIntoView(el, offset = 0) {
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /**
   * Lock body scroll (for modals)
   */
  function lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  /**
   * Unlock body scroll
   */
  function unlockScroll() {
    document.body.style.overflow = '';
  }

  /* ─── Validation Utilities ─── */

  /**
   * Check if email is valid
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Check if string is non-empty
   */
  function isNonEmpty(str) {
    return typeof str === 'string' && str.trim().length > 0;
  }

  /**
   * Validate required fields in object
   */
  function validateRequired(obj, fields) {
    const errors = {};
    fields.forEach(field => {
      if (!isNonEmpty(String(obj[field] ?? ''))) {
        errors[field] = `${capitalize(field)} is required`;
      }
    });
    return errors;
  }

  /* ─── URL Utilities ─── */

  /**
   * Parse hash route
   */
  function parseRoute(hash) {
    if (!hash) return '/dashboard';
    const route = hash.replace(/^#/, '');
    return route || '/dashboard';
  }

  /**
   * Get current hash route
   */
  function getCurrentRoute() {
    return parseRoute(window.location.hash);
  }

  /* ─── Event Utilities ─── */

  /**
   * Safe event listener with automatic cleanup support
   */
  function on(el, event, handler, options) {
    if (el) el.addEventListener(event, handler, options);
  }

  function off(el, event, handler) {
    if (el) el.removeEventListener(event, handler);
  }

  /**
   * One-time event listener
   */
  function once(el, event, handler) {
    if (!el) return;
    const wrapper = (e) => {
      handler(e);
      el.removeEventListener(event, wrapper);
    };
    el.addEventListener(event, wrapper);
  }

  /* ─── Reading Time ─── */

  /**
   * Estimate reading time in minutes
   */
  function estimateReadTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
  }

  /* ─── Icon Renderer ─── */

  /**
   * Render a lucide icon by name
   */
  function renderIcon(name, size = 16) {
    return `<i data-lucide="${name}" style="width:${size}px;height:${size}px;" aria-hidden="true"></i>`;
  }

  /**
   * Initialize lucide icons in a given element
   */
  function initIcons(el = document) {
    if (window.lucide) {
      window.lucide.createIcons({ nodes: el === document ? undefined : [el] });
    }
  }

  /* ─── Array Utilities ─── */

  /**
   * Move item in array (for reordering)
   */
  function moveItem(arr, fromIndex, toIndex) {
    const copy = [...arr];
    const [removed] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed);
    return copy;
  }

  /**
   * Group array by key
   */
  function groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const k = item[key];
      if (!groups[k]) groups[k] = [];
      groups[k].push(item);
      return groups;
    }, {});
  }

  /**
   * Deduplicate array by key
   */
  function uniqBy(arr, key) {
    const seen = new Set();
    return arr.filter(item => {
      const k = item[key];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  /* ─── Exported Public API ─── */
  return {
    qs,
    qsa,
    createElement,
    setHTML,
    clearEl,
    show,
    hide,
    toggle,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    sanitize,
    truncate,
    slugify,
    capitalize,
    highlightText,
    timeAgo,
    formatDate,
    nowISO,
    generateId,
    debounce,
    throttle,
    lsGet,
    lsSet,
    lsRemove,
    copyToClipboard,
    scrollIntoView,
    lockScroll,
    unlockScroll,
    isValidEmail,
    isNonEmpty,
    validateRequired,
    parseRoute,
    getCurrentRoute,
    on,
    off,
    once,
    estimateReadTime,
    renderIcon,
    initIcons,
    moveItem,
    groupBy,
    uniqBy,
  };
})();
