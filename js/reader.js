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
    const txt = (b.data && (b.data.text || b.data.code || b.data.body || b.data.cmd || '')) || '';
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

function parseTechText(html) {
  if (!html) return '';
  let parsed = String(html).replace(/\*\*([^*]+)\*\*/g, '<span class="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-[#2a2a2a] text-[#ff9e64] rounded border border-[#3b3b3b] font-semibold">$1</span>');
  parsed = parsed.replace(/<kbd>(.*?)<\/kbd>/g, '<kbd class="px-1.5 py-0.5 text-xs font-mono bg-[#333] text-[#7aa2f7] rounded border border-[#444] shadow-sm">$1</kbd>');
  return parsed;
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
      wrap.innerHTML = `<div class="text-[15px] leading-7 text-[#c9c8c4]">${parseTechText(d.text || '')}</div>`;
      break;

    case 'bulleted':
      wrap.innerHTML = `<div class="flex gap-2.5 text-[15px] leading-7"><span class="select-none text-[#529cca]">•</span><div class="flex-1 text-[#c9c8c4]">${parseTechText(d.text || '')}</div></div>`;
      break;

    case 'numbered': {
      let n = 1;
      for (let k = idx - 1; k >= 0; k--) {
        if (allBlocks[k].type === 'numbered') n++; else break;
      }
      wrap.innerHTML = `<div class="flex gap-2 text-[15px] leading-7"><span class="min-w-[18px] select-none text-[#529cca] font-mono">${n}.</span><div class="flex-1 text-[#c9c8c4]">${parseTechText(d.text || '')}</div></div>`;
      break;
    }

    case 'todo': {
      const storageKey = `todo_${block.id}`;
      const isChecked = localStorage.getItem(storageKey) !== null ? localStorage.getItem(storageKey) === 'true' : Boolean(d.checked);
      
      wrap.innerHTML = `
        <label class="flex items-start gap-2.5 text-[15px] leading-7 cursor-pointer">
          <input type="checkbox" ${isChecked ? 'checked' : ''} class="todo-cb mt-[6px] h-4 w-4 shrink-0 rounded border-[#2e2e2e] accent-[#529cca]" />
          <span class="todo-text flex-1 text-[#c9c8c4] ${isChecked ? 'todo-done' : ''}">${parseTechText(d.text || '')}</span>
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
            <span>${parseTechText(d.text || 'Detail materi')}</span>
          </summary>
          <div class="mt-2.5 ml-6 border-l border-[#2e2e2e] pl-3 text-[15px] leading-7 text-[#c9c8c4]">
            ${parseTechText(d.body || '')}
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

    case 'linux-cmd': {
      wrap.innerHTML = `
        <div class="my-3 rounded-lg border border-[#2e2e2e] bg-[#161616] overflow-hidden shadow-md">
          <div class="px-3.5 py-2 border-b border-[#2e2e2e] bg-[#1c1c1c] text-sm font-semibold text-[#e3e2de] flex items-center gap-2">
            <i data-lucide="terminal" class="h-4 w-4 text-[#529cca]"></i> ${esc(d.title || 'Perintah Linux')}
          </div>
          <div class="p-3 bg-[#111] font-mono text-xs text-[#a9b7c6] relative group flex items-center justify-between">
            <div><span class="text-[#629755] select-none">$ </span><span class="text-[#eceff4]">${esc(d.cmd || '')}</span></div>
            <button class="cp rounded bg-[#2a2a2a] px-2 py-1 text-[11px] text-[#aaa] hover:text-white hover:bg-[#3b3b3b] transition cursor-pointer">Salin</button>
          </div>
          ${d.desc ? `<div class="px-3.5 py-2.5 text-xs text-[#9b9a97] border-t border-[#222] bg-[#181818]">${parseTechText(d.desc)}</div>` : ''}
        </div>`;
      wrap.querySelector('.cp')?.addEventListener('click', () => {
        navigator.clipboard.writeText(d.cmd || '').then(() => alert('Perintah disalin!'));
      });
      break;
    }

    case 'net-config': {
      const vendor = d.vendor || 'cisco';
      const vendorName = vendor.toUpperCase();
      wrap.innerHTML = `
        <div class="my-3 rounded-lg border border-[#2e2e2e] bg-[#151515] overflow-hidden shadow-md">
          <div class="flex items-center justify-between px-3.5 py-2 bg-[#1f1f1f] border-b border-[#2e2e2e] text-xs text-[#9b9a97]">
            <span class="uppercase font-mono font-bold tracking-wider text-[#529cca]">CLI Config — ${esc(vendorName)}</span>
            <button class="cp flex items-center gap-1.5 rounded px-2.5 py-1 bg-[#2a2a2a] hover:bg-[#3b3b3b] text-xs text-[#e3e2de] transition cursor-pointer"><i data-lucide="copy" class="h-3.5 w-3.5"></i> Salin</button>
          </div>
          <pre class="p-3.5 font-mono text-xs text-[#a9b7c6] overflow-x-auto m-0 bg-[#121212] leading-relaxed">${esc(d.code || '')}</pre>
        </div>`;
      wrap.querySelector('.cp').onclick = () => navigator.clipboard.writeText(d.code || '').then(() => alert('Konfigurasi disalin!'));
      break;
    }

    case 'cyber-alert': {
      const level = d.level || 'warning';
      const colors = {
        warning: { bg: '#3a2e16', border: '#b58900', icon: 'alert-triangle', text: '#ffb86c' },
        danger: { bg: '#3d1c1c', border: '#dc322f', icon: 'shield-alert', text: '#ff7369' },
        info: { bg: '#1f3a4d', border: '#268bd2', icon: 'shield-check', text: '#8be9fd' }
      };
      const c = colors[level] || colors.warning;
      const defaultTitleTxt = `SECURITY ALERT — ${level.toUpperCase()}`;
      const currentTitle = d.title !== undefined && d.title !== '' ? d.title : defaultTitleTxt;
      wrap.innerHTML = `
        <div class="flex items-start gap-3 rounded-lg border p-3.5 my-3 shadow-md" style="background:${c.bg}; border-color:${c.border}">
          <i data-lucide="${c.icon}" class="h-5 w-5 shrink-0 mt-0.5" style="color:${c.text}"></i>
          <div class="flex-1">
            <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:${c.text}">${esc(currentTitle)}</div>
            <div class="text-[14px] leading-6 text-[#e3e2de]">${parseTechText(d.text || '')}</div>
          </div>
        </div>`;
      break;
    }

    case 'env-variable': {
      wrap.innerHTML = `
        <div class="flex items-center gap-3 rounded-md border border-[#2e2e2e] bg-[#1f1f1f] px-3.5 py-2 my-2 shadow-sm">
          <i data-lucide="box" class="h-4 w-4 text-[#7aa2f7]"></i>
          <span class="font-mono text-xs font-bold text-[#7aa2f7] bg-[#141414] px-2 py-1 rounded border border-[#333]">${esc(d.key)}</span>
          <span class="font-mono text-xs text-[#9ece6a] bg-[#141414] px-2 py-1 rounded border border-[#333] flex-1 truncate">${esc(d.val)}</span>
        </div>`;
      break;
    }

    case 'log-output': {
      wrap.innerHTML = `
        <div class="rounded-lg border border-[#2e2e2e] bg-[#121212] my-3 overflow-hidden shadow-md">
          <div class="px-3.5 py-1.5 bg-[#1a1a1a] border-b border-[#2e2e2e] text-[11px] font-mono text-[#888] flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-[#f1c40f]"></span> Terminal Log Stream
          </div>
          <pre class="p-3.5 font-mono text-xs text-[#2ecc71] max-h-56 overflow-y-auto m-0 bg-[#0d0d0d] leading-relaxed">${esc(d.log)}</pre>
        </div>`;
      break;
    }

    case 'endpoint-api': {
      const method = d.method || 'GET';
      const colors = { GET: 'bg-[#1f3f37] text-[#2ecc71] border-[#27ae60]', POST: 'bg-[#463a1c] text-[#f1c40f] border-[#f39c12]', PUT: 'bg-[#1f3a4d] text-[#3498db] border-[#2980b9]', DELETE: 'bg-[#4a2626] text-[#e74c3c] border-[#c0392b]' };
      wrap.innerHTML = `
        <div class="rounded-lg border border-[#2e2e2e] bg-[#181818] p-3.5 my-3 shadow-md space-y-2.5">
          <div class="flex items-center gap-2.5">
            <span class="px-2.5 py-1 rounded text-xs font-mono font-bold border ${colors[method] || 'bg-[#2a2a2a] text-white border-[#444]'}">${method}</span>
            <span class="font-mono text-xs font-semibold text-[#529cca] bg-[#111] px-2.5 py-1 rounded border border-[#333] flex-1">${esc(d.url)}</span>
          </div>
          ${d.payload ? `
            <div class="text-[11px] font-mono text-[#888] uppercase tracking-wider">Payload / Body JSON:</div>
            <pre class="p-3 bg-[#111] rounded border border-[#2e2e2e] font-mono text-xs text-[#a9b7c6] overflow-x-auto m-0">${esc(d.payload)}</pre>
          ` : ''}
        </div>`;
      break;
    }

    case 'tool-card': {
      wrap.innerHTML = `
        <div class="flex items-start gap-3.5 rounded-lg border border-[#2e2e2e] bg-[#1f1f1f] p-4 my-3 shadow-md">
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#2b2b2b] text-[#529cca] border border-[#333]">
            <i data-lucide="wrench" class="h-5 w-5"></i>
          </div>
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-white">${esc(d.name || 'Tool')}</span>
              ${d.version ? `<span class="text-[11px] font-mono px-2 py-0.5 rounded bg-[#2b2b2b] text-[#9b9a97] border border-[#383838]">${esc(d.version)}</span>` : ''}
            </div>
            <div class="text-xs text-[#9b9a97] leading-relaxed">${esc(d.desc)}</div>
            ${d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-xs text-[#529cca] hover:text-[#7aa2f7] hover:underline mt-1.5 font-medium"><i data-lucide="external-link" class="h-3.5 w-3.5"></i> Tautan Resmi & Dokumentasi</a>` : ''}
          </div>
        </div>`;
      break;
    }

    case 'cheatsheet': {
      let headers = d.headers || ['Command', 'Deskripsi'];
      let rows = d.rows || [['', '']];
      if (!d.rows && d.items) {
        headers = ['Command', 'Deskripsi'];
        rows = d.items.map(i => [i.key || '', i.val || '']);
      }
      wrap.innerHTML = `
        <div class="my-3 rounded-lg border border-[#2e2e2e] bg-[#161616] overflow-hidden shadow-md">
          <div class="px-3.5 py-2 border-b border-[#2e2e2e] bg-[#1c1c1c] text-sm font-semibold text-[#e3e2de] flex items-center gap-2">
            <i data-lucide="book-open" class="h-4 w-4 text-[#f1c40f]"></i> ${esc(d.title || 'Cheatsheet')}
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr class="bg-[#1f1f1f] text-[#9b9a97] border-b border-[#2e2e2e]">
                  ${headers.map(h => `<th class="px-3.5 py-2 font-semibold">${esc(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222]">
                ${rows.map(row => `
                  <tr class="hover:bg-[#1a1a1a]">
                    ${row.map((cell, ci) => `
                      <td class="px-3.5 py-2.5 ${ci === 0 ? 'text-[#ff9e64] font-bold' : 'text-[#b0b0b0] font-sans'}">${parseTechText(cell || '')}</td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      break;
    }

    case 'callout': {
      const colors = { blue: '#1f3a4d', yellow: '#463a1c', red: '#4a2626', green: '#1f3f37', gray: '#262626' };
      wrap.innerHTML = `
        <div class="my-2 flex gap-3 rounded-lg border border-[#2e2e2e] p-3.5 text-[15px] leading-7" style="background:${colors[d.color] || colors.blue}">
          <i data-lucide="${esc(d.icon || 'info')}" class="h-5 w-5 shrink-0 mt-1 text-[#e3e2de]"></i>
          <div class="flex-1 text-[#e3e2de]">${parseTechText(d.text || '')}</div>
        </div>`;
      break;
    }

    case 'quote':
      wrap.innerHTML = `<blockquote class="my-2 border-l-[3px] border-[#529cca] pl-4 italic text-[15px] text-[#c9c8c4] leading-7">${parseTechText(d.text || '')}</blockquote>`;
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
                  ${r.map(c => `<${d.header && ri === 0 ? 'th' : 'td'}>${parseTechText(c || '')}</${d.header && ri === 0 ? 'th' : 'td'}>`).join('')}
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
              ${parseTechText(item || '')}
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
            ${parseTechText((tabs[0] || {}).body || '')}
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
          content.innerHTML = parseTechText((tabs[+btn.dataset.ti] || {}).body || '');
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
            ${d.caption ? `<figcaption class="mt-1.5 text-center text-xs text-[#9b9a97]">${parseTechText(d.caption)}</figcaption>` : ''}
          </figure>`;
        wrap.querySelector('img').onclick = () => {
          document.getElementById('lightboxImg').src = d.url;
          document.getElementById('lightbox').classList.remove('hidden');
          document.getElementById('lightbox').classList.add('flex');
        };
      }
      break;

    case 'image-grid': {
      const imgs = d.images || [];
      if (imgs.length > 0) {
        const colCount = Math.min(imgs.length, 3);
        wrap.innerHTML = `
          <div class="my-3 space-y-2">
            <div class="grid gap-2.5" style="grid-template-columns: repeat(${colCount}, minmax(0, 1fr));">
              ${imgs.map((url, idx) => `
                <div class="relative group overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#161616] aspect-video cursor-zoom-in shadow-md">
                  <img src="${esc(url)}" referrerpolicy="no-referrer" data-idx="${idx}" class="h-full w-full object-cover transition hover:scale-105" />
                </div>
              `).join('')}
            </div>
            ${d.caption ? `<div class="text-xs text-[#9b9a97] text-center mt-1.5">${parseTechText(d.caption)}</div>` : ''}
          </div>`;

        wrap.querySelectorAll('img').forEach(img => {
          img.onclick = () => {
            document.getElementById('lightboxImg').src = img.src;
            document.getElementById('lightbox').classList.remove('hidden');
            document.getElementById('lightbox').classList.add('flex');
          };
        });
      }
      break;
    }

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
            <div class="mt-1 text-xs text-[#9b9a97] line-clamp-2">${parseTechText(d.desc || '')}</div>
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