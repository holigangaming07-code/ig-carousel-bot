// Slayt HTML üreticisi. Hem render.js (Node) hem Studio arayüzü (tarayıcı) bunu kullanır.
(function (root) {
  const esc = (s = '') =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const codeBlock = (code = '') => {
    const longest = Math.max(1, ...String(code).split(String.fromCharCode(10)).map((l) => l.length));
    const size = Math.max(28, Math.min(46, Math.floor(790 / (longest * 0.6))));
    return `<pre class="code" style="font-size:${size}px">${esc(code)}</pre>`;
  };

  const builders = {
    cover: (s) => `
    <div class="badge">${esc(s.badge || 'GitHub Projesi')}</div>
    ${s.icon ? `<div class="icon-circle">${esc(s.icon)}</div>` : ''}
    <h1>${esc(s.title)}</h1>
    <p class="sub">${esc(s.subtitle)}</p>
    <div class="swipe">Kaydır →</div>`,
    step: (s) => `
    <div class="num">${esc(s.number)}</div>
    <h2>${esc(s.title)}</h2>
    ${codeBlock(s.code)}
    ${s.text ? `<p>${esc(s.text)}</p>` : ''}`,
    code: (s) => `
    <h2>${esc(s.title)}</h2>
    ${codeBlock(s.code)}
    ${s.text ? `<p>${esc(s.text)}</p>` : ''}`,
    tip: (s) => `
    <div class="icon">💡</div>
    <h2>${esc(s.title)}</h2>
    <p>${esc(s.text)}</p>`,
    list: (s) => `
    <h2>${esc(s.title)}</h2>
    <ul>${(s.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`,
    cta: (s) => `
    <h2>${esc(s.title)}</h2>
    <p>${esc(s.text)}</p>`,
    stat: (s) => `
    <div class="bignum" style="font-size:${Math.min(260, Math.floor(880 / (String(s.value).length * 0.62)))}px">${esc(s.value)}</div>
    <h2>${esc(s.title)}</h2>
    ${s.text ? `<p>${esc(s.text)}</p>` : ''}`,
    explain: (s) => `
    <div class="kicker">${esc(s.kicker || 'Ne işe yarar?')}</div>
    <div class="icon-circle">${esc(s.icon || '💡')}</div>
    <div class="bigtext" style="font-size:${String(s.text || '').length > 180 ? 50 : 58}px">${esc(s.text)}</div>`,
    cards: (s) => `
    <h2>${esc(s.title)}</h2>
    <div class="cards">${(s.items || []).map((i) => {
      const m = String(i).match(/^(\S+)\s+([\s\S]*)$/);
      const hasIcon = m && /[^\x00-\x7F]/.test(m[1]);
      return `<div class="card"><span class="ci">${esc(hasIcon ? m[1] : '✦')}</span><span>${esc(hasIcon ? m[2] : i)}</span></div>`;
    }).join('')}</div>`,
    quote: (s) => `
    <div class="qmark">“</div>
    <blockquote>${esc(s.text)}</blockquote>
    ${s.author ? `<p class="author">— ${esc(s.author)}</p>` : ''}`,
  };


  // ---- Repo Rehberi şablonu: hazır arka plan resimleri (template/rv) + üstüne yazılan metin ----
  let LAYOUT = null;
  let BG = (n) => `../template/rv/${n}.jpg`;
  if (typeof module !== 'undefined' && module.exports) { try { LAYOUT = require('../template/rv/layout.json'); } catch (e) { /* layout yoksa rv slaytları çizilemez */ } }
  const arr = (a) => (Array.isArray(a) ? a : []);
  const stepText = (t) => String((t && t.text) || t || '').replace(/^[\s\u20E3\uFE0F0-9.)\-]+(?=\S)/u, '');
  // yıldız seviyesine göre arka plan tonu (0-999 gri, 1K yeşil, 10K mavi (özgün), 50K mor, 100K+ altın)
  const TONES = ['saturate(.12) brightness(1.12)', 'hue-rotate(-105deg) saturate(1.05)', 'none', 'hue-rotate(38deg)', 'hue-rotate(160deg) saturate(1.3)'];
  const CY = '#43d9ff';

  // kutuya sığan en büyük yazı boyutu (sözcük sarmalı tahmini)
  function linesFor(text, w, fs, cw) {
    let lines = 1, cur = 0;
    for (const wd of String(text).split(/\s+/)) {
      const ww = wd.length * cw * fs, sp = cur ? 0.28 * fs : 0;
      if (cur + sp + ww <= w) cur += sp + ww;
      else { lines += cur ? 1 : 0; cur = ww; if (ww > w) lines += Math.floor(ww / w); }
    }
    return lines;
  }
  const cwOf = (f) => (f.mono ? 0.62 : f.up ? 0.74 : f.fw >= 800 ? 0.6 : f.fw >= 700 ? 0.575 : 0.55);
  function fit1(text, f) {
    for (let fs = f.fs; fs >= f.mn; fs--) if (linesFor(text, f.w, fs, cwOf(f)) * f.lh * fs <= f.h + 1) return fs;
    return f.mn;
  }
  function fit2(a, b, f) {
    for (let fs = f.fs; fs >= f.mn; fs--) {
      const h = linesFor(a, f.w, fs, cwOf(f)) * f.lh * fs + linesFor(b || '', f.w, fs * 0.74, 0.55) * 1.2 * fs * 0.74;
      if (h <= f.h + 1) return fs;
    }
    return f.mn;
  }

  function plate(name, d, c, draw) {
    const L = LAYOUT && LAYOUT.slides[name];
    if (!L) throw new Error('rv yerleşimi yüklenmedi');
    const out = [];
    const base = (f, fs, inner, extra) => `<div class="fx${f.grad ? ' grad' : ''}${f.nw ? ' nw' : ''}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;font-size:${fs}px;color:${f.c};font-weight:${f.fw};text-align:${f.al};line-height:${f.lh};${f.mono ? "font-family:Consolas,'DejaVu Sans Mono',monospace;" : ''}${f.up ? 'text-transform:uppercase;letter-spacing:.5px;' : ''}${f.rot ? `transform:rotate(${f.rot}deg);` : ''}${extra || ''}"><div>${inner}</div></div>`;
    // tek parça metin
    const T = (k, text) => { const f = L.f[k]; if (f && text != null && text !== '') out.push(base(f.up ? Object.assign({ nw: 1 }, f) : f, fit1(text, f), esc(text))); };
    // başlık + açıklama (iki renk)
    const T2 = (k, a, b) => { const f = L.f[k]; if (!f || !a) return; const fs = fit2(a, b, f); out.push(base(f, fs, `<b style="display:block">${esc(a)}</b>${b ? `<span style="display:block;font-weight:500;font-size:.74em;line-height:1.2;color:${f.c2 || '#b9c6e6'}">${esc(b)}</span>` : ''}`)); };
    // renkli iki parçalı tek satır (ör. sayı + etiket)
    const R = (k, parts, size, sub) => { const f = Object.assign({ nw: 1 }, L.f[k]); if (!L.f[k]) return; const len = parts.reduce((n, p) => n + String(p[0]).length, 0); const fs = size || Math.max(f.mn, Math.min(f.fs, Math.floor(f.w / (len * 0.6)))); out.push(base(f, fs, parts.map((p) => `<span style="color:${p[1] || f.c}">${esc(p[0])}</span>`).join('') + (sub ? `<div style="font-size:${Math.round(fs * 0.58)}px;font-weight:500;color:#cfd8ee">${esc(sub)}</div>` : ''))); };
    draw({ T, T2, R, L, cats: () => arr(d.categories).slice(0, 5).forEach((t, i) => T(`cat${i}`, t)) });
    const tier = Math.max(0, Math.min(4, Number.isInteger(d.tier) ? d.tier : 2));
    const r = L.legend[tier];
    const glow = r ? `<div class="lg" style="left:${r[0] - 3}px;top:${r[1] - 3}px;width:${r[2] + 6}px;height:${r[3] + 6}px"></div>` : '';
    return `<div class="rvs" style="filter:${TONES[tier]}"><div class="rvbg" style="background-image:url('${BG(L.bg)}')"></div>${out.join('')}${glow}</div>`;
  }

  const rv = {
    rvCover: (s, c) => plate('rvCover', s, c, ({ T, R, cats }) => {
      T('title', s.title); T('tagline', s.tagline);
      const f = LAYOUT.slides.rvCover.f.stars, n = String(s.stars), fs = Math.max(26, Math.min(44, Math.floor(215 / (n.length * 0.62))));
      R('stars', [[n, CY], [' YILDIZ', '#fff']], fs, s.date);
      R('forks', [[String(s.forks), '#d58bff'], [' FORK', '#fff']]);
      R('repoHead', [[s.owner || '', CY], [' / ', '#9fb0d0'], [s.repo || '', '#fff']]);
      T('promise', s.promise); cats();
    }),
    rvExplain: (s) => plate('rvExplain', s, null, ({ T, T2 }) => {
      T('summary', s.summary); T('ctitle', s.cardTitle || 'Ne sunuyor?'); T('desc', s.description);
      arr(s.features).slice(0, 4).forEach((x, i) => T2(`feat${i}`, x.title, x.text));
      if (s.extra) T2('extra', s.extra.title, s.extra.text);
    }),
    rvAudience: (s) => plate('rvAudience', s, null, ({ T, T2, cats }) => {
      T('sub', s.intro); T('bottom', s.bottom);
      arr(s.audience).slice(0, 4).forEach((a, i) => { T2(`a${i}h`, a.name, a.text); arr(a.needs).slice(0, 3).forEach((n, j) => T(`a${i}r${j}`, n)); });
      cats();
    }),
    rvSetup: (s) => plate('rvSetup', s, null, ({ T, cats }) => {
      T('sub', s.intro); T('bottom', s.bottom);
      arr(s.steps).slice(0, 3).forEach((t, i) => T(`st${i}`, stepText(t)));
      arr(s.notes).slice(0, 3).forEach((n, i) => T(`n${i}`, n));
      cats();
    }),
    rvSections: (s) => plate('rvSections', s, null, ({ T, T2, cats }) => {
      T('sub', s.intro); T('bottom', s.bottom); T('note', s.note);
      arr(s.sections).slice(0, 3).forEach((x, i) => { T2(`s${i}h`, `${x.icon || ''} ${x.name}`.trim(), x.text); arr(x.items).slice(0, 4).forEach((t, j) => T(`s${i}i${j}`, t)); });
      cats();
    }),
    rvUsage: (s) => plate('rvUsage', s, null, ({ T, cats }) => {
      T('sub', s.intro); T('url', s.link); T('exT', 'Arama örnekleri');
      T('pageTitle', s.pageTitle || s.repo || ''); T('input', s.input || arr(s.examples)[0] || '');
      arr(s.steps).slice(0, 3).forEach((t, i) => T(`st${i}`, stepText(t)));
      arr(s.examples).slice(0, 4).forEach((e, j) => T(`ex${j}`, e));
      arr(s.results).slice(0, 4).forEach((r, i) => { T(`res${i}t`, r.title); T(`res${i}d`, r.text); arr(r.tags).slice(0, 3).forEach((g, k) => T(`res${i}g${k}`, g)); });
      cats();
    }),
    rvDownload: (s) => plate('rvDownload', s, null, ({ T }) => {
      T('sub', s.intro); T('cmd', s.command);
      arr(s.advantages).slice(0, 3).forEach((a, i) => { T(`adv${i}t`, a.title); T(`adv${i}b`, a.text); });
      if (s.alt) { T('altT', s.alt.title); T('altB', s.alt.text); }
      if (s.note) { T('noteT', s.noteTitle || 'Önemli not'); T('noteB', s.note); }
    }),
    rvFinal: (s, c) => plate('rvFinal', s, c, ({ T, R, cats }) => {
      T('sub', s.intro);
      arr(s.rows).slice(0, 5).forEach((r, i) => T(`val${i}`, r.v));
      R('repoHead', [[s.owner || '', CY], [' / ', '#9fb0d0'], [s.repo || '', '#fff']]);
      cats();
    }),
  };
  Object.assign(builders, rv);


  // slide.html şablonunu doldurup tam HTML döndürür
  function fill(tpl, css, slide, index, total, theme, brand) {
    brand = Object.assign({ name: 'Repo Rehberi', handle: '@reporehberi', tag: 'GitHub Rehberi' }, brand || {});
    const dots = Array.from({ length: total }, (_, i) => `<i class="${i === index ? 'on' : ''}"></i>`).join('');
    const build = builders[slide.type];
    if (!build) throw new Error(`Bilinmeyen slayt tipi "${slide.type}". Geçerli: ${Object.keys(builders).join(', ')}`);
    return tpl
      .replace('{{CSS}}', () => css)
      .replace('{{TYPE}}', slide.type + (slide.type.startsWith('rv') ? ' rv' : ''))
      .replace('{{THEME}}', theme ? `theme-${theme}` : '')
      .replace('{{BODY}}', () => build(slide, { brand, index, total }))
      .replace('{{BRAND}}', () => esc(brand.name))
      .replace('{{INITIAL}}', () => esc(Array.from(brand.name)[0] || 'R'))
      .replace('{{TAG}}', () => esc(brand.tag))
      .replace('{{HANDLE}}', () => esc(brand.handle))
      .replace('{{DOTS}}', dots)
      .replace('{{COUNTER}}', `${index + 1}/${total}`);
  }

  const THEME_IDS = ['', 'sunset', 'neon', 'forest', 'paper', 'steel', 'rising', 'blue', 'violet', 'gold'];

  // yıldız aralığına göre renk tonu: 0-999 gri, 1K-9.9K yeşil, 10K-49.9K mavi, 50K-99.9K mor, 100K+ altın
  const TIERS = [
    { max: 1000, theme: 'steel' },
    { max: 10000, theme: 'rising' },
    { max: 50000, theme: 'blue' },
    { max: 100000, theme: 'violet' },
    { max: Infinity, theme: 'gold' },
  ];
  const tierFor = (stars) => TIERS.find((t) => stars < t.max);
  const INSTALL_RE = /^(npm (i|install)|npx|yarn add|pnpm (add|dlx)|pip3? install|pipx install|cargo install|brew install|go install|docker run|curl .*\| ?(ba)?sh)\b/;

  // README metninden kurulum komutlarını (kod bloklarından) ayıklar
  function installCommands(readme = '') {
    const out = [];
    for (const block of readme.match(/```[^\n]*\n[\s\S]*?```/g) || []) {
      for (let l of block.split('\n').slice(1, -1)) {
        l = l.replace(/^\$\s*/, '').trim();
        if (INSTALL_RE.test(l) && l.length <= 80 && !out.includes(l)) out.push(l);
      }
    }
    return out.slice(0, 2);
  }

  // :books: gibi emoji kodları, görsel/link sözdizimi ve çıplak URL'leri temizler
  const clean = (t = '') => String(t).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\]\(\S*/g, '').replace(/https?:\/\/\S+/g, '').replace(/:[a-z0-9_+-]+:/gi, '').replace(/<[^>]+>/g, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

  // README'nin ilk anlamlı paragrafı (yapay zeka özeti yoksa "ne yapar" slaytı için)
  function firstParagraph(readme = '') {
    for (const block of readme.split(/\r?\n\r?\n/)) {
      if (/^\s*[#|>\-*`]/.test(block) || /^\s*!?\[/.test(block)) continue;
      const t = clean(block);
      if (t.length >= 50 && /[.!?…]$/.test(t) && !/[\[\]]/.test(t)) return t.length > 220 ? t.slice(0, 217).replace(/\s+\S*$/, '') + '…' : t;
    }
    return '';
  }

  // ai: yapay zekanın Türkçe özeti (opsiyonel). Yoksa README/GitHub verisinden sade bir carousel üretilir.
  // GitHub API'nin repo nesnesinden (+ README'den) hazır carousel postu üretir
  function postFromRepo(g, id, readme, theme, ai) {
    ai = ai || {};
    const tier = TIERS.findIndex((t) => g.stargazers_count < t.max);
    const nf = (n) => Number(n || 0).toLocaleString('tr-TR');
    const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const tags = ['#github', '#opensource', ...(g.topics || []).slice(0, 5).map((t) => '#' + t.replace(/-/g, ''))].join(' ');
    const desc = clean(g.description);
    const base = { tier, owner: g.owner && g.owner.login ? g.owner.login : g.full_name.split('/')[0], repo: g.name, categories: ai.categories };
    const feats = [
      { icon: '⚙️', title: g.language ? `${g.language} ile yazıldı` : 'Açık kaynak', text: '' },
      g.license && g.license.spdx_id && g.license.spdx_id !== 'NOASSERTION' ? { icon: '📜', title: `${g.license.spdx_id} lisanslı`, text: '' } : null,
      { icon: '🍴', title: `${nf(g.forks_count)} kez fork edildi`, text: '' },
      g.pushed_at ? { icon: '🕒', title: `Son güncelleme: ${g.pushed_at.slice(0, 10)}`, text: '' } : null,
    ].filter(Boolean);
    const cmds = installCommands(readme);
    const cover = { type: 'rvCover', ...base, title: g.name, tagline: ai.tagline || desc, stars: nf(g.stargazers_count), date, forks: nf(g.forks_count), promise: ai.promise || desc };
    const slides = arr(ai.features).length
      ? [
        cover,
        { type: 'rvExplain', ...base, summary: ai.summary, description: ai.description, features: ai.features, extra: ai.extra },
        { type: 'rvAudience', ...base, intro: ai.audience_intro, audience: ai.audience, bottom: ai.audience_bottom },
        { type: 'rvSetup', ...base, intro: ai.setup_intro, steps: ai.setup_steps, notes: ai.setup_notes, bottom: ai.setup_bottom },
        { type: 'rvSections', ...base, title: ai.sections_title, intro: ai.sections_intro, sections: ai.sections, note: ai.sections_note, bottom: ai.sections_bottom },
        { type: 'rvUsage', ...base, intro: ai.usage_intro, steps: ai.usage_steps, link: ai.usage_link, examples: ai.usage_examples, pageTitle: ai.usage_title || g.name, input: ai.usage_input, results: ai.usage_results },
        { type: 'rvDownload', ...base, intro: ai.download_intro, command: ai.download_command || cmds[0] || `git clone ${g.html_url}`, advantages: ai.download_advantages, alt: ai.download_alt, note: ai.download_note },
        { type: 'rvFinal', ...base, intro: ai.final_intro, rows: [
          { icon: '💻', k: 'Proje:', v: g.name }, { icon: '⭐', k: 'Yıldız:', v: nf(g.stargazers_count) },
          { icon: '🎯', k: 'Amaç:', v: ai.final_purpose }, { icon: '⚙️', k: 'Kurulum:', v: ai.final_install }, { icon: '📝', k: 'Ekstra:', v: ai.final_extra }] },
      ]
      : [
        cover,
        { type: 'rvExplain', ...base, summary: desc, description: firstParagraph(readme) || desc || g.name, features: feats },
        { type: 'rvDownload', ...base, intro: 'Projeyi kendi bilgisayarında denemek istersen.', command: cmds[0] || `git clone ${g.html_url}`, note: cmds[1] ? `Sonra: ${cmds[1]}` : "Detaylar için README'ye bak." },
        { type: 'rvFinal', ...base, rows: [{ icon: '💻', k: 'Proje:', v: g.name }, { icon: '⭐', k: 'Yıldız:', v: nf(g.stargazers_count) }, { icon: '🍴', k: 'Fork:', v: nf(g.forks_count) }, { icon: '🔗', k: 'Adres:', v: `github.com/${g.full_name}` }] },
      ];
    return {
      id, published: false, theme: theme === undefined ? TIERS[tier].theme : theme, source: g.full_name,
      caption: `${ai.hook || `${g.name} — ${desc || 'harika bir açık kaynak proje'}`} 🚀\n\n${ai.summary || ''}${ai.summary ? '\n\n' : ''}Kaydır ve detayları gör.\n\n${g.html_url}\n\n${tags}`,
      slides,
    };
  }

  const api = { esc, builders, fill, installCommands, postFromRepo, THEME_IDS, tierFor, setLayout: (l) => { LAYOUT = l; }, setBg: (fn) => { BG = fn; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Slides = api;
})(this);
