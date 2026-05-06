// Basit in-memory rate limiter (IP başına dakikada 10 istek)
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 dakika
  const maxReqs = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }

  const data = rateLimitMap.get(ip);
  if (now - data.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }

  if (data.count >= maxReqs) return false;
  data.count++;
  return true;
}

// Haritayı temiz tut (10 dakikada bir eski kayıtları sil)
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [ip, data] of rateLimitMap.entries()) {
    if (data.start < cutoff) rateLimitMap.delete(ip);
  }
}, 10 * 60 * 1000);

export default async function handler(req, res) {
  // CORS — sadece kendi domainden izin ver
  const allowedOrigins = [
    'https://konya-emlak.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' });
  }

  // Input validasyon
  const { message, lang } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Geçersiz mesaj.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Mesaj çok uzun (max 500 karakter).' });
  }

  // API key kontrolü
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });
  }

  const systemPrompt = lang === 'en'
    ? 'You are a helpful real estate assistant for Öğren-Sat, a Konya real estate analytics platform. Answer only questions about real estate in Konya, property valuation, neighborhoods, and investment. Politely decline off-topic questions. Be concise. Max 3 sentences.'
    : 'Sen Öğren-Sat\'ın Konya gayrimenkul analiz platformunun yardımcı asistanısın. Sadece Konya\'daki gayrimenkul, değerleme, mahalleler ve yatırım hakkındaki soruları yanıtla. Konu dışı soruları kibarca reddet. Kısa ol. Maksimum 3 cümle.';

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
      return res.status(500).json({ error: 'API hatası: ' + (err.error?.message || response.status) });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'Yanıt alınamadı.' });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}
