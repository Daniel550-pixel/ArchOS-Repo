// src/components/spatial/SpatialCanvas.tsx
// Spatial Viewport integrating 2D Geospatial Map, 3D BIM, and 8K SEUS Path Tracing

import React, { useState } from 'react';
import { RTXRenderer } from './RTXRenderer';
import { RTXScene } from '../../lib/renderer/types';
import { useArchOSStore } from '../../store/archosStore';
import { Sparkles, Map, Box, Eye, Layers } from 'lucide-react';

interface SpatialCanvasProps {
  className?: string;
  defaultMode?: '2D_MAP' | '8K_RTX';
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({
  className = '',
  defaultMode = '8K_RTX'
}) => {
  const { viewMode, setViewMode, rtxSettings, updateRTXSettings } = useArchOSStore();
  const [showRTX, setShowRTX] = useState<boolean>(defaultMode === '8K_RTX');

  // UAE Sovereign Architectural Scene definition
  const uaeScene: RTXScene = {
    meshes: [],
    materials: {
      sandstone: { albedo: [0.88, 0.82, 0.72], roughness: 0.65, metallic: 0.05, emissive: [0, 0, 0] },
      goldLeaf: { albedo: [0.98, 0.84, 0.42], roughness: 0.12, metallic: 0.9, emissive: [0, 0, 0] },
      sovereignGlass: { albedo: [0.2, 0.85, 0.95], roughness: 0.04, metallic: 0.25, emissive: [0.02, 0.1, 0.18] },
      pvCanopy: { albedo: [0.12, 0.18, 0.28], roughness: 0.2, metallic: 0.75, emissive: [0.01, 0.04, 0.08] }
    },
    lights: [
      {
        type: 'directional',
        position: [12, 24, 8],
        direction: [-0.6, -1.0, -0.4],
        intensity: 2.4,
        color: [1.0, 0.95, 0.88]
      }
    ],
    camera: {
      position: [0, 4.5, 9.5],
      target: [0, 2.0, 0],
      fov: 55,
      aspect: 16 / 9
    }
  };

  return (
    <div className={`relative w-full h-full bg-[#05080e] overflow-hidden ${className}`}>
      {showRTX ? (
        <RTXRenderer
          scene={uaeScene}
          onRenderComplete={() => {
            console.log('[ArchOS] 8K SEUS path trace render converged');
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#070c16] text-[#8e8d88] p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-4 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            <Map className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            2D Geospatial Cartography Active
          </h3>
          <p className="text-xs text-[#8e8d88] max-w-md text-center mb-6">
            Interactive 7-Emirates coordinate lattice and GIS layer active. Toggle 8K SEUS Path Tracing for photorealistic architectural irradiance.
          </p>
          <button
            onClick={() => setShowRTX(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#d4ff00] text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:opacity-90 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch 8K SEUS Path Tracer</span>
          </button>
        </div>
      )}

      {/* Floating Toggle Controls */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setShowRTX(!showRTX)}
          className="px-3.5 py-1.5 rounded-lg bg-[#070c16]/90 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-mono font-bold hover:bg-[#00e5ff]/20 backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5"
        >
          {showRTX ? <Map className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{showRTX ? '◀ 2D Map View' : '▶ 8K RTX Tracing'}</span>
        </button>

        {showRTX && (
          <div className="flex items-center gap-1 bg-[#070c16]/90 border border-[#00e5ff]/30 rounded-lg p-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => updateRTXSettings({ maxSamples: rtxSettings.maxSamples + 256 })}
              className="text-[#00e5ff] hover:text-white text-[10px] font-mono font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-all"
            >
              +256 SPP
            </button>
            <button
              onClick={() =>
                updateRTXSettings({
                  resolutionScale: Math.min(1.0, Number((rtxSettings.resolutionScale + 0.25).toFixed(2)))
                })
              }
              className="text-[#d4ff00] hover:text-white text-[10px] font-mono font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-all"
            >
              +Res
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
