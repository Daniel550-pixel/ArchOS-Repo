import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Radio,
  FileCheck2,
  Database,
  Building2,
  Share2,
  Brain,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  Zap,
  TrendingUp,
  Compass,
  AlertTriangle,
  GitBranch,
  Search,
  Filter
} from 'lucide-react';
import { INTELLIGENCE_FEED, IntelligenceFeedItem } from '../../intelligence/briefingData';
import { speechService } from '../../services/voice/speechService';
import { dualModelService, DualReasoningResult } from '../../services/ai/dualModelService';

interface IntelligenceEngineViewProps {
  selectedItem?: IntelligenceFeedItem;
  onSelectItem?: (item: IntelligenceFeedItem) => void;
  isSpeaking: boolean;
  onToggleSpeech: (text: string) => void;
}

export const IntelligenceEngineView: React.FC<IntelligenceEngineViewProps> = ({
  selectedItem = INTELLIGENCE_FEED[0],
  onSelectItem,
  isSpeaking,
  onToggleSpeech
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [dualSynthesis, setDualSynthesis] = useState<DualReasoningResult | null>(null);
  const [neuralWaveform, setNeuralWaveform] = useState<number[]>([30, 55, 80, 45, 90, 65, 75, 40, 85, 50, 70, 95]);
  const [activeTab, setActiveTab] = useState<'SYNTHESIS' | 'NEURAL_TOPOLOGY' | 'CONSENSUS_AUDIT'>('SYNTHESIS');

  const filters = ['ALL', 'FACT', 'ANALYSIS', 'FORECAST', 'SIMULATION', 'ASSUMPTION'];

  const filteredFeed =
    activeFilter === 'ALL'
      ? INTELLIGENCE_FEED
      : INTELLIGENCE_FEED.filter((item) => item.tag === activeFilter);

  // Animate neural audio / data spectrum
  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralWaveform((prev) =>
        prev.map(() => Math.floor(Math.random() * 75) + 20)
      );
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleNarrate = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
    } else {
      const speechText = `${selectedItem.title}. Sourced from ${selectedItem.source} with confidence ${Math.round(
        selectedItem.confidence * 100
      )} percent. Why this matters: ${selectedItem.whyThisMatters}`;
      onToggleSpeech(speechText);
    }
  };

  const handleSynthesizeDualAI = async () => {
    setIsSynthesizing(true);
    setDualSynthesis(null);
    try {
      const res = await dualModelService.executeReasoning({
        prompt: `Strategic Analysis for UAE item: "${selectedItem.title}". Context: "${selectedItem.whyThisMatters}". Key Entity: ${selectedItem.entity} (${selectedItem.affectedPath}). Impact: ${selectedItem.impactMetrics}. Evaluate infrastructure resilience, economic trajectory, and multi-emirate logistics impact.`,
        provider: 'dual_consensus'
      });
      setDualSynthesis(res);
      speechService.speak('Dual AI consensus synthesis generated for selected intelligence report.');
    } catch (e) {
      console.error('Dual AI synthesis error:', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#02050d] select-none font-mono-tech">
      {/* Background Holographic Glow & Cybernetic Grid (Image 1, 3, 4) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full bg-radial from-[#00e5ff]/10 via-[#0284c7]/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Top Filter Bar & Neural Status Header (Images 1 & 4) */}
      <div className="z-20 flex items-center justify-between px-6 py-2.5 border-b border-[#00e5ff]/20 bg-[#060b17]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f5f4f0] uppercase tracking-wider">
                EPISTEMIC INTELLIGENCE ENGINE
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                PROVENANCE VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer ${
                  isActive
                    ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                    : 'text-[#8e8d88] border border-white/5 hover:text-[#f5f4f0] hover:bg-[#111622]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Dual AI Consensus Button */}
        <button
          onClick={handleSynthesizeDualAI}
          disabled={isSynthesizing}
          className="px-3 py-1.5 rounded-xl bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/50 text-xs font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.2)] transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
          <span>DUAL AI CONSENSUS</span>
        </button>
      </div>

      {/* Main Content Grid (Images 1, 3, 7) */}
      <div className="z-10 flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Feed Item Selector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/30 backdrop-blur-xl shadow-2xl flex flex-col gap-3 relative overflow-hidden">
            {/* Top glowing edge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent opacity-70" />

            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                STRATEGIC BRIEFING STREAM
              </span>
              <span className="text-[10px] text-[#00e5ff] font-bold">
                {filteredFeed.length} REPORTS
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
              {filteredFeed.map((item) => {
                const isSelected = selectedItem.id === item.id;
                const isFact = item.tag === 'FACT';
                const isAnalysis = item.tag === 'ANALYSIS';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onSelectItem) onSelectItem(item);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : 'bg-[#08111e] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00e5ff]" />
                    )}

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          isFact
                            ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                            : isAnalysis
                            ? 'bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40'
                            : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                        }`}
                      >
                        {item.tag}
                      </span>
                      <span className="text-[9px] text-[#8e8d88]">{item.cityId.toUpperCase()}</span>
                    </div>

                    <p className="text-xs font-medium text-white leading-snug">
                      {item.title}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-[#8e8d88] border-t border-white/5 pt-1.5">
                      <span>Source: {item.source}</span>
                      <span className="text-[#00e5ff] font-bold">Conf: {(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Intelligence Holographic Glass Terminal (Images 1, 3, 7) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Holographic Report Card (Styled like Claude Neural Glass in Image 3) */}
          <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4 relative overflow-hidden">
            {/* Top glowing geometric cap */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent opacity-90" />

            {/* Header with Tag & Voice Controls */}
            <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded bg-[#00e5ff]/20 text-[#00e5ff] font-bold border border-[#00e5ff]/40">
                  {selectedItem.tag}
                </span>
                <span className="text-xs text-[#8e8d88]">{selectedItem.domainId.toUpperCase()} · {selectedItem.cityId.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNarrate}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b] animate-pulse'
                      : 'bg-white/5 border-white/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:border-[#00e5ff]/40'
                  }`}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isSpeaking ? 'STOP BRIEFING' : 'AUDIO BRIEFING'}</span>
                </button>
              </div>
            </div>

            {/* Title & Neural Audio Spectrum */}
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-bold text-[#f5f4f0] leading-snug">
                {selectedItem.title}
              </h2>

              {/* Spectrum Visualizer during speech */}
              <div className="flex items-end gap-1 h-6 bg-black/40 p-1 rounded-lg border border-white/5">
                {neuralWaveform.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-[#004488] to-[#00e5ff] rounded-t-sm transition-all duration-100"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Why This Matters & Strategic Impact */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <span className="text-[10px] text-[#00e5ff] font-bold uppercase tracking-wider">
                STRATEGIC SIGNIFICANCE & IMPLICATIONS
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {selectedItem.whyThisMatters}
              </p>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Confidence Rating</span>
                <span className="text-base font-bold text-[#00e5ff]">
                  {(selectedItem.confidence * 100).toFixed(0)}% Verified
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Impact Velocity</span>
                <span className="text-base font-bold text-[#d4ff00]">
                  {selectedItem.relevance > 0.8 ? 'CRITICAL HIGH' : 'MODERATE'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Primary Source</span>
                <span className="text-xs font-bold text-white truncate max-w-[120px] mt-1">
                  {selectedItem.source}
                </span>
              </div>
            </div>

            {/* Dual AI Consensus Box if Synthesized */}
            {dualSynthesis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/50 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00e5ff]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      DUAL AI CONSENSUS SYNTHESIS
                    </span>
                  </div>
                  <span className="text-[10px] text-[#10b981] font-bold">
                    CONSENSUS: {(dualSynthesis.confidenceScore * 100).toFixed(1)}% · {dualSynthesis.consensusDegree}
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                  {dualSynthesis.synthesis}
                </p>

                {dualSynthesis.agreedPoints && dualSynthesis.agreedPoints.length > 0 && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-[#00e5ff]/20">
                    <span className="text-[9px] text-[#00e5ff] font-bold uppercase">
                      VERIFIED CONSENSUS POINTS
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dualSynthesis.agreedPoints.map((pt, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-zinc-300">
                          ✓ {pt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
