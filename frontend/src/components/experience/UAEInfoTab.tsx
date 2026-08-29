import React, { FormEvent, useMemo, useState } from "react";

type SimulationBranch = {
  branch_id: string;
  snapshot_id: string;
  horizon: string;
  snapshot_digest?: string;
  state?: unknown;
};

const API_BASE = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? "";

const chips = ["UAE WORLD MODEL", "ECONOMY", "SCENARIO"];

function fmt(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export const UAEInfoTab: React.FC = () => {
  const [prompt, setPrompt] = useState("Model the UAE under a 2031 diversification scenario...");
  const [horizon, setHorizon] = useState("2031-12-31T00:00:00Z");
  const [entityId, setEntityId] = useState("UAE");
  const [scenario, setScenario] = useState("economic_diversification");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState<SimulationBranch | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const stateSummary = useMemo(() => {
    if (!branch?.state) return "NO SIMULATION BRANCH MATERIALIZED";
    return fmt(branch.state);
  }, [branch]);

  async function runSimulation(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const snapshotResponse = await fetch(`${API_BASE}/api/simulation/snapshots`, { method: "POST" });
      if (!snapshotResponse.ok) throw new Error(`Snapshot failed (${snapshotResponse.status})`);
      const snapshot = await snapshotResponse.json();

      const branchResponse = await fetch(`${API_BASE}/api/simulation/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot_id: snapshot.snapshot_id,
          horizon,
          changes: { [entityId]: { scenario, instruction: prompt } },
        }),
      });
      if (!branchResponse.ok) throw new Error(`Branch creation failed (${branchResponse.status})`);
      const created: SimulationBranch = await branchResponse.json();

      const stateResponse = await fetch(`${API_BASE}/api/simulation/branches/${created.branch_id}/state`);
      if (!stateResponse.ok) throw new Error(`State materialization failed (${stateResponse.status})`);
      const materialized = await stateResponse.json();

      setBranch({ ...created, ...materialized });
      setResult(materialized.state);
      window.dispatchEvent(new CustomEvent("archos:simulation:completed", { detail: materialized }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="uae-info-tab" aria-label="UAE Intelligence">
      <style>{`
        .uae-info-tab{color:#fff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;min-height:560px;display:flex;flex-direction:column;background:rgba(5,7,9,.54);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(24px);overflow:hidden}
        .uae-info-tab *{box-sizing:border-box}.uae-info-head{display:flex;justify-content:space-between;align-items:flex-start;padding:24px 26px 20px;border-bottom:1px solid rgba(255,255,255,.08)}
        .uae-kicker{font-size:9px;letter-spacing:.24em;color:rgba(255,255,255,.36)}.uae-title{margin-top:8px;font-size:26px;font-weight:410;letter-spacing:-.025em}.uae-sub{margin-top:7px;color:rgba(255,255,255,.45);font-size:11px;max-width:620px;line-height:1.55}
        .uae-live{font-size:9px;letter-spacing:.16em;color:#d8e7df;display:flex;gap:8px;align-items:center}.uae-live i{width:6px;height:6px;border-radius:50%;background:#d8e7df;box-shadow:0 0 12px rgba(216,231,223,.8)}
        .uae-grid{display:grid;grid-template-columns:1fr 300px;flex:1;min-height:0}.uae-main{padding:22px 26px;min-width:0}.uae-side{border-left:1px solid rgba(255,255,255,.07);padding:22px;background:rgba(0,0,0,.18)}
        .uae-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.uae-metric{padding:15px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025)}.uae-metric b{display:block;font-size:18px;font-weight:500}.uae-metric span{display:block;margin-top:6px;font-size:8px;letter-spacing:.16em;color:rgba(255,255,255,.32)}
        .uae-section-label{font-size:8px;letter-spacing:.22em;color:rgba(255,255,255,.3);margin-bottom:10px}.uae-row{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.055);font-size:9px}.uae-row span:first-child{color:rgba(255,255,255,.32)}.uae-row span:last-child{color:rgba(255,255,255,.7)}
        .uae-composer{position:relative;margin-top:22px;height:143px;border-radius:26px;background:rgba(41,41,43,.955);border:1px solid rgba(214,228,255,.14);box-shadow:0 22px 60px rgba(0,0,0,.3);overflow:hidden}.uae-prompt{position:absolute;left:27px;top:30px;right:24px;color:#8b8c8e;font-size:10px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.uae-tools{position:absolute;left:19px;right:0;top:92px;height:30px;display:flex;align-items:center}.uae-chips{display:flex;gap:5.5px;align-items:center}.uae-chip{height:30px;padding:0 12px;border-radius:9px;border:1px solid rgba(255,255,255,.05);background:linear-gradient(180deg,rgba(255,255,255,.088),rgba(255,255,255,.038));color:#909093;font-size:9px;font-weight:500;display:flex;align-items:center}.uae-right{margin-left:auto;height:30px;display:flex;align-items:flex-start;position:relative}.uae-model{position:relative;top:15.5px;color:#98999c;font-size:10.4px;line-height:1;display:inline-flex;gap:6.2px;white-space:nowrap}.uae-attach{position:relative;top:10px;margin-left:29px;color:#a9aaad;background:none;border:0;padding:0;line-height:0;cursor:pointer}.uae-attach svg{width:19.79px;height:19.79px}.uae-send{position:relative;top:2px;margin-left:21px;width:35px;height:35px;border-radius:50%;border:0;background:linear-gradient(163deg,#fbbc94,#f49d70 46%,#e88654);box-shadow:0 3px 12px rgba(210,110,60,.34);display:grid;place-items:center;cursor:pointer}.uae-send svg{width:11.66px}.uae-send:disabled{opacity:.55;cursor:wait}
        .uae-output{margin-top:18px;max-height:150px;overflow:auto;border-top:1px solid rgba(255,255,255,.06);padding-top:12px}.uae-output pre{margin:0;font:9px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;color:rgba(255,255,255,.48);white-space:pre-wrap}.uae-control{margin-bottom:20px}.uae-control label{display:block;font-size:8px;letter-spacing:.16em;color:rgba(255,255,255,.3);margin-bottom:8px}.uae-control input,.uae-control select{width:100%;height:36px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);color:#ddd;padding:0 10px;font:10px Inter}.uae-status{margin-top:18px;padding:12px;border:1px solid rgba(255,255,255,.07);font:8px/1.6 ui-monospace,monospace;color:rgba(255,255,255,.4)}.uae-error{margin-top:10px;color:#f2a78a;font-size:9px}
        @media(max-width:800px){.uae-grid{grid-template-columns:1fr}.uae-side{border-left:0;border-top:1px solid rgba(255,255,255,.07)}.uae-metrics{grid-template-columns:1fr 1fr}.uae-composer{height:155px}.uae-tools{top:98px;right:12px;left:12px;flex-wrap:wrap;height:auto;gap:12px}.uae-right{width:100%}.uae-attach{margin-left:auto}.uae-send{width:40px;height:40px;margin-left:14px}.uae-model{top:12px}}
      `}</style>
      <header className="uae-info-head">
        <div><div className="uae-kicker">UAE INFORMATION / WORLD MODEL</div><h2 className="uae-title">UAE Intelligence</h2><p className="uae-sub">Live national context translated into a governed scenario surface. The simulation branch remains separate from authoritative World Model state.</p></div>
        <div className="uae-live"><i /> LIVE</div>
      </header>

      <div className="uae-grid">
        <main className="uae-main">
          <div className="uae-metrics">
            <div className="uae-metric"><b>2031</b><span>STRATEGIC HORIZON</span></div>
            <div className="uae-metric"><b>WORLD</b><span>AUTHORITATIVE CONTEXT</span></div>
            <div className="uae-metric"><b>{branch ? "BRANCHED" : "READY"}</b><span>SIMULATION STATE</span></div>
          </div>

          <form className="uae-composer" onSubmit={runSimulation}>
            <p className="uae-prompt">{prompt}</p>
            <div className="uae-tools">
              <div className="uae-chips">
                {chips.map((chip) => <button key={chip} type="button" className="uae-chip" onClick={() => setPrompt(`${chip}: ${prompt}`)}>{chip}</button>)}
              </div>
              <div className="uae-right">
                <span className="uae-model">Scenario Engine <span>⌄</span></span>
                <button className="uae-attach" type="button" aria-label="Attach context"><svg viewBox="0 0 24 24" fill="none"><path d="M8.5 12.5 14.9 6.1a3.6 3.6 0 1 1 5.1 5.1l-7.9 7.9a5.3 5.3 0 1 1-7.5-7.5l8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button>
                <button className="uae-send" type="submit" disabled={loading} aria-label="Run simulation"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 12-6-4 12-3-5-5-1Z" fill="#fff"/></svg></button>
              </div>
            </div>
          </form>

          {(result || error) && <div className="uae-output">{error ? <div className="uae-error">{error}</div> : <><div className="uae-section-label">MATERIALIZED BRANCH STATE</div><pre>{stateSummary}</pre></>}</div>}
        </main>

        <aside className="uae-side">
          <div className="uae-section-label">SIMULATION CONTROLS</div>
          <div className="uae-control"><label>ENTITY</label><input value={entityId} onChange={(e) => setEntityId(e.target.value)} /></div>
          <div className="uae-control"><label>SCENARIO</label><select value={scenario} onChange={(e) => setScenario(e.target.value)}><option value="economic_diversification">Economic diversification</option><option value="population_growth">Population growth</option><option value="energy_transition">Energy transition</option><option value="infrastructure_expansion">Infrastructure expansion</option></select></div>
          <div className="uae-control"><label>HORIZON</label><input value={horizon} onChange={(e) => setHorizon(e.target.value)} /></div>
          <div className="uae-status">{branch ? <>BRANCH: {branch.branch_id}<br/>SNAPSHOT: {branch.snapshot_id}<br/>HORIZON: {branch.horizon}</> : <>NO ACTIVE BRANCH<br/>Create a snapshot to begin.</>}</div>
        </aside>
      </div>
    </section>
  );
};

export default UAEInfoTab;
