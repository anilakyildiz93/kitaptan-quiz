// Vercel Serverless Function
// Endpoint: POST /api/generate-quiz
// Body: { text: string, numQuestions: number }
// Anahtar hiçbir zaman tarayıcıya gönderilmez; sadece bu sunucu fonksiyonu görür.

const { buildPrompt, parseQuizResponse } = require('./_quiz-prompt');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Sunucuda ANTHROPIC_API_KEY tanımlı değil. Vercel proje ayarlarından Environment Variables kısmına ekleyin.' });
    return;
  }

  const { text, numQuestions } = req.body || {};
  if (!text || typeof text !== 'string' || text.length < 200) {
    res.status(400).json({ error: 'Geçerli bir kitap metni gönderilmedi.' });
    return;
  }
  const n = Math.min(Math.max(parseInt(numQuestions, 10) || 8, 3), 20);

  try {
    const prompt = buildPrompt(text, n);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      res.status(502).json({ error: 'Anthropic API hatası: ' + errText.slice(0, 300) });
      return;
    }

    const data = await anthropicRes.json();
    const rawText = (data.content || []).map(b => b.text || '').join('');
    const questions = parseQuizResponse(rawText);

    res.status(200).json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bilinmeyen sunucu hatası.' });
  }
};
