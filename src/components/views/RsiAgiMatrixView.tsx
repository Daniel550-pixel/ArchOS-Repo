import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Zap,
  Network,
  Users,
  Sparkles,
  Layers,
  Activity,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  Volume2,
  GitBranch,
  Target
} from 'lucide-react';
import { rsiAgiOrchestrator, RsiAgiTelemetry } from '../../services/agi/rsiAgiOrchestrator';
import { CognitiveState, SelfReflectionReport, metaCognition } from '../../services/agi/metaCognition';
import { speechService } from '../../services/voice/speechService';
import { MetaCognitivePanel } from '../agi/MetaCognitivePanel';
import { StrategicReasoningPanel } from '../agi/StrategicReasoningPanel';
import { ConceptGraph } from '../agi/ConceptGraph';
import { AgentSwarm } from '../agi/AgentSwarm';
import { JarvisChat } from '../agi/JarvisChat';
import { LiveTelemetry } from '../live/LiveTelemetry';
import { WebAuthnPasskeyModal } from '../security/WebAuthnPasskeyModal';
import { Radio, Fingerprint, MessageSquare } from 'lucide-react';

export type AgiLayerTab =
  | 'ALL_LAYERS'
  | 'META_COGNITION'
  | 'STRATEGIC_REASONING'
  | 'GENERAL_INTELLIGENCE'
  | 'AGENT_SWARM'
  | 'JARVIS_REAL'
  | 'MQTT_TELEMETRY'
  | 'WEBAUTHN_SECURITY';

export const RsiAgiMatrixView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AgiLayerTab>('ALL_LAYERS');
  const [telemetry, setTelemetry] = useState<RsiAgiTelemetry>(rsiAgiOrchestrator.getTelemetry());
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>(metaCognition.getState());
  const [isAscending, setIsAscending] = useState(false);
  const [ascensionMessage, setAscensionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubTelemetry = rsiAgiOrchestrator.subscribeTelemetry((t) => setTelemetry(t));
    const unsubMeta = metaCognition.subscribe((s) => setCognitiveState(s));

    return () => {
      unsubTelemetry();
      unsubMeta();
    };
  }, []);

  const handleTriggerAscension = async () => {
    setIsAscending(true);
    setAscensionMessage('CALIBRATING COGNITIVE HYPER-TENSORS & MULTI-AGENT SYNTHESIS...');
    
    try {
      const rep = await rsiAgiOrchestrator.triggerManualAscension();
      setCognitiveState(rep.cognitive_state);
      setAscensionMessage(`ASCENSION COMPLETE · LEVEL ${rep.cognitive_state.ascension_level.toFixed(1)} · ETHICAL ALIGNMENT ${(rep.ethical_alignment_score * 100).toFixed(1)}%`);
      setTimeout(() => setAscensionMessage(null), 5000);
    } finally {
      setIsAscending(false);
    }
  };

  const handleVoiceBriefing = () => {
    speechService.speak(
      `ArchOS Real-Time Strategic Intelligence operational. Cognitive ascension at level ${cognitiveState.ascension_level.toFixed(1)}. Working memory load at ${(cognitiveState.working_memory_load * 100).toFixed(0)} percent. Autonomous agent swarm synchronized across six specialized nodes.`
    );
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-[#02050c] text-white font-mono-tech select-none overflow-hidden">
      {/* Background Holographic Matrix Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 20%, rgba(168, 85, 247, 0.2) 0%, transparent 60%),
              linear-gradient(rgba(0, 229, 255, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px'
          }}
        />
      </div>

      {/* TOP RSI/AGI COGNITIVE STATUS HEADER */}
      <div className="z-30 w-full px-6 py-3 bg-[#040813]/95 border-b border-[#00e5ff]/25 backdrop-blur-md flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#a855f7]/30 to-[#00e5ff]/30 border border-[#a855f7]/50 text-[#d4ff00] shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wider uppercase">
                JARVIS / ARCHOS · REAL-TIME STRATEGIC INTELLIGENCE (RSI / AGI)
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#a855f7]/25 text-[#d4ff00] border border-[#a855f7]/50 font-bold animate-pulse">
                ⚡ ASCENDED · LEVEL {cognitiveState.ascension_level.toFixed(1)}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Meta-Cognitive Self-Reflection · Multi-Horizon Planning · D3 Knowledge Graph · Autonomous Swarm Nexus
            </p>
          </div>
        </div>

        {/* Live Telemetry Pills & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-[10px]">
            <Activity className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span className="text-zinc-400">Cog Load:</span>
            <span className="font-bold text-[#00e5ff]">{(cognitiveState.working_memory_load * 100).toFixed(0)}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-[10px]">
            <Layers className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="text-zinc-400">Depth:</span>
            <span className="font-bold text-[#a855f7]">LOD {cognitiveState.reasoning_depth}/5</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-zinc-400">Ethics:</span>
            <span className="font-bold text-[#10b981]">{(cognitiveState.ethical_alignment_score * 100).toFixed(1)}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-[10px]">
            <Users className="w-3.5 h-3.5 text-[#d4ff00]" />
            <span className="text-zinc-400">Swarm:</span>
            <span className="font-bold text-[#d4ff00]">{telemetry.activeAgentsCount} Nodes</span>
          </div>

          {/* Voice Briefing Button */}
          <button
            onClick={handleVoiceBriefing}
            title="Play Audio Cognitive Briefing"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[#00e5ff] hover:text-white transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Trigger Ascension Button */}
          <button
            onClick={handleTriggerAscension}
            disabled={isAscending}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#00e5ff] hover:opacity-90 text-black text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAscending ? 'animate-spin' : ''}`} />
            <span>{isAscending ? 'REFLECTING...' : 'SELF-REFLECT & ASCEND'}</span>
          </button>
        </div>
      </div>

      {/* Ascension Notification Banner */}
      {ascensionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="z-20 w-full py-1.5 px-6 bg-gradient-to-r from-[#a855f7]/30 via-[#00e5ff]/30 to-[#a855f7]/30 border-b border-[#a855f7]/40 text-[10px] font-bold text-center text-[#d4ff00] flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>{ascensionMessage}</span>
        </motion.div>
      )}

      {/* NAVIGATION LAYER TABS */}
      <div className="z-20 w-full px-6 py-2 bg-[#050b18] border-b border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('ALL_LAYERS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'ALL_LAYERS'
              ? 'bg-white text-black shadow-[0_0_12px_#ffffff]'
              : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid size={14} />
          <span>0. COMPOSITE MATRIX (4 QUADRANTS)</span>
        </button>

        <button
          onClick={() => setActiveTab('META_COGNITION')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'META_COGNITION'
              ? 'bg-[#a855f7] text-black shadow-[0_0_12px_#a855f7]'
              : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
          }`}
        >
          <Brain size={14} />
          <span>1. META-COGNITIVE LAYER</span>
        </button>

        <button
          onClick={() => setActiveTab('STRATEGIC_REASONING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'STRATEGIC_REASONING'
              ? 'bg-[#00e5ff] text-black shadow-[0_0_12px_#00e5ff]'
              : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
          }`}
        >
          <Target size={14} />
          <span>2. STRATEGIC REASONING (RSI)</span>
        </button>

        <button
          onClick={() => setActiveTab('GENERAL_INTELLIGENCE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'GENERAL_INTELLIGENCE'
              ? 'bg-[#ec4899] text-black shadow-[0_0_12px_#ec4899]'
              : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
          }`}
        >
          <Network size={14} />
          <span>3. CONCEPT GRAPH (AGI)</span>
        </button>

        <button
          onClick={() => setActiveTab('AGENT_SWARM')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'AGENT_SWARM'
              ? 'bg-[#d4ff00] text-black shadow-[0_0_12px_#d4ff00]'
              : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
          }`}
        >
          <Users size={14} />
          <span>4. AUTONOMOUS AGENT SWARM</span>
        </button>

        <button
          onClick={() => setActiveTab('JARVIS_REAL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'JARVIS_REAL'
              ? 'bg-[#00e5ff] text-black shadow-[0_0_12px_#00e5ff]'
              : 'text-[#00e5ff] border border-[#00e5ff]/30 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20'
          }`}
        >
          <MessageSquare size={14} />
          <span>5. J.A.R.V.I.S. GROUND TRUTH</span>
        </button>

        <button
          onClick={() => setActiveTab('MQTT_TELEMETRY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'MQTT_TELEMETRY'
              ? 'bg-[#10b981] text-black shadow-[0_0_12px_#10b981]'
              : 'text-[#10b981] border border-[#10b981]/30 bg-[#10b981]/10 hover:bg-[#10b981]/20'
          }`}
        >
          <Radio size={14} />
          <span>6. REAL MQTT TELEMETRY</span>
        </button>

        <button
          onClick={() => setActiveTab('WEBAUTHN_SECURITY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'WEBAUTHN_SECURITY'
              ? 'bg-[#ffd700] text-black shadow-[0_0_12px_#ffd700]'
              : 'text-[#ffd700] border border-[#ffd700]/30 bg-[#ffd700]/10 hover:bg-[#ffd700]/20'
          }`}
        >
          <Fingerprint size={14} />
          <span>7. WEBAUTHN PASSKEYS</span>
        </button>
      </div>

      {/* MAIN VIEWPORT BODY */}
      <div className="relative flex-1 w-full overflow-y-auto p-4 flex flex-col">
        {/* VIEW 0: 4-QUADRANT COMPOSITE MATRIX */}
        {activeTab === 'ALL_LAYERS' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full h-full">
            {/* Quadrant 1: Meta-Cognition */}
            <div className="h-[480px] xl:h-full">
              <MetaCognitivePanel />
            </div>

            {/* Quadrant 2: Strategic Reasoning */}
            <div className="h-[480px] xl:h-full">
              <StrategicReasoningPanel />
            </div>

            {/* Quadrant 3: Concept Graph */}
            <div className="h-[480px] xl:h-full">
              <ConceptGraph />
            </div>

            {/* Quadrant 4: Agent Swarm */}
            <div className="h-[480px] xl:h-full">
              <AgentSwarm />
            </div>
          </div>
        )}

        {/* VIEW 1: DEDICATED META-COGNITIVE PANEL */}
        {activeTab === 'META_COGNITION' && (
          <div className="w-full h-full max-w-7xl mx-auto flex-1">
            <MetaCognitivePanel />
          </div>
        )}

        {/* VIEW 2: DEDICATED STRATEGIC REASONING PANEL */}
        {activeTab === 'STRATEGIC_REASONING' && (
          <div className="w-full h-full max-w-7xl mx-auto flex-1">
            <StrategicReasoningPanel />
          </div>
        )}

        {/* VIEW 3: DEDICATED CONCEPT GRAPH */}
        {activeTab === 'GENERAL_INTELLIGENCE' && (
          <div className="w-full h-full max-w-7xl mx-auto flex-1">
            <ConceptGraph />
          </div>
        )}

        {/* VIEW 4: DEDICATED AGENT SWARM */}
        {activeTab === 'AGENT_SWARM' && (
          <div className="w-full h-full max-w-7xl mx-auto flex-1">
            <AgentSwarm />
          </div>
        )}

        {/* VIEW 5: DEDICATED J.A.R.V.I.S. GROUND TRUTH CHAT */}
        {activeTab === 'JARVIS_REAL' && (
          <div className="w-full h-full max-w-4xl mx-auto flex-1">
            <JarvisChat />
          </div>
        )}

        {/* VIEW 6: DEDICATED MQTT TELEMETRY BUS */}
        {activeTab === 'MQTT_TELEMETRY' && (
          <div className="w-full h-full max-w-5xl mx-auto flex-1">
            <LiveTelemetry />
          </div>
        )}

        {/* VIEW 7: DEDICATED WEBAUTHN PASSKEYS CEREMONY */}
        {activeTab === 'WEBAUTHN_SECURITY' && (
          <div className="w-full h-full max-w-2xl mx-auto flex-1 flex items-center justify-center">
            <WebAuthnPasskeyModal />
          </div>
        )}
      </div>
    </div>
  );
};
