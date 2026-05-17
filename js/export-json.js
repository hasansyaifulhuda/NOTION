/* ============================================================
   DevVault - Export JSON System
   js/export-json.js
   ============================================================ */

'use strict';

window.DevVaultExport = (function () {

  /**
   * Export a single page with its blocks as JSON
   */
  async function exportPage(page, blocks) {
    if (!window.DevVaultAuth?.isAdmin()) {
      window.DevVaultNotifications.warning('Admin access required', 'You must be logged in to export.');
      return;
    }

    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0',
        type: 'page',
        page: {
          id: page.id,
          title: page.title,
          description: page.description || '',
          status: page.status,
          visibility: page.visibility,
          pinned: page.pinned,
          category: page.categories?.name || null,
          createdAt: page.created_at,
          updatedAt: page.updated_at,
        },
        blocks: (blocks || []).map(block => ({
          id: block.id,
          type: block.type,
          content: block.content,
          orderIndex: block.order_index,
          createdAt: block.created_at,
          updatedAt: block.updated_at,
        })),
        meta: {
          blockCount: (blocks || []).length,
          exportedBy: window.DevVaultAuth.getUserEmail(),
        },
      };

      downloadJSON(exportData, `devvault-page-${slugify(page.title)}.json`);
      window.DevVaultNotifications.success('Page exported', `${page.title} exported as JSON`);
    } catch (err) {
      console.error('[Export] Page export error:', err);
      window.DevVaultNotifications.error('Export failed', err.message);
    }
  }

  /**
   * Export all data (pages, categories, snippets)
   */
  async function exportAll() {
    if (!window.DevVaultAuth?.isAdmin()) {
      window.DevVaultNotifications.warning('Admin access required');
      return;
    }

    try {
      window.DevVaultNotifications.info('Preparing export...', 'This may take a moment');

      const [catsResult, pagesResult, snippetsResult] = await Promise.all([
        window.DevVaultAPI.getCategories(),
        window.DevVaultAPI.getPages(true),
        window.DevVaultAPI.getSnippets(false),
      ]);

      const pages = (pagesResult.data || []).filter(p => !p.deleted_at);

      // Fetch all blocks for all pages
      const pagesWithBlocks = await Promise.all(
        pages.map(async (page) => {
          const { data: blocks } = await window.DevVaultAPI.getBlocksByPage(page.id);
          return {
            id: page.id,
            title: page.title,
            description: page.description || '',
            status: page.status,
            visibility: page.visibility,
            pinned: page.pinned,
            category_id: page.category_id,
            createdAt: page.created_at,
            updatedAt: page.updated_at,
            blocks: (blocks || []).map(b => ({
              id: b.id,
              type: b.type,
              content: b.content,
              orderIndex: b.order_index,
            })),
          };
        })
      );

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0',
        type: 'full',
        exportedBy: window.DevVaultAuth.getUserEmail(),
        summary: {
          categories: (catsResult.data || []).length,
          pages: pages.length,
          snippets: (snippetsResult.data || []).filter(s => !s.deleted_at).length,
        },
        categories: (catsResult.data || []).map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          orderIndex: c.order_index,
        })),
        pages: pagesWithBlocks,
        snippets: (snippetsResult.data || [])
          .filter(s => !s.deleted)
          .map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            language: s.language,
            code: s.code,
            category_id: s.category_id,
            is_public: s.is_public,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          })),
      };

      downloadJSON(exportData, `devvault-backup-${formatDateForFilename()}.json`);
      window.DevVaultNotifications.success(
        'Full backup exported',
        `${exportData.summary.pages} pages, ${exportData.summary.categories} categories, ${exportData.summary.snippets} snippets`
      );
    } catch (err) {
      console.error('[Export] Full export error:', err);
      window.DevVaultNotifications.error('Export failed', err.message);
    }
  }

  /**
   * Export a single snippet
   */
  function exportSnippet(snippet) {
    if (!window.DevVaultAuth?.isAdmin()) {
      window.DevVaultNotifications.warning('Admin access required');
      return;
    }

    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0',
        type: 'snippet',
        snippet: {
          id: snippet.id,
          title: snippet.title,
          description: snippet.description,
          language: snippet.language,
          code: snippet.code,
          is_public: snippet.is_public,
          createdAt: snippet.created_at,
          updatedAt: snippet.updated_at,
        },
      };

      downloadJSON(exportData, `devvault-snippet-${slugify(snippet.title)}.json`);
      window.DevVaultNotifications.success('Snippet exported');
    } catch (err) {
      window.DevVaultNotifications.error('Export failed', err.message);
    }
  }

  /* ─── Helpers ─── */

  function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function slugify(str) {
    return (str || 'export')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function formatDateForFilename() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ─── Public API ─── */
  return {
    exportPage,
    exportAll,
    exportSnippet,
  };
})();
