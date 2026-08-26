import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: "google-ai-studio", model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash" });
});

app.post("/api/reason", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY is not configured on the server" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are JARVIS, the reasoning interface of ArchOS. Be precise. Separate observed facts, inference, uncertainty, and recommended next actions. Never claim a tool or external source was used unless it actually was. Do not execute consequential actions; return a proposed action for human approval.",
        temperature: 0.2
      }
    });

    return res.json({
      ok: true,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      text: response.text ?? "No model response returned."
    });
  } catch (error) {
    console.error("Gemini request failed", error);
    return res.status(502).json({ error: "Gemini request failed" });
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(__dirname, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(port, () => {
  console.log(`ArchOS Gemini Command Center listening on http://localhost:${port}`);
});
