// Yayınlanmamış tüm postları (her hesap/dil için) 1080x1350 JPEG slaytlara dönüştürür.
// (Instagram Graph API sadece JPEG kabul eder, bu yüzden PNG değil JPG üretilir.)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, loadPosts, pendingPosts, fail } = require('./common');
const { fill, setBg } = require('./slides');

(async () => {
  const data = loadPosts();
  const posts = pendingPosts(data);
  if (!posts.length) {
    console.log('Yayınlanacak yeni post yok.');
    return;
  }

  const css = fs.readFileSync(path.join(ROOT, 'template', 'theme.css'), 'utf8') + fs.readFileSync(path.join(ROOT, 'template', 'fonts.css'), 'utf8');
  const tpl = fs.readFileSync(path.join(ROOT, 'template', 'slide.html'), 'utf8');
  setBg((n, lang) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'template', 'rv', lang && lang !== 'tr' ? lang : '', `${n}.jpg`)).toString('base64'));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });

  for (const post of posts) {
    const outDir = path.join(ROOT, 'output', post.id);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    const acc = (data.accounts || []).find((a) => a.id === post.account);
    for (let i = 0; i < post.slides.length; i++) {
      const s = post.slides[i];
      let html;
      try { html = fill(tpl, css, s, i, post.slides.length, post.theme, acc && acc.brand); } catch (e) { fail(`${e.message} (post: ${post.id}, slayt ${i + 1})`); }
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const file = path.join(outDir, `slide-${i + 1}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      console.log(`✔ ${path.relative(ROOT, file)}`);
    }
    console.log(`Render tamam: ${post.id} (${post.slides.length} slayt)`);
  }
  await browser.close();
})().catch((e) => fail(e.message));
