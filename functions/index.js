// Firebase Cloud Function (2. nesil)
// firebase.json içindeki hosting rewrite'ı sayesinde /api/generate-quiz adresinden erişilir.

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { buildPrompt, parseQuizResponse } = require('./quiz-prompt');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

exports.generateQuiz = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true, region: 'europe-west1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
      return;
    }

    const apiKey = ANTHROPIC_API_KEY.value();
    if (!apiKey) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY secret tanımlı değil.' });
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
  }
);
