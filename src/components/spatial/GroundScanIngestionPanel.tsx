import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Layers,
  Radio,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Database,
  Eye,
  Crosshair,
  Compass,
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';
import { GroundScanSession, SubsurfaceUtilityConflict } from '../../types/archosGroundScan';
import { groundScanService } from '../../services/archos/groundScanService';

interface GroundScanIngestionPanelProps {
  onSpeak?: (text: string) => void;
  onNavigateToWorldModel?: () => void;
}

export const GroundScanIngestionPanel: React.FC<GroundScanIngestionPanelProps> = ({
  onSpeak,
  onNavigateToWorldModel
}) => {
  const [sessions, setSessions] = useState<GroundScanSession[]>(groundScanService.getSessions());
  const [activeSession, setActiveSession] = useState<GroundScanSession>(groundScanService.getActiveSession());
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = groundScanService.subscribe((sess, act) => {
      setSessions(sess);
      setActiveSession(act);
    });
    return () => unsub();
  }, []);

  const handleTriggerLidar = () => {
    setIsScanning(true);
    groundScanService.triggerDroneLidarScan();
    setToastMessage('Autonomous DJI Matrice 350 LiDAR sweep deployed. +2.5M points ingesting...');
    setTimeout(() => {
      setIsScanning(false);
      setToastMessage('LiDAR Point Cloud Synchronized & GroundScan mesh updated.');
      setTimeout(() => setToastMessage(null), 3000);
    }, 2000);
  };

  const handleResolveConflict = (conflictId: string) => {
    groundScanService.resolveSubsurfaceConflict(conflictId);
    setToastMessage('Subsurface clearance resolved! Feasibility score elevated.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInjectToWorldModel = () => {
    groundScanService.injectSiteIntoWorldModel();
    setToastMessage(`Injected [${activeSession.targetName}] directly into World Model 14-Attribute Canonical Graph.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] text-[#f5f4f0] font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-[#09101c] border-b border-[#00e5ff]/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#d4ff00]" />
            <h2 className="text-base font-bold font-mono-tech tracking-wide text-white">
              UAE INTELLIGENCE & GROUNDSCAN INGESTION PIPELINE
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/40">
              CADASTRAL · LIDAR · GPR · MICROCLIMATE
            </span>
          </div>
          <p className="text-xs text-[#8e8d88] font-mono-tech">
            Continuous multi-modal site intelligence feeding directly into Design, Prove, and World Model graphs
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerLidar}
            disabled={isScanning}
            className="px-3.5 py-1.5 rounded-lg bg-[#d4ff00]/20 hover:bg-[#d4ff00]/30 text-[#d4ff00] text-xs font-mono-tech font-bold border border-[#d4ff00]/40 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,255,0,0.2)]"
          >
            <Radio className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'STREAMING LIDAR...' : 'TRIGGER DRONE LIDAR SWEEP'}</span>
          </button>
          <button
            onClick={handleInjectToWorldModel}
            className="px-3.5 py-1.5 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] text-xs font-mono-tech font-bold border border-[#00e5ff]/40 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
          >
            <Database className="w-3.5 h-3.5" />
            <span>INJECT INTO WORLD MODEL</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-[#d4ff00]/15 border border-[#d4ff00]/60 text-xs font-mono-tech text-[#d4ff00] flex items-center justify-between shadow-[0_0_15px_rgba(212,255,0,0.3)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#d4ff00]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#8e8d88] hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Plot Selector & GroundScan Workflow */}
        <div className="w-80 border-r border-[#00e5ff]/20 bg-[#070c18] flex flex-col p-4 space-y-4 overflow-y-auto">
          <div>
            <span className="text-[10px] font-mono-tech text-[#8e8d88] uppercase block mb-2">
              Select Sovereign Target Plot:
            </span>
            <div className="space-y-2">
              {sessions.map((sess) => {
                const isSelected = sess.scanId === activeSession.scanId;
                return (
                  <button
                    key={sess.scanId}
                    onClick={() => groundScanService.selectSession(sess.scanId)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-[#d4ff00]/15 border-[#d4ff00]/60 shadow-[0_0_10px_rgba(212,255,0,0.2)]'
                        : 'bg-[#09101c] border-[#00e5ff]/10 hover:border-[#00e5ff]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono-tech text-[#8e8d88] uppercase">
                        {sess.emirate} · Plot {sess.targetPlotId}
                      </span>
                      <span className="text-xs font-bold font-mono-tech text-[#d4ff00]">
                        {sess.scorecard.overallFeasibilityScore}/100
                      </span>
                    </div>
                    <h4 className="text-xs font-bold font-mono-tech text-white truncate">
                      {sess.targetName}
                    </h4>
                    <span className="text-[10px] font-mono-tech text-[#00e5ff] block mt-1">
                      {(sess.pointCloudSampleCount / 1000000).toFixed(1)}M LiDAR pts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pipeline Stages */}
          <div className="p-3.5 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
            <span className="text-[10px] font-mono-tech text-[#00e5ff] font-bold uppercase block">
              GroundScan 5-Stage Ingestion Pipeline:
            </span>
            <div className="space-y-1 text-xs font-mono-tech text-[#cbd5e1]">
              <div className="flex items-center gap-1.5 text-[#10b981]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1. Location & Cadastre
              </div>
              <div className="flex items-center gap-1.5 text-[#10b981]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2. Spatial Context (GIS)
              </div>
              <div className="flex items-center gap-1.5 text-[#10b981]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 3. GroundScan (LiDAR/GPR)
              </div>
              <div className="flex items-center gap-1.5 text-[#10b981]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 4. Site Intelligence Matrix
              </div>
              <div className="flex items-center gap-1.5 text-[#00e5ff]">
                <ArrowRight className="w-3.5 h-3.5" /> 5. World Model Injection
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Ingestion Streams & Scorecard */}
        <div className="flex-1 flex flex-col bg-[#050811] overflow-y-auto p-5 space-y-5">
          {/* Top Scorecard Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#09101c] border border-[#d4ff00]/30 space-y-1">
              <span className="text-[10px] text-[#8e8d88] font-mono-tech block uppercase">Overall Feasibility</span>
              <span className="text-xl font-bold font-mono-tech text-[#d4ff00]">
                {activeSession.scorecard.overallFeasibilityScore} / 100
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 space-y-1">
              <span className="text-[10px] text-[#8e8d88] font-mono-tech block uppercase">Max Height / FAR</span>
              <span className="text-xl font-bold font-mono-tech text-[#00e5ff]">
                {activeSession.scorecard.maxAllowableHeightMeters}m · FAR {activeSession.scorecard.floorAreaRatioFAR}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#09101c] border border-[#10b981]/30 space-y-1">
              <span className="text-[10px] text-[#8e8d88] font-mono-tech block uppercase">Power / Cooling Capacity</span>
              <span className="text-xl font-bold font-mono-tech text-[#10b981]">
                {activeSession.scorecard.utilityCapacityStatus.powerAvailableMva} MVA · {activeSession.scorecard.utilityCapacityStatus.chilledWaterAvailableTons} TR
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#09101c] border border-[#ec4899]/30 space-y-1">
              <span className="text-[10px] text-[#8e8d88] font-mono-tech block uppercase">LiDAR Density</span>
              <span className="text-xl font-bold font-mono-tech text-[#ec4899]">
                {(activeSession.pointCloudSampleCount / 1000000).toFixed(1)}M pts
              </span>
            </div>
          </div>

          {/* Active Ingestion Layers Stream */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono-tech text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00e5ff]" />
              LIVE MULTI-MODAL INGESTION STREAMS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeSession.activeLayers.map((lyr) => (
                <div key={lyr.layerId} className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono-tech font-bold text-[#00e5ff] bg-[#00e5ff]/15 px-2 py-0.5 rounded border border-[#00e5ff]/30">
                      {lyr.layerType.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-mono-tech font-bold ${
                        lyr.ingestionStatus === 'CONFLICT_DETECTED'
                          ? 'text-[#ef4444]'
                          : 'text-[#10b981]'
                      }`}
                    >
                      ● {lyr.ingestionStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold font-mono-tech text-white">{lyr.name}</h4>
                  <p className="text-[11px] text-[#cbd5e1] font-mono-tech leading-relaxed">
                    {lyr.featuresSummary}
                  </p>
                  <span className="text-[10px] text-[#8e8d88] font-mono-tech block truncate">
                    Provenance: {lyr.provenanceAttestation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subsurface Conflicts Resolution Section */}
          <div className="p-5 rounded-xl bg-[#09101c] border border-[#ef4444]/30 space-y-3">
            <h3 className="text-sm font-bold font-mono-tech text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              SUBSURFACE UTILITY CLASH & CLEARANCE RESOLVER
            </h3>

            {activeSession.scorecard.subsurfaceConflicts.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#050811] text-xs font-mono-tech text-[#10b981] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                Zero subsurface utility clashes detected. Clean clearance across high-voltage and chilled water trunks.
              </div>
            ) : (
              <div className="space-y-3">
                {activeSession.scorecard.subsurfaceConflicts.map((conf) => (
                  <div
                    key={conf.conflictId}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      conf.severity === 'CLEARED'
                        ? 'bg-[#050811] border-[#10b981]/30'
                        : 'bg-[#050811] border-[#ef4444]/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono-tech font-bold px-2 py-0.5 rounded ${
                            conf.severity === 'CLEARED'
                              ? 'bg-[#10b981]/20 text-[#10b981]'
                              : 'bg-[#ef4444]/20 text-[#ef4444]'
                          }`}
                        >
                          {conf.severity}
                        </span>
                        <span className="text-xs font-mono-tech font-bold text-white">
                          {conf.utilityType} (Depth: {conf.depthMslMeters}m MSL)
                        </span>
                      </div>
                      <p className="text-xs text-[#cbd5e1] font-mono-tech">
                        {conf.mitigationRecommendation}
                      </p>
                      <span className="text-[10px] text-[#8e8d88] font-mono-tech block">
                        Detected Clearance: {conf.detectedClearanceMeters}m (Required: {conf.clearanceRequiredMeters}m)
                      </span>
                    </div>

                    {conf.severity !== 'CLEARED' && (
                      <button
                        onClick={() => handleResolveConflict(conf.conflictId)}
                        className="px-4 py-2 rounded-lg bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] text-xs font-mono-tech font-bold border border-[#10b981]/50 whitespace-nowrap transition-all"
                      >
                        RE-ALIGN PILING (CLEAR OFFSET)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
