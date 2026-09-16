// Vercel Serverless Function
// Endpoint: POST /api/save-quiz
// Admin'in ürettiği soruları Vercel KV'ye kaydeder, böylece çocuk farklı bir
// cihazdan giriş yaptığında aynı sınavı görebilir.

const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
    return;
  }

  const { questions, sourceFileName } = req.body || {};
  if (!questions || !Array.isArray(questions) || !questions.length) {
    res.status(400).json({ error: 'Geçerli bir soru listesi gönderilmedi.' });
    return;
  }

  try {
    await kv.set('current-quiz', {
      questions,
      sourceFileName: sourceFileName || null,
      createdAt: new Date().toISOString(),
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Sınav kaydedilemedi: ' + (err.message || 'bilinmeyen hata') });
  }
};
