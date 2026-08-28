// ArchOS Cross-Cutting System Trust Overlays (VERIFY, SECURITY, MEMORY, DATA FLOW)
// Supporting infrastructure accessible as non-competing system overlays

import React from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Cpu,
  Key,
  KeyRound,
  FileCode,
  Network
} from 'lucide-react';
import { SystemLayerModal, SovereignDataFlowStats } from '../../types/archosExperience';

interface SystemOverlaysModalProps {
  activeModal: SystemLayerModal;
  onClose: () => void;
  dataFlowStats: SovereignDataFlowStats;
}

export const SystemOverlaysModal: React.FC<SystemOverlaysModalProps> = ({
  activeModal,
  onClose,
  dataFlowStats
}) => {
  if (!activeModal) return null;

  return (
    <div
      id="archos-system-overlay-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in select-none font-mono text-white"
      onClick={onClose}
    >
      <div
        id="archos-system-overlay-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] p-6 rounded-2xl bg-[#0a0c10] border border-white/20 shadow-2xl overflow-y-auto space-y-6 custom-scrollbar"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {activeModal === 'VERIFY' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            {activeModal === 'SECURITY' && <Lock className="w-5 h-5 text-cyan-400" />}
            {activeModal === 'MEMORY' && <Database className="w-5 h-5 text-purple-400" />}
            {activeModal === 'DATA_FLOW' && <Radio className="w-5 h-5 text-amber-400" />}

            <div>
              <h2 className="text-base font-bold text-white tracking-tight uppercase">
                System Layer · {activeModal.replace('_', ' ')}
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Cross-cutting operational verification & platform trust infrastructure
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. VERIFY OVERLAY */}
        {activeModal === 'VERIFY' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-white">Epistemic Invariants: 99.98% Pass Rate</div>
                  <div className="text-xs text-emerald-300">All authoritative ground-truth entities verified against federal registers.</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-200 font-bold border border-emerald-500/40">
                PROVEN
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Active Verification Rules</span>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-neutral-300">Multi-Source Corroboration Threshold</span>
                  <span className="text-emerald-400 font-bold">≥ 3 Independent Feeds</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-neutral-300">Cryptographic Merkle Tree Sync</span>
                  <span className="text-emerald-400 font-bold">Root Hash #0x8f2a...41b Valid</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="text-neutral-300">Simulation Boundary Isolation</span>
                  <span className="text-emerald-400 font-bold">100% Zero Authoritative Pollution</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Discrepancy Auto-Reconciliation</span>
                  <span className="text-amber-400 font-bold">Active Gazette Priority Matrix</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECURITY OVERLAY */}
        {activeModal === 'SECURITY' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-cyan-400" />
                <div>
                  <div className="text-sm font-bold text-white">Sovereign Enclave Security: Active</div>
                  <div className="text-xs text-cyan-300">Zero-trust role-based authorization & biometric vault integration.</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-cyan-900/60 text-cyan-200 font-bold border border-cyan-500/40">
                AIR-GAPPED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase">Biometric Session Key</span>
                <div className="font-bold text-white break-all">SOV-KEY-7894-AUTH-PROV</div>
                <span className="text-[9px] text-emerald-400">Status: Validated</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase">Policy Invariant Enforcer</span>
                <div className="font-bold text-white">Strict RBAC Tier 0</div>
                <span className="text-[9px] text-cyan-300">Auditable State Logged</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. MEMORY OVERLAY */}
        {activeModal === 'MEMORY' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <div className="text-sm font-bold text-white">4-Tier Sovereign Memory Matrix</div>
              <div className="text-xs text-purple-300 mt-0.5">Clear conceptual separation across working, episodic, semantic, and sovereign memory tiers.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>1. Working Memory</span>
                  <span className="text-[10px] text-cyan-400">EPHEMERAL</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">Active reasoning context, temporal window buffers, and immediate agent state.</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>2. Episodic Memory</span>
                  <span className="text-[10px] text-purple-400">HISTORICAL</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">Chronological interaction logs, mission replays, and simulation forks.</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>3. Semantic Memory</span>
                  <span className="text-[10px] text-emerald-400">KNOWLEDGE GRAPH</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">Vectorized UAE infrastructure relationships, GIS topology, and zoning laws.</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>4. Sovereign Ledger</span>
                  <span className="text-[10px] text-amber-400">IMMUTABLE</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">Cryptographically verified national ground truth records and official gazettes.</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. DATA FLOW OVERLAY */}
        {activeModal === 'DATA_FLOW' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
                <div>
                  <div className="text-sm font-bold text-white">Continuous Ingestion Pipeline: 24/7 Live</div>
                  <div className="text-xs text-amber-300">High-throughput ingestion without UI firehose clutter.</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-amber-900/60 text-amber-200 font-bold border border-amber-500/40">
                13.4K EVT/MIN
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase">Events / Minute</span>
                <div className="text-base font-bold text-white mt-1">{dataFlowStats.eventsPerMinute.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase">Entities Updated</span>
                <div className="text-base font-bold text-cyan-300 mt-1">{dataFlowStats.entitiesUpdated.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase">Relationships Changed</span>
                <div className="text-base font-bold text-purple-300 mt-1">{dataFlowStats.relationshipsChanged}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase">Anomalies Detected</span>
                <div className="text-base font-bold text-amber-400 mt-1">{dataFlowStats.anomaliesDetected}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase">Verification Conflicts</span>
                <div className="text-base font-bold text-red-400 mt-1">{dataFlowStats.verificationConflicts}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase">Simulation Triggers</span>
                <div className="text-base font-bold text-emerald-400 mt-1">{dataFlowStats.simulationTriggers}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
