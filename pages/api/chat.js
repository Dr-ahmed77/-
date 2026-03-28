export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: req.body.messages.map(m => m.content).join("\n"),
          temperature: 0.7,
          maxOutputTokens: 4000
        })
      }
    );

    const data = await response.json();

    // Gemini ممكن يرجع فورمات مختلف، لذلك نتأكد أنه JSON
    if (!data.candidates || !data.candidates.length) throw new Error("Pas de réponse du modèle");
    
    // ناخذ النص الناتج من Gemini
    const content = data.candidates[0].content[0].text || "";
    
    res.status(200).json({ choices: [{ message: { content } }] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
