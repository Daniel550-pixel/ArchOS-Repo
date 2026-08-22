import React from 'react';
import { Activity, ArrowUpRight, Brain, Globe2, Layers3, Radio, ShieldCheck, Sparkles } from 'lucide-react';
import type { ActiveTab } from './HeaderBar';
import type { AIOSRuntimeState } from '../../aios/runtime';

type Props = {
  activeTab: ActiveTab;
  runtime: AIOSRuntimeState;
  onSelect: (tab: ActiveTab) => void;
};

const signals = [
  ['Dubai mobility', 'Network pressure remains contained', '94%'],
  ['UAE non-oil trade', 'Positive momentum across key corridors', '91%'],
  ['Abu Dhabi development', 'Construction activity above baseline', '89%'],
];

const cityNodes = [
  ['Dubai', 'HIGH ACTIVITY'],
  ['Abu Dhabi', 'STABLE'],
  ['Sharjah', 'RISING'],
  ['Fujairah', 'STABLE'],
];

const SurfaceShell: React.FC<{ eyebrow: string; title: string; description: string; children: React.ReactNode }> = ({ eyebrow, title, description, children }) => (
  <section className="fixed inset-x-0 top-[74px] bottom-[88px] z-10 overflow-hidden bg-[#03070d]/96 backdrop-blur-2xl text-white">
    <div className="mx-auto flex h-full max-w-[1500px] flex-col px-5 py-6 sm:px-8 lg:px-12">
      <header className="mb-6 flex items-end justify-between gap-6 border-b border-white/[0.07] pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" />
            {eyebrow}
          </div>
          <h1 className="text-2xl font-light tracking-[-0.03em] text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">{description}</p>
        </div>
        <div className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/35 md:flex">
          <Activity className="h-3.5 w-3.5 text-cyan-300/70" /> live state
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto pr-1">{children}</div>
    </div>
  </section>
);

const CoreSurface: React.FC<{ runtime: AIOSRuntimeState }> = ({ runtime }) => (
  <SurfaceShell eyebrow="AIOS / CORE" title="Cognitive center" description="A restrained operational view of ULTRON's current cognitive state. Detail appears only when the system has something meaningful to show.">
    <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
      <div className="relative min-h-[390px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_44%,rgba(34,211,238,.11),transparent_34%),linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20 shadow-[0_0_80px_rgba(34,211,238,.12),inset_0_0_45px_rgba(34,211,238,.06)]">
          <div className="absolute inset-5 rounded-full border border-cyan-200/10" />
          <div className="absolute inset-[42%] rounded-full bg-cyan-200 shadow-[0_0_35px_rgba(165,243,252,.9)]" />
        </div>
        <div className="absolute bottom-5 left-5 text-[9px] uppercase tracking-[0.24em] text-white/35">runtime state</div>
        <div className="absolute bottom-5 right-5 text-xs font-medium text-white/70">{runtime.systemState || 'IDLE'}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {[
          ['Runtime', runtime.systemState || 'IDLE', 'AIOS'],
          ['Context', runtime.activeView?.toUpperCase() || 'CORE', runtime.activeEntityId ? `ENTITY ${runtime.activeEntityId}` : 'NO ENTITY FOCUS'],
          ['Last signal', runtime.lastCommandSource?.toUpperCase() || 'SYSTEM', runtime.lastCommand ? runtime.lastCommand.replaceAll('_', ' ') : 'Awaiting input'],
        ].map(([label, value, meta]) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">{label}</div>
            <div className="mt-3 text-sm text-white/85">{value}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-cyan-200/45">{meta}</div>
          </div>
        ))}
      </div>
    </div>
  </SurfaceShell>
);

const WorldSurface: React.FC = () => (
  <SurfaceShell eyebrow="WORLD MODEL / UAE" title="Living world model" description="A clean spatial index of the UAE. Select a city to move from national context into entity-level intelligence.">
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="relative min-h-[430px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#071019]">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_48%,rgba(34,211,238,.08),transparent_38%)]" />
        {cityNodes.map(([city, state], i) => (
          <button key={city} className="group absolute text-left" style={{ left: `${22 + (i % 2) * 44}%`, top: `${25 + Math.floor(i / 2) * 38}%` }}>
            <span className="block h-3 w-3 rounded-full border border-cyan-100/70 bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,.65)] transition-transform group-hover:scale-150" />
            <span className="mt-2 block text-[10px] text-white/80">{city}</span>
            <span className="mt-0.5 block text-[8px] uppercase tracking-[0.15em] text-white/30">{state}</span>
          </button>
        ))}
        <div className="absolute bottom-5 left-5 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/35"><Globe2 className="h-3.5 w-3.5 text-cyan-300/60" /> spatial intelligence</div>
      </div>
      <aside className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
        <div className="text-[9px] uppercase tracking-[0.22em] text-white/30">World model</div>
        <div className="mt-2 text-lg font-light">UAE / live</div>
        <div className="mt-5 space-y-3">
          {['Spatial entities', 'Active signals', 'Temporal revisions', 'Confidence coverage'].map((label, i) => (
            <div key={label} className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs">
              <span className="text-white/45">{label}</span><span className="text-white/75">{['12,480', '248', '1,204', '96.2%'][i]}</span>
            </div>
          ))}
        </div>
        <button className="mt-6 flex w-full items-center justify-between rounded-xl border border-cyan-200/15 bg-cyan-200/[0.04] px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-cyan-100/70 hover:bg-cyan-200/[0.08]">
          Open spatial model <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </aside>
    </div>
  </SurfaceShell>
);

const IntelSurface: React.FC = () => (
  <SurfaceShell eyebrow="INTELLIGENCE / SIGNAL" title="Signal intelligence" description="The intelligence layer is intentionally quiet: only material signals, confidence and assessment are surfaced by default.">
    <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
        {signals.map(([title, detail, confidence], i) => (
          <article key={title} className="group flex items-center gap-5 border-b border-white/[0.06] px-5 py-5 last:border-0 hover:bg-white/[0.025]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-cyan-200/70"><Radio className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><h2 className="text-sm text-white/85">{title}</h2><p className="mt-1 truncate text-xs text-white/35">{detail}</p></div>
            <div className="text-right"><div className="text-sm text-white/80">{confidence}</div><div className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/25">confidence</div></div>
          </article>
        ))}
      </div>
      <aside className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/30"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300/60" /> assessment integrity</div>
        <div className="mt-6 text-5xl font-light tracking-[-0.05em] text-white">94<span className="text-xl text-white/25">%</span></div>
        <p className="mt-2 text-xs leading-5 text-white/35">High-confidence signal coverage across the active intelligence set.</p>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-[94%] rounded-full bg-cyan-200/70 shadow-[0_0_12px_rgba(103,232,249,.4)]" /></div>
        <div className="mt-5 flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/30"><Sparkles className="h-3.5 w-3.5" /> verified context</div>
      </aside>
    </div>
  </SurfaceShell>
);

const ExperienceSurface: React.FC = () => (
  <SurfaceShell eyebrow="EXPERIENCE / SPATIAL" title="Spatial intelligence" description="A quiet entry point into ArchOS 3D capabilities. The experience surface stays focused on the object, not the chrome around it.">
    <div className="grid min-h-[430px] place-items-center overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,.09),transparent_32%),#050b12]">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-cyan-100/15 shadow-[0_0_80px_rgba(34,211,238,.12),inset_0_0_50px_rgba(34,211,238,.08)]"><Layers3 className="h-8 w-8 text-cyan-100/60" /></div>
        <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-200/45">3D experience engine</div>
        <div className="mt-2 text-lg font-light text-white/80">Spatial workspace ready</div>
        <div className="mt-2 text-xs text-white/30">Gesture, vision and spatial selection remain available through the command rail.</div>
      </div>
    </div>
  </SurfaceShell>
);

export const UltronWorkspaceSurface: React.FC<Props> = ({ activeTab, runtime, onSelect }) => {
  if (activeTab === 'orb') return <CoreSurface runtime={runtime} />;
  if (activeTab === 'world') return <WorldSurface />;
  if (activeTab === 'intelligence') return <IntelSurface />;
  if (activeTab === 'experience') return <ExperienceSurface />;
  return null;
};
