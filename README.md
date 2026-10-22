# IG Carousel Bot

Bir GitHub projesini tanıtan, kurulum/kullanım rehberi gibi davranan kaydırmalı Instagram postlarını **sabit bir şablondan** üretip otomatik paylaşır. Tamamen ücretsiz: GitHub Actions + Playwright + Instagram Graph API.

## Nasıl çalışır?
1. `content/posts.json` içindeki ilk `published: false` post seçilir.
2. `template/` içindeki sabit tema ile her slayt 1080x1350 **JPEG** olarak render edilir (Instagram API PNG kabul etmez).
3. Görseller repoya push edilir; `raw.githubusercontent.com` linkleri Instagram'a verilir.
4. Carousel yayınlanır, post `published: true` olur.

## Kurulum

### 1. Repo
Bu klasörü **public** bir GitHub reposuna yükle (raw görsel linkleri için gerekli). `content/posts.json` içindeki `repo` ve `branch` alanlarını düzenle.

### 2. Instagram hesabı
Instagram > Ayarlar > Hesap türü > **Profesyonel hesaba geç** (Business veya Creator).

### 3. Facebook sayfası bağla
Bir Facebook sayfası oluştur (boş olabilir). Instagram > Profili düzenle > Sayfa > sayfayı bağla.

### 4. Meta developer uygulaması
1. https://developers.facebook.com > **My Apps > Create App** > tür: **Business**.
2. Uygulamaya **Instagram Graph API** (ve Facebook Login for Business) ürününü ekle.
3. **App ID** ve **App Secret** değerlerini Settings > Basic'ten not al.

### 5. Token alma
1. https://developers.facebook.com/tools/explorer aç, uygulamanı seç.
2. İzinler: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`. **Generate Access Token**.
3. Kısa ömürlü token'ı uzun ömürlüye çevir (60 gün):
   ```
   curl -G "https://graph.facebook.com/v21.0/oauth/access_token" \
     -d grant_type=fb_exchange_token \
     -d client_id=APP_ID -d client_secret=APP_SECRET \
     -d fb_exchange_token=KISA_TOKEN
   ```
4. **IG_USER_ID** bul:
   ```
   curl "https://graph.facebook.com/v21.0/me/accounts?access_token=UZUN_TOKEN"
   # dönen sayfa id'si ile:
   curl "https://graph.facebook.com/v21.0/SAYFA_ID?fields=instagram_business_account&access_token=UZUN_TOKEN"
   ```
   `instagram_business_account.id` değeri IG_USER_ID'dir.

> Uygulama "Development" modunda kalabilir; kendi hesabına paylaşım için App Review gerekmez (hesap uygulamada admin/tester olmalı).

### 6. GitHub Secrets
Repo > Settings > Secrets and variables > Actions:

| Secret | Açıklama |
|---|---|
| `IG_USER_ID` | Instagram business hesap id'si |
| `IG_ACCESS_TOKEN` | Uzun ömürlü token |
| `FB_APP_ID` | Meta app id (token yenileme için) |
| `FB_APP_SECRET` | Meta app secret (token yenileme için) |
| `GH_PAT` | `Secrets: write` yetkili fine-grained PAT (token yenileme secret'ı güncellesin diye) |

Ayrıca Settings > Actions > General > Workflow permissions: **Read and write**.

## Kullanım
- **Zamanlama:** `.github/workflows/post.yml` içinde haftada 3 gün (Pzt/Çar/Cum 09:00 UTC). Cron'u istediğin gibi değiştir.
- **Manuel:** Actions > "Instagram Carousel Paylaş" > Run workflow. `dry_run` işaretlersen sadece render edilir, çıktı artifact olarak indirilir.
- **Yerelde dene:**
  ```
  npm install
  npx playwright install chromium
  npm run dry
  ```
  Çıktılar `output/<post-id>/slide-N.jpg` içinde.
- **Token yenileme:** `refresh-token.yml` ayda 2 kez çalışıp token'ı yeniler ve secret'ı günceller.

## Slayt tipleri
| Tip | Alanlar |
|---|---|
| `cover` | `title`, `subtitle` |
| `step` | `number`, `title`, `code`, (`text`) |
| `code` | `title`, `code`, (`text`) |
| `tip` | `title`, `text` |
| `list` | `title`, `items[]` |
| `cta` | `title`, `text` |

Carousel en az 2, en fazla 10 slayt olmalı. Görünümü `template/theme.css` başındaki değişkenlerden değiştir (renk, font).

## Notlar
- Instagram API günde 100 post limiti verir; bu proje için fazlasıyla yeterli.
- Hata olursa Actions logunda `HATA:` ile başlayan satır nedeni söyler.
- Token'lar asla koda yazılmaz; sadece GitHub Secrets'ta durur.
