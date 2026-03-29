export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "Clé API non configurée" });
    }

    // ✅ parse body إذا جا كـ string
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }

    const { messages } = body || {};
    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages manquants" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Tu es un générateur de QCM et flashcards médicaux. Tu réponds UNIQUEMENT avec du JSON valide, sans aucun texte avant ou après. Jamais de markdown, jamais d'explication, seulement le JSON brut."
          },
          {
            role: "user",
            content: messages[0].content
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    console.log("Groq status:", response.status);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Groq error ${response.status}: ${data.error?.message || JSON.stringify(data)}`);
    }

    if (data.error) throw new Error(data.error.message);

    const reply = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ choices: [{ message: { content: reply } }] });

  } catch (e) {
    console.error("Handler error:", e.message);
    res.status(500).json({ error: e.message });
  }
}
