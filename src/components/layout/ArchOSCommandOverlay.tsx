import React, { useEffect, useState } from 'react';
import { Activity, Command, Layers3, ShieldCheck, Signal, Workflow, X } from 'lucide-react';

type RuntimeSnapshot = {
  time: string;
  online: boolean;
};

const navItems = [
  { label: 'Mission Control', icon: Workflow, event: 'archos:mission-control' },
  { label: 'Mission Replay', icon: Layers3, event: 'archos:mission-replay' },
];

export const ArchOSCommandOverlay: React.FC = () => {
  const [clock, setClock] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [active, setActive] = useState('CORE');
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>({ time: '', online: navigator.onLine });

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString([], { hour12: false }));
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    const online = () => setSnapshot((s) => ({ ...s, online: true }));
    const offline = () => setSnapshot((s) => ({ ...s, online: false }));
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const dispatch = (eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName));
    setActive(eventName === 'archos:mission-control' ? 'MISSIONS' : eventName === 'archos:mission-replay' ? 'REPLAY' : 'WORLD');
    setPanelOpen(false);
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-[#050b14]/85 px-3 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
            <Command size={18} />
          </div>
          <div>
            <div className="text-xs font-black tracking-[.24em] text-slate-100">ARCHOS</div>
            <div className="mt-0.5 text-[9px] font-semibold tracking-[.18em] text-cyan-300/70">SOVEREIGN COMMAND DECK</div>
          </div>
        </div>

        <div className="pointer-events-auto hidden items-center gap-4 rounded-xl border border-white/10 bg-[#050b14]/80 px-4 py-3 font-mono text-[10px] tracking-wider text-slate-300 backdrop-blur-xl md:flex">
          <span className="flex items-center gap-2"><span className={snapshot.online ? 'h-1.5 w-1.5 rounded-full bg-emerald-400' : 'h-1.5 w-1.5 rounded-full bg-red-400'} />{snapshot.online ? 'NETWORK AVAILABLE' : 'OFFLINE'}</span>
          <span className="h-3 w-px bg-white/15" />
          <span className="text-cyan-100">{clock || '--:--:--'} LOCAL</span>
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? 'Close command menu' : 'Open command menu'}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-[#050b14]/90 text-cyan-100 backdrop-blur-xl transition hover:border-cyan-300/60 hover:bg-cyan-400/10"
        >
          {panelOpen ? <X size={18} /> : <Activity size={18} />}
        </button>
      </header>

      <div className="pointer-events-none fixed bottom-4 left-3 z-[60] hidden w-52 space-y-2 sm:left-5 md:block">
        <div className="rounded-xl border border-white/10 bg-[#050b14]/80 p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-[9px] font-bold tracking-[.2em] text-slate-400"><Signal size={12} className="text-cyan-300" /> SYSTEM OVERVIEW</div>
          <div className="flex items-center justify-between py-1.5 text-[10px]"><span className="text-slate-400">Client connectivity</span><span className={snapshot.online ? 'text-emerald-300' : 'text-red-300'}>{snapshot.online ? 'AVAILABLE' : 'OFFLINE'}</span></div>
          <div className="flex items-center justify-between py-1.5 text-[10px]"><span className="text-slate-400">Command policy</span><span className="text-amber-200">GATED</span></div>
          <div className="flex items-center justify-between py-1.5 text-[10px]"><span className="text-slate-400">Runtime telemetry</span><span className="text-slate-300">NOT CONNECTED</span></div>
          <div className="mt-2 border-t border-white/10 pt-2 text-[9px] leading-relaxed text-slate-500">Client status is live. Runtime metrics require a connected telemetry adapter.</div>
        </div>
      </div>

      {panelOpen && (
        <div className="fixed right-3 top-[4.5rem] z-[70] w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-cyan-400/25 bg-[#07101d]/95 p-3 shadow-2xl backdrop-blur-2xl sm:right-5">
          <div className="px-2 pb-3 pt-1">
            <div className="text-[10px] font-bold tracking-[.22em] text-cyan-200">QUICK NAVIGATION</div>
            <div className="mt-1 text-xs text-slate-500">Open an available ArchOS surface</div>
          </div>
          {navItems.map(({ label, icon: Icon, event }) => (
            <button key={event} type="button" onClick={() => dispatch(event)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-cyan-300/10">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[.03] text-cyan-200 transition group-hover:border-cyan-300/30"><Icon size={16} /></span>
              <span className="flex-1"><span className="block text-xs font-semibold text-slate-100">{label}</span><span className="mt-1 block text-[10px] text-slate-500">Launch workspace</span></span>
              <span className="text-cyan-300/60">↗</span>
            </button>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-white/10 px-2 pt-3 text-[10px] text-slate-500"><ShieldCheck size={13} className="text-emerald-300" /> Actions remain subject to runtime governance</div>
        </div>
      )}
    </>
  );
};
