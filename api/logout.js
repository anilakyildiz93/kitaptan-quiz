// Vercel Serverless Function
// Endpoint: POST /api/logout — oturum çerezini siler.

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.status(200).json({ ok: true });
};
