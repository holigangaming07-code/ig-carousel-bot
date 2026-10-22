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
  rvCover: { label: 'Şablon: Kapak', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, title: 'repo-adi', tagline: 'Kısa tanım', stars: '12.345', date: '1 Ocak 2026', forks: '1.234', owner: 'sahip', repo: 'repo-adi', promise: 'Ana mesaj' } },
  rvExplain: { label: 'Şablon: Ne işe yarar', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, summary: 'Tek cümle', description: 'Açıklama', features: [{ icon: '⚙️', title: 'Özellik', text: 'Kısa açıklama' }] } },
  rvAudience: { label: 'Şablon: Kimler için', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, intro: 'Hedef kitle', audience: [{ icon: '👩‍💻', name: 'Geliştiriciler', text: 'Kısa tanım', needs: ['İhtiyaç 1', 'İhtiyaç 2'] }], bottom: 'Ana sonuç' } },
  rvSetup: { label: 'Şablon: Kurulum', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, intro: 'Kurulum var mı?', steps: [{ icon: '⚙️', text: 'Adım 1' }], notes: ['Not 1'], owner: 'sahip', repo: 'repo', bottom: 'İpucu' } },
  rvSections: { label: 'Şablon: Bölümler', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, title: 'Neler var?', intro: 'Açıklama', sections: [{ icon: '📁', name: 'Bölüm', text: 'Kısa', items: ['Öğe 1'] }], note: 'Dikkat çeken not', bottom: 'Mesaj' } },
  rvUsage: { label: 'Şablon: Kullanım', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, intro: 'Nasıl kullanılır', steps: [{ icon: '🖱️', text: 'Adım 1' }], link: 'github.com/sahip/repo', examples: ['Örnek 1'], bottom: 'Mesaj' } },
  rvDownload: { label: 'Şablon: İndirme', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, intro: 'Zorunlu mu?', command: 'git clone https://github.com/sahip/repo', advantages: [{ icon: '🏆', title: 'Avantaj', text: 'Kısa' }], alt: { title: 'Alternatif', text: 'ZIP indir' }, note: 'Not' } },
  rvFinal: { label: 'Şablon: Kapanış', fields: [['__json', 'Veri (JSON)', 'json']], init: { tier: 2, intro: 'Seri vaadi', rows: [{ icon: '💻', k: 'Proje:', v: 'repo' }] } },
  quote: { label: 'Alıntı ✦', fields: [['text', 'Alıntı', 'area'], ['author', 'Yazar']], init: { text: 'Basit olan kazanır.', author: 'Anonim' } },
};
const THEMES = [
  ['', 'GitHub Dark', '#2f81f7,#0d1117'], ['sunset', 'Sunset', '#ff7a45,#1a0f1f'], ['neon', 'Neon', '#b45cff,#0b0820'],
  ['forest', 'Forest', '#34d399,#0c1a14'], ['paper', 'Paper', '#c2410c,#f6f1e7'], ['steel', 'Gri 0-999', '#9db4d6,#080d18'],
  ['rising', 'Yeşil 1K-9.9K', '#2ee6a6,#05131a'], ['blue', 'Mavi 10K-49.9K', '#3b9bff,#060d1f'], ['violet', 'Mor 50K-99.9K', '#8b6bff,#0a0720'], ['gold', 'Altın 100K+', '#ffb02e,#150d05'],
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
    if (kind === 'json') {
      const el = document.createElement('textarea'); el.rows = 18; el.style.fontFamily = 'Consolas, monospace'; el.style.fontSize = '12px';
      const { type, ...rest } = s; el.value = JSON.stringify(rest, null, 2);
      el.oninput = () => { try { const o = JSON.parse(el.value); Object.keys(s).forEach((k) => k !== 'type' && delete s[k]); Object.assign(s, o); el.style.borderColor = ''; renderPreview(); save(); clearTimeout(thumbT); thumbT = setTimeout(renderFilm, 400); } catch (e) { el.style.borderColor = '#f87171'; } };
      w.appendChild(el); box.appendChild(w); return;
    }
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
  let fonts, layout;
  [data, css, tpl, fonts, layout] = await Promise.all([fetch('/api/posts').then((r) => r.json()), fetch('/theme.css').then((r) => r.text()), fetch('/slide.html').then((r) => r.text()), fetch('/fonts.css').then((r) => r.text()), fetch('/rv/layout.json').then((r) => r.json())]);
  css += fonts; Slides.setLayout(layout);
  const bg = {};
  await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async (n) => {
    const b = await (await fetch(`/rv/${n}.jpg`)).blob();
    bg[n] = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  }));
  Slides.setBg((n) => bg[n]);
  $('brandName').value = (data.brand || {}).name || 'Repo Rehberi'; $('brandHandle').value = (data.brand || {}).handle || '@reporehberi';
  $('cfgRepo').value = data.repo || ''; $('cfgBranch').value = data.branch || '';
  bind(); status('Hazır'); openAuto();
  setInterval(() => fetch('/api/ping').catch(() => {}), 4000); fetch('/api/ping');
})();

// ---------------- Otomasyon paneli ----------------
const ISECRETS = [['ANTHROPIC_API_KEY', 'Türkçe özet (yapay zeka)'], ['IG_USER_ID', 'Instagram hesap kimliği'], ['IG_ACCESS_TOKEN', 'Instagram erişim anahtarı'],
  ['IG_USER_ID_EN', 'İngilizce hesap: Instagram hesap kimliği'], ['IG_ACCESS_TOKEN_EN', 'İngilizce hesap: erişim anahtarı (yoksa ortak anahtar kullanılır)'],
  ['FB_APP_ID', 'Token yenileme: Meta uygulama kimliği'], ['FB_APP_SECRET', 'Token yenileme: Meta uygulama sırrı'], ['GH_PAT', 'Token yenileme: GitHub erişim anahtarı']];
let autoT, autoInfo = null, autoFiles = null, autoRun = null;
const api = (u, body) => fetch(u, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
const fmt = (d) => new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function nextRun(crons) {
  const now = new Date(); let best = null;
  crons.forEach((c, i) => {
    const m = c.match(/^(\d+) (\d+) \* \* \*$/); if (!m) return;
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), +m[2], +m[1]));
    if (t <= now) t.setUTCDate(t.getUTCDate() + 1);
    if (!best || t < best.t) best = { t, i };
  });
  return best;
}
const cronLabel = (c, i) => { const m = c.match(/^(\d+) (\d+) /); if (!m) return c; const t = new Date(Date.UTC(2026, 0, 1, +m[2], +m[1])); return `Her gün ${t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${i === 0 ? 'popüler proje' : 'yükselen proje'}`; };
const statusChip = (r) => r.status !== 'completed' ? '<span class="chip run">çalışıyor…</span>' : r.conclusion === 'success' ? '<span class="chip ok">başarılı</span>' : r.conclusion === 'cancelled' ? '<span class="chip">iptal</span>' : '<span class="chip bad">hatalı</span>';

const ACC_DEFAULT = { tr: { id: 'tr', lang: 'tr', enabled: true, brand: { name: 'Repo Rehberi', handle: '@reporehberi' } }, en: { id: 'en', lang: 'en', enabled: false, brand: { name: 'Repo Guide', handle: '@repoguide' } } };
function accOf(id) {
  data.accounts ||= [];
  let a = data.accounts.find((x) => x.id === id);
  if (!a) { a = JSON.parse(JSON.stringify(ACC_DEFAULT[id])); data.accounts.push(a); }
  a.brand ||= { ...ACC_DEFAULT[id].brand };
  return a;
}
function renderAuto() {
  const v = $('autoView'), a = autoInfo; if (!a) { v.innerHTML = '<div class="card">Yükleniyor…</div>'; return; }
  const nx = nextRun(a.crons), on = a.workflow === 'active';
  const set = data.settings || {};
  const val = (k, d) => (data[k] ?? d);
  const acc = (id) => accOf(id);
  v.innerHTML = `<div class="agrid">
  <div class="card"><h3>Durum</h3>
    <div class="sec"><span>GitHub bağlantısı</span><b>${a.gh.ok ? `<span class="dot on"></span>${Slides.esc(a.gh.user)}` : '<span class="dot off"></span>Bağlı değil'}</b></div>
    <div class="sec"><span>Depo</span><small>${Slides.esc(a.repo)}</small></div>
    <div class="sec"><span>Otomasyon</span><b><span class="dot ${on ? 'on' : 'off'}"></span>${on ? 'Açık' : a.workflow === '?' ? 'bilinmiyor' : 'Kapalı'}</b></div>
    ${a.crons.map((c, i) => `<div class="sec"><span>${cronLabel(c, i)}</span><small>${i === 0 ? '' : ''}</small></div>`).join('')}
    <div class="sec"><span>Sonraki çalışma</span><b>${nx ? nx.t.toLocaleString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' · ' + (nx.i === 0 ? 'popüler' : 'yükselen') : '-'}</b></div>
    <div class="row2"><button data-act="toggle" class="${on ? 'danger' : 'primary'}">${on ? '⏸ Otomasyonu kapat' : '▶ Otomasyonu aç'}</button><button data-act="refresh">Yenile</button></div>
    <div class="note">Kapatınca zamanlanmış paylaşım durur; elle çalıştırma yine de yapılabilir.</div>
  </div>
  <div class="card"><h3>Gizli anahtarlar (GitHub)</h3>
    ${ISECRETS.map(([k, d]) => `<div class="sec"><span>${a.secrets.includes(k) ? '✅' : '⬜'} ${k}<br><small>${d}</small></span><span class="chip ${a.secrets.includes(k) ? 'ok' : ''}">${a.secrets.includes(k) ? 'ekli' : 'eksik'}</span></div>`).join('')}
    <div class="note ${a.secrets.includes('IG_ACCESS_TOKEN') ? '' : 'warn'}">${a.secrets.includes('IG_ACCESS_TOKEN') ? 'Instagram bağlantısı hazır görünüyor.' : 'Instagram anahtarları eksik: gerçek paylaşım için gerekli. Deneme (dry-run) bunlarsız çalışır.'}</div>
  </div>
  <div class="card"><h3>Şimdi çalıştır</h3>
    <div class="row2"><label style="margin:0"><input type="radio" name="amode" value="popular" checked> Popüler proje</label><label style="margin:0"><input type="radio" name="amode" value="rising"> Yükselen (yeni) proje</label></div>
    <div class="row2"><label class="chk" style="margin:0"><input type="checkbox" id="aDry" checked> Deneme: sadece slayt üret, Instagram'a paylaşma</label></div>
    <div class="row2"><button data-act="run" class="primary">▶ Çalıştır</button></div>
    <div class="note">Kuyrukta bekleyen post varsa o kullanılır; yoksa bot yeni proje seçer. Deneme çıktısını aşağıdaki "Son çalıştırmalar" bölümünden indirip görebilirsin.</div>
  </div>
  <div class="card"><h3>Ayarlar</h3><div class="set">
    <label>Popüler: en az yıldız<input id="sMin" type="number" value="${val('minStars', 10000)}"></label>
    <label>Kuyruk (en az bekleyen post)<input id="sQueue" type="number" value="${val('minQueue', 1)}"></label>
    <label>Yükselen: en az yıldız<input id="sRMin" type="number" value="${val('risingMinStars', 50)}"></label>
    <label>Yükselen: en çok yıldız<input id="sRMax" type="number" value="${val('risingMaxStars', 2000)}"></label>
    <label>Yükselen: son kaç gün<input id="sRDays" type="number" value="${val('risingDays', 60)}"></label>
    <label>Konular (virgülle, boşsa hepsi)<input id="sTopics" value="${Slides.esc((val('topics', []) || []).join(', '))}"></label>
    <label class="full">Kendi seçtiklerim (sahip/repo, her satır bir tane; bot önce bunları paylaşır)<textarea id="sRepos" rows="3">${Slides.esc((val('repos', []) || []).join('\n'))}</textarea></label>
    <label class="full chk"><input type="checkbox" id="sEn" ${acc('en').enabled ? 'checked' : ''}> İngilizce hesap da etkin (her proje için İngilizce post üret ve paylaş)</label>
    <div class="note full">Sayfa adı ve kullanıcı adı şablon resimlerinin içinde yazılıdır; değiştirmek için şablon resimleri yenilenmelidir.</div>
    <div class="note full ${a.plates && a.plates.en ? '' : 'warn'}">${a.plates && a.plates.en ? 'İngilizce şablon resimleri hazır.' : 'İngilizce şablon resimleri (template/rv/en) henüz yok: bot İngilizce postu şimdilik atlar.'}</div>
  </div>
  <div class="row2" style="margin-top:12px"><button data-act="push" class="primary">💾 Kaydet ve GitHub'a gönder</button><button data-act="pull">GitHub'dan al</button></div>
  <div class="note">${a.git.dirty.length ? `<span class="warn">${a.git.dirty.length} yerel değişiklik GitHub'a gönderilmedi.</span>` : 'Yerel dosyalar GitHub ile aynı.'} ${a.git.behind ? `<span class="warn">GitHub'da ${a.git.behind} yeni commit var (bot yayınlamış olabilir): "GitHub'dan al".</span>` : ''}<br>Ayarlar ancak GitHub'a gönderilince bot tarafından kullanılır.</div>
  </div>
  <div class="card wide"><h3>Son çalıştırmalar</h3>
    <table class="runs">${a.runs.map((r) => `<tr><td>${fmt(r.createdAt)}</td><td>${r.event === 'schedule' ? 'Zamanlı' : 'Elle'}</td><td>${statusChip(r)}</td><td style="text-align:right">
      ${r.status !== 'completed' ? `<button data-act="cancel" data-id="${r.databaseId}">İptal</button>` : r.conclusion === 'success' ? `<button data-act="dl" data-id="${r.databaseId}">Çıktıyı indir / göster</button>` : ''}
      <button data-act="web" data-url="${r.url}">GitHub'da aç</button></td></tr>`).join('') || '<tr><td>Henüz çalıştırma yok.</td></tr>'}</table>
    ${autoFiles ? `<div class="row2" style="margin-top:12px"><b>Çalışma ${autoRun}</b>${autoFiles.length ? '' : '<span class="note">Bu çalışmada görsel çıktı yok (deneme değildi ya da paylaşıldı).</span>'}<button data-act="folder">📁 Klasörde aç</button></div><div class="gal">${autoFiles.map((f) => `<img src="/runfile/${autoRun}/${f}" data-act="zoom" data-src="/runfile/${autoRun}/${f}">`).join('')}</div>` : ''}
  </div></div>`;
}

async function refreshAuto(quiet) {
  try { autoInfo = await api('/api/auto/status'); } catch (e) { if (!quiet) toast('Durum alınamadı'); return; }
  if (!$('autoView').hidden && !document.activeElement.closest('#autoView input, #autoView textarea')) renderAuto();
}
function openAuto() { $('autoView').hidden = false; renderAuto(); refreshAuto(); clearInterval(autoT); autoT = setInterval(() => refreshAuto(true), 8000); }

function readSettings() {
  const n = (id, d) => { const x = parseInt($(id).value, 10); return Number.isFinite(x) ? x : d; };
  data.minStars = n('sMin', 10000); data.minQueue = n('sQueue', 1); data.risingMinStars = n('sRMin', 50); data.risingMaxStars = n('sRMax', 2000); data.risingDays = n('sRDays', 60);
  data.topics = $('sTopics').value.split(',').map((t) => t.trim()).filter(Boolean);
  data.repos = $('sRepos').value.split('\n').map((t) => t.trim()).filter(Boolean);
  const tr = accOf('tr'), en = accOf('en');
  en.enabled = $('sEn').checked;
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b || !$('autoView').contains(b)) return;
  const act = b.dataset.act, id = b.dataset.id;
  const busy = async (fn) => { b.disabled = true; try { await fn(); } finally { b.disabled = false; } };
  if (act === 'refresh') return refreshAuto();
  if (act === 'web') return window.open(b.dataset.url, '_blank');
  if (act === 'zoom') return window.open(b.dataset.src, '_blank');
  if (act === 'folder') return api('/api/auto/open', { id: autoRun });
  if (act === 'toggle') return busy(async () => { const r = await api('/api/auto/toggle', { enable: autoInfo.workflow !== 'active' }); toast(r.ok ? 'Tamam' : 'Hata: ' + r.msg); await refreshAuto(); });
  if (act === 'cancel') return busy(async () => { const r = await api('/api/auto/cancel', { id }); toast(r.ok ? 'İptal istendi' : 'Hata: ' + r.msg); await refreshAuto(); });
  if (act === 'run') return busy(async () => {
    const dry = $('aDry').checked, mode = document.querySelector('input[name=amode]:checked').value;
    if (!dry && !confirm('Bu GERÇEK paylaşım yapar (Instagram\'a gönderir). Devam edilsin mi?')) return;
    const r = await api('/api/auto/run', { dry_run: dry, mode }); toast(r.ok ? (dry ? 'Deneme başladı' : 'Paylaşım başladı') : 'Hata: ' + r.msg);
    setTimeout(refreshAuto, 4000);
  });
  if (act === 'dl') return busy(async () => { toast('İndiriliyor…'); const r = await api('/api/auto/download', { id }); if (!r.ok) return toast('Hata: ' + r.msg); autoRun = id; autoFiles = r.files; renderAuto(); });
  if (act === 'pull') return busy(async () => { toast('Alınıyor…'); const r = await api('/api/auto/pull', {}); toast(r.ok ? 'GitHub ile eşitlendi' : 'Hata: ' + r.msg); if (r.ok) data = await api('/api/posts'); await refreshAuto(); renderAuto(); });
  if (act === 'push') return busy(async () => {
    readSettings(); await fetch('/api/posts', { method: 'POST', body: JSON.stringify(data) });
    toast('Gönderiliyor…'); const r = await api('/api/auto/push', {}); toast(r.ok ? 'GitHub\'a gönderildi' : 'Hata: ' + r.msg); await refreshAuto(); renderAuto();
  });
});
