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

// ANTHROPIC_API_KEY varsa README'yi Türkçe özetletir; yoksa null döner (şablon README'nin ilk paragrafına düşer)
async function aiSummary(g, readme) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const prompt = `Aşağıdaki GitHub projesini Instagram carousel için Türkçe özetle. SADECE JSON döndür, başka metin yok:
{\"tagline\": \"projeyi anlatan kısa slogan, en fazla 70 karakter\", \"explain\": \"projenin ne işe yaradığını, kimin işine yaradığını sade Türkçe ile 2-3 cümlede anlat, en fazla 220 karakter\", \"icon\": \"projeyi temsil eden TEK emoji\", \"hook\": \"dikkat çekici tek cümlelik caption girişi\", \"features\": [\"emoji + kısa özellik, her biri en fazla 36 karakter, tam 4 adet\"]}

Proje: ${g.full_name}
Açıklama: ${g.description}
README:
${readme.slice(0, 6000)}`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const text = (await r.json()).content[0].text;
    const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    if (!j.explain || !Array.isArray(j.features)) throw new Error('eksik alan');
    return j;
  } catch (e) {
    console.warn(`Yapay zeka özeti alınamadı (${e.message}), README özeti kullanılacak.`);
    return null;
  }
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
  const post = postFromRepo(g, id, readme, pick(THEME_IDS), await aiSummary(g, readme));
  data.posts.push(post);
  savePosts(data);
  console.log(`✔ Yeni post üretildi: ${post.id} (${g.full_name}, ${post.slides.length} slayt)`);
})().catch((e) => fail(e.message));
