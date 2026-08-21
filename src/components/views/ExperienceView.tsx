import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckSquare,
  FileText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Info,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Cpu,
  Shield,
  Activity,
  ArrowRight,
  Sun,
  Maximize2,
  Minimize2,
  Box,
  Compass,
  Sliders
} from 'lucide-react';
import { EXPERIENCES } from '../../data/experiences';
import { BIMViewport } from '../experience/BIMViewport';
import { useArchOSStore } from '../../store/archosStore';

interface ExperienceViewProps {
  onBackToWorldModel?: () => void;
  onNavigateToProve?: () => void;
  onNavigateToBuild?: () => void;
  gestureProgress?: number; // 0.0 to 1.0 from pinch gesture
}

interface BuildingLayer {
  id: string;
  code: string;
  name: string;
  category: 'ARCHITECTURAL' | 'STRUCTURAL' | 'MEP' | 'ENVELOPE' | 'FOUNDATION';
  material: string;
  visible: boolean;
  elevationY: number; // base Y separation
  color: string;
  callout: string;
  massKg: number;
  embodiedCarbonKg: number;
  fireRating: string;
}

const INITIAL_LAYERS: BuildingLayer[] = [
  { id: 'landscape', code: 'LND-001', name: 'Landscape', category: 'ARCHITECTURAL', material: 'Rooftop Bio-deck & Sky Garden', visible: true, elevationY: 190, color: '#10b981', callout: 'Landscape Skydeck', massKg: 45000, embodiedCarbonKg: 12000, fireRating: 'Class A' },
  { id: 'interior', code: 'INT-001', name: 'Interior', category: 'ARCHITECTURAL', material: 'Smart Partitioning & Finishes', visible: true, elevationY: 150, color: '#a855f7', callout: 'Interior Smart Shell', massKg: 85000, embodiedCarbonKg: 34000, fireRating: '120 Min' },
  { id: 'plumbing', code: 'PLB-001', name: 'Plumbing', category: 'MEP', material: 'MEP Greywater Recycle Loop', visible: true, elevationY: 115, color: '#06b6d4', callout: 'Plumbing & Hydronics', massKg: 32000, embodiedCarbonKg: 18000, fireRating: 'Non-combustible' },
  { id: 'electrical', code: 'ELE-001', name: 'Electrical', category: 'MEP', material: 'MEP Smart Busbars & Fiber Optics', visible: true, elevationY: 85, color: '#eab308', callout: 'Electrical Risers & Grid', massKg: 28000, embodiedCarbonKg: 22000, fireRating: 'UL 94 V-0' },
  { id: 'hvac', code: 'HVAC-001', name: 'HVAC', category: 'MEP', material: 'Thermal Air Handlers & VAV Loops', visible: true, elevationY: 55, color: '#f97316', callout: 'HVAC Thermal Array', massKg: 48000, embodiedCarbonKg: 38000, fireRating: 'Class 1' },
  { id: 'facade', code: 'FAC-001', name: 'Facade', category: 'ENVELOPE', material: 'Low-E Double Glazed Curtain Skin', visible: true, elevationY: 20, color: '#38bdf8', callout: 'Unitized Curtain Wall', massKg: 120000, embodiedCarbonKg: 65000, fireRating: '240 Min' },
  { id: 'floor-plates', code: 'FLR-001', name: 'Floor Plates', category: 'STRUCTURAL', material: 'Composite Post-Tensioned Slabs', visible: true, elevationY: -20, color: '#94a3b8', callout: 'Post-Tension Slabs', massKg: 380000, embodiedCarbonKg: 145000, fireRating: '180 Min' },
  { id: 'structural-core', code: 'STR-001', name: 'Structural Core', category: 'STRUCTURAL', material: 'High-Strength RC Shear Core', visible: true, elevationY: -60, color: '#64748b', callout: 'High-Strength Core', massKg: 620000, embodiedCarbonKg: 210000, fireRating: '240 Min' },
  { id: 'foundation', code: 'FND-001', name: 'Foundation', category: 'FOUNDATION', material: 'Concrete Friction Piles (35m depth)', visible: true, elevationY: -95, color: '#475569', callout: 'Friction Deep Piles', massKg: 850000, embodiedCarbonKg: 290000, fireRating: 'Sub-grade' }
];

export const ExperienceView: React.FC<ExperienceViewProps> = ({
  onBackToWorldModel,
  onNavigateToProve,
  onNavigateToBuild,
  gestureProgress
}) => {
  const { designParameters } = useArchOSStore();
  const [progress, setProgress] = useState(0.65); // 0.0 integrated to 1.0 decomposed
  const [layers, setLayers] = useState<BuildingLayer[]>(INITIAL_LAYERS);
  const [activeExperienceMode, setActiveExperienceMode] = useState<'tower' | 'bim-spatial' | 'motion-form'>('tower');
  const [selectedFilmIndex, setSelectedFilmIndex] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<BuildingLayer>(INITIAL_LAYERS[5]);
  const [isLeftNavCollapsed, setIsLeftNavCollapsed] = useState(false);
  const [isRightInspectorCollapsed, setIsRightInspectorCollapsed] = useState(false);
  const [viewAngle, setViewAngle] = useState<'ISOMETRIC' | 'FRONT' | 'TOP'>('ISOMETRIC');

  // Sync gesture progress if active
  useEffect(() => {
    if (gestureProgress !== undefined && !isNaN(gestureProgress)) {
      setProgress(gestureProgress);
    }
  }, [gestureProgress]);

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const activeFilm = EXPERIENCES[selectedFilmIndex];

  // Calculated Real-Time Metrics
  const totalGFA = designParameters.footprintWidth * designParameters.footprintDepth * designParameters.floorCount;
  const totalMassTonnes = Math.round(layers.filter(l => l.visible).reduce((acc, l) => acc + l.massKg, 0) / 1000);
  const totalCarbonTonnes = Math.round(layers.filter(l => l.visible).reduce((acc, l) => acc + l.embodiedCarbonKg, 0) / 1000);

  return (
    <div className="relative w-full h-full flex-1 flex overflow-hidden bg-[#040711] select-none font-mono-tech">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e5ff06_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff06_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT NAVIGATION & STAGE RAIL */}
      <AnimatePresence initial={false}>
        {!isLeftNavCollapsed ? (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="relative z-30 border-r border-[#00e5ff]/20 bg-[#070c16]/95 backdrop-blur-xl p-4 flex flex-col justify-between shrink-0 text-xs shadow-2xl"
          >
            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {/* Breadcrumb Hierarchy */}
              <div className="flex flex-col gap-1.5 border-b border-[#00e5ff]/15 pb-3">
                <div className="flex items-center justify-between text-[#8e8d88]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#00e5ff]">LOCATION HIERARCHY</span>
                  <button
                    onClick={() => setIsLeftNavCollapsed(true)}
                    className="p-1 rounded hover:bg-white/5 text-[#8e8d88] hover:text-[#00e5ff]"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[#8e8d88]">
                  <span className="text-[#00e5ff]">📍</span>
                  <span>UAE</span>
                </div>
                <div className="pl-3 flex flex-col gap-1 text-[#8e8d88] border-l border-[#00e5ff]/20 ml-1">
                  <div className="flex items-center gap-1.5">
                    <span>🏢</span>
                    <span>Dubai</span>
                  </div>
                  <div className="pl-3 flex flex-col gap-1 border-l border-[#00e5ff]/20 ml-1">
                    <div className="flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>Downtown</span>
                    </div>
                    <div className="pl-3 flex items-center gap-1 text-[#00e5ff] font-bold">
                      <span>🏢</span>
                      <span>Tower B-4471</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex flex-col gap-1.5">
                <button className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#09101c] border border-white/5 hover:border-[#00e5ff]/30 text-[#8e8d88] hover:text-[#f5f4f0] transition-all">
                  <span className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#00e5ff]" />
                    <span>Telemetry Alerts</span>
                  </span>
                  <span className="w-4 h-4 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                </button>

                <button className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#09101c] border border-white/5 hover:border-[#d4ff00]/30 text-[#8e8d88] hover:text-[#f5f4f0] transition-all">
                  <span className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-[#d4ff00]" />
                    <span>Clash Resolves</span>
                  </span>
                  <span className="w-4 h-4 rounded-full bg-[#d4ff00]/20 text-[#d4ff00] flex items-center justify-center text-[10px] font-bold">
                    0
                  </span>
                </button>

                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#09101c] border border-white/5 hover:border-white/20 text-[#8e8d88] hover:text-[#f5f4f0] transition-all">
                  <FileText className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>BIM LOD 350 Spec</span>
                </button>
              </div>

              {/* Viewport Mode Switcher */}
              <div className="pt-2 border-t border-[#00e5ff]/15 flex flex-col gap-2">
                <span className="text-[10px] text-[#8e8d88] uppercase font-bold tracking-wider">
                  SPATIAL RENDER MODE
                </span>
                <div className="grid grid-cols-3 gap-1 bg-[#09101c] p-1 rounded-lg border border-[#00e5ff]/20">
                  <button
                    onClick={() => setActiveExperienceMode('tower')}
                    className={`py-1.5 rounded text-[10px] font-semibold transition-all ${
                      activeExperienceMode === 'tower'
                        ? 'bg-[#00e5ff] text-[#05080e] shadow-[0_0_10px_#00e5ff]'
                        : 'text-[#8e8d88] hover:text-[#f5f4f0]'
                    }`}
                  >
                    Tower 3D
                  </button>
                  <button
                    onClick={() => setActiveExperienceMode('bim-spatial')}
                    className={`py-1.5 rounded text-[10px] font-semibold transition-all ${
                      activeExperienceMode === 'bim-spatial'
                        ? 'bg-[#00e5ff] text-[#05080e] shadow-[0_0_10px_#00e5ff]'
                        : 'text-[#8e8d88] hover:text-[#f5f4f0]'
                    }`}
                  >
                    Holo BIM
                  </button>
                  <button
                    onClick={() => setActiveExperienceMode('motion-form')}
                    className={`py-1.5 rounded text-[10px] font-semibold transition-all ${
                      activeExperienceMode === 'motion-form'
                        ? 'bg-[#00e5ff] text-[#05080e] shadow-[0_0_10px_#00e5ff]'
                        : 'text-[#8e8d88] hover:text-[#f5f4f0]'
                    }`}
                  >
                    5 Films
                  </button>
                </div>
              </div>

              {/* View Camera Angles */}
              <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                <span className="text-[10px] text-[#8e8d88] uppercase font-bold">
                  CAMERA PROJECTION
                </span>
                <div className="flex gap-1">
                  {(['ISOMETRIC', 'FRONT', 'TOP'] as const).map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setViewAngle(angle)}
                      className={`flex-1 py-1 rounded text-[9px] border font-bold transition-all ${
                        viewAngle === angle
                          ? 'border-[#00e5ff] bg-[#00e5ff]/15 text-[#00e5ff]'
                          : 'border-white/10 text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Handoff Shortcuts */}
            <div className="pt-3 border-t border-[#00e5ff]/15 flex flex-col gap-2">
              {onNavigateToProve && (
                <button
                  onClick={onNavigateToProve}
                  className="w-full py-1.5 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_8px_rgba(16,185,129,0.2)] cursor-pointer"
                >
                  <span>SEND TO PROVE</span>
                  <ArrowRight size={12} />
                </button>
              )}
              {onNavigateToBuild && (
                <button
                  onClick={onNavigateToBuild}
                  className="w-full py-1.5 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_8px_rgba(245,158,11,0.2)] cursor-pointer"
                >
                  <span>SEND TO BUILD 4D</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.aside>
        ) : (
          <button
            onClick={() => setIsLeftNavCollapsed(false)}
            className="absolute top-4 left-4 z-40 p-2 rounded-lg bg-[#070c16]/90 border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 shadow-lg"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </AnimatePresence>

      {/* CENTER 3D CANVAS & SPATIAL STAGE */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col justify-between p-4 md:p-6">
        {/* Top Header & Breadcrumbs in Canvas */}
        <div className="relative z-20 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-0.5">
            {onBackToWorldModel && (
              <button
                onClick={onBackToWorldModel}
                className="flex items-center gap-1 text-xs text-[#00e5ff] hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Geospatial World Model</span>
              </button>
            )}
            <h1 className="text-base md:text-lg font-bold text-[#f5f4f0] tracking-wider flex items-center gap-2">
              {activeExperienceMode === 'tower'
                ? 'Tower B-4471 · Downtown Dubai'
                : activeExperienceMode === 'bim-spatial'
                ? 'Procedural BIM Holographic Viewport'
                : `${activeFilm.index} ${activeFilm.title} — “${activeFilm.tagline}”`}
              <span className="text-[10px] px-2 py-0.2 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 font-normal">
                {activeExperienceMode === 'tower' ? 'EXPLODED ISOMETRIC' : activeExperienceMode === 'bim-spatial' ? 'THREE.JS / R3F' : 'CINEMATIC 4K'}
              </span>
            </h1>
            <span className="text-[10px] text-[#8e8d88]">
              LAT 25.1972° N · LON 55.2744° E · GFA: {totalGFA.toLocaleString()} m²
            </span>
          </div>

          {/* Quick HUD Metrics Bar */}
          <div className="flex items-center gap-2 bg-[#070c16]/90 border border-[#00e5ff]/30 px-3 py-1.5 rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 px-2 border-r border-white/10">
              <span className="text-[10px] text-[#8e8d88]">GFA:</span>
              <span className="text-xs font-bold text-[#00e5ff]">{totalGFA.toLocaleString()} m²</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 border-r border-white/10">
              <span className="text-[10px] text-[#8e8d88]">Mass:</span>
              <span className="text-xs font-bold text-[#f59e0b]">{totalMassTonnes.toLocaleString()} t</span>
            </div>
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-[10px] text-[#8e8d88]">Carbon:</span>
              <span className="text-xs font-bold text-[#10b981]">{totalCarbonTonnes.toLocaleString()} tCO₂e</span>
            </div>
          </div>

          {/* Film Carousel Selector when in 5 Films Mode */}
          {activeExperienceMode === 'motion-form' && (
            <div className="flex items-center gap-2 bg-[#070c16]/90 border border-[#00e5ff]/30 px-3 py-1.5 rounded-lg">
              <button
                onClick={() => setSelectedFilmIndex((i) => (i > 0 ? i - 1 : EXPERIENCES.length - 1))}
                className="p-1 text-[#00e5ff] hover:bg-[#00e5ff]/15 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#f5f4f0] px-2 font-bold">
                {activeFilm.title}
              </span>
              <button
                onClick={() => setSelectedFilmIndex((i) => (i < EXPERIENCES.length - 1 ? i + 1 : 0))}
                className="p-1 text-[#00e5ff] hover:bg-[#00e5ff]/15 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 3D Spatial Canvas Visualizer */}
        <div className="relative flex-1 w-full flex items-center justify-center my-2">
          {activeExperienceMode === 'tower' ? (
            <div className="relative w-full max-w-[620px] h-[460px] flex items-center justify-center">
              {/* Leader Callout Lines & Layer Slices */}
              {layers.map((layer) => {
                if (!layer.visible) return null;
                const isSelected = selectedLayer.id === layer.id;
                // Calculate dynamic isometric Y offset based on decomposition progress
                const dynamicY = layer.elevationY * (0.2 + progress * 1.15);

                return (
                  <motion.div
                    key={layer.id}
                    className="absolute flex items-center justify-center cursor-pointer pointer-events-auto"
                    animate={{ y: -dynamicY }}
                    transition={{ type: 'spring', damping: 22, stiffness: 140 }}
                    onClick={() => setSelectedLayer(layer)}
                  >
                    {/* Isometric Layer Plate */}
                    <div
                      className={`relative w-64 h-24 rounded-lg border backdrop-blur-md transform -rotate-x-[60deg] rotate-z-[45deg] shadow-2xl transition-all ${
                        isSelected ? 'ring-2 ring-[#00e5ff] scale-105' : 'hover:scale-102'
                      }`}
                      style={{
                        backgroundColor: `${layer.color}1c`,
                        borderColor: isSelected ? '#00e5ff' : layer.color,
                        boxShadow: `0 0 20px ${layer.color}30`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-40 text-[9px] font-mono font-bold text-white tracking-widest">
                        {layer.code} · {layer.category}
                      </div>
                    </div>

                    {/* Left Leader Line & Text Callout */}
                    <div
                      className="absolute left-[-160px] flex items-center gap-2 pointer-events-auto"
                      style={{ top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                        isSelected ? 'text-[#00e5ff] font-bold' : 'text-[#f5f4f0]'
                      }`}>
                        {layer.callout}
                      </span>
                      <div className={`w-16 h-px transition-colors ${isSelected ? 'bg-[#00e5ff]' : 'bg-[#00e5ff]/40'}`} />
                      <span className={`w-2 h-2 rounded-full transition-all ${
                        isSelected ? 'bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]' : 'bg-[#00e5ff]/60'
                      }`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : activeExperienceMode === 'bim-spatial' ? (
            /* Live Three.js / R3F Spatial Holographic Viewport */
            <div className="relative w-full max-w-4xl h-[460px] rounded-xl overflow-hidden shadow-2xl border border-[#00e5ff]/30">
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
          ) : (
            /* MOTION / FORM Transformation Film View */
            <div className="relative w-full max-w-3xl h-[400px] rounded-xl border border-[#00e5ff]/30 overflow-hidden bg-black flex items-center justify-center shadow-2xl">
              <video
                src={activeFilm.videoSrc}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute top-3 left-3 bg-[#05080e]/90 px-3 py-1 rounded-lg border border-[#00e5ff]/30 text-[11px] text-[#00e5ff] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
                <span>CINEMATIC FORM TRANSFORMATION · {Math.round(progress * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Continuous Decomposition Precision Scrubber */}
        <div className="relative z-20 w-full max-w-3xl mx-auto flex flex-col gap-2 bg-[#070c16]/95 border border-[#00e5ff]/30 rounded-xl p-3.5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#00e5ff]">
              <span>0.00</span>
              <span className="tracking-wider">INTEGRATED</span>
            </span>

            {/* Numerical Progress Knob Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8e8d88]">DECOMPOSITION COEFFICIENT:</span>
              <div className="px-2.5 py-0.5 rounded bg-[#00e5ff] text-[#05080e] font-bold shadow-[0_0_10px_#00e5ff]">
                {progress.toFixed(2)}
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-[#d4ff00]">
              <span className="tracking-wider">DECOMPOSED</span>
              <span>1.00</span>
            </span>
          </div>

          {/* Interactive Range Slider */}
          <div className="relative w-full flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="tech-scrubber w-full h-2 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
            />
          </div>

          {/* Major Tick Marks */}
          <div className="flex justify-between text-[10px] text-[#545350] px-1 font-mono">
            <span>0.00 (Solid)</span>
            <span>0.25 (Core Sliced)</span>
            <span>0.50 (MEP Risers)</span>
            <span>0.75 (Envelope Detached)</span>
            <span>1.00 (Full Exploded)</span>
          </div>
        </div>
      </div>

      {/* RIGHT SMART INSPECTOR & COPILOT DOCK */}
      <AnimatePresence initial={false}>
        {!isRightInspectorCollapsed ? (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="relative z-30 border-l border-[#00e5ff]/20 bg-[#070c16]/95 backdrop-blur-xl p-4 flex flex-col justify-between shrink-0 text-xs shadow-2xl"
          >
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider text-[#f5f4f0] uppercase">
                    LAYER INSPECTOR
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00e5ff]/20 text-[#00e5ff]">
                    {layers.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsRightInspectorCollapsed(true)}
                  className="p-1 rounded hover:bg-white/5 text-[#8e8d88] hover:text-[#00e5ff]"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>

              {/* Selected Layer Detail Card */}
              {selectedLayer && (
                <div className="p-3 rounded-lg bg-[#09101c] border border-[#00e5ff]/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#00e5ff]">{selectedLayer.name}</span>
                    <span className="text-[10px] text-[#8e8d88]">{selectedLayer.code}</span>
                  </div>
                  <div className="text-[11px] text-[#f5f4f0]">
                    Material: <span className="text-[#8e8d88]">{selectedLayer.material}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#8e8d88] mt-1">
                    <div className="p-1.5 bg-white/5 rounded">
                      <span>Mass: </span>
                      <span className="font-bold text-[#f5f4f0]">{(selectedLayer.massKg / 1000).toFixed(1)} t</span>
                    </div>
                    <div className="p-1.5 bg-white/5 rounded">
                      <span>Carbon: </span>
                      <span className="font-bold text-[#10b981]">{(selectedLayer.embodiedCarbonKg / 1000).toFixed(1)} tCO₂e</span>
                    </div>
                    <div className="p-1.5 bg-white/5 rounded col-span-2">
                      <span>Fire Rating: </span>
                      <span className="font-bold text-[#f5f4f0]">{selectedLayer.fireRating}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Component Layers List */}
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {layers.map((layer) => {
                  const isSelected = selectedLayer.id === layer.id;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff]'
                          : 'bg-[#09101c]/80 border-white/5 hover:border-white/20 text-[#f5f4f0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className="text-[#00e5ff] hover:text-white"
                        >
                          {layer.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-[#545350]" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">
                            {layer.name}
                          </span>
                          <span className="text-[9px] text-[#8e8d88]">
                            {layer.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* JARVIS Autonomous Spatial Co-Pilot Card */}
              <div className="p-3 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[#00e5ff] font-bold text-xs">
                  <Cpu size={14} />
                  <span>JARVIS Spatial Intelligence</span>
                </div>
                <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                  Structural steel core alignment and MEP risers are 100% clash-free under Dubai Building Code (DBC 2026). Thermal transfer index is compliant with LEED Platinum threshold.
                </p>
              </div>
            </div>

            {/* Bottom Quick Trigger */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setLayers(INITIAL_LAYERS.map(l => ({ ...l, visible: true })));
                  setProgress(0.65);
                }}
                className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 text-[#8e8d88] hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset View State</span>
              </button>
            </div>
          </motion.aside>
        ) : (
          <button
            onClick={() => setIsRightInspectorCollapsed(false)}
            className="absolute top-4 right-4 z-40 p-2 rounded-lg bg-[#070c16]/90 border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 shadow-lg"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </AnimatePresence>
    </div>
  );
};
