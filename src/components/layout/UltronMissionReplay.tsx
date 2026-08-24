import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, GitBranch, Pause, Play, RotateCcw, ShieldCheck, SkipBack, SkipForward, ChevronRight, X } from 'lucide-react';
import { missionReplay, type MissionReplaySession } from '../../aios/missionReplay';
import { sessionIntelligence } from '../../aios/sessionIntelligence';
import { aiosRuntime } from '../../aios/runtime';
import { speechService } from '../../services/voice/speechService';

const SPEEDS = [0.5, 1, 2, 4] as const;
type Props = { open: boolean; onClose: () => void };

function formatRelative(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}
function eventLabel(kind: MissionReplaySession['frames'][number]['record']['kind']): string { return kind === 'world' ? 'WORLD' : kind.toUpperCase(); }
function commandTitle(command: MissionReplaySession['frames'][number]['record']['command']): string | null {
  return command?.type === 'REQUEST_EXECUTION' ? command.payload.title : null;
}
function commandIntent(command: MissionReplaySession['frames'][number]['record']['command']): string | null {
  return command?.type === 'REQUEST_EXECUTION' ? command.payload.intent : null;
}

export const UltronMissionReplay: React.FC<Props> = ({ open, onClose }) => {
  const [sessions, setSessions] = useState(sessionIntelligence.list());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [replay, setReplay] = useState<MissionReplaySession | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => sessionIntelligence.subscribe(() => setSessions(sessionIntelligence.list())), []);
  useEffect(() => {
    if (!open) return;
    const active = sessionIntelligence.getActive();
    setSessionId(current => current ?? active?.id ?? sessions.at(-1)?.sessionId ?? null);
  }, [open, sessions]);
  useEffect(() => {
    const next = sessionId ? missionReplay.getSession(sessionId) : null;
    setReplay(next); setFrameIndex(0); setPlaying(false);
  }, [sessionId]);
  useEffect(() => {
    if (!open || !playing || !replay?.frames.length) return;
    const frame = replay.frames[frameIndex];
    const next = replay.frames[frameIndex + 1];
    if (!next) { setPlaying(false); return; }
    const delay = Math.max(80, (next.timestamp - frame.timestamp) / speed);
    const timer = window.setTimeout(() => setFrameIndex(index => Math.min(index + 1, replay.frames.length - 1)), delay);
    return () => window.clearTimeout(timer);
  }, [open, playing, replay, frameIndex, speed]);

  const current = replay?.frames[frameIndex] ?? null;
  const progress = replay?.frames.length ? frameIndex / Math.max(1, replay.frames.length - 1) : 0;
  const selectedSummary = useMemo(() => sessions.find(item => item.sessionId === sessionId), [sessions, sessionId]);
  if (!open) return null;

  const seek = (value: number) => {
    const max = Math.max(0, (replay?.frames.length ?? 1) - 1);
    setFrameIndex(Math.min(max, Math.max(0, Math.round(value * max))));
  };
  const inspect = () => {
    if (!current) return;
    aiosRuntime.setContext('replay', current.record.traceId, 'mission-replay', current.record.parentTraceId);
    speechService.speak(`Replay inspection. ${eventLabel(current.record.kind)} event at ${formatRelative(current.relativeMs)}.`);
  };

  return <div className="ultron-replay-shell" role="dialog" aria-modal="true" aria-label="ULTRON Mission Replay">
    <div className="ultron-replay-backdrop" onClick={onClose}/>
    <section className="ultron-replay-panel">
      <header className="ultron-replay-header">
        <div><span className="ultron-replay-kicker"><span/> ULTRON / TEMPORAL INTELLIGENCE</span><h2>Mission Replay</h2><p>Reconstruct execution, inspect provenance, and navigate the AIOS trace without re-running it.</p></div>
        <button className="ultron-replay-close" onClick={onClose} aria-label="Close replay"><X/></button>
      </header>
      <div className="ultron-replay-grid">
        <aside className="ultron-replay-sessions">
          <div className="ultron-replay-section-title">SESSIONS <span>{sessions.length}</span></div>
          {sessions.length === 0 && <div className="ultron-replay-empty">No recorded missions yet.</div>}
          {sessions.slice().reverse().map(item => <button key={item.sessionId} className={item.sessionId === sessionId ? 'is-active' : ''} onClick={() => setSessionId(item.sessionId)}>
            <span className="session-status" data-status={item.status}/><strong>{item.sessionId.slice(0, 8)}</strong><small>{item.commandCount} commands · {item.status}</small><em>{new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</em>
          </button>)}
        </aside>
        <main className="ultron-replay-main">
          <div className="ultron-replay-metrics">
            <div><span>MISSION</span><strong>{selectedSummary?.sessionId.slice(0, 12) ?? '—'}</strong></div><div><span>FRAMES</span><strong>{replay?.frames.length ?? 0}</strong></div><div><span>TRACE IDS</span><strong>{replay?.traceIds.length ?? 0}</strong></div><div><span>INTEGRITY</span><strong className={replay?.integrityValid ? 'is-good' : 'is-bad'}>{replay?.integrityValid ? 'VALID' : 'DEGRADED'}</strong></div>
          </div>
          <div className="ultron-replay-track-wrap">
            <div className="ultron-replay-track" onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); seek((e.clientX - rect.left) / rect.width); }}>
              <span className="ultron-replay-track-fill" style={{ width: `${progress * 100}%` }}/>
              {(replay?.frames ?? []).map((frame, index) => <button key={frame.record.id} className={`replay-marker replay-${frame.record.kind}`} style={{ left: `${((replay?.frames.length ?? 1) === 1 ? 0 : index / ((replay?.frames.length ?? 1) - 1)) * 100}%` }} onClick={e => { e.stopPropagation(); setFrameIndex(index); }} aria-label={`Frame ${index + 1}`}/>) }
              <span className="ultron-replay-playhead" style={{ left: `${progress * 100}%` }}/>
            </div>
            <div className="ultron-replay-time"><span>00:00</span><strong>{current ? formatRelative(current.relativeMs) : '00:00'}</strong><span>{replay?.frames.at(-1) ? formatRelative(replay.frames.at(-1)!.relativeMs) : '00:00'}</span></div>
          </div>
          <div className="ultron-replay-controls">
            <button onClick={() => setFrameIndex(0)} title="First frame"><SkipBack/></button><button onClick={() => setFrameIndex(i => Math.max(0, i - 1))} title="Previous frame"><ChevronLeft/></button><button className="replay-play" onClick={() => setPlaying(value => !value)} disabled={!replay?.frames.length}>{playing ? <Pause/> : <Play/>}</button><button onClick={() => setFrameIndex(i => Math.min((replay?.frames.length ?? 1) - 1, i + 1))} title="Next frame"><ChevronRight/></button><button onClick={() => setFrameIndex(Math.max(0, (replay?.frames.length ?? 1) - 1))} title="Last frame"><SkipForward/></button><span className="replay-control-divider"/>{SPEEDS.map(value => <button key={value} className={speed === value ? 'is-speed' : ''} onClick={() => setSpeed(value)}>{value}×</button>)}
          </div>
          <div className="ultron-replay-event">
            <div className="replay-event-top"><span>{current ? eventLabel(current.record.kind) : 'NO FRAME'}</span><span>{current?.record.status?.toUpperCase() ?? 'IDLE'}</span></div>
            <h3>{commandTitle(current?.record.command) ?? current?.record.agentId ?? current?.record.worldEntityId ?? 'Awaiting replay frame'}</h3>
            <p>{commandIntent(current?.record.command) ?? (current?.record.phase ? `Intelligence phase: ${current.record.phase}` : current?.record.payload ? JSON.stringify(current.record.payload) : 'Select a frame to inspect its canonical execution record.')}</p>
            <div className="replay-event-meta"><span>TRACE <b>{current?.record.traceId ?? '—'}</b></span><span>PARENT <b>{current?.record.parentTraceId?.slice(0, 12) ?? 'ROOT'}</b></span><span>T+ <b>{current ? formatRelative(current.relativeMs) : '—'}</b></span></div>
          </div>
          <div className="ultron-replay-actions"><button onClick={inspect}><GitBranch/> Inspect runtime context</button><button onClick={() => { setFrameIndex(0); setPlaying(false); }}><RotateCcw/> Reset cursor</button><span className="replay-integrity"><ShieldCheck/> {replay?.missingTraceIds.length ? `${replay.missingTraceIds.length} MISSING TRACES` : 'TRACE RECONCILED'}</span></div>
        </main>
      </div>
    </section>
  </div>;
};
