# Kitaptan Sınav

Bir ebeveynin ders kitabı PDF'i yükleyip sınav oluşturduğu, çocuğunun ise ayrı bir hesapla girip
o sınavı çözdüğü web uygulaması.

## Nasıl çalışır

- **`/public/login.html`** — giriş ekranı. Kullanıcı adı/şifreye göre admin veya çocuk olarak yönlendirir.
- **`/public/admin.html`** — sadece admin girişiyle erişilir. PDF'i tarayıcıda (pdf.js ile) okur, metni çıkarır, `/api/generate-quiz` ile soruları ürettirir, `/api/save-quiz` ile ortak depoya kaydeder.
- **`/public/index.html`** — sadece çocuk (veya admin) girişiyle erişilir. `/api/get-quiz` ile en son kaydedilen sınavı çeker ve çözdürür.
- **`/api/generate-quiz.js`** — Anthropic API'yi çağırıp soruları JSON olarak döner. (Sadece admin.)
- **`/api/save-quiz.js`** / **`/api/get-quiz.js`** — sınavı Vercel KV'ye kaydeder / okur, böylece admin ve çocuk farklı cihazlarda olsa bile aynı sınavı paylaşırlar.
- **`/api/login.js`**, **`/api/logout.js`** — giriş/çıkış, rol bazlı oturum çerezi.
- **`/middleware.js`** — her isteği kontrol eder, admin sayfalarını sadece admin'e, sınav sayfasını admin+çocuğa açar.
- **`/functions/index.js`** — Firebase Cloud Function alternatifi, ama sadece tek-kullanıcılı eski akışı içerir (admin/çocuk ayrımı yok).
- API anahtarınız **sadece sunucu tarafında** kullanılır, tarayıcıya hiç gönderilmez.

Bu özellik seti (admin/çocuk ayrımı + paylaşılan depo) **Vercel** için kurulmuştur. Firebase'e geçmek isterseniz ek çalışma gerekir.

---

## Seçenek A: Vercel + GitHub

1. Bu klasörü bir GitHub reposuna yükleyin:
   ```bash
   git init
   git add .
   git commit -m "İlk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADI.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New Project** → GitHub reponuzu seçin → **Import**.
3. Build ayarlarına dokunmanıza gerek yok (`vercel.json` zaten `public` klasörünü statik kök olarak ayarlıyor, `/api` klasörü otomatik algılanır).
4. **Storage** sekmesine gidin → **Create Database** → **KV** (Upstash destekli) → bir isim verin → projenize bağlayın. Bu, `KV_REST_API_URL` ve `KV_REST_API_TOKEN` ortam değişkenlerini otomatik olarak ekler — admin'in ürettiği sınavın çocuğun cihazına ulaşması için bu depo gerekli.
5. **Settings → Environment Variables** kısmına şunları ekleyin:
   - `ANTHROPIC_API_KEY` → kendi Anthropic API anahtarınız
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` → sizin (ebeveyn) giriş bilgileriniz — PDF yükleyip sınav oluşturabilirsiniz
   - `APP_USERNAME` / `APP_PASSWORD` → çocuğunuzun giriş bilgileri — sadece hazır sınavı çözebilir
   - `ADMIN_AUTH_TOKEN` → uzun rastgele bir metin, örn: `22ff844713b7e605693e76747c7856375839be8c859b5291e53ad521e64bd32d`
   - `CHILD_AUTH_TOKEN` → farklı, uzun rastgele bir metin, örn: `4470c44c1b2ddfd24eabd914897d70a96fc52295d9523f85df23876448787636`
6. **Deploy**'a basın. Birkaç saniye içinde `https://REPO_ADI.vercel.app` adresinde canlı olur.
7. Siteyi açtığınızda giriş ekranı gelir.
   - **Admin** (`ADMIN_USERNAME`/`ADMIN_PASSWORD`) ile giriş yapılırsa `/admin.html`'e yönlenir: PDF yükleyip sınav oluşturur, oluşan sınav otomatik olarak ortak depoya (KV) kaydedilir.
   - **Çocuk** (`APP_USERNAME`/`APP_PASSWORD`) ile giriş yapılırsa `/` adresine yönlenir: en son kaydedilen sınavı görür ve çözer. Henüz sınav yoksa "Henüz bir sınav yok" mesajı gösterilir.

> Not: Bu giriş sistemi (`middleware.js`) ve ortak depo (Vercel KV) sadece **Vercel**'de çalışır. Firebase'e geçerseniz farklı bir kimlik doğrulama ve veri depolama yöntemi (Firebase Authentication + Firestore) kurmak gerekir; şu anki `functions/` klasörü bu admin/çocuk ayrımını içermiyor.

Sonraki her `git push` otomatik olarak yeniden dağıtım yapar.

### Yerelde test etmek isterseniz
```bash
npm i -g vercel
cp .env.example .env.local   # sonra .env.local içine gerçek anahtarı yazın
vercel dev
```

---

## Seçenek B: Firebase (Hosting + Cloud Functions)

1. Firebase CLI'ı kurun ve giriş yapın:
   ```bash
   npm i -g firebase-tools
   firebase login
   ```
2. [Firebase Console](https://console.firebase.google.com)'da yeni bir proje oluşturun. Cloud Functions kullanabilmek için projenin **Blaze (kullandıkça öde)** plana geçmesi gerekir — Anthropic API çağrısı "dış ağa istek" olduğu için Spark (ücretsiz) planda çalışmaz.
3. `.firebaserc` dosyasındaki `BURAYA-FIREBASE-PROJE-ID-YAZIN` kısmını kendi proje ID'nizle değiştirin.
4. API anahtarını secret olarak tanımlayın:
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```
   (İstendiğinde anahtarınızı yapıştırın.)
5. Fonksiyon bağımlılıklarını kurun:
   ```bash
   cd functions
   npm install
   cd ..
   ```
6. Dağıtın:
   ```bash
   firebase deploy
   ```
7. Çıktıda verilen Hosting URL'sini açın — uygulama orada çalışıyor olacak.

### GitHub ile birlikte kullanmak

Kodu GitHub'a yükleyip [Firebase App Hosting / GitHub Actions entegrasyonunu](https://firebase.google.com/docs/hosting/github-integration) açarsanız, her `git push`'ta otomatik `firebase deploy` çalıştırabilirsiniz. `firebase init hosting:github` komutu bunu sizin için ayarlar.

---

## Notlar

- PDF metni tarayıcıda çıkarıldığı için taranmış (görüntü tabanlı) PDF'lerde metin bulunamayabilir.
- Bir çağrıda gönderilen kitap metni ~45.000 karaktere kadar kırpılır (maliyet ve hız için); çok uzun kitaplarda ilk bölümler kullanılır.
- Model olarak `claude-sonnet-5` kullanılıyor; `api/generate-quiz.js` ve `functions/index.js` içindeki `model` alanını değiştirerek başka bir Claude modeline geçebilirsiniz.
