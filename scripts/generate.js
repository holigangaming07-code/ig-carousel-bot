// Kuyrukta yayınlanmamış post kalmadıysa GitHub'dan yeni bir proje seçip otomatik post üretir.
// Kaynak sırası: 1) posts.json "repos" listesi  2) GitHub aramasından popüler/güncel projeler.
const { loadPosts, savePosts, fail } = require('./common');
const { postFromRepo } = require('./slides');

const token = process.env.GITHUB_TOKEN;
const headers = { 'User-Agent': 'ig-carousel-bot', Accept: 'application/vnd.github+json', ...(token && { Authorization: `Bearer ${token}` }) };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function gh(path, accept) {
  const r = await fetch(`https://api.github.com${path}`, { headers: accept ? { ...headers, Accept: accept } : headers });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${path}`);
  return accept ? r.text() : r.json();
}

// README'yi Türkçe özetletir. Sıra: ANTHROPIC_API_KEY, yoksa GitHub Models (GITHUB_TOKEN, ücretsiz). Hiçbiri olmazsa null.
async function llm(prompt) {
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}`);
    return (await r.json()).content[0].text;
  }
  if (!token) return null;
  const r = await fetch('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.GH_MODEL || 'openai/gpt-4.1-mini', max_tokens: 900, temperature: 0.4, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Yalnızca geçerli JSON nesnesi döndür.' }, { role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`GitHub Models ${r.status}`);
  return (await r.json()).choices[0].message.content;
}

async function aiSummary(g, readme) {
  const prompt = `Aşağıdaki GitHub projesini Instagram carousel için sade ve akıcı TÜRKÇE ile özetle. SADECE JSON döndür, başka metin yok:
{"tagline": "projeyi anlatan kısa slogan, en fazla 70 karakter", "explain": "projenin ne işe yaradığını, kimin işine yaradığını 2-3 cümlede anlat, en fazla 220 karakter", "icon": "projeyi temsil eden TEK emoji", "hook": "dikkat çekici tek cümlelik caption girişi", "features": ["emoji + kısa özellik, her biri en fazla 36 karakter, tam 4 adet"], "audience": ["emoji + kimler için uygun, her biri en fazla 36 karakter, tam 4 adet"]}

Proje: ${g.full_name}
Açıklama: ${g.description}
README:
${readme.slice(0, 6000)}`;
  try {
    const text = await llm(prompt);
    if (!text) return null;
    console.log(`Yapay zeka yanıtı: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
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

  const rising = process.env.MODE === 'rising';
  const topic = data.topics && data.topics.length ? `topic:${pick(data.topics)} ` : '';
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const born = new Date(Date.now() - (data.risingDays || 60) * 864e5).toISOString().slice(0, 10);
  // popular: çok yıldızlı projeler; rising: yeni çıkmış, yıldızı henüz az ama yükselen projeler
  const q = encodeURIComponent(rising
    ? `${topic}stars:${data.risingMinStars || 50}..${data.risingMaxStars || 2000} created:>${born} archived:false`
    : `${topic}stars:>${data.minStars || 10000} pushed:>${since} archived:false`);
  const { items } = await gh(`/search/repositories?q=${q}&sort=stars&order=desc&per_page=100`);
  // paylaşılmamış, açıklamalı ve lisanslı projeler arasından en yüksek yıldızlı 15 tanesinden biri
  const fresh = (items || []).filter((g) => g.description && (rising || g.license) && !used.has(g.full_name.toLowerCase())).slice(0, 15);
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
  const post = postFromRepo(g, id, readme, undefined, await aiSummary(g, readme));
  data.posts.push(post);
  savePosts(data);
  console.log(`✔ Yeni post üretildi: ${post.id} (${g.full_name}, ${post.slides.length} slayt)`);
})().catch((e) => fail(e.message));
