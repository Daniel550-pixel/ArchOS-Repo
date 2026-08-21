import React, { useState, useEffect } from 'react';
import { ChevronRight, Mic, Volume2, VolumeX, BellRing, Sparkles, Cpu, Radio, Shield, CheckCircle2, Play, Settings2 } from 'lucide-react';
import { SystemState } from '../../types';
import { telemetryAlertService } from '../../services/telemetry/telemetryAlertService';
import { NeuralActivityLogPanel } from '../spatial/NeuralActivityLogPanel';
import { useArchOSStore } from '../../store/archosStore';
import { voiceService, ARCHOS_VOICE, SYNTHETIC_VOICE, CONSUL_VOICE, SENTINEL_VOICE, VOICE_PROFILES } from '../../services/voice/elevenlabs';
import { commandBus } from '../../services/commandBus';

interface BottomBarProps {
  breadcrumbs?: string[];
  systemState: SystemState;
  isListening: boolean;
  isSpeaking: boolean;
  lastSpokenText?: string;
  onSelectPrompt?: (prompt: string) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  breadcrumbs = ['UAE', 'Emirate', 'City', 'District', 'Building'],
  systemState,
  isListening: propIsListening,
  isSpeaking: propIsSpeaking,
  lastSpokenText: propLastSpokenText,
  onSelectPrompt
}) => {
  const [isNeuralLogOpen, setIsNeuralLogOpen] = useState<boolean>(false);
  const [showVoicePanel, setShowVoicePanel] = useState<boolean>(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([0.2, 0.4, 0.3, 0.6, 0.8, 0.5, 0.7, 0.3, 0.6, 0.4, 0.5, 0.2]);

  const {
    voiceStatus,
    lastSpokenText,
    activeVoiceProfileId,
    voiceVolume,
    isVoiceMuted,
    setVoiceVolume,
    setVoiceMuted
  } = useArchOSStore();

  const isSpeakingNow = voiceStatus === 'SPEAKING' || propIsSpeaking;
  const isSynthesizing = voiceStatus === 'SYNTHESIZING';

  // Dynamic Audio Visualizer Animation Loop
  useEffect(() => {
    let animId: number;
    const updateSpectrum = () => {
      if (isSpeakingNow) {
        const liveData = voiceService.getVisualizerData();
        setVisualizerBars(liveData);
      } else {
        // Idle ambient subtle wave
        const time = performance.now() * 0.003;
        setVisualizerBars((prev) =>
          prev.map((_, i) => Math.max(0.12, (Math.sin(time + i * 0.5) + 1.0) * 0.18))
        );
      }
      animId = requestAnimationFrame(updateSpectrum);
    };

    animId = requestAnimationFrame(updateSpectrum);
    return () => cancelAnimationFrame(animId);
  }, [isSpeakingNow]);

  const currentProfile = VOICE_PROFILES.find((p) => p && p.id === activeVoiceProfileId) || ARCHOS_VOICE;

  return (
    <>
      <footer className="relative z-40 flex items-center justify-between px-4 py-2 border-t border-[#00e5ff]/20 bg-[#05080e]/95 backdrop-blur-md select-none text-xs font-mono-tech gap-2">
        {/* Left: Spatial Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[#8e8d88] overflow-x-auto scrollbar-none max-w-[22%] lg:max-w-[25%] shrink-0">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb}-${idx}`}>
              <span
                className={`transition-colors whitespace-nowrap text-[11px] ${
                  idx === breadcrumbs.length - 1 ? 'text-[#00e5ff] font-semibold' : 'text-[#8e8d88] hover:text-[#f5f4f0]'
                }`}
              >
                {crumb}
              </span>
              {idx < breadcrumbs.length - 1 && (
                <span className="text-[#00e5ff]/40 select-none text-[10px]">
                  {idx === 0 ? '>>' : '>'}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Center-Left: Real-time Neural Activity Log Ticker */}
        <div className="flex items-center">
          <NeuralActivityLogPanel
            isOpen={isNeuralLogOpen}
            onToggle={() => setIsNeuralLogOpen(!isNeuralLogOpen)}
          />
        </div>

        {/* Center: Stream-First Sovereign Voice Visualizer & Status */}
        <div
          onClick={() => setShowVoicePanel(!showVoicePanel)}
          title="Click to toggle Sovereign Voice Control Panel"
          className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-[#09101c] hover:bg-[#0c1626] rounded-full border border-[#00e5ff]/25 transition-all shrink-0"
        >
          {/* Status Indicator LED */}
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isSpeakingNow
                ? 'bg-[#d4ff00] shadow-[0_0_8px_#d4ff00] animate-pulse'
                : isSynthesizing
                ? 'bg-[#00e5ff] shadow-[0_0_8px_#00e5ff] animate-ping'
                : isVoiceMuted
                ? 'bg-red-500/60'
                : 'bg-[#00e5ff]/40'
            }`}
          />

          {/* Dynamic Audio Bars */}
          <div className="flex items-center gap-[2px] h-3.5 px-0.5">
            {visualizerBars.slice(0, 8).map((heightScale, i) => (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-100 ${
                  isSpeakingNow
                    ? 'bg-[#d4ff00]'
                    : isSynthesizing
                    ? 'bg-[#00e5ff] animate-pulse'
                    : isVoiceMuted
                    ? 'bg-red-500/30'
                    : 'bg-[#00e5ff]/35'
                }`}
                style={{
                  height: `${Math.max(3, heightScale * 14)}px`
                }}
              />
            ))}
          </div>

          {/* Voice Label */}
          <span className="text-[10px] tracking-wider uppercase font-semibold font-mono">
            {isSpeakingNow ? (
              <span className="text-[#d4ff00] flex items-center gap-1">
                <Volume2 className="w-3 h-3 animate-pulse" />
                J.A.R.V.I.S. SPEAKING
              </span>
            ) : isSynthesizing ? (
              <span className="text-[#00e5ff] flex items-center gap-1 animate-pulse">
                <Radio className="w-3 h-3" />
                SYNTHESIZING...
              </span>
            ) : isVoiceMuted ? (
              <span className="text-red-400/80 flex items-center gap-1">
                <VolumeX className="w-3 h-3" />
                VOICE MUTED
              </span>
            ) : (
              <span className="text-[#8e8d88] hover:text-[#00e5ff] transition-colors flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#00e5ff]/60" />
                SOVEREIGN AUDIO IDLE
              </span>
            )}
          </span>

          <Settings2 className="w-3 h-3 text-[#8e8d88] hover:text-[#00e5ff] transition-colors ml-0.5" />
        </div>

        {/* Right: Sovereign Audio Quick Triggers & Multi-Modal Commands */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {/* Anomaly Threat Alert Speech */}
          <button
            onClick={() => {
              commandBus.handleSystemEvent({ type: 'THREAT_DETECTED' });
              telemetryAlertService.triggerSampleAlert(3);
            }}
            title="Trigger Threat Detection Sovereign Voice Warning"
            className="px-2 py-1 rounded border border-[#ff3b30]/40 bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30]/20 hover:border-[#ff3b30] transition-all text-[10px] font-medium flex items-center gap-1 shrink-0"
          >
            <BellRing className="w-3 h-3 text-[#ff3b30]" />
            <span className="hidden sm:inline">Threat Alert</span>
          </button>

          {/* Sovereign Auth Speech */}
          <button
            onClick={() => {
              commandBus.handleSystemEvent({ type: 'AUTH_SUCCESS' });
            }}
            title="Play Sovereign Access Verification Speech"
            className="px-2 py-1 rounded border border-[#00e5ff]/40 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:border-[#00e5ff] transition-all text-[10px] font-medium flex items-center gap-1 shrink-0"
          >
            <Shield className="w-3 h-3 text-[#00e5ff]" />
            <span className="hidden md:inline">Sovereign Auth</span>
            <span className="md:hidden">Auth</span>
          </button>

          {/* Simulation Complete Speech */}
          <button
            onClick={() => {
              commandBus.handleSystemEvent({ type: 'SIMULATION_COMPLETE' });
            }}
            title="Play Structural Simulation Complete Telemetry Voice"
            className="hidden xl:flex px-2 py-1 rounded border border-[#d4ff00]/40 bg-[#d4ff00]/10 text-[#d4ff00] hover:bg-[#d4ff00]/20 hover:border-[#d4ff00] transition-all text-[10px] items-center gap-1 shrink-0"
          >
            <CheckCircle2 className="w-3 h-3 text-[#d4ff00]" />
            <span>Sim Complete</span>
          </button>

          {/* Quick Voice Prompt Trigger */}
          <button
            onClick={() => {
              voiceService.stream("Good morning. UAE sovereign intelligence matrices are online and operating at maximum fidelity.");
              onSelectPrompt?.("Good morning, JARVIS");
            }}
            className="px-2 py-1 rounded border border-white/10 bg-[#09101c] text-[#f5f4f0] hover:border-[#00e5ff]/40 hover:text-[#00e5ff] transition-all text-[10px] items-center gap-1 shrink-0 flex"
          >
            <Volume2 className="w-3 h-3 text-[#00e5ff]" />
            <span className="hidden lg:inline">"Good morning, JARVIS"</span>
            <span className="lg:hidden">"JARVIS"</span>
          </button>
        </div>
      </footer>

      {/* Sovereign Voice Settings & Profile Panel */}
      {showVoicePanel && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-96 max-w-[92vw] bg-[#070d18]/98 border border-[#00e5ff]/30 rounded-lg shadow-[0_0_30px_rgba(0,229,255,0.2)] backdrop-blur-xl p-4 font-mono-tech text-xs text-[#f5f4f0] select-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#00e5ff]/20">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#00e5ff]" />
              <span className="font-semibold text-[13px] tracking-wide text-white">SOVEREIGN VOICE CONTROL</span>
            </div>
            <button
              onClick={() => setShowVoicePanel(false)}
              className="text-[#8e8d88] hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Voice Profile Selector */}
          <div className="my-3 space-y-2">
            <label className="text-[10px] text-[#8e8d88] uppercase tracking-wider block">Active Voice Profile</label>
            <div className="grid grid-cols-2 gap-1.5">
              {VOICE_PROFILES.map((p) => {
                const isSelected = p.id === activeVoiceProfileId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      voiceService.setVoiceProfile(p);
                      voiceService.stream(`Voice profile switched to ${p.name.replace(/_/g, ' ')}.`, p);
                    }}
                    className={`p-2 rounded border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#00e5ff] bg-[#00e5ff]/15 text-white shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                        : 'border-white/10 bg-[#09101c] text-[#8e8d88] hover:border-[#00e5ff]/30 hover:text-[#f5f4f0]'
                    }`}
                  >
                    <span className="font-semibold text-[11px] truncate text-[#00e5ff]">{p.name.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] text-[#8e8d88] truncate mt-0.5">{p.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ElevenLabs Status & Volume Controls */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8e8d88]">Provider Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                voiceService.hasApiKey()
                  ? 'bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30'
                  : 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30'
              }`}>
                {voiceService.hasApiKey() ? 'ElevenLabs High-Def Stream' : 'Sovereign Fallback Active'}
              </span>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#8e8d88]">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  voiceService.setVolume(val);
                }}
                className="flex-1 accent-[#00e5ff] h-1.5 bg-[#09101c] rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-[#00e5ff] w-8 text-right">
                {Math.round(voiceVolume * 100)}%
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const nextMute = !isVoiceMuted;
                  voiceService.setMuted(nextMute);
                }}
                className={`px-3 py-1 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 ${
                  isVoiceMuted
                    ? 'border-red-500/50 bg-red-500/20 text-red-300'
                    : 'border-white/10 bg-[#09101c] text-[#8e8d88] hover:text-white'
                }`}
              >
                {isVoiceMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                {isVoiceMuted ? 'Unmute Audio' : 'Mute Voice'}
              </button>

              <button
                onClick={() => {
                  voiceService.stream(
                    `This is sovereign voice profile ${currentProfile.name.replace(/_/g, ' ')}. All spatial and neural systems operational.`
                  );
                }}
                className="px-3 py-1 rounded text-[10px] font-semibold border border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/30 transition-all flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-[#00e5ff]" />
                Test Voice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
