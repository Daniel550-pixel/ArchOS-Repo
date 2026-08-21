import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DesignStudio } from '../design/DesignStudio';
import { BIMInspector } from '../design/BIMInspector';
import { BIMViewport } from '../experience/BIMViewport';
import { useArchOSStore } from '../../store/archosStore';
import { Box, Layers, Sparkles, ArrowRight, Shield, Cpu, Sliders, Maximize2, CheckCircle2 } from 'lucide-react';

interface DesignStudioViewProps {
  onNavigateToProve?: () => void;
  onNavigateToBuild?: () => void;
}

export const DesignStudioView: React.FC<DesignStudioViewProps> = ({
  onNavigateToProve,
  onNavigateToBuild
}) => {
  const { designParameters, bimModel } = useArchOSStore();
  const [activeTab, setActiveTab] = useState<'PARAMETERS' | '3D_VIEW' | 'INSPECTOR' | 'ALL'>('ALL');

  const gfa = designParameters.footprintWidth * designParameters.footprintDepth * designParameters.floorCount;
  const estimatedCost = (gfa * 3850).toLocaleString();

  return (
    <div className="relative w-full h-full bg-[#040711] overflow-y-auto custom-scrollbar p-4 md:p-6 select-none font-mono-tech flex flex-col">
      {/* Ambient Grid & Lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e5ff06_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff06_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#d4ff00]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00e5ff]/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-wider text-[#f5f4f0] flex items-center gap-2">
              PARAMETRIC DESIGN STUDIO
              <span className="text-xs px-2 py-0.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 font-semibold">
                DESIGN STAGE · LOD 350
              </span>
            </h1>
            <p className="text-xs text-[#8e8d88]">
              Procedural BIM Generation · Real-Time Massing & Carbon Footprint · Direct PROVE & BUILD Handoff
            </p>
          </div>
        </div>

        {/* Global Action Hand-offs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#09101c]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5ff]"></span>
            </span>
            <span className="text-xs text-[#8e8d88]">GFA:</span>
            <span className="text-xs font-bold text-[#00e5ff]">{gfa.toLocaleString()} m²</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#09101c]">
            <span className="text-xs text-[#8e8d88]">Est. CapEx:</span>
            <span className="text-xs font-bold text-[#10b981]">{estimatedCost} AED</span>
          </div>

          {onNavigateToProve && (
            <button
              onClick={onNavigateToProve}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#10b981]/40 bg-[#10b981]/15 text-[#10b981] text-xs font-bold hover:bg-[#10b981]/25 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              <span>SEND TO PROVE</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Column Responsive Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* Left Column: Parametric Controls (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-[500px]">
          <DesignStudio onExportToProve={onNavigateToProve} />
        </div>

        {/* Center Column: Live 3D Spatial Holographic BIM Viewport (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
          <div className="rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.15)] p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#00e5ff]" />
                <h3 className="text-sm font-bold text-[#00e5ff] tracking-wider">3D BIM VIEWPORT</h3>
              </div>
              <span className="text-[10px] text-[#8e8d88]">THREE.JS + R3F</span>
            </div>

            <div className="flex-1 w-full min-h-[360px] relative rounded-lg overflow-hidden border border-white/10">
              <BIMViewport
                params={{
                  width: designParameters.footprintWidth,
                  depth: designParameters.footprintDepth,
                  floors: designParameters.floorCount,
                  height: designParameters.floorHeight,
                  structuralSystem: designParameters.structuralSystem,
                  facadeType: designParameters.facadeType
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-[#8e8d88] px-1">
              <span>Orbit: Left Click + Drag</span>
              <span>Zoom: Scroll</span>
              <span>Pan: Right Click</span>
            </div>
          </div>
        </div>

        {/* Right Column: BIM Inspector (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-[500px]">
          <BIMInspector />
        </div>
      </div>
    </div>
  );
};
