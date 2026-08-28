// ArchOS J.A.R.V.I.S. Command Dock
// Natural language environmental execution bar with voice toggle,
// agent execution ticker, and environmental query capabilities.

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Command,
  CornerDownLeft,
  Bot,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

interface ArchOSCommandDockProps {
  onExecuteCommand: (query: string) => void;
  isProcessing: boolean;
  agentStatusMessage: string | null;
}

export const ArchOSCommandDock: React.FC<ArchOSCommandDockProps> = ({
  onExecuteCommand,
  isProcessing,
  agentStatusMessage
}) => {
  const [query, setQuery] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickCommands = [
    'Show significant developments in Dubai today',
    'What changed in Abu Dhabi in the last six hours?',
    'Show infrastructure developments with confidence above 90%',
    'Find conflicting reports about UAE energy projects',
    'Simulate 2035 transport corridor',
    'Focus on Barakah Clean Energy Plant',
    'Focus on Jebel Ali Port'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    onExecuteCommand(query.trim());
    setQuery('');
    setShowSuggestions(false);
  };

  const handleSelectQuickCommand = (cmd: string) => {
    onExecuteCommand(cmd);
    setQuery('');
    setShowSuggestions(false);
  };

  // Keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="archos-command-dock-container"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-auto"
    >
      {/* Active Agent Status Ticker (if processing or message present) */}
      {agentStatusMessage && (
        <div className="mb-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0c10]/90 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-300 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>{agentStatusMessage}</span>
          </div>
        </div>
      )}

      {/* Suggestion Popover */}
      {showSuggestions && !isProcessing && (
        <div className="mb-2 p-2 rounded-2xl bg-[#0d1017]/95 backdrop-blur-2xl border border-white/20 shadow-2xl space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono uppercase text-neutral-400 font-semibold flex items-center justify-between">
            <span>Operational Queries</span>
            <span className="text-[9px] text-neutral-500">Click to execute</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuickCommand(cmd)}
                className="w-full px-3 py-1.5 rounded-xl text-left font-mono text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group"
              >
                <span>{cmd}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Command Input Surface */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 p-1.5 bg-[#0a0c10]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl transition-all focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/10"
      >
        {/* Left Icon: Voice / Status */}
        <button
          type="button"
          id="btn-toggle-voice"
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
            isVoiceActive
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
              : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:bg-white/10'
          }`}
          title={isVoiceActive ? 'Disable Voice Input' : 'Enable Voice Command'}
        >
          {isVoiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Query Input Field */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="input-archos-command"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Command J.A.R.V.I.S. (e.g. 'Show significant developments in Dubai today')..."
            className="w-full bg-transparent px-2 py-1.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none"
            disabled={isProcessing}
          />
        </div>

        {/* Quick Suggestion Toggle Button */}
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="p-1.5 rounded-lg text-[10px] font-mono text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">PROMPTS</span>
        </button>

        {/* Submit Execution Button */}
        <button
          type="submit"
          id="btn-submit-command"
          disabled={!query.trim() || isProcessing}
          className={`px-3.5 py-2 rounded-xl font-mono text-xs font-semibold flex items-center gap-1.5 transition-all ${
            query.trim() && !isProcessing
              ? 'bg-white text-black hover:bg-neutral-200 shadow-md cursor-pointer'
              : 'bg-white/10 text-neutral-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <span>EXEC</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
