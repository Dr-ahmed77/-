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

    const { messages } = req.body || {};
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
        messages: [{ role: "user", content: messages[0].content }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    // ✅ DEBUG: لوغ الـ status تاع Groq
    console.log("Groq status:", response.status);

    const data = await response.json();

    // ✅ DEBUG: لوغ الـ response كاملة
    console.log("Groq response:", JSON.stringify(data));

    if (!response.ok) {
      // ✅ ارجع الـ error الحقيقي من Groq
      throw new Error(`Groq error ${response.status}: ${data.error?.message || JSON.stringify(data)}`);
    }

    if (data.error) throw new Error(data.error.message);

    const reply = data.choices?.[0]?.message?.content || "";
    alert('RAW: ' + raw.slice(0, 300));
    res.status(200).json({ choices: [{ message: { content: reply } }] });

  } catch (e) {
    console.error("Handler error:", e.message);
    res.status(500).json({ error: e.message });
  }
}
