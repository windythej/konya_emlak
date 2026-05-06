const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 10;
  if (!rateLimitMap.has(ip)) { rateLimitMap.set(ip, { count: 1, start: now }); return true; }
  const data = rateLimitMap.get(ip);
  if (now - data.start > windowMs) { rateLimitMap.set(ip, { count: 1, start: now }); return true; }
  if (data.count >= maxReqs) return false;
  data.count++;
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Çok fazla istek. 1 dakika bekleyin.' });

  const { message, lang } = req.body || {};
  if (!message || typeof message !== 'string' || message.length > 500)
    return res.status(400).json({ error: 'Geçersiz mesaj.' });

  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ error: 'API key eksik.' });

  const systemPrompt = lang === 'en'
    ? 'You are a helpful real estate assistant for Öğren-Sat, a Konya real estate analytics platform. Answer only questions about real estate, property valuation, neighborhoods and investment in Konya. Be concise. Max 3 sentences.'
    : 'Sen Öğren-Sat\'ın Konya gayrimenkul analiz platformunun yardımcı asistanısın. Sadece Konya\'daki gayrimenkul, değerleme, mahalleler ve yatırım hakkındaki soruları yanıtla. Kısa ol. Maksimum 3 cümle.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'API hatası' });
    }
    const data = await response.json();
    const reply = data.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'Yanıt alınamadı.' });
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
