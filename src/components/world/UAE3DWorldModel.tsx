// ArchOS UAE 3D World Model
// Continuous digital twin environment with obsidian architecture,
// real-time spatial intelligence beacons, correlation vectors, and dynamic camera control.

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Line
} from '@react-three/drei';
import * as THREE from 'three';
import { UAEIntelligenceEvent } from '../../types/continuousIntelligence';

export type LightingMode = 'CYBER' | 'TWILIGHT' | 'THERMAL' | 'LIDAR';
export type ActiveLayer = 'ALL' | 'SKYLINE' | 'MOBILITY' | 'SENSORS' | 'SUBSURFACE';
export type OperatingMode = 'WORLD' | 'INTELLIGENCE' | 'SIMULATION' | 'GOD_EYE';

export interface LandmarkPOI {
  id: string;
  name: string;
  category: 'CULTURAL' | 'COMMERCIAL' | 'INFRASTRUCTURE' | 'RESIDENTIAL' | 'PORT';
  position: [number, number, number];
  height: number;
  emirate: string;
  district: string;
  description: string;
  stats: {
    heightM: number;
    gfaSqm: string;
    energyRating: string;
    trafficDelay: string;
    aqi: number;
    occupancy: number;
  };
}

export const UAE_LANDMARKS: LandmarkPOI[] = [
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa',
    category: 'COMMERCIAL',
    position: [0, 0, 0],
    height: 828,
    emirate: 'Dubai',
    district: 'Downtown Dubai',
    description: 'Autonomous structural monitoring with dynamic wind damping and building telemetry.',
    stats: {
      heightM: 828,
      gfaSqm: '334,000 m²',
      energyRating: 'LEED Gold',
      trafficDelay: '+1.2 min',
      aqi: 24,
      occupancy: 94
    }
  },
  {
    id: 'museum-of-future',
    name: 'Museum of the Future',
    category: 'CULTURAL',
    position: [7, 0, -5],
    height: 77,
    emirate: 'Dubai',
    district: 'Trade Centre / SZR',
    description: 'Parametric BIM stainless steel torus architecture with integrated solar energy.',
    stats: {
      heightM: 77,
      gfaSqm: '30,548 m²',
      energyRating: 'LEED Platinum',
      trafficDelay: 'Nominal',
      aqi: 22,
      occupancy: 98
    }
  },
  {
    id: 'dp-world-jebel-ali',
    name: 'DP World Jebel Ali Port',
    category: 'PORT',
    position: [-24, 0, 18],
    height: 65,
    emirate: 'Dubai',
    district: 'Jebel Ali Freezone',
    description: 'Deepwater logistics hub with autonomous BoxBay container storage.',
    stats: {
      heightM: 65,
      gfaSqm: '14,000,000 m²',
      energyRating: 'ISO 50001',
      trafficDelay: 'Smooth',
      aqi: 31,
      occupancy: 96
    }
  },
  {
    id: 'barakah-energy-plant',
    name: 'Barakah Nuclear Clean Power Complex',
    category: 'INFRASTRUCTURE',
    position: [-18.5, 0, -16.0],
    height: 85,
    emirate: 'Abu Dhabi',
    district: 'Al Dhafra Region',
    description: 'Four APR-1400 nuclear reactors supplying 5,600 MW zero-carbon baseload electricity.',
    stats: {
      heightM: 85,
      gfaSqm: '12,000,000 m²',
      energyRating: 'Zero Carbon Baseload',
      trafficDelay: 'Dedicated Corridor',
      aqi: 14,
      occupancy: 99
    }
  },
  {
    id: 'masdar-city-nexus',
    name: 'Masdar City Eco-Nexus',
    category: 'COMMERCIAL',
    position: [-14.0, 0, -12.0],
    height: 48,
    emirate: 'Abu Dhabi',
    district: 'Masdar City',
    description: 'Net-negative carbon innovation hub with BIPV facades and autonomous transit.',
    stats: {
      heightM: 48,
      gfaSqm: '72,000 m²',
      energyRating: 'Estidama 5 Pearl',
      trafficDelay: 'Zero-Emission',
      aqi: 16,
      occupancy: 97
    }
  },
  {
    id: 'fujairah-strategic-gateway',
    name: 'Fujairah Energy Gateway',
    category: 'PORT',
    position: [22.0, 0, 8.0],
    height: 55,
    emirate: 'Fujairah',
    district: 'Port of Fujairah',
    description: 'Direct Indian Ocean crude oil export pipeline and global marine bunkering anchorage.',
    stats: {
      heightM: 55,
      gfaSqm: '8,400,000 m²',
      energyRating: 'Strategic Sovereign',
      trafficDelay: 'Smooth Anchorage',
      aqi: 20,
      occupancy: 92
    }
  },
  {
    id: 'saqr-port-bulk',
    name: 'Saqr Port Mineral Terminal',
    category: 'PORT',
    position: [18.0, 0, -18.0],
    height: 60,
    emirate: 'Ras Al Khaimah',
    district: 'Saqr Port Industrial Zone',
    description: 'Middle East largest bulk export port with 18.0m deepwater Capesize berths.',
    stats: {
      heightM: 60,
      gfaSqm: '6,200,000 m²',
      energyRating: 'Bulk ISO',
      trafficDelay: 'Nominal',
      aqi: 25,
      occupancy: 91
    }
  }
];

// --- PROCEDURAL REFINED CITY GRID ---
const ProceduralCityGrid: React.FC<{ layerOpacity: number }> = ({ layerOpacity }) => {
  const buildings = useMemo(() => {
    const list = [];
    const rows = 14;
    const cols = 14;
    const spacing = 2.4;

    for (let i = -rows / 2; i < rows / 2; i++) {
      for (let j = -cols / 2; j < cols / 2; j++) {
        const distToCenter = Math.sqrt(i * i + j * j);
        if (distToCenter < 1.8) continue;

        const seed = Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1;
        const width = 0.75 + seed * 0.6;
        const depth = 0.75 + (1 - seed) * 0.6;
        const height = 1.0 + (seed * 5.0) * (1 / (distToCenter * 0.22 + 0.5));

        const posX = i * spacing + (seed - 0.5) * 0.5;
        const posZ = j * spacing + (seed - 0.5) * 0.5;

        list.push({
          id: `bld-${i}-${j}`,
          pos: [posX, posZ] as [number, number],
          width,
          depth,
          height,
          seed
        });
      }
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {buildings.map((b) => (
        <group key={b.id} position={[b.pos[0], b.height / 2, b.pos[1]]}>
          {/* Main Obsidian Monolith */}
          <mesh>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial
              color="#040608"
              roughness={0.15}
              metalness={0.9}
              transparent
              opacity={layerOpacity * 0.9}
            />
          </mesh>

          {/* Minimalist Silver Wireframe */}
          <mesh>
            <boxGeometry args={[b.width * 1.002, b.height * 1.002, b.depth * 1.002]} />
            <meshBasicMaterial
              color="#ffffff"
              wireframe
              transparent
              opacity={layerOpacity * 0.12}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// --- ICONIC 3D BURJ KHALIFA ---
const BurjKhalifa3D: React.FC<{
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ position, isSelected, onClick }) => {
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.intensity = 0.8 + Math.sin(clock.getElapsedTime() * 3) * 0.4;
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Tier 1: Base */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.3, 2.0, 2.4, 6]} />
        <meshStandardMaterial
          color="#06090e"
          roughness={0.1}
          metalness={0.95}
          emissive="#dce8ff"
          emissiveIntensity={isSelected ? 0.4 : 0.08}
        />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.31, 2.01, 2.41, 6]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.25} />
      </mesh>

      {/* Tier 2: Mid Spire */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.75, 1.25, 3.2, 6]} />
        <meshStandardMaterial
          color="#06090e"
          roughness={0.1}
          metalness={0.95}
          emissive="#dce8ff"
          emissiveIntensity={isSelected ? 0.5 : 0.1}
        />
      </mesh>
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.76, 1.26, 3.21, 6]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Tier 3: Needle Tower */}
      <mesh position={[0, 7.2, 0]}>
        <cylinderGeometry args={[0.25, 0.72, 3.2, 6]} />
        <meshStandardMaterial
          color="#080c14"
          roughness={0.1}
          metalness={0.95}
          emissive="#dce8ff"
          emissiveIntensity={isSelected ? 0.6 : 0.15}
        />
      </mesh>

      {/* Tier 4: Pinnacle Needle */}
      <mesh position={[0, 10.2, 0]}>
        <coneGeometry args={[0.2, 2.8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={isSelected ? 0.9 : 0.4}
        />
      </mesh>

      {/* Spire Beacon Light */}
      <pointLight
        ref={beaconRef}
        position={[0, 11.7, 0]}
        color="#dce8ff"
        distance={8}
        decay={2}
      />
    </group>
  );
};

// --- ICONIC 3D MUSEUM OF THE FUTURE ---
const MuseumOfTheFuture3D: React.FC<{
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ position, isSelected, onClick }) => {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.2, 0.45, 16, 32]} />
        <meshStandardMaterial
          color="#080c14"
          metalness={0.95}
          roughness={0.1}
          emissive="#dce8ff"
          emissiveIntensity={isSelected ? 0.5 : 0.1}
        />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.21, 0.455, 16, 32]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

// --- DYNAMIC GEOGRAPHIC INTELLIGENCE EVENT BEACON ---
const SpatialIntelligenceEventBeacon: React.FC<{
  event: UAEIntelligenceEvent;
  isSelected: boolean;
  onClick: () => void;
}> = ({ event, isSelected, onClick }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const isConflict = event.verificationState === 'CONFLICTING';

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1.0 + ((clock.getElapsedTime() * 1.5) % 2.5);
      ringRef.current.scale.set(s, s, s);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.8 - (s - 1.0) / 2.5);
      }
    }
  });

  const baseColor = isConflict ? '#f59e0b' : '#38bdf8';

  return (
    <group position={event.coordinates}>
      {/* Expanding Shockwave Ring for Active / Selected Events */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.6, 0.72, 32]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical Luminescence Laser Needle */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.6, 6]} />
        <meshBasicMaterial color={baseColor} transparent opacity={isSelected ? 0.8 : 0.4} />
      </mesh>

      {/* Target Marker Sphere */}
      <mesh
        position={[0, 3.7, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={baseColor}
          emissiveIntensity={isSelected ? 1.4 : 0.8}
        />
      </mesh>

      {/* Floating Spatial Tag */}
      <Html position={[0, 4.3, 0]} center distanceFactor={28}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`cursor-pointer px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase backdrop-blur-md whitespace-nowrap shadow-xl ${
            isSelected
              ? 'bg-white text-black border-white font-bold ring-2 ring-white/30'
              : isConflict
              ? 'bg-amber-950/80 text-amber-200 border-amber-500/50 hover:bg-amber-900'
              : 'bg-[#0a0c10]/85 text-cyan-200 border-cyan-500/40 hover:bg-cyan-950/90'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSelected ? 'bg-black' : isConflict ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
            }`}
          />
          <span>{event.entityName}</span>
        </button>
      </Html>
    </group>
  );
};

// --- INTERMODAL CORRELATION 3D ARCS ---
const IntermodalCorrelationArcs: React.FC<{
  events: UAEIntelligenceEvent[];
}> = ({ events }) => {
  const arcCurves = useMemo(() => {
    // Generate curved line vectors connecting correlated nodes
    const curves: [number, number, number][][] = [];

    for (let i = 0; i < events.length; i++) {
      const src = events[i];
      if (src.relatedEventIds && src.relatedEventIds.length > 0) {
        for (const relId of src.relatedEventIds) {
          const tgt = events.find(e => e.id === relId);
          if (tgt) {
            const start = new THREE.Vector3(...src.coordinates);
            const end = new THREE.Vector3(...tgt.coordinates);
            const mid = new THREE.Vector3()
              .addVectors(start, end)
              .multiplyScalar(0.5)
              .add(new THREE.Vector3(0, 3.5, 0)); // Elevation arc

            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const points = curve.getPoints(24).map(p => [p.x, p.y, p.z] as [number, number, number]);
            curves.push(points);
          }
        }
      }
    }

    return curves;
  }, [events]);

  return (
    <group>
      {arcCurves.map((pts, idx) => (
        <Line
          key={`arc-${idx}`}
          points={pts}
          color="#38bdf8"
          lineWidth={1.2}
          transparent
          opacity={0.35}
        />
      ))}
    </group>
  );
};

// --- TERRAIN / GEOSPATIAL PLATES ---
const GeospatialTierPlates: React.FC = () => {
  return (
    <group>
      {/* UAE Geographic Monolith Surface */}
      <group position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[48, 0.1, 48]} />
          <meshStandardMaterial color="#020305" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[48.02, 0.02, 48.02]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.06} />
        </mesh>
      </group>
    </group>
  );
};

// --- CAMERA CONTROLLER WITH TARGET INTERPOLATION ---
const CameraTargetController: React.FC<{
  targetCoords: [number, number, number] | null;
}> = ({ targetCoords }) => {
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (controlsRef.current && targetCoords) {
      const targetVec = new THREE.Vector3(...targetCoords);
      controlsRef.current.target.lerp(targetVec, 0.05);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={6}
      maxDistance={90}
      target={[0, 1, 0]}
    />
  );
};

// --- MAIN 3D WORLD MODEL EXPORT ---
export interface UAE3DWorldModelProps {
  events?: UAEIntelligenceEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: UAEIntelligenceEvent) => void;
  selectedLandmarkId?: string | null;
  onSelectLandmark?: (landmark: LandmarkPOI) => void;
  operatingMode?: OperatingMode;
  targetCoords?: [number, number, number] | null;
  lightingMode?: LightingMode;
  activeLayer?: ActiveLayer;
  sliceSeparation?: number;
  cameraPreset?: 'COMMAND' | 'ORBIT' | 'NADIR' | 'STREET';
}

export const UAE3DWorldModel: React.FC<UAE3DWorldModelProps> = ({
  events = [],
  selectedEventId = null,
  onSelectEvent = () => {},
  selectedLandmarkId = null,
  onSelectLandmark = () => {},
  operatingMode = 'WORLD',
  targetCoords = null
}) => {
  const cameraPos: [number, number, number] = useMemo(() => {
    if (operatingMode === 'GOD_EYE') {
      return [0, 48, 14];
    }
    if (operatingMode === 'INTELLIGENCE') {
      return [18, 16, 22];
    }
    return [24, 22, 28];
  }, [operatingMode]);

  return (
    <div className="relative w-full h-full bg-[#000000]">
      <Canvas
        camera={{ position: cameraPos, fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#000000', 1);
          scene.fog = new THREE.FogExp2('#000000', 0.012);
        }}
      >
        <PerspectiveCamera makeDefault position={cameraPos} fov={40} />
        <CameraTargetController targetCoords={targetCoords} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[20, 40, 20]} intensity={1.0} color="#ffffff" />
        <pointLight position={[-15, 25, -15]} intensity={0.4} color="#dce8ff" />

        {/* Base Geography Plates */}
        <GeospatialTierPlates />

        {/* City Skyline */}
        <ProceduralCityGrid layerOpacity={1.0} />

        {/* Iconic Landmarks */}
        <BurjKhalifa3D
          position={[0, 0, 0]}
          isSelected={selectedLandmarkId === 'burj-khalifa'}
          onClick={() => onSelectLandmark(UAE_LANDMARKS[0])}
        />

        <MuseumOfTheFuture3D
          position={[7, 0, -5]}
          isSelected={selectedLandmarkId === 'museum-of-future'}
          onClick={() => onSelectLandmark(UAE_LANDMARKS[1])}
        />

        {/* Live Spatial Intelligence Events Beacons */}
        {events.map((evt) => (
          <SpatialIntelligenceEventBeacon
            key={evt.id}
            event={evt}
            isSelected={selectedEventId === evt.id}
            onClick={() => onSelectEvent(evt)}
          />
        ))}

        {/* 3D Intermodal Correlation Arcs (Active in Intelligence & World modes) */}
        <IntermodalCorrelationArcs events={events} />
      </Canvas>
    </div>
  );
};

export default UAE3DWorldModel;
