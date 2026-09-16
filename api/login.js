// Vercel Serverless Function
// Endpoint: POST /api/login
// İki farklı hesap seti kontrol edilir: admin (PDF yükleyebilir) ve çocuk (sadece sınav çözer).
// Hangi hesapla giriş yapıldığına göre farklı bir oturum çerezi (cookie) verilir;
// middleware.js bu çerezin değerine bakarak admin sayfalarını korur.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
    return;
  }

  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  const adminToken = process.env.ADMIN_AUTH_TOKEN;

  const childUser = process.env.APP_USERNAME;
  const childPass = process.env.APP_PASSWORD;
  const childToken = process.env.CHILD_AUTH_TOKEN;

  if (!adminUser || !adminPass || !adminToken || !childUser || !childPass || !childToken) {
    res.status(500).json({ error: 'Sunucuda giriş ayarları eksik. Vercel ortam değişkenlerini kontrol edin.' });
    return;
  }

  const { username, password } = req.body || {};
  const maxAge = 60 * 60 * 24 * 30; // 30 gün

  let token = null;
  let role = null;

  if (username === adminUser && password === adminPass) {
    token = adminToken;
    role = 'admin';
  } else if (username === childUser && password === childPass) {
    token = childToken;
    role = 'child';
  }

  if (token) {
    res.setHeader(
      'Set-Cookie',
      `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
    );
    res.status(200).json({ ok: true, role });
  } else {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış.' });
  }
};
