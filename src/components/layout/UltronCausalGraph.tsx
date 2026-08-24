import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, GitBranch, ShieldCheck } from 'lucide-react';
import { causalGraph, type CausalGraphNode } from '../../aios/causalGraph';

type Props = { sessionId: string | null; traceId?: string | null; onSelectTrace?: (traceId: string, frameIndex: number) => void };

export const UltronCausalGraph: React.FC<Props> = ({ sessionId, traceId, onSelectTrace }) => {
  const [expanded, setExpanded] = useState(true);
  const graph = useMemo(() => sessionId ? causalGraph.build(sessionId) : null, [sessionId, traceId]);
  if (!sessionId) return <div className="ultron-causal-empty">SELECT A MISSION TO LOAD CAUSALITY</div>;
  if (!graph) return <div className="ultron-causal-empty">CAUSAL GRAPH UNAVAILABLE</div>;
  const selected = traceId ? new Set(causalGraph.lineage(sessionId, traceId).map(node => node.traceId)) : new Set<string>();
  const depths = [...new Set(graph.nodes.map(node => node.depth))].sort((a, b) => a - b);
  const children = new Map<string, CausalGraphNode[]>();
  graph.nodes.forEach(node => { if (node.parentTraceId) children.set(node.parentTraceId, [...(children.get(node.parentTraceId) ?? []), node]); });
  const node = (item: CausalGraphNode) => <button key={item.traceId} className={`ultron-causal-node ${selected.has(item.traceId) ? 'is-selected' : ''}`} onClick={() => onSelectTrace?.(item.traceId, item.frameIndex)} title={`${item.label} · ${item.traceId}`}><span className="ultron-causal-kind">{item.kind.toUpperCase()}</span><strong>{item.label}</strong><small>{item.status} · FRAME #{item.frameIndex + 1}</small><code>{item.traceId.slice(0, 12)}</code></button>;
  return <section className="ultron-causal-graph" aria-label="Execution causal graph"><header className="ultron-causal-header"><div><span><GitBranch/> CAUSAL GRAPH</span><b>{graph.nodes.length} NODES · {graph.edges.length} EDGES</b></div><button onClick={() => setExpanded(value => !value)} aria-label="Toggle causal graph">{expanded ? <ChevronDown/> : <ChevronRight/>}</button></header>{expanded && <><div className="ultron-causal-summary"><span><ShieldCheck/> {graph.cycles.length ? 'DEGRADED' : 'VALID'}</span><span>{graph.roots.length} ROOTS</span><span>{depths.length} DEPTHS</span></div><div className="ultron-causal-lanes">{depths.map(depth => <div className="ultron-causal-lane" key={depth}><span className="ultron-causal-depth">D{depth}</span><div className="ultron-causal-nodes">{graph.nodes.filter(item => item.depth === depth).map(node)}</div></div>)}</div>{graph.cycles.length > 0 && <div className="ultron-causal-warning"><AlertTriangle/> CAUSAL CYCLE DETECTED · {graph.cycles.length}</div>}<div className="ultron-causal-legend">Click a node to synchronize the replay cursor with its historical frame.</div></>}</section>;
};
