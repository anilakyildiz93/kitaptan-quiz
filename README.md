# Kitaptan Sınav

Bir ders kitabı PDF'i yükleyip, içeriğe göre karışık (çoktan seçmeli + açık uçlu) sorular üreten web uygulaması.

## Nasıl çalışır

- **`/public/index.html`** — tüm arayüz. PDF'i tarayıcıda (pdf.js ile) okur, metni çıkarır, `/api/generate-quiz`'e gönderir.
- **`/api/generate-quiz.js`** — Vercel Serverless Function. Anthropic API'yi çağırıp soruları JSON olarak döner.
- **`/functions/index.js`** — aynı işi yapan Firebase Cloud Function (Vercel kullanmayacaksanız).
- API anahtarınız **sadece sunucu tarafında** kullanılır, tarayıcıya hiç gönderilmez.

İkisini birden kurmanıza gerek yok — hangisini kullanacaksanız sadece onun adımlarını izleyin.

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
4. **Settings → Environment Variables** kısmına şunu ekleyin:
   - Key: `ANTHROPIC_API_KEY`
   - Value: kendi Anthropic API anahtarınız
5. **Deploy**'a basın. Birkaç saniye içinde `https://REPO_ADI.vercel.app` adresinde canlı olur.

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
