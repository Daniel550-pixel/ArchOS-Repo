import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, CircleAlert, GitBranch, Wifi } from 'lucide-react';
import { aiosRuntime } from '../../aios/runtime';
import { runtimeEventStream, RuntimeEvent } from '../../services/runtime/runtimeEventStream';

type GateStatus = 'PASS' | 'ACTIVE' | 'PENDING' | 'BLOCKED';
interface Gate { label: string; status: GateStatus; detail: string; }
const statusClass: Record<GateStatus, string> = { PASS: 'text-lime-300', ACTIVE: 'text-cyan-300', PENDING: 'text-amber-300', BLOCKED: 'text-red-300' };
const statusGlyph = (status: GateStatus) => status === 'PASS' ? <CheckCircle2 className="h-3 w-3" /> : status === 'BLOCKED' ? <CircleAlert className="h-3 w-3" /> : <Activity className="h-3 w-3" />;

export const ProductionReadinessBar: React.FC = () => {
  const [runtimeConnected, setRuntimeConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [runtimeState, setRuntimeState] = useState(aiosRuntime.getState());

  useEffect(() => {
    const unsubscribeRuntime = aiosRuntime.subscribe(setRuntimeState);
    const unsubscribeEvents = runtimeEventStream.subscribe((_event: RuntimeEvent) => {
      setRuntimeConnected(true);
      setEventCount((count) => count + 1);
      setLastEventAt(Date.now());
    });
    runtimeEventStream.connect();
    const heartbeat = window.setInterval(() => {
      const source = (runtimeEventStream as unknown as { source?: EventSource }).source;
      setRuntimeConnected(Boolean(source));
    }, 2000);
    return () => { unsubscribeRuntime(); unsubscribeEvents(); window.clearInterval(heartbeat); };
  }, []);

  const gates = useMemo<Gate[]>(() => [
    { label: 'AIOS RUNTIME', status: runtimeState.lastTransitionAt > 0 ? 'PASS' : 'BLOCKED', detail: runtimeState.systemState },
    { label: 'EVENT STREAM', status: runtimeConnected ? 'ACTIVE' : 'PENDING', detail: eventCount ? `${eventCount} events` : 'awaiting telemetry' },
    { label: 'COMMAND FABRIC', status: runtimeState.lastCommand ? 'ACTIVE' : 'PASS', detail: runtimeState.lastCommand ? runtimeState.lastCommand.type : 'ready' },
    { label: 'GOVERNANCE', status: 'PASS', detail: 'execution gate present' },
    { label: 'OBSERVABILITY', status: runtimeConnected ? 'PASS' : 'PENDING', detail: lastEventAt ? 'live signal received' : 'waiting for signal' },
    { label: 'DEPLOYMENT GATE', status: 'PENDING', detail: 'CI/build verification required' },
  ], [eventCount, lastEventAt, runtimeConnected, runtimeState]);

  const passed = gates.filter((gate) => gate.status === 'PASS' || gate.status === 'ACTIVE').length;
  const percentage = Math.round((passed / gates.length) * 100);
  const overall: GateStatus = gates.some((gate) => gate.status === 'BLOCKED') ? 'BLOCKED' : percentage === 100 ? 'PASS' : 'ACTIVE';

  return (
    <aside aria-live="polite" aria-label="Production readiness live status" className="fixed top-2 left-1/2 z-[90] w-[min(920px,calc(100vw-24px))] -translate-x-1/2 pointer-events-none">
      <div className="glass-panel overflow-hidden rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,.28)]">
        <div className="flex min-h-9 items-center gap-3 px-3 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative flex h-5 w-5 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-400/5"><GitBranch className="h-3 w-3 text-cyan-300" /><span className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${overall === 'BLOCKED' ? 'bg-red-400' : overall === 'PASS' ? 'bg-lime-300' : 'bg-cyan-300'}`} /></div>
            <div><div className="font-mono-tech text-[9px] font-bold tracking-[0.14em] text-zinc-100">PRODUCTION READINESS</div><div className="font-mono-tech text-[7px] tracking-wider text-zinc-600">LIVE ARCHOS / ULTRON GATE MONITOR</div></div>
          </div>
          <div className="hidden min-w-0 flex-1 items-center gap-1 md:flex">{gates.map((gate) => <div key={gate.label} className="min-w-0 flex-1 border-l border-white/5 px-2"><div className={`flex items-center gap-1 font-mono-tech text-[7px] font-bold tracking-wider ${statusClass[gate.status]}`}>{statusGlyph(gate.status)}<span className="truncate">{gate.label}</span></div><div className="truncate font-mono-tech text-[7px] text-zinc-600">{gate.detail}</div></div>)}</div>
          <div className="ml-auto flex shrink-0 items-center gap-3"><div className="flex items-center gap-1 font-mono-tech text-[8px] text-zinc-500"><Wifi className="h-3 w-3" />{runtimeConnected ? 'LIVE' : 'WAIT'}</div><div className={`font-mono-tech text-[10px] font-bold tabular-nums ${statusClass[overall]}`}>{percentage}%</div></div>
        </div>
        <div className="h-px bg-white/5"><div className={`h-full transition-[width] duration-500 ${overall === 'BLOCKED' ? 'bg-red-400' : 'bg-cyan-300'}`} style={{ width: `${percentage}%` }} /></div>
      </div>
    </aside>
  );
};
