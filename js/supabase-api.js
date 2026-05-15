/* DEVVAULT - Supabase API Layer */

const SupabaseAPI = {
  get configured() {
    return Boolean(window.isSupabaseConfigured && window.supabaseClient);
  },

  get client() {
    return window.supabaseClient || null;
  },

  notConfiguredMessage: 'Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di supabase.js.',

  ensureConfigured(action = 'mengakses database') {
    if (!this.configured) {
      throw new Error(`${this.notConfiguredMessage} Tidak bisa ${action}.`);
    }
    return this.client;
  },

  getFallbackCategories() {
    return [
      { id: 'local-html', name: 'HTML', slug: 'html', icon: 'code-2', sort_order: 1, is_local: true },
      { id: 'local-css', name: 'CSS', slug: 'css', icon: 'palette', sort_order: 2, is_local: true },
      { id: 'local-javascript', name: 'JavaScript', slug: 'javascript', icon: 'zap', sort_order: 3, is_local: true },
      { id: 'local-supabase', name: 'Supabase', slug: 'supabase', icon: 'database', sort_order: 4, is_local: true },
      { id: 'local-github', name: 'GitHub', slug: 'github', icon: 'github', sort_order: 5, is_local: true },
      { id: 'local-snippets', name: 'Snippets', slug: 'snippets', icon: 'scissors', sort_order: 6, is_local: true }
    ];
  },

  getFallbackStats() {
    return { pages: 0, snippets: 0, categories: this.getFallbackCategories().length };
  },

  // ===== AUTH =====
  async getSession() {
    if (!this.configured) return null;
    const { data: { session }, error } = await this.client.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUser() {
    if (!this.configured) return null;
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) return null;
    return user;
  },

  async signIn(email, password) {
    const client = this.ensureConfigured('login admin');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!this.configured) return;
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  },

  async getProfile(userId) {
    if (!this.configured || !userId) return null;
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  // ===== CATEGORIES =====
  async getCategories() {
    if (!this.configured) return this.getFallbackCategories();
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createCategory(cat) {
    const client = this.ensureConfigured('membuat kategori');
    const { data, error } = await client
      .from('categories')
      .insert([cat])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCategory(id, updates) {
    const client = this.ensureConfigured('mengubah kategori');
    const { data, error } = await client
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    const client = this.ensureConfigured('menghapus kategori');
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ===== PAGES =====
  async getPages(isAdmin = false) {
    if (!this.configured) return [];
    let query = this.client
      .from('pages')
      .select('*, categories(name, slug, icon)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query
        .eq('status', 'published')
        .eq('visibility', 'public')
        .is('deleted_at', null);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getPage(slug, isAdmin = false) {
    if (!this.configured) return null;
    const { data, error } = await this.client
      .from('pages')
      .select('*, categories(name, slug, icon)')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    if (!isAdmin && data) {
      if (data.status !== 'published' || data.visibility !== 'public' || data.deleted_at) {
        return null;
      }
    }
    return data;
  },

  async getPageById(id) {
    if (!this.configured) return null;
    const { data, error } = await this.client
      .from('pages')
      .select('*, categories(name, slug, icon)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createPage(page) {
    const client = this.ensureConfigured('membuat halaman');
    const { data, error } = await client
      .from('pages')
      .insert([page])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePage(id, updates) {
    const client = this.ensureConfigured('menyimpan halaman');
    const { data, error } = await client
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async softDeletePage(id) {
    const client = this.ensureConfigured('memindahkan halaman ke Trash');
    const { data, error } = await client
      .from('pages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async restorePage(id) {
    const client = this.ensureConfigured('restore halaman');
    const { data, error } = await client
      .from('pages')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async permanentDeletePage(id) {
    const client = this.ensureConfigured('menghapus permanen halaman');
    const { error } = await client
      .from('pages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTrashPages() {
    if (!this.configured) return [];
    const { data, error } = await this.client
      .from('pages')
      .select('*, categories(name, slug, icon)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPinnedPages(isAdmin = false) {
    if (!this.configured) return [];
    let query = this.client
      .from('pages')
      .select('*, categories(name, slug, icon)')
      .eq('is_pinned', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });
    
    if (!isAdmin) {
      query = query.eq('status', 'published').eq('visibility', 'public');
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getPagesByCategory(categoryId, isAdmin = false) {
    if (!this.configured) return [];
    let query = this.client
      .from('pages')
      .select('*, categories(name, slug, icon)')
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (!isAdmin) {
      query = query.eq('status', 'published').eq('visibility', 'public');
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ===== BLOCKS =====
  async getBlocks(pageId) {
    if (!this.configured || !pageId) return [];
    const { data, error } = await this.client
      .from('page_blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createBlock(block) {
    const client = this.ensureConfigured('membuat block');
    const { data, error } = await client
      .from('page_blocks')
      .insert([block])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBlock(id, updates) {
    const client = this.ensureConfigured('mengubah block');
    const { data, error } = await client
      .from('page_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteBlock(id) {
    const client = this.ensureConfigured('menghapus block');
    const { error } = await client
      .from('page_blocks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async reorderBlocks(updates) {
    const client = this.ensureConfigured('mengurutkan block');
    const promises = updates.map(({ id, sort_order }) =>
      client.from('page_blocks').update({ sort_order }).eq('id', id)
    );
    await Promise.all(promises);
  },

  // ===== SNIPPETS =====
  async getSnippets(isAdmin = false) {
    if (!this.configured) return [];
    let query = this.client
      .from('snippets')
      .select('*, categories(name, slug, icon)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('visibility', 'public');
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getSnippet(id) {
    if (!this.configured) return null;
    const { data, error } = await this.client
      .from('snippets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createSnippet(snippet) {
    const client = this.ensureConfigured('membuat snippet');
    const { data, error } = await client
      .from('snippets')
      .insert([snippet])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSnippet(id, updates) {
    const client = this.ensureConfigured('mengubah snippet');
    const { data, error } = await client
      .from('snippets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSnippet(id) {
    const client = this.ensureConfigured('menghapus snippet');
    const { data, error } = await client
      .from('snippets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ===== NOTIFICATIONS =====
  async getNotifications(userId) {
    if (!this.configured || !userId) return [];
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async createNotification(notif) {
    if (!this.configured) return null;
    const { data, error } = await this.client
      .from('notifications')
      .insert([notif])
      .select()
      .single();
    if (error) console.warn('Notification error:', error);
    return data;
  },

  async markNotificationRead(id) {
    if (!this.configured) return;
    await this.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  },

  async markAllNotificationsRead(userId) {
    if (!this.configured || !userId) return;
    await this.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
  },

  // ===== STATS =====
  async getStats(isAdmin = false) {
    if (!this.configured) return this.getFallbackStats();
    try {
      let pagesQuery = this.client.from('pages').select('id, status, visibility', { count: 'exact' }).is('deleted_at', null);
      let snipsQuery = this.client.from('snippets').select('id', { count: 'exact' }).is('deleted_at', null);
      let catsQuery = this.client.from('categories').select('id', { count: 'exact' });

      if (!isAdmin) {
        pagesQuery = pagesQuery.eq('status', 'published').eq('visibility', 'public');
        snipsQuery = snipsQuery.eq('visibility', 'public');
      }

      const [pagesRes, snipsRes, catsRes] = await Promise.all([pagesQuery, snipsQuery, catsQuery]);
      
      return {
        pages: pagesRes.count || 0,
        snippets: snipsRes.count || 0,
        categories: catsRes.count || 0
      };
    } catch(e) {
      console.warn('Stats error:', e);
      return this.getFallbackStats();
    }
  }
};

window.SupabaseAPI = SupabaseAPI;
