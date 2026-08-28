// ArchOS UAE Continuous Intelligence Operating Environment
// Production-grade spatial intelligence interface combining the 3D UAE World Model,
// 24/7 Automated Feedback Log, Temporal Navigation, and J.A.R.V.I.S. Command Execution.

import React, { useState, useEffect, useCallback } from 'react';
import {
  uaeContinuousIntelligence
} from '../../services/intelligence/uaeContinuousIntelligenceService';
import {
  UAEIntelligenceEvent,
  ContinuousIngestionStats,
  SinceLastSessionReport,
  TemporalWindow,
  IntelligenceDomain
} from '../../types/continuousIntelligence';
import {
  UAE3DWorldModel,
  LandmarkPOI,
  UAE_LANDMARKS,
  OperatingMode
} from '../world/UAE3DWorldModel';
import { AutomatedFeedbackLog } from '../intelligence/AutomatedFeedbackLog';
import { TemporalNavigationToolbar } from '../intelligence/TemporalNavigationToolbar';
import { SpatialEventInspectionCard } from '../intelligence/SpatialEventInspectionCard';
import { ArchOSTopHeader } from '../layout/ArchOSTopHeader';
import { ArchOSCommandDock } from '../command/ArchOSCommandDock';
import './ArchOSUnifiedSpatialCanvas.css';

export interface ArchOSUnifiedSpatialCanvasProps {
  initialMode?: OperatingMode;
}

export const ArchOSUnifiedSpatialCanvas: React.FC<ArchOSUnifiedSpatialCanvasProps> = ({
  initialMode = 'WORLD'
}) => {
  // Operating Mode
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(initialMode);

  // Intelligence State & Live Stream
  const [events, setEvents] = useState<UAEIntelligenceEvent[]>(() =>
    uaeContinuousIntelligence.getEvents('LIVE')
  );
  const [stats, setStats] = useState<ContinuousIngestionStats>(() =>
    uaeContinuousIntelligence.getStats()
  );
  const [sinceLastSessionReport] = useState<SinceLastSessionReport>(() =>
    uaeContinuousIntelligence.getSinceLastSessionReport()
  );

  // Filters & Temporal Horizon
  const [temporalWindow, setTemporalWindow] = useState<TemporalWindow>('LIVE');
  const [activeDomain, setActiveDomain] = useState<IntelligenceDomain | 'ALL'>('ALL');
  const [selectedEmirate, setSelectedEmirate] = useState<string>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Entity / Event for 3D Focus
  const [selectedEvent, setSelectedEvent] = useState<UAEIntelligenceEvent | null>(events[0] || null);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkPOI | null>(null);
  const [targetCoords, setTargetCoords] = useState<[number, number, number] | null>(
    events[0]?.coordinates || [0, 1, 0]
  );

  // Command Bar & Agent Execution Ticker
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [agentStatusMessage, setAgentStatusMessage] = useState<string | null>(
    '24/7 CONTINUOUS INTELLIGENCE · WORLD MODEL SYNCHRONIZED'
  );

  // Refresh filtered events
  const refreshEvents = useCallback(() => {
    const domain = activeDomain === 'ALL' ? undefined : activeDomain;
    const filtered = uaeContinuousIntelligence.getEvents(
      temporalWindow,
      domain,
      selectedEmirate,
      verifiedOnly,
      searchQuery
    );
    setEvents(filtered);
  }, [temporalWindow, activeDomain, selectedEmirate, verifiedOnly, searchQuery]);

  // Subscribe to live continuous intelligence stream
  useEffect(() => {
    const unsubEvents = uaeContinuousIntelligence.subscribe((_newEvent) => {
      refreshEvents();
    });

    const unsubStats = uaeContinuousIntelligence.subscribeStats((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubEvents();
      unsubStats();
    };
  }, [refreshEvents]);

  // Re-filter whenever filter parameters change
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Handle Event Selection
  const handleSelectEvent = useCallback((event: UAEIntelligenceEvent) => {
    setSelectedEvent(event);
    setSelectedLandmark(null);
    setTargetCoords(event.coordinates);
    setAgentStatusMessage(`SPATIAL FOCUS: ${event.entityName.toUpperCase()}`);
  }, []);

  // Handle Landmark Selection
  const handleSelectLandmark = useCallback((landmark: LandmarkPOI) => {
    setSelectedLandmark(landmark);
    setSelectedEvent(null);
    setTargetCoords(landmark.position);
    setAgentStatusMessage(`LANDMARK FOCUS: ${landmark.name.toUpperCase()}`);
  }, []);

  // Natural Language Command Execution
  const handleExecuteCommand = useCallback((rawQuery: string) => {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return;

    setIsProcessing(true);
    setAgentStatusMessage('AIOS AGENTS CORRELATING SPATIAL INTENT...');

    setTimeout(() => {
      setIsProcessing(false);

      if (q.includes('dubai') && (q.includes('today') || q.includes('develop'))) {
        setSelectedEmirate('Dubai');
        setTemporalWindow('LIVE');
        const dxbEvt = events.find(e => e.emirate === 'Dubai');
        if (dxbEvt) {
          setSelectedEvent(dxbEvt);
          setTargetCoords(dxbEvt.coordinates);
        }
        setAgentStatusMessage('FILTERED: DUBAI CONTINUOUS INTELLIGENCE');
      } else if (q.includes('abu dhabi') || q.includes('six hours')) {
        setSelectedEmirate('Abu Dhabi');
        setTemporalWindow('MINUS_6_HOURS');
        const auhEvt = events.find(e => e.emirate === 'Abu Dhabi');
        if (auhEvt) {
          setSelectedEvent(auhEvt);
          setTargetCoords(auhEvt.coordinates);
        }
        setAgentStatusMessage('FILTERED: ABU DHABI (PAST 6 HOURS)');
      } else if (q.includes('conflict') || q.includes('discrep')) {
        const conflictEvt = events.find(e => e.verificationState === 'CONFLICTING');
        if (conflictEvt) {
          setSelectedEvent(conflictEvt);
          setTargetCoords(conflictEvt.coordinates);
          setAgentStatusMessage('ISOLATED MULTI-SOURCE CONFLICT: AL MAKTOUM DWC');
        }
      } else if (q.includes('barakah') || q.includes('nuclear') || q.includes('energy')) {
        const barakahEvt = events.find(e => e.id === 'evt-auh-barakah-surge');
        if (barakahEvt) {
          setSelectedEvent(barakahEvt);
          setTargetCoords(barakahEvt.coordinates);
          setAgentStatusMessage('FOCUSED: BARAKAH CLEAN ENERGY COMPLEX');
        }
      } else if (q.includes('jebel ali') || q.includes('port') || q.includes('boxbay')) {
        const jebelEvt = events.find(e => e.id === 'evt-dxb-jebel-ali-boxbay');
        if (jebelEvt) {
          setSelectedEvent(jebelEvt);
          setTargetCoords(jebelEvt.coordinates);
          setAgentStatusMessage('FOCUSED: DP WORLD JEBEL ALI PORT');
        }
      } else if (q.includes('simulat') || q.includes('2035') || q.includes('corridor')) {
        setOperatingMode('SIMULATION');
        setAgentStatusMessage('SIMULATION ACTIVE: 2035 MULTIMODAL CORRIDOR PROJECTION');
      } else if (q.includes('yesterday') || q.includes('last session')) {
        setTemporalWindow('SINCE_LAST_SESSION');
        setAgentStatusMessage('APPLIED: SINCE LAST SESSION AGGREGATED DELTA');
      } else if (q.includes('90') || q.includes('verified')) {
        setVerifiedOnly(true);
        setAgentStatusMessage('FILTERED: HIGH CONFIDENCE (VERIFIED ONLY)');
      } else {
        // Fallback: search query filter
        setSearchQuery(rawQuery);
        setAgentStatusMessage(`QUERY APPLIED: "${rawQuery}"`);
      }
    }, 600);
  }, [events]);

  // Simulate Event Impact Action
  const handleSimulateEventImpact = useCallback((event: UAEIntelligenceEvent) => {
    setOperatingMode('SIMULATION');
    setAgentStatusMessage(`SIMULATING INFRASTRUCTURE IMPACT ON ${event.entityName.toUpperCase()}`);
  }, []);

  return (
    <div id="archos-viewport" className="relative w-screen h-screen bg-[#000000] overflow-hidden select-none font-sans text-white">
      {/* Top Header Telemetry Bar */}
      <ArchOSTopHeader
        stats={stats}
        operatingMode={operatingMode}
        onChangeOperatingMode={setOperatingMode}
        activeAgentsCount={stats.activeAgentsCount}
      />

      {/* Temporal Navigation Toolbar (Top Right) */}
      <TemporalNavigationToolbar
        currentWindow={temporalWindow}
        onSelectWindow={setTemporalWindow}
        sinceLastSessionReport={sinceLastSessionReport}
      />

      {/* 3D UAE Digital Twin World Model Viewport */}
      <div className="absolute inset-0 z-0">
        <UAE3DWorldModel
          events={events}
          selectedEventId={selectedEvent?.id || null}
          onSelectEvent={handleSelectEvent}
          selectedLandmarkId={selectedLandmark?.id || null}
          onSelectLandmark={handleSelectLandmark}
          operatingMode={operatingMode}
          targetCoords={targetCoords}
        />
      </div>

      {/* Floating 24/7 Automated Feedback Log (Left Side) */}
      <AutomatedFeedbackLog
        events={events}
        selectedEventId={selectedEvent?.id || null}
        onSelectEvent={handleSelectEvent}
        temporalWindow={temporalWindow}
        onTemporalChange={setTemporalWindow}
        activeDomain={activeDomain}
        onDomainChange={setActiveDomain}
        selectedEmirate={selectedEmirate}
        onEmirateChange={setSelectedEmirate}
        verifiedOnly={verifiedOnly}
        onToggleVerifiedOnly={() => setVerifiedOnly(!verifiedOnly)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Anchored Spatial Event Inspection Card (Bottom Right) */}
      {selectedEvent && (
        <SpatialEventInspectionCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSimulateScenario={handleSimulateEventImpact}
        />
      )}

      {/* J.A.R.V.I.S. Command Bar Dock (Bottom Center) */}
      <ArchOSCommandDock
        onExecuteCommand={handleExecuteCommand}
        isProcessing={isProcessing}
        agentStatusMessage={agentStatusMessage}
      />
    </div>
  );
};

export default ArchOSUnifiedSpatialCanvas;
