import React, { useEffect, useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { runtimeEventStream, RuntimeEvent } from '../../services/runtime/runtimeEventStream';

const MAX_EVENTS = 5;

export const RuntimePulseOverlay: React.FC = () => {
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const onEvent = (event: RuntimeEvent) => {
      setEvents((current) => [event, ...current].slice(0, MAX_EVENTS));
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

  return (
    <div
      aria-live="polite"
      aria-label="ArchOS runtime activity"
      className="fixed bottom-4 left-4 z-[70] w-[min(360px,calc(100vw-2rem))] pointer-events-none"
    >
      <div className="glass-panel rounded-2xl p-3 shadow-[0_0_30px_rgba(0,229,255,0.12)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="w-4 h-4 text-[#00e5ff]" />
              {connected && <span className="absolute -right-1 -top-1 w-1.5 h-1.5 rounded-full bg-[#d4ff00] shadow-[0_0_8px_rgba(212,255,0,0.9)]" />}
            </div>
            <span className="font-mono-tech text-[10px] font-bold tracking-[0.16em] text-white">RUNTIME PULSE</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-zinc-500">
            <Radio className="w-3 h-3" />
            {connected ? 'LIVE' : 'STANDBY'}
          </div>
        </div>

        <div className="space-y-1 max-h-32 overflow-hidden">
          {events.length === 0 ? (
            <div className="text-[9px] font-mono-tech text-zinc-600 py-1">Awaiting J.A.R.V.I.S. runtime events…</div>
          ) : events.map((event) => (
            <div key={event.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_rgba(0,229,255,0.7)] shrink-0" />
              <span className="font-mono-tech text-[9px] text-zinc-300 truncate">{event.type}</span>
              <span className="ml-auto font-mono-tech text-[8px] text-zinc-600">{event.source || 'AIOS'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
