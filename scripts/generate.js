// Kuyrukta yayınlanmamış post kalmadıysa GitHub'dan yeni bir proje seçip otomatik post üretir.
// Kaynak sırası: 1) posts.json "repos" listesi  2) GitHub aramasından popüler/güncel projeler.
const fs = require('fs');
const path = require('path');
const { ROOT, loadPosts, savePosts, fail } = require('./common');
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
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 4000, thinking: { type: 'disabled' }, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const block = (await r.json()).content.find((b) => b.type === 'text');
    if (!block) throw new Error('metin bloğu yok');
    return block.text;
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

const TITLES = {
  tr: '2 "Bu repo ne işe yarıyor?", 3 "Kimler için uygun?", 4 "Kurulum gerekiyor mu?", 5 "Özel bölümler nasıl bulunur?", 6 "Arama nasıl yapılır?", 7 "İstersen bilgisayarına da indirebilirsin"',
  en: '2 "What does this repo do?", 3 "Who is it for?", 4 "Do you need to install it?", 5 "How to find the key sections?", 6 "How to search?", 7 "You can download it too"',
};

async function aiSummary(g, readme, lang = 'tr') {
  const en = lang === 'en';
  if (String(readme).trim().length < 300) { console.warn(`README çok kısa (${g.full_name}), uydurma riski nedeniyle yapay zeka özeti atlandı.`); return null; }
  const prompt = `Aşağıdaki GitHub projesini 8 slaytlık bir Instagram carousel için ${en ? 'simple, fluent, friendly ENGLISH ile anlat (TÜM değerler İngilizce olmalı, tek kelime Türkçe yazma)' : 'sade, akıcı, samimi TÜRKÇE ile anlat'}. SADECE geçerli JSON döndür, başka metin yazma.
Slayt başlıkları sabittir: ${TITLES[lang] || TITLES.tr}. İçeriği bu başlıklara uyacak şekilde yaz (proje uygulama ise 5. slaytta ana bölümlerini, 6. slaytta dokümantasyon/komutlara nasıl ulaşılacağını anlat).
GÜVENLİK: Proje korsan/crack yazılım, kötü amaçlı yazılım (malware, stealer, botnet, ransomware), DDoS aracı, sızdırılmış veri, yetişkin içerik, nefret veya taciz ile ilgiliyse "safe": false yaz ve diğer alanları boş bırak.
DÜRÜSTLÜK: Sadece README'de GERÇEKTEN olan şeyleri yaz. "has_search_site": true yalnızca README'de insanların arama yapabildiği gerçek bir web sitesi/sayfa anılıyorsa. "has_sections": true yalnızca README'de gerçekten adı geçen 3 farklı bölüm/klasör/modül varsa. Aksi halde false yaz ve ilgili alanları (usage_*, sections*) boş bırak. Asla uydurma arama sonucu, dosya adı veya komut yazma.
Kurallar: her metin kısa olsun (belirtilen karakter sınırını AŞMA). "icon" alanları TEK emoji olsun. Adım metinlerinin başına numara veya 1️⃣ gibi emoji koyma. Bilmediğin şeyi uydurma; README'de olmayan komut/adres yazma. Proje bir uygulama değil de liste/doküman ise kurulum ve indirme kısımlarını buna göre dürüstçe yaz.
JSON şeması:
{
 "safe": true,
 "has_search_site": false,
 "has_sections": false,
 "tagline": "projeyi anlatan tek cümle, en fazla 60 karakter",
 "hook": "dikkat çekici tek cümlelik caption girişi",
 "summary": "projenin ana faydası, 1 cümle, en fazla 70 karakter",
 "description": "ne sunuyor, ne işe yarıyor, 2 cümle, en fazla 190 karakter",
 "promise": "öne çıkan vaat / ana mesaj, en fazla 55 karakter",
 "features": [ {"icon":"emoji","title":"en fazla 22 karakter","text":"en fazla 38 karakter"} ],   // tam 4 adet
 "extra": {"icon":"emoji","title":"topluluk/güncellik gibi ekstra not, en fazla 36 karakter","text":"en fazla 50 karakter"},
 "audience_intro": "hedef kitleye dair 1 cümle, en fazla 55 karakter",
 "audience": [ {"icon":"emoji","name":"en fazla 20 karakter","text":"en fazla 30 karakter","needs":["en fazla 24 karakter","...","..."]} ],   // tam 4 adet, needs tam 3
 "audience_bottom": "neden ilgililer kullanmalı, en fazla 55 karakter",
 "setup_intro": "kurulum gerekiyor mu, 1 cümle, en fazla 55 karakter",
 "setup_steps": [ {"icon":"emoji","text":"en fazla 26 karakter"} ],   // tam 3 adet
 "setup_notes": ["en fazla 14 karakter","...","..."],   // tam 3, çok kısa etiketler
 "setup_bottom": "kısa önemli not/ipucu, en fazla 55 karakter",
 "sections_title": "Neler var? gibi kısa başlık, en fazla 24 karakter",
 "sections_intro": "en fazla 55 karakter",
 "sections": [ {"icon":"emoji","name":"en fazla 16 karakter","text":"en fazla 26 karakter","items":["en fazla 20 karakter","...","...","..."]} ],   // tam 3 adet, items tam 4
 "sections_note": "dikkat çeken kısa not, en fazla 60 karakter",
 "sections_bottom": "bu bölümler nasıl işe yarar, en fazla 55 karakter",
 "usage_intro": "nasıl kullanılır, 1 cümle, en fazla 55 karakter",
 "usage_steps": [ {"icon":"emoji","text":"en fazla 26 karakter"} ],   // tam 3 adet
 "usage_link": "README'de varsa web sitesi/arama adresi, yoksa github.com/${g.full_name}",
 "usage_examples": ["en fazla 22 karakter","...","...","..."],   // tam 4
 "usage_title": "arama/dokümantasyon sayfasının başlığı, en fazla 22 karakter",
 "usage_input": "arama kutusuna yazılmış örnek, en fazla 24 karakter",
 "usage_results": [ {"title":"en fazla 16 karakter","text":"en fazla 22 karakter","tags":["en fazla 7 karakter","...","..."]} ],   // tam 4 adet örnek sonuç, tags tam 3
 "usage_bottom": "en fazla 55 karakter",
 "download_intro": "indirmek zorunlu mu, 1 cümle, en fazla 55 karakter",
 "download_command": "git clone https://github.com/${g.full_name}.git",
 "download_advantages": [ {"icon":"emoji","title":"en fazla 18 karakter","text":"en fazla 40 karakter"} ],   // tam 3 adet
 "download_alt": {"title":"Alternatif yöntem başlığı, en fazla 30 karakter","text":"en fazla 70 karakter"},
 "download_note": "önemli not/sınırlama/ipucu, en fazla 80 karakter",
 "final_intro": "seri vaadi, en fazla 55 karakter",
 "final_purpose": "ana amaç, en fazla 34 karakter",
 "final_install": "kurulum durumu, en fazla 34 karakter",
 "final_extra": "ekstra bilgi, en fazla 34 karakter",
 "categories": ["kısa kategori etiketi, en fazla 14 karakter", "...", "...", "...", "..."]   // tam 5
}

Proje: ${g.full_name}
Açıklama: ${g.description}
Dil: ${g.language}
README:
${readme.slice(0, 7000)}`;
  try {
    const text = await llm(prompt);
    if (!text) throw new Error('yapay zeka anahtarı/servisi yok veya boş yanıt');
    const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    if (j.safe === false) return { safe: false };
    if (!j.summary || !Array.isArray(j.features) || !j.features.length) throw new Error('eksik alan');
    return j;
  } catch (e) {
    console.warn(`Yapay zeka özeti alınamadı (${lang}: ${e.message}), README özeti kullanılacak.`);
    return null;
  }
}

const BLOCK = /\b(crack(ed|s)?|keygen|warez|nsfw|porn\w*|hentai|onlyfans|leak(ed|s)?|pirat(e|ed|es)|torrent\w*|ddos|botnet|ransomware|stealer|keylogger|exploit-kit|nazi)\b/i;
function blocked(g, data) {
  const text = [g.name, g.description, ...(g.topics || [])].join(' ');
  if (BLOCK.test(text)) return true;
  return (data.blockKeywords || []).some((k) => k && text.toLowerCase().includes(String(k).toLowerCase()));
}

async function findRepo(data, used) {
  const own = (data.repos || []).filter((r) => !used.has(r.toLowerCase()));
  if (own.length) return gh(`/repos/${own[0]}`);  // kendi seçtiğin repolara filtre uygulanmaz

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
  const fresh = (items || []).filter((g) => g.description && (rising || g.license) && !used.has(g.full_name.toLowerCase()) && !blocked(g, data)).slice(0, 15);
  if (!fresh.length) throw new Error('Uygun yeni proje bulunamadı (minStars değerini düşür).');
  return pick(fresh);
}

const hasPlates = (lang) => fs.existsSync(path.join(ROOT, 'template', 'rv', lang, 'layout.json'));

(async () => {
  const data = loadPosts();
  const all = data.accounts && data.accounts.length ? data.accounts : [{ id: 'tr', lang: 'tr' }];
  const accounts = all.filter((a) => a.enabled !== false).filter((a) => {
    if (a.lang === 'tr' || hasPlates(a.lang)) return true;
    console.warn(`"${a.id}" hesabı atlandı: template/rv/${a.lang}/ şablonu yok.`);
    return false;
  });
  if (!accounts.length) { console.log('Etkin hesap yok.'); return; }
  const pending = new Set(data.posts.filter((p) => !p.published && !p.draft && !p.failed).map((p) => p.source || p.id));
  if (pending.size >= (data.minQueue || 1) && !process.env.FORCE) {
    console.log(`Kuyrukta ${pending.size} yayınlanmamış proje var, yeni üretilmedi.`);
    return;
  }
  const used = new Set(data.posts.map((p) => (p.source || '').toLowerCase()).filter(Boolean));
  const first = accounts[0];
  let g, readme, firstAi;
  for (let attempt = 1; attempt <= 6; attempt++) {
    g = await findRepo(data, used);
    readme = '';
    try { readme = await gh(`/repos/${g.full_name}/readme`, 'application/vnd.github.raw+json'); } catch (_) { /* README yoksa klon adımına düşer */ }
    firstAi = await aiSummary(g, readme, first.lang);
    if (firstAi && firstAi.safe === false) {
      console.warn(`${g.full_name} uygunsuz bulundu, başka proje seçiliyor (${attempt}/6).`);
      used.add(g.full_name.toLowerCase());
      g = null;
      continue;
    }
    break;
  }
  if (!g) throw new Error('6 denemede uygun proje bulunamadı.');

  const slug = g.name.toLowerCase().replace(/[^\w.-]/g, '-');
  let baseId = slug;
  for (let n = 2; data.posts.some((p) => p.id === baseId || p.id.startsWith(`${baseId}-`)); n++) baseId = `${slug}-${n}`;
  for (const acc of accounts) {
    const id = acc.lang === 'tr' ? baseId : `${baseId}-${acc.lang}`;
    const post = postFromRepo(g, id, readme, undefined, acc === first ? firstAi : await aiSummary(g, readme, acc.lang), { lang: acc.lang, account: acc.id });
    data.posts.push(post);
    console.log(`✔ Yeni post üretildi: ${post.id} (${g.full_name}, ${acc.id}, ${post.slides.length} slayt)`);
  }
  savePosts(data);
})().catch((e) => fail(e.message));
