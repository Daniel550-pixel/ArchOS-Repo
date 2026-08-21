import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Landmark,
  Layers,
  Train,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  MapPin,
  Shield,
  Radio,
  Eye,
  Activity,
  Database,
  Brain,
  Crosshair,
  Search,
  Sliders,
  Maximize2,
  RotateCcw,
  Sun,
  Moon,
  Flame,
  Camera,
  Navigation,
  Compass,
  ArrowRight,
  CheckCircle2,
  Volume2,
  Globe
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { UAE3DWorldModel, UAE_LANDMARKS, LandmarkPOI, LightingMode, ActiveLayer } from '../world/UAE3DWorldModel';
import { UAEGeospatialEngine } from '../world/UAEGeospatialEngine';
import { InfrastructureHUDOverlay } from '../spatial/InfrastructureHUDOverlay';
import { SecurityThreatOverlay } from '../spatial/SecurityThreatOverlay';
import { EpistemologicalGraphInspector } from '../spatial/EpistemologicalGraphInspector';
import { AgentFabricReasoningStudio } from '../spatial/AgentFabricReasoningStudio';
import { GroundScanIngestionPanel } from '../spatial/GroundScanIngestionPanel';
import { SeusPtgiStudioView } from '../spatial/SeusPtgiStudioView';
import { speechService } from '../../services/voice/speechService';
import { RealCity3D } from '../discover/RealCity3D';
import { PlanningMap } from '../discover/PlanningMap';
import { fetchRealBuildings, RealBuilding } from '../../services/osm';

interface WorldModelViewProps {
  onSelectDistrict: (districtId: string) => void;
  onOpenExperience: () => void;
}

type WorldModelSubTab = 'MAP_3D' | 'REAL_OSM_3D' | 'REAL_PLANNING_LAYERS' | 'GRAPH_14_ATTRIBUTES' | 'AGENT_FABRIC' | 'GROUNDSCAN' | 'SEUS_8K_RAYTRACER';
type EngineMode = 'GEOSPATIAL_MAPBOX' | 'HOLOGRAPHIC_BIM_3D';

const TRAFFIC_TELEMETRY = [
  { time: '04:00', density: 18, delay: 0 },
  { time: '06:00', density: 42, delay: 1.2 },
  { time: '08:00', density: 88, delay: 4.8 },
  { time: '10:00', density: 64, delay: 2.1 },
  { time: '12:00', density: 55, delay: 1.4 },
  { time: '14:00', density: 62, delay: 2.0 },
  { time: '16:00', density: 78, delay: 3.6 },
  { time: '18:00', density: 85, delay: 4.2 },
  { time: '20:00', density: 72, delay: 2.4 }
];

export const WorldModelView: React.FC<WorldModelViewProps> = ({
  onSelectDistrict,
  onOpenExperience
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WorldModelSubTab>('MAP_3D');
  const [engineMode, setEngineMode] = useState<EngineMode>('GEOSPATIAL_MAPBOX');
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkPOI>(UAE_LANDMARKS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightingMode, setLightingMode] = useState<LightingMode>('CYBER');
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ALL');
  const [sliceSeparation, setSliceSeparation] = useState(0.4); // 0.0 to 1.5
  const [cameraPreset, setCameraPreset] = useState<'COMMAND' | 'ORBIT' | 'NADIR' | 'STREET'>('COMMAND');
  const [isLeftNavCollapsed, setIsLeftNavCollapsed] = useState(false);
  const [isRightTelemetryCollapsed, setIsRightTelemetryCollapsed] = useState(false);
  const [showThreatOverlay, setShowThreatOverlay] = useState(false);
  const [showInfrastructureHUD, setShowInfrastructureHUD] = useState(true);
  const [realBuildings, setRealBuildings] = useState<RealBuilding[]>([]);
  const [isLoadingOsm, setIsLoadingOsm] = useState(false);

  useEffect(() => {
    setIsLoadingOsm(true);
    fetchRealBuildings().then((b) => {
      setRealBuildings(b);
      setIsLoadingOsm(false);
    }).catch(() => setIsLoadingOsm(false));
  }, []);

  const handleSpeak = (text: string) => {
    speechService.speak(text);
  };

  const handleSelectLandmark = (landmark: LandmarkPOI) => {
    setSelectedLandmark(landmark);
    onSelectDistrict(landmark.district.toLowerCase());
    speechService.speak(`Focusing 3D spatial viewport on ${landmark.name} in ${landmark.district}.`);
  };

  const filteredLandmarks = UAE_LANDMARKS.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.emirate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#03060d] select-none font-mono-tech">
      {/* Top Secondary Sub-Navigation Toolbar */}
      <div className="z-40 h-11 bg-[#060b14]/95 border-b border-[#00e5ff]/20 px-4 flex items-center justify-between shrink-0 text-xs backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pr-2">
          <button
            onClick={() => setActiveSubTab('MAP_3D')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'MAP_3D'
                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/60 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D INTERACTIVE UAE MODEL</span>
          </button>

          <button
            onClick={() => setActiveSubTab('REAL_OSM_3D')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'REAL_OSM_3D'
                ? 'bg-[#00e5ff] text-black font-bold shadow-[0_0_12px_#00e5ff]'
                : 'text-[#00e5ff] border border-[#00e5ff]/30 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>REAL OSM 3D (EXTRUDED)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('REAL_PLANNING_LAYERS')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'REAL_PLANNING_LAYERS'
                ? 'bg-[#d4ff00] text-black font-bold shadow-[0_0_12px_#d4ff00]'
                : 'text-[#d4ff00] border border-[#d4ff00]/30 bg-[#d4ff00]/10 hover:bg-[#d4ff00]/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>REAL PLANNING & CLIMATE</span>
          </button>

          <button
            onClick={() => setActiveSubTab('GRAPH_14_ATTRIBUTES')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'GRAPH_14_ATTRIBUTES'
                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/60 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span>14-ATTRIBUTE GRAPH</span>
          </button>

          <button
            onClick={() => setActiveSubTab('AGENT_FABRIC')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'AGENT_FABRIC'
                ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/60 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#10b981]" />
            <span>AGENT REASONING FABRIC</span>
          </button>

          <button
            onClick={() => setActiveSubTab('GROUNDSCAN')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'GROUNDSCAN'
                ? 'bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/60 shadow-[0_0_12px_rgba(212,255,0,0.25)]'
                : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-[#d4ff00]" />
            <span>GROUNDSCAN (LIDAR)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SEUS_8K_RAYTRACER')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg font-semibold transition-all ${
              activeSubTab === 'SEUS_8K_RAYTRACER'
                ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-[#8e8d88] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>SEUS PTGI 8K RAYTRACER</span>
          </button>
        </div>

        {/* Live World Model Telemetry Badge & Engine Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {activeSubTab === 'MAP_3D' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowInfrastructureHUD(!showInfrastructureHUD)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
                  showInfrastructureHUD
                    ? 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/60 shadow-[0_0_10px_rgba(212,255,0,0.25)]'
                    : 'bg-[#091220] text-[#8e8d88] border-white/10 hover:text-white'
                }`}
              >
                <Radio size={11} className={showInfrastructureHUD ? 'animate-pulse' : ''} />
                <span>INFRA HUD</span>
              </button>

              <div className="flex items-center p-0.5 rounded-lg bg-[#091220] border border-white/10">
                <button
                  onClick={() => setEngineMode('GEOSPATIAL_MAPBOX')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                    engineMode === 'GEOSPATIAL_MAPBOX'
                      ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                      : 'text-[#8e8d88] hover:text-white'
                  }`}
                >
                  <Globe size={11} />
                  <span>3D GEOSPATIAL GIS</span>
                </button>
                <button
                  onClick={() => setEngineMode('HOLOGRAPHIC_BIM_3D')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                    engineMode === 'HOLOGRAPHIC_BIM_3D'
                      ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                      : 'text-[#8e8d88] hover:text-white'
                  }`}
                >
                  <Sparkles size={11} />
                  <span>3D BIM CITYSCAPE</span>
                </button>
              </div>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[#8e8d88] pl-2 border-l border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[10px] text-zinc-300 font-bold">
              SOVEREIGN GIS
            </span>
          </div>
        </div>
      </div>

      {/* Alternate Sub-Tab Views */}
      {activeSubTab === 'REAL_OSM_3D' && (
        <div className="relative flex-1 p-4 bg-[#03060d] h-full overflow-hidden">
          <RealCity3D buildings={realBuildings} />
        </div>
      )}

      {activeSubTab === 'REAL_PLANNING_LAYERS' && (
        <div className="relative flex-1 p-4 bg-[#03060d] h-full overflow-hidden">
          <PlanningMap />
        </div>
      )}

      {activeSubTab === 'SEUS_8K_RAYTRACER' && (
        <SeusPtgiStudioView onClose={() => setActiveSubTab('MAP_3D')} />
      )}

      {activeSubTab === 'GRAPH_14_ATTRIBUTES' && (
        <EpistemologicalGraphInspector onSpeak={handleSpeak} />
      )}

      {activeSubTab === 'AGENT_FABRIC' && (
        <AgentFabricReasoningStudio onSpeak={handleSpeak} />
      )}

      {activeSubTab === 'GROUNDSCAN' && (
        <GroundScanIngestionPanel
          onSpeak={handleSpeak}
          onNavigateToWorldModel={() => setActiveSubTab('GRAPH_14_ATTRIBUTES')}
        />
      )}

      {/* FULL SCALE 3D INTERACTIVE UAE WORLD MODEL */}
      {activeSubTab === 'MAP_3D' && (
        <div className="relative flex-1 flex overflow-hidden">
          {/* LEFT COMMAND & SEARCH DRAWER */}
          <AnimatePresence initial={false}>
            {!isLeftNavCollapsed ? (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative z-30 border-r border-[#00e5ff]/20 bg-[#060c18]/95 backdrop-blur-2xl p-4 flex flex-col justify-between shrink-0 shadow-2xl overflow-y-auto custom-scrollbar"
              >
                <div className="flex flex-col gap-4">
                  {/* Search Bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#00e5ff] uppercase font-bold tracking-wider">
                        SPATIAL SEARCH
                      </span>
                      <button
                        onClick={() => setIsLeftNavCollapsed(true)}
                        className="p-1 rounded hover:bg-white/5 text-[#8e8d88] hover:text-[#00e5ff]"
                      >
                        <ChevronsLeft size={14} />
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#8e8d88]" />
                      <input
                        type="text"
                        placeholder="Search landmark, plot, district..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#091220] border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#f5f4f0] placeholder-[#545350] focus:border-[#00e5ff] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 3D Render Lighting Modes */}
                  <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
                    <span className="text-[10px] text-[#8e8d88] uppercase font-bold">
                      RENDER LIGHTING SHADER
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['CYBER', 'TWILIGHT', 'THERMAL', 'LIDAR'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setLightingMode(mode)}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                            lightingMode === mode
                              ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                              : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              mode === 'CYBER'
                                ? 'bg-[#00e5ff]'
                                : mode === 'TWILIGHT'
                                ? 'bg-[#f59e0b]'
                                : mode === 'THERMAL'
                                ? 'bg-[#f43f5e]'
                                : 'bg-[#10b981]'
                            }`}
                          />
                          <span>{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camera Angles */}
                  <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
                    <span className="text-[10px] text-[#8e8d88] uppercase font-bold">
                      CAMERA PROJECTION PRESET
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['COMMAND', 'ORBIT', 'NADIR', 'STREET'] as const).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setCameraPreset(preset)}
                          className={`py-1 px-2 rounded text-[10px] font-bold border transition-all ${
                            cameraPreset === preset
                              ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff]'
                              : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4-Tier Geospatial Layer Slices Filter */}
                  <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8e8d88] uppercase font-bold">
                        GEOSPATIAL SLICE LAYERS
                      </span>
                      <span className="text-[9px] text-[#00e5ff]">
                        TIERS (0-4)
                      </span>
                    </div>

                    <div className="space-y-1">
                      {(['ALL', 'SKYLINE', 'MOBILITY', 'SENSORS', 'SUBSURFACE'] as const).map((layer) => (
                        <button
                          key={layer}
                          onClick={() => setActiveLayer(layer)}
                          className={`w-full py-1 px-2 rounded text-[10px] font-semibold text-left border flex items-center justify-between transition-all ${
                            activeLayer === layer
                              ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff]'
                              : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:text-white'
                          }`}
                        >
                          <span>{layer}</span>
                          {activeLayer === layer && <span className="text-[#00e5ff]">●</span>}
                        </button>
                      ))}
                    </div>

                    {/* Slice Separation Scrubber */}
                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-[#8e8d88]">
                        <span>Isometric Separation:</span>
                        <span className="text-[#00e5ff] font-bold">{(sliceSeparation * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.2"
                        step="0.05"
                        value={sliceSeparation}
                        onChange={(e) => setSliceSeparation(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
                      />
                    </div>
                  </div>

                  {/* Landmarks POI Directory */}
                  <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
                    <span className="text-[10px] text-[#8e8d88] uppercase font-bold">
                      LANDMARKS & ASSETS ({filteredLandmarks.length})
                    </span>

                    <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                      {filteredLandmarks.map((lm) => {
                        const isSelected = selectedLandmark.id === lm.id;
                        return (
                          <div
                            key={lm.id}
                            onClick={() => handleSelectLandmark(lm)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                                : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-[#f5f4f0]">{lm.name}</span>
                              <span className="text-[9px] text-[#8e8d88]">{lm.district} · {lm.emirate}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#00e5ff]">
                              {lm.stats.heightM}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Global Threat Toggle */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={() => setShowThreatOverlay(!showThreatOverlay)}
                    className={`w-full py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      showThreatOverlay
                        ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#ec4899]'
                        : 'bg-[#091220] border-white/10 text-[#8e8d88] hover:text-white'
                    }`}
                  >
                    <Shield size={12} />
                    <span>{showThreatOverlay ? 'HIDE THREAT MESH' : 'SHOW THREAT MESH'}</span>
                  </button>
                </div>
              </motion.aside>
            ) : (
              <button
                onClick={() => setIsLeftNavCollapsed(false)}
                className="absolute top-4 left-4 z-40 p-2 rounded-lg bg-[#060c18]/90 border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 shadow-xl backdrop-blur-md"
              >
                <ChevronsRight size={16} />
              </button>
            )}
          </AnimatePresence>

          {/* MAIN 3D THREE.JS SPATIAL VIEWPORT */}
          <div className="relative flex-1 h-full overflow-hidden flex items-center justify-center">
            {/* Top Floating Breadcrumb HUD Bar */}
            <div className="absolute top-4 left-6 z-20 flex items-center gap-3 bg-[#060c18]/85 border border-[#00e5ff]/30 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-2xl">
              <span className="text-[#00e5ff] font-bold text-xs flex items-center gap-1.5">
                <MapPin size={14} />
                <span>UAE 3D TWIN</span>
              </span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-300 text-xs font-semibold">{selectedLandmark.emirate}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-[#00e5ff] text-xs font-bold">{selectedLandmark.district}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-200 text-xs font-bold">{selectedLandmark.name}</span>
            </div>

            {/* Top Right Floating Telemetry Pill Badges (Image 1 reference) */}
            <div className="absolute top-4 right-6 z-20 flex items-center gap-2.5">
              <div className="bg-[#060c18]/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 text-[11px]">
                <Activity size={14} className="text-[#00e5ff]" />
                <span className="text-[#8e8d88]">TRAFFIC DENSITY:</span>
                <span className="font-bold text-[#00e5ff]">72%</span>
              </div>

              <div className="bg-[#060c18]/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 text-[11px]">
                <Zap size={14} className="text-[#10b981]" />
                <span className="text-[#8e8d88]">AIR QUALITY:</span>
                <span className="font-bold text-[#10b981]">GOOD (AQI 24)</span>
              </div>

              <div className="bg-[#060c18]/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 text-[11px]">
                <Train size={14} className="text-[#f59e0b]" />
                <span className="text-[#8e8d88]">TRANSIT DELAY:</span>
                <span className="font-bold text-[#f59e0b]">-2.4 MIN</span>
              </div>
            </div>

            {/* LIVE 3D R3F CANVAS OR GEOSPATIAL MAPBOX/MAPLIBRE ENGINE */}
            {engineMode === 'GEOSPATIAL_MAPBOX' ? (
              <UAEGeospatialEngine
                selectedLandmarkId={selectedLandmark.id}
                onSelectLandmark={handleSelectLandmark}
                onOpenExperience={onOpenExperience}
              />
            ) : (
              <UAE3DWorldModel
                lightingMode={lightingMode}
                activeLayer={activeLayer}
                sliceSeparation={sliceSeparation}
                selectedLandmarkId={selectedLandmark.id}
                onSelectLandmark={handleSelectLandmark}
                cameraPreset={cameraPreset}
              />
            )}

            {/* D3 Security Threat Overlay if toggled */}
            <SecurityThreatOverlay
              isVisible={showThreatOverlay}
              onClose={() => setShowThreatOverlay(false)}
            />

            {/* Glowing Translucent Infrastructure HUD Overlay with Particles & Laser Indicators */}
            <InfrastructureHUDOverlay
              isVisible={showInfrastructureHUD}
              onToggleVisible={() => setShowInfrastructureHUD(!showInfrastructureHUD)}
            />

            {/* BOTTOM CENTER 3D NAVIGATION CONTROLS HUD */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#060c18]/90 border border-[#00e5ff]/40 px-4 py-2 rounded-2xl backdrop-blur-xl shadow-2xl">
              <button
                onClick={() => setCameraPreset('COMMAND')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraPreset === 'COMMAND'
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Panoramic 3D
              </button>

              <button
                onClick={() => setCameraPreset('ORBIT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraPreset === 'ORBIT'
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Orbit 360°
              </button>

              <button
                onClick={() => setCameraPreset('NADIR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  cameraPreset === 'NADIR'
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                Nadir Top-Down
              </button>

              <div className="h-4 w-px bg-white/20 mx-1" />

              <button
                onClick={onOpenExperience}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#10b981] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer hover:scale-105 transition-all"
              >
                <span>OPEN 3D EXPLODED BIM</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT SMART INSPECTOR & TELEMETRY ARC (As in reference Image 2 & 3) */}
          <AnimatePresence initial={false}>
            {!isRightTelemetryCollapsed ? (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative z-30 border-l border-[#00e5ff]/20 bg-[#060c18]/95 backdrop-blur-2xl p-4 flex flex-col justify-between shrink-0 shadow-2xl overflow-y-auto custom-scrollbar"
              >
                <div className="flex flex-col gap-3.5">
                  {/* Landmark Header */}
                  <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#00e5ff]" />
                      <span className="font-bold tracking-wider text-[#f5f4f0] uppercase text-xs">
                        SPATIAL INSPECTOR
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRightTelemetryCollapsed(true)}
                      className="p-1 rounded hover:bg-white/5 text-[#8e8d88] hover:text-[#00e5ff]"
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>

                  {/* Selected Landmark Detail Card (Image 2 style) */}
                  <div className="rounded-xl border border-[#00e5ff]/30 bg-[#091220] p-3.5 flex flex-col gap-2.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#00e5ff]">{selectedLandmark.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] font-semibold">
                        {selectedLandmark.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                      {selectedLandmark.description}
                    </p>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-2 rounded bg-white/5 flex flex-col">
                        <span className="text-[#8e8d88]">Height (Scale):</span>
                        <span className="text-xs font-bold text-white">{selectedLandmark.stats.heightM} meters</span>
                      </div>
                      <div className="p-2 rounded bg-white/5 flex flex-col">
                        <span className="text-[#8e8d88]">Gross Floor Area:</span>
                        <span className="text-xs font-bold text-[#00e5ff]">{selectedLandmark.stats.gfaSqm}</span>
                      </div>
                      <div className="p-2 rounded bg-white/5 flex flex-col">
                        <span className="text-[#8e8d88]">Green Rating:</span>
                        <span className="text-xs font-bold text-[#10b981]">{selectedLandmark.stats.energyRating}</span>
                      </div>
                      <div className="p-2 rounded bg-white/5 flex flex-col">
                        <span className="text-[#8e8d88]">Live Occupancy:</span>
                        <span className="text-xs font-bold text-[#d4ff00]">{selectedLandmark.stats.occupancy}%</span>
                      </div>
                    </div>

                    {/* Action button inside card */}
                    <button
                      onClick={onOpenExperience}
                      className="w-full mt-1 py-1.5 rounded-lg border border-[#00e5ff] bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-[#00e5ff] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View 3D LOD 350 Model</span>
                    </button>
                  </div>

                  {/* Panoramic Real-Time Traffic & Mobility Flow Curve */}
                  <div className="rounded-xl border border-white/10 bg-[#091220] p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8e8d88] font-bold">Traffic Flow & Corridor Delay</span>
                      <span className="text-[#00e5ff] font-mono font-bold">Sheikh Zayed Rd</span>
                    </div>

                    <div className="w-full h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={TRAFFIC_TELEMETRY}>
                          <defs>
                            <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" stroke="#545350" fontSize={9} tickLine={false} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#070c16',
                              borderColor: '#00e5ff',
                              borderRadius: '6px',
                              fontSize: '10px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="density"
                            stroke="#00e5ff"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#trafficGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* JARVIS Geospatial AI Copilot Intelligence */}
                  <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[#00e5ff] font-bold text-xs">
                      <Brain size={14} />
                      <span>JARVIS Urban Intelligence</span>
                    </div>
                    <p className="text-[11px] text-[#8e8d88] leading-relaxed">
                      High-density zoning in Downtown Dubai currently operating at optimal cooling efficiency. Smart water desalination grid has supplied 4.2M gallons with zero thermal variance.
                    </p>
                  </div>
                </div>

                {/* Bottom Speech Trigger */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      speechService.speak(
                        `Emirates 3D World Model verified. Live telemetry streaming across Downtown Dubai, Sheikh Zayed Road, and Jebel Ali Port.`
                      );
                    }}
                    className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e8d88] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Volume2 size={13} />
                    <span>Audible Spatial Briefing</span>
                  </button>
                </div>
              </motion.aside>
            ) : (
              <button
                onClick={() => setIsRightTelemetryCollapsed(false)}
                className="absolute top-4 right-4 z-40 p-2 rounded-lg bg-[#060c18]/90 border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 shadow-xl backdrop-blur-md"
              >
                <ChevronsLeft size={16} />
              </button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
