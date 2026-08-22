import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Brain, CheckCircle2, CircleAlert, GitBranch, Radio, ShieldCheck, Sparkles } from 'lucide-react';
import { runtimeEventStream, RuntimeEvent } from '../../services/runtime/runtimeEventStream';

const MAX_EVENTS = 8;

const phaseForEvent = (event: RuntimeEvent): string => {
  const type = event.type.toLowerCase();
  if (type.includes('jarvis') || type.includes('intent') || type.includes('plan')) return 'J.A.R.V.I.S.';
  if (type.includes('world_model') || type.includes('world-model')) return 'WORLD MODEL';
  if (type.includes('agent')) return 'AGENT FABRIC';
  if (type.includes('policy') || type.includes('governance')) return 'GOVERNANCE';
  if (type.includes('verify')) return 'VERIFICATION';
  if (type.includes('action')) return 'ACTION GATE';
  return 'AIOS RUNTIME';
};

const toneForEvent = (event: RuntimeEvent): string => {
  if (event.severity === 'error' || event.type.includes('failed') || event.type.includes('blocked')) return 'text-red-300';
  if (event.severity === 'warning' || event.type.includes('requested')) return 'text-amber-300';
  if (event.type.includes('completed') || event.type.includes('approved')) return 'text-lime-300';
  return 'text-zinc-300';
};

export const RuntimePulseOverlay: React.FC = () => {
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const onEvent = (event: RuntimeEvent) => {
      setEvents((current) => [event, ...current.filter((item) => item.id !== event.id)].slice(0, MAX_EVENTS));
      setConnected(true);
    };

    const unsubscribe = runtimeEventStream.subscribe(onEvent);
    runtimeEventStream.connect();
    const connectionCheck = window.setInterval(() => {
      setConnected(Boolean((runtimeEventStream as unknown as { source?: EventSource }).source));
    }, 2000);

    return () => {
      unsubscribe();
      window.clearInterval(connectionCheck);
    };
  }, []);

  const activePhase = useMemo(() => events[0] ? phaseForEvent(events[0]) : 'STANDBY', [events]);
  const errorCount = events.filter((event) => event.severity === 'error' || event.type.includes('failed') || event.type.includes('blocked')).length;
  const verifiedCount = events.filter((event) => event.type.includes('verified') || event.type.includes('approved') || event.type.includes('completed')).length;

  return (
    <aside
      aria-live="polite"
      aria-label="ArchOS intelligence runtime status"
      className="fixed bottom-4 left-4 z-[70] w-[min(430px,calc(100vw-2rem))] pointer-events-none"
    >
      <div className="glass-panel rounded-2xl overflow-hidden border border-[#00e5ff]/20 shadow-[0_0_40px_rgba(0,229,255,0.12)]">
        <div className="px-3 py-2 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative p-1.5 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/25">
                <Activity className="w-4 h-4 text-[#00e5ff]" />
                {connected && <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-[#d4ff00] shadow-[0_0_9px_rgba(212,255,0,0.9)]" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tech text-[10px] font-bold tracking-[0.16em] text-white">ULTRON RUNTIME</span>
                  <Sparkles className="w-3 h-3 text-[#d4ff00]" />
                </div>
                <div className="font-mono-tech text-[8px] text-zinc-500 tracking-wider">{activePhase}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-zinc-500">
              <Radio className="w-3 h-3" />
              {connected ? 'LIVE' : 'STANDBY'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/10">
          <div className="px-2 py-1.5 bg-black/20">
            <div className="text-[7px] text-zinc-600 font-mono-tech tracking-wider">PIPELINE</div>
            <div className="flex items-center gap-1 text-[9px] text-[#00e5ff] font-mono-tech mt-0.5"><GitBranch className="w-3 h-3" />{events.length ? 'ACTIVE' : 'IDLE'}</div>
          </div>
          <div className="px-2 py-1.5 bg-black/20">
            <div className="text-[7px] text-zinc-600 font-mono-tech tracking-wider">VERIFIED</div>
            <div className="flex items-center gap-1 text-[9px] text-lime-300 font-mono-tech mt-0.5"><ShieldCheck className="w-3 h-3" />{verifiedCount}</div>
          </div>
          <div className="px-2 py-1.5 bg-black/20">
            <div className="text-[7px] text-zinc-600 font-mono-tech tracking-wider">EXCEPTIONS</div>
            <div className={`flex items-center gap-1 text-[9px] font-mono-tech mt-0.5 ${errorCount ? 'text-red-300' : 'text-zinc-400'}`}><CircleAlert className="w-3 h-3" />{errorCount}</div>
          </div>
        </div>

        <div className="p-2.5 space-y-1 max-h-40 overflow-hidden">
          {events.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-2 text-[9px] font-mono-tech text-zinc-600">
              <Brain className="w-3 h-3" /> Awaiting J.A.R.V.I.S. intelligence events…
            </div>
          ) : events.map((event) => (
            <div key={event.id} className="flex items-center gap-2 rounded-lg bg-black/20 hover:bg-white/5 px-2 py-1.5 transition-colors">
              {event.type.includes('completed') || event.type.includes('approved') ? (
                <CheckCircle2 className="w-3 h-3 text-lime-300 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_rgba(0,229,255,0.7)] shrink-0" />
              )}
              <span className={`font-mono-tech text-[9px] truncate ${toneForEvent(event)}`}>{event.type}</span>
              <span className="ml-auto font-mono-tech text-[8px] text-zinc-600 shrink-0">{phaseForEvent(event)}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
