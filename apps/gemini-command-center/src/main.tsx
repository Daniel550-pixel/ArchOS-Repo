import { FormEvent, useState } from "react";
import { Activity, BrainCircuit, ChevronRight, CircleDot, ShieldCheck, Sparkles } from "lucide-react";
import "./styles.css";

type Result = {
  ok: boolean;
  model?: string;
  text?: string;
  error?: string;
};

const starterPrompts = [
  "Assess the current ArchOS architecture and identify the highest-value next implementation.",
  "Design a governed multi-agent workflow for a UAE world-model query.",
  "Explain how Google's Gemini model layer should interact with JARVIS without becoming the OS itself."
];

async function askArchOS(prompt: string): Promise<Result> {
  const response = await fetch("/api/reason", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  return response.json();
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = prompt.trim();
    if (!value || busy) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await askArchOS(value));
    } catch {
      setResult({ ok: false, error: "Unable to reach the ArchOS reasoning gateway." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="brand-orb"><Sparkles size={18} /></div><div><strong>ARCHOS</strong><span>GEMINI COMMAND CENTER</span></div></div>
        <div className="status"><CircleDot size={12} /> GEMINI GATEWAY <b>READY</b></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Activity size={14} /> INTELLIGENCE RUNTIME / ONLINE</div>
          <h1>Reason with <span>Gemini.</span><br />Orchestrate with ArchOS.</h1>
          <p>Google AI Studio supplies the model capability. ArchOS remains the orchestration, governance, memory, world-state, and experience layer.</p>
        </div>
        <div className="architecture-card">
          <div className="node active"><BrainCircuit size={17} /><span>JARVIS</span><small>ORCHESTRATOR</small></div>
          <ChevronRight />
          <div className="node"><Sparkles size={17} /><span>GEMINI</span><small>MODEL LAYER</small></div>
          <ChevronRight />
          <div className="node"><ShieldCheck size={17} /><span>VERIFY</span><small>GOVERNANCE</small></div>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel prompt-panel">
          <div className="panel-title"><span>COMMAND INPUT</span><small>01</small></div>
          <form onSubmit={submit}>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask JARVIS to reason about an architecture, system state, or implementation..." />
            <button disabled={busy || !prompt.trim()}>{busy ? "REASONING..." : "EXECUTE REASONING"}<ChevronRight size={16} /></button>
          </form>
          <div className="starters">
            <span>QUICK MISSIONS</span>
            {starterPrompts.map((item) => <button key={item} onClick={() => setPrompt(item)}>{item}<ChevronRight size={14} /></button>)}
          </div>
        </aside>

        <section className="panel result-panel">
          <div className="panel-title"><span>INTELLIGENCE OUTPUT</span><small>{result?.model ?? "AWAITING INPUT"}</small></div>
          {!result && <div className="empty"><div className="pulse"><BrainCircuit size={30} /></div><h2>Awaiting mission</h2><p>Submit a query to route it through the Gemini reasoning gateway.</p></div>}
          {result && <div className={`output ${result.ok ? "" : "error"}`}><div className="output-meta"><span>{result.ok ? "INFERENCE RECEIVED" : "GATEWAY ERROR"}</span><span>{result.model ?? "SYSTEM"}</span></div><pre>{result.text ?? result.error}</pre></div>}
        </section>
      </section>
    </main>
  );
}
