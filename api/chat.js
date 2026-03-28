export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) {
      console.error("GEMINI_KEY manquant!");
      return res.status(500).json({ error: "Clé API non configurée" });
    }

    const body = req.body || {};
    const messages = body.messages || [];
    const promptText = messages.map(m => m.content).join("\n");
    
    if (!promptText) return res.status(400).json({ error: "Prompt vide" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptText.slice(0, 3000) }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ choices: [{ message: { content: text } }] });

  } catch (e) {
    console.error("Erreur:", e);
    res.status(500).json({ error: e.message });
  }
}
