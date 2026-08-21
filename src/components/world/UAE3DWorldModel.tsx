import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Float,
  Text,
  Html,
  Sphere,
  Box,
  Cylinder,
  Torus,
  Ring,
  Line
} from '@react-three/drei';
import * as THREE from 'three';

export type LightingMode = 'CYBER' | 'TWILIGHT' | 'THERMAL' | 'LIDAR';
export type ActiveLayer = 'ALL' | 'SKYLINE' | 'MOBILITY' | 'SENSORS' | 'SUBSURFACE';

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
    description: 'The world’s tallest skyscraper (828m, 163 floors). Monitored live via structural health deflection sensors and dynamic wind damping telemetry.',
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
    position: [8, 0, -6],
    height: 77,
    emirate: 'Dubai',
    district: 'Trade Centre / SZR',
    description: 'Torus architectural icon engineered with stainless steel facade panels and cursive Arabic calligraphy windows. 100% parametric BIM integration.',
    stats: {
      heightM: 77,
      gfaSqm: '30,548 m²',
      energyRating: 'LEED Platinum',
      trafficDelay: '-0.8 min',
      aqi: 22,
      occupancy: 98
    }
  },
  {
    id: 'dubai-frame',
    name: 'Dubai Frame',
    category: 'CULTURAL',
    position: [14, 0, -12],
    height: 150,
    emirate: 'Dubai',
    district: 'Zabeel Park',
    description: '150m architectural portal connecting historic Deira with modern Dubai skyline. Features glass skybridge and photovoltaic gold clad facade.',
    stats: {
      heightM: 150,
      gfaSqm: '7,145 m²',
      energyRating: 'Class A',
      trafficDelay: 'Nominal',
      aqi: 26,
      occupancy: 88
    }
  },
  {
    id: 'palm-jumeirah',
    name: 'Palm Jumeirah & Atlantis',
    category: 'RESIDENTIAL',
    position: [-16, 0, 10],
    height: 93,
    emirate: 'Dubai',
    district: 'Palm Jumeirah',
    description: 'World-famous artificial archipelago with crescent breakwater, luxury residences, and marine environmental sensors.',
    stats: {
      heightM: 93,
      gfaSqm: '560,000 m²',
      energyRating: 'Green Star 4',
      trafficDelay: '+2.4 min',
      aqi: 19,
      occupancy: 92
    }
  },
  {
    id: 'business-bay-hub',
    name: 'Business Bay Financial Hub',
    category: 'COMMERCIAL',
    position: [-4, 0, -8],
    height: 240,
    emirate: 'Dubai',
    district: 'Business Bay',
    description: 'High-density commercial canal district with automated smart district cooling and urban canal taxi waterways.',
    stats: {
      heightM: 240,
      gfaSqm: '4,200,000 m²',
      energyRating: 'LEED Silver',
      trafficDelay: '+3.1 min',
      aqi: 28,
      occupancy: 89
    }
  },
  {
    id: 'dp-world-jebel-ali',
    name: 'DP World Jebel Ali Port',
    category: 'PORT',
    position: [-24, 0, 18],
    height: 65,
    emirate: 'Dubai',
    district: 'Jebel Ali Zone',
    description: 'The premier gateway port in the Middle East with autonomous automated electric gantry cranes and BoxBay container storage.',
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
    id: 'saadiyat-cultural',
    name: 'Saadiyat Cultural District',
    category: 'CULTURAL',
    position: [-20, 0, -22],
    height: 45,
    emirate: 'Abu Dhabi',
    district: 'Saadiyat Island',
    description: 'Global arts hub housing Louvre Abu Dhabi and Zayed National Museum with geodesic dome microclimate shading.',
    stats: {
      heightM: 45,
      gfaSqm: '97,000 m²',
      energyRating: 'Estidama 5 Pearl',
      trafficDelay: 'Optimal',
      aqi: 18,
      occupancy: 85
    }
  }
];

// --- PROCEDURAL 3D BUILDINGS & CITYSCAPE ---
const ProceduralCityGrid: React.FC<{
  lightingMode: LightingMode;
  layerOffset: number;
  layerOpacity: number;
}> = ({ lightingMode, layerOffset, layerOpacity }) => {
  // Generate a matrix of futuristic urban buildings
  const buildings = useMemo(() => {
    const list = [];
    const rows = 12;
    const cols = 12;
    const spacing = 2.4;

    for (let i = -rows / 2; i < rows / 2; i++) {
      for (let j = -cols / 2; j < cols / 2; j++) {
        // Skip space around central landmark (Burj Khalifa at 0,0)
        const distToCenter = Math.sqrt(i * i + j * j);
        if (distToCenter < 1.8) continue;

        // Deterministic pseudo-random height
        const seed = Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1;
        const width = 0.8 + seed * 0.7;
        const depth = 0.8 + (1 - seed) * 0.7;
        const height = 1.2 + (seed * 5.5) * (1 / (distToCenter * 0.2 + 0.5));

        const posX = i * spacing + (seed - 0.5) * 0.6;
        const posZ = j * spacing + (seed - 0.5) * 0.6;

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

  const getBuildingColors = (seed: number) => {
    if (lightingMode === 'CYBER') {
      const isCyan = seed > 0.4;
      return {
        body: isCyan ? '#071828' : '#091522',
        wireframe: isCyan ? '#00e5ff' : '#38bdf8',
        emissive: isCyan ? '#00e5ff' : '#0284c7',
        emissiveIntensity: 0.35 + seed * 0.4
      };
    } else if (lightingMode === 'TWILIGHT') {
      return {
        body: '#1e293b',
        wireframe: '#fbbf24',
        emissive: '#f59e0b',
        emissiveIntensity: 0.25 + seed * 0.5
      };
    } else if (lightingMode === 'THERMAL') {
      const tempColor = seed > 0.6 ? '#f43f5e' : seed > 0.3 ? '#eab308' : '#06b6d4';
      return {
        body: '#0f172a',
        wireframe: tempColor,
        emissive: tempColor,
        emissiveIntensity: 0.6
      };
    } else {
      // LIDAR Mode
      return {
        body: '#030712',
        wireframe: '#10b981',
        emissive: '#10b981',
        emissiveIntensity: 0.8
      };
    }
  };

  return (
    <group position={[0, layerOffset, 0]}>
      {buildings.map((b) => {
        const theme = getBuildingColors(b.seed);
        return (
          <group key={b.id} position={[b.pos[0], b.height / 2, b.pos[1]]}>
            {/* Building Volume */}
            <mesh>
              <boxGeometry args={[b.width, b.height, b.depth]} />
              <meshStandardMaterial
                color={theme.body}
                roughness={0.2}
                metalness={0.8}
                transparent
                opacity={layerOpacity * 0.85}
              />
            </mesh>

            {/* Glowing Edge Wireframe / Slices */}
            <mesh>
              <boxGeometry args={[b.width * 1.01, b.height * 1.01, b.depth * 1.01]} />
              <meshBasicMaterial
                color={theme.wireframe}
                wireframe
                transparent
                opacity={layerOpacity * 0.65}
              />
            </mesh>

            {/* Rooftop Helipad / Antenna Beacon */}
            {b.height > 4.5 && (
              <mesh position={[0, b.height / 2 + 0.15, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.05, 12]} />
                <meshStandardMaterial
                  color="#d4ff00"
                  emissive="#d4ff00"
                  emissiveIntensity={0.8}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

// --- ICONIC 3D BURJ KHALIFA LANDMARK ---
const BurjKhalifa3D: React.FC<{
  position: [number, number, number];
  lightingMode: LightingMode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ position, lightingMode, isSelected, onClick }) => {
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 4) * 1.2;
    }
  });

  const baseColor = lightingMode === 'CYBER' ? '#00e5ff' : lightingMode === 'TWILIGHT' ? '#f59e0b' : '#10b981';

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Tier 1: Base Podium */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.4, 2.2, 2.4, 6]} />
        <meshStandardMaterial
          color="#0a192f"
          roughness={0.1}
          metalness={0.9}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
        />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.42, 2.22, 2.42, 6]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.6} />
      </mesh>

      {/* Tier 2: Mid Spire Stepped Section */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.8, 1.35, 3.2, 6]} />
        <meshStandardMaterial
          color="#061224"
          roughness={0.1}
          metalness={0.95}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.7 : 0.3}
        />
      </mesh>
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.82, 1.37, 3.22, 6]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.7} />
      </mesh>

      {/* Tier 3: High Needle Tower */}
      <mesh position={[0, 7.2, 0]}>
        <cylinderGeometry args={[0.3, 0.78, 3.2, 6]} />
        <meshStandardMaterial
          color="#07182e"
          roughness={0.1}
          metalness={0.95}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
        />
      </mesh>
      <mesh position={[0, 7.2, 0]}>
        <cylinderGeometry args={[0.32, 0.8, 3.22, 6]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.8} />
      </mesh>

      {/* Tier 4: Pinnacle Spire */}
      <mesh position={[0, 10.2, 0]}>
        <coneGeometry args={[0.25, 2.8, 8]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* Flashing Aircraft Warning Beacon on Peak */}
      <pointLight
        ref={beaconRef}
        position={[0, 11.7, 0]}
        color="#ec4899"
        distance={8}
        decay={2}
      />
      <mesh position={[0, 11.65, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>

      {/* Holographic Selection Orbit Ring */}
      {isSelected && (
        <group position={[0, 5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 2.65, 32]} />
            <meshBasicMaterial color="#00e5ff" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
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
      {/* Torus Ring Shaped Volume */}
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.2, 0.45, 16, 32]} />
        <meshStandardMaterial
          color="#0f2238"
          metalness={0.9}
          roughness={0.15}
          emissive="#00e5ff"
          emissiveIntensity={isSelected ? 0.8 : 0.4}
        />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.22, 0.46, 16, 32]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.6} />
      </mesh>

      {/* Base Podium */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[3.2, 0.3, 2.2]} />
        <meshStandardMaterial color="#0a121e" emissive="#00e5ff" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
};

// --- DYNAMIC TRAFFIC & MOBILITY LIGHT TRAILS ---
const MobilityLightTrails: React.FC<{ layerOffset: number }> = ({ layerOffset }) => {
  const pointsSZR = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = -18; i <= 18; i += 0.8) {
      const z = i;
      const x = Math.sin(i * 0.18) * 4.5;
      pts.push([x, 0.05, z]);
    }
    return pts;
  }, []);

  const pointsMetro = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = -18; i <= 18; i += 0.8) {
      const z = i;
      const x = Math.sin(i * 0.18) * 4.5 + 1.2;
      pts.push([x, 0.4, z]); // Elevated viaduct
    }
    return pts;
  }, []);

  // Moving traffic pulses
  const trafficMeshRef = useRef<THREE.InstancedMesh>(null);
  const droneMeshRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (trafficMeshRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 24; i++) {
        const offset = ((i * 1.5 + t * 4) % 36) - 18;
        const x = Math.sin(offset * 0.18) * 4.5;
        dummy.position.set(x, layerOffset + 0.1, offset);
        dummy.scale.set(0.18, 0.1, 0.35);
        dummy.updateMatrix();
        trafficMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      trafficMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (droneMeshRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 8; i++) {
        const angle = (t * 0.4 + (i * Math.PI) / 4);
        const radius = 8 + (i % 3) * 3;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = layerOffset + 5 + Math.sin(t + i) * 0.5;
        dummy.position.set(x, y, z);
        dummy.scale.set(0.15, 0.15, 0.15);
        dummy.updateMatrix();
        droneMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      droneMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[0, layerOffset, 0]}>
      {/* Sheikh Zayed Road E11 Highway Corridor Ribbon */}
      <Line
        points={pointsSZR}
        color="#f59e0b"
        lineWidth={3.5}
        transparent
        opacity={0.85}
      />

      {/* Dubai Metro Red / Blue Line Elevated Viaduct */}
      <Line
        points={pointsMetro}
        color="#00e5ff"
        lineWidth={3.0}
        transparent
        opacity={0.9}
      />

      {/* Highway Moving Vehicles Light Pulses */}
      <instancedMesh ref={trafficMeshRef} args={[undefined, undefined, 24]}>
        <boxGeometry />
        <meshBasicMaterial color="#f59e0b" />
      </instancedMesh>

      {/* Autonomous Drone Skyway Vectors */}
      <instancedMesh ref={droneMeshRef} args={[undefined, undefined, 8]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </instancedMesh>
    </group>
  );
};

// --- TIERED GEOSPATIAL STACKING SLICES (As in reference images) ---
const GeospatialTierPlates: React.FC<{
  activeLayer: ActiveLayer;
  sliceSeparation: number;
}> = ({ activeLayer, sliceSeparation }) => {
  return (
    <group>
      {/* Plate 1: Subsurface Geotechnical & Infrastructure Bedrock (Lowest) */}
      <group position={[0, -2.4 * sliceSeparation, 0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[26, 0.2, 26]} />
          <meshStandardMaterial
            color="#080e1a"
            roughness={0.9}
            metalness={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Wireframe Grid */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[26.1, 0.05, 26.1]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Plate 2: Environmental & Utility Sensor Network */}
      <group position={[0, -1.2 * sliceSeparation, 0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[26, 0.1, 26]} />
          <meshStandardMaterial
            color="#071a1c"
            roughness={0.7}
            metalness={0.3}
            transparent
            opacity={0.65}
          />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[26.1, 0.02, 26.1]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Plate 3: Urban Surface & Transportation Grid */}
      <group position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[26, 0.15, 26]} />
          <meshStandardMaterial
            color="#050a14"
            roughness={0.4}
            metalness={0.6}
            transparent
            opacity={0.95}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[26.05, 0.05, 26.05]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
};

// --- INTERACTIVE 3D POI PIN BEACONS ---
const POIPinBeacon: React.FC<{
  poi: LandmarkPOI;
  isSelected: boolean;
  onClick: () => void;
}> = ({ poi, isSelected, onClick }) => {
  const pinColor = isSelected ? '#d4ff00' : '#00e5ff';

  return (
    <group position={poi.position}>
      {/* Vertical Laser Light Line from ground */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 3.6, 8]} />
        <meshBasicMaterial color={pinColor} transparent opacity={0.8} />
      </mesh>

      {/* Pulsing Target Orb Icon */}
      <mesh position={[0, 3.7, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={pinColor}
          emissive={pinColor}
          emissiveIntensity={isSelected ? 1.5 : 0.8}
        />
      </mesh>

      {/* 3D Floating Name Label Tag */}
      <Html position={[0, 4.4, 0]} center distanceFactor={24}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`cursor-pointer px-2 py-0.5 rounded-full font-mono text-[9px] font-bold whitespace-nowrap transition-all flex items-center gap-1 backdrop-blur-md shadow-xl ${
            isSelected
              ? 'bg-[#d4ff00] text-black border border-white shadow-[0_0_12px_#d4ff00]'
              : 'bg-[#070c16]/90 text-[#00e5ff] border border-[#00e5ff]/50 hover:bg-[#00e5ff] hover:text-black'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>{poi.name}</span>
        </div>
      </Html>
    </group>
  );
};

// --- MAIN 3D CANVAS COMPONENT ---
interface UAE3DWorldModelProps {
  lightingMode: LightingMode;
  activeLayer: ActiveLayer;
  sliceSeparation: number; // 0.0 to 1.5 (separation of geospatial tiers)
  selectedLandmarkId: string;
  onSelectLandmark: (landmark: LandmarkPOI) => void;
  cameraPreset: 'COMMAND' | 'ORBIT' | 'NADIR' | 'STREET';
}

export const UAE3DWorldModel: React.FC<UAE3DWorldModelProps> = ({
  lightingMode,
  activeLayer,
  sliceSeparation,
  selectedLandmarkId,
  onSelectLandmark,
  cameraPreset
}) => {
  const controlsRef = useRef<any>(null);

  // Camera settings based on preset
  const cameraPos: [number, number, number] = useMemo(() => {
    switch (cameraPreset) {
      case 'COMMAND':
        return [22, 24, 26];
      case 'ORBIT':
        return [14, 12, 18];
      case 'NADIR':
        return [0, 36, 1]; // top down
      case 'STREET':
        return [6, 4, 8];
      default:
        return [20, 22, 24];
    }
  }, [cameraPreset]);

  return (
    <div className="relative w-full h-full bg-[#03060d]">
      <Canvas
        camera={{ position: cameraPos, fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <PerspectiveCamera makeDefault position={cameraPos} fov={42} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
          minDistance={6}
          maxDistance={65}
          target={[0, 1, 0]}
        />

        {/* Ambient & Directional Lighting Matrix */}
        <ambientLight intensity={lightingMode === 'TWILIGHT' ? 0.8 : 0.4} />
        <directionalLight
          position={[15, 25, 15]}
          intensity={lightingMode === 'TWILIGHT' ? 1.6 : 1.0}
          color={lightingMode === 'TWILIGHT' ? '#fed7aa' : '#ffffff'}
        />
        <pointLight position={[-10, 15, -10]} intensity={0.6} color="#00e5ff" />

        {/* Floating Tiered Diamond Slices */}
        <GeospatialTierPlates
          activeLayer={activeLayer}
          sliceSeparation={sliceSeparation}
        />

        {/* Procedural High-Density City Skyline */}
        {(activeLayer === 'ALL' || activeLayer === 'SKYLINE') && (
          <ProceduralCityGrid
            lightingMode={lightingMode}
            layerOffset={0}
            layerOpacity={1.0}
          />
        )}

        {/* Dynamic Transport & Drone Mobility Grid */}
        {(activeLayer === 'ALL' || activeLayer === 'MOBILITY') && (
          <MobilityLightTrails layerOffset={0} />
        )}

        {/* 3D Iconic Key Landmarks */}
        <BurjKhalifa3D
          position={[0, 0, 0]}
          lightingMode={lightingMode}
          isSelected={selectedLandmarkId === 'burj-khalifa'}
          onClick={() => onSelectLandmark(UAE_LANDMARKS[0])}
        />

        <MuseumOfTheFuture3D
          position={[7, 0, -5]}
          isSelected={selectedLandmarkId === 'museum-of-future'}
          onClick={() => onSelectLandmark(UAE_LANDMARKS[1])}
        />

        {/* Interactive POI Beacon Pins */}
        {UAE_LANDMARKS.map((poi) => (
          <POIPinBeacon
            key={poi.id}
            poi={poi}
            isSelected={selectedLandmarkId === poi.id}
            onClick={() => onSelectLandmark(poi)}
          />
        ))}
      </Canvas>
    </div>
  );
};
