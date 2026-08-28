// ArchOS Unified Reality Canvas
// The center viewport that dynamically transforms depending on active operational mode:
// WORLD -> 3D UAE spatial environment (Authoritative reality)
// INFO -> Intelligence & evidence interrogation canvas
// SIMULATE -> Branching scenario tree & causal futures
// AGENTS -> Autonomous Agent Fabric orchestration graph

import React from 'react';
import { PrimaryMode, SimulationBranch, AutonomousAgentProcess } from '../../types/archosExperience';
import { UAE3DWorldModel, LandmarkPOI } from '../world/UAE3DWorldModel';
import { UAEIntelligenceEvent } from '../../types/continuousIntelligence';
import { IntelligenceEvidenceCanvas } from './IntelligenceEvidenceCanvas';
import { SimulationBranchingCanvas } from './SimulationBranchingCanvas';
import { AgentFabricCanvas } from './AgentFabricCanvas';

interface RealityCanvasProps {
  activeMode: PrimaryMode;
  events: UAEIntelligenceEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: UAEIntelligenceEvent) => void;
  selectedLandmarkId: string | null;
  onSelectLandmark: (landmark: LandmarkPOI) => void;
  targetCoords: [number, number, number] | null;
  branches: SimulationBranch[];
  selectedBranchId: string;
  onSelectBranch: (branch: SimulationBranch) => void;
  onBranchCreated: (branch: SimulationBranch) => void;
  agents: AutonomousAgentProcess[];
  selectedAgentId: string | null;
  onSelectAgent: (agent: AutonomousAgentProcess) => void;
  onExecutePrompt: (prompt: string) => void;
}

export const RealityCanvas: React.FC<RealityCanvasProps> = ({
  activeMode,
  events,
  selectedEventId,
  onSelectEvent,
  selectedLandmarkId,
  onSelectLandmark,
  targetCoords,
  branches,
  selectedBranchId,
  onSelectBranch,
  onBranchCreated,
  agents,
  selectedAgentId,
  onSelectAgent,
  onExecutePrompt
}) => {
  return (
    <main
      id="archos-reality-canvas"
      aria-label="Unified Reality Canvas Viewport"
      className="absolute inset-0 z-0 pl-64 pr-80 pt-14 pb-24 bg-[#000000] overflow-hidden"
    >
      {/* 1. WORLD MODE: 3D UAE SPATIAL DIGITAL TWIN */}
      {activeMode === 'WORLD' && (
        <div className="relative w-full h-full">
          <UAE3DWorldModel
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            selectedLandmarkId={selectedLandmarkId}
            onSelectLandmark={onSelectLandmark}
            operatingMode="WORLD"
            targetCoords={targetCoords}
          />
        </div>
      )}

      {/* 2. INFO MODE: INTELLIGENCE & EVIDENCE INTERROGATION */}
      {activeMode === 'INFO' && (
        <div className="relative w-full h-full">
          <IntelligenceEvidenceCanvas
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            onExecutePrompt={onExecutePrompt}
          />
        </div>
      )}

      {/* 3. SIMULATE MODE: SCENARIO BRANCHING TREE */}
      {activeMode === 'SIMULATE' && (
        <div className="relative w-full h-full">
          <SimulationBranchingCanvas
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranch={onSelectBranch}
            onBranchCreated={onBranchCreated}
          />
        </div>
      )}

      {/* 4. AGENTS MODE: AUTONOMOUS AGENT FABRIC */}
      {activeMode === 'AGENTS' && (
        <div className="relative w-full h-full">
          <AgentFabricCanvas
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
            onTriggerAgentTask={(_agentId, prompt) => onExecutePrompt(prompt)}
          />
        </div>
      )}
    </main>
  );
};
