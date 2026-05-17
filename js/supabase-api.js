/* ============================================================
   DevVault - Supabase API Layer
   js/supabase-api.js
   ============================================================ */

'use strict';

window.DevVaultAPI = (function () {
  const { generateId, nowISO } = window.DevVaultUtils;

  /* ─── Supabase client getter ─── */
  function getClient() {
    return window.supabaseClient;
  }

  function isAvailable() {
    return !!getClient() && window.isSupabaseConfigured;
  }

  /* ─── Local Demo Storage (when Supabase not configured) ─── */
  // Used for demo/offline mode so the app still works without Supabase

  const DEMO_STORAGE_KEY = 'devvault_demo_data';

  function getDemoData() {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return getDefaultDemoData();
  }

  function saveDemoData(data) {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[API] Demo storage save failed:', e);
    }
  }

  function getDefaultDemoData() {
    const now = nowISO();
    const catId1 = 'cat-001';
    const catId2 = 'cat-002';
    const pageId1 = 'page-001';
    const pageId2 = 'page-002';
    const pageId3 = 'page-003';

    return {
      categories: [
        { id: catId1, name: 'Getting Started', icon: 'book-open', color: '#38bdf8', order_index: 0, created_at: now, updated_at: now },
        { id: catId2, name: 'JavaScript', icon: 'code-2', color: '#f59e0b', order_index: 1, created_at: now, updated_at: now },
      ],
      pages: [
        {
          id: pageId1,
          title: 'Welcome to DevVault',
          description: 'Your developer knowledge workspace',
          category_id: catId1,
          status: 'published',
          visibility: 'public',
          pinned: true,
          deleted: false,
          order_index: 0,
          created_at: now,
          updated_at: now,
        },
        {
          id: pageId2,
          title: 'JavaScript Fundamentals',
          description: 'Core JavaScript concepts and patterns',
          category_id: catId2,
          status: 'published',
          visibility: 'public',
          pinned: false,
          deleted: false,
          order_index: 0,
          created_at: now,
          updated_at: now,
        },
        {
          id: pageId3,
          title: 'Draft Page',
          description: 'Work in progress',
          category_id: catId2,
          status: 'draft',
          visibility: 'private',
          pinned: false,
          deleted: false,
          order_index: 1,
          created_at: now,
          updated_at: now,
        },
      ],
      page_blocks: [
        { id: generateId(), page_id: pageId1, type: 'heading', content: { level: 1, text: 'Welcome to DevVault' }, order_index: 0, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId1, type: 'text', content: { text: 'DevVault is your personal developer knowledge workspace. Organize your documentation, code snippets, and notes in one elegant place.' }, order_index: 1, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId1, type: 'heading', content: { level: 2, text: 'Key Features' }, order_index: 2, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId1, type: 'checklist', content: { items: ['Create and manage documentation pages', 'Organize content with categories', 'Store and search code snippets', 'Dark and light theme support', 'Full-text search within pages'] }, order_index: 3, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId1, type: 'quote', content: { text: 'The best documentation is the one you actually use. DevVault makes it easy.' }, order_index: 4, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId2, type: 'heading', content: { level: 1, text: 'JavaScript Fundamentals' }, order_index: 0, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId2, type: 'text', content: { text: 'JavaScript is a lightweight, interpreted programming language with first-class functions. It is most well-known as the scripting language for Web pages.' }, order_index: 1, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId2, type: 'heading', content: { level: 2, text: 'Variables' }, order_index: 2, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId2, type: 'code', content: { language: 'javascript', code: '// Modern variable declarations\nconst name = "DevVault"; // constant\nlet version = "1.0.0";   // mutable\n\n// Arrow functions\nconst greet = (user) => {\n  return `Hello, ${user}!`;\n};\n\nconsole.log(greet(name)); // Hello, DevVault!' }, order_index: 3, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId2, type: 'heading', content: { level: 2, text: 'Array Methods' }, order_index: 4, created_at: now, updated_at: now },
        { id: generateId(), page_id: pageId2, type: 'code', content: { language: 'javascript', code: 'const numbers = [1, 2, 3, 4, 5];\n\n// Map - transform each element\nconst doubled = numbers.map(n => n * 2);\n// [2, 4, 6, 8, 10]\n\n// Filter - keep matching elements\nconst evens = numbers.filter(n => n % 2 === 0);\n// [2, 4]\n\n// Reduce - accumulate to single value\nconst sum = numbers.reduce((acc, n) => acc + n, 0);\n// 15' }, order_index: 5, created_at: now, updated_at: now },
      ],
      snippets: [
        { id: generateId(), title: 'Fetch API with async/await', description: 'Modern HTTP request pattern', language: 'javascript', code: 'async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) {\n      throw new Error(`HTTP error! status: ${response.status}`);\n    }\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Fetch failed:", error);\n    throw error;\n  }\n}\n\n// Usage\nconst data = await fetchData("https://api.example.com/data");', category_id: catId2, is_public: true, deleted: false, created_at: now, updated_at: now },
        { id: generateId(), title: 'CSS Flexbox Center', description: 'Center content using flexbox', language: 'css', code: '.centered {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}', category_id: catId1, is_public: true, deleted: false, created_at: now, updated_at: now },
        { id: generateId(), title: 'SQL Select with Join', description: 'Basic SQL join example', language: 'sql', code: 'SELECT\n  u.id,\n  u.email,\n  p.title AS page_title,\n  p.created_at\nFROM users u\nINNER JOIN pages p ON p.user_id = u.id\nWHERE p.status = \'published\'\nORDER BY p.created_at DESC\nLIMIT 10;', category_id: null, is_public: true, deleted: false, created_at: now, updated_at: now },
      ],
      notifications: [],
      activity_logs: [],
    };
  }

  /* ─── Categories API ─── */

  async function getCategories() {
    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('categories')
          .select('*')
          .order('order_index', { ascending: true });
        if (error) throw error;
        return { data: data || [], error: null };
      } catch (err) {
        console.error('[API] getCategories error:', err);
        return { data: [], error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    return { data: demo.categories || [], error: null };
  }

  async function createCategory(payload) {
    const now = nowISO();
    const newCat = {
      id: generateId(),
      name: payload.name,
      icon: payload.icon || 'folder',
      color: payload.color || '#38bdf8',
      order_index: payload.order_index ?? 0,
      created_at: now,
      updated_at: now,
    };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('categories')
          .insert([newCat])
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] createCategory error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.categories.push(newCat);
    saveDemoData(demo);
    return { data: newCat, error: null };
  }

  async function updateCategory(id, payload) {
    const updated = { ...payload, updated_at: nowISO() };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('categories')
          .update(updated)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] updateCategory error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const idx = demo.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      demo.categories[idx] = { ...demo.categories[idx], ...updated };
      saveDemoData(demo);
      return { data: demo.categories[idx], error: null };
    }
    return { data: null, error: new Error('Category not found') };
  }

  async function deleteCategory(id) {
    if (isAvailable()) {
      try {
        const { error } = await getClient()
          .from('categories')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err) {
        console.error('[API] deleteCategory error:', err);
        return { error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.categories = demo.categories.filter(c => c.id !== id);
    saveDemoData(demo);
    return { error: null };
  }

  /* ─── Pages API ─── */

  async function getPages(includePrivate = false) {
    if (isAvailable()) {
      try {
        let query = getClient()
          .from('pages')
          .select('*, categories(id,name,icon,color)')
          .is('deleted_at', null)
          .order('order_index', { ascending: true });

        if (!includePrivate) {
          query = query.eq('status', 'published').eq('visibility', 'public');
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data: data || [], error: null };
      } catch (err) {
        console.error('[API] getPages error:', err);
        return { data: [], error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    let pages = demo.pages.filter(p => !p.deleted_at);
    if (!includePrivate) {
      pages = pages.filter(p => p.status === 'published' && p.visibility === 'public');
    }
    // Attach category info
    pages = pages.map(p => ({
      ...p,
      categories: demo.categories.find(c => c.id === p.category_id) || null,
    }));
    return { data: pages, error: null };
  }

  async function getPageById(id) {
    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('pages')
          .select('*, categories(id,name,icon,color)')
          .eq('id', id)
          .is('deleted_at', null)
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] getPageById error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const page = demo.pages.find(p => p.id === id && !p.deleted_at);
    if (!page) return { data: null, error: new Error('Page not found') };
    const cat = demo.categories.find(c => c.id === page.category_id) || null;
    return { data: { ...page, categories: cat }, error: null };
  }

  async function createPage(payload) {
    const now = nowISO();
    const newPage = {
      id: generateId(),
      title: payload.title,
      description: payload.description || '',
      category_id: payload.category_id || null,
      status: payload.status || 'draft',
      visibility: payload.visibility || 'public',
      pinned: false,
      deleted_at: null,
      order_index: payload.order_index ?? 999,
      created_at: now,
      updated_at: now,
    };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('pages')
          .insert([newPage])
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] createPage error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.pages.push(newPage);
    saveDemoData(demo);
    return { data: newPage, error: null };
  }

  async function updatePage(id, payload) {
    const updated = { ...payload, updated_at: nowISO() };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('pages')
          .update(updated)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] updatePage error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const idx = demo.pages.findIndex(p => p.id === id);
    if (idx !== -1) {
      demo.pages[idx] = { ...demo.pages[idx], ...updated };
      saveDemoData(demo);
      return { data: demo.pages[idx], error: null };
    }
    return { data: null, error: new Error('Page not found') };
  }

  async function softDeletePage(id) {
    return updatePage(id, { deleted_at: nowISO() });
  }

  async function restorePage(id) {
    return updatePage(id, { deleted_at: null });
  }

  async function permanentDeletePage(id) {
    if (isAvailable()) {
      try {
        // Delete blocks first
        await getClient().from('page_blocks').delete().eq('page_id', id);
        const { error } = await getClient().from('pages').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err) {
        console.error('[API] permanentDeletePage error:', err);
        return { error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.pages = demo.pages.filter(p => p.id !== id);
    demo.page_blocks = demo.page_blocks.filter(b => b.page_id !== id);
    saveDemoData(demo);
    return { error: null };
  }

  async function getTrashedPages() {
    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('pages')
          .select('*, categories(id,name)')
          .not('deleted_at', 'is', null)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return { data: data || [], error: null };
      } catch (err) {
        console.error('[API] getTrashedPages error:', err);
        return { data: [], error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const trashed = demo.pages.filter(p => p.deleted_at).map(p => ({
      ...p,
      categories: demo.categories.find(c => c.id === p.category_id) || null,
    }));
    return { data: trashed, error: null };
  }

  /* ─── Blocks API ─── */

  async function getBlocksByPage(pageId) {
    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('page_blocks')
          .select('*')
          .eq('page_id', pageId)
          .order('order_index', { ascending: true });
        if (error) throw error;
        return { data: data || [], error: null };
      } catch (err) {
        console.error('[API] getBlocksByPage error:', err);
        return { data: [], error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const blocks = demo.page_blocks
      .filter(b => b.page_id === pageId)
      .sort((a, b) => a.order_index - b.order_index);
    return { data: blocks, error: null };
  }

  async function createBlock(pageId, payload) {
    const now = nowISO();
    const newBlock = {
      id: generateId(),
      page_id: pageId,
      type: payload.type,
      content: payload.content || {},
      order_index: payload.order_index ?? 999,
      created_at: now,
      updated_at: now,
    };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('page_blocks')
          .insert([newBlock])
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] createBlock error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.page_blocks.push(newBlock);
    saveDemoData(demo);
    return { data: newBlock, error: null };
  }

  async function updateBlock(id, payload) {
    const updated = { ...payload, updated_at: nowISO() };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('page_blocks')
          .update(updated)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] updateBlock error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const idx = demo.page_blocks.findIndex(b => b.id === id);
    if (idx !== -1) {
      demo.page_blocks[idx] = { ...demo.page_blocks[idx], ...updated };
      saveDemoData(demo);
      return { data: demo.page_blocks[idx], error: null };
    }
    return { data: null, error: new Error('Block not found') };
  }

  async function deleteBlock(id) {
    if (isAvailable()) {
      try {
        const { error } = await getClient()
          .from('page_blocks')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err) {
        console.error('[API] deleteBlock error:', err);
        return { error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.page_blocks = demo.page_blocks.filter(b => b.id !== id);
    saveDemoData(demo);
    return { error: null };
  }

  async function reorderBlocks(pageId, orderedIds) {
    const updates = orderedIds.map((id, index) => ({ id, order_index: index, updated_at: nowISO() }));

    if (isAvailable()) {
      try {
        for (const upd of updates) {
          await getClient().from('page_blocks').update({ order_index: upd.order_index, updated_at: upd.updated_at }).eq('id', upd.id);
        }
        return { error: null };
      } catch (err) {
        console.error('[API] reorderBlocks error:', err);
        return { error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    updates.forEach(upd => {
      const idx = demo.page_blocks.findIndex(b => b.id === upd.id);
      if (idx !== -1) demo.page_blocks[idx].order_index = upd.order_index;
    });
    saveDemoData(demo);
    return { error: null };
  }

  /* ─── Snippets API ─── */

  async function getSnippets(publicOnly = true) {
    if (isAvailable()) {
      try {
        let query = getClient()
          .from('snippets')
          .select('*, categories(id,name,icon)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (publicOnly) query = query.eq('is_public', true);
        const { data, error } = await query;
        if (error) throw error;
        return { data: data || [], error: null };
      } catch (err) {
        console.error('[API] getSnippets error:', err);
        return { data: [], error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    let snippets = demo.snippets.filter(s => !s.deleted_at);
    if (publicOnly) snippets = snippets.filter(s => s.is_public);
    snippets = snippets.map(s => ({
      ...s,
      categories: demo.categories.find(c => c.id === s.category_id) || null,
    }));
    return { data: snippets, error: null };
  }

  async function createSnippet(payload) {
    const now = nowISO();
    const newSnippet = {
      id: generateId(),
      title: payload.title,
      description: payload.description || '',
      language: payload.language || 'javascript',
      code: payload.code,
      category_id: payload.category_id || null,
      is_public: payload.is_public ?? true,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('snippets')
          .insert([newSnippet])
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] createSnippet error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    demo.snippets.push(newSnippet);
    saveDemoData(demo);
    return { data: newSnippet, error: null };
  }

  async function updateSnippet(id, payload) {
    const updated = { ...payload, updated_at: nowISO() };

    if (isAvailable()) {
      try {
        const { data, error } = await getClient()
          .from('snippets')
          .update(updated)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        console.error('[API] updateSnippet error:', err);
        return { data: null, error: err };
      }
    }
    // Demo mode
    const demo = getDemoData();
    const idx = demo.snippets.findIndex(s => s.id === id);
    if (idx !== -1) {
      demo.snippets[idx] = { ...demo.snippets[idx], ...updated };
      saveDemoData(demo);
      return { data: demo.snippets[idx], error: null };
    }
    return { data: null, error: new Error('Snippet not found') };
  }

  async function deleteSnippet(id) {
    return updateSnippet(id, { deleted_at: nowISO() });
  }

  async function permanentDeleteSnippet(id) {
    if (isAvailable()) {
      try {
        const { error } = await getClient().from('snippets').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    }
    const demo = getDemoData();
    demo.snippets = demo.snippets.filter(s => s.id !== id);
    saveDemoData(demo);
    return { error: null };
  }

  /* ─── Stats API ─── */

  async function getStats() {
    const [cats, pages, snippets] = await Promise.all([
      getCategories(),
      getPages(true),
      getSnippets(false),
    ]);
    return {
      categories: cats.data?.length || 0,
      pages: pages.data?.filter(p => !p.deleted_at).length || 0,
      snippets: snippets.data?.filter(s => !s.deleted_at).length || 0,
      published: pages.data?.filter(p => p.status === 'published' && !p.deleted_at).length || 0,
    };
  }

  /* ─── Public API ─── */
  return {
    isAvailable,
    getDemoData,
    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Pages
    getPages,
    getPageById,
    createPage,
    updatePage,
    softDeletePage,
    restorePage,
    permanentDeletePage,
    getTrashedPages,
    // Blocks
    getBlocksByPage,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    // Snippets
    getSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    permanentDeleteSnippet,
    // Stats
    getStats,
  };
})();
