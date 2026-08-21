import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline } from 'react-leaflet';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { GlassPanel } from './ui';
import {
  fetchPlanningLayers,
  fetchRealBuildings,
  fetchClimate,
  fetchUAEStats,
  PlanningFeature,
  RealBuilding,
  BBOX,
} from './services';
import { Layers, Thermometer, DollarSign, Box } from 'lucide-react';

const STYLE: Record<string, { c: string; o: number }> = {
  residential: { c: '#00e5ff', o: 0.15 },
  commercial: { c: '#ffd700', o: 0.2 },
  industrial: { c: '#ff6b35', o: 0.2 },
  park: { c: '#00ff88', o: 0.2 },
  road: { c: '#8a94a6', o: 0.8 },
  rail: { c: '#ffd700', o: 0.9 },
};

export const RealCity3D: React.FC<{ buildings: RealBuilding[] }> = ({ buildings }) => {
  const lat0 = BBOX[0];
  const lon0 = BBOX[1];

  const meshes = useMemo(() => {
    return buildings.slice(0, 400).map((b) => {
      const pts = b.ring.map(
        ([lon, lat]) =>
          new THREE.Vector2(
            (lon - lon0) * 111320 * Math.cos((lat0 * Math.PI) / 180),
            (lat - lat0) * 110540
          )
      );

      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
        depth: Math.max(10, b.height),
        bevelEnabled: false,
      });
      g.rotateX(-Math.PI / 2);
      return { g, id: b.id, h: b.height, name: b.name };
    });
  }, [buildings, lat0, lon0]);

  return (
    <Canvas camera={{ position: [400, 500, 700], fov: 50 }}>
      <color attach="background" args={['#0a0e1a']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[300, 600, 200]} intensity={1.2} color="#00e5ff" />
      {meshes.map((m) => (
        <mesh key={m.id} geometry={m.g}>
          <meshStandardMaterial
            color="#0a2a33"
            emissive="#00e5ff"
            emissiveIntensity={m.h > 100 ? 0.5 : 0.15}
          />
        </mesh>
      ))}
      <Grid
        args={[2000, 2000]}
        cellColor="#00e5ff"
        sectionColor="#ffd700"
        fadeDistance={2500}
        infiniteGrid
      />
      <OrbitControls />
    </Canvas>
  );
};

export const PlanningMap: React.FC = () => {
  const [feats, setFeats] = useState<PlanningFeature[]>([]);
  const [blds, setBlds] = useState<RealBuilding[]>([]);
  const [climate, setClimate] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [view, setView] = useState<'2D' | '3D'>('2D');
  const [visible, setVisible] = useState<Record<string, boolean>>({
    residential: true,
    commercial: true,
    industrial: true,
    park: true,
    road: true,
    rail: true,
  });

  useEffect(() => {
    fetchPlanningLayers().then(setFeats).catch(console.error);
    fetchRealBuildings().then(setBlds).catch(console.error);
    fetchClimate().then(setClimate).catch(console.error);
    fetchUAEStats().then(setStats).catch(console.error);
  }, []);

  const shown = feats.filter((f) => visible[f.category] !== false).slice(0, 600);

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-8 h-full flex flex-col">
        <GlassPanel
          title="GROUNDSCAN — REAL OSM (DOWNTOWN DUBAI)"
          icon={<Layers size={16} />}
          badge={view === '2D' ? '2D GIS LAYERS' : '3D EXTRUDED MESH'}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setView('2D')}
                className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                  view === '2D' ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10' : 'border-white/10 text-gray-400'
                }`}
              >
                2D GIS MAP
              </button>
              <button
                onClick={() => setView('3D')}
                className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                  view === '3D' ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10' : 'border-white/10 text-gray-400'
                }`}
              >
                3D CITY EXTENSION
              </button>
            </div>

            {view === '2D' && (
              <div className="flex gap-1">
                {Object.keys(STYLE).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setVisible((v) => ({ ...v, [cat]: !v[cat] }))}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                      visible[cat] !== false
                        ? 'border-[#00e5ff]/50 text-[#00e5ff] bg-[#00e5ff]/10'
                        : 'border-white/10 text-gray-500'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[380px] rounded-lg overflow-hidden border border-[#00e5ff]/20 bg-[#080d19]">
            {view === '2D' ? (
              <MapContainer
                center={[25.195, 55.273]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {shown.map((f) =>
                  f.kind === 'polygon' ? (
                    <Polygon
                      key={f.id}
                      positions={f.ring}
                      pathOptions={{
                        color: STYLE[f.category]?.c || '#00e5ff',
                        weight: 1,
                        fillColor: STYLE[f.category]?.c || '#00e5ff',
                        fillOpacity: STYLE[f.category]?.o || 0.2,
                      }}
                    />
                  ) : (
                    <Polyline
                      key={f.id}
                      positions={f.ring}
                      pathOptions={{
                        color: STYLE[f.category]?.c || '#00e5ff',
                        weight: f.category === 'rail' ? 2 : 1.5,
                        dashArray: f.category === 'rail' ? '6 4' : undefined,
                      }}
                    />
                  )
                )}
              </MapContainer>
            ) : (
              <RealCity3D buildings={blds} />
            )}
          </div>
        </GlassPanel>
      </div>

      <div className="col-span-4 space-y-4">
        <GlassPanel title="LIVE CLIMATE — OPEN-METEO" icon={<Thermometer size={16} />}>
          {climate ? (
            <div className="grid grid-cols-3 gap-2 text-center font-mono-tech">
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-xl text-[#00e5ff] font-bold">{climate.temperature_2m}°C</div>
                <div className="text-[9px] text-gray-400">TEMP</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-xl text-[#ffd700] font-bold">{climate.relative_humidity_2m}%</div>
                <div className="text-[9px] text-gray-400">HUMIDITY</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-xl text-[#10b981] font-bold">{climate.wind_speed_10m}</div>
                <div className="text-[9px] text-gray-400">KM/H WIND</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Fetching live meteorological feeds…</div>
          )}
        </GlassPanel>

        <GlassPanel title="UAE MACRO — WORLD BANK" icon={<DollarSign size={16} />}>
          {stats ? (
            <div className="grid grid-cols-2 gap-2 text-center font-mono-tech">
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-xl text-[#00e5ff] font-bold">${stats.gdpB}B</div>
                <div className="text-[9px] text-gray-400">GDP (2023)</div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-xl text-[#ffd700] font-bold">{stats.popM}M</div>
                <div className="text-[9px] text-gray-400">POPULATION</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Fetching macroeconomic records…</div>
          )}
        </GlassPanel>

        <GlassPanel title="DUBAI PULSE ADAPTER STATUS" icon={<Box size={16} />}>
          <div className="text-xs space-y-2 font-mono-tech">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400">OAUTH2 ENDPOINT:</span>
              <span className="text-[#10b981]">READY</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400">FALLBACK MODE:</span>
              <span className="text-[#00e5ff]">OPEN DATA ACTIVE</span>
            </div>
            <div className="p-2 rounded bg-white/5 text-[9px] text-gray-400 border border-white/10">
              Registered tenant queries automatically stream through official Dubai Pulse gateway.
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
