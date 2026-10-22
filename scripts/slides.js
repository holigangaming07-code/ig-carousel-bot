// Slayt HTML üreticisi. Hem render.js (Node) hem Studio arayüzü (tarayıcı) bunu kullanır.
(function (root) {
  const esc = (s = '') =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const codeBlock = (code = '') => {
    const longest = Math.max(0, ...String(code).split('\n').map((l) => l.length));
    return `<pre class="code${longest > 34 ? ' long' : ''}">${esc(code)}</pre>`;
  };

  const builders = {
    cover: (s) => `
    <div class="badge">${esc(s.badge || 'GitHub Projesi')}</div>
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
    <div class="bignum">${esc(s.value)}</div>
    <h2>${esc(s.title)}</h2>
    ${s.text ? `<p>${esc(s.text)}</p>` : ''}`,
    quote: (s) => `
    <div class="qmark">“</div>
    <blockquote>${esc(s.text)}</blockquote>
    ${s.author ? `<p class="author">— ${esc(s.author)}</p>` : ''}`,
  };

  // slide.html şablonunu doldurup tam HTML döndürür
  function fill(tpl, css, slide, index, total, theme) {
    const build = builders[slide.type];
    if (!build) throw new Error(`Bilinmeyen slayt tipi "${slide.type}". Geçerli: ${Object.keys(builders).join(', ')}`);
    return tpl
      .replace('{{CSS}}', () => css)
      .replace('{{TYPE}}', slide.type)
      .replace('{{THEME}}', theme ? `theme-${theme}` : '')
      .replace('{{BODY}}', () => build(slide))
      .replace('{{COUNTER}}', `${index + 1}/${total}`);
  }

  const THEME_IDS = ['', 'sunset', 'neon', 'forest', 'paper'];
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

  // GitHub API'nin repo nesnesinden (+ README'den) hazır carousel postu üretir
  function postFromRepo(g, id, readme, theme) {
    const stars = g.stargazers_count >= 1000 ? (g.stargazers_count / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(g.stargazers_count);
    const feats = [g.language && `${g.language} ile yazıldı`, g.license && g.license.spdx_id && g.license.spdx_id !== 'NOASSERTION' && `${g.license.spdx_id} lisanslı`, ...(g.topics || []).slice(0, 3).map((t) => '#' + t)].filter(Boolean);
    const tags = ['#github', '#opensource', ...(g.topics || []).slice(0, 5).map((t) => '#' + t.replace(/-/g, ''))].join(' ');
    const cmds = installCommands(readme);
    const steps = [
      { type: 'step', number: 1, title: cmds[0] ? 'Kur' : 'Klonla', code: cmds[0] || `git clone ${g.html_url}` },
      cmds[1]
        ? { type: 'step', number: 2, title: 'Çalıştır', code: cmds[1] }
        : { type: 'step', number: 2, title: 'İçine gir', code: `cd ${g.name}`, text: "Sonra README'deki kurulum komutunu çalıştır." },
    ];
    return {
      id, published: false, theme: theme === undefined ? 'neon' : theme, source: g.full_name,
      caption: `${g.name} — ${g.description || 'harika bir açık kaynak proje'} 🚀\n\nKaydır ve kurulumu gör.\n\n${g.html_url}\n\n${tags}`,
      slides: [
        { type: 'cover', title: g.name, subtitle: g.description || '' },
        { type: 'stat', value: stars, title: 'GitHub yıldızı', text: g.language || '' },
        { type: 'list', title: 'Öne çıkanlar', items: feats.length ? feats : ['Açık kaynak'] },
        ...steps,
        { type: 'cta', title: 'Yıldız ver ⭐', text: `github.com/${g.full_name}` },
      ],
    };
  }

  const api = { esc, builders, fill, installCommands, postFromRepo, THEME_IDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Slides = api;
})(this);
