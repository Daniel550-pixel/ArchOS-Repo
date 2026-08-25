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
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md p-6 text-white">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div><div className="text-xs tracking-[0.35em] text-cyan-300">ULTRON / MISSION CONTROL</div><h2 className="mt-1 text-2xl font-semibold">Agent Fabric</h2></div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/10" aria-label="Close"><X /></button>
        </header>
        <main className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-5 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-cyan-300"/> Registered agents</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => <div key={agent.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="font-medium">{agent.name}</div><div className="mt-1 text-xs text-white/50">{agent.model}</div><div className="mt-3 text-xs uppercase tracking-wider text-cyan-200/70">{agent.role}</div></div>)}
              {!agents.length && <div className="text-sm text-white/50">No agents returned by the runtime.</div>}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-cyan-300"/> Missions</div>
            <div className="space-y-3">
              {missions.map((mission) => <div key={mission.id} className="rounded-xl border border-white/10 p-3"><div className="font-medium">{mission.title}</div><div className="mt-1 text-xs text-white/50">{mission.status}</div></div>)}
              {!missions.length && <div className="text-sm text-white/50">No active missions.</div>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-white/10 p-3"><ShieldCheck className="mb-2 h-4 w-4"/>Policy gated</div><div className="rounded-xl border border-white/10 p-3"><Play className="mb-2 h-4 w-4"/>Replay ready</div></div>
          </section>
        </main>
      </div>
    </div>
  );
}
