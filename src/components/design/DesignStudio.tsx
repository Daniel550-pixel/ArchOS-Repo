import React, { useEffect } from 'react';
import { useArchOSStore } from '../../store/archosStore';
import { generateBIMModel } from '../../services/design/parametricEngine';
import { Box, RotateCcw, Save, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { BIMViewport } from '../experience/BIMViewport';

interface DesignStudioProps {
  onExportToProve?: () => void;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({ onExportToProve }) => {
  const { designParameters, updateDesignParameters, setBIMModel } = useArchOSStore();

  // Auto-generate BIM when parameters change
  useEffect(() => {
    const model = generateBIMModel(designParameters);
    setBIMModel(model);
  }, [designParameters, setBIMModel]);

  const handleReset = () => {
    updateDesignParameters({
      footprintWidth: 20,
      footprintDepth: 20,
      floorCount: 10,
      floorHeight: 3.5,
      orientation: 0,
      structuralSystem: 'concrete',
      facadeType: 'curtain_wall',
    });
  };

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step,
    unit,
    onChange
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (val: number) => void;
  }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="text-[11px] text-[#8e8d88] font-mono-tech">{label}</label>
        <span className="text-xs text-[#00e5ff] font-mono-tech font-bold">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
      />
    </div>
  );

  return (
    <div className="rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.15)] p-4 flex flex-col font-mono-tech h-full">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-[#00e5ff]" />
          <h3 className="text-sm font-bold text-[#00e5ff] tracking-wider">DESIGN: PARAMETRIC STUDIO</h3>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-[#8e8d88] hover:text-[#00e5ff] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw size={10} /> RESET
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
        <SliderControl
          label="FOOTPRINT WIDTH"
          value={designParameters.footprintWidth}
          min={10}
          max={50}
          step={1}
          unit="m"
          onChange={(v: number) => updateDesignParameters({ footprintWidth: v })}
        />
        <SliderControl
          label="FOOTPRINT DEPTH"
          value={designParameters.footprintDepth}
          min={10}
          max={50}
          step={1}
          unit="m"
          onChange={(v: number) => updateDesignParameters({ footprintDepth: v })}
        />
        <SliderControl
          label="FLOOR COUNT"
          value={designParameters.floorCount}
          min={1}
          max={50}
          step={1}
          unit=" fl"
          onChange={(v: number) => updateDesignParameters({ floorCount: v })}
        />
        <SliderControl
          label="FLOOR HEIGHT"
          value={designParameters.floorHeight}
          min={2.5}
          max={5.0}
          step={0.1}
          unit="m"
          onChange={(v: number) => updateDesignParameters({ floorHeight: v })}
        />
        <SliderControl
          label="ORIENTATION"
          value={designParameters.orientation}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(v: number) => updateDesignParameters({ orientation: v })}
        />

        <div className="mb-3 pt-2">
          <label className="text-[11px] text-[#8e8d88] font-mono-tech block mb-1.5 uppercase">STRUCTURAL SYSTEM</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['concrete', 'steel', 'composite', 'timber'] as const).map((sys) => (
              <button
                key={sys}
                onClick={() => updateDesignParameters({ structuralSystem: sys })}
                className={`py-1.5 rounded text-[10px] font-mono-tech uppercase border transition-all cursor-pointer ${
                  designParameters.structuralSystem === sys
                    ? 'bg-[#00e5ff]/20 border-[#00e5ff]/60 text-[#00e5ff] font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                    : 'border-white/10 text-[#8e8d88] hover:border-[#00e5ff]/30 hover:text-white'
                }`}
              >
                {sys}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[11px] text-[#8e8d88] font-mono-tech block mb-1.5 uppercase">FACADE TYPE</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['curtain_wall', 'precast', 'masonry', 'green_wall'] as const).map((fac) => (
              <button
                key={fac}
                onClick={() => updateDesignParameters({ facadeType: fac })}
                className={`py-1.5 rounded text-[10px] font-mono-tech uppercase border transition-all cursor-pointer ${
                  designParameters.facadeType === fac
                    ? 'bg-[#d4ff00]/20 border-[#d4ff00]/60 text-[#d4ff00] font-bold shadow-[0_0_10px_rgba(212,255,0,0.2)]'
                    : 'border-white/10 text-[#8e8d88] hover:border-[#d4ff00]/30 hover:text-white'
                }`}
              >
                {fac.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onExportToProve}
        className="w-full mt-3 py-2.5 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88] text-xs font-mono-tech font-bold hover:bg-[#00ff88]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,136,0.15)]"
      >
        <Save size={14} /> EXPORT TO PROVE STAGE
      </button>
    </div>
  );
};
