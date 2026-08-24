import React, { useEffect, useMemo, useState } from 'react';
import { ultronEventBus } from '../../aios/events';
import './aios-command-trace.css';

type TracePhase = 'input' | 'intent' | 'agent' | 'reasoning' | 'planning' | 'verification' | 'result';
type TraceEntry = { id: number; phase: TracePhase; label: string; detail: string; status: 'active' | 'complete' | 'failed'; timestamp: number };

type StoredSession = { id: string; startedAt: number; updatedAt: number; entries: TraceEntry[]; title: string };

const PHASE_LABEL: Record<TracePhase, string> = { input: 'INPUT', intent: 'INTENT ENGINE', agent: 'AGENT FABRIC', reasoning: 'REASONING', planning: 'PLANNING', verification: 'VERIFICATION', result: 'RESULT' };
const MAX_ENTRIES = 7;
const MAX_SESSIONS = 20;
const STORAGE_KEY = 'archos.aios.command-sessions.v1';

const loadSessions = (): StoredSession[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_SESSIONS) : [];
  } catch { return []; }
};

export const AIOSCommandTrace: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  const [entries, setEntries] = useState<TraceEntry[]>([]);
  const [sessions, setSessions] = useState<StoredSession[]>(() => loadSessions());
  const [view, setView] = useState<'live' | 'history'>('live');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const persistSession = (nextEntries: TraceEntry[]) => {
    if (!nextEntries.length) return;
    setSessions((current) => {
      const now = Date.now();
      const existing = current.find((session) => session.id === nextEntries[0].id.toString());
      const title = nextEntries.find((entry) => entry.phase === 'input')?.detail || 'AIOS operation';
      const next: StoredSession = existing
        ? { ...existing, updatedAt: now, entries: nextEntries }
        : { id: nextEntries[0].id.toString(), startedAt: nextEntries[0].timestamp, updatedAt: now, entries: nextEntries, title };
      const updated = [next, ...current.filter((session) => session.id !== next.id)].slice(0, MAX_SESSIONS);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* storage is optional */ }
      return updated;
    });
  };

  useEffect(() => {
    const add = (phase: TracePhase, detail: string, status: TraceEntry['status'] = 'active') => {
      setEntries((current) => {
        const next = [...current, { id: Date.now() + Math.random(), phase, label: PHASE_LABEL[phase], detail, status, timestamp: Date.now() }].slice(-MAX_ENTRIES);
        persistSession(next);
        return next;
      });
    };
    const disposers = [
      ultronEventBus.on('input.command', ({ command, source }) => { add('input', String(command.intent || command.action || `Command from ${source}`)); add('intent', 'Intent accepted by AIOS'); }),
      ultronEventBus.on('agent.lifecycle', ({ agentId, status }) => { if (status === 'started') add('agent', agentId); if (status === 'completed') add('result', `${agentId} completed`, 'complete'); if (status === 'failed') add('result', `${agentId} failed`, 'failed'); }),
      ultronEventBus.on('intelligence.lifecycle', ({ phase, status }) => { const tracePhase = phase as Exclude<TracePhase, 'input' | 'intent' | 'agent' | 'result'>; add(tracePhase, status === 'started' ? `${PHASE_LABEL[tracePhase]} active` : `${PHASE_LABEL[tracePhase]} ${status}`, status === 'failed' ? 'failed' : status === 'completed' ? 'complete' : 'active'); }),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, []);

  const replayEntries = useMemo(() => sessions.find((session) => session.id === selectedSession)?.entries ?? [], [sessions, selectedSession]);

  const clearLive = () => setEntries([]);
  const clearHistory = () => {
    setSessions([]);
    setSelectedSession(null);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage is optional */ }
  };

  if (!visible || (entries.length === 0 && sessions.length === 0)) return null;
  const displayEntries = view === 'history' && selectedSession ? replayEntries : entries;

  return <aside className="aios-command-trace" aria-live="polite" aria-label="AIOS command trace">
    <header className="aios-trace-header">
      <span><i /> {view === 'history' ? 'SESSION INTELLIGENCE' : 'COMMAND TRACE'}</span>
      <div className="aios-trace-controls">
        <button type="button" className={view === 'live' ? 'is-active' : ''} onClick={() => { setView('live'); setSelectedSession(null); }}>LIVE</button>
        <button type="button" className={view === 'history' ? 'is-active' : ''} onClick={() => setView('history')}>HISTORY {sessions.length ? `· ${sessions.length}` : ''}</button>
        {view === 'live' && <button type="button" onClick={clearLive}>CLEAR</button>}
        {view === 'history' && <button type="button" onClick={clearHistory}>PURGE</button>}
      </div>
    </header>

    {view === 'history' && !selectedSession ? <div className="aios-trace-sessions">
      {sessions.map((session) => <button key={session.id} type="button" className="aios-trace-session" onClick={() => setSelectedSession(session.id)}>
        <span className="aios-trace-session-status" />
        <span><strong>{session.title}</strong><small>{new Date(session.updatedAt).toLocaleString([], { hour12: false })} · {session.entries.length} events</small></span>
        <b>→</b>
      </button>)}
    </div> : <div className="aios-trace-stream">
      {displayEntries.map((entry) => <div key={entry.id} className={`aios-trace-entry is-${entry.status}`}>
        <span className="aios-trace-time">{new Date(entry.timestamp).toLocaleTimeString([], { hour12: false })}</span>
        <span className="aios-trace-marker" />
        <div className="aios-trace-copy"><strong>{entry.label}</strong><span>{entry.detail}</span></div>
      </div>)}
      {view === 'history' && <button type="button" className="aios-trace-back" onClick={() => setSelectedSession(null)}>← BACK TO SESSION HISTORY</button>}
    </div>}
  </aside>;
};
export default AIOSCommandTrace;
