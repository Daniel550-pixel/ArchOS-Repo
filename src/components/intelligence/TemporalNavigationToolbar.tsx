// ArchOS Temporal Navigation Toolbar
// Real-time timeline slider and historical intelligence selector
// Controls temporal state of the UAE World Model and Feedback Log

import React, { useState } from 'react';
import { TemporalWindow, SinceLastSessionReport } from '../../types/continuousIntelligence';
import {
  Clock,
  History,
  Play,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react';

interface TemporalNavigationToolbarProps {
  currentWindow: TemporalWindow;
  onSelectWindow: (window: TemporalWindow) => void;
  sinceLastSessionReport: SinceLastSessionReport;
}

export const TemporalNavigationToolbar: React.FC<TemporalNavigationToolbarProps> = ({
  currentWindow,
  onSelectWindow,
  sinceLastSessionReport
}) => {
  const [showSessionReportModal, setShowSessionReportModal] = useState(false);

  const windows: Array<{ id: TemporalWindow; label: string; sub: string }> = [
    { id: 'LIVE', label: 'LIVE', sub: 'Real-time feed' },
    { id: 'MINUS_1_HOUR', label: '-1 HOUR', sub: 'Past 60 mins' },
    { id: 'MINUS_6_HOURS', label: '-6 HOURS', sub: 'Shift window' },
    { id: 'MINUS_24_HOURS', label: '-24 HOURS', sub: '1 day delta' },
    { id: 'MINUS_7_DAYS', label: '-7 DAYS', sub: 'Weekly cycle' },
    { id: 'SINCE_LAST_SESSION', label: 'SINCE LAST SESSION', sub: 'Aggregated delta' }
  ];

  return (
    <>
      <div
        id="temporal-navigation-toolbar"
        className="fixed top-16 right-6 z-30 flex items-center gap-2 pointer-events-auto"
      >
        {/* Main Pill Surface */}
        <div className="flex items-center gap-1 p-1 bg-[#0a0c10]/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-white/10 text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 font-semibold">
              TEMPORAL
            </span>
          </div>

          <div className="flex items-center gap-1">
            {windows.map(win => {
              const isActive = currentWindow === win.id;
              const isSession = win.id === 'SINCE_LAST_SESSION';

              return (
                <button
                  key={win.id}
                  id={`btn-temporal-${win.id.toLowerCase()}`}
                  onClick={() => {
                    onSelectWindow(win.id);
                    if (isSession) {
                      setShowSessionReportModal(true);
                    }
                  }}
                  className={`group relative px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-white text-black font-semibold border-white shadow-md'
                      : isSession
                      ? 'bg-amber-500/10 text-amber-200 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-transparent text-neutral-400 border-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isSession && <History className="w-3 h-3 text-amber-400" />}
                  {win.id === 'LIVE' && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600 animate-ping' : 'bg-emerald-400'}`} />
                  )}
                  <span>{win.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Since Last Session Modal / Drawer */}
      {showSessionReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div
            id="since-last-session-modal"
            className="relative w-full max-w-xl bg-[#0d1017] border border-white/20 rounded-2xl shadow-2xl p-6 overflow-hidden"
          >
            {/* Ambient Background Gradient */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                  <History className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white font-mono">
                    Since Last Session Report
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Synchronized from {sinceLastSessionReport.lastSessionTimestamp}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-session-modal"
                onClick={() => setShowSessionReportModal(false)}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Bento Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Developments</div>
                <div className="text-xl font-mono font-bold text-white mt-1">
                  {sinceLastSessionReport.significantDevelopmentsCount}
                </div>
                <div className="text-[9px] text-cyan-400 font-mono mt-0.5">Ingested across UAE</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] font-mono text-emerald-300 uppercase">Verified</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  {sinceLastSessionReport.verifiedCount}
                </div>
                <div className="text-[9px] text-emerald-400 font-mono mt-0.5">Multi-source confirmed</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-[10px] font-mono text-blue-300 uppercase">High Impact</div>
                <div className="text-xl font-mono font-bold text-blue-400 mt-1">
                  {sinceLastSessionReport.highImpactCount}
                </div>
                <div className="text-[9px] text-blue-400 font-mono mt-0.5">Strategic sovereign deltas</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] font-mono text-amber-300 uppercase">Conflicts</div>
                <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                  {sinceLastSessionReport.unresolvedConflictsCount}
                </div>
                <div className="text-[9px] text-amber-400 font-mono mt-0.5">Under reconciliation</div>
              </div>
            </div>

            {/* Narrative Synthesis */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 font-sans leading-relaxed">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400 uppercase mb-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Autonomous Synthesis</span>
              </div>
              <p>{sinceLastSessionReport.topSummary}</p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                id="btn-apply-session-filter"
                onClick={() => {
                  onSelectWindow('SINCE_LAST_SESSION');
                  setShowSessionReportModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-semibold hover:bg-neutral-200 transition-all"
              >
                Inspect Developments in Feedback Log
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
