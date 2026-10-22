// Kuyrukta yayınlanmamış post kalmadıysa GitHub'dan yeni bir proje seçip otomatik post üretir.
// Kaynak sırası: 1) posts.json "repos" listesi  2) GitHub aramasından popüler/güncel projeler.
const { loadPosts, savePosts, fail } = require('./common');
const { postFromRepo, THEME_IDS } = require('./slides');

const token = process.env.GITHUB_TOKEN;
const headers = { 'User-Agent': 'ig-carousel-bot', Accept: 'application/vnd.github+json', ...(token && { Authorization: `Bearer ${token}` }) };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function gh(path, accept) {
  const r = await fetch(`https://api.github.com${path}`, { headers: accept ? { ...headers, Accept: accept } : headers });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${path}`);
  return accept ? r.text() : r.json();
}

async function findRepo(data, used) {
  const own = (data.repos || []).filter((r) => !used.has(r.toLowerCase()));
  if (own.length) return gh(`/repos/${own[0]}`);

  const topic = data.topics && data.topics.length ? `topic:${pick(data.topics)} ` : '';
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const q = encodeURIComponent(`${topic}stars:>${data.minStars || 10000} pushed:>${since} archived:false`);
  const { items } = await gh(`/search/repositories?q=${q}&sort=stars&order=desc&per_page=100`);
  // paylaşılmamış, açıklamalı ve lisanslı projeler arasından en yüksek yıldızlı 15 tanesinden biri
  const fresh = (items || []).filter((g) => g.description && g.license && !used.has(g.full_name.toLowerCase())).slice(0, 15);
  if (!fresh.length) throw new Error('Uygun yeni proje bulunamadı (minStars değerini düşür).');
  return pick(fresh);
}

(async () => {
  const data = loadPosts();
  const pending = data.posts.filter((p) => !p.published && !p.draft).length;
  if (pending >= (data.minQueue || 1) && !process.env.FORCE) {
    console.log(`Kuyrukta ${pending} yayınlanmamış post var, yeni üretilmedi.`);
    return;
  }
  const used = new Set(data.posts.map((p) => (p.source || '').toLowerCase()).filter(Boolean));
  const g = await findRepo(data, used);

  let readme = '';
  try { readme = await gh(`/repos/${g.full_name}/readme`, 'application/vnd.github.raw+json'); } catch (_) { /* README yoksa klon adımına düşer */ }

  let id = g.name.toLowerCase().replace(/[^\w.-]/g, '-');
  for (let n = 2; data.posts.some((p) => p.id === id); n++) id = `${g.name.toLowerCase()}-${n}`;
  const post = postFromRepo(g, id, readme, pick(THEME_IDS));
  data.posts.push(post);
  savePosts(data);
  console.log(`✔ Yeni post üretildi: ${post.id} (${g.full_name}, ${post.slides.length} slayt)`);
})().catch((e) => fail(e.message));
