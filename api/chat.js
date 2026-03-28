export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // التحقق من وجود مفتاح API
    if (!process.env.GEMINI_KEY) {
      console.error("GEMINI_KEY manquant!");
      return res.status(500).json({ error: "Clé API Gemini non configurée" });
    }

    const promptText = req.body.messages?.map(m => m.content).join("\n") || req.body.prompt;
    
    if (!promptText || promptText.length < 10) {
      return res.status(400).json({ error: "Prompt trop court ou manquant" });
    }

    // تقصير النص إذا كان طويلاً جداً (Gemini limit ~1M tokens but 500 error on very long)
    const maxLength = 3000;
    const truncatedPrompt = promptText.length > maxLength 
      ? promptText.slice(0, maxLength) + "\n...[texte tronqué]" 
      : promptText;

    console.log("Envoi à Gemini, longueur:", truncatedPrompt.length);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",  // ← مهم: إضافة role
            parts: [{ text: truncatedPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
            topK: 40,
            topP: 0.95
          }
        })
      }
    );

    const data = await response.json();
    console.log("Réponse Gemini:", JSON.stringify(data, null, 2));

    // التحقق من خطأ HTTP
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    if (data.error) {
      throw new Error(data.error.message || "Erreur API Gemini");
    }

    if (!data.candidates || !data.candidates.length) {
      throw new Error("Pas de réponse du modèle");
    }

    // استخراج النص بطريقة آمنة
    const candidate = data.candidates[0];
    const content = candidate.content?.parts?.[0]?.text || 
                   candidate.content?.parts?.map(p => p.text).join("") ||
                   "";

    if (!content) {
      throw new Error("Réponse vide du modèle");
    }

    res.status(200).json({ 
      choices: [{ message: { content } }] 
    });
    
  } catch (e) {
    console.error("Erreur détaillée:", e);
    res.status(500).json({ error: e.message || "Erreur interne" });
  }
}
