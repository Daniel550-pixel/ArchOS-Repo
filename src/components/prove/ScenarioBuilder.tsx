import React, { useState } from 'react';
import { useArchOSStore } from '../../store/archosStore';
import { runSimulation } from '../../services/simulation/simulationEngine';
import { FlaskConical, Play, Loader2 } from 'lucide-react';

export const ScenarioBuilder: React.FC = () => {
  const { setActiveScenario, setSimulationResult, setIsSimulating, isSimulating } = useArchOSStore();
  const [heightDelta, setHeightDelta] = useState(0);
  const [facade, setFacade] = useState('concrete');

  const handleRun = async () => {
    const scenario = {
      id: `sim-${Date.now()}`,
      name: `Height +${heightDelta}m / ${facade} facade`,
      parameters: { heightDelta, facadeMaterial: facade },
      createdAt: new Date().toISOString(),
    };

    setActiveScenario(scenario);
    setIsSimulating(true);
    setSimulationResult(null);

    const result = await runSimulation(scenario);

    setSimulationResult(result);
    setIsSimulating(false);
  };

  return (
    <div className="rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.15)] p-4 flex flex-col font-mono-tech">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={16} className="text-[#00e5ff]" />
        <h3 className="text-sm font-bold text-[#00e5ff] tracking-wider">PROVE: SIMULATION SANDBOX</h3>
      </div>

      <div className="space-y-4 flex-1">
        {/* Parameter: Height */}
        <div>
          <label className="text-xs text-[#8e8d88] font-mono-tech block mb-2">BUILDING HEIGHT DELTA</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="30"
              value={heightDelta}
              onChange={(e) => setHeightDelta(Number(e.target.value))}
              className="flex-1 accent-[#00e5ff] cursor-pointer"
            />
            <span className="text-sm font-mono-tech text-[#00e5ff] w-12 text-right font-bold">+{heightDelta}m</span>
          </div>
        </div>

        {/* Parameter: Facade */}
        <div>
          <label className="text-xs text-[#8e8d88] font-mono-tech block mb-2">FACADE MATERIAL</label>
          <div className="flex gap-2">
            {['concrete', 'glass', 'composite'].map((mat) => (
              <button
                key={mat}
                onClick={() => setFacade(mat)}
                className={`flex-1 py-1.5 rounded text-xs font-mono-tech uppercase border transition-all cursor-pointer ${
                  facade === mat
                    ? 'bg-[#00e5ff]/20 border-[#00e5ff]/60 text-[#00e5ff] font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                    : 'border-white/10 text-[#8e8d88] hover:border-[#00e5ff]/30 hover:text-[#f5f4f0]'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleRun}
          disabled={isSimulating}
          className="w-full py-3 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff] font-mono-tech text-sm font-bold hover:bg-[#00e5ff]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.1)]"
        >
          {isSimulating ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
          {isSimulating ? 'RUNNING AGENTS...' : 'EXECUTE SIMULATION'}
        </button>
      </div>
    </div>
  );
};
