import { createAIOSTraceId } from './events';
import { temporalControlPlane } from './temporalControlPlane';
import { worldStateTemporal, type WorldEntitySnapshot, type WorldStateSnapshot } from './worldStateTemporal';

export interface SimulationParameter { id: string; value: unknown; description?: string; }
export interface ProjectedWorldState { id: string; step: number; timestamp: number; state: WorldStateSnapshot; changedEntities: readonly string[]; deltaFingerprint: string; }
export interface WorldSimulation { id: string; branchId: string; sourceSnapshotId: string; createdAt: number; status: 'READY' | 'RUNNING' | 'COMPLETED' | 'ABORTED'; horizon: number; step: number; parameters: readonly SimulationParameter[]; projections: readonly ProjectedWorldState[]; }
const simulations = new Map<string, WorldSimulation>();
function clone<T>(value: T): T { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)) as T; }
function fingerprint(value: unknown): string { const text = JSON.stringify(value); let hash = 2166136261; for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619); return (hash >>> 0).toString(16); }

export const worldSimulation = {
  create(branchId: string, horizon = 12, parameters: readonly SimulationParameter[] = []): WorldSimulation | null {
    const branch = temporalControlPlane.getBranch(branchId); if (!branch) return null;
    const simulation: WorldSimulation = { id: createAIOSTraceId(), branchId, sourceSnapshotId: branch.snapshot.id, createdAt: Date.now(), status: 'READY', horizon: Math.max(1, Math.min(1000, Math.floor(horizon))), step: 0, parameters: clone(parameters), projections: [] };
    simulations.set(simulation.id, simulation); return simulation;
  },
  step(simulationId: string, mutations: readonly { entityId: string; value: unknown; kind?: WorldEntitySnapshot['kind'] }[] = []): ProjectedWorldState | null {
    const simulation = simulations.get(simulationId); if (!simulation || simulation.status === 'COMPLETED' || simulation.status === 'ABORTED' || simulation.step >= simulation.horizon) return null;
    const branch = temporalControlPlane.getBranch(simulation.branchId); if (!branch) return null;
    const previous = simulation.projections.at(-1)?.state ?? branch.snapshot;
    let next = worldStateTemporal.fork(previous);
    for (const mutation of mutations) next = worldStateTemporal.applyHypothetical(next, mutation.entityId, mutation.value, mutation.kind ?? 'simulation');
    const diff = worldStateTemporal.diff(previous, next);
    const projection: ProjectedWorldState = { id: createAIOSTraceId(), step: simulation.step + 1, timestamp: next.timestamp + (simulation.step + 1) * 86400000, state: { ...next, id: createAIOSTraceId(), timestamp: next.timestamp + (simulation.step + 1) * 86400000 }, changedEntities: [...diff.changed, ...diff.added, ...diff.removed], deltaFingerprint: fingerprint(diff) };
    const nextSimulation: WorldSimulation = { ...simulation, status: 'RUNNING', step: projection.step, projections: [...simulation.projections, projection] };
    simulations.set(simulationId, nextSimulation);
    if (nextSimulation.step >= nextSimulation.horizon) simulations.set(simulationId, { ...nextSimulation, status: 'COMPLETED' });
    return projection;
  },
  run(simulationId: string, mutationSchedule: readonly (readonly { entityId: string; value: unknown; kind?: WorldEntitySnapshot['kind'] }[])[] = []): WorldSimulation | null {
    let simulation = simulations.get(simulationId); if (!simulation) return null;
    while (simulation.step < simulation.horizon && simulation.status !== 'ABORTED') { this.step(simulationId, mutationSchedule[simulation.step] ?? []); simulation = simulations.get(simulationId)!; }
    return simulation;
  },
  abort(simulationId: string): boolean { const simulation = simulations.get(simulationId); if (!simulation || simulation.status === 'COMPLETED') return false; simulations.set(simulationId, { ...simulation, status: 'ABORTED' }); return true; },
  get(simulationId: string): WorldSimulation | null { return simulations.get(simulationId) ?? null; },
  list(): readonly WorldSimulation[] { return [...simulations.values()]; },
  clear(): void { simulations.clear(); },
};
