import React, { useState } from "react";
import UltronNeuralField, { UltronSystemStatus } from "./UltronNeuralField";
import ArchosIntelligenceGraph from "./ArchosIntelligenceGraph";
import ArchOSSpatialEnvironment from "./ArchOSSpatialEnvironment";

interface Props {
  status?: UltronSystemStatus;
  title?: string;
  subtitle?: string;
}

const modules = [
  ["WORLD", "World Model"],
  ["INTELLIGENCE", "Agent Fabric"],
  ["SIMULATION", "Scenario Engine"],
  ["VERIFICATION", "Evidence & Integrity"],
  ["SECURITY", "Policy & Trust"],
  ["MEMORY", "System Memory"],
];

/**
 * ArchOS Experience Engine shell.
 *
 * The experience layer is model-agnostic. Individual models are runtime
 * components and must not define the visual identity of the operating system.
 */
export const UltronExperience: React.FC<Props> = ({
  status = "IDLE",
  title = "ARCHOS",
  subtitle = "AUTONOMOUS INTELLIGENCE OPERATING SYSTEM",
}) => {
  const [command, setCommand] = useState("");
  const [activeModule, setActiveModule] = useState("WORLD");

  const executeCommand = () => {
    const value = command.trim();
    if (!value) return;
    // Presentation boundary only. The existing command bus remains the
    // authority for dispatch; this shell deliberately does not execute work.
    window.dispatchEvent(new CustomEvent("archos:command", { detail: { command: value } }));
    setCommand("");
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#020608] text-white">
      <UltronNeuralField status={status} particleCount={90} />

      <header className="fixed inset-x-0 top-0 z-40 flex h-[72px] items-center justify-between border-b border-white/[0.06] bg-black/45 px-5 backdrop-blur-xl md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.03]">
            <span className="h-3 w-3 rotate-45 border border-cyan-200 shadow-[0_0_16px_rgba(103,232,249,.5)]" />
          </div>
          <div>
            <div className="text-sm font-medium tracking-[0.34em]">{title}</div>
            <div className="mt-1 text-[8px] tracking-[0.24em] text-white/30">{subtitle}</div>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <div className="text-right">
            <div className="text-[8px] tracking-[0.22em] text-white/25">SYSTEM STATE</div>
            <div className="mt-1 flex items-center justify-end gap-2 text-[9px] tracking-[0.16em] text-cyan-100/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
              {status}
            </div>
          </div>
          <div className="h-6 w-px bg-white/[0.07]" />
          <div className="text-right">
            <div className="text-[8px] tracking-[0.22em] text-white/25">INTEGRITY</div>
            <div className="mt-1 text-[9px] text-white/60">99.98%</div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-4 pb-28 pt-[92px] md:px-6">
        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)_250px]">
          <aside className="order-2 rounded-2xl border border-white/[0.06] bg-black/35 p-3 backdrop-blur-xl lg:order-1">
            <div className="px-3 pb-3 pt-2 text-[8px] tracking-[0.28em] text-white/25">SYSTEM ARCHITECTURE</div>
            <div className="space-y-1">
              {modules.map(([id, label]) => {
                const active = activeModule === id;
                return (
                  <button key={id} type="button" onClick={() => setActiveModule(id)} className={`w-full rounded-xl px-3 py-3 text-left transition ${active ? "border border-cyan-300/10 bg-cyan-300/[0.05]" : "border border-transparent hover:bg-white/[0.025]"}`}>
                    <div className={`text-[9px] tracking-[0.15em] ${active ? "text-cyan-100" : "text-white/45"}`}>{id}</div>
                    <div className="mt-1 text-[8px] text-white/25">{label}</div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="order-1 min-w-0 space-y-4 lg:order-2">
            <div className="relative overflow-hidden rounded-[30px] border border-white/[0.07] bg-black/20 p-1 shadow-2xl backdrop-blur-sm">
              <ArchOSSpatialEnvironment />
            </div>

            <ArchosIntelligenceGraph title="LIVE INTELLIGENCE FABRIC" />
          </main>

          <aside className="order-3 rounded-2xl border border-white/[0.06] bg-black/35 p-4 backdrop-blur-xl">
            <div className="text-[8px] tracking-[0.28em] text-white/25">ACTIVE CONTEXT</div>
            <div className="mt-2 text-sm tracking-[0.08em] text-white/85">{activeModule}</div>
            <div className="mt-1 text-[9px] text-white/30">System subsystem</div>

            <div className="mt-6 space-y-4 border-t border-white/[0.05] pt-4">
              {[
                ["STATE", "SYNCHRONIZED"],
                ["CONFIDENCE", "94.72%"],
                ["ACTIVE TASKS", "12"],
                ["LATENCY", "41 MS"],
                ["WORLD SYNC", "99.8%"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-white/[0.04] pb-3 text-[8px] tracking-[0.16em]">
                  <span className="text-white/25">{label}</span>
                  <span className="text-cyan-100/65">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[8px] tracking-[0.2em] text-white/25">RUNTIME PRINCIPLE</div>
              <div className="mt-2 text-[9px] leading-5 text-white/40">Models provide cognition. ArchOS owns orchestration, policy, state and experience.</div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-50 w-[min(760px,calc(100%-32px))] -translate-x-1/2">
        <div className="flex items-center rounded-2xl border border-white/[0.09] bg-black/65 px-4 py-3 shadow-2xl backdrop-blur-2xl">
          <span className="mr-3 text-cyan-300/70">⌁</span>
          <input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") executeCommand(); }} placeholder="Command ArchOS..." aria-label="Command ArchOS" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20" />
          <button type="button" onClick={executeCommand} className="ml-3 rounded-lg border border-cyan-300/10 px-3 py-1.5 text-[8px] tracking-[0.2em] text-cyan-100/65 hover:bg-cyan-300/[0.06]">EXECUTE</button>
        </div>
      </div>
    </section>
  );
};

export default UltronExperience;
