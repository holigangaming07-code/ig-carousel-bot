// Render edilmiş postu Instagram Graph API ile carousel olarak yayınlar.
const { loadPosts, savePosts, pickPost, fail } = require('./common');

const API = 'https://graph.facebook.com/v21.0';
const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, p, params = {}) {
  const url = new URL(`${API}/${p}`);
  const body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  let res;
  if (method === 'GET') {
    body.forEach((v, k) => url.searchParams.set(k, v));
    res = await fetch(url);
  } else {
    res = await fetch(url, { method: 'POST', body });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(`Graph API (${p}): ${json.error ? json.error.message : 'HTTP ' + res.status}`);
  }
  return json;
}

async function waitForUrl(url, tries = 12, delayMs = 10000) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok && (r.headers.get('content-type') || '').startsWith('image/')) return;
      console.log(`  URL henüz hazır değil (${r.status}), bekleniyor... (${i}/${tries})`);
    } catch (e) {
      console.log(`  URL erişim hatası: ${e.message} (${i}/${tries})`);
    }
    await sleep(delayMs);
  }
  fail(`Görsel URL'ine erişilemiyor: ${url}\nRepo public mu ve dosya push edildi mi kontrol et.`);
}

async function waitContainer(id, tries = 30, delayMs = 5000) {
  for (let i = 1; i <= tries; i++) {
    const { status_code } = await api('GET', id, { fields: 'status_code' });
    console.log(`  container durumu: ${status_code}`);
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') fail(`Container ${status_code} durumuna düştü.`);
    await sleep(delayMs);
  }
  fail('Container zaman aşımına uğradı.');
}

(async () => {
  const data = loadPosts();
  const post = pickPost(data);
  if (!post) return console.log('Yayınlanacak yeni post yok.');

  if (process.env.DRY_RUN === 'true') return console.log(`DRY_RUN: "${post.id}" yayınlanmadı.`);
  if (!IG_USER_ID || !IG_ACCESS_TOKEN) fail('IG_USER_ID ve IG_ACCESS_TOKEN ortam değişkenleri tanımlı olmalı (GitHub Secrets).');

  const repo = process.env.GITHUB_REPOSITORY || data.repo;
  const branch = process.env.BRANCH || data.branch || 'main';
  const urls = post.slides.map((_, i) => `https://raw.githubusercontent.com/${repo}/${branch}/output/${post.id}/slide-${i + 1}.jpg`);

  console.log('Görsel URL\'leri doğrulanıyor...');
  for (const u of urls) await waitForUrl(u);

  console.log('Slayt container\'ları oluşturuluyor...');
  const children = [];
  for (const u of urls) {
    const { id } = await api('POST', `${IG_USER_ID}/media`, { image_url: u, is_carousel_item: 'true' });
    children.push(id);
    console.log(`  ✔ ${id}`);
  }
  for (const id of children) await waitContainer(id);

  console.log('Carousel container oluşturuluyor...');
  const { id: carouselId } = await api('POST', `${IG_USER_ID}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: post.caption || '',
  });
  await waitContainer(carouselId);

  console.log('Yayınlanıyor...');
  const { id: mediaId } = await api('POST', `${IG_USER_ID}/media_publish`, { creation_id: carouselId });
  console.log(`✔ Yayınlandı. Media ID: ${mediaId}`);

  post.published = true;
  post.mediaId = mediaId;
  post.publishedAt = new Date().toISOString();
  savePosts(data);
})().catch((e) => fail(e.message));
