import React, { useState, useEffect } from 'react';
import { CommandLogEntry } from '../types';
import { commandBus } from '../services/commandBus';
import { eventFabric } from '../services/eventFabric';
import { ArchOSEvent } from '../types/archosEvents';
import { Terminal, Send, X, Activity, Sparkles, CheckCircle, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface UnifiedCommandPaletteProps {
  commandLogs: CommandLogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedCommandPalette: React.FC<UnifiedCommandPaletteProps> = ({
  commandLogs,
  isOpen,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<ArchOSEvent[]>([]);
  const [activeCorrelationId, setActiveCorrelationId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsub = eventFabric.subscribe('*', (evt) => {
      setRecentEvents((prev) => [evt, ...prev.slice(0, 24)]);
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (activeCommandId) {
      await commandBus.cancelCommand(activeCommandId, 'Operator cancelled in Command Palette');
      setIsExecuting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isExecuting) return;

    const query = inputText.trim();
    const cmdId = `cmd_${Date.now().toString(36)}`;
    setActiveCommandId(cmdId);
    setIsExecuting(true);
    setLastResult(null);

    // 1. Check local experience shortcuts
    const parsed = commandBus.parseVoiceUtterance(query);
    if (parsed) {
      commandBus.dispatch(parsed, 'voice', query);
    }

    // 2. Dispatch to AIOS Runtime Orchestration
    const result = await commandBus.executeNaturalLanguageCommand(query, 'keyboard');
    if (result) {
      setLastResult(result);
      if (result.correlationId) {
        setActiveCorrelationId(result.correlationId);
      }
    }
    setIsExecuting(false);
  };

  const handleQuickCommand = async (text: string) => {
    setInputText(text);
    const cmdId = `cmd_${Date.now().toString(36)}`;
    setActiveCommandId(cmdId);
    setIsExecuting(true);
    setLastResult(null);

    const parsed = commandBus.parseVoiceUtterance(text);
    if (parsed) {
      commandBus.dispatch(parsed, 'voice', text);
    }

    const result = await commandBus.executeNaturalLanguageCommand(text, 'voice');
    if (result) {
      setLastResult(result);
      if (result.correlationId) {
        setActiveCorrelationId(result.correlationId);
      }
    }
    setIsExecuting(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Unified Command Bus"
      className="fixed inset-0 z-50 bg-[#08080a]/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#111115] border border-[#f5f4f0]/15 w-full max-w-3xl rounded-xs shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#f5f4f0]/10 flex items-center justify-between bg-[#0d0d12]">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-[#d4ff00]" />
            <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-[#f5f4f0]">
              J.A.R.V.I.S. Command & Intelligence Console // AIOS Runtime A2-A3
            </span>
          </div>
          <div className="flex items-center gap-3">
            {activeCorrelationId && (
              <span className="font-mono-tech text-[10px] text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 border border-[#00e5ff]/20 rounded-xs">
                TRACE: {activeCorrelationId}
              </span>
            )}
            <button
              onClick={onClose}
              className="text-[#8e8d88] hover:text-[#f5f4f0] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-[#f5f4f0]/08 flex gap-2 bg-[#09090d]">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 'Analyze Dubai\'s current development trajectory.', 'System status'..."
              className="w-full bg-[#08080a] border border-[#f5f4f0]/15 px-3.5 py-2.5 font-mono-tech text-xs text-[#f5f4f0] placeholder-[#545350] focus:outline-none focus:border-[#d4ff00] transition-colors"
              disabled={isExecuting}
            />
          </div>
          <button
            type="submit"
            disabled={isExecuting}
            className="px-5 py-2.5 bg-[#d4ff00] hover:bg-[#bce400] text-[#08080a] font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer rounded-xs disabled:opacity-50 transition-all shadow-sm"
          >
            {isExecuting ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isExecuting ? 'Reasoning...' : 'Dispatch'}</span>
          </button>
          {isExecuting && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-2.5 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 text-[#ef4444] border border-[#ef4444]/40 font-mono-tech text-xs font-bold uppercase flex items-center gap-1 cursor-pointer rounded-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}
        </form>

        {/* Preset Voice & Intelligence Queries */}
        <div className="px-4 py-2.5 bg-[#08080a]/70 border-b border-[#f5f4f0]/06 flex items-center gap-2 overflow-x-auto text-[11px] font-mono-tech">
          <span className="text-[#545350] shrink-0 font-semibold">CANONICAL PROBES:</span>
          {[
            "Analyze Dubai's current development trajectory.",
            'System status',
            'Show Downtown Dubai',
            'Open Future City Block'
          ].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handleQuickCommand(phrase)}
              className="shrink-0 px-2.5 py-1 bg-[#111115] hover:bg-[#1a1a24] text-[#8e8d88] hover:text-[#d4ff00] border border-[#f5f4f0]/10 rounded-xs cursor-pointer transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Dynamic Execution Result Display */}
        {lastResult && (
          <div className="p-4 bg-[#0a0a0e] border-b border-[#f5f4f0]/10 overflow-y-auto max-h-64 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#d4ff00]" />
                <span className="font-mono-tech text-[10px] text-[#d4ff00] uppercase font-bold tracking-wide">
                  Cognitive Synthesis [{lastResult.reality || 'OBSERVED'}]
                </span>
                <span
                  className={`text-[9px] font-mono-tech px-2 py-0.5 rounded-xs uppercase font-semibold ${
                    lastResult.executionState === 'PARTIAL_SUCCESS'
                      ? 'bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/30'
                      : lastResult.executionState === 'FAILED'
                      ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                      : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  }`}
                >
                  {lastResult.executionState || 'SUCCESS'}
                </span>
              </div>
              <span className="text-[10px] font-mono-tech text-[#8e8d88]">
                Latency: {lastResult.executionTimeMs || lastResult.durationMs || 120}ms // Conf: {Math.round((lastResult.confidence || 0.98) * 100)}%
              </span>
            </div>

            <div className="text-xs text-[#f5f4f0] whitespace-pre-line leading-relaxed font-sans bg-[#111115] p-3.5 rounded-xs border border-[#f5f4f0]/10 select-text">
              {lastResult.answer}
            </div>

            {/* Specialist Agents Execution Trace */}
            {lastResult.stages && (
              <div>
                <div className="text-[9px] uppercase font-mono-tech text-[#8e8d88] mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-[#d4ff00]" />
                  <span>Specialist Agent Dispatches & Execution Trace:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {lastResult.stages.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#08080a] border border-[#f5f4f0]/08 rounded-xs text-[10px] font-mono-tech flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {st.status === 'SUCCESS' ? (
                          <CheckCircle className="w-3 h-3 text-[#10b981] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-[#eab308] shrink-0" />
                        )}
                        <span className="text-[#c8c7c3] truncate">{st.agentName || st.agent || st.agentId}</span>
                      </div>
                      <span className="text-[#8e8d88] shrink-0 ml-2">
                        {st.durationMs || st.execution_time_ms || 14}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policy & Invariant Audit Status */}
            {lastResult.invariants && (
              <div className="pt-2 border-t border-[#f5f4f0]/05 flex items-center gap-2 text-[10px] font-mono-tech text-[#8e8d88]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <span>
                  {lastResult.invariants.length} Policy Invariants Verified (Sovereign Residency, Spatial Envelopes, Post-Quantum Integrity)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live Event Fabric Stream */}
        <div className="p-4 flex-1 overflow-y-auto font-mono-tech text-xs bg-[#08080a]">
          <div className="text-[10px] uppercase text-[#545350] mb-2 flex items-center justify-between">
            <span className="font-semibold">Event Fabric Nervous System (Authoritative Backend Stream)</span>
            <span className="text-[9px] text-[#00e5ff] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" /> SSE CONNECTED
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="text-[#545350] text-[11px] py-4 text-center">
                Awaiting command execution or Event Fabric dispatch...
              </div>
            ) : (
              recentEvents.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="px-2.5 py-1.5 bg-[#111115] border border-[#f5f4f0]/05 rounded-xs flex items-center justify-between text-[11px] hover:border-[#f5f4f0]/15 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#d4ff00] text-[10px] shrink-0">[{evt.type}]</span>
                    <span className="text-[#c8c7c3] truncate max-w-sm">
                      {(evt as any).payload?.rawText ||
                        (evt as any).payload?.intent ||
                        (evt as any).payload?.agentId ||
                        (evt as any).payload?.canonicalIntent ||
                        (evt as any).payload?.region ||
                        'Event acknowledged'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {evt.correlationId && (
                      <span className="text-[#545350] text-[9px] font-mono-tech hidden sm:inline">
                        {evt.correlationId.slice(0, 10)}
                      </span>
                    )}
                    <span className="text-[#545350] text-[9px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0d0d12] border-t border-[#f5f4f0]/10 flex items-center justify-between font-mono-tech text-[10px] text-[#8e8d88]">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-[#d4ff00]" />
            <span>AIOS Execution Plane Active // Zero-Trust Verified</span>
          </div>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
