import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Globe,
  Sparkles,
  Brain,
  Layers,
  Volume2,
  Check,
  X,
  Sliders,
  Sparkle,
  Shield,
  ShieldAlert,
  Compass,
  Crown,
  Activity,
  ShoppingBag,
  Coins,
  Key,
  FlaskConical,
  Box,
  HardHat,
  Zap,
  Bot,
  Gauge,
  Sunrise
} from 'lucide-react';
import { PersonalityArchetype, PersonalityConfig, SystemState } from '../../types';
import { speechService, ARCHETYPE_PRESETS } from '../../services/voice/speechService';
import { voiceService } from '../../services/voice/elevenlabs';
import { useArchOSStore } from '../../store/archosStore';
import { VoiceIndicator } from '../voice/VoiceIndicator';
import { SokoviaProtocolPanel } from '../spatial/SokoviaProtocolPanel';
import { SecurityFabricInspector } from '../spatial/SecurityFabricInspector';
import { DualModelReasoningPanel } from '../spatial/DualModelReasoningPanel';
import { UltronFinOpsStudio } from '../spatial/UltronFinOpsStudio';
import { QuantumSecurityModal } from '../spatial/QuantumSecurityModal';
import { KeySmithBot } from '../auth/KeySmithBot';
import { OpsPanel } from '../ops/OpsPanel';
import { BriefingRoom } from '../agi/BriefingRoom';
import { securityFabric } from '../../services/security/securityFabric';
import { quantumCryptoService } from '../../services/security/quantumCryptoService';

export type ActiveTab =
  | 'orb'
  | 'world'
  | 'intelligence'
  | 'rsi_agi'
  | 'design'
  | 'prove'
  | 'build'
  | 'experience'
  | 'pulse'
  | 'skyway'
  | 'weather'
  | 'valuation'
  | 'connectivity'
  | 'marketplace'
  | 'finops'
  | 'live';

interface HeaderBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  systemState: SystemState;
  isListening: boolean;
  onToggleListening: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  currentTimeStr?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onTabChange,
  systemState,
  isListening,
  onToggleListening,
  isCameraActive,
  onToggleCamera,
  currentTimeStr = '15 AUG 2026 · 07:42 GST'
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSokoviaModal, setShowSokoviaModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showDualModelModal, setShowDualModelModal] = useState(false);
  const [showFinOpsModal, setShowFinOpsModal] = useState(false);
  const [showQuantumModal, setShowQuantumModal] = useState(false);
  const [showKeySmithModal, setShowKeySmithModal] = useState(false);
  const [showOpsModal, setShowOpsModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [currentIdentity, setCurrentIdentity] = useState(securityFabric.getActiveIdentity());
  const [quantumKey, setQuantumKey] = useState(quantumCryptoService.getActiveKey());
  const [modalTab, setModalTab] = useState<'personality' | 'voices'>('personality');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [personality, setPersonality] = useState<PersonalityConfig>(speechService.getPersonality());

  useEffect(() => {
    const unsubSec = securityFabric.subscribe(() => {
      setCurrentIdentity(securityFabric.getActiveIdentity());
    });
    const unsubQ = quantumCryptoService.subscribe(() => {
      setQuantumKey(quantumCryptoService.getActiveKey());
    });
    return () => {
      unsubSec();
      unsubQ();
    };
  }, []);

  useEffect(() => {
    const updateVoices = () => {
      const v = speechService.getEnglishVoices();
      setVoices(v);
      setSelectedVoiceName(speechService.getSelectedVoiceName());
    };
    updateVoices();
    const unsubVoices = speechService.subscribeVoicesChanged(updateVoices);
    const unsubPersonality = speechService.subscribePersonalityChanged((cfg) => {
      setPersonality(cfg);
    });
    return () => {
      unsubVoices();
      unsubPersonality();
    };
  }, []);

  const tabs = [
    { id: 'orb', label: 'Orb Core', icon: Sparkles },
    { id: 'world', label: 'World Model', icon: Globe },
    { id: 'intelligence', label: 'Intelligence', icon: Brain },
    { id: 'rsi_agi', label: 'RSI / AGI Matrix', icon: Zap },
    { id: 'design', label: 'Design Studio', icon: Box },
    { id: 'prove', label: 'Prove Sandbox', icon: FlaskConical },
    { id: 'build', label: 'Build 4D', icon: HardHat },
    { id: 'experience', label: 'Experience', icon: Layers },
    { id: 'pulse', label: 'Pulse & Carbon', icon: Activity },
    { id: 'marketplace', label: 'Marketplace Hub', icon: ShoppingBag },
    { id: 'finops', label: 'FinOps & Router', icon: Coins }
  ] as const;

  const handleSelectVoice = (voiceName: string) => {
    speechService.setSelectedVoice(voiceName);
    setSelectedVoiceName(voiceName);
    speechService.speak("English voice initialized. JARVIS systems operational.");
  };

  const handleSelectArchetype = (archetype: PersonalityArchetype) => {
    speechService.setArchetype(archetype);
    const preset = ARCHETYPE_PRESETS[archetype];
    speechService.speak(
      `${preset.name} persona active. ${preset.affirmations[0]} How may I serve your inquiry across the Emirates?`
    );
  };

  const handleTraitChange = (key: keyof PersonalityConfig['traits'], val: number) => {
    speechService.setTraits({ [key]: val });
  };

  const archetypeIcons: Record<PersonalityArchetype, any> = {
    EXECUTIVE_CONSUL: Sparkle,
    STRATEGIC_ARCHITECT: Compass,
    TACTICAL_SENTINEL: Shield,
    ROYAL_CONCIERGE: Crown
  };

  return (
    <>
      <header className="relative z-40 flex items-center justify-between px-4 py-2.5 border-b border-[#00e5ff]/20 bg-[#040711]/95 backdrop-blur-xl select-none shadow-2xl">
        {/* Brand Identity & Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pr-2">
          <button
            onClick={() => onTabChange('orb')}
            className="flex items-center gap-2 text-left group focus:outline-none shrink-0"
          >
            {/* Pulsing Cyan Mini-Orb */}
            <div className="relative w-6 h-6 rounded-full flex items-center justify-center bg-[#00e5ff]/10 border border-[#00e5ff]/60 group-hover:border-[#00e5ff] transition-all">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff] animate-pulse" />
              <span className="absolute inset-0 rounded-full border border-[#00e5ff]/30 animate-ping opacity-30" />
            </div>
            <span className="font-mono-tech text-sm font-bold tracking-widest text-[#f5f4f0] group-hover:text-[#00e5ff] transition-colors">
              JARVIS / ARCHOS
            </span>
          </button>

          {/* Vertical Separator */}
          <div className="h-4 w-px bg-[#00e5ff]/20 mx-1 hidden sm:block shrink-0" />

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative px-3 py-1.5 rounded-lg font-mono-tech text-xs tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'text-[#00e5ff] bg-[#00e5ff]/15 font-semibold border border-[#00e5ff]/40 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                      : 'text-[#8e8d88] hover:text-[#f5f4f0] hover:bg-[#111622]/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00e5ff]' : 'text-[#8e8d88]'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute -bottom-[11px] left-0 right-0 h-[2px] bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Telemetry Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Date / Time Stamp */}
          <span className="font-mono-tech text-xs text-[#8e8d88] hidden 2xl:inline-block tracking-wider">
            {currentTimeStr}
          </span>

          {/* Dual AI Reasoning Cognitive Studio Trigger */}
          <button
            onClick={() => setShowDualModelModal(true)}
            title="Launch Dual-Model Cognitive Studio (Gemini 2.5 + OpenAI GPT-4o & Embeddings)"
            className="px-2 py-1 rounded-md border border-[#10b981]/50 bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 hover:border-[#10b981] transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          >
            <Brain className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="hidden xl:inline font-bold tracking-wide">DUAL AI</span>
          </button>

          {/* Sovereign Quantum Cryptography & QKD Enclave Trigger */}
          <button
            onClick={() => setShowQuantumModal(true)}
            title={`Sovereign Quantum Cryptographic Enclave (${quantumKey.algorithm} · ${quantumKey.coherencePct}% Coherence)`}
            className="px-2 py-1 rounded-md border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.25)]"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden xl:inline font-bold tracking-wide">QUANTUM</span>
            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              QKD
            </span>
          </button>

          {/* KEYSMITH 60s Rotating PQ Vault Bot Trigger */}
          <button
            onClick={() => setShowKeySmithModal(true)}
            title="KEYSMITH: 60s Rotating PQ Vault Keys (ML-KEM-768)"
            className="px-2 py-1 rounded-md border border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:border-amber-400 transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline font-bold tracking-wide">KEYSMITH</span>
            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              60s PQ
            </span>
          </button>

          {/* Ops & Observability Status Trigger */}
          <button
            onClick={() => setShowOpsModal(true)}
            title="Sovereign Observability & Temporal World Model Scrubber"
            className="px-2 py-1 rounded-md border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          >
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline font-bold tracking-wide">OPS</span>
          </button>

          {/* Zero-Trust Security Fabric Trigger */}
          <button
            onClick={() => setShowSecurityModal(true)}
            title={`Zero-Trust Security Fabric (${currentIdentity.role} · LVL ${currentIdentity.clearanceLevel})`}
            className="px-2 py-1 rounded-md border border-[#00e5ff]/40 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:border-[#00e5ff] transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
          >
            <Shield className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span className="hidden sm:inline font-bold tracking-wide">ZERO-TRUST</span>
            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#00e5ff]/20 text-[#00e5ff]">
              L{currentIdentity.clearanceLevel}
            </span>
          </button>

          {/* Sokovia Protocol Restricted Access Trigger */}
          <button
            onClick={() => setShowSokoviaModal(true)}
            title="Access Sokovia Protocol (DEFCON-1 Defense Parameters)"
            className="px-2 py-1 rounded-md border border-[#ec4899]/40 bg-[#ec4899]/10 text-[#ec4899] hover:bg-[#ec4899]/20 hover:border-[#ec4899] transition-all text-xs font-mono-tech flex items-center gap-1.5 shadow-[0_0_8px_rgba(236,72,153,0.2)]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="hidden lg:inline font-bold tracking-wide">SOKOVIA</span>
          </button>

          {/* Sovereign Voice Synthesis Status Indicator */}
          <VoiceIndicator onClick={() => setShowVoiceModal(true)} className="hidden lg:flex" />

          {/* Personal AI Voice & Persona Config Button */}
          <button
            onClick={() => setShowVoiceModal(true)}
            title="Configure JARVIS Voice & Personal AI Traits"
            className="px-2 py-1 rounded-md border border-[#00e5ff]/30 bg-[#09101c] text-[#00e5ff] hover:bg-[#00e5ff]/10 hover:border-[#00e5ff] transition-all text-xs font-mono-tech flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00e5ff]" />
          </button>

          {/* Autonomous Night Shift Morning Briefing Trigger */}
          <button
            onClick={() => setShowBriefing(true)}
            title="Open Autonomous Morning Briefing (Night Shift 07:00 GST)"
            className="px-2.5 py-1 rounded-md border border-[#00e5ff]/40 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono-tech shadow-[0_0_10px_rgba(0,229,255,0.15)] cursor-pointer"
          >
            <Sunrise className="w-3.5 h-3.5 text-[#d4ff00] animate-pulse" />
            <span className="hidden sm:inline font-bold">BRIEFING</span>
          </button>

          {/* Voice Recognition Toggle Button */}
          <button
            onClick={onToggleListening}
            title={isListening ? 'Disable Voice Sensing' : 'Enable Voice Sensing'}
            className={`p-1.5 rounded-md border transition-all flex items-center gap-1 text-xs font-mono-tech ${
              isListening
                ? 'bg-[#d4ff00]/10 border-[#d4ff00]/60 text-[#d4ff00] shadow-[0_0_8px_rgba(212,255,0,0.25)]'
                : 'bg-[#111622] border-[#00e5ff]/20 text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          {/* Hand Vision Toggle Button */}
          <button
            onClick={onToggleCamera}
            title={isCameraActive ? 'Disable Hand Vision Tracking' : 'Enable Hand Vision Tracking'}
            className={`p-1.5 rounded-md border transition-all flex items-center gap-1 text-xs font-mono-tech ${
              isCameraActive
                ? 'bg-[#00e5ff]/10 border-[#00e5ff]/60 text-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.25)]'
                : 'bg-[#111622] border-[#00e5ff]/20 text-[#8e8d88] hover:text-[#f5f4f0]'
            }`}
          >
            {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </button>

          {/* System State Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#09101c] border border-[#00e5ff]/30 rounded-full">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemState === 'SPEAKING'
                  ? 'bg-[#d4ff00] shadow-[0_0_8px_#d4ff00] animate-pulse'
                  : systemState === 'SIMULATING'
                  ? 'bg-[#ec4899] shadow-[0_0_8px_#ec4899] animate-ping'
                  : systemState === 'VISUALIZING'
                  ? 'bg-[#00e5ff] shadow-[0_0_8px_#00e5ff] animate-pulse'
                  : 'bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]'
              }`}
            />
            <span className="font-mono-tech text-[10px] font-bold tracking-wider text-[#00e5ff] uppercase">
              {systemState === 'IDLE' ? 'ONLINE' : systemState}
            </span>
          </div>
        </div>
      </header>

      {/* Voice & Personal AI Personality Configuration Modal */}
      <AnimatePresence>
        {showVoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-[#070c16] border border-[#00e5ff]/40 rounded-xl p-6 shadow-2xl font-mono-tech text-xs flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#00e5ff]/20">
                <div className="flex items-center gap-2.5 text-[#00e5ff]">
                  <Sliders className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-widest">JARVIS PERSONALITY & VOICE ENGINE</span>
                </div>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="p-1 text-[#8e8d88] hover:text-[#f5f4f0] rounded hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 pt-3 pb-1 border-b border-white/5">
                <button
                  onClick={() => setModalTab('personality')}
                  className={`px-3 py-1.5 rounded-t text-xs font-semibold tracking-wide transition-all border-b-2 ${
                    modalTab === 'personality'
                      ? 'text-[#00e5ff] border-[#00e5ff] bg-[#00e5ff]/10'
                      : 'text-[#8e8d88] border-transparent hover:text-white'
                  }`}
                >
                  Character & Persona
                </button>
                <button
                  onClick={() => setModalTab('voices')}
                  className={`px-3 py-1.5 rounded-t text-xs font-semibold tracking-wide transition-all border-b-2 ${
                    modalTab === 'voices'
                      ? 'text-[#00e5ff] border-[#00e5ff] bg-[#00e5ff]/10'
                      : 'text-[#8e8d88] border-transparent hover:text-white'
                  }`}
                >
                  English Voice Engine ({voices.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="my-4 overflow-y-auto pr-1 space-y-4 flex-1">
                {modalTab === 'personality' ? (
                  <div className="space-y-4">
                    {/* Archetype Cards */}
                    <div>
                      <label className="text-[#8e8d88] text-[11px] uppercase tracking-wider block mb-2 font-medium">
                        Personal AI Archetype
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(ARCHETYPE_PRESETS) as PersonalityArchetype[]).map((archKey) => {
                          const preset = ARCHETYPE_PRESETS[archKey];
                          const isSelected = personality.archetype === archKey;
                          const ArchIcon = archetypeIcons[archKey];
                          return (
                            <button
                              key={archKey}
                              onClick={() => handleSelectArchetype(archKey)}
                              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                                  : 'bg-[#09101c] border-white/10 text-[#f5f4f0] hover:border-[#00e5ff]/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <ArchIcon className="w-3.5 h-3.5 text-[#00e5ff]" />
                                  <span>{preset.name}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#00e5ff]" />}
                              </div>
                              <p className="text-[10px] text-[#8e8d88] leading-tight">
                                {preset.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fine-Tuning Sliders */}
                    <div className="bg-[#09101c] p-3.5 rounded-lg border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#00e5ff] font-bold text-xs uppercase tracking-wider">
                          Trait Modulation Sliders
                        </span>
                        <span className="text-[10px] text-[#8e8d88]">
                          Dynamic tone & lexicon adaptation
                        </span>
                      </div>

                      {/* Formality */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#8e8d88]">Formality & Stately Poise</span>
                          <span className="text-[#f5f4f0] font-semibold">{Math.round(personality.traits.formality * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={personality.traits.formality}
                          onChange={(e) => handleTraitChange('formality', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                        />
                      </div>

                      {/* Warmth */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#8e8d88]">Warmth & Empathy</span>
                          <span className="text-[#f5f4f0] font-semibold">{Math.round(personality.traits.warmth * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={personality.traits.warmth}
                          onChange={(e) => handleTraitChange('warmth', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                        />
                      </div>

                      {/* Brevity */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#8e8d88]">Brevity & Directness</span>
                          <span className="text-[#f5f4f0] font-semibold">{Math.round(personality.traits.brevity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={personality.traits.brevity}
                          onChange={(e) => handleTraitChange('brevity', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                        />
                      </div>

                      {/* Subtle Wit */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#8e8d88]">Subtle British Wit</span>
                          <span className="text-[#f5f4f0] font-semibold">{Math.round(personality.traits.subtleWit * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={personality.traits.subtleWit}
                          onChange={(e) => handleTraitChange('subtleWit', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[#8e8d88] text-[11px] leading-relaxed">
                      Select the underlying speech synthesis voice profile for JARVIS:
                    </p>
                    <div className="space-y-1.5">
                      {voices && voices.length > 0 ? (
                        voices.filter((v): v is SpeechSynthesisVoice => Boolean(v && typeof v === 'object' && v.name)).map((voice) => {
                          const isSelected = selectedVoiceName === voice.name;
                          return (
                            <button
                              key={voice.name}
                              onClick={() => handleSelectVoice(voice.name)}
                              className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff]'
                                  : 'bg-[#09101c] border-white/10 text-[#f5f4f0] hover:border-[#00e5ff]/40'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-xs">{voice.name}</span>
                                <span className="text-[10px] text-[#8e8d88]">{voice.lang || 'en'} {voice.default ? '(Default)' : ''}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#00e5ff]" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 bg-[#09101c] rounded-lg border border-white/10 text-center text-[#8e8d88]">
                          Default English AI Voice Active (en-GB / en-US)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#00e5ff]/20 flex items-center justify-between">
                <button
                  onClick={() => {
                    voiceService.stream(
                      `Telemetry check verified. Sovereign voice matrix is operational with command-grade clarity and real-time streaming.`
                    );
                  }}
                  className="px-3 py-1.5 rounded border border-[#00e5ff]/40 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 transition-all text-xs flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sample Sovereign Voice</span>
                </button>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="px-5 py-1.5 rounded bg-[#00e5ff] text-black font-semibold hover:bg-[#00e5ff]/90 transition-all text-xs"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sokovia Protocol Settings Panel */}
      <SokoviaProtocolPanel
        isOpen={showSokoviaModal}
        onClose={() => setShowSokoviaModal(false)}
      />

      {/* Zero-Trust Security Fabric Inspector */}
      <SecurityFabricInspector
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      {/* Dual-Model Cognitive Studio */}
      <DualModelReasoningPanel
        isOpen={showDualModelModal}
        onClose={() => setShowDualModelModal(false)}
      />

      {/* ULTRON FinOps Studio */}
      <UltronFinOpsStudio
        isOpen={showFinOpsModal}
        onClose={() => setShowFinOpsModal(false)}
      />

      {/* Sovereign Post-Quantum Cryptographic & QKD Enclave Command Center */}
      <QuantumSecurityModal
        isOpen={showQuantumModal}
        onClose={() => setShowQuantumModal(false)}
      />

      {/* KEYSMITH Rotating PQ Vault Bot Modal */}
      <AnimatePresence>
        {showKeySmithModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#070c16] border border-amber-500/40 rounded-xl p-6 shadow-2xl font-mono-tech flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-300">
                  <Bot className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-widest uppercase">
                    KEYSMITH // PQ ROTATING VAULT DAEMON
                  </span>
                </div>
                <button
                  onClick={() => setShowKeySmithModal(false)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <KeySmithBot />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Observability & Temporal World Model Scrubber Modal */}
      <AnimatePresence>
        {showOpsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-[#070c16] border border-emerald-500/40 rounded-xl p-6 shadow-2xl font-mono-tech flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Gauge className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-widest uppercase">
                    ENCLAVE OPS // TEMPORAL REALITY & PROMETHEUS METRICS
                  </span>
                </div>
                <button
                  onClick={() => setShowOpsModal(false)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <OpsPanel />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Autonomous Morning Briefing Room Modal */}
      <BriefingRoom open={showBriefing} onClose={() => setShowBriefing(false)} />
    </>
  );
};
