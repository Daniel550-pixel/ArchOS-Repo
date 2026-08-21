import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { RealBuilding, DOWNTOWN_BBOX } from '../../services/osm';
import { Building2, Info, Maximize2, Compass } from 'lucide-react';

const LAT0 = DOWNTOWN_BBOX[0];
const LON0 = DOWNTOWN_BBOX[1];

// Convert GPS lon/lat delta to metric displacement relative to origin (x: East, z: North)
const toMeters = ([lon, lat]: [number, number]): [number, number] => [
  (lon - LON0) * 111320 * Math.cos((LAT0 * Math.PI) / 180),
  (lat - LAT0) * 110540,
];

interface RealCity3DProps {
  buildings: RealBuilding[];
  selectedBuildingId?: number | null;
  onSelectBuilding?: (building: RealBuilding) => void;
}

export const RealCity3D: React.FC<RealCity3DProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding
}) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const meshes = useMemo(() => {
    return buildings.slice(0, 450).map((b) => {
      try {
        const pts = b.ring.map((coord) => {
          const [x, z] = toMeters(coord);
          return new THREE.Vector2(x, z);
        });

        const shape = new THREE.Shape(pts);
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: Math.max(10, b.height),
          bevelEnabled: false
        });

        // Rotate so extrusion points along Y-axis (UP)
        geo.rotateX(-Math.PI / 2);
        geo.computeVertexNormals();

        return {
          geo,
          key: b.id,
          raw: b,
          h: b.height,
          name: b.name || `Building #${b.id}`,
          isSkyscraper: b.height >= 120
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean) as Array<{
      geo: THREE.ExtrudeGeometry;
      key: number;
      raw: RealBuilding;
      h: number;
      name: string;
      isSkyscraper: boolean;
    }>;
  }, [buildings]);

  const activeBuilding = useMemo(() => {
    return buildings.find((b) => b.id === (hoveredId || selectedBuildingId));
  }, [buildings, hoveredId, selectedBuildingId]);

  return (
    <div className="relative w-full h-full bg-[#060b18] overflow-hidden rounded-2xl border border-[#00e5ff]/25 select-none">
      {/* 3D Canvas Viewport */}
      <Canvas
        camera={{ position: [600, 750, 900], fov: 45, near: 1, far: 8000 }}
        className="w-full h-full"
      >
        <color attach="background" args={['#040714']} />
        <fog attach="fog" args={['#040714', 1200, 4500]} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[500, 1000, 300]} intensity={1.5} color="#00e5ff" />
        <directionalLight position={[-400, 800, -300]} intensity={0.8} color="#ffd700" />
        <pointLight position={[0, 400, 0]} intensity={2.0} color="#00e5ff" distance={1500} />

        {/* Building Meshes Extruded From Real OSM Footprints */}
        {meshes.map((m) => {
          const isSelected = selectedBuildingId === m.key;
          const isHovered = hoveredId === m.key;
          const isSuperTall = m.h >= 250;

          return (
            <mesh
              key={m.key}
              geometry={m.geo}
              onClick={() => onSelectBuilding?.(m.raw)}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(m.key);
              }}
              onPointerOut={() => setHoveredId(null)}
            >
              <meshStandardMaterial
                color={
                  isSelected
                    ? '#d4ff00'
                    : isHovered
                    ? '#00e5ff'
                    : isSuperTall
                    ? '#0b2e3f'
                    : '#081729'
                }
                emissive={
                  isSelected
                    ? '#d4ff00'
                    : isSuperTall
                    ? '#00e5ff'
                    : m.isSkyscraper
                    ? '#00e5ff'
                    : '#002f3d'
                }
                emissiveIntensity={
                  isSelected
                    ? 0.9
                    : isHovered
                    ? 0.7
                    : isSuperTall
                    ? 0.65
                    : m.isSkyscraper
                    ? 0.35
                    : 0.1
                }
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          );
        })}

        {/* Tactical Coordinate Grid Floor */}
        <Grid
          position={[0, -1, 0]}
          args={[4000, 4000]}
          cellColor="#00e5ff"
          sectionColor="#d4ff00"
          fadeDistance={3500}
          cellSize={50}
          sectionSize={250}
          infiniteGrid
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={100}
          maxDistance={3500}
        />
      </Canvas>

      {/* Real City HUD Overlay */}
      <div className="absolute top-3 left-3 z-10 p-3 rounded-xl bg-[#040813]/90 border border-[#00e5ff]/30 backdrop-blur-md font-mono-tech text-xs text-white max-w-sm shadow-2xl pointer-events-none">
        <div className="flex items-center gap-2 text-[#00e5ff] font-bold uppercase mb-1">
          <Building2 size={14} />
          <span>REAL 3D URBAN TWIN (OSM LIVE)</span>
        </div>
        <div className="text-[10px] text-zinc-400">
          Source: OpenStreetMap Overpass Live API
        </div>
        <div className="text-[10px] text-[#d4ff00] font-bold mt-1">
          {meshes.length} Real Extruded Footprints · Downtown Dubai
        </div>
      </div>

      {/* Hover / Selected Inspector Pill */}
      {activeBuilding && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 p-3 rounded-xl bg-[#040813]/95 border border-[#d4ff00]/40 backdrop-blur-md font-mono-tech text-xs text-white shadow-2xl flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-bold">INSPECTED ASSET</div>
            <div className="text-sm font-bold text-white leading-tight">
              {activeBuilding.name || `Building ID: ${activeBuilding.id}`}
            </div>
            <div className="text-[10px] text-[#00e5ff] mt-0.5">
              Height: <strong className="text-[#d4ff00]">{activeBuilding.height}m</strong> · Levels: <strong>{activeBuilding.levels || Math.round(activeBuilding.height / 3.5)}</strong>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 text-[10px] font-bold shrink-0">
            VERIFIED OSM
          </div>
        </div>
      )}

      {/* Control Hint */}
      <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[9px] text-zinc-400 font-mono-tech pointer-events-none">
        Left-Click + Drag to Rotate · Scroll to Zoom · Right-Click to Pan
      </div>
    </div>
  );
};
