// backend/index.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const pptxParser = require("pptx-parser"); // You may need to find the right library for pptx
const { OpenAI } = require("openai");
require("dotenv").config();

const upload = multer({ dest: "uploads/" });
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/generate", upload.single("file"), async (req, res) => {
  try {
    let text = req.body.text || "";

    // Handle file extraction
    if (req.file && req.file.mimetype) {
      if (req.file.mimetype === "application/pdf") {
        const data = await pdfParse(fs.readFileSync(req.file.path));
        text += "\n" + data.text;
      } else if (req.file.mimetype === "text/plain") {
        text += "\n" + fs.readFileSync(req.file.path, "utf8");
      } else if (
        req.file.originalname.endsWith(".pptx") ||
        req.file.originalname.endsWith(".ppt")
      ) {
        // Extract PPTX text: use a suitable npm module
        // Example with pptxParser, actual implementation may differ.
        const slides = await pptxParser(fs.readFileSync(req.file.path));
        text += slides.map(s => s.text).join("\n");
      }
      fs.unlink(req.file.path, () => {}); // cleanup temp file
    }

    if (!text.trim()) {
      return res.json({ result: "Please enter text or upload a file." });
    }

    // Construct the right prompt based on type
    let prompt = "";
    const type = req.body.type;
    if (type === "SUMMARY") {
      prompt = `
Given the following medical lesson, generate a clear, structured summary using headings, bullet points, key concepts, and definitions:

${text}
      `;
    } else if (type === "QCM") {
      prompt = `
Based on the following lesson, create 10 multiple choice questions (QCM) with 4 answer options each. For each question, highlight the correct answer and provide a short explanation:

${text}
---
Format example:
1. Question?
   A. Option 1
   B. Option 2 (correct)
   C. Option 3
   D. Option 4
   Explanation: ...
      `;
    } else if (type === "FLASHCARDS") {
      prompt = `
From the following medical lesson, generate a JSON array of 10 flashcards, each as { "front": "question", "back": "answer" }, focused on main concepts for memorization.

${text}
---
Example: [{"front": "What is...?", "back": "..."}]
      `;
    }

    // OpenAI call
    const gptRes = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1800,
      temperature: 0.55,
    });

    const content = gptRes.choices[0].message.content;

    let apiResult = content;
    if (type === "FLASHCARDS") {
      // Expect JSON output
      try {
        apiResult = JSON.stringify(JSON.parse(content)); // Clean JSON for frontend parse
      } catch (e) {
        apiResult = JSON.stringify([{ front: "Failed to parse flashcards", back: content }]);
      }
    } else if (type === "SUMMARY" || type === "QCM") {
      // Convert lines to HTML for nice display
      apiResult = content
        .replace(/\n#/g, "<h3>")
        .replace(/(\n-|\n•)/g, "<li>")
        .replace(/(\r?\n){2,}/g, "<br/>");
    }

    res.json({ result: apiResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: "An error occurred." });
  }
});

app.listen(3001, () => console.log("Backend listening on http://localhost:3001"));
