export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const promptText = req.body.messages.map(m => m.content).join("\n");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000
          }
        })
      }
    );

    const data = await response.json();
    
    // Debug: طبع الاستجابة في console
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    if (data.error) {
      throw new Error(data.error.message || "Erreur API Gemini");
    }

    if (!data.candidates || !data.candidates.length) {
      throw new Error("Pas de réponse du modèle");
    }

    const content = data.candidates[0].content?.parts?.[0]?.text || "";
    
    res.status(200).json({ choices: [{ message: { content } }] });
  } catch (e) {
    console.error("Erreur:", e);
    res.status(500).json({ error: e.message });
  }
}
