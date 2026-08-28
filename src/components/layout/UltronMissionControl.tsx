import React, { useEffect, useState } from "react";
import { Activity, Bot, Play, ShieldCheck, X } from "lucide-react";

interface Agent { id: string; name: string; model: string; role: string; }
interface Mission { id: string; title: string; objective: string; status: string; }

export function UltronMissionControl({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/archos/agents").then((r) => r.json()),
      fetch("/api/archos/missions").then((r) => r.json()),
    ]).then(([agentData, missionData]) => {
      setAgents(agentData.agents ?? []);
      setMissions(missionData.missions ?? []);
    }).catch(() => undefined);
  }, [open]);

  if (!open) return null;

  return (
    <div className="archos-modal-shell" role="dialog" aria-modal="true" aria-label="ArchOS Mission Control">
      <div className="archos-modal-backdrop" onClick={onClose} />
      <section className="archos-modal-panel">
        <header className="archos-modal-header">
          <div>
            <div className="archos-eyebrow"><span className="archos-status-dot" /> ARCHOS / MISSION CONTROL</div>
            <h2>Agent Fabric</h2>
            <p>Coordinate active intelligence, inspect registered agents, and monitor mission execution.</p>
          </div>
          <button className="archos-icon-button" onClick={onClose} aria-label="Close mission control"><X /></button>
        </header>

        <main className="archos-modal-content">
          <section className="archos-panel-block archos-panel-wide">
            <div className="archos-panel-heading">
              <span><Bot /> REGISTERED AGENTS</span>
              <b>{agents.length.toString().padStart(2, "0")}</b>
            </div>
            <div className="archos-agent-grid">
              {agents.map((agent) => (
                <article key={agent.id} className="archos-agent-card">
                  <div className="archos-card-status"><span /> ACTIVE FABRIC NODE</div>
                  <h3>{agent.name}</h3>
                  <div className="archos-agent-model">{agent.model}</div>
                  <div className="archos-agent-role">{agent.role}</div>
                </article>
              ))}
              {!agents.length && <div className="archos-empty-state">No agents returned by the runtime.</div>}
            </div>
          </section>

          <section className="archos-panel-block">
            <div className="archos-panel-heading">
              <span><Activity /> ACTIVE MISSIONS</span>
              <b>{missions.length.toString().padStart(2, "0")}</b>
            </div>
            <div className="archos-mission-list">
              {missions.map((mission) => (
                <article key={mission.id} className="archos-mission-card">
                  <div className="archos-card-status"><span /> {mission.status.toUpperCase()}</div>
                  <h3>{mission.title}</h3>
                  <p>{mission.objective}</p>
                </article>
              ))}
              {!missions.length && <div className="archos-empty-state">No active missions.</div>}
            </div>
            <div className="archos-control-strip">
              <div><ShieldCheck /><span>POLICY GATED</span></div>
              <div><Play /><span>REPLAY READY</span></div>
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}
