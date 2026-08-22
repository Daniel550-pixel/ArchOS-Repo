import React, { useMemo } from 'react';
import { MODULES } from '../../modules/registry';

const POSITIONS = [
  [50, 12], [68, 18], [82, 32], [88, 50], [82, 68], [68, 82], [50, 88], [32, 82],
  [18, 68], [12, 50], [18, 32], [32, 18], [50, 24], [76, 50], [50, 76],
] as const;

const STAGE_CLASS: Record<string, string> = {
  IMAGINE: 'stage-imagine', DISCOVER: 'stage-discover', DESIGN: 'stage-design', PROVE: 'stage-prove',
  BUILD: 'stage-build', LIVE: 'stage-live', OBSERVE: 'stage-observe',
};

export const ModuleConstellation: React.FC = () => {
  const modules = useMemo(() => Object.entries(MODULES), []);

  return (
    <div className="module-constellation" aria-label="ArchOS module constellation">
      <svg className="module-constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="module-line-glow"><feGaussianBlur stdDeviation="0.45" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {modules.map(([id], index) => {
          const [x, y] = POSITIONS[index % POSITIONS.length];
          return <line key={id} x1="50" y1="50" x2={x} y2={y} className="module-connection" filter="url(#module-line-glow)" />;
        })}
      </svg>
      <div className="module-orbit module-orbit-a" />
      <div className="module-orbit module-orbit-b" />
      {modules.map(([id, module], index) => {
        const [x, y] = POSITIONS[index % POSITIONS.length];
        return (
          <button
            key={id}
            className={`module-node ${STAGE_CLASS[module.stage] ?? ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            title={`${module.title} · ${module.stage}`}
            aria-label={`Open ${module.title}`}
          >
            <span className="module-node-pulse" />
            <span className="module-node-core" />
            <span className="module-node-label">{module.title}</span>
            <span className="module-node-stage">{module.stage}</span>
          </button>
        );
      })}
    </div>
  );
};
