// src/components/spatial/SeusPtgiStudioView.tsx
// SEUS PTGI 8K Path Tracing Studio for ArchOS Sovereign Architectural Visualization

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  seusPtgiRenderer,
  DEFAULT_RENDER_CONFIG,
  RenderConfig
} from '../../services/renderer/SeusPtgiRendererService';
import {
  Sun,
  Sparkles,
  Layers,
  Download,
  RotateCcw,
  Sliders,
  Eye,
  Camera,
  Cpu,
  Shield,
  Activity,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface SeusPtgiStudioViewProps {
  onClose?: () => void;
}

const LIGHTING_PRESETS = [
  {
    name: 'UAE Golden Hour',
    elevation: 26,
    azimuth: 230,
    intensity: 1.45,
    turbidity: 1.3,
    desc: 'Warm sunset glow, long soft shadows, amber caustics'
  },
  {
    name: 'Arabian High Noon',
    elevation: 78,
    azimuth: 180,
    intensity: 1.9,
    turbidity: 0.8,
    desc: 'Harsh zenith lighting, high specular brilliance'
  },
  {
    name: 'Sovereign Twilight',
    elevation: 6,
    azimuth: 285,
    intensity: 0.95,
    turbidity: 2.2,
    desc: 'Deep violet horizon, illuminated architectural spires'
  },
  {
    name: 'Desert Oasis Night',
    elevation: -15,
    azimuth: 90,
    intensity: 0.35,
    turbidity: 0.5,
    desc: 'Subtle moonlit specular reflections & cyan luminescents'
  }
];

const MATERIALS = [
  { id: 0, name: 'Desert Sandstone', desc: 'Raw textured limestone' },
  { id: 1, name: 'Brushed Titanium', desc: 'Sovereign metallic alloy' },
  { id: 2, name: 'Sovereign Glass', desc: 'Dielectric refractive glazing' },
  { id: 3, name: '24K Gold Leaf', desc: 'High-specular sovereign apex' },
  { id: 4, name: 'Emirates Marble', desc: 'Veined crystalline plaza' },
  { id: 5, name: 'Solar PV Glazing', desc: 'Clean energy absorbing coat' }
];

export const SeusPtgiStudioView: React.FC<SeusPtgiStudioViewProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [config, setConfig] = useState<RenderConfig>({ ...DEFAULT_RENDER_CONFIG });
  const [currentSpp, setCurrentSpp] = useState(0);
  const [targetSpp, setTargetSpp] = useState(256);
  const [isConverged, setIsConverged] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIGHTING' | 'MATERIALS' | 'CAMERA' | 'DENOISER'>('LIGHTING');
  const [activePreset, setActivePreset] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    seusPtgiRenderer.initialize(canvasRef.current);

    const unsub = seusPtgiRenderer.onProgress((cur, tgt, conv) => {
      setCurrentSpp(cur);
      setTargetSpp(tgt);
      setIsConverged(conv);
    });

    return () => {
      unsub();
      seusPtgiRenderer.dispose();
    };
  }, []);

  const handleConfigChange = (partial: Partial<RenderConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    seusPtgiRenderer.setConfig(partial);
  };

  const handlePresetSelect = (idx: number) => {
    setActivePreset(idx);
    const p = LIGHTING_PRESETS[idx];
    handleConfigChange({
      sunElevationDeg: p.elevation,
      sunAzimuthDeg: p.azimuth,
      sunIntensity: p.intensity,
      skyTurbidity: p.turbidity
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await seusPtgiRenderer.exportMasterRender();
      const link = document.createElement('a');
      link.download = `ArchOS_SEUS_PTGI_${config.resolutionTier}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const convergencePercent = Math.min(100, Math.round((currentSpp / targetSpp) * 100));

  return (
    <div
      id="seus-ptgi-studio-root"
      className="relative w-full h-full flex flex-col bg-[#05070c] text-slate-100 font-mono select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <div className="h-14 bg-[#080d18] border-b border-cyan-500/20 px-5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-cyan-300 text-sm">
                SEUS PTGI 8K PATH TRACER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                GLOBAL ILLUMINATION V4.2
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Sovereign Architectural Raytracer • Monte Carlo Multi-Bounce
            </span>
          </div>
        </div>

        {/* Resolution Tier Selector */}
        <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => handleConfigChange({ resolutionTier: 'PREVIEW_1080P' })}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              config.resolutionTier === 'PREVIEW_1080P'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1080P Preview
          </button>
          <button
            onClick={() => handleConfigChange({ resolutionTier: 'UHD_4K' })}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              config.resolutionTier === 'UHD_4K'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4K Ultra-HD
          </button>
          <button
            onClick={() => handleConfigChange({ resolutionTier: 'MASTER_8K' })}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              config.resolutionTier === 'MASTER_8K'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            8K Sovereign Master (7680×4320)
          </button>
        </div>

        {/* Export & Reset Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => seusPtgiRenderer.resetAccumulation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset SPP</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-900/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting 8K...' : 'Export Master Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Path Traced WebGL Canvas */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain cursor-crosshair"
          />

          {/* Real-time Convergence Telemetry Overlay (Bottom-Left) */}
          <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                TEMPORAL ACCUMULATION
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentSpp} / {targetSpp} SPP
              </span>
            </div>

            {/* Convergence Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-150 ${
                  isConverged
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${convergencePercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Status: {isConverged ? 'CONVERGED (NOISELESS)' : 'INTEGRATING SAMPLES...'}</span>
              <span className="text-cyan-400 font-bold">{convergencePercent}%</span>
            </div>
          </div>

          {/* Viewport Info Overlay (Top-Left) */}
          <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">BUFFER:</span>
              <span>{config.targetWidth} × {config.targetHeight} px</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Bounces: {config.maxBounces}</span>
              <span>•</span>
              <span>Denoise: {config.enableDenoise ? 'OIDN Wavelet' : 'Raw MC'}</span>
              <span>•</span>
              <span>Caustics: {config.enableCaustics ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>

        {/* Right Settings & Shader Inspector Panel */}
        <div className="w-96 bg-[#080d18] border-l border-cyan-500/20 flex flex-col z-20 overflow-y-auto">
          {/* Sub-Tab Selector */}
          <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/10 bg-black/30 text-xs">
            <button
              onClick={() => setActiveTab('LIGHTING')}
              className={`py-1.5 rounded-lg font-semibold text-center transition ${
                activeTab === 'LIGHTING'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lighting
            </button>
            <button
              onClick={() => setActiveTab('MATERIALS')}
              className={`py-1.5 rounded-lg font-semibold text-center transition ${
                activeTab === 'MATERIALS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab('CAMERA')}
              className={`py-1.5 rounded-lg font-semibold text-center transition ${
                activeTab === 'CAMERA'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quality
            </button>
            <button
              onClick={() => setActiveTab('DENOISER')}
              className={`py-1.5 rounded-lg font-semibold text-center transition ${
                activeTab === 'DENOISER'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Post/FX
            </button>
          </div>

          <div className="p-4 space-y-5 text-xs">
            {/* 1. LIGHTING TAB */}
            {activeTab === 'LIGHTING' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="font-bold text-cyan-300 tracking-wide">
                    UAE ATMOSPHERIC PRESETS
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {LIGHTING_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(idx)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          activePreset === idx
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                            : 'bg-black/40 border-white/5 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs">{preset.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sun Angle Controls */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Sun Elevation:</span>
                      <span className="font-bold text-cyan-400">{config.sunElevationDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="90"
                      value={config.sunElevationDeg}
                      onChange={(e) => handleConfigChange({ sunElevationDeg: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Sun Azimuth:</span>
                      <span className="font-bold text-cyan-400">{config.sunAzimuthDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={config.sunAzimuthDeg}
                      onChange={(e) => handleConfigChange({ sunAzimuthDeg: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Sky Turbidity (Desert Haze):</span>
                      <span className="font-bold text-cyan-400">{config.skyTurbidity}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="4.0"
                      step="0.1"
                      value={config.skyTurbidity}
                      onChange={(e) => handleConfigChange({ skyTurbidity: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. MATERIALS TAB */}
            {activeTab === 'MATERIALS' && (
              <div className="space-y-4">
                <span className="font-bold text-cyan-300 tracking-wide">
                  PBR ARCHITECTURAL SURFACES
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {MATERIALS.map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => handleConfigChange({ materialType: mat.id })}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        config.materialType === mat.id
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-md'
                          : 'bg-black/40 border-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-xs">{mat.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{mat.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Surface Roughness (GGX):</span>
                      <span className="font-bold text-cyan-400">{config.roughness}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.9"
                      step="0.02"
                      value={config.roughness}
                      onChange={(e) => handleConfigChange({ roughness: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Metallic Specular Factor:</span>
                      <span className="font-bold text-cyan-400">{config.metallic}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.metallic}
                      onChange={(e) => handleConfigChange({ metallic: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. QUALITY / RAYTRACING TAB */}
            {activeTab === 'CAMERA' && (
              <div className="space-y-4">
                <span className="font-bold text-cyan-300 tracking-wide">
                  PATH TRACING SAMPLES & BOUNCES
                </span>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Max Ray Bounces:</span>
                      <span className="font-bold text-cyan-400">{config.maxBounces} Bounces</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={config.maxBounces}
                      onChange={(e) => handleConfigChange({ maxBounces: parseInt(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Target SPP (Samples per pixel):</span>
                      <span className="font-bold text-cyan-400">{config.samplesPerPixel} SPP</span>
                    </div>
                    <input
                      type="range"
                      min="32"
                      max="2048"
                      step="32"
                      value={config.samplesPerPixel}
                      onChange={(e) => handleConfigChange({ samplesPerPixel: parseInt(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Camera FOV:</span>
                      <span className="font-bold text-cyan-400">{config.fov}°</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="90"
                      value={config.fov}
                      onChange={(e) => handleConfigChange({ fov: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. POST / FX TAB */}
            {activeTab === 'DENOISER' && (
              <div className="space-y-4">
                <span className="font-bold text-cyan-300 tracking-wide">
                  DENOISING & OPTICAL EFFECTS
                </span>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                    <div>
                      <div className="font-bold text-xs">Edge-Preserving Denoising</div>
                      <div className="text-[10px] text-slate-400">Wavelet cross-bilateral filter</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableDenoise}
                      onChange={(e) => handleConfigChange({ enableDenoise: e.target.checked })}
                      className="w-4 h-4 accent-cyan-400 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                    <div>
                      <div className="font-bold text-xs">Dielectric Caustics</div>
                      <div className="text-[10px] text-slate-400">Water pool & glass light focusing</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableCaustics}
                      onChange={(e) => handleConfigChange({ enableCaustics: e.target.checked })}
                      className="w-4 h-4 accent-cyan-400 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                    <div>
                      <div className="font-bold text-xs">Volumetric Atmosphere</div>
                      <div className="text-[10px] text-slate-400">Rayleigh & Mie forward scattering</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enableVolumetrics}
                      onChange={(e) => handleConfigChange({ enableVolumetrics: e.target.checked })}
                      className="w-4 h-4 accent-cyan-400 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
