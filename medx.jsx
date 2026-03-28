import { useState, useCallback } from "react";

const LETTERS = ["A", "B", "C", "D"];

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "2px solid #e5e7eb",
        borderTopColor: "#111",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 16px"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 14, color: "#888" }}>Génération en cours…</p>
    </div>
  );
}

function QuestionCard({ q, qi, onAnswer, answered }) {
  const [selected, setSelected] = useState(null);

  function pick(oi) {
    if (selected !== null) return;
    setSelected(oi);
    onAnswer(oi === q.correct);
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 12, padding: 20, marginBottom: 10
    }}>
      <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
        Question {qi + 1}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, lineHeight: 1.5 }}>
        {q.question}
      </div>
      {q.options.map((opt, oi) => {
        let bg = "#fff", border = "1px solid #e5e7eb", color = "#111";
        if (selected !== null) {
          if (oi === q.correct) { bg = "#f0fdf4"; border = "1px solid #86efac"; color = "#166534"; }
          else if (oi === selected) { bg = "#fef2f2"; border = "1px solid #fca5a5"; color = "#991b1b"; }
        }
        return (
          <div key={oi} onClick={() => pick(oi)} style={{
            display: "flex", alignItems: "flex-start", gap: 9,
            padding: "9px 11px", borderRadius: 8, border, background: bg, color,
            marginBottom: 6, cursor: selected === null ? "pointer" : "default",
            transition: "all 0.12s", fontSize: 13
          }}>
            <span style={{
              width: 20, height: 20, minWidth: 20, borderRadius: "50%",
              border: "1px solid #d1d5db",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 500
            }}>{LETTERS[oi]}</span>
            <span>{opt.replace(/^[A-D]\.\s*/, "")}</span>
          </div>
        );
      })}
      {selected !== null && q.explanation && (
        <div style={{
          fontSize: 12, color: "#666", marginTop: 10,
          paddingTop: 10, borderTop: "1px solid #f0f0f0", lineHeight: 1.5
        }}>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

function FlashCard({ card, idx, total, onPrev, onNext }) {
  const [open, setOpen] = useState(false);

  function goNext() { setOpen(false); setTimeout(onNext, 50); }
  function goPrev() { setOpen(false); setTimeout(onPrev, 50); }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#888" }}>{idx + 1} / {total}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[["←", goPrev, idx === 0], ["→", goNext, idx === total - 1]].map(([lbl, fn, dis]) => (
            <button key={lbl} onClick={fn} disabled={dis} style={{
              width: 30, height: 30, border: "1px solid #e5e7eb",
              borderRadius: 8, background: "none", cursor: dis ? "not-allowed" : "pointer",
              fontSize: 13, color: "#888", opacity: dis ? 0.35 : 1,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>{lbl}</button>
          ))}
        </div>
      </div>
      <div onClick={() => setOpen(!open)} style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: "36px 24px", textAlign: "center",
        cursor: "pointer", minHeight: 180,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", position: "relative"
      }}>
        <div style={{ position: "absolute", top: 12, left: 14, fontSize: 10, color: "#bbb", letterSpacing: 1, textTransform: "uppercase" }}>
          {open ? "Réponse" : "Question"}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}>{card.front}</div>
        {!open && <div style={{ fontSize: 11, color: "#bbb", marginTop: 12 }}>Cliquer pour révéler</div>}
        {open && (
          <div style={{
            fontSize: 13, color: "#555", marginTop: 14, lineHeight: 1.6,
            borderTop: "1px solid #f0f0f0", paddingTop: 14
          }}>{card.back}</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [nbq, setNbq] = useState("10");
  const [nbf, setNbf] = useState("10");
  const [lang, setLang] = useState("français");
  const [screen, setScreen] = useState("input"); // input | loading | results
  const [qcm, setQcm] = useState([]);
  const [flash, setFlash] = useState([]);
  const [tab, setTab] = useState("qcm");
  const [fi, setFi] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [err, setErr] = useState("");

  const handleAnswer = useCallback((isCorrect) => {
    setAnswered(a => a + 1);
    if (isCorrect) setCorrect(c => c + 1);
  }, []);

  async function generate() {
    setErr("");
    if (!text.trim() || text.trim().length < 40) {
      setErr("Colle ton cours (minimum 40 caractères).");
      return;
    }
    setScreen("loading");

    const prompt = `Tu es un expert en pédagogie médicale. Génère exactement ${nbq} QCM et ${nbf} flashcards en ${lang} à partir de ce cours.

Cours:
"""
${text.slice(0, 3500)}
"""

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après, sans markdown:
{"qcm":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}],"flashcards":[{"front":"...","back":"..."}]}

correct = index 0-3 de la bonne réponse. Distracteurs réalistes. Flashcards concises.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = (data.content || []).find(b => b.type === "text")?.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Réponse invalide");
      const parsed = JSON.parse(match[0]);
      const q = parsed.qcm || [], f = parsed.flashcards || [];
      if (!q.length && !f.length) throw new Error("Aucun contenu généré");
      setQcm(q); setFlash(f);
      setAnswered(0); setCorrect(0); setFi(0); setTab("qcm");
      setScreen("results");
    } catch (e) {
      setScreen("input");
      setErr("Erreur : " + e.message);
    }
  }

  function reset() {
    setText(""); setErr(""); setScreen("input");
  }

  const sel = { background: "#fff", color: "#111", border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" };
  const inputStyle = { width: "100%", height: 140, resize: "none", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, color: "#111", outline: "none", lineHeight: 1.5 };

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 20px", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>MEDX <span style={{ fontWeight: 400, color: "#888", fontSize: 13 }}>— Study AI</span></div>
        <div style={{ fontSize: 11, color: "#bbb" }}>Faculté de Médecine</div>
      </div>

      <div style={{ padding: 20, maxWidth: 780, margin: "0 auto" }}>

        {/* INPUT */}
        {screen === "input" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {/* Text input */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "#aaa", marginBottom: 10 }}>Coller le texte</div>
                <textarea style={inputStyle} placeholder={"Colle ton cours ici…\n\nEx: La mitose est le processus de division cellulaire comprenant 4 phases principales…"} value={text} onChange={e => setText(e.target.value)} />
              </div>
              {/* PDF note */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
                <div style={{ fontSize: 32 }}>📄</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>PDF de cours</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>Ouvre ton PDF, sélectionne tout le texte <b>(Ctrl+A)</b>, copie-le et colle-le dans le champ à gauche.</div>
              </div>
            </div>

            {/* Settings */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  ["QCM", nbq, setNbq, [["5","5 questions"],["10","10 questions"],["15","15 questions"]]],
                  ["Flashcards", nbf, setNbf, [["5","5 flashcards"],["10","10 flashcards"],["15","15 flashcards"]]],
                  ["Langue", lang, setLang, [["français","Français"],["arabe","Arabe"],["anglais","Anglais"]]]
                ].map(([label, val, setter, opts]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 110 }}>
                    <label style={{ fontSize: 11, color: "#888" }}>{label}</label>
                    <select style={sel} value={val} onChange={e => setter(e.target.value)}>
                      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {err && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b", marginTop: 10 }}>{err}</div>}

            <button onClick={generate} style={{ width: "100%", marginTop: 12, padding: 13, background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
              Générer QCM + Flashcards
            </button>
          </div>
        )}

        {/* LOADING */}
        {screen === "loading" && <Spinner />}

        {/* RESULTS */}
        {screen === "results" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{qcm.length} QCM · {flash.length} Flashcards</div>
              <button onClick={reset} style={{ fontSize: 12, color: "#888", background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>← Nouveau cours</button>
            </div>

            {/* Score */}
            {answered === qcm.length && qcm.length > 0 && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", marginBottom: 12 }}>
                Score : {correct} / {qcm.length} ({Math.round(correct / qcm.length * 100)}%)
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, background: "#f3f4f6", borderRadius: 8, padding: 3, width: "fit-content", marginBottom: 14 }}>
              {[["qcm", "QCM"], ["flash", "Flashcards"]].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  fontSize: 12, fontWeight: 500, padding: "5px 14px", borderRadius: 6,
                  border: tab === id ? "1px solid #e5e7eb" : "none",
                  background: tab === id ? "#fff" : "none",
                  color: tab === id ? "#111" : "#888",
                  cursor: "pointer", fontFamily: "inherit"
                }}>{label}</button>
              ))}
            </div>

            {/* QCM */}
            {tab === "qcm" && (
              <div>
                <div style={{ fontSize: 11, color: "#bbb", marginBottom: 10 }}>{answered} / {qcm.length} répondues</div>
                {qcm.map((q, qi) => (
                  <QuestionCard key={qi} q={q} qi={qi} onAnswer={handleAnswer} />
                ))}
              </div>
            )}

            {/* Flashcards */}
            {tab === "flash" && flash.length > 0 && (
              <FlashCard
                card={flash[fi]} idx={fi} total={flash.length}
                onNext={() => setFi(i => Math.min(i + 1, flash.length - 1))}
                onPrev={() => setFi(i => Math.max(i - 1, 0))}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
