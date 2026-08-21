import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Send,
  Sliders,
  Layers,
  ArrowRight,
  Database,
  Search,
  Key,
  X,
  FileCheck2
} from 'lucide-react';
import { dualModelService, DualReasoningResult, AIModelsStatusResponse } from '../../services/ai/dualModelService';
import { securityFabric } from '../../services/security/securityFabric';
import { speechService } from '../../services/voice/speechService';
import { spatialContextSynchronizer, ActiveSpatialContext } from '../../services/spatial/SpatialContextSynchronizer';
import { Crosshair, MapPin } from 'lucide-react';

interface DualModelReasoningPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PROMPTS = [
  'Assess UAE national supply chain resiliency against Hormuz maritime bottlenecks.',
  'Formulate 2035 autonomous mobility & renewable grid expansion strategy for Dubai & Abu Dhabi.',
  'Analyze macroeconomic impact of sovereign AI data centers in Masdar City and DIFC.',
  'Evaluate cross-emirate desalination energy demands under peak summer thermal load.'
];

const UAE_KNOWLEDGE_PILLARS = [
  { id: 'dubai_mobility', label: 'Dubai Autonomous Transport & SkyPods', text: 'Dubai 2030 autonomous transport strategy converting 25% of transportation trips to autonomous modes with metro and drone corridors.' },
  { id: 'ad_barakah', label: 'Abu Dhabi Barakah Nuclear & Clean Energy', text: 'Barakah Nuclear Energy Plant providing 40 TWh of clean baseload electricity, powering 25% of UAE electricity demand with zero carbon.' },
  { id: 'shj_academic', label: 'Sharjah R&D Innovation Mesh', text: 'Sharjah Research Technology and Innovation Park fostering AI spatial computing, additive manufacturing, and hydroponic agriculture.' },
  { id: 'fuj_bunkering', label: 'Fujairah Deepwater Bunkering & Crude Pipeline', text: 'Habshan-Fujairah pipeline bypassing Strait of Hormuz to deliver 1.8M barrels of crude daily to Gulf of Oman deepwater terminals.' }
];

export const DualModelReasoningPanel: React.FC<DualModelReasoningPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'REASONING' | 'EMBEDDINGS' | 'CONSENSUS_AUDIT'>('REASONING');
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [selectedProvider, setSelectedProvider] = useState<'dual_consensus' | 'gemini' | 'openai'>('dual_consensus');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DualReasoningResult | null>(null);
  const [modelsStatus, setModelsStatus] = useState<AIModelsStatusResponse | null>(null);
  const [spatialCtx, setSpatialCtx] = useState<ActiveSpatialContext>(spatialContextSynchronizer.getActiveContext());

  // Embeddings Explorer State
  const [embeddingQuery, setEmbeddingQuery] = useState('Clean energy grid and carbon-free base load');
  const [embeddingMatches, setEmbeddingMatches] = useState<{ id: string; label: string; similarity: number }[]>([]);
  const [isEmbeddingLoading, setIsEmbeddingLoading] = useState(false);

  useEffect(() => {
    dualModelService.getModelsStatus().then(setModelsStatus);
    const unsub = spatialContextSynchronizer.subscribe(setSpatialCtx);
    return () => unsub();
  }, []);

  const handleExecuteReasoning = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setResult(null);

    // Gated check through Zero-Trust Security Fabric
    const activeIdentity = securityFabric.getActiveIdentity();
    const securityCheck = securityFabric.evaluateAndAuthorize({
      toolName: `ai_reasoning.${selectedProvider}`,
      callerIdentity: activeIdentity.id,
      targetResource: `ai.engine.${selectedProvider}`,
      resourceClassification: 'CONFIDENTIAL',
      domainScope: 'intelligence.query',
      actionType: 'EXECUTE',
      reason: `Dual-Model AI query: ${prompt.slice(0, 50)}...`
    });

    if (securityCheck.status === 'DENIED') {
      setIsProcessing(false);
      speechService.speak('AI reasoning request blocked by Zero-Trust security gateway.');
      return;
    }

    try {
      const res = await dualModelService.executeReasoning({
        prompt,
        provider: selectedProvider,
        geminiModel,
        openaiModel
      });
      setResult(res);
      speechService.speak(
        selectedProvider === 'dual_consensus'
          ? 'Dual-model consensus reasoning synthesized with verified confidence score.'
          : `${selectedProvider.toUpperCase()} sovereign reasoning generated.`
      );
    } catch (err: any) {
      console.error('[Reasoning Error]:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunEmbeddingSearch = async () => {
    if (!embeddingQuery.trim()) return;
    setIsEmbeddingLoading(true);
    try {
      const queryEmb = await dualModelService.generateEmbedding(embeddingQuery, 'text-embedding-3-small');
      
      const scored = await Promise.all(
        UAE_KNOWLEDGE_PILLARS.map(async (pillar) => {
          const docEmb = await dualModelService.generateEmbedding(pillar.text, 'text-embedding-3-small');
          const sim = dualModelService.cosineSimilarity(queryEmb.embedding, docEmb.embedding);
          return {
            id: pillar.id,
            label: pillar.label,
            similarity: sim
          };
        })
      );

      scored.sort((a, b) => b.similarity - a.similarity);
      setEmbeddingMatches(scored);
    } catch (err) {
      console.error('[Embedding Error]:', err);
    } finally {
      setIsEmbeddingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md font-mono-tech select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-5xl max-h-[90vh] bg-[#070c16] border border-[#00e5ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col overflow-hidden text-xs text-[#c4c3be]"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00e5ff]/20 bg-[#09101c]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/20 border border-[#00e5ff] flex items-center justify-center text-[#00e5ff] shadow-[0_0_10px_#00e5ff]">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#f5f4f0] uppercase tracking-wider">
                  DUAL-MODEL COGNITIVE STUDIO
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                  GEMINI 2.5 + OPENAI GPT-4o
                </span>
              </div>
              <p className="text-[10px] text-[#8e8d88]">
                Parallel Consensus Synthesis & Vector Semantic Retrieval Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
                Gemini: {modelsStatus?.providers[0]?.status || 'ONLINE'}
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                OpenAI: {modelsStatus?.providers[1]?.status || 'ONLINE'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8e8d88] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-white/10 bg-[#05080e]">
          {[
            { id: 'REASONING', label: 'DUAL-MODEL REASONING', icon: Brain },
            { id: 'EMBEDDINGS', label: 'VECTOR EMBEDDINGS (UAE PILLARS)', icon: Database },
            { id: 'CONSENSUS_AUDIT', label: 'SECURITY & TOKEN REDACTION', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.25)]'
                    : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Dual-Model Reasoning */}
        {activeTab === 'REASONING' && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
            {/* Model Selectors & Provider Config */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedProvider('dual_consensus')}
                className={`p-3 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                  selectedProvider === 'dual_consensus'
                    ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#00e5ff]">DUAL CONSENSUS</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
                </div>
                <p className="text-[10px] text-[#8e8d88]">
                  Concurrent Gemini 2.5 + GPT-4o with cross-model disagreement analysis.
                </p>
              </button>

              <button
                onClick={() => setSelectedProvider('gemini')}
                className={`p-3 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                  selectedProvider === 'gemini'
                    ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#00e5ff]">GEMINI SOVEREIGN</span>
                  <Cpu className="w-3.5 h-3.5 text-[#00e5ff]" />
                </div>
                <p className="text-[10px] text-[#8e8d88]">
                  Direct low-latency spatial & visual telemetry reasoning (Gemini 2.5 Flash).
                </p>
              </button>

              <button
                onClick={() => setSelectedProvider('openai')}
                className={`p-3 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                  selectedProvider === 'openai'
                    ? 'bg-[#10b981]/15 border-[#10b981] text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#10b981]">OPENAI ENGINE</span>
                  <Zap className="w-3.5 h-3.5 text-[#10b981]" />
                </div>
                <p className="text-[10px] text-[#8e8d88]">
                  GPT-4o / o-series for macroeconomic & regulatory contingency parsing.
                </p>
              </button>
            </div>

            {/* Spatial Context Telemetry Anchor */}
            <div className="p-2.5 rounded-xl bg-[#09101c] border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Crosshair className="w-3 h-3" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-cyan-300">
                      SPATIAL FOCUS: {spatialCtx.focusedEntity?.name || 'UAE NATIONAL OVERVIEW'}
                    </span>
                    {spatialCtx.focusedEntity && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {spatialCtx.focusedEntity.entityClass}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-[#8e8d88]">
                    {spatialCtx.lastGestureAction ? `Last Gesture: ${spatialCtx.lastGestureAction}` : 'Zero-latency spatial raycast telemetry injected into prompt synthesis'}
                  </p>
                </div>
              </div>

              {spatialCtx.focusedEntity ? (
                <button
                  onClick={() => spatialContextSynchronizer.clearFocus()}
                  className="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  Reset Focus
                </button>
              ) : (
                <span className="text-[9px] text-cyan-500/80 font-mono">
                  {spatialCtx.hoveredEntityId ? `HOVERING: ${spatialCtx.hoveredEntityId}` : 'POINT AT 3D SCENE TO FOCUS'}
                </span>
              )}
            </div>

            {/* Prompt Input Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#8e8d88] uppercase text-[10px]">
                  STRATEGIC INQUIRY PROMPT
                </span>
                <div className="flex items-center gap-1">
                  {SAMPLE_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(p)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-[#8e8d88] hover:text-white"
                    >
                      Sample {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Enter strategic query or scenario for the dual AI engines..."
                  className="w-full rounded-xl bg-[#09101c] border border-white/10 focus:border-[#00e5ff] p-3 text-white placeholder-[#8e8d88] outline-none resize-none font-mono-tech leading-relaxed"
                />
                <button
                  onClick={handleExecuteReasoning}
                  disabled={isProcessing || !prompt.trim()}
                  className="absolute right-3 bottom-3 px-4 py-1.5 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/90 disabled:opacity-50 text-black font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>COGNITIVE SYNTHESIS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>EXECUTE REASONING</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Reasoning Output Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 p-5 rounded-xl border border-[#00e5ff]/30 bg-[#09101c]/90"
              >
                {/* Result Top Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] font-bold">
                      {result.mode.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#8e8d88]">
                      Confidence: <strong className="text-[#d4ff00]">{(result.confidenceScore * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="text-[10px] text-[#8e8d88]">
                      Consensus: <strong className="text-[#00e5ff]">{result.consensusDegree}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[#8e8d88]">
                    <span>Audit Hash:</span>
                    <span className="font-mono text-[#00e5ff]">{result.provenanceAuditHash}</span>
                  </div>
                </div>

                {/* Synthesis Output Body */}
                <div className="text-white whitespace-pre-wrap leading-relaxed text-xs font-sans bg-[#070c16] p-4 rounded-xl border border-white/5">
                  {result.synthesis}
                </div>

                {/* Consensus Agreement & Divergence Breakdown */}
                {result.mode === 'dual_consensus' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/20 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[#00e5ff] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>CROSS-MODEL FACTUAL AGREEMENTS</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-[#c4c3be] space-y-1">
                        {result.agreedPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-[#f59e0b]/5 border border-[#f59e0b]/20 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[#f59e0b] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>COMPLEMENTARY PERSPECTIVES</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-[#c4c3be] space-y-1">
                        {result.divergentPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Tab 2: Vector Embeddings Explorer */}
        {activeTab === 'EMBEDDINGS' && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-[#f5f4f0]">
                UAE WORLD MODEL VECTOR EMBEDDINGS (TEXT-EMBEDDING-3-SMALL)
              </span>
              <p className="text-[11px] text-[#8e8d88]">
                Calculate semantic cosine similarity against national infrastructure knowledge vectors.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={embeddingQuery}
                onChange={(e) => setEmbeddingQuery(e.target.value)}
                placeholder="Enter query for vector similarity match..."
                className="flex-1 px-4 py-2 rounded-xl bg-[#09101c] border border-white/10 focus:border-[#00e5ff] text-white outline-none"
              />
              <button
                onClick={handleRunEmbeddingSearch}
                disabled={isEmbeddingLoading || !embeddingQuery.trim()}
                className="px-4 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-black font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.3)] disabled:opacity-50"
              >
                {isEmbeddingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>MATCH VECTORS</span>
              </button>
            </div>

            {/* Results Vector Matrix */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-[#8e8d88] uppercase">
                KNOWLEDGE VECTOR SIMILARITY RANKING
              </span>

              {embeddingMatches.length > 0 ? (
                embeddingMatches.map((m, idx) => {
                  const matchPillar = UAE_KNOWLEDGE_PILLARS.find((p) => p.id === m.id);
                  const percentage = Math.round(m.similarity * 100);
                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#09101c] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] font-bold flex items-center justify-center text-[10px]">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white text-xs">{m.label}</span>
                        </div>
                        <span className="font-bold text-[#d4ff00] text-xs">
                          {percentage}% Cosine Match
                        </span>
                      </div>

                      <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                        {matchPillar?.text}
                      </p>

                      <div className="w-full h-1.5 bg-[#111622] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#004488] to-[#00e5ff]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-[#8e8d88] flex flex-col items-center gap-2">
                  <Database className="w-6 h-6 text-[#00e5ff]" />
                  <span>Click "MATCH VECTORS" to compute semantic similarities.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Security & Token Redaction */}
        {activeTab === 'CONSENSUS_AUDIT' && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
            <div className="p-4 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00e5ff] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white text-xs uppercase">
                  ZERO-TRUST CREDENTIAL ISOLATION & REDACTION ARCHITECTURE
                </span>
                <p className="text-[11px] text-[#c4c3be] leading-relaxed">
                  In compliance with UAE Sovereign Security standards, all third-party AI keys (OpenAI, Gemini) remain strictly quarantined on the server container. Prompt text, output tokens, and event streams are filtered via deterministic regular expressions to replace secret strings with <code>[REDACTED_KEY]</code> tokens before reaching logs or client views.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-[#09101c] flex flex-col gap-2">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#00e5ff]" />
                  GEMINI_API_KEY (SERVER CONTAINER)
                </span>
                <div className="p-2.5 rounded bg-[#070c16] text-[10px] text-[#00e5ff] font-mono">
                  Quarantine Status: SECURE_PROCESS_ENV (Redacted in Client)
                </div>
                <p className="text-[10px] text-[#8e8d88]">
                  Used for high-speed spatial reasoning, 3D coordinate parsing, and vision processing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-[#09101c] flex flex-col gap-2">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#10b981]" />
                  OPENAI_API_KEY (SERVER CONTAINER)
                </span>
                <div className="p-2.5 rounded bg-[#070c16] text-[10px] text-[#10b981] font-mono">
                  Quarantine Status: SECURE_PROCESS_ENV (Redacted in Client)
                </div>
                <p className="text-[10px] text-[#8e8d88]">
                  Used for dual-model consensus verification, macroeconomic parsing, and text-embedding-3-small vectors.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
