import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, CircleAlert, Wifi } from 'lucide-react';
import { aiosRuntime } from '../../aios/runtime';
import { runtimeEventStream, RuntimeEvent } from '../../services/runtime/runtimeEventStream';

type GateStatus = 'PASS' | 'ACTIVE' | 'PENDING' | 'BLOCKED';
interface Gate { label: string; status: GateStatus; detail: string; }

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
    { label: 'AIOS', status: runtimeState.lastTransitionAt > 0 ? 'PASS' : 'BLOCKED', detail: runtimeState.systemState },
    { label: 'EVENTS', status: runtimeConnected ? 'ACTIVE' : 'PENDING', detail: eventCount ? `${eventCount} events` : 'awaiting signal' },
    { label: 'COMMANDS', status: runtimeState.lastCommand ? 'ACTIVE' : 'PASS', detail: runtimeState.lastCommand ? runtimeState.lastCommand.type : 'ready' },
    { label: 'GOVERNANCE', status: 'PASS', detail: 'gate present' },
    { label: 'OBSERVABILITY', status: runtimeConnected ? 'PASS' : 'PENDING', detail: lastEventAt ? 'signal received' : 'waiting' },
    { label: 'DEPLOY', status: 'PENDING', detail: 'CI verification required' },
  ], [eventCount, lastEventAt, runtimeConnected, runtimeState]);

  const passed = gates.filter((gate) => gate.status === 'PASS' || gate.status === 'ACTIVE').length;
  const percentage = Math.round((passed / gates.length) * 100);
  const blocked = gates.some((gate) => gate.status === 'BLOCKED');

  return (
    <div className="ultron-readiness" aria-live="polite" aria-label="Production readiness">
      <span className="ultron-readiness-dot" />
      <span className="ultron-readiness-title">PRODUCTION GATE</span>
      <span className="ultron-readiness-live"><Wifi size={9} /> {runtimeConnected ? 'LIVE' : 'WAIT'}</span>
      <div className="ultron-readiness-track"><span style={{ width: `${percentage}%`, background: blocked ? '#ef7676' : undefined }} /></div>
      <span className="ultron-readiness-value">{percentage}%</span>
      <span className="sr-only">{gates.map((gate) => `${gate.label}: ${gate.status} ${gate.detail}`).join('. ')}</span>
    </div>
  );
};
