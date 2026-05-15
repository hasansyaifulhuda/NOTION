/* DEVVAULT - Export JSON Module */

const ExportJSON = {
  async exportPage(pageId) {
    if (!Auth.requireAdmin()) return;
    if (!Auth.isAdmin) {
      Notifications.addToast('Hanya admin yang dapat mengeksport', 'error');
      return;
    }

    try {
      Notifications.addToast('Menyiapkan export...', 'info');

      const page = await SupabaseAPI.getPageById(pageId);
      if (!page) throw new Error('Halaman tidak ditemukan');

      const blocks = await SupabaseAPI.getBlocks(pageId);

      const exportData = {
        _meta: {
          exported_by: 'DEVVAULT v1.0.0',
          exported_at: new Date().toISOString(),
          app: 'DEVVAULT',
          version: '1.0.0'
        },
        page: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          description: page.description,
          status: page.status,
          visibility: page.visibility,
          is_pinned: page.is_pinned,
          sort_order: page.sort_order,
          created_at: page.created_at,
          updated_at: page.updated_at,
          category: page.categories ? {
            id: page.category_id,
            name: page.categories.name,
            slug: page.categories.slug,
            icon: page.categories.icon
          } : null
        },
        blocks: blocks.map(block => ({
          id: block.id,
          type: block.type,
          content: block.content,
          language: block.language,
          metadata: block.metadata,
          sort_order: block.sort_order,
          created_at: block.created_at,
          updated_at: block.updated_at
        }))
      };

      const json = JSON.stringify(exportData, null, 2);
      const filename = `${page.slug}-devvault-backup.json`;

      this.downloadFile(json, filename, 'application/json');

      Notifications.addToast(`File "${filename}" berhasil diunduh!`, 'success');
      await Notifications.addAdminNotification('success', 'Export Berhasil', `Halaman "${page.title}" berhasil diekspor.`);

    } catch(e) {
      Notifications.addToast('Gagal mengeksport: ' + e.message, 'error');
    }
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

window.ExportJSON = ExportJSON;
