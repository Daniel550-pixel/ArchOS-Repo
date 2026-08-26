import React, { FormEvent, useEffect, useState } from "react";
import { Activity, BrainCircuit, CheckCircle2, ChevronRight, CircleDot, ShieldCheck, Sparkles } from "lucide-react";

type RiskLevel = "READ_ONLY" | "LOW_RISK" | "CONSEQUENTIAL" | "HIGH_IMPACT";
type Mission = { taskId: string; domain: string; specialists: string[]; riskLevel: RiskLevel };
type Action = { actionId: string; target: string; riskLevel: RiskLevel; approvalState: string; requiredAuthority: string };
type Result = { ok: boolean; model?: string; text?: string; error?: string; plan?: Mission; action?: Action };

const stages = ["PERCEIVE", "WORLD MODEL", "RESEARCH", "REASON", "PLAN", "RISK", "VERIFY", "ACTION GATE"];
const starters = [
  "Assess the current ArchOS architecture and identify the highest-value next implementation.",
  "Design a governed multi-agent workflow for a UAE world-model query.",
  "Analyze Dubai energy infrastructure and propose optimization opportunities without executing changes."
];

export const GeminiCommandCenter: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState<Action[]>([]);
  const [busy, setBusy] = useState(false);

  const refreshPending = async () => {
    try {
      const response = await fetch("/api/governance/pending");
      const data = await response.json();
      setPending(data.actions ?? []);
    } catch { /* ULTRON remains usable if governance API is unavailable. */ }
  };

  useEffect(() => { void refreshPending(); }, []);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = prompt.trim();
    if (!value || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/reason", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: value }) });
      setResult(await response.json());
      await refreshPending();
    } catch { setResult({ ok: false, error: "Gemini gateway unavailable." }); }
    finally { setBusy(false); }
  }

  async function approve(actionId: string) {
    await fetch(`/api/governance/${actionId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approver: "ultron-operator" }) });
    await refreshPending();
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/45 text-white shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_20%,rgba(80,130,255,.13),transparent_36%)]" />
      <div className="relative z-10 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5"><Sparkles size={19} /></div>
            <div><p className="text-[10px] tracking-[.3em] text-white/40">ULTRON INTELLIGENCE MODULE</p><h2 className="mt-1 text-xl font-semibold">Gemini Command Center</h2></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] tracking-[.16em] text-white/55"><CircleDot size={11} className="fill-emerald-300 text-emerald-300" /> MODEL GATEWAY <span className="text-emerald-200">ONLINE</span></div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="mb-3 flex items-center justify-between"><span className="text-[10px] tracking-[.22em] text-white/40">MISSION INPUT</span><BrainCircuit size={15} className="text-white/35" /></div>
            <form onSubmit={submit}>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask JARVIS to reason about the UAE world model, architecture, risk, or a proposed operation..." className="min-h-40 w-full resize-y rounded-xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/25" />
              <button disabled={busy || !prompt.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs tracking-[.15em] disabled:cursor-not-allowed disabled:opacity-40">{busy ? "REASONING THROUGH JARVIS..." : "RUN GEMINI REASONING"}<ChevronRight size={15} /></button>
            </form>
            <div className="mt-5 space-y-2"><p className="text-[9px] tracking-[.22em] text-white/30">QUICK MISSIONS</p>{starters.map((item) => <button key={item} onClick={() => setPrompt(item)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 p-2.5 text-left text-[11px] text-white/45 hover:border-white/15 hover:text-white/75">{item}<ChevronRight size={12} className="shrink-0" /></button>)}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex items-center justify-between"><span className="text-[10px] tracking-[.22em] text-white/40">JARVIS PIPELINE</span><span className="font-mono text-[9px] text-white/25">{result?.plan?.taskId ?? "NO ACTIVE TASK"}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">{stages.map((stage, i) => <div key={stage} className="rounded-lg border border-white/7 bg-black/25 p-2.5"><div className="flex items-center gap-2"><span className="font-mono text-[8px] text-white/25">0{i + 1}</span>{result ? <CheckCircle2 size={11} className="text-white/55" /> : <Activity size={11} className="text-white/20" />}</div><p className="mt-2 text-[9px] tracking-[.12em] text-white/50">{stage}</p></div>)}</div>

            {result?.plan && <div className="mt-4 grid grid-cols-3 gap-2"><Metric label="DOMAIN" value={result.plan.domain} /><Metric label="RISK" value={result.plan.riskLevel} /><Metric label="SPECIALISTS" value={String(result.plan.specialists.length)} /></div>}
            <div className="mt-4 min-h-44 rounded-xl border border-white/7 bg-black/30 p-4">{!result ? <div className="grid h-full min-h-40 place-items-center text-center"><div><ShieldCheck className="mx-auto text-white/20" size={28} /><p className="mt-3 text-sm text-white/35">Awaiting mission</p><p className="mt-1 text-[11px] text-white/20">Gemini reasoning will appear here without bypassing ArchOS governance.</p></div></div> : <><div className="flex justify-between text-[9px] tracking-[.14em] text-white/30"><span>{result.ok ? "INFERENCE RECEIVED" : "GATEWAY ERROR"}</span><span>{result.model ?? "SYSTEM"}</span></div><pre className="mt-4 whitespace-pre-wrap font-sans text-xs leading-6 text-white/70">{result.text ?? result.error}</pre></>}</div>
          </div>
        </div>

        {pending.length > 0 && <div className="mt-5 rounded-2xl border border-amber-200/10 bg-amber-200/[.025] p-4"><div className="flex items-center justify-between"><span className="text-[10px] tracking-[.2em] text-amber-100/45">ACTION GATE / PENDING APPROVAL</span><span className="font-mono text-[9px] text-amber-100/25">{pending.length} QUEUED</span></div><div className="mt-3 space-y-2">{pending.map((action) => <div key={action.actionId} className="flex flex-col gap-3 rounded-xl border border-white/7 bg-black/20 p-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs text-white/70">{action.target}</p><p className="mt-1 font-mono text-[9px] text-white/30">{action.actionId} · {action.riskLevel} · {action.requiredAuthority}</p></div><button onClick={() => void approve(action.actionId)} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[10px] tracking-[.12em] text-white/65 hover:text-white">APPROVE SIMULATION</button></div>)}</div></div>}
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-lg border border-white/7 bg-black/20 p-2.5"><p className="text-[8px] tracking-[.16em] text-white/25">{label}</p><p className="mt-1 truncate font-mono text-[10px] text-white/60">{value}</p></div>;

export default GeminiCommandCenter;
