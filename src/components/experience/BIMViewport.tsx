import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Float } from '@react-three/drei';
import * as THREE from 'three';

interface HolographicBuildingProps {
  width: number;
  depth: number;
  floors: number;
  height: number;
  structuralSystem?: string;
  facadeType?: string;
}

// Holographic Building Component
const HolographicBuilding: React.FC<HolographicBuildingProps> = ({
  width,
  depth,
  floors,
  height,
  structuralSystem,
  facadeType
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const totalHeight = Math.max(floors * height, 4);
  const safeWidth = Math.max(width, 5);
  const safeDepth = Math.max(depth, 5);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = -state.clock.getElapsedTime() * 0.04;
    }
  });

  const facadeColor =
    facadeType === 'green_wall'
      ? '#00ff88'
      : facadeType === 'masonry'
      ? '#ff6b35'
      : facadeType === 'precast'
      ? '#d4ff00'
      : '#00e5ff';

  const structuralColor =
    structuralSystem === 'steel'
      ? '#00e5ff'
      : structuralSystem === 'timber'
      ? '#ffd700'
      : structuralSystem === 'composite'
      ? '#ff006e'
      : '#ffd700';

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
      {/* Outer Envelope / Curtain Wall */}
      <mesh ref={meshRef} position={[0, totalHeight / 2, 0]}>
        <boxGeometry args={[safeWidth, totalHeight, safeDepth]} />
        <meshStandardMaterial
          color={facadeColor}
          wireframe
          transparent
          opacity={0.75}
          emissive={facadeColor}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Internal Structural Core */}
      <mesh ref={coreRef} position={[0, totalHeight / 2, 0]}>
        <boxGeometry args={[safeWidth * 0.35, totalHeight, safeDepth * 0.35]} />
        <meshStandardMaterial
          color={structuralColor}
          wireframe
          transparent
          opacity={0.55}
          emissive={structuralColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Floor Plate Wireframes */}
      {Array.from({ length: Math.min(floors, 25) }).map((_, i) => (
        <mesh key={i} position={[0, (i + 0.5) * height, 0]}>
          <boxGeometry args={[safeWidth * 0.95, 0.2, safeDepth * 0.95]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.3} />
        </mesh>
      ))}
    </Float>
  );
};

export interface BIMViewportParams {
  width: number;
  depth: number;
  floors: number;
  height: number;
  structuralSystem?: string;
  facadeType?: string;
}

export const BIMViewport: React.FC<{ params: BIMViewportParams }> = ({ params }) => {
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-[#00e5ff]/30 bg-[#070d18] relative">
      <Canvas camera={{ position: [35, 25, 35], fov: 45 }}>
        <color attach="background" args={['#05080e']} />
        <ambientLight intensity={0.6} />
        <pointLight position={[20, 30, 20]} intensity={1.2} color="#00e5ff" />
        <pointLight position={[-20, -10, -20]} intensity={0.8} color="#ffd700" />

        <HolographicBuilding
          width={params.width}
          depth={params.depth}
          floors={params.floors}
          height={params.height}
          structuralSystem={params.structuralSystem}
          facadeType={params.facadeType}
        />

        <Grid
          args={[80, 80]}
          cellSize={2}
          cellThickness={0.5}
          cellColor="#00e5ff"
          sectionSize={8}
          sectionThickness={1}
          sectionColor="#ffd700"
          fadeDistance={90}
          infiniteGrid
          position={[0, -0.01, 0]}
        />
        <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>

      {/* Floating HUD Details */}
      <div className="absolute top-2 left-2 z-10 bg-[#09101c]/80 backdrop-blur-md px-2.5 py-1 rounded border border-[#00e5ff]/30 text-[10px] font-mono-tech text-[#00e5ff] flex items-center gap-2 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
        <span>HOLOGRAPHIC BIM VIEWPORT · 60 FPS</span>
      </div>
    </div>
  );
};
