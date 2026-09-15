// Vercel Serverless Function
// Endpoint: POST /api/login
// Kullanıcı adı/şifre doğruysa tarayıcıya bir oturum çerezi (cookie) verir.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
    return;
  }

  const expectedUser = process.env.APP_USERNAME;
  const expectedPass = process.env.APP_PASSWORD;
  const authToken = process.env.AUTH_TOKEN;

  if (!expectedUser || !expectedPass || !authToken) {
    res.status(500).json({ error: 'Sunucuda giriş ayarları eksik (APP_USERNAME / APP_PASSWORD / AUTH_TOKEN).' });
    return;
  }

  const { username, password } = req.body || {};

  if (username === expectedUser && password === expectedPass) {
    const maxAge = 60 * 60 * 24 * 30; // 30 gün
    res.setHeader(
      'Set-Cookie',
      `session=${authToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
    );
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre yanlış.' });
  }
};
