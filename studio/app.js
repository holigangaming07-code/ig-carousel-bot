const $ = (id) => document.getElementById(id);
const TYPES = {
  cover: { label: 'Kapak', fields: [['badge', 'Rozet'], ['icon', 'Emoji'], ['title', 'Başlık'], ['subtitle', 'Alt başlık', 'area']], init: { title: 'Proje Adı', subtitle: 'Tek cümlelik açıklama' } },
  step: { label: 'Adım', fields: [['number', 'Numara'], ['title', 'Başlık'], ['code', 'Kod', 'code'], ['text', 'Not', 'area']], init: { number: 1, title: 'Adım', code: 'npm install' } },
  code: { label: 'Kod', fields: [['title', 'Başlık'], ['code', 'Kod', 'code'], ['text', 'Not', 'area']], init: { title: 'Örnek', code: 'proje run' } },
  tip: { label: 'İpucu', fields: [['title', 'Başlık'], ['text', 'Metin', 'area']], init: { title: 'İpucu', text: 'Buraya ipucu yaz.' } },
  list: { label: 'Liste', fields: [['title', 'Başlık'], ['items', 'Maddeler (her satır bir madde)', 'list']], init: { title: 'Özellikler', items: ['Madde 1', 'Madde 2'] } },
  cta: { label: 'Çağrı', fields: [['title', 'Başlık'], ['text', 'Metin', 'area']], init: { title: 'Yıldız ver ⭐', text: 'github.com/kullanici/proje' } },
  stat: { label: 'Rakam ✦', fields: [['value', 'Büyük rakam'], ['title', 'Başlık'], ['text', 'Not', 'area']], init: { value: '1.2k', title: 'GitHub yıldızı' } },
  explain: { label: 'Açıklama ✦', fields: [['kicker', 'Etiket'], ['icon', 'Emoji'], ['text', 'Metin', 'area']], init: { kicker: 'Ne işe yarar?', icon: '💡', text: 'Projenin ne yaptığını burada anlat.' } },
  cards: { label: 'Kartlar ✦', fields: [['title', 'Başlık'], ['items', 'Kartlar (her satır: emoji metin)', 'list']], init: { title: 'Neler yapabiliyor?', items: ['⚡ Hızlı', '🔒 Güvenli'] } },
  quote: { label: 'Alıntı ✦', fields: [['text', 'Alıntı', 'area'], ['author', 'Yazar']], init: { text: 'Basit olan kazanır.', author: 'Anonim' } },
};
const THEMES = [
  ['', 'GitHub Dark', '#2f81f7,#0d1117'], ['sunset', 'Sunset', '#ff7a45,#1a0f1f'], ['neon', 'Neon', '#b45cff,#0b0820'],
  ['forest', 'Forest', '#34d399,#0c1a14'], ['paper', 'Paper', '#c2410c,#f6f1e7'],
  ['rising', 'Yükselen', '#2ee6a6,#05131a'], ['blue', 'Popüler', '#3b9bff,#060d1f'], ['violet', 'Çok popüler', '#8b6bff,#0a0720'], ['magenta', 'Efsane', '#ff4fd8,#12061c'], ['gold', 'Dev', '#ffb02e,#150d05'],
];
let data, css, tpl, pi = 0, si = 0, saveT, thumbT;
const post = () => data.posts[pi];
const slide = () => post().slides[si];

function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200); }
function status(msg, cls = '') { const s = $('status'); s.textContent = msg; s.className = 'status ' + cls; }
const html = (i, p = post()) => Slides.fill(tpl, css, p.slides[i], i, p.slides.length, p.theme, data.brand);

function save() {
  status('Kaydediliyor…');
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    try {
      const r = await fetch('/api/posts', { method: 'POST', body: JSON.stringify(data) });
      if (!r.ok) throw new Error((await r.json()).error);
      status('Kaydedildi ✓', 'ok');
    } catch (e) { status('Kayıt hatası: ' + e.message, 'err'); }
  }, 500);
}

function fit() {
  const st = $('stage'), s = Math.min((st.clientWidth - 8) / 1080, (st.clientHeight - 8) / 1350);
  $('stageInner').style.width = 1080 * s + 'px'; $('stageInner').style.height = 1350 * s + 'px';
  $('preview').style.transform = `scale(${s})`;
}

function renderPreview() {
  if (!slide()) { $('preview').srcdoc = ''; return; }
  $('preview').srcdoc = html(si);
  $('navInfo').textContent = `${si + 1} / ${post().slides.length} · ${TYPES[slide().type]?.label || slide().type}`;
  $('slideNo').textContent = `${si + 1}/${post().slides.length}`;
}

function renderFilm() {
  const f = $('film'); f.innerHTML = '';
  post().slides.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'thumb' + (i === si ? ' on' : '');
    const fr = document.createElement('iframe'); fr.srcdoc = html(i); d.appendChild(fr);
    d.insertAdjacentHTML('beforeend', `<i>${i + 1}</i>`);
    d.onclick = () => { si = i; refresh(); };
    f.appendChild(d);
  });
}

function renderPosts() {
  const l = $('postList'); l.innerHTML = '';
  data.posts.forEach((p, i) => {
    const d = document.createElement('div'); d.className = 'post' + (i === pi ? ' on' : '');
    d.innerHTML = `<span>${Slides.esc(p.id)}</span><span class="pill ${p.published ? 'pub' : ''}">${p.published ? 'yayında' : p.draft ? 'taslak' : 'sırada'}</span>`;
    d.onclick = () => { pi = i; si = 0; refresh(); };
    l.appendChild(d);
  });
}

function renderFields() {
  const box = $('fields'); box.innerHTML = '';
  const s = slide(); if (!s) return;
  (TYPES[s.type]?.fields || []).forEach(([key, label, kind]) => {
    const w = document.createElement('label'); w.textContent = label;
    const el = document.createElement(kind ? 'textarea' : 'input');
    if (kind) el.rows = kind === 'code' || kind === 'list' ? 4 : 2;
    if (kind === 'code') el.style.fontFamily = 'Consolas, monospace';
    el.value = kind === 'list' ? (s[key] || []).join('\n') : (s[key] ?? '');
    el.oninput = () => {
      s[key] = kind === 'list' ? el.value.split('\n').filter(Boolean) : (key === 'number' && el.value !== '' && !isNaN(el.value) ? Number(el.value) : el.value);
      renderPreview(); save(); clearTimeout(thumbT); thumbT = setTimeout(renderFilm, 400);
    };
    w.appendChild(el); box.appendChild(w);
  });
}

function renderPostMeta() {
  const p = post();
  $('postId').value = p.id; $('postPub').checked = !!p.published; $('postDraft').checked = !!p.draft; $('postCaption').value = p.caption || '';
  const n = (p.caption || '').length; $('capCount').textContent = `${n}/2200`; $('capCount').className = 'count' + (n > 2200 ? ' over' : '');
  $('themes').innerHTML = '';
  THEMES.forEach(([id, name, c]) => {
    const [a, b] = c.split(',');
    const d = document.createElement('div'); d.className = 'sw' + ((p.theme || '') === id ? ' on' : ''); d.title = name;
    d.style.background = `linear-gradient(135deg,${a} 50%,${b} 50%)`;
    d.onclick = () => { if (id) p.theme = id; else delete p.theme; save(); refresh(); };
    $('themes').appendChild(d);
  });
}

function refresh() {
  if (!data.posts.length) { data.posts.push(blankPost()); }
  pi = Math.min(pi, data.posts.length - 1); si = Math.min(si, post().slides.length - 1);
  renderPosts(); renderPostMeta(); renderFields(); renderPreview(); renderFilm(); fit();
}

function blankPost(id) {
  id = id || 'yeni-' + (data.posts.length + 1);
  return { id, published: false, draft: true, caption: '', slides: [
    { type: 'cover', ...TYPES.cover.init }, { type: 'cta', ...TYPES.cta.init }] };
}
const uniqueId = (base) => { let id = base, n = 2; while (data.posts.some((p) => p.id === id)) id = base + '-' + n++; return id; };

async function fromGithub() {
  const repo = $('ghRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return toast('Biçim: sahip/repo');
  status('GitHub okunuyor…');
  try {
    const r = await fetch('https://api.github.com/repos/' + repo);
    if (!r.ok) throw new Error(r.status === 404 ? 'Repo bulunamadı' : 'GitHub hatası ' + r.status);
    const g = await r.json();
    let readme = '';
    try { readme = await (await fetch('https://api.github.com/repos/' + repo + '/readme', { headers: { Accept: 'application/vnd.github.raw+json' } })).text(); } catch (_) {}
    const p = Slides.postFromRepo(g, uniqueId(g.name.toLowerCase().replace(/[^\w.-]/g, '-')), readme);
    data.posts.push(p); pi = data.posts.length - 1; si = 0; refresh(); save(); status('Carousel hazır ✓', 'ok');
  } catch (e) { status(e.message, 'err'); toast(e.message); }
}

async function toJpeg(i) {
  const doc = new DOMParser().parseFromString(html(i), 'text/html');
  const style = doc.querySelector('style').textContent;
  const el = new XMLSerializer().serializeToString(doc.querySelector('.slide'));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><foreignObject width="1080" height="1350"><div xmlns="http://www.w3.org/1999/xhtml"><style>${style}</style>${el}</div></foreignObject></svg>`;
  const img = new Image();
  await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('Görsel oluşturulamadı')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  c.getContext('2d').drawImage(img, 0, 0);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.92));
}

async function exportAll() {
  const b = $('btnExport'); b.disabled = true;
  try {
    await fetch('/api/posts', { method: 'POST', body: JSON.stringify(data) });
    const n = post().slides.length;
    for (let i = 0; i < n; i++) {
      status(`Dışa aktarılıyor ${i + 1}/${n}…`);
      const r = await fetch(`/api/export?id=${encodeURIComponent(post().id)}&n=${i + 1}`, { method: 'POST', body: await toJpeg(i) });
      if (!r.ok) throw new Error('Kayıt başarısız');
    }
    status(`${n} slayt output/${post().id} içine yazıldı ✓`, 'ok'); toast('Dışa aktarma tamam');
  } catch (e) { status(e.message, 'err'); toast(e.message); }
  b.disabled = false;
}

function bind() {
  $('postId').oninput = (e) => { post().id = e.target.value.trim(); renderPosts(); save(); };
  $('postDraft').onchange = (e) => { if (e.target.checked) post().draft = true; else delete post().draft; renderPosts(); save(); };
  $('postPub').onchange = (e) => { post().published = e.target.checked; renderPosts(); save(); };
  $('postCaption').oninput = (e) => { post().caption = e.target.value; renderPostMeta(); $('postCaption').focus(); save(); };
  $('cfgRepo').oninput = (e) => { data.repo = e.target.value.trim(); save(); };
  $('brandName').oninput = (e) => { (data.brand ||= {}).name = e.target.value; refresh(); save(); };
  $('brandHandle').oninput = (e) => { (data.brand ||= {}).handle = e.target.value; refresh(); save(); };
  $('cfgBranch').oninput = (e) => { data.branch = e.target.value.trim(); save(); };
  $('btnNewPost').onclick = () => { data.posts.push(blankPost(uniqueId('yeni'))); pi = data.posts.length - 1; si = 0; refresh(); save(); };
  $('btnGh').onclick = fromGithub;
  $('ghRepo').onkeydown = (e) => e.key === 'Enter' && fromGithub();
  $('btnPrev').onclick = () => { si = Math.max(0, si - 1); refresh(); };
  $('btnNext').onclick = () => { si = Math.min(post().slides.length - 1, si + 1); refresh(); };
  $('btnAdd').onclick = () => {
    if (post().slides.length >= 10) return toast('Instagram en fazla 10 slayt kabul eder');
    const t = $('addType').value; post().slides.splice(si + 1, 0, { type: t, ...structuredClone(TYPES[t].init) }); si++; refresh(); save();
  };
  $('btnDup').onclick = () => { if (post().slides.length >= 10) return toast('En fazla 10 slayt'); post().slides.splice(si + 1, 0, structuredClone(slide())); si++; refresh(); save(); };
  $('btnDel').onclick = () => { if (post().slides.length <= 2) return toast('En az 2 slayt gerekli'); post().slides.splice(si, 1); refresh(); save(); };
  const mv = (d) => { const a = post().slides, j = si + d; if (j < 0 || j >= a.length) return; [a[si], a[j]] = [a[j], a[si]]; si = j; refresh(); save(); };
  $('btnLeft').onclick = () => mv(-1); $('btnRight').onclick = () => mv(1);
  $('btnExport').onclick = exportAll;
  $('btnZip').onclick = () => { location.href = '/api/zip?id=' + encodeURIComponent(post().id); };
  $('btnFolder').onclick = () => fetch('/api/open-output?id=' + encodeURIComponent(post().id), { method: 'POST' });
  document.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') $('btnPrev').click(); if (e.key === 'ArrowRight') $('btnNext').click();
  });
  addEventListener('resize', fit);
  $('addType').innerHTML = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
}

(async () => {
  [data, css, tpl] = await Promise.all([fetch('/api/posts').then((r) => r.json()), fetch('/theme.css').then((r) => r.text()), fetch('/slide.html').then((r) => r.text())]);
  $('brandName').value = (data.brand || {}).name || 'Repo Rehberi'; $('brandHandle').value = (data.brand || {}).handle || '@reporehberi';
  $('cfgRepo').value = data.repo || ''; $('cfgBranch').value = data.branch || '';
  bind(); refresh(); status('Hazır');
  setInterval(() => fetch('/api/ping').catch(() => {}), 4000); fetch('/api/ping');
})();
