import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../layout/GlassPanel';
import { Target, GitBranch, Zap, AlertTriangle, Play, CheckCircle2, TrendingUp } from 'lucide-react';
import { strategicReasoning, StrategicObjective, CounterfactualSimulationResult } from '../../services/agi/strategicReasoning';
import { speechService } from '../../services/voice/speechService';

export const StrategicReasoningPanel: React.FC = () => {
  const [objectives, setObjectives] = useState<StrategicObjective[]>(strategicReasoning.getObjectives());
  const [simulationResults, setSimulationResults] = useState<CounterfactualSimulationResult[]>([
    {
      scenarioId: 'sim-init-1',
      scenarioTitle: 'Dubai Creek Super-Tall Aerodynamic Dampening',
      domain: 'Structural & Atmospheric',
      interventions: [
        {
          name: 'Dynamic Tuned Liquid Column Damper',
          expected_value: 0.94,
          risk_score: 0.15,
          opportunity_score: 0.98,
          risk_description: 'Slight mechanical pump maintenance cycles',
          opportunity_description: '-42% vortex shedding sway displacement',
          projected_timeline: '3 - 6 Months',
          sovereign_roi: '5.4x over 3 years'
        }
      ],
      recommended_action: 'Deploy automated liquid column dampers with real-time pressure sensor feedback',
      confidence_index: 0.96,
      monte_carlo_iterations: 25000,
      convergence_rate: 0.999
    },
    {
      scenarioId: 'sim-init-2',
      scenarioTitle: 'Barakah Nuclear & Solar Desalination Load Coupling',
      domain: 'Energy & Water Security',
      interventions: [
        {
          name: 'Direct Low-Latency Micro-Grid Shunting',
          expected_value: 0.91,
          risk_score: 0.22,
          opportunity_score: 0.95,
          risk_description: 'Transient high-voltage line thermal stress',
          opportunity_description: 'Zero clean energy curtailment & -28% water production cost',
          projected_timeline: '6 - 12 Months',
          sovereign_roi: '4.2x over 2 years'
        }
      ],
      recommended_action: 'Interconnect Abu Dhabi clean generation with northern reverse osmosis facilities',
      confidence_index: 0.94,
      monte_carlo_iterations: 25000,
      convergence_rate: 0.995
    }
  ]);

  const [scenarioInput, setScenarioInput] = useState('Autonomous eVTOL Air Corridor Surge Balancing');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = async () => {
    if (!scenarioInput.trim()) return;
    setIsSimulating(true);
    try {
      const res = await strategicReasoning.runCounterfactualSimulation(
        scenarioInput,
        'Strategic Infrastructure'
      );
      setSimulationResults((prev) => [res, ...prev]);
      speechService.speak(`Counterfactual simulation completed. Recommended strategy: ${res.recommended_action}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const getHorizonColor = (horizon: string) => {
    if (horizon === 'tactical') return 'text-[#00e5ff] border-[#00e5ff]/40 bg-[#00e5ff]/10';
    if (horizon === 'operational') return 'text-[#a855f7] border-[#a855f7]/40 bg-[#a855f7]/10';
    return 'text-[#d4ff00] border-[#d4ff00]/40 bg-[#d4ff00]/10';
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full w-full font-mono-tech select-none">
      {/* Strategic Objectives Column */}
      <div className="col-span-12 lg:col-span-6 flex flex-col h-full">
        <GlassPanel
          title="MULTI-HORIZON OBJECTIVES"
          icon={<Target size={16} />}
          badge={`${objectives.length} OBJECTIVES`}
          badgeColor="cyan"
          className="h-full"
        >
          <div className="space-y-3 overflow-y-auto max-h-[calc(100%-1rem)] pr-1">
            {objectives.map((obj, idx) => (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00e5ff]/30 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getHorizonColor(obj.horizon)}`}>
                        {obj.horizon.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[#10b981] font-bold">
                        READINESS: {(obj.readiness_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-snug">{obj.title}</h5>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{obj.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-zinc-400">Priority</div>
                    <div className="text-xs text-[#00e5ff] font-bold">{(obj.priority * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Progress bar & impact */}
                <div className="mt-1 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Impact: <strong className="text-[#d4ff00]">{obj.estimated_impact_aed}</strong></span>
                  <span className="text-[#00e5ff]">Priority Score</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00e5ff] to-[#a855f7]"
                    initial={{ width: 0 }}
                    animate={{ width: `${obj.priority * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Counterfactual Simulations Column */}
      <div className="col-span-12 lg:col-span-6 flex flex-col h-full">
        <GlassPanel
          title="COUNTERFACTUAL WHAT-IF SIMULATIONS"
          icon={<GitBranch size={16} />}
          badge="MONTE CARLO 25K"
          badgeColor="gold"
          className="h-full"
        >
          <div className="space-y-3 overflow-y-auto max-h-[calc(100%-1rem)] pr-1">
            {/* Input Trigger Bar */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400">Input Strategic Scenario for Simulation:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00e5ff]"
                  placeholder="Enter scenario name..."
                />
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00e5ff] hover:bg-[#00c8e0] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_#00e5ff] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Play className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'SIMULATING...' : 'RUN'}</span>
                </button>
              </div>
            </div>

            {/* Simulation List */}
            {simulationResults.map((sim, idx) => (
              <motion.div
                key={sim.scenarioId || idx}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3.5 rounded-xl border border-white/10 bg-gradient-to-br from-[#00e5ff]/5 to-transparent flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={14} className="text-[#00e5ff] shrink-0" />
                    <span className="text-xs font-bold text-white truncate">{sim.scenarioTitle}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#10b981] text-[10px] font-bold shrink-0">
                    <CheckCircle2 size={12} />
                    <span>Confidence: {(sim.confidence_index * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-xs flex flex-col gap-1">
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Recommended Action:</div>
                  <div className="text-[#00e5ff] font-bold leading-snug">{sim.recommended_action}</div>
                </div>

                {sim.interventions.map((iv, iIdx) => (
                  <div key={iIdx} className="text-xs text-zinc-300 space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Intervention:</span>
                      <span className="text-white font-bold">{iv.name}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Opportunity:</span>
                      <span className="text-[#10b981] font-bold">{iv.opportunity_description}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/10">
                      <span>ROI: <strong className="text-[#d4ff00]">{iv.sovereign_roi}</strong></span>
                      <span>Timeline: <strong className="text-white">{iv.projected_timeline}</strong></span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
