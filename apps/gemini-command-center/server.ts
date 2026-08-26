import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { actionGateStore, type ActionGateRecord } from "../../server/governance/actionGateStore";
import { buildMissionPlan } from "./src/archosBridge";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, provider: "google-ai-studio", model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", governance: actionGateStore.stats() }));
app.get("/api/governance/pending", (_req, res) => res.json({ ok: true, actions: actionGateStore.getPending() }));
app.get("/api/governance/audit", (_req, res) => res.json({ ok: true, audit: actionGateStore.getAudit(100) }));
app.post("/api/governance/:actionId/approve", (req, res) => {
  const approver = typeof req.body?.approver === "string" && req.body.approver.trim() ? req.body.approver.trim() : "operator";
  const action = actionGateStore.approve(req.params.actionId, approver, { execution: "APPROVAL_RECORDED", mode: "SIMULATED", timestamp: new Date().toISOString() });
  if (!action) return res.status(404).json({ error: "Action not found or already resolved" });
  return res.json({ ok: true, action });
});

app.post("/api/reason", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return res.status(400).json({ error: "prompt is required" });
  const plan = buildMissionPlan(prompt);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY is not configured on the server", plan });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: JSON.stringify({ mission: prompt, archosMissionPlan: plan }),
      config: {
        systemInstruction: "You are JARVIS, the reasoning interface of ArchOS. ArchOS owns orchestration, governance, memory and world state. Gemini supplies model reasoning only. Use the supplied mission plan and canonical world-model context. Separate observed facts, inference, uncertainty and proposed actions. Never claim external data was fetched unless it was actually fetched. Never execute consequential actions. Return an actionable proposal for the ArchOS ActionGate when the mission is consequential.",
        temperature: 0.2
      }
    });

    let action: ActionGateRecord | undefined;
    if (plan.proposedAction && plan.riskLevel !== "READ_ONLY") {
      action = {
        actionId: `act-${crypto.randomUUID().slice(0, 12)}`,
        actor: typeof req.body?.actor === "string" ? req.body.actor : "operator",
        agent: "gemini-reasoning",
        taskId: plan.taskId,
        target: plan.proposedAction.target,
        requestedOperation: plan.proposedAction.operation,
        riskLevel: plan.riskLevel,
        requiredAuthority: plan.proposedAction.requiredAuthority,
        policyDecision: "REQUIRES_APPROVAL",
        approvalState: "PENDING",
        provenance: "google-ai-studio/gemini -> archos-bridge",
        timestamp: new Date().toISOString(),
        payload: { prompt, model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash" }
      };
      actionGateStore.submit(action);
    }
    return res.json({ ok: true, model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", plan, action, text: response.text ?? "No model response returned." });
  } catch (error) {
    console.error("Gemini request failed", error);
    return res.status(502).json({ error: "Gemini request failed", plan });
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(__dirname, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(port, () => console.log(`ArchOS Gemini Command Center listening on http://localhost:${port}`));
