// Vercel Serverless Function
// Endpoint: GET /api/get-quiz
// En son admin tarafından kaydedilmiş sınavı döner.

const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Sadece GET istekleri kabul edilir.' });
    return;
  }

  try {
    const data = await kv.get('current-quiz');
    if (!data) {
      res.status(404).json({ error: 'Henüz bir sınav oluşturulmadı.' });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Sınav okunamadı: ' + (err.message || 'bilinmeyen hata') });
  }
};
