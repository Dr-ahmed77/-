async function generate() {
  const txt = G('txtin').value.trim();
  const err = G('errmsg');
  err.style.display = 'none';

  if (!txt || txt.length < 40) {
    err.textContent = 'Colle ton cours ou uploade un PDF (minimum 40 caractères).';
    err.style.display = 'block';
    return;
  }

  const nbq = G('nbq').value, nbf = G('nbf').value, lng = G('lng').value;
  show('loading');

  let mi = 0;
  const timer = setInterval(() => { G('lmsg').textContent = MSGS[++mi % MSGS.length]; }, 1600);

  // ✅ قلل النص على الهاتف
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const maxChars = isMobile ? 2000 : 4000;

  const prompt = `Tu es un expert en pédagogie médicale. Génère exactement ${nbq} QCM et ${nbf} flashcards en ${lng} à partir de ce cours médical.

COURS:
"""
${txt.slice(0, maxChars)}
"""

INSTRUCTIONS:
- QCM: questions réalistes avec 4 options (A,B,C,D), une seule bonne réponse
- Flashcards: format question/réponse concis
- Langue: ${lng}
- Réponds UNIQUEMENT en JSON valide:

{"qcm":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}],"flashcards":[{"front":"...","back":"..."}]}`;

  // ✅ AbortController للـ timeout (25 ثانية)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal   // ✅ ربط الـ timeout
    });

    clearTimeout(timeoutId);
    clearInterval(timer);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const raw = data.choices?.[0]?.message?.content || '';
    
    let jsonStr = raw;
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1];
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse invalide du modèle');
    
    const parsed = JSON.parse(jsonMatch[0]);
    qcm = parsed.qcm || [];
    flash = parsed.flashcards || [];
    
    if (!qcm.length && !flash.length) throw new Error('Aucun contenu généré');

    answered = 0; correct = 0; fi = 0; fo = false;
    render();
    show('results');
    
  } catch(e) {
    clearTimeout(timeoutId);
    clearInterval(timer);
    show('input');

    // ✅ رسائل error واضحة
    if (e.name === 'AbortError') {
      err.textContent = 'Timeout : la requête a pris trop de temps. Réessaie avec un texte plus court.';
    } else {
      err.textContent = 'Erreur : ' + e.message;
    }

    err.style.display = 'block';
    console.error("Generate error:", e);
  }
}
