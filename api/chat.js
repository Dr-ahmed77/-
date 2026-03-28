export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    // ✅ تبدل هنا: GROQ_API_KEY بدل OPENROUTER_KEY
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "Clé API Groq non configurée" });
    }

    const { messages } = req.body || {};
    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages manquants" });
    }

    // ✅ تبدل هنا: endpoint Groq بدل OpenRouter
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
        // ✅ حذفنا: HTTP-Referer و X-Title (ما يحتاجهمش Groq)
      },
      body: JSON.stringify({
        // ✅ تبدل هنا: نموذج Llama بدل Qwen
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: messages[0].content }],
        temperature: 0.7,
        max_completion_tokens: 4000  // ✅ تبدل هنا: max_completion_tokens بدل max_tokens
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const reply = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ choices: [{ message: { content: reply } }] });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
