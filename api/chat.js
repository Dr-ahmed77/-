export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
    if (!OPENROUTER_KEY) {
      return res.status(500).json({ error: "Clé API non configurée" });
    }

    const { messages } = req.body || {};
    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages manquants" });
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
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "user", content: messages[0].content }],
        temperature: 0.7,
        max_tokens: 4000
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
