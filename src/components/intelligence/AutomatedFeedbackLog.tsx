// ArchOS Automated Feedback Log
// Floating spatial glass layer displaying continuous UAE intelligence updates,
// verification statuses, conflict detection, and real-time world model sync.

import React, { useState } from 'react';
import {
  UAEIntelligenceEvent,
  TemporalWindow,
  IntelligenceDomain,
  EventVerificationState
} from '../../types/continuousIntelligence';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';

interface AutomatedFeedbackLogProps {
  events: UAEIntelligenceEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: UAEIntelligenceEvent) => void;
  temporalWindow: TemporalWindow;
  onTemporalChange: (window: TemporalWindow) => void;
  activeDomain: IntelligenceDomain | 'ALL';
  onDomainChange: (domain: IntelligenceDomain | 'ALL') => void;
  selectedEmirate: string;
  onEmirateChange: (emirate: string) => void;
  verifiedOnly: boolean;
  onToggleVerifiedOnly: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const AutomatedFeedbackLog: React.FC<AutomatedFeedbackLogProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  temporalWindow,
  onTemporalChange,
  activeDomain,
  onDomainChange,
  selectedEmirate,
  onEmirateChange,
  verifiedOnly,
  onToggleVerifiedOnly,
  searchQuery,
  onSearchChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const getVerificationBadge = (state: EventVerificationState) => {
    switch (state) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Verified
          </span>
        );
      case 'CONFLICTING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Conflict Detected
          </span>
        );
      case 'PROCESSING':
      case 'CORRELATED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <Activity className="w-3 h-3 text-blue-400 animate-spin" />
            Correlating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
            <Radio className="w-3 h-3 text-neutral-400" />
            Ingested
          </span>
        );
    }
  };

  const getDomainColor = (domain: IntelligenceDomain) => {
    switch (domain) {
      case 'ENERGY':
        return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
      case 'INFRASTRUCTURE':
        return 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10';
      case 'LOGISTICS':
        return 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10';
      case 'MOBILITY':
        return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
      case 'ENVIRONMENT':
        return 'text-teal-300 border-teal-500/30 bg-teal-500/10';
      default:
        return 'text-neutral-300 border-neutral-700 bg-neutral-800/60';
    }
  };

  return (
    <div
      id="automated-feedback-log-container"
      className={`fixed top-16 left-6 z-30 transition-all duration-300 pointer-events-auto ${
        isCollapsed ? 'w-80 h-14' : 'w-[420px] max-h-[calc(100vh-140px)]'
      }`}
    >
      <div className="relative flex flex-col h-full bg-[#0a0c10]/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-white/10 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-white uppercase">
                  Continuous Feedback Log
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                  {events.length} Active
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-tight">
                24/7 UAE World Model Ingestion & Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-toggle-filters"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`p-1.5 rounded-lg border transition-all ${
                showFilterDrawer || verifiedOnly || activeDomain !== 'ALL' || selectedEmirate !== 'ALL'
                  ? 'bg-white/20 text-white border-white/40'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="Filter Stream"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-toggle-collapse-log"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-white/5 text-neutral-400 border border-white/10 hover:text-white hover:bg-white/10 transition-all"
              title={isCollapsed ? 'Expand Log' : 'Collapse Log'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Filter Drawer */}
        {!isCollapsed && showFilterDrawer && (
          <div className="p-3 bg-black/60 border-b border-white/10 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                id="input-filter-events"
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search developments, entities, coords..."
                className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Emirate Select */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
              {['ALL', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Fujairah', 'Ras Al Khaimah'].map(em => (
                <button
                  key={em}
                  onClick={() => onEmirateChange(em)}
                  className={`px-2.5 py-1 rounded-md border whitespace-nowrap transition-all ${
                    selectedEmirate === em
                      ? 'bg-white text-black font-semibold border-white'
                      : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Verification & Domain Toggles */}
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
              <button
                id="btn-filter-verified"
                onClick={onToggleVerifiedOnly}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-all ${
                  verifiedOnly
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Verified Only
              </button>

              <select
                value={activeDomain}
                onChange={e => onDomainChange(e.target.value as any)}
                className="bg-white/5 border border-white/15 rounded-md px-2 py-1 text-neutral-300 text-[11px] focus:outline-none"
              >
                <option value="ALL" className="bg-neutral-900 text-white">All Domains</option>
                <option value="INFRASTRUCTURE" className="bg-neutral-900 text-white">Infrastructure</option>
                <option value="ENERGY" className="bg-neutral-900 text-white">Energy & Power</option>
                <option value="LOGISTICS" className="bg-neutral-900 text-white">Logistics & Ports</option>
                <option value="MOBILITY" className="bg-neutral-900 text-white">Mobility & Transit</option>
                <option value="ENVIRONMENT" className="bg-neutral-900 text-white">Environment & Waste</option>
              </select>
            </div>
          </div>
        )}

        {/* Scrollable Event Feed */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1.5 custom-scrollbar">
            {events.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                <Database className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No developments match current filter parameters.
              </div>
            ) : (
              events.map(event => {
                const isSelected = selectedEventId === event.id;
                const isConflict = event.verificationState === 'CONFLICTING';

                return (
                  <div
                    key={event.id}
                    id={`feedback-event-${event.id}`}
                    onClick={() => onSelectEvent(event)}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-white/15 border-white/50 shadow-lg'
                        : isConflict
                        ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/25'
                    }`}
                  >
                    {/* Event Sub-header: Timestamp + Emirate + Domain */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white/90 font-medium">[{event.timeFormatted}]</span>
                        <span className="text-neutral-400 uppercase font-semibold">{event.emirate}</span>
                        <span className="text-neutral-500">·</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] border ${getDomainColor(event.domain)}`}>
                          {event.domain}
                        </span>
                      </div>
                      <span className="text-neutral-400">{event.relativeTime}</span>
                    </div>

                    {/* Headline */}
                    <h4 className="text-xs font-medium text-white/95 leading-snug group-hover:text-white transition-colors">
                      {event.headline}
                    </h4>

                    {/* Entity Name & Summary */}
                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      <span className="text-neutral-300 font-mono font-medium">{event.entityName}: </span>
                      {event.summary}
                    </p>

                    {/* Conflict Highlight (if conflicting) */}
                    {isConflict && event.conflicts && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-200">
                        <div className="flex items-center gap-1 font-semibold text-amber-300 mb-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Variance Detected</span>
                        </div>
                        <p className="line-clamp-2 text-amber-200/80">{event.conflicts.discrepancySummary}</p>
                      </div>
                    )}

                    {/* Bottom Metadata Bar */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-300 font-semibold">
                          {event.confidence.toFixed(1)}% CONF
                        </span>
                        <span className="text-neutral-600">|</span>
                        <span>{event.sourceCount} Sources</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getVerificationBadge(event.verificationState)}
                        {event.worldModelUpdated && (
                          <span className="text-[9px] font-mono text-cyan-400/90 flex items-center gap-0.5" title="World Model Synchronized">
                            <Zap className="w-2.5 h-2.5 text-cyan-400" />
                            WM SYNC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer Summary Strip */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-black/40 text-[10px] font-mono text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>WORLD MODEL: ACTIVE</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400">
              <span>PROVENANCE: MERKLE-VERIFIED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
