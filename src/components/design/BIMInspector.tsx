import React from 'react';
import { useArchOSStore } from '../../store/archosStore';
import { Layers, Leaf, Ruler, HardHat, Compass } from 'lucide-react';

export const BIMInspector: React.FC = () => {
  const { bimModel, designParameters } = useArchOSStore();

  if (!bimModel) {
    return (
      <div className="rounded-xl border border-[#00e5ff]/20 bg-[#070d18]/80 backdrop-blur-xl p-6 h-full flex flex-col items-center justify-center text-center font-mono-tech">
        <Layers className="w-8 h-8 text-[#00e5ff]/40 mb-3 animate-pulse" />
        <p className="text-xs text-[#8e8d88]">GENERATING BIM STRUCTURE...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.15)] p-4 flex flex-col font-mono-tech h-full">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[#d4ff00]" />
          <h3 className="text-sm font-bold text-[#d4ff00] tracking-wider">BIM INSPECTOR</h3>
        </div>
        <span className="text-[10px] text-[#00e5ff] px-2 py-0.5 rounded border border-[#00e5ff]/30 bg-[#00e5ff]/10">
          LOD 350
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#0a0e1a]/80 border border-white/10 rounded-lg p-2.5 text-center">
          <Ruler size={14} className="text-[#00e5ff] mx-auto mb-1" />
          <div className="text-[9px] text-[#8e8d88] font-mono-tech">TOTAL HEIGHT</div>
          <div className="text-sm font-mono-tech text-[#f0f4f4] font-bold">{bimModel.totalHeight}m</div>
        </div>
        <div className="bg-[#0a0e1a]/80 border border-white/10 rounded-lg p-2.5 text-center">
          <Layers size={14} className="text-[#00e5ff] mx-auto mb-1" />
          <div className="text-[9px] text-[#8e8d88] font-mono-tech">TOTAL GFA</div>
          <div className="text-sm font-mono-tech text-[#f0f4f4] font-bold">{bimModel.totalGFA.toLocaleString()}m²</div>
        </div>
        <div className="bg-[#0a0e1a]/80 border border-white/10 rounded-lg p-2.5 text-center">
          <Leaf size={14} className="text-[#00ff88] mx-auto mb-1" />
          <div className="text-[9px] text-[#8e8d88] font-mono-tech">EMBODIED CO2</div>
          <div className="text-sm font-mono-tech text-[#00ff88] font-bold">{bimModel.estimatedEmbodiedCarbon}t</div>
        </div>
      </div>

      {/* Material & Spec Summary */}
      <div className="bg-[#09101c]/80 rounded-lg border border-white/10 p-2.5 mb-3 text-[10px] flex items-center justify-between">
        <div>
          <span className="text-[#8e8d88]">System: </span>
          <span className="text-[#00e5ff] font-bold uppercase">{designParameters.structuralSystem}</span>
        </div>
        <div>
          <span className="text-[#8e8d88]">Envelope: </span>
          <span className="text-[#d4ff00] font-bold uppercase">{designParameters.facadeType.replace('_', ' ')}</span>
        </div>
        <div>
          <span className="text-[#8e8d88]">Rot: </span>
          <span className="text-white font-bold">{designParameters.orientation}°</span>
        </div>
      </div>

      {/* Component Hierarchy */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
        <div className="text-[10px] text-[#8e8d88] font-mono-tech uppercase tracking-wider">
          SYSTEM BILL OF MATERIALS (BOM)
        </div>
        <div className="space-y-1.5">
          {bimModel.components.map((comp) => (
            <div
              key={comp.id}
              className="border border-white/10 rounded-lg p-2.5 bg-[#0a0e1a]/70 hover:border-[#00e5ff]/40 transition-colors"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-mono-tech text-[#f0f4f4] font-bold">{comp.name}</span>
                <span
                  className={`text-[9px] font-mono-tech px-1.5 py-0.5 rounded font-bold ${
                    comp.category === 'STRUCTURAL'
                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                      : comp.category === 'MEP'
                      ? 'bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/40'
                      : 'bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/40'
                  }`}
                >
                  {comp.category}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-[#8e8d88] font-mono-tech">
                <span>Qty: {comp.quantity} {comp.unit}</span>
                <span className="text-[#00ff88]">Carbon: {comp.carbonFootprint.toLocaleString()} kgCO2e</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
