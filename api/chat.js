export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
    
    if (!OPENROUTER_KEY) {
      console.error("OPENROUTER_KEY manquant!");
      return res.status(500).json({ error: "Clé API non configurée" });
    }

    const { messages, images } = req.body || {};
    
    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages manquants" });
    }

    // بناء المحتوى للـ API
    const content = [];
    
    // إضافة النص
    const textContent = messages.map(m => m.content).join("\n");
    content.push({ type: "text", text: textContent });

    // إضافة الصور إذا وجدت
    if (images && images.length) {
      for (const img of images) {
        content.push({
          type: "image_url",
          image_url: { url: img }
        });
      }
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://medx.vercel.app",
        "X-Title": "MEDX Study AI"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2-vl-72b-instruct",  // يقرأ الصور + النصوص
        messages: [{ role: "user", content }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Erreur OpenRouter");
    }

    const reply = data.choices?.[0]?.message?.content || "";
    
    res.status(200).json({ choices: [{ message: { content: reply } }] });

  } catch (e) {
    console.error("Erreur:", e);
    res.status(500).json({ error: e.message });
  }
}
