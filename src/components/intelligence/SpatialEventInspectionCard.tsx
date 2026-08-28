// ArchOS Spatial Event Inspection Card
// Anchored floating spatial inspector presenting epistemological status,
// invariant proofs, multi-source corroboration, and autonomous agent synthesis.

import React from 'react';
import { UAEIntelligenceEvent } from '../../types/continuousIntelligence';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  Layers,
  MapPin,
  Maximize2,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from 'lucide-react';

interface SpatialEventInspectionCardProps {
  event: UAEIntelligenceEvent | null;
  onClose: () => void;
  onSimulateScenario?: (event: UAEIntelligenceEvent) => void;
}

export const SpatialEventInspectionCard: React.FC<SpatialEventInspectionCardProps> = ({
  event,
  onClose,
  onSimulateScenario
}) => {
  if (!event) return null;

  const isConflict = event.verificationState === 'CONFLICTING';

  return (
    <div
      id="spatial-event-inspection-card"
      className="fixed bottom-24 right-6 z-40 w-[460px] max-h-[calc(100vh-180px)] bg-[#0a0c10]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300"
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
            Spatial Intelligence Node
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300">
            {event.id}
          </span>
        </div>
        <button
          id="btn-close-event-card"
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans custom-scrollbar">
        {/* Entity & Location */}
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mb-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-semibold uppercase">{event.emirate}</span>
            <span>·</span>
            <span>{event.district}</span>
            <span>·</span>
            <span>[{event.geoLatLng[0].toFixed(4)}°N, {event.geoLatLng[1].toFixed(4)}°E]</span>
          </div>

          <h3 className="text-sm font-semibold text-white font-mono leading-snug">
            {event.entityName}
          </h3>
          {event.arabicEntityName && (
            <p className="text-xs text-neutral-400 font-sans mt-0.5" dir="rtl">
              {event.arabicEntityName}
            </p>
          )}
        </div>

        {/* Change Headline & Summary */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="text-[10px] font-mono text-cyan-300 font-semibold uppercase">
            Observed Development
          </div>
          <p className="text-xs font-medium text-white leading-relaxed">
            {event.headline}
          </p>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {event.summary}
          </p>
        </div>

        {/* Conflict Detection Panel */}
        {isConflict && event.conflicts && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Multi-Source Conflict Detected</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                {event.conflicts.resolutionStatus}
              </span>
            </div>

            <p className="text-[11px] text-amber-200/90 leading-relaxed font-mono">
              {event.conflicts.discrepancySummary}
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="p-2 rounded-lg bg-black/40 border border-amber-500/20 text-[10px] font-mono">
                <span className="text-amber-400 font-semibold">{event.conflicts.sourceA.source}:</span>{' '}
                <span className="text-neutral-300">{event.conflicts.sourceA.claim}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-amber-500/20 text-[10px] font-mono">
                <span className="text-amber-400 font-semibold">{event.conflicts.sourceB.source}:</span>{' '}
                <span className="text-neutral-300">{event.conflicts.sourceB.claim}</span>
              </div>
              {event.conflicts.sourceC && (
                <div className="p-2 rounded-lg bg-black/40 border border-amber-500/20 text-[10px] font-mono">
                  <span className="text-amber-400 font-semibold">{event.conflicts.sourceC.source}:</span>{' '}
                  <span className="text-neutral-300">{event.conflicts.sourceC.claim}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-amber-300/80">
              <span>Current Probability: {event.conflicts.currentProbability}%</span>
              <span>Reconciliation Agent: Assigned</span>
            </div>
          </div>
        )}

        {/* Verification Proof & Invariants */}
        {event.verificationProof && (
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-300 uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Epistemic Invariant Verification</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {event.verificationProof.invariantsPassed}/{event.verificationProof.totalInvariants} PASSED
              </span>
            </div>

            <p className="text-[11px] text-emerald-200/80 leading-relaxed font-sans">
              {event.verificationProof.corroborationNote}
            </p>

            <div className="p-2 rounded-lg bg-black/50 border border-emerald-500/20 text-[9px] font-mono text-neutral-400 break-all">
              <span className="text-emerald-400 font-bold">MERKLE ROOT HASH: </span>
              {event.verificationProof.merkleProofSha256}
            </div>
          </div>
        )}

        {/* Sources Corroboration Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase font-semibold">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>Independent Ingestion Sources ({event.sources.length})</span>
            </div>
            <span className="text-cyan-400">{event.confidence}% Confidence</span>
          </div>

          <div className="space-y-1.5">
            {event.sources.map((src, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all text-[11px] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-white text-[10px]">
                    {src.name}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-400">
                    Reliability: {(src.reliabilityScore * 100).toFixed(0)}%
                  </span>
                </div>
                {src.excerpt && (
                  <p className="text-[10px] text-neutral-300 italic font-sans">
                    "{src.excerpt}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agent Synthesis */}
        {event.agentAnalysis && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/15 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-300 font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{event.agentAnalysis.agentName} Synthesis</span>
              <span className="text-neutral-500 font-normal">({event.agentAnalysis.role})</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {event.agentAnalysis.synthesis}
            </p>
          </div>
        )}

        {/* World Model Sync Status */}
        {event.worldModelUpdated && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-200">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>World Model Ledger: {event.worldModelDelta || 'Synchronized in canonical representation.'}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-2">
        <button
          id="btn-inspect-relationships"
          className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
          Correlate Entities
        </button>

        <button
          id="btn-simulate-event-impact"
          onClick={() => onSimulateScenario?.(event)}
          className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-mono text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Simulate Impact
        </button>
      </div>
    </div>
  );
};
