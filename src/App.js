// src/App.js
import React, { useState } from "react";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);
  
  const handleInputChange = (e) => setInputText(e.target.value);

  const handleGenerate = async (type) => {
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("text", inputText);
    formData.append("type", type);

    const res = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult({ type, content: data.result });
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>AI Medical Study Generator</h1>
      <div style={styles.inputSection}>
        <textarea
          style={styles.textarea}
          placeholder="Paste your medical lesson or notes here..."
          rows={8}
          value={inputText}
          onChange={handleInputChange}
        />
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,.txt"
          style={styles.fileInput}
          onChange={handleFileChange}
        />
        <div style={styles.buttonRow}>
          <button onClick={() => handleGenerate("SUMMARY")} style={styles.button}>Generate Summary</button>
          <button onClick={() => handleGenerate("QCM")} style={styles.button}>Generate QCM</button>
          <button onClick={() => handleGenerate("FLASHCARDS")} style={styles.button}>Generate Flashcards</button>
        </div>
      </div>
      <div style={styles.resultSection}>
        {loading && <div style={styles.loading}>Generating...</div>}
        {result && <ResultDisplay result={result} />}
      </div>
    </div>
  );
}

function ResultDisplay({ result }) {
  if (result.type === "SUMMARY") {
    return <div dangerouslySetInnerHTML={{ __html: result.content }} />;
  }

  if (result.type === "QCM") {
    // Assume result.content is HTML formatted
    return <div dangerouslySetInnerHTML={{ __html: result.content }} />;
  }

  if (result.type === "FLASHCARDS") {
    const cards = JSON.parse(result.content); // [{front,back}]
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {cards.map((card, idx) => (
          <div key={idx} style={styles.card}>
            <div style={styles.cardFront}>{card.front}</div>
            <div style={styles.cardBack}>{card.back}</div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#fff",
    color: "#222",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 32,
    fontFamily: "Inter, Helvetica, Arial, sans-serif",
  },
  title: {
    fontWeight: 700,
    margin: "32px 0",
    letterSpacing: 0.5,
    fontSize: 28,
  },
  inputSection: {
    width: "100%",
    maxWidth: 700,
    margin: "0 auto 24px auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 17,
    padding: 16,
    background: "#fafbfc",
    marginBottom: 8,
    resize: "vertical",
  },
  fileInput: {
    margin: "10px 0",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    margin: "10px 0 0 0",
  },
  button: {
    fontSize: 16,
    padding: "10px 22px",
    borderRadius: 6,
    border: "none",
    background: "#0057fd",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  resultSection: {
    width: "100%",
    maxWidth: 700,
    marginTop: 32,
    minHeight: 120,
  },
  loading: {
    color: "#0057fd",
    fontSize: 20,
    textAlign: "center",
    margin: "40px 0",
  },
  card: {
    width: 220,
    minHeight: 110,
    borderRadius: 10,
    border: "1px solid #e0e0e0",
    margin: "10px 2px",
    background: "#f6f8fa",
    boxShadow: "0 1px 2px #eee",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 16,
  },
  cardFront: { fontWeight: 600, marginBottom: 8, color: "#222" },
  cardBack: { color: "#666" },
};
