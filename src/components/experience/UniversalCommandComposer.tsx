// ArchOS Universal Intent & Command Composer (Bottom Bar)
// Inspired by the Fastshot unified intent interface.
// Parses user intent, automatically routes to the appropriate operational mode, and executes actions.

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  CornerDownLeft,
  Sparkles,
  ChevronRight,
  Activity,
  Globe2,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowUp
} from 'lucide-react';
import { PrimaryMode } from '../../types/archosExperience';

interface UniversalCommandComposerProps {
  activeMode: PrimaryMode;
  onSelectMode: (mode: PrimaryMode) => void;
  onExecuteIntent: (rawPrompt: string) => void;
  isProcessing: boolean;
  agentStatusMessage: string | null;
}

export const UniversalCommandComposer: React.FC<UniversalCommandComposerProps> = ({
  activeMode,
  onSelectMode,
  onExecuteIntent,
  isProcessing,
  agentStatusMessage
}) => {
  const [query, setQuery] = useState<string>('');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [showPromptsPopover, setShowPromptsPopover] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const modeChips: Array<{ id: PrimaryMode; label: string; icon: any }> = [
    { id: 'WORLD', label: 'WORLD', icon: Globe2 },
    { id: 'INFO', label: 'UAE INFO', icon: Activity },
    { id: 'SIMULATE', label: 'SIMULATE', icon: Sparkles },
    { id: 'AGENTS', label: 'AGENTS', icon: Cpu }
  ];

  const quickIntentPrompts = [
    { text: 'Analyse UAE infrastructure resilience across transport & energy', mode: 'INFO' as PrimaryMode },
    { text: 'What happens if Dubai increases autonomous mobility by 30%?', mode: 'SIMULATE' as PrimaryMode },
    { text: 'Show Barakah Clean Baseload Power Complex', mode: 'WORLD' as PrimaryMode },
    { text: 'What changed in Abu Dhabi during the last six hours?', mode: 'INFO' as PrimaryMode },
    { text: 'Simulate 2035 Al Dhafra sovereign AI datacenter grid load', mode: 'SIMULATE' as PrimaryMode },
    { text: 'Orchestrate Infrastructure Sentinel to rebalance peak traffic', mode: 'AGENTS' as PrimaryMode }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    onExecuteIntent(query.trim());
    setQuery('');
    setShowPromptsPopover(false);
  };

  const handleSelectQuickPrompt = (prompt: { text: string; mode: PrimaryMode }) => {
    onSelectMode(prompt.mode);
    onExecuteIntent(prompt.text);
    setQuery('');
    setShowPromptsPopover(false);
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
    <footer
      id="archos-universal-command-composer"
      aria-label="Universal Intent Composer"
      className="fixed bottom-3 left-64 right-80 z-40 px-6 pointer-events-auto select-none font-mono"
    >
      {/* Active Agent Status Ticker */}
      {agentStatusMessage && (
        <div className="mb-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0c10]/95 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>{agentStatusMessage}</span>
          </div>
        </div>
      )}

      {/* Prompts Popover */}
      {showPromptsPopover && !isProcessing && (
        <div className="mb-2 p-2.5 rounded-2xl bg-[#0d1017]/98 backdrop-blur-2xl border border-white/20 shadow-2xl space-y-1 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3 py-1 text-[10px] uppercase text-neutral-400 font-semibold flex items-center justify-between">
            <span>Operational Intent Suggestions</span>
            <span className="text-[9px] text-neutral-500">Auto-routes to mode</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {quickIntentPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuickPrompt(item)}
                className="w-full px-3 py-2 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                    {item.mode}
                  </span>
                  <span>{item.text}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Composer Surface */}
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col p-2 bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl transition-all focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/10"
      >
        {/* Top Mode Filter Chips & Model Selector */}
        <div className="flex items-center justify-between pb-1 px-1 border-b border-white/5 text-[10px]">
          <div className="flex items-center gap-1.5">
            {modeChips.map((chip) => {
              const Icon = chip.icon;
              const isActive = activeMode === chip.id;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onSelectMode(chip.id)}
                  className={`px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-neutral-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Sovereign Enclave · Gemini 2.5 Pro</span>
          </div>
        </div>

        {/* Input Bar Row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Voice Toggle */}
          <button
            type="button"
            id="btn-composer-voice"
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
              isVoiceActive
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title={isVoiceActive ? 'Disable Voice Input' : 'Enable Voice Command'}
          >
            {isVoiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            id="input-archos-universal-composer"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowPromptsPopover(true)}
            placeholder="Ask ArchOS about the UAE (e.g. 'What happens if Dubai increases autonomous transit by 30%?')..."
            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none"
            disabled={isProcessing}
          />

          {/* Prompt Library Button */}
          <button
            type="button"
            onClick={() => setShowPromptsPopover(!showPromptsPopover)}
            className="p-1.5 rounded-lg text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">INTENTS</span>
          </button>

          {/* Simulate Action Shortcut */}
          <button
            type="button"
            onClick={() => {
              onSelectMode('SIMULATE');
              if (query.trim()) onExecuteIntent(query.trim());
            }}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-bold hover:bg-purple-900 transition-all cursor-pointer hidden sm:flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>SIMULATE</span>
          </button>

          {/* Execute Submit Button */}
          <button
            type="submit"
            id="btn-composer-submit"
            disabled={!query.trim() || isProcessing}
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
              query.trim() && !isProcessing
                ? 'bg-white text-black hover:bg-neutral-200 shadow-md cursor-pointer'
                : 'bg-white/10 text-neutral-500 cursor-not-allowed border border-white/5'
            }`}
            title="Execute intent"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
    </footer>
  );
};
