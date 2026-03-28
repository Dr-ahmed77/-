// api/chat.js - نسخة Groq
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const GROQ_KEY = process.env.GROQ_API_KEY; // ← مفتاح مختلف
    
    if (!GROQ_KEY) {
      return res.status(500).json({ error: "Clé GROQ_API_KEY manquante" });
    }

    const { messages } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    
    res.status(200).json({
      choices: [{ message: { content: data.choices[0].message.content } }]
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
