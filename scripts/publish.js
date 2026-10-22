// Render edilmiş postları Instagram Graph API ile carousel olarak yayınlar.
// Her post kendi hesabının anahtarlarını kullanır:
//   tr -> IG_USER_ID / IG_ACCESS_TOKEN
//   en -> IG_USER_ID_EN / IG_ACCESS_TOKEN_EN (yoksa IG_ACCESS_TOKEN)
const { loadPosts, savePosts, pendingPosts, fail } = require('./common');

const API = 'https://graph.facebook.com/v21.0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function creds(account) {
  const id = (account || 'tr').toLowerCase();
  const sfx = id === 'tr' ? '' : `_${id.toUpperCase()}`;
  return {
    userId: process.env[`IG_USER_ID${sfx}`],
    token: process.env[`IG_ACCESS_TOKEN${sfx}`] || process.env.IG_ACCESS_TOKEN,
    names: `IG_USER_ID${sfx} ve IG_ACCESS_TOKEN${sfx}`,
  };
}

async function api(c, method, p, params = {}) {
  const url = new URL(`${API}/${p}`);
  const body = new URLSearchParams({ ...params, access_token: c.token });
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
  throw new Error(`Görsel URL'ine erişilemiyor: ${url}\nRepo public mu ve dosya push edildi mi kontrol et.`);
}

async function waitContainer(c, id, tries = 30, delayMs = 5000) {
  for (let i = 1; i <= tries; i++) {
    const { status_code } = await api(c, 'GET', id, { fields: 'status_code' });
    console.log(`  container durumu: ${status_code}`);
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Container ${status_code} durumuna düştü.`);
    await sleep(delayMs);
  }
  throw new Error('Container zaman aşımına uğradı.');
}

async function publish(data, post, c) {
  const repo = process.env.GITHUB_REPOSITORY || data.repo;
  const branch = process.env.BRANCH || data.branch || 'main';
  const urls = post.slides.map((_, i) => `https://raw.githubusercontent.com/${repo}/${branch}/output/${post.id}/slide-${i + 1}.jpg`);

  console.log("Görsel URL'leri doğrulanıyor...");
  for (const u of urls) await waitForUrl(u);

  console.log("Slayt container'ları oluşturuluyor...");
  const children = [];
  for (const u of urls) {
    const { id } = await api(c, 'POST', `${c.userId}/media`, { image_url: u, is_carousel_item: 'true' });
    children.push(id);
    console.log(`  ✔ ${id}`);
  }
  for (const id of children) await waitContainer(c, id);

  console.log('Carousel container oluşturuluyor...');
  const { id: carouselId } = await api(c, 'POST', `${c.userId}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: post.caption || '',
  });
  await waitContainer(c, carouselId);

  console.log('Yayınlanıyor...');
  const { id: mediaId } = await api(c, 'POST', `${c.userId}/media_publish`, { creation_id: carouselId });
  console.log(`✔ Yayınlandı (${post.account || 'tr'}). Media ID: ${mediaId}`);

  post.published = true;
  post.mediaId = mediaId;
  post.publishedAt = new Date().toISOString();
  savePosts(data);
}

(async () => {
  const data = loadPosts();
  const posts = pendingPosts(data);
  if (!posts.length) return console.log('Yayınlanacak yeni post yok.');
  if (process.env.DRY_RUN === 'true') return console.log(`DRY_RUN: ${posts.map((p) => p.id).join(', ')} yayınlanmadı.`);

  const errors = [];
  for (const post of posts) {
    const c = creds(post.account);
    console.log(`\n=== ${post.id} (${post.account || 'tr'}) ===`);
    if (!c.userId || !c.token) { errors.push(`${post.id}: ${c.names} tanımlı değil (GitHub Secrets).`); continue; }
    try {
      await publish(data, post, c);
    } catch (e) {
      errors.push(`${post.id}: ${e.message}`);
      // gerçek bir API hatası: 3 kez üst üste başarısız olan post kuyruğu kilitlemesin diye kenara alınır
      post.failCount = (post.failCount || 0) + 1;
      post.lastError = String(e.message).slice(0, 200);
      if (post.failCount >= 3) { post.failed = true; console.warn(`${post.id} 3 kez başarısız oldu, kuyruktan çıkarıldı (failed).`); }
      savePosts(data);
    }
  }
  if (errors.length) fail(errors.join('\n'));
})().catch((e) => fail(e.message));
