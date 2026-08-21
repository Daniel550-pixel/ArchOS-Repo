import React, { useState, useEffect } from 'react';
import { CommandLogEntry, ExperienceCommand } from '../types';
import { commandBus } from '../services/commandBus';
import { Terminal, Mic, Send, X, ChevronRight, Activity } from 'lucide-react';

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
  const [simulatedVoiceState, setSimulatedVoiceState] = useState<'idle' | 'listening'>('idle');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const parsed = commandBus.parseVoiceUtterance(inputText);
    if (parsed) {
      commandBus.dispatch(parsed, 'voice', inputText);
    } else {
      // Default fallback command
      commandBus.dispatch({ type: 'NEXT_EXPERIENCE' }, 'api', inputText);
    }
    setInputText('');
  };

  const handleQuickCommand = (text: string) => {
    const parsed = commandBus.parseVoiceUtterance(text);
    if (parsed) {
      commandBus.dispatch(parsed, 'voice', text);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Unified Command Bus"
      className="fixed inset-0 z-50 bg-[#08080a]/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-[#111115] border border-[#f5f4f0]/15 w-full max-w-xl rounded-xs shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#f5f4f0]/10 flex items-center justify-between bg-[#0d0d12]">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-[#d4ff00]" />
            <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-[#f5f4f0]">
              Unified Command Bus // Voice & Vision Gateway
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e8d88] hover:text-[#f5f4f0] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-[#f5f4f0]/08 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter voice phrase e.g. 'Open Kinetic GT', 'Explode 50%', 'Exit'..."
              className="w-full bg-[#08080a] border border-[#f5f4f0]/10 px-3.5 py-2 font-mono-tech text-xs text-[#f5f4f0] placeholder-[#545350] focus:outline-none focus:border-[#d4ff00]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#d4ff00] hover:bg-[#bce400] text-[#08080a] font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer rounded-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch</span>
          </button>
        </form>

        {/* Preset Voice Phrases */}
        <div className="px-4 py-2.5 bg-[#08080a]/50 border-b border-[#f5f4f0]/06 flex items-center gap-2 overflow-x-auto text-[11px] font-mono-tech">
          <span className="text-[#545350] shrink-0">PRESETS:</span>
          {[
            'Open Future City Block',
            'Explode halfway',
            'Show fully assembled',
            'Show exploded view',
            'Exit experience'
          ].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handleQuickCommand(phrase)}
              className="shrink-0 px-2 py-1 bg-[#111115] hover:bg-[#1a1a24] text-[#8e8d88] hover:text-[#d4ff00] border border-[#f5f4f0]/08 rounded-xs cursor-pointer"
            >
              "{phrase}"
            </button>
          ))}
        </div>

        {/* Live Command Stream History */}
        <div className="p-4 flex flex-col gap-2 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between font-mono-tech text-[10px] text-[#545350] border-b border-[#f5f4f0]/06 pb-1">
            <span>REAL-TIME DISPATCH LOG</span>
            <span>SOURCE & TIMESTAMP</span>
          </div>

          {commandLogs.length === 0 ? (
            <div className="py-6 text-center font-mono-tech text-xs text-[#545350]">
              No commands recorded yet. Perform a gesture, keypress, or type above.
            </div>
          ) : (
            commandLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between font-mono-tech text-[11px] bg-[#08080a] p-2 border border-[#f5f4f0]/06 rounded-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs ${
                      log.source === 'gesture'
                        ? 'bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30'
                        : log.source === 'voice'
                        ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40'
                        : 'bg-zinc-800 text-[#8e8d88]'
                    }`}
                  >
                    {log.source}
                  </span>
                  <span className="text-[#f5f4f0] font-semibold">
                    {log.command.type}
                  </span>
                  {log.rawText && (
                    <span className="text-[#8e8d88] italic">
                      "{log.rawText}"
                    </span>
                  )}
                  {'payload' in log.command && (
                    <span className="text-[#545350]">
                      {JSON.stringify((log.command as any).payload)}
                    </span>
                  )}
                </div>

                <span className="text-[9px] text-[#545350]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0d0d12] border-t border-[#f5f4f0]/10 flex items-center justify-between font-mono-tech text-[10px] text-[#8e8d88]">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#d4ff00]" />
            <span>JARVIS Experience Engine Bus Active</span>
          </div>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
