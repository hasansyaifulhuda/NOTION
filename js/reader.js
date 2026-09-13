(async function () {
  const qs = new URLSearchParams(location.search);
  const slug = qs.get('slug');
  const id = qs.get('id');

  if (!slug && !id) {
    location.replace('./index.html');
    return;
  }

  const sb = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY);
  
  // Ambil data catatan berdasarkan slug atau ID
  let q = sb.from('documents').select('*').eq('is_published', true);
  if (slug) q = q.eq('slug', slug);
  else q = q.eq('id', id);

  const { data: doc, error } = await q.single();

  if (error || !doc) {
    document.getElementById('docTitle').textContent = 'Materi Tidak Ditemukan';
    document.getElementById('readerCanvas').innerHTML = `
      <div class="rounded-xl border border-[#ff7369]/30 bg-[#2b1d1d] p-8 text-center text-sm text-[#ff7369]">
        Catatan materi tidak ditemukan atau belum dipublikasikan oleh admin.
      </div>`;
    return;
  }

 // Set Title & Metadata
  document.title = `${doc.title || 'Tanpa Judul'} — NOTION Reader`;
  document.getElementById('docTitle').textContent = doc.title || 'Tanpa Judul';

  // Render Breadcrumb Navigasi Lengkap (Home / Folder / Judul)
  const crumbEl = document.getElementById('readerBreadcrumb');
  let folderData = null;
  if (doc.folder_id) {
    const { data: f } = await sb.from('folders').select('id, name, icon').eq('id', doc.folder_id).single();
    folderData = f;
  }

  if (crumbEl) {
    crumbEl.innerHTML = `
      <a href="./index.html" class="rounded px-1.5 py-1 hover:bg-[#2b2b2b] hover:text-[#e3e2de]">Home</a>
      <span>/</span>
      ${folderData ? `
        <a href="./index.html?folder=${encodeURIComponent(folderData.id)}" class="flex items-center gap-1 rounded px-1.5 py-1 hover:bg-[#2b2b2b] hover:text-[#e3e2de]">
          <i data-lucide="${esc(folderData.icon || 'folder')}" class="h-3.5 w-3.5"></i>
          <span>${esc(folderData.name)}</span>
        </a>
        <span>/</span>` : ''}
      <span class="truncate px-1.5 py-1 font-medium text-[#e3e2de] max-w-[140px] sm:max-w-xs">${esc(doc.title || 'Tanpa Judul')}</span>
    `;
  }
  if (doc.icon) {
    document.getElementById('docIcon').innerHTML = `<i data-lucide="${esc(doc.icon)}" class="h-6 w-6 text-[#529cca]"></i>`;
  }
  if (doc.cover) {
    document.getElementById('coverBox').classList.remove('hidden');
    document.getElementById('coverImg').src = doc.cover;
  }
  document.getElementById('updateDate').textContent = `Diperbarui ${new Date(doc.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  // Tombol Share Link
  document.getElementById('btnCopyUrl').onclick = () => {
    navigator.clipboard.writeText(location.href).then(() => {
      alert('Tautan materi berhasil disalin!');
    });
  };

  const canvas = document.getElementById('readerCanvas');
  const blocks = Array.isArray(doc.content) ? doc.content : [];

  // Hitung estimasi waktu baca (rata-rata 180 kata/menit)
  let totalWords = (doc.title || '').split(/\s+/).length;
  blocks.forEach(b => {
    const txt = (b.data && (b.data.text || b.data.code || b.data.body || '')) || '';
    totalWords += txt.replace(/<[^>]*>/g, '').split(/\s+/).length;
  });
  const minutes = Math.max(1, Math.ceil(totalWords / 180));
  document.getElementById('readTime').innerHTML = `<i data-lucide="clock" class="inline h-3.5 w-3.5 mr-1 text-[#529cca]"></i> ± ${minutes} menit baca`;

  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
  }

  // Render Blok
  blocks.forEach((b, idx) => {
    const el = renderBlock(b, blocks, idx);
    if (el) canvas.appendChild(el);
  });

  if (window.lucide) window.lucide.createIcons();
  if (window.Prism) window.Prism.highlightAllUnder(canvas);

  // Indikator Progress Membaca saat Scroll
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    document.getElementById('progressBar').style.width = `${progress}%`;
  });
})();

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function renderBlock(block, allBlocks, idx) {
  const d = block.data || {};
  const wrap = document.createElement('div');
  wrap.className = 'py-0.5 leading-relaxed';

  switch (block.type) {
    case 'h1': {
      const id = 'h-' + block.id;
      wrap.innerHTML = `<h1 id="${id}" class="text-[28px] font-bold mt-7 mb-2 text-[#e3e2de] scroll-mt-20">${d.text || ''}</h1>`;
      break;
    }
    case 'h2': {
      const id = 'h-' + block.id;
      wrap.innerHTML = `<h2 id="${id}" class="text-[22px] font-semibold mt-6 mb-1.5 text-[#e3e2de] scroll-mt-20">${d.text || ''}</h2>`;
      break;
    }
    case 'h3': {
      const id = 'h-' + block.id;
      wrap.innerHTML = `<h3 id="${id}" class="text-[18px] font-semibold mt-4 mb-1 text-[#e3e2de] scroll-mt-20">${d.text || ''}</h3>`;
      break;
    }
    case 'h4': {
      const id = 'h-' + block.id;
      wrap.innerHTML = `<h4 id="${id}" class="text-[16px] font-semibold mt-3 mb-0.5 text-[#e3e2de] scroll-mt-20">${d.text || ''}</h4>`;
      break;
    }
    case 'text':
      wrap.innerHTML = `<div class="text-[15px] leading-7 text-[#c9c8c4]">${d.text || ''}</div>`;
      break;

    case 'bulleted':
      wrap.innerHTML = `<div class="flex gap-2.5 text-[15px] leading-7"><span class="select-none text-[#529cca]">•</span><div class="flex-1 text-[#c9c8c4]">${d.text || ''}</div></div>`;
      break;

    case 'numbered': {
      let n = 1;
      for (let k = idx - 1; k >= 0; k--) {
        if (allBlocks[k].type === 'numbered') n++; else break;
      }
      wrap.innerHTML = `<div class="flex gap-2 text-[15px] leading-7"><span class="min-w-[18px] select-none text-[#529cca] font-mono">${n}.</span><div class="flex-1 text-[#c9c8c4]">${d.text || ''}</div></div>`;
      break;
    }

    case 'todo': {
      const storageKey = `todo_${block.id}`;
      const isChecked = localStorage.getItem(storageKey) !== null ? localStorage.getItem(storageKey) === 'true' : Boolean(d.checked);
      
      wrap.innerHTML = `
        <label class="flex items-start gap-2.5 text-[15px] leading-7 cursor-pointer">
          <input type="checkbox" ${isChecked ? 'checked' : ''} class="todo-cb mt-[6px] h-4 w-4 shrink-0 rounded border-[#2e2e2e] accent-[#529cca]" />
          <span class="todo-text flex-1 text-[#c9c8c4] ${isChecked ? 'todo-done' : ''}">${d.text || ''}</span>
        </label>`;
      
      const cb = wrap.querySelector('.todo-cb');
      const txt = wrap.querySelector('.todo-text');
      cb.onchange = () => {
        txt.classList.toggle('todo-done', cb.checked);
        localStorage.setItem(storageKey, cb.checked);
      };
      break;
    }

    case 'toggle':
      wrap.innerHTML = `
        <details class="group my-1 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-2.5" ${d.open ? 'open' : ''}>
          <summary class="flex items-center gap-2 cursor-pointer font-medium text-[15px] text-[#e3e2de] select-none">
            <i data-lucide="chevron-right" class="h-4 w-4 text-[#9b9a97] transition group-open:rotate-90"></i>
            <span>${d.text || 'Detail materi'}</span>
          </summary>
          <div class="mt-2.5 ml-6 border-l border-[#2e2e2e] pl-3 text-[15px] leading-7 text-[#c9c8c4]">
            ${d.body || ''}
          </div>
        </details>`;
      break;

    case 'code': {
      const lang = d.lang || 'bash';
      wrap.innerHTML = `
        <div class="my-2.5 overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#151515]">
          <div class="flex items-center justify-between border-b border-[#2e2e2e] bg-[#1c1c1c] px-3 py-1.5 text-xs text-[#9b9a97]">
            <span class="font-mono text-[11px] uppercase tracking-wider text-[#529cca]">${esc(lang)}</span>
            <button class="cp flex items-center gap-1 rounded px-2 py-1 text-xs text-[#9b9a97] hover:bg-[#2b2b2b] hover:text-[#e3e2de] cursor-pointer">
              <i data-lucide="copy" class="h-3.5 w-3.5"></i> Salin
            </button>
          </div>
          <pre class="m-0 !bg-transparent p-3 overflow-x-auto font-mono leading-relaxed"><code class="language-${esc(lang)} text-[12px] sm:text-[12.5px]">${esc(d.code || '')}</code></pre>
        </div>`;
      wrap.querySelector('.cp').onclick = () => {
        navigator.clipboard.writeText(d.code || '').then(() => alert('Kode berhasil disalin!'));
      };
      break;
    }

    case 'callout': {
      const colors = { blue: '#1f3a4d', yellow: '#463a1c', red: '#4a2626', green: '#1f3f37', gray: '#262626' };
      wrap.innerHTML = `
        <div class="my-2 flex gap-3 rounded-lg border border-[#2e2e2e] p-3.5 text-[15px] leading-7" style="background:${colors[d.color] || colors.blue}">
          <i data-lucide="${esc(d.icon || 'info')}" class="h-5 w-5 shrink-0 mt-1 text-[#e3e2de]"></i>
          <div class="flex-1 text-[#e3e2de]">${d.text || ''}</div>
        </div>`;
      break;
    }

    case 'quote':
      wrap.innerHTML = `<blockquote class="my-2 border-l-[3px] border-[#529cca] pl-4 italic text-[15px] text-[#c9c8c4] leading-7">${d.text || ''}</blockquote>`;
      break;

    case 'divider':
      wrap.innerHTML = `<hr class="my-5 border-0 border-t border-[#2e2e2e]" />`;
      break;

    case 'table': {
      const rows = d.rows || [];
      wrap.innerHTML = `
        <div class="my-3 overflow-x-auto rounded-lg border border-[#2e2e2e]">
          <table class="n-table">
            <tbody>
              ${rows.map((r, ri) => `
                <tr>
                  ${r.map(c => `<${d.header && ri === 0 ? 'th' : 'td'}>${c || ''}</${d.header && ri === 0 ? 'th' : 'td'}>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      break;
    }

    case 'col2': case 'col3': case 'col4': case 'col5': {
      const n = d.cols || Number(block.type.slice(3));
      wrap.innerHTML = `
        <div class="my-2 grid gap-3" style="grid-template-columns: repeat(${n}, minmax(0, 1fr))">
          ${(d.items || []).map(item => `
            <div class="rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-3 text-[15px] leading-7 text-[#c9c8c4]">
              ${item || ''}
            </div>`).join('')}
        </div>`;
      break;
    }

    case 'tabs': {
      const tabs = d.tabs || [];
      const id = 'tab-' + block.id;
      wrap.innerHTML = `
        <div class="my-3 rounded-lg border border-[#2e2e2e] overflow-hidden" id="${id}">
          <div class="flex items-center gap-1 overflow-x-auto border-b border-[#2e2e2e] bg-[#1c1c1c] p-1.5 no-scrollbar">
            ${tabs.map((t, ti) => `
              <button data-ti="${ti}" class="tbtn cursor-pointer whitespace-nowrap rounded px-3 py-1 text-xs sm:text-sm ${ti === 0 ? 'bg-[#2b2b2b] text-white font-medium' : 'text-[#9b9a97] hover:bg-[#242424]'}">
                ${esc(t.title)}
              </button>`).join('')}
          </div>
          <div class="tcontent p-4 text-[15px] leading-7 text-[#c9c8c4] bg-[#191919]">
            ${(tabs[0] || {}).body || ''}
          </div>
        </div>`;

      const container = wrap.querySelector(`#${id}`);
      const btns = container.querySelectorAll('.tbtn');
      const content = container.querySelector('.tcontent');

      btns.forEach(btn => {
        btn.onclick = () => {
          btns.forEach(b => {
            b.className = 'tbtn cursor-pointer whitespace-nowrap rounded px-3 py-1 text-xs sm:text-sm text-[#9b9a97] hover:bg-[#242424]';
          });
          btn.className = 'tbtn cursor-pointer whitespace-nowrap rounded px-3 py-1 text-xs sm:text-sm bg-[#2b2b2b] text-white font-medium';
          content.innerHTML = (tabs[+btn.dataset.ti] || {}).body || '';
        };
      });
      break;
    }

    case 'mermaid': {
      wrap.innerHTML = `<div class="my-3 grid place-items-center overflow-x-auto rounded-lg border border-[#2e2e2e] bg-[#161616] p-4"><div class="mm-out"></div></div>`;
      const out = wrap.querySelector('.mm-out');
      setTimeout(async () => {
        if (!window.mermaid) return;
        try {
          const { svg } = await window.mermaid.render('mm-' + block.id + '-' + Date.now(), d.code || '');
          out.innerHTML = svg;
        } catch (_) {
          out.innerHTML = `<span class="text-xs text-[#ff7369]">Gagal merender diagram.</span>`;
        }
      }, 50);
      break;
    }

    case 'equation': {
      wrap.innerHTML = `<div class="my-3 overflow-x-auto rounded-lg border border-[#2e2e2e] bg-[#202020] p-4 text-center text-lg"><div class="kt-out"></div></div>`;
      const out = wrap.querySelector('.kt-out');
      setTimeout(() => {
        if (!window.katex) { out.textContent = d.latex; return; }
        try { window.katex.render(d.latex || '', out, { throwOnError: false, displayMode: true }); }
        catch (_) { out.innerHTML = `<span class="text-xs text-[#ff7369]">LaTeX tidak valid</span>`; }
      }, 50);
      break;
    }

    case 'image':
      if (d.url) {
        wrap.innerHTML = `
          <figure class="my-3">
            <img src="${esc(d.url)}" alt="${esc(d.caption)}" title="Klik untuk memperbesar"
              class="max-h-[500px] w-full cursor-zoom-in rounded-lg border border-[#2e2e2e] object-contain bg-[#161616] transition hover:opacity-95" />
            ${d.caption ? `<figcaption class="mt-1.5 text-center text-xs text-[#9b9a97]">${esc(d.caption)}</figcaption>` : ''}
          </figure>`;
        wrap.querySelector('img').onclick = () => {
          document.getElementById('lightboxImg').src = d.url;
          document.getElementById('lightbox').classList.remove('hidden');
          document.getElementById('lightbox').classList.add('flex');
        };
      }
      break;

    case 'file':
      if (d.url) {
        wrap.innerHTML = `
          <div class="my-2 flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#202020] p-3 hover:bg-[#252525] transition">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#2b2b2b]">
              <i data-lucide="paperclip" class="h-5 w-5 text-[#529cca]"></i>
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-[#e3e2de]">${esc(d.name || 'Unduh Berkas')}</div>
              <div class="text-xs text-[#9b9a97]">${esc(d.sizeLabel || '')}</div>
            </div>
            <a href="${esc(d.downloadUrl || d.url)}" target="_blank" rel="noopener"
              class="flex items-center gap-1.5 rounded-md border border-[#2e2e2e] bg-[#272727] px-3 py-1.5 text-xs text-[#e3e2de] hover:bg-[#333333]">
              <i data-lucide="download" class="h-3.5 w-3.5"></i> Unduh
            </a>
          </div>`;
      }
      break;

    case 'video':
      if (d.url) {
        wrap.innerHTML = `<div class="my-3"><video controls src="${esc(d.url)}" class="w-full rounded-lg border border-[#2e2e2e] bg-black"></video></div>`;
      }
      break;

    case 'audio':
      if (d.url) {
        wrap.innerHTML = `
          <div class="my-2 rounded-lg border border-[#2e2e2e] bg-[#202020] p-3">
            <div class="mb-2 truncate text-xs text-[#9b9a97]">${esc(d.name || 'Audio')}</div>
            <audio controls src="${esc(d.url)}" class="w-full"></audio>
          </div>`;
      }
      break;

    case 'bookmark':
      if (d.url) {
        wrap.innerHTML = `
          <a href="${esc(d.url)}" target="_blank" rel="noopener" class="my-2 block rounded-lg border border-[#2e2e2e] bg-[#202020] p-3.5 hover:bg-[#252525] transition">
            <div class="text-sm font-medium text-[#529cca]">${esc(d.title || d.url)}</div>
            <div class="mt-1 text-xs text-[#9b9a97] line-clamp-2">${esc(d.desc || '')}</div>
            <div class="mt-2 flex items-center gap-1 text-[11px] text-[#6b6b6b]"><i data-lucide="external-link" class="h-3 w-3"></i> ${esc(d.url)}</div>
          </a>`;
      }
      break;

    case 'toc': {
      const heads = allBlocks.filter(b => /^h[1-4]$/.test(b.type));
      wrap.innerHTML = `
        <div class="my-4 rounded-xl border border-[#2e2e2e] bg-[#1e1e1e] p-4">
          <div class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#529cca]">
            <i data-lucide="list-tree" class="h-4 w-4"></i> Daftar Isi
          </div>
          <div class="space-y-1">
            ${heads.length ? heads.map(h => {
              const lvl = Number(h.type[1]);
              const txt = String(h.data.text || '').replace(/<[^>]*>/g, '') || 'Bagian';
              return `<a href="#h-${h.id}" class="block truncate rounded px-1.5 py-1 text-sm text-[#c9c8c4] hover:bg-[#2b2b2b] hover:text-[#529cca] transition" style="padding-left: ${(lvl - 1) * 14 + 6}px">${esc(txt)}</a>`;
            }).join('') : '<div class="text-xs text-[#6b6b6b]">Belum ada heading pada materi ini.</div>'}
          </div>
        </div>`;
      break;
    }
  }

  return wrap;
}