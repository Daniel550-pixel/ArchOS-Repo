export type ArchOSModuleStatus = 'LIVE' | 'READY' | 'GUARDED';

export type ArchOSModule = {
  id: string;
  name: string;
  domain: string;
  status: ArchOSModuleStatus;
  capability: string;
  risk: 'READ_ONLY' | 'CONTROLLED' | 'HIGH_IMPACT';
  requiresApproval: boolean;
};

/** Canonical experience-facing module catalog. Backend capabilities remain authoritative. */
export const ARCHOS_MODULES: readonly ArchOSModule[] = [
  { id:'agent-fabric', name:'Agent Fabric', domain:'ORCHESTRATION', status:'LIVE', capability:'Specialist-agent routing, delegation and governed execution.', risk:'CONTROLLED', requiresApproval:true },
  { id:'world-model', name:'World Model', domain:'SPATIAL / TEMPORAL', status:'LIVE', capability:'Continuously evolving entities, signals and relationships.', risk:'READ_ONLY', requiresApproval:false },
  { id:'scenario-lab', name:'Scenario Lab', domain:'PREDICTION', status:'READY', capability:'Branch world state into isolated what-if futures.', risk:'READ_ONLY', requiresApproval:false },
  { id:'evidence-vault', name:'Evidence Vault', domain:'TRUST / PROVENANCE', status:'GUARDED', capability:'Evidence lineage, corroboration and integrity verification.', risk:'READ_ONLY', requiresApproval:false },
  { id:'sovereign-memory', name:'Sovereign Memory', domain:'MEMORY', status:'GUARDED', capability:'Durable context with explicit retention and access boundaries.', risk:'CONTROLLED', requiresApproval:true },
  { id:'autonomy-queue', name:'Autonomy Queue', domain:'WORKFLOWS', status:'READY', capability:'Long-running workflows with checkpoints and rollback.', risk:'HIGH_IMPACT', requiresApproval:true },
  { id:'system-pulse', name:'System Pulse', domain:'OBSERVABILITY', status:'LIVE', capability:'Runtime health, latency, event throughput and degradation.', risk:'READ_ONLY', requiresApproval:false },
  { id:'extension-mesh', name:'Extension Mesh', domain:'ADD-ONS', status:'READY', capability:'Isolated modules, connectors and capability packages.', risk:'CONTROLLED', requiresApproval:true },
  { id:'causal-explorer', name:'Causal Explorer', domain:'REASONING', status:'READY', capability:'Trace causal graphs, counterfactual dependencies and intervention paths.', risk:'READ_ONLY', requiresApproval:false },
  { id:'decision-theater', name:'Decision Theater', domain:'EXECUTIVE INTELLIGENCE', status:'READY', capability:'Compare evidence-backed decisions across scenarios and objectives.', risk:'READ_ONLY', requiresApproval:false },
  { id:'reality-lens', name:'Reality Lens', domain:'MULTIMODAL', status:'READY', capability:'Fuse vision, voice, gesture and spatial observations into model context.', risk:'CONTROLLED', requiresApproval:true },
  { id:'mission-replay', name:'Mission Replay', domain:'TEMPORAL FORENSICS', status:'GUARDED', capability:'Replay event streams, agent decisions and evidence states for audit.', risk:'READ_ONLY', requiresApproval:false },
];

export const getArchOSModule = (id: string) => ARCHOS_MODULES.find(module => module.id === id);
