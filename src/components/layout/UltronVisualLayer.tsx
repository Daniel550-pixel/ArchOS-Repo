import React, { useMemo } from 'react';
import { ARCHOS_MODULES } from '../../aios/moduleRegistry';
import './ultron-visual.css';

const positions = [
  [50, 16], [73, 27], [84, 50], [71, 73], [50, 84], [28, 72], [16, 50], [28, 28],
];

export const UltronVisualLayer: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const modules = useMemo(() => ARCHOS_MODULES.slice(0, positions.length), []);
  if (!enabled) return null;
  return <div className="ultron-visual-layer" aria-hidden="true">
    <div className="ultron-atmosphere" />
    <div className="ultron-orbit ultron-orbit-a" />
    <div className="ultron-orbit ultron-orbit-b" />
    <svg className="ultron-constellation" viewBox="0 0 100 100" preserveAspectRatio="none">
      {positions.map(([x, y], i) => <line key={i} className="ultron-connection" x1="50" y1="50" x2={x} y2={y} />)}
    </svg>
    {modules.map((module, i) => <div key={module.id} className="ultron-node" style={{ left: `${positions[i][0]}%`, top: `${positions[i][1]}%` }}><span>{module.domain}</span><b>{module.name}</b><small>{module.status}</small></div>)}
    <div className="ultron-core-aura" />
  </div>;
};

export default UltronVisualLayer;
