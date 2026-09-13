(function () {
  let sb = null;
  let folders = [];
  let currentFolder = null;
  let query = '';

  const viewRoot = document.getElementById('viewRoot');
  const crumbEl = document.getElementById('breadcrumb');
  const searchEl = document.getElementById('globalSearch');

  const esc = (s) => String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };

  async function init() {
    const dot = document.getElementById('connDot');

    if (!window.CONFIG || !window.CONFIG.SUPABASE_URL || !window.CONFIG.SUPABASE_ANON_KEY) {
      if (dot) { dot.className = 'h-2 w-2 rounded-full bg-[#ff7369]'; dot.title = 'Koneksi Terputus'; }
      viewRoot.innerHTML = `<div class="p-8 rounded-xl border border-[#ff7369]/30 bg-[#2b1d1d] text-center text-sm text-[#ff7369]">
        Kredensial Supabase belum diisi di file <b>js/config.js</b>.
      </div>`;
      return;
    }

    try {
      sb = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY);
      await refresh();
      if (dot) { dot.className = 'h-2 w-2 rounded-full bg-[#4dab9a]'; dot.title = 'Terhubung'; }
    } catch (err) {
      if (dot) { dot.className = 'h-2 w-2 rounded-full bg-[#ff7369]'; dot.title = 'Gagal Terhubung'; }
      console.error(err);
    }

    const pre = new URLSearchParams(location.search).get('folder');
    if (pre) {
      currentFolder = folders.find(f => f.id === pre) || null;
      render();
    }
  }

  async function refresh() {
    // Ambil daftar folder
    const { data: fList, error: fErr } = await sb.from('folders').select('*').order('position');
    if (fErr) { console.error(fErr); return; }

    // Ambil dokumen yang berstatus publik saja
    const { data: dList, error: dErr } = await sb.from('documents')
      .select('id, folder_id, title, is_published')
      .eq('is_published', true);
    if (dErr) { console.error(dErr); return; }

    // Hitung materi terbit per folder
    folders = (fList || []).map(f => ({
      ...f,
      doc_count: (dList || []).filter(d => d.folder_id === f.id).length
    }));

    render();
  }

  function renderCrumb() {
    crumbEl.innerHTML = currentFolder
      ? `<button id="crHome" class="rounded px-1.5 py-1 hover:bg-[#2b2b2b] hover:text-[#e3e2de]">Home</button><span>/</span>
         <span class="flex items-center gap-1.5 px-1.5 py-1 text-[#e3e2de] font-medium"><i data-lucide="${esc(currentFolder.icon)}" class="h-3.5 w-3.5"></i>${esc(currentFolder.name)}</span>`
      : `<span class="px-1.5 py-1 text-[#e3e2de] font-medium">Home</span>`;
    
    if (window.lucide) window.lucide.createIcons();
    const h = document.getElementById('crHome');
    if (h) h.onclick = () => { currentFolder = null; history.pushState({}, '', './index.html'); render(); };
  }

  async function renderFolders() {
    const q = query.toLowerCase();
    let hits = [];

    if (q) {
      const { data } = await sb.from('documents')
        .select('id, title, slug, icon')
        .eq('is_published', true)
        .ilike('title', `%${q}%`);
      hits = data || [];
    }

    const list = folders.filter(f => !q || f.name.toLowerCase().includes(q));

    viewRoot.innerHTML = `
      ${q ? `
        <div class="mb-6">
          <h2 class="mb-2 text-sm font-semibold text-[#9b9a97]">Hasil Pencarian Dokumen (${hits.length})</h2>
          <div class="space-y-1">
            ${hits.length ? hits.map(d => `
              <a href="./read.html?${d.slug ? `slug=${encodeURIComponent(d.slug)}` : `id=${encodeURIComponent(d.id)}`}" class="flex items-center gap-2.5 rounded-md border border-[#2e2e2e] bg-[#202020] px-3 py-2 text-sm hover:bg-[#2b2b2b] transition">
                <i data-lucide="${esc(d.icon || 'file-text')}" class="h-4 w-4 text-[#529cca]"></i>
                <span class="text-[#e3e2de]">${esc(d.title)}</span>
              </a>`).join('') : '<p class="text-sm text-[#6b6b6b]">Tidak ada materi cocok.</p>'}
          </div>
        </div>` : ''}

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${list.map(f => `
          <div class="group rounded-xl border border-[#2e2e2e] bg-[#202020] p-3 transition hover:border-[#383838] hover:bg-[#242424]">
            <button data-open="${esc(f.id)}" class="flex w-full items-center gap-3 text-left cursor-pointer">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#2b2b2b]">
                <i data-lucide="${esc(f.icon || 'folder')}" class="h-5 w-5 text-[#529cca]"></i>
              </span>
              <span class="truncate text-sm font-medium text-[#e3e2de]">${esc(f.name)}</span>
            </button>
          </div>`).join('')}
        ${!list.length ? `<div class="col-span-full rounded-xl border border-dashed border-[#2e2e2e] p-10 text-center text-sm text-[#6b6b6b]">Belum ada folder materi yang tersedia.</div>` : ''}
      </div>`;

    if (window.lucide) window.lucide.createIcons();

    viewRoot.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
      currentFolder = folders.find(f => f.id === b.dataset.open);
      history.pushState({}, '', `./index.html?folder=${encodeURIComponent(currentFolder.id)}`);
      query = ''; searchEl.value = '';
      render();
    });
  }

  async function renderDocuments() {
    viewRoot.innerHTML = `<div class="py-10 text-center text-sm text-[#6b6b6b]">Memuat materi folder...</div>`;

    let q = sb.from('documents')
      .select('id, folder_id, title, icon, position, slug, updated_at')
      .eq('folder_id', currentFolder.id)
      .eq('is_published', true)
      .order('position');

    const { data: docs, error } = await q;
    if (error) { console.error(error); return; }

    const list = query ? docs.filter(d => d.title.toLowerCase().includes(query.toLowerCase())) : docs;

    viewRoot.innerHTML = `
      <div class="mb-4 flex items-center justify-between gap-3">
        <span class="text-sm font-medium text-[#9b9a97]">${list.length} materi</span>
      </div>
      <div class="overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#202020]">
        ${list.length ? list.map(d => `
          <a href="./read.html?${d.slug ? `slug=${encodeURIComponent(d.slug)}` : `id=${encodeURIComponent(d.id)}`}" 
             class="doc-row group relative flex items-center gap-3 border-b border-[#2e2e2e] px-4 py-3 last:border-0 hover:bg-[#2b2b2b] transition-colors">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#272727] group-hover:bg-[#333333]">
              <i data-lucide="${esc(d.icon || 'file-text')}" class="h-4 w-4 text-[#9b9a97] group-hover:text-[#529cca]"></i>
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-[#e3e2de] group-hover:text-white">${esc(d.title)}</div>
              <div class="text-xs text-[#9b9a97]">Diperbarui ${fmtDate(d.updated_at)}</div>
            </div>
            <i data-lucide="chevron-right" class="h-4 w-4 text-[#4a4a4a] group-hover:text-[#9b9a97] transition"></i>
          </a>`).join('')
        : `<div class="p-10 text-center text-sm text-[#6b6b6b]">Belum ada materi terbit di folder ini.</div>`}
      </div>`;

    if (window.lucide) window.lucide.createIcons();
  }

  function render() {
    renderCrumb();
    if (currentFolder) renderDocuments(); else renderFolders();
  }

  // Keyboard shortcut Ctrl+K
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      if (searchEl) { searchEl.focus(); searchEl.select(); }
    }
  });

  let t;
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { query = searchEl.value.trim(); render(); }, 200);
    });
  }

  init();
})();