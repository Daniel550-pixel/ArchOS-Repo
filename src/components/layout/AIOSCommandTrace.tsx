import React, { useEffect, useState } from 'react';
import { ultronEventBus } from '../../aios/events';
import './aios-command-trace.css';

type TracePhase = 'input' | 'intent' | 'agent' | 'reasoning' | 'planning' | 'verification' | 'result';
type TraceEntry = { id: number; phase: TracePhase; label: string; detail: string; status: 'active' | 'complete' | 'failed'; timestamp: number };

const PHASE_LABEL: Record<TracePhase, string> = { input: 'INPUT', intent: 'INTENT ENGINE', agent: 'AGENT FABRIC', reasoning: 'REASONING', planning: 'PLANNING', verification: 'VERIFICATION', result: 'RESULT' };
const MAX_ENTRIES = 7;

export const AIOSCommandTrace: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  const [entries, setEntries] = useState<TraceEntry[]>([]);
  useEffect(() => {
    const add = (phase: TracePhase, detail: string, status: TraceEntry['status'] = 'active') => setEntries((current) => [...current, { id: Date.now() + Math.random(), phase, label: PHASE_LABEL[phase], detail, status, timestamp: Date.now() }].slice(-MAX_ENTRIES));
    const disposers = [
      ultronEventBus.on('input.command', ({ command, source }) => { add('input', String(command.intent || command.action || `Command from ${source}`)); add('intent', 'Intent accepted by AIOS'); }),
      ultronEventBus.on('agent.lifecycle', ({ agentId, status }) => { if (status === 'started') add('agent', agentId); if (status === 'completed') add('result', `${agentId} completed`, 'complete'); if (status === 'failed') add('result', `${agentId} failed`, 'failed'); }),
      ultronEventBus.on('intelligence.lifecycle', ({ phase, status }) => { const tracePhase = phase as Exclude<TracePhase, 'input' | 'intent' | 'agent' | 'result'>; add(tracePhase, status === 'started' ? `${PHASE_LABEL[tracePhase]} active` : `${PHASE_LABEL[tracePhase]} ${status}`, status === 'failed' ? 'failed' : status === 'completed' ? 'complete' : 'active'); }),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, []);
  if (!visible || entries.length === 0) return null;
  return <aside className="aios-command-trace" aria-live="polite" aria-label="AIOS command trace">
    <header className="aios-trace-header"><span><i /> COMMAND TRACE</span><button type="button" onClick={() => setEntries([])} aria-label="Clear command trace">CLEAR</button></header>
    <div className="aios-trace-stream">{entries.map((entry) => <div key={entry.id} className={`aios-trace-entry is-${entry.status}`}><span className="aios-trace-time">{new Date(entry.timestamp).toLocaleTimeString([], { hour12: false })}</span><span className="aios-trace-marker" /><div className="aios-trace-copy"><strong>{entry.label}</strong><span>{entry.detail}</span></div></div>)}</div>
  </aside>;
};
export default AIOSCommandTrace;
