// ArchOS UAE Intelligence & Evidence Interrogation Canvas ("What do we know?")
// Answers questions about reality without altering it.
// Live multi-source data ingestion, epistemic corroboration matrix, and discrepancy diffs.

import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  Database,
  Radio,
  FileText,
  ExternalLink
} from 'lucide-react';
import { UAEIntelligenceEvent, IntelligenceDomain, TemporalWindow } from '../../types/continuousIntelligence';

interface IntelligenceEvidenceCanvasProps {
  events: UAEIntelligenceEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: UAEIntelligenceEvent) => void;
  onExecutePrompt: (prompt: string) => void;
}

export const IntelligenceEvidenceCanvas: React.FC<IntelligenceEvidenceCanvasProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onExecutePrompt
}) => {
  const [activeDomain, setActiveDomain] = useState<IntelligenceDomain | 'ALL'>('ALL');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  const domains: Array<{ id: IntelligenceDomain | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'ALL DOMAINS' },
    { id: 'INFRASTRUCTURE', label: 'INFRASTRUCTURE' },
    { id: 'ENERGY', label: 'ENERGY' },
    { id: 'LOGISTICS', label: 'LOGISTICS' },
    { id: 'FINANCE', label: 'FINANCE' },
    { id: 'ENVIRONMENT', label: 'ENVIRONMENT' },
    { id: 'GOVERNANCE', label: 'GOVERNANCE' }
  ];

  const suggestedInterrogations = [
    'Analyse UAE infrastructure resilience across transport & power grid',
    "What changed in Dubai's transport network during the last 30 days?",
    'Correlate Fujairah crude throughput with maritime AIS signals',
    'Show multi-source discrepancy on Al Maktoum airport expansion',
    'Evaluate Barakah clean power baseload absorption by Masdar City'
  ];

  const filteredEvents = events.filter((evt) => {
    if (activeDomain !== 'ALL' && evt.domain !== activeDomain) return false;
    if (showConflictsOnly && evt.verificationState !== 'CONFLICTING') return false;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      return (
        evt.headline.toLowerCase().includes(q) ||
        evt.summary.toLowerCase().includes(q) ||
        evt.entityName.toLowerCase().includes(q) ||
        evt.emirate.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      id="archos-intelligence-evidence-canvas"
      className="relative w-full h-full p-8 overflow-y-auto font-mono text-white select-none bg-gradient-to-b from-[#06080d] to-[#000000] custom-scrollbar"
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        {/* Header Interrogation Banner */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs uppercase font-bold tracking-widest">
            <Activity className="w-4 h-4" />
            <span>Epistemic Evidence & Intelligence Interrogation</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            "What Do We Know About Reality?"
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-0.5 max-w-3xl">
            Continuous 24/7 ingestion across federal gazettes, satellite constellations, SCADA telemetry, port AIS feeds, and commercial sensors.
          </p>

          {/* Quick Interrogation Prompts */}
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">
              Suggested Interrogation Prompts:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedInterrogations.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onExecutePrompt(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-950/30 text-neutral-300 hover:text-cyan-200 text-xs transition-all flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Feeds Status Overview Strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          {[
            { label: 'FEDERAL GAZETTE', status: '● LIVE', lastSync: '12s ago' },
            { label: 'ENERGY SCADA', status: '● LIVE', lastSync: '4s ago' },
            { label: 'PORT AIS & MARITIME', status: '● LIVE', lastSync: '1s ago' },
            { label: 'AIRSPACE TELEMETRY', status: '● LIVE', lastSync: '3s ago' },
            { label: 'GROUND SENSORS', status: '● LIVE', lastSync: '8s ago' },
            { label: 'FINANCIAL MARKETS', status: '● LIVE', lastSync: '14s ago' }
          ].map((feed, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="text-[9px] text-neutral-400 font-semibold">{feed.label}</div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-[10px]">{feed.status}</span>
                <span className="text-neutral-500 text-[9px]">{feed.lastSync}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {domains.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDomain(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeDomain === d.id
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConflictsOnly(!showConflictsOnly)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showConflictsOnly
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>CONFLICTS ONLY</span>
            </button>

            <div className="relative">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter events..."
                className="w-48 px-3 py-1 rounded-lg bg-black border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Intelligence Evidence Stream List */}
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isSelected = selectedEventId === evt.id;
            const isConflict = evt.verificationState === 'CONFLICTING';

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className={`p-4 rounded-2xl transition-all cursor-pointer border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-2xl ring-2 ring-cyan-500/20'
                    : isConflict
                    ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isConflict
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {evt.verificationState}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">
                      {evt.emirate} · {evt.domain}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {evt.timeFormatted}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight">{evt.headline}</h3>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">{evt.summary}</p>

                  {/* Conflicting Claim Diff Callout if present */}
                  {evt.conflicts && (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10px] uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Source Discrepancy Diff: {evt.conflicts.discrepancySummary}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                        <div className="p-2 rounded bg-black/60 border border-amber-500/20">
                          <span className="text-neutral-400">{evt.conflicts.sourceA.source}:</span>
                          <div className="text-white font-bold">{evt.conflicts.sourceA.claim}</div>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-amber-500/20">
                          <span className="text-neutral-400">{evt.conflicts.sourceB.source}:</span>
                          <div className="text-amber-200 font-bold">{evt.conflicts.sourceB.claim}</div>
                        </div>
                      </div>
                      <div className="text-[9px] text-neutral-400 pt-1">
                        RECONCILIATION: {evt.conflicts.resolutionStatus}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side Corroboration Stats */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-neutral-400">Confidence</div>
                    <div className="text-xs font-bold text-emerald-400">{Math.round(evt.confidence)}%</div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-neutral-400">Evidence</div>
                    <div className="text-xs font-bold text-cyan-300">{evt.sources.length} Sources</div>
                  </div>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-400 text-black'
                        : 'bg-white/5 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'ACTIVE IN CONTEXT' : 'INSPECT'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
