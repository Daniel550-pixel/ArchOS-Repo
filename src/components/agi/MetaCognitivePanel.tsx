import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../layout/GlassPanel';
import { Brain, Activity, TrendingUp, AlertCircle, Sparkles, RefreshCw, ShieldCheck, Sliders } from 'lucide-react';
import { metaCognition, CognitiveState, SelfReflectionReport } from '../../services/agi/metaCognition';
import { speechService } from '../../services/voice/speechService';

export const MetaCognitivePanel: React.FC = () => {
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>(metaCognition.getState());
  const [reflectionLog, setReflectionLog] = useState<string[]>([
    '14:23:15 - Performance accuracy improved by +3.2%',
    '14:22:45 - Adjusted confidence threshold to 0.85',
    '14:21:30 - Cross-domain tensor optimization completed',
    '14:20:00 - Ethical alignment score nominal at 98.4%',
    '14:18:22 - Attention calibrated across 7 Emirates digital twins'
  ]);
  const [isReflecting, setIsReflecting] = useState(false);

  useEffect(() => {
    const unsub = metaCognition.subscribe((state) => {
      setCognitiveState(state);
    });

    const unsubRef = metaCognition.subscribeReflection((rep: SelfReflectionReport) => {
      const timeStr = new Date(rep.timestamp).toLocaleTimeString();
      setReflectionLog((prev) => [
        `${timeStr} - Self-reflection complete: ${rep.performance_analysis.accuracy_trend} accuracy`,
        `${timeStr} - Applied: ${rep.applied_optimizations[0] || 'Tuned parameters'}`,
        ...prev.slice(0, 8)
      ]);
    });

    return () => {
      unsub();
      unsubRef();
    };
  }, []);

  const handleRunReflection = async () => {
    setIsReflecting(true);
    try {
      const rep = await metaCognition.selfReflect();
      speechService.speak(`Meta-cognitive self reflection executed. Ascension rating at level ${rep.cognitive_state.ascension_level.toFixed(1)}.`);
    } finally {
      setIsReflecting(false);
    }
  };

  const metrics = [
    { label: 'Working Memory Load', value: cognitiveState.working_memory_load, color: 'bg-[#00e5ff]', textColor: 'text-[#00e5ff]', icon: Brain },
    { label: 'Reasoning Depth (LOD)', value: cognitiveState.reasoning_depth / 5, color: 'bg-[#a855f7]', textColor: 'text-[#a855f7]', icon: Activity },
    { label: 'Confidence Threshold', value: cognitiveState.confidence_threshold, color: 'bg-[#10b981]', textColor: 'text-[#10b981]', icon: TrendingUp },
    { label: 'Exploration Rate (ε)', value: Math.min(1, cognitiveState.exploration_rate * 2.5), color: 'bg-[#d4ff00]', textColor: 'text-[#d4ff00]', icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 h-full w-full font-mono-tech select-none">
      {/* Cognitive State Visualization */}
      <div className="col-span-12 lg:col-span-7 flex flex-col h-full">
        <GlassPanel
          title="META-COGNITIVE STATE"
          icon={<Brain size={16} />}
          badge={`ASCENDED LVL ${cognitiveState.ascension_level.toFixed(1)}`}
          badgeColor="purple"
          actions={
            <button
              onClick={handleRunReflection}
              disabled={isReflecting}
              className="px-2.5 py-1 rounded-lg bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] border border-[#a855f7]/40 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isReflecting ? 'animate-spin' : ''}`} />
              <span>{isReflecting ? 'REFLECTING...' : 'SELF-REFLECT'}</span>
            </button>
          }
          className="h-full"
        >
          <div className="space-y-4">
            {/* Attention Focus */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  DYNAMIC ATTENTION FOCUS
                </h4>
                <span className="text-[9px] text-[#00e5ff] font-bold">SOVEREIGN VECTORS</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cognitiveState.attention_focus.map((focus, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,229,255,0.15)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
                    {focus}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3 pt-2">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={metric.textColor} />
                        <span className="text-xs text-zinc-400">{metric.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${metric.textColor}`}>
                        {(metric.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${metric.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Hyper-Parameter Tuning Sliders */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Sliders className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>DYNAMIC REASONING TUNER</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Depth:</span>
                    <strong className="text-[#a855f7]">{cognitiveState.reasoning_depth}/5</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={cognitiveState.reasoning_depth}
                    onChange={(e) =>
                      metaCognition.updateParameters({
                        reasoning_depth: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-[#a855f7] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Confidence:</span>
                    <strong className="text-[#10b981]">{(cognitiveState.confidence_threshold * 100).toFixed(0)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={cognitiveState.confidence_threshold}
                    onChange={(e) =>
                      metaCognition.updateParameters({
                        confidence_threshold: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-[#10b981] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Exploration (ε):</span>
                    <strong className="text-[#d4ff00]">{(cognitiveState.exploration_rate * 100).toFixed(0)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.4"
                    step="0.01"
                    value={cognitiveState.exploration_rate}
                    onChange={(e) =>
                      metaCognition.updateParameters({
                        exploration_rate: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-[#d4ff00] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Cognitive Load Distribution */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#00e5ff]/5 to-transparent border border-[#00e5ff]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">WORKING MEMORY LOAD DISTRIBUTION</span>
                <span className="text-xs text-[#00e5ff] font-bold">
                  {(cognitiveState.working_memory_load * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 h-12 items-end">
                {[0.4, 0.7, 0.55, 0.85, 0.65].map((val, i) => (
                  <motion.div
                    key={i}
                    className="bg-[#00e5ff]/40 rounded-sm border-t border-[#00e5ff]"
                    animate={{
                      height: `${val * cognitiveState.working_memory_load * 100}%`,
                      opacity: cognitiveState.working_memory_load > 0.7 ? 1 : 0.6
                    }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Self-Reflection Log */}
      <div className="col-span-12 lg:col-span-5 flex flex-col h-full">
        <GlassPanel
          title="SELF-REFLECTION LOG"
          icon={<Activity size={16} />}
          badge="CONTINUOUS STREAM"
          badgeColor="gold"
          className="h-full"
        >
          <div className="space-y-2 overflow-y-auto max-h-[calc(100%-1rem)]">
            {reflectionLog.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs hover:border-[#00e5ff]/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] mt-1.5 shrink-0" />
                  <span className="text-zinc-300 leading-relaxed">{log}</span>
                </div>
              </motion.div>
            ))}

            <div className="mt-4 p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#10b981]">
                <ShieldCheck size={16} />
                <span className="font-bold">Constitutional Alignment</span>
              </div>
              <span className="text-[#10b981] font-bold">
                {(cognitiveState.ethical_alignment_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
