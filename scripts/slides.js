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


  // ---- Repo Rehberi şablonu (rv*): örnek tasarımlara göre ----
  const LEVELS = [['0-999', '#9aa4b2'], ['1K-9.9K', '#34d399'], ['10K-49.9K', '#3b9bff'], ['50K-99.9K', '#a78bfa'], ['100K+', '#ffb02e']];
  const stepText = (t) => String(t.text || t).replace(/^[\s\u20E3\uFE0F0-9.)\-]+(?=\S)/u, '');
  const arr = (a) => (Array.isArray(a) ? a : []);
  const hdr = (ctx) => `<div class="rv-hdr"><span>📖</span>${esc(String((ctx.brand && ctx.brand.name) || 'Repo Rehberi').toUpperCase())}</div>`;
  const ttl = (t, sub, size) => `<div class="rv-title" style="font-size:${size || Math.max(62, Math.min(104, Math.floor(940 / (String(t).length * 0.58))))}px">${esc(t)}</div>${sub ? `<div class="rv-sub">${esc(sub)}</div>` : ''}`;
  const legend = (tier, strip) => `<div class="rv-legend${strip ? ' strip' : ''}"><div class="lt">⭐ YILDIZ SEVİYESİ</div>${LEVELS.map(([l, c], i) => `<div class="lv${i === tier ? ' on' : ''}" style="--c:${c}"><span>★</span>${l}</div>`).join('')}</div>`;
  const books = (cats) => `<div class="rv-books">${(arr(cats).length ? cats : ['Kod', 'Veri', 'Yapay Zeka', 'Güvenlik', 'Web']).slice(0, 5).map((c, i) => `<div class="bk b${i}">${esc(c)}</div>`).join('')}</div>`;
  const laptop = (owner, repo) => `<div class="rv-lap"><div class="bar"><i></i><i></i><i></i><span></span></div><div class="repo"><b>${esc(owner)}</b> / ${esc(repo)}<em>★ Star</em></div>${[0, 1, 2, 3, 4, 5].map((i) => `<div class="row"><u></u><s style="width:${40 + ((i * 37) % 45)}%"></s></div>`).join('')}</div>`;
  const banner = (icon, text) => (text ? `<div class="rv-banner"><span class="bi">${esc(icon)}</span><b>${esc(text)}</b><i>➜</i></div>` : '');
  const deco = (cats) => `<div class="rv-deco">${books(cats)}</div>`;
  const icard = (it, i, big) => `<div class="rv-card c${i % 4}"><span class="ci2">${esc(it.icon || '✦')}</span><div><b>${esc(it.title || it.name)}</b>${it.text ? `<p>${esc(it.text)}</p>` : ''}</div></div>`;

  const rv = {
    rvCover: (s, c) => `${hdr(c)}${ttl(s.title, s.tagline, Math.max(56, Math.min(118, Math.floor(920 / (String(s.title).length * 0.55)))))}
    <div class="rv-tiles"><div class="tile"><span class="ti">⭐</span><div><b>${esc(s.stars)}</b> YILDIZ<small>${esc(s.date)}</small></div></div><div class="tile f"><span class="ti"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="5" r="2.4"/><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="8" r="2.4"/><path d="M6 7.4v9.2M18 10.4c0 4-6 3-11 7"/></svg></span><div><b>${esc(s.forks)}</b> FORK</div></div></div>
    <div class="rv-mid">${legend(s.tier)}${laptop(s.owner, s.repo)}</div>${deco(s.categories)}${banner('📖', s.promise)}`,
    rvExplain: (s, c) => `${hdr(c)}${ttl(s.title || 'Bu repo ne işe yarıyor?', s.summary)}
    <div class="rv-card wide c0"><span class="ci2">📘</span><div><b>${esc(s.cardTitle || 'Ne sunuyor?')}</b><p>${esc(s.description)}</p></div></div>
    <div class="rv-grid">${arr(s.features).slice(0, 4).map((f, i) => icard(f, i)).join('')}</div>
    ${s.extra ? `<div class="rv-card wide c3"><span class="ci2">${esc(s.extra.icon || '📣')}</span><div><b>${esc(s.extra.title)}</b>${s.extra.text ? `<p>${esc(s.extra.text)}</p>` : ''}</div></div>` : ''}
    <div class="rv-deco">${legend(s.tier, true)}</div>`,
    rvAudience: (s, c) => `${hdr(c)}${ttl(s.title || 'Kimler için uygun?', s.intro)}
    <div class="rv-grid">${arr(s.audience).slice(0, 4).map((a, i) => `<div class="aud c${i % 4}"><div class="h"><span class="av">${esc(a.icon || '🙂')}</span><div><b>${esc(a.name)}</b><p>${esc(a.text)}</p></div></div>${arr(a.needs).slice(0, 3).map((n) => `<div class="nd">${esc(n)}</div>`).join('')}</div>`).join('')}</div>
    ${deco(s.categories)}${banner('📖', s.bottom)}`,
    rvSetup: (s, c) => `${hdr(c)}${ttl(s.title || 'Kurulum gerekiyor mu?', s.intro)}
    <div class="rv-steps">${arr(s.steps).slice(0, 3).map((t, i) => `<div class="st c${i}"><div class="n">${i + 1}</div><div class="e">${esc(t.icon || '')}</div>${esc(stepText(t))}</div>`).join('')}</div>
    <div class="rv-notes">${arr(s.notes).slice(0, 3).map((n, i) => `<div class="nt c${i}">${esc(n)}</div>`).join('')}</div>
    ${legend(s.tier, true)}${deco(s.categories)}${banner('💡', s.bottom)}`,
    rvSections: (s, c) => `${hdr(c)}${ttl(s.title || 'Neler var?', s.intro)}
    <div class="rv-cols">${arr(s.sections).slice(0, 3).map((x, i) => `<div class="col c${i}"><b>${esc(x.icon || '')} ${esc(x.name)}</b><p>${esc(x.text)}</p>${arr(x.items).slice(0, 4).map((t) => `<div class="it">${esc(t)}</div>`).join('')}</div>`).join('')}</div>
    ${s.note ? `<div class="rv-note">💡 ${esc(s.note)}</div>` : ''}${legend(s.tier, true)}${deco(s.categories)}${banner('📖', s.bottom)}`,
    rvUsage: (s, c) => `${hdr(c)}${ttl(s.title || 'Nasıl kullanılır?', s.intro)}
    <div class="rv-steps">${arr(s.steps).slice(0, 3).map((t, i) => `<div class="st c${i}"><div class="n">${i + 1}</div><div class="e">${esc(t.icon || '')}</div>${esc(stepText(t))}</div>`).join('')}</div>
    ${s.link ? `<div class="rv-url">🔗 ${esc(s.link)}</div>` : ''}
    <div class="rv-notes">${arr(s.examples).slice(0, 4).map((e, i) => `<div class="nt c${i}">🔎 ${esc(e)}</div>`).join('')}</div>${legend(s.tier, true)}${deco(s.categories)}${banner('📖', s.bottom)}`,
    rvDownload: (s, c) => `${hdr(c)}${ttl(s.title || 'İstersen bilgisayarına da indirebilirsin', s.intro)}
    <div class="rv-term"><span>$</span> ${esc(s.command)}</div>
    <div class="rv-steps">${arr(s.advantages).slice(0, 3).map((a, i) => `<div class="st c${i + 1}"><div class="e">${esc(a.icon || '')}</div><b>${esc(a.title)}</b><p>${esc(a.text || '')}</p></div>`).join('')}</div>
    ${s.alt ? `<div class="rv-card wide c1"><span class="ci2">📦</span><div><b>${esc(s.alt.title)}</b><p>${esc(s.alt.text)}</p></div></div>` : ''}
    <div class="rv-deco"></div>${banner('💡', s.note)}`,
    rvFinal: (s, c) => `${hdr(c)}${ttl(s.title || 'Kaydet, takip et, keşfet', s.intro)}
    <div class="rv-table">${arr(s.rows).slice(0, 5).map((r, i) => `<div class="tr c${i % 4}"><span class="k">${esc(r.icon || '')} ${esc(r.k)}</span><span class="v">${esc(r.v)}</span></div>`).join('')}</div>
    ${legend(s.tier, true)}${deco(s.categories)}
    <div class="rv-cta"><div class="c0">🔖 Bu gönderiyi <b>kaydet</b></div><div class="c1">✈️ Arkadaşına <b>gönder</b></div><div class="c2">👤 ${esc((c.brand && c.brand.name) || 'Repo Rehberi')}'ni <b>takip et</b></div></div>`,
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
        { type: 'rvUsage', ...base, intro: ai.usage_intro, steps: ai.usage_steps, link: ai.usage_link, examples: ai.usage_examples, bottom: ai.usage_bottom },
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

  const api = { esc, builders, fill, installCommands, postFromRepo, THEME_IDS, tierFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Slides = api;
})(this);
