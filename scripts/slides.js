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

  const api = { esc, builders, fill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Slides = api;
})(this);
