import React, { useEffect, useMemo, useState } from 'react';
import { MODULES } from '../../modules/registry';
import { ultronEventBus } from '../../aios/events';
import { aiosRuntime, type AIOSRuntimeState } from '../../aios/runtime';

const POSITIONS = [
  [50, 12], [68, 18], [82, 32], [88, 50], [82, 68], [68, 82], [50, 88], [32, 82],
  [18, 68], [12, 50], [18, 32], [32, 18], [50, 24], [76, 50], [50, 76],
] as const;

const STAGE_CLASS: Record<string, string> = {
  IMAGINE: 'stage-imagine', DISCOVER: 'stage-discover', DESIGN: 'stage-design', PROVE: 'stage-prove',
  BUILD: 'stage-build', LIVE: 'stage-live', OBSERVE: 'stage-observe',
};

const ACTIVE_STATES = new Set(['LISTENING', 'THINKING', 'PROCESSING', 'EXECUTING', 'VERIFYING']);
type FlowPhase = 'command' | 'agent' | 'reasoning' | 'planning' | 'verification' | 'result';

const PHASE_LABEL: Record<FlowPhase, string> = {
  command: 'COMMAND', agent: 'AGENT FABRIC', reasoning: 'REASONING', planning: 'PLANNING', verification: 'VERIFICATION', result: 'RESULT',
};

export const ModuleConstellation: React.FC = () => {
  const modules = useMemo(() => Object.entries(MODULES), []);
  const [runtime, setRuntime] = useState<AIOSRuntimeState>(() => aiosRuntime.getState());
  const [flow, setFlow] = useState<{ phase: FlowPhase; key: number; agentId?: string }>({ phase: 'result', key: 0 });

  useEffect(() => aiosRuntime.subscribe(setRuntime), []);

  useEffect(() => {
    const disposers = [
      ultronEventBus.on('input.command', () => setFlow({ phase: 'command', key: Date.now() })),
      ultronEventBus.on('agent.lifecycle', ({ status, agentId }) => {
        if (status === 'started') setFlow({ phase: 'agent', key: Date.now(), agentId });
        if (status === 'completed') setFlow({ phase: 'result', key: Date.now(), agentId });
        if (status === 'failed') setFlow({ phase: 'result', key: Date.now(), agentId });
      }),
      ultronEventBus.on('intelligence.lifecycle', ({ phase, status }) => {
        if (status === 'started' && (phase === 'reasoning' || phase === 'planning' || phase === 'verification')) {
          setFlow({ phase, key: Date.now() });
        }
        if (status === 'completed' && phase === 'verification') setFlow({ phase: 'result', key: Date.now() });
      }),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, []);

  const activeIndex = useMemo(() => {
    if (!runtime.activeView) return -1;
    return modules.findIndex(([id]) => id.toLowerCase() === runtime.activeView?.toLowerCase());
  }, [modules, runtime.activeView]);

  const activePosition = activeIndex >= 0 ? POSITIONS[activeIndex % POSITIONS.length] : [50, 12];
  const systemActive = ACTIVE_STATES.has(runtime.systemState);

  return (
    <div
      className={`module-constellation ${systemActive ? 'fabric-active' : ''} flow-${flow.phase}`}
      data-runtime-state={runtime.systemState}
      data-active-module={runtime.activeView ?? 'global'}
      data-flow-phase={flow.phase}
      data-flow-key={flow.key}
      aria-label="ArchOS module constellation"
    >
      <svg className="module-constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="module-line-glow"><feGaussianBlur stdDeviation="0.45" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="module-flow-glow"><feGaussianBlur stdDeviation="0.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {modules.map(([id], index) => {
          const [x, y] = POSITIONS[index % POSITIONS.length];
          return <line key={id} x1="50" y1="50" x2={x} y2={y} className={`module-connection ${index === activeIndex ? 'is-active' : ''}`} filter="url(#module-line-glow)" />;
        })}
        <line className="module-flow-route" x1="50" y1="50" x2={activePosition[0]} y2={activePosition[1]} filter="url(#module-flow-glow)" />
        <circle className="module-flow-packet" key={flow.key} cx="50" cy="50" r="0.8" />
      </svg>
      <div className="module-orbit module-orbit-a" />
      <div className="module-orbit module-orbit-b" />
      <div className="module-flow-status" key={flow.key} aria-live="polite">
        <span className="module-flow-status-dot" />
        <strong>{PHASE_LABEL[flow.phase]}</strong>
        <small>{flow.agentId ? flow.agentId : runtime.activeView ?? 'AIOS CORE'}</small>
      </div>
      {modules.map(([id, module], index) => {
        const [x, y] = POSITIONS[index % POSITIONS.length];
        const active = index === activeIndex;
        const target = runtime.activeEntityId === id;
        return <button key={id} className={`module-node ${STAGE_CLASS[module.stage] ?? ''} ${active ? 'is-active' : ''} ${target ? 'is-target' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} title={`${module.title} · ${module.stage}`} aria-label={`Open ${module.title}`} aria-current={active ? 'true' : undefined}>
          <span className="module-node-pulse" /><span className="module-node-core" />
          <span className="module-node-label">{module.title}</span>
          <span className="module-node-stage">{active ? runtime.systemState : module.stage}</span>
        </button>;
      })}
    </div>
  );
};
