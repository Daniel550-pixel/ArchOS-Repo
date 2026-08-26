import React from "react";
import UltronNeuralField, { UltronSystemStatus } from "./UltronNeuralField";
import UltronCommandCenter from "./UltronCommandCenter";

interface Props {
  status?: UltronSystemStatus;
  title?: string;
  subtitle?: string;
}

/** ULTRON shell: neural field plus the integrated command-center experience. */
export const UltronExperience: React.FC<Props> = ({
  status = "IDLE",
  title = "ULTRON",
  subtitle = "ARCHOS EXPERIENCE ENGINE",
}) => (
  <section className="relative min-h-screen overflow-hidden bg-black text-white">
    <UltronNeuralField status={status} />
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-5 p-5 md:p-8">
      <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-2xl backdrop-blur-xl md:p-10">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-[0.35em] text-white/45">{subtitle}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.25em] text-white/60">
            {status}
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["INTELLIGENCE", "J.A.R.V.I.S."],
            ["WORLD STATE", "LIVE"],
            ["GOVERNANCE", "ENFORCED"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] tracking-[0.28em] text-white/40">{label}</p>
              <p className="mt-2 text-sm text-white/90">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <UltronCommandCenter />
    </div>
  </section>
);

export default UltronExperience;
