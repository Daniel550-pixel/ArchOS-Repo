// ArchOS UAE Continuous Intelligence Operating Environment
// Production-grade 5-Layer Spatial Intelligence Interface:
// Layer 1: System Nav Rail (Left)
// Layer 2: Reality Canvas (Center Viewport - WORLD, INFO, SIMULATE, AGENTS)
// Layer 3: Dynamic Context Panel (Right Rail)
// Layer 4: Universal Command Composer (Bottom Bar)
// Layer 5: Cross-Cutting System Trust Overlays (VERIFY, SECURITY, MEMORY, DATA FLOW)

import React, { useState, useEffect, useCallback } from 'react';
import {
  uaeContinuousIntelligence
} from '../../services/intelligence/uaeContinuousIntelligenceService';
import {
  simulationAndAgentService
} from '../../services/intelligence/simulationAndAgentService';
import {
  UAEIntelligenceEvent,
  ContinuousIngestionStats,
  SinceLastSessionReport,
  TemporalWindow,
  IntelligenceDomain
} from '../../types/continuousIntelligence';
import {
  PrimaryMode,
  SystemLayerModal,
  ContextSelection,
  SimulationBranch,
  AutonomousAgentProcess,
  SovereignDataFlowStats
} from '../../types/archosExperience';
import {
  LandmarkPOI,
  UAE_LANDMARKS
} from '../world/UAE3DWorldModel';

import { ArchOSTopHeader } from '../layout/ArchOSTopHeader';
import { SystemNavRail } from '../experience/SystemNavRail';
import { RealityCanvas } from '../experience/RealityCanvas';
import { ContextPanel } from '../experience/ContextPanel';
import { UniversalCommandComposer } from '../experience/UniversalCommandComposer';
import { SystemOverlaysModal } from '../experience/SystemOverlaysModal';
import './ArchOSUnifiedSpatialCanvas.css';

export interface ArchOSUnifiedSpatialCanvasProps {
  initialMode?: PrimaryMode;
}

export const ArchOSUnifiedSpatialCanvas: React.FC<ArchOSUnifiedSpatialCanvasProps> = ({
  initialMode = 'WORLD'
}) => {
  // 1. Primary Operational Mode (WORLD | INFO | SIMULATE | AGENTS)
  const [activeMode, setActiveMode] = useState<PrimaryMode>(initialMode);

  // 2. Supporting System Layer Modal (VERIFY | SECURITY | MEMORY | DATA_FLOW | null)
  const [activeSystemModal, setActiveSystemModal] = useState<SystemLayerModal>(null);

  // 3. Continuous Intelligence State
  const [events, setEvents] = useState<UAEIntelligenceEvent[]>(() =>
    uaeContinuousIntelligence.getEvents('LIVE')
  );
  const [stats, setStats] = useState<ContinuousIngestionStats>(() =>
    uaeContinuousIntelligence.getStats()
  );

  // 4. Simulation Branches & Agent Fabric State
  const [branches, setBranches] = useState<SimulationBranch[]>(() =>
    simulationAndAgentService.getBranches()
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    () => simulationAndAgentService.getBranches()[1]?.id || 'BR-00421'
  );
  const [agents, setAgents] = useState<AutonomousAgentProcess[]>(() =>
    simulationAndAgentService.getAgents()
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // 5. Selected Context & 3D Coordinates
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkPOI | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UAEIntelligenceEvent | null>(events[0] || null);
  const [targetCoords, setTargetCoords] = useState<[number, number, number] | null>(
    events[0]?.coordinates || [0, 1, 0]
  );

  // 6. Universal Command Execution State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [agentStatusMessage, setAgentStatusMessage] = useState<string | null>(
    '24/7 CONTINUOUS INTELLIGENCE · WORLD MODEL SYNCHRONIZED'
  );

  // Data flow statistics for the data flow overlay
  const dataFlowStats: SovereignDataFlowStats = {
    eventsPerMinute: 13421,
    entitiesUpdated: 3204,
    relationshipsChanged: 184,
    anomaliesDetected: 27,
    verificationConflicts: 8,
    simulationTriggers: 2,
    activeIngestionPipelines: 14,
    lastBatchHash: '0x9a4f2e1c7b8d0023'
  };

  // Subscribe to live intelligence updates
  useEffect(() => {
    const unsubEvents = uaeContinuousIntelligence.subscribe((_newEvent) => {
      setEvents(uaeContinuousIntelligence.getEvents('LIVE'));
    });

    const unsubStats = uaeContinuousIntelligence.subscribeStats((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubEvents();
      unsubStats();
    };
  }, []);

  // Compute dynamic context selection
  const currentContextSelection: ContextSelection = (() => {
    if (activeMode === 'SIMULATE') {
      const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
      return {
        type: 'SIMULATION_BRANCH',
        branch: activeBranch
      };
    }
    if (activeMode === 'AGENTS' && selectedAgentId) {
      const activeAgent = agents.find(a => a.id === selectedAgentId);
      if (activeAgent) {
        return {
          type: 'AGENT',
          agent: activeAgent
        };
      }
    }
    if (selectedLandmark) {
      return {
        type: 'LANDMARK',
        landmark: selectedLandmark
      };
    }
    if (selectedEvent) {
      return {
        type: 'EVENT',
        event: selectedEvent
      };
    }
    return {
      type: 'NATIONAL'
    };
  })();

  // Handlers for selection
  const handleSelectLandmark = useCallback((landmark: LandmarkPOI) => {
    setSelectedLandmark(landmark);
    setSelectedEvent(null);
    setSelectedAgentId(null);
    setTargetCoords(landmark.position);
    setAgentStatusMessage(`SPATIAL FOCUS: ${landmark.name.toUpperCase()}`);
  }, []);

  const handleSelectEvent = useCallback((event: UAEIntelligenceEvent) => {
    setSelectedEvent(event);
    setSelectedLandmark(null);
    setSelectedAgentId(null);
    setTargetCoords(event.coordinates);
    setAgentStatusMessage(`EVIDENCE FOCUS: ${event.entityName.toUpperCase()}`);
  }, []);

  const handleSelectBranch = useCallback((branch: SimulationBranch) => {
    setSelectedBranchId(branch.id);
    setAgentStatusMessage(`SIMULATION SCENARIO: ${branch.name.toUpperCase()}`);
  }, []);

  const handleBranchCreated = useCallback((branch: SimulationBranch) => {
    setBranches(simulationAndAgentService.getBranches());
    setSelectedBranchId(branch.id);
    setAgentStatusMessage(`SPAWNED EPHEMERAL BRANCH: ${branch.id}`);
  }, []);

  const handleSelectAgent = useCallback((agent: AutonomousAgentProcess) => {
    setSelectedAgentId(agent.id);
    setAgentStatusMessage(`AUDITING AGENT: ${agent.name.toUpperCase()}`);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedLandmark(null);
    setSelectedEvent(null);
    setSelectedAgentId(null);
    setAgentStatusMessage('CONTEXT RESET: NATIONAL SOVEREIGN OVERVIEW');
  }, []);

  // Universal Intent Execution
  const handleExecuteIntent = useCallback((rawQuery: string) => {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return;

    setIsProcessing(true);
    setAgentStatusMessage('AIOS INTENT PARSER ROUTING SEMANTIC QUERY...');

    setTimeout(() => {
      setIsProcessing(false);

      // 1. Simulation Intent
      if (q.includes('simulat') || q.includes('what if') || q.includes('what happens') || q.includes('2035')) {
        setActiveMode('SIMULATE');
        const created = simulationAndAgentService.createBranch({
          name: rawQuery.length > 50 ? `${rawQuery.slice(0, 47)}...` : rawQuery,
          variableName: 'Autonomous Infrastructure Variable',
          deltaValue: '+30% Target Capacity Shift',
          horizonYear: 2035
        });
        setBranches(simulationAndAgentService.getBranches());
        setSelectedBranchId(created.id);
        setAgentStatusMessage(`SIMULATION BRANCH CREATED: ${created.id}`);
      }
      // 2. 3D Spatial Landmark Intent
      else if (q.includes('barakah') || q.includes('nuclear')) {
        setActiveMode('WORLD');
        const barakahPOI = UAE_LANDMARKS.find(l => l.id === 'poi-barakah');
        if (barakahPOI) handleSelectLandmark(barakahPOI);
      } else if (q.includes('burj') || q.includes('khalifa') || q.includes('downtown')) {
        setActiveMode('WORLD');
        const burjPOI = UAE_LANDMARKS.find(l => l.id === 'poi-burj-khalifa');
        if (burjPOI) handleSelectLandmark(burjPOI);
      } else if (q.includes('jebel ali') || q.includes('port')) {
        setActiveMode('WORLD');
        const portPOI = UAE_LANDMARKS.find(l => l.id === 'poi-jebel-ali');
        if (portPOI) handleSelectLandmark(portPOI);
      }
      // 3. Intelligence / Info Query Intent
      else if (q.includes('what changed') || q.includes('analyse') || q.includes('correlate') || q.includes('news') || q.includes('conflict')) {
        setActiveMode('INFO');
        setAgentStatusMessage('INFO MODE: CONTINUOUS EVIDENCE STREAM FILTERED');
      }
      // 4. Agent Orchestration Intent
      else if (q.includes('agent') || q.includes('sentinel') || q.includes('orchestrat') || q.includes('rebalance')) {
        setActiveMode('AGENTS');
        const agent = agents[0];
        if (agent) setSelectedAgentId(agent.id);
        setAgentStatusMessage('AGENT FABRIC: EXECUTING REBALANCING OBJECTIVE');
      }
      // 5. Default General Routing
      else {
        setActiveMode('INFO');
        setAgentStatusMessage(`INTERROGATION EXECUTED: "${rawQuery}"`);
      }
    }, 500);
  }, [agents, handleSelectLandmark]);

  return (
    <div
      id="archos-viewport"
      className="relative w-screen h-screen bg-[#000000] overflow-hidden select-none font-sans text-white"
    >
      {/* 1. Top Header Telemetry Bar */}
      <ArchOSTopHeader
        stats={stats}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onOpenSystemOverlay={setActiveSystemModal}
        activeAgentsCount={agents.length}
      />

      {/* 2. System Navigation Rail (Left) */}
      <SystemNavRail
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onOpenSystemOverlay={setActiveSystemModal}
        activeAgentsCount={agents.length}
      />

      {/* 3. Center Reality Canvas (WORLD / INFO / SIMULATE / AGENTS) */}
      <RealityCanvas
        activeMode={activeMode}
        events={events}
        selectedEventId={selectedEvent?.id || null}
        onSelectEvent={handleSelectEvent}
        selectedLandmarkId={selectedLandmark?.id || null}
        onSelectLandmark={handleSelectLandmark}
        targetCoords={targetCoords}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={handleSelectBranch}
        onBranchCreated={handleBranchCreated}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onExecutePrompt={handleExecuteIntent}
      />

      {/* 4. Dynamic Context Inspector (Right Rail) */}
      <ContextPanel
        selection={currentContextSelection}
        onClearSelection={handleClearSelection}
        onSelectMode={setActiveMode}
        onTriggerSimulationWithEntity={(entityName) => {
          handleExecuteIntent(`Simulate infrastructure impact on ${entityName}`);
        }}
        onSelectEvent={handleSelectEvent}
      />

      {/* 5. Universal Command & Intent Composer (Bottom Center) */}
      <UniversalCommandComposer
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onExecuteIntent={handleExecuteIntent}
        isProcessing={isProcessing}
        agentStatusMessage={agentStatusMessage}
      />

      {/* 6. Supporting System Overlays Modal (VERIFY, SECURITY, MEMORY, DATA_FLOW) */}
      <SystemOverlaysModal
        activeModal={activeSystemModal}
        onClose={() => setActiveSystemModal(null)}
        dataFlowStats={dataFlowStats}
      />
    </div>
  );
};

export default ArchOSUnifiedSpatialCanvas;
