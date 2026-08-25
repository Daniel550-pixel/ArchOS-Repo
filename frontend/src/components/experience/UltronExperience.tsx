import React from "react";
import UltronNeuralField, { UltronSystemStatus } from "./UltronNeuralField";

interface Props {
  status?: UltronSystemStatus;
  title?: string;
  subtitle?: string;
}

/** Minimal ULTRON shell: visual state only; commands remain owned by ArchOS. */
export const UltronExperience: React.FC<Props> = ({
  status = "IDLE",
  title = "ULTRON",
  subtitle = "ARCHOS EXPERIENCE ENGINE",
}) => (
  <section className="relative min-h-screen overflow-hidden bg-black text-white">
    <UltronNeuralField status={status} />
    <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-black/35 p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-[0.35em] text-white/45">{subtitle}</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.25em] text-white/60">
            {status}
          </div>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["INTELLIGENCE", "J.A.R.V.I.S."],
            ["WORLD STATE", "LIVE"],
            ["GOVERNANCE", "ENFORCED"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] tracking-[0.28em] text-white/40">{label}</p>
              <p className="mt-2 text-lg text-white/90">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default UltronExperience;
