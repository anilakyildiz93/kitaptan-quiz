// Vercel ve Firebase fonksiyonları arasında paylaşılan mantık.

function buildPrompt(text, n) {
  const mcCount = Math.ceil(n * 0.6);
  const openCount = n - mcCount;

  return `Sana bir ders kitabından çıkarılmış metin vereceğim. Bu metne dayanarak Türkçe bir sınav hazırla.

Kurallar:
- Toplam ${n} soru üret: ${mcCount} tanesi çoktan seçmeli (4 şıklı), ${openCount} tanesi açık uçlu (klasik) soru olsun.
- Sorular metnin farklı bölümlerini kapsasın, birbirini tekrar etmesin.
- Çoktan seçmeli sorularda şıklar birbirine yakın ve makul olsun (kolay elenebilir olmasın).
- Açık uçlu sorular için kısa ve net bir "model cevap" ile o cevabı değerlendirirken nelere dikkat edilmesi gerektiğini belirten bir "değerlendirme notu" yaz.
- Sadece geçerli JSON döndür, başka hiçbir açıklama, markdown işareti veya metin ekleme.

JSON formatı tam olarak şöyle olsun:
{
  "questions": [
    {
      "type": "coktan_secmeli",
      "question": "Soru metni",
      "options": ["şık A", "şık B", "şık C", "şık D"],
      "correctIndex": 0,
      "explanation": "Doğru cevabın neden doğru olduğuna dair kısa açıklama"
    },
    {
      "type": "acik_uclu",
      "question": "Soru metni",
      "modelAnswer": "Model/örnek cevap",
      "evaluationNote": "Bu cevabı değerlendirirken nelere bakılmalı"
    }
  ]
}

Ders kitabı metni:
"""
${text}
"""`;
}

function parseQuizResponse(rawText) {
  let cleaned = rawText.trim();
  // Claude bazen ```json ... ``` bloğu döndürebilir; temizle.
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Model yanıtı geçerli JSON değildi.');
  }

  const questions = data.questions || (Array.isArray(data) ? data : null);
  if (!questions || !questions.length) {
    throw new Error('Yanıtta soru bulunamadı.');
  }
  return questions;
}

module.exports = { buildPrompt, parseQuizResponse };
