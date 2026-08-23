import React, { useEffect, useMemo, useState } from 'react';
import { MODULES } from '../../modules/registry';
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

export const ModuleConstellation: React.FC = () => {
  const modules = useMemo(() => Object.entries(MODULES), []);
  const [runtime, setRuntime] = useState<AIOSRuntimeState>(() => aiosRuntime.getState());

  useEffect(() => aiosRuntime.subscribe(setRuntime), []);

  const activeIndex = useMemo(() => {
    if (!runtime.activeView) return -1;
    return modules.findIndex(([id]) => id.toLowerCase() === runtime.activeView?.toLowerCase());
  }, [modules, runtime.activeView]);

  const systemActive = ACTIVE_STATES.has(runtime.systemState);

  return (
    <div className={`module-constellation ${systemActive ? 'fabric-active' : ''}`} data-runtime-state={runtime.systemState} data-active-module={runtime.activeView ?? 'global'} aria-label="ArchOS module constellation">
      <svg className="module-constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><filter id="module-line-glow"><feGaussianBlur stdDeviation="0.45" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        {modules.map(([id], index) => {
          const [x, y] = POSITIONS[index % POSITIONS.length];
          return <line key={id} x1="50" y1="50" x2={x} y2={y} className={`module-connection ${index === activeIndex ? 'is-active' : ''}`} filter="url(#module-line-glow)" />;
        })}
      </svg>
      <div className="module-orbit module-orbit-a" />
      <div className="module-orbit module-orbit-b" />
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
