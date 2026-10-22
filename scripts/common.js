const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POSTS_FILE = path.join(ROOT, 'content', 'posts.json');

function loadPosts() {
  if (!fs.existsSync(POSTS_FILE)) fail(`${POSTS_FILE} bulunamadı.`);
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  } catch (e) {
    fail(`posts.json geçerli JSON değil: ${e.message}`);
  }
}

function savePosts(data) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2) + '\n');
}

// POST_ID verilirse onu, yoksa yayınlanmamış ilk postu seçer
function pickPost(data) {
  const wanted = process.env.POST_ID;
  const post = wanted
    ? data.posts.find((p) => p.id === wanted)
    : data.posts.find((p) => !p.published);
  if (!post) return null;
  if (!Array.isArray(post.slides) || post.slides.length < 2 || post.slides.length > 10) {
    fail(`"${post.id}" postu 2-10 slayt içermeli (Instagram carousel sınırı).`);
  }
  return post;
}

function fail(msg) {
  console.error(`HATA: ${msg}`);
  process.exit(1);
}

module.exports = { ROOT, loadPosts, savePosts, pickPost, fail };
