import React from 'react';
import { useArchOSStore } from '../../store/archosStore';
import { ShieldCheck, ShieldAlert, ShieldX, Activity } from 'lucide-react';

export const VerificationPanel: React.FC = () => {
  const { simulationResult, activeScenario } = useArchOSStore();

  if (!simulationResult) {
    return (
      <div className="rounded-xl border border-[#00e5ff]/20 bg-[#070d18]/80 backdrop-blur-xl p-6 h-full flex flex-col items-center justify-center text-center font-mono-tech">
        <Activity className="w-8 h-8 text-[#00e5ff]/40 mb-3 animate-pulse" />
        <p className="text-xs text-[#8e8d88] font-mono-tech leading-relaxed">
          AWAITING SIMULATION PARAMETERS.<br />
          CONFIGURE SCENARIO TO BEGIN PROVE STAGE.
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'PASS') return <ShieldCheck size={14} className="text-[#00ff88]" />;
    if (status === 'WARNING') return <ShieldAlert size={14} className="text-[#ffd700]" />;
    return <ShieldX size={14} className="text-[#ff006e]" />;
  };

  const getOverallColor = (status: string) => {
    if (status === 'PASS') return 'text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10';
    if (status === 'WARNING') return 'text-[#ffd700] border-[#ffd700]/40 bg-[#ffd700]/10';
    return 'text-[#ff006e] border-[#ff006e]/40 bg-[#ff006e]/10';
  };

  return (
    <div className="rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.15)] p-4 h-full flex flex-col overflow-hidden font-mono-tech">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#00e5ff]" />
          <h3 className="text-sm font-bold text-[#00e5ff] tracking-wider">VERIFICATION ENGINE</h3>
        </div>
        <div className={`px-2.5 py-1 rounded border text-[10px] font-mono-tech font-bold ${getOverallColor(simulationResult.overallStatus)}`}>
          {simulationResult.overallStatus}
        </div>
      </div>

      <div className="text-[10px] text-[#8e8d88] font-mono-tech mb-3">
        SCENARIO: {activeScenario?.name} | T+{simulationResult.executionTimeMs}ms
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {simulationResult.checks.map((check) => (
          <div key={check.id} className="border border-white/10 rounded-lg p-3 bg-[#0a0e1a]/70 hover:border-[#00e5ff]/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <span className="text-xs font-bold text-[#f0f4f4]">{check.agent}</span>
              </div>
              <span
                className={`text-[9px] font-mono-tech font-bold ${
                  check.impact === 'CRITICAL'
                    ? 'text-[#ff006e]'
                    : check.impact === 'HIGH'
                    ? 'text-[#ff6b35]'
                    : 'text-[#8e8d88]'
                }`}
              >
                {check.impact}
              </span>
            </div>
            <div className="text-[10px] text-[#00e5ff] font-mono-tech mb-1">{check.rule}</div>
            <div className="text-[10px] text-[#8e8d88] font-mono-tech leading-tight">{check.evidence}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00e5ff] rounded-full transition-all duration-500"
                  style={{ width: `${check.confidence * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-[#00e5ff] font-mono-tech font-bold">{(check.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
        <div className="bg-[#0a0e1a]/70 rounded-lg p-2.5 border border-white/5">
          <div className="text-[9px] text-[#8e8d88] font-mono-tech">COST DELTA</div>
          <div className="text-sm font-mono-tech font-bold text-[#ffd700]">
            {simulationResult.estimatedCostDelta > 0 ? '+' : ''}
            {simulationResult.estimatedCostDelta.toLocaleString()} AED
          </div>
        </div>
        <div className="bg-[#0a0e1a]/70 rounded-lg p-2.5 border border-white/5">
          <div className="text-[9px] text-[#8e8d88] font-mono-tech">ENERGY IMPACT</div>
          <div
            className={`text-sm font-mono-tech font-bold ${
              simulationResult.energyImpact > 0 ? 'text-[#ff006e]' : 'text-[#00ff88]'
            }`}
          >
            {simulationResult.energyImpact > 0 ? '+' : ''}
            {simulationResult.energyImpact}%
          </div>
        </div>
      </div>
    </div>
  );
};
