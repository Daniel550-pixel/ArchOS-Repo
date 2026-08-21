import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { SystemState } from '../../../types';
import { Sparkles, Play, Pause, Zap, Eye, Sliders, ShieldCheck, Sun, Compass } from 'lucide-react';

export interface SatelliteNode {
  id: string;
  name: string;
  category: 'EMIRATE' | 'AI_SUBSYSTEM';
  color: string;
  emissiveColor: string;
  radius: number; // base orbit radius
  speed: number; // orbital rotation speed multiplier
  inclination: number; // tilt of orbit plane in radians
  phase: number; // starting angle
  size: number; // sphere radius
  description: string;
  metricLabel: string;
  metricValue: string;
}

export const SATELLITE_ORBS: SatelliteNode[] = [
  {
    id: 'dubai',
    name: 'Dubai',
    category: 'EMIRATE',
    color: '#00e5ff',
    emissiveColor: '#00e5ff',
    radius: 4.6,
    speed: 0.42,
    inclination: 0.28,
    phase: 0.0,
    size: 0.38,
    description: 'Autonomous Trade & Metro Corridor Telemetry',
    metricLabel: 'Throughput',
    metricValue: '1.24 T AED'
  },
  {
    id: 'abu-dhabi',
    name: 'Abu Dhabi',
    category: 'EMIRATE',
    color: '#38bdf8',
    emissiveColor: '#0284c7',
    radius: 5.6,
    speed: 0.32,
    inclination: -0.35,
    phase: 1.15,
    size: 0.42,
    description: 'Sovereign Capital & Energy Grid Command',
    metricLabel: 'Clean Energy',
    metricValue: '68.4%'
  },
  {
    id: 'sharjah',
    name: 'Sharjah',
    category: 'EMIRATE',
    color: '#00e5ff',
    emissiveColor: '#0096c7',
    radius: 4.0,
    speed: 0.48,
    inclination: 0.45,
    phase: 2.1,
    size: 0.32,
    description: 'Logistics Hub & Academic Research Mesh',
    metricLabel: 'Air Freight',
    metricValue: '940k T'
  },
  {
    id: 'ajman',
    name: 'Ajman',
    category: 'EMIRATE',
    color: '#22d3ee',
    emissiveColor: '#0891b2',
    radius: 3.4,
    speed: 0.62,
    inclination: -0.22,
    phase: 3.05,
    size: 0.28,
    description: 'Industrial Coastal Telemetry Node',
    metricLabel: 'Grid Load',
    metricValue: '99.4%'
  },
  {
    id: 'umm-al-quwain',
    name: 'Umm Al Quwain',
    category: 'EMIRATE',
    color: '#2dd4bf',
    emissiveColor: '#0d9488',
    radius: 6.2,
    speed: 0.24,
    inclination: 0.38,
    phase: 3.95,
    size: 0.3,
    description: 'Blue Economy & Desalination Networks',
    metricLabel: 'Reserve',
    metricValue: '120M Gal'
  },
  {
    id: 'ras-al-khaimah',
    name: 'Ras Al Khaimah',
    category: 'EMIRATE',
    color: '#a3e635',
    emissiveColor: '#65a30d',
    radius: 5.0,
    speed: 0.36,
    inclination: -0.48,
    phase: 4.85,
    size: 0.34,
    description: 'Manufacturing & Mineral Logistics Hub',
    metricLabel: 'Output',
    metricValue: '+14.2%'
  },
  {
    id: 'fujairah',
    name: 'Fujairah',
    category: 'EMIRATE',
    color: '#818cf8',
    emissiveColor: '#4f46e5',
    radius: 4.2,
    speed: 0.44,
    inclination: 0.62,
    phase: 5.75,
    size: 0.33,
    description: 'Deepwater Bunkering & Maritime Pipeline',
    metricLabel: 'Port Flow',
    metricValue: '4.8M BBL'
  },
  {
    id: 'subsystem-neural',
    name: 'Neural Engine',
    category: 'AI_SUBSYSTEM',
    color: '#c084fc',
    emissiveColor: '#9333ea',
    radius: 2.3,
    speed: 0.85,
    inclination: 1.12,
    phase: 0.5,
    size: 0.24,
    description: 'Multimodal Cognitive Matrix & Real-time Reasoning',
    metricLabel: 'Inference',
    metricValue: '14.2ms'
  },
  {
    id: 'subsystem-security',
    name: 'Zero-Trust Aegis',
    category: 'AI_SUBSYSTEM',
    color: '#f59e0b',
    emissiveColor: '#d97706',
    radius: 2.7,
    speed: -0.72,
    inclination: -0.95,
    phase: 2.8,
    size: 0.25,
    description: 'Cryptographic Provenance & RBAC Gateway',
    metricLabel: 'Audit Hash',
    metricValue: 'VERIFIED'
  },
  {
    id: 'subsystem-twin',
    name: 'Digital Twin',
    category: 'AI_SUBSYSTEM',
    color: '#10b981',
    emissiveColor: '#059669',
    radius: 2.5,
    speed: 0.78,
    inclination: 0.72,
    phase: 4.4,
    size: 0.23,
    description: '3D Geospatial BIM Mesh & Infrastructure Layers',
    metricLabel: 'Entities',
    metricValue: '284,102'
  }
];

export interface ThreeOrbCoreProps {
  systemState: SystemState;
  audioLevel?: number;
  onSelectNode?: (nodeId: string) => void;
  onHoverNode?: (node: SatelliteNode | null) => void;
  onOrbClick?: () => void;
  tiltX?: number;
  tiltY?: number;
  interactive?: boolean;
  className?: string;
  showInternalHUD?: boolean;
  cameraDistance?: number;
  onCameraDistanceChange?: (dist: number) => void;
  autonomousMode?: boolean;
  onToggleAutonomousMode?: (val: boolean) => void;
  aiKinematicPattern?: 'HARMONIC' | 'SWARM' | 'REASONING_SURGE' | 'DEFENSE_SHIELD';
  onChangeKinematicPattern?: (pattern: 'HARMONIC' | 'SWARM' | 'REASONING_SURGE' | 'DEFENSE_SHIELD') => void;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  enableVignette?: boolean;
  mipmapBlur?: boolean;
}

// -------------------------------------------------------------
// Central Core 3D Mesh Component with Reactive State Shader
// -------------------------------------------------------------
interface CentralCoreProps {
  systemState: SystemState;
  audioLevel: number;
  tiltX: number;
  tiltY: number;
  autonomousMode: boolean;
  onOrbClick?: () => void;
}

const CentralCoreMesh: React.FC<CentralCoreProps> = ({
  systemState,
  audioLevel,
  tiltX,
  tiltY,
  autonomousMode,
  onOrbClick
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const wireframeMeshRef = useRef<THREE.Mesh>(null);
  const innerNucleusRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  // Material Refs for smooth lerps
  const coreMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // Autonomous flight angles
  const aiFlightRef = useRef({ x: 0, y: 0, z: 0 });

  // Generate Quantum Particles
  const { particlePositions, particleColors } = useMemo(() => {
    const count = 320;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const cyan = new THREE.Color('#00e5ff');
    const lime = new THREE.Color('#d4ff00');
    const purple = new THREE.Color('#a855f7');

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 1.25 + Math.random() * 0.65;

      pos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = dist * Math.cos(phi);

      const chosen = i % 3 === 0 ? cyan : i % 3 === 1 ? lime : purple;
      cols[i * 3] = chosen.r;
      cols[i * 3 + 1] = chosen.g;
      cols[i * 3 + 2] = chosen.b;
    }
    return { particlePositions: pos, particleColors: cols };
  }, []);

  useFrame((_, delta) => {
    const elapsed = performance.now() * 0.001;

    // 1. System state theming colors
    let targetCoreColor = new THREE.Color('#00e5ff');
    let targetEmissiveColor = new THREE.Color('#00e5ff');
    let emissiveIntensity = 1.8;
    let pulseSpeed = 1.0;
    let coreScale = 1.0;

    switch (systemState) {
      case 'THINKING':
        targetCoreColor = new THREE.Color('#a855f7');
        targetEmissiveColor = new THREE.Color('#c084fc');
        emissiveIntensity = 2.4;
        pulseSpeed = 2.4;
        coreScale = 1.08 + Math.sin(elapsed * 8) * 0.06;
        break;
      case 'SPEAKING':
        targetCoreColor = new THREE.Color('#d4ff00');
        targetEmissiveColor = new THREE.Color('#d4ff00');
        emissiveIntensity = 2.8;
        pulseSpeed = 3.2;
        coreScale = 1.05 + audioLevel * 0.35;
        break;
      case 'LISTENING':
        targetCoreColor = new THREE.Color('#d4ff00');
        targetEmissiveColor = new THREE.Color('#84cc16');
        emissiveIntensity = 2.2;
        pulseSpeed = 2.0;
        break;
      case 'SIMULATING':
        targetCoreColor = new THREE.Color('#ec4899');
        targetEmissiveColor = new THREE.Color('#f43f5e');
        emissiveIntensity = 2.5;
        pulseSpeed = 2.2;
        break;
      case 'WARNING':
      case 'ERROR':
        targetCoreColor = new THREE.Color('#ef4444');
        targetEmissiveColor = new THREE.Color('#ff0033');
        emissiveIntensity = 3.0;
        pulseSpeed = 3.5;
        break;
      default:
        targetCoreColor = new THREE.Color('#00e5ff');
        targetEmissiveColor = new THREE.Color('#00e5ff');
        emissiveIntensity = 1.8;
        pulseSpeed = 1.0;
    }

    if (coreMatRef.current) {
      coreMatRef.current.color.lerp(targetCoreColor, 0.08);
      coreMatRef.current.emissive.lerp(targetEmissiveColor, 0.08);
      coreMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        coreMatRef.current.emissiveIntensity,
        emissiveIntensity,
        0.08
      );
    }

    if (pointLightRef.current) {
      pointLightRef.current.color.lerp(targetCoreColor, 0.08);
    }

    // 2. Multi-Harmonic Organic Biological Respiration Cycle (reacts to systemState)
    const respirationRate =
      systemState === 'THINKING' ? 0.48 :
      systemState === 'SIMULATING' ? 0.56 :
      systemState === 'SPEAKING' ? 0.42 :
      systemState === 'LISTENING' ? 0.32 :
      systemState === 'WARNING' || systemState === 'ERROR' ? 0.70 : 0.22; // ~13.2 BPM resting biological cycle

    const t = elapsed * respirationRate * Math.PI * 2;
    // Asymmetric natural breath: gentle expansion followed by smooth resonant contraction
    const bioBreath =
      Math.sin(t) * 0.065 +
      Math.sin(t * 2.0 + 0.4) * 0.018 +
      Math.sin(t * 0.5) * 0.022;

    if (rootGroupRef.current) {
      const finalScale = coreScale + bioBreath;
      rootGroupRef.current.scale.set(finalScale, finalScale, finalScale);

      // 3. Autonomous AI Kinematic Flight Tilt
      if (autonomousMode) {
        aiFlightRef.current.x += delta * 0.35;
        aiFlightRef.current.y += delta * 0.28;
        aiFlightRef.current.z += delta * 0.22;

        const autoTiltX =
          Math.sin(aiFlightRef.current.x) * 0.42 + Math.cos(aiFlightRef.current.z * 1.5) * 0.18;
        const autoTiltY =
          Math.cos(aiFlightRef.current.y) * 0.32 + Math.sin(aiFlightRef.current.x * 0.8) * 0.14;
        const autoFloatY = Math.sin(elapsed * 1.2) * 0.18 + bioBreath * 0.5;

        const targetRotX = autoTiltY + tiltY * 0.7;
        const targetRotY = autoTiltX + tiltX * 0.7;

        rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          rootGroupRef.current.rotation.x,
          targetRotX,
          0.06
        );
        rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          rootGroupRef.current.rotation.y,
          targetRotY,
          0.06
        );
        rootGroupRef.current.position.y = THREE.MathUtils.lerp(
          rootGroupRef.current.position.y,
          autoFloatY,
          0.06
        );
      } else {
        rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          rootGroupRef.current.rotation.x,
          tiltY * 0.6,
          0.08
        );
        rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          rootGroupRef.current.rotation.y,
          tiltX * 0.6,
          0.08
        );
      }
    }

    // 4. Internal Component Dynamic Organic Expansions
    if (innerNucleusRef.current) {
      const nucleusPulse = 0.55 + Math.sin(t * 1.3) * 0.08 + bioBreath * 0.4;
      innerNucleusRef.current.scale.set(nucleusPulse, nucleusPulse, nucleusPulse);
    }
    if (wireframeMeshRef.current) {
      const wirePulse = 1.04 + bioBreath * 0.9;
      wireframeMeshRef.current.scale.set(wirePulse, wirePulse, wirePulse);
      wireframeMeshRef.current.rotation.y -= delta * (0.35 + (bioBreath > 0 ? 0.15 : 0));
      wireframeMeshRef.current.rotation.x += delta * 0.18;
    }
    if (pointLightRef.current) {
      const baseIntensity = emissiveIntensity * 1.5;
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        baseIntensity + bioBreath * 6.0 + (systemState === 'SPEAKING' ? audioLevel * 3.0 : 0),
        0.1
      );
    }

    if (coreMeshRef.current) coreMeshRef.current.rotation.y += delta * 0.25;
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * (0.45 + bioBreath * 0.5);
    if (ring2Ref.current) ring2Ref.current.rotation.y -= delta * (0.60 + bioBreath * 0.4);
    if (ring3Ref.current) ring3Ref.current.rotation.x += delta * 0.52;
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.4;
      particlesRef.current.rotation.z -= delta * 0.2;
      const partScale = 1.0 + bioBreath * 0.8;
      particlesRef.current.scale.set(partScale, partScale, partScale);
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* Central Core Omnidirectional Glow Light */}
      <pointLight ref={pointLightRef} position={[0, 0, 0]} intensity={4.5} distance={18} />

      {/* Main Reactor Sphere */}
      <mesh
        ref={coreMeshRef}
        onClick={(e) => {
          e.stopPropagation();
          onOrbClick?.();
        }}
      >
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshPhysicalMaterial
          ref={coreMatRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.8}
          roughness={0.12}
          metalness={0.2}
          transmission={0.65}
          ior={1.4}
          transparent={true}
          opacity={0.92}
        />
      </mesh>

      {/* Geodesic Icosahedron Wireframe Shell */}
      <mesh ref={wireframeMeshRef}>
        <icosahedronGeometry args={[1.52, 2]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Inner Super-Luminous Quantum Nucleus */}
      <mesh ref={innerNucleusRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Gimbal Armature Ring 1 (Equatorial Cyan) */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.025, 16, 100]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Gimbal Armature Ring 2 (Polar Sky Blue) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 4, Math.PI / 3, 0]}>
        <torusGeometry args={[2.05, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Gimbal Armature Ring 3 (Inclined Lime) */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 6, -Math.PI / 4, Math.PI / 2]}>
        <torusGeometry args={[2.25, 0.018, 16, 100]} />
        <meshStandardMaterial
          color="#d4ff00"
          emissive="#d4ff00"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Quantum Particles Cloud */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// -------------------------------------------------------------
// Individual Satellite with Dynamic Energy Arc & DynamicDrawUsage Buffer
// -------------------------------------------------------------
interface SatelliteItemProps {
  node: SatelliteNode;
  isHovered: boolean;
  onSelectNode?: (nodeId: string) => void;
  onHoverNode?: (node: SatelliteNode | null) => void;
  setSatelliteRef: (id: string, el: THREE.Group | null) => void;
  setEnergyArcRef: (id: string, el: THREE.Line | null) => void;
}

const SatelliteItem: React.FC<SatelliteItemProps> = ({
  node,
  isHovered,
  onSelectNode,
  onHoverNode,
  setSatelliteRef,
  setEnergyArcRef
}) => {
  const colorObj = useMemo(() => new THREE.Color(node.color), [node.color]);

  // Precompute static orbital guide line points
  const { orbitLine, energyArcLine } = useMemo(() => {
    // 1. Static Orbit Line Geometry
    const orbitPoints: THREE.Vector3[] = [];
    const segments = 80;
    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const x = Math.cos(angle) * node.radius;
      const z = Math.sin(angle) * node.radius;
      const y = Math.sin(angle) * node.radius * Math.sin(node.inclination);
      orbitPoints.push(new THREE.Vector3(x, y, z));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    const orbit = new THREE.Line(orbitGeo, orbitMat);

    // 2. Dynamic Energy Arc Geometry with pre-allocated Float32Array (3 vertices = 9 floats)
    const arcPositions = new Float32Array(9);
    arcPositions[0] = 0;
    arcPositions[1] = 0;
    arcPositions[2] = 0;
    arcPositions[3] = node.radius * 0.5;
    arcPositions[4] = 0;
    arcPositions[5] = 0;
    arcPositions[6] = node.radius;
    arcPositions[7] = 0;
    arcPositions[8] = 0;

    const arcPosAttr = new THREE.BufferAttribute(arcPositions, 3);
    arcPosAttr.setUsage(THREE.DynamicDrawUsage); // Allow GPU buffer to be updated dynamically every frame

    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', arcPosAttr);

    const arcMat = new THREE.LineBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);

    return { orbitLine: orbit, energyArcLine: arcLine };
  }, [node.radius, node.inclination, colorObj]);

  // Update opacities on hover
  useEffect(() => {
    if (orbitLine.material instanceof THREE.LineBasicMaterial) {
      orbitLine.material.opacity = isHovered ? 0.45 : 0.18;
    }
    if (energyArcLine.material instanceof THREE.LineBasicMaterial) {
      energyArcLine.material.opacity = isHovered ? 0.8 : 0.35;
    }
  }, [isHovered, orbitLine, energyArcLine]);

  // Cleanup geometries & materials on unmount
  useEffect(() => {
    return () => {
      orbitLine.geometry.dispose();
      (orbitLine.material as THREE.Material).dispose();
      energyArcLine.geometry.dispose();
      (energyArcLine.material as THREE.Material).dispose();
    };
  }, [orbitLine, energyArcLine]);

  return (
    <React.Fragment>
      {/* Orbital Elliptical Path Ribbon */}
      <primitive object={orbitLine} />

      {/* Dynamic Energy Arc from Center to Satellite */}
      <primitive
        ref={(el: THREE.Line | null) => {
          setEnergyArcRef(node.id, el);
        }}
        object={energyArcLine}
      />

      {/* Satellite 3D Group */}
      <group
        ref={(el: THREE.Group | null) => {
          setSatelliteRef(node.id, el);
        }}
      >
        {/* Glowing Satellite Sphere */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode?.(node.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverNode?.(node);
          }}
          onPointerOut={() => {
            onHoverNode?.(null);
          }}
        >
          <sphereGeometry args={[node.size, 24, 24]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.emissiveColor}
            emissiveIntensity={isHovered ? 3.0 : 1.6}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>

        {/* Luminous Orbital Halo Torus */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[node.size * 1.5, 0.016, 12, 32]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={isHovered ? 0.95 : 0.65}
          />
        </mesh>
      </group>
    </React.Fragment>
  );
};

// -------------------------------------------------------------
// Orbiting Satellites Collection with Bloom-Reactive Materials
// -------------------------------------------------------------
interface SatellitesCollectionProps {
  pattern: 'HARMONIC' | 'SWARM' | 'REASONING_SURGE' | 'DEFENSE_SHIELD';
  systemState: SystemState;
  hoveredNodeId: string | null;
  onSelectNode?: (nodeId: string) => void;
  onHoverNode?: (node: SatelliteNode | null) => void;
}

const SatellitesCollection: React.FC<SatellitesCollectionProps> = ({
  pattern,
  systemState,
  hoveredNodeId,
  onSelectNode,
  onHoverNode
}) => {
  const satelliteRefs = useRef<{ [key: string]: THREE.Group | null }>({});
  const energyArcRefs = useRef<{ [key: string]: THREE.Line | null }>({});

  const setSatelliteRef = useCallback((id: string, el: THREE.Group | null) => {
    satelliteRefs.current[id] = el;
  }, []);

  const setEnergyArcRef = useCallback((id: string, el: THREE.Line | null) => {
    energyArcRefs.current[id] = el;
  }, []);

  useFrame(() => {
    const elapsed = performance.now() * 0.001;

    let speedMultiplier = 1.0;
    if (systemState === 'THINKING') speedMultiplier = 2.4;
    if (systemState === 'SPEAKING') speedMultiplier = 1.8;
    if (systemState === 'SIMULATING') speedMultiplier = 2.0;

    SATELLITE_ORBS.forEach((node) => {
      const group = satelliteRefs.current[node.id];
      const energyArc = energyArcRefs.current[node.id];
      if (!group) return;

      const orbitAngle = elapsed * node.speed * speedMultiplier + node.phase;

      let rad = node.radius;
      if (pattern === 'SWARM') {
        rad = node.radius * (0.75 + Math.sin(elapsed * 2 + node.phase) * 0.25);
      } else if (pattern === 'REASONING_SURGE') {
        rad = node.radius * (1.12 + Math.sin(elapsed * 4 + node.phase) * 0.15);
      } else if (pattern === 'DEFENSE_SHIELD') {
        rad = node.radius * 0.85;
      }

      const posX = Math.cos(orbitAngle) * rad;
      const posZ = Math.sin(orbitAngle) * rad;
      const posY =
        Math.sin(orbitAngle) * rad * Math.sin(node.inclination) +
        Math.cos(elapsed * 1.8 + node.phase) * 0.15;

      group.position.set(posX, posY, posZ);

      // Dynamic Connecting Energy Arc Ribbon - Direct CPU->GPU buffer sync with needsUpdate
      if (energyArc && energyArc.geometry && energyArc.geometry.attributes.position) {
        const midY = posY * 0.5 + Math.sin(elapsed * 3 + node.phase) * 0.3;
        const posAttr = energyArc.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        // Vertex 0: Center Origin
        posArray[0] = 0;
        posArray[1] = 0;
        posArray[2] = 0;

        // Vertex 1: Arcing Midpoint
        posArray[3] = posX * 0.5;
        posArray[4] = midY;
        posArray[5] = posZ * 0.5;

        // Vertex 2: Satellite Current Position
        posArray[6] = posX;
        posArray[7] = posY;
        posArray[8] = posZ;

        // Tell Three.js to sync CPU array updates into GPU buffer
        posAttr.needsUpdate = true;
      }
    });
  });

  return (
    <group>
      {SATELLITE_ORBS.map((node) => (
        <SatelliteItem
          key={node.id}
          node={node}
          isHovered={hoveredNodeId === node.id}
          onSelectNode={onSelectNode}
          onHoverNode={onHoverNode}
          setSatelliteRef={setSatelliteRef}
          setEnergyArcRef={setEnergyArcRef}
        />
      ))}
    </group>
  );
};

// -------------------------------------------------------------
// Camera & Scene Post-Processing FX Controller Component
// -------------------------------------------------------------
interface SceneFXProps {
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  mipmapBlur: boolean;
  enableVignette: boolean;
  cameraDistance: number;
}

const SceneFX: React.FC<SceneFXProps> = ({
  bloomIntensity,
  bloomThreshold,
  bloomSmoothing,
  mipmapBlur,
  enableVignette,
  cameraDistance
}) => {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraDistance, 0.06);
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* High-Fidelity Multi-Pass Glow Bloom */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur={mipmapBlur}
        blendFunction={BlendFunction.SCREEN}
      />

      {/* Cinematic Vignette Framing */}
      {enableVignette && (
        <Vignette
          eskil={false}
          offset={0.15}
          darkness={0.75}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  );
};

// -------------------------------------------------------------
// Main ThreeOrbCore Component with Post-Processing & Controls
// -------------------------------------------------------------
export const ThreeOrbCore: React.FC<ThreeOrbCoreProps> = ({
  systemState = 'IDLE',
  audioLevel = 0,
  onSelectNode,
  onHoverNode,
  onOrbClick,
  tiltX = 0,
  tiltY = 0,
  interactive = true,
  className = '',
  showInternalHUD = true,
  cameraDistance: propCameraDistance,
  onCameraDistanceChange,
  autonomousMode: propAutonomousMode,
  onToggleAutonomousMode,
  aiKinematicPattern: propKinematicPattern,
  onChangeKinematicPattern,
  bloomIntensity: propBloomIntensity,
  bloomThreshold: propBloomThreshold,
  bloomSmoothing: propBloomSmoothing,
  enableVignette: propEnableVignette,
  mipmapBlur: propMipmapBlur
}) => {
  const [hoveredNode, setHoveredNode] = useState<SatelliteNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SatelliteNode | null>(null);
  const [localAutonomousMode, setLocalAutonomousMode] = useState<boolean>(true);
  const [localAiKinematicPattern, setLocalAiKinematicPattern] = useState<
    'HARMONIC' | 'SWARM' | 'REASONING_SURGE' | 'DEFENSE_SHIELD'
  >('HARMONIC');
  const [localCameraDistance, setLocalCameraDistance] = useState<number>(10.5);

  // Controlled / Uncontrolled fallbacks
  const autonomousMode = propAutonomousMode !== undefined ? propAutonomousMode : localAutonomousMode;
  const setAutonomousMode = (val: boolean) => {
    setLocalAutonomousMode(val);
    onToggleAutonomousMode?.(val);
  };

  const aiKinematicPattern = propKinematicPattern || localAiKinematicPattern;
  const setAiKinematicPattern = (pattern: 'HARMONIC' | 'SWARM' | 'REASONING_SURGE' | 'DEFENSE_SHIELD') => {
    setLocalAiKinematicPattern(pattern);
    onChangeKinematicPattern?.(pattern);
  };

  const cameraDistance = propCameraDistance !== undefined ? propCameraDistance : localCameraDistance;
  const setCameraDistance = (fn: (d: number) => number | number) => {
    const nextVal = typeof fn === 'function' ? fn(cameraDistance) : fn;
    setLocalCameraDistance(nextVal);
    onCameraDistanceChange?.(nextVal);
  };

  // Post-Processing Settings State
  const [localBloomIntensity, setLocalBloomIntensity] = useState<number>(1.6);
  const [localBloomThreshold, setLocalBloomThreshold] = useState<number>(0.15);
  const [localBloomSmoothing, setLocalBloomSmoothing] = useState<number>(0.9);
  const [localMipmapBlur, setLocalMipmapBlur] = useState<boolean>(true);
  const [localEnableVignette, setLocalEnableVignette] = useState<boolean>(true);
  const [showFXSettings, setShowFXSettings] = useState<boolean>(false);
  const [activeFXPreset, setActiveFXPreset] = useState<'SOVEREIGN_GLOW' | 'QUANTUM_NEON' | 'SUBTLE' | 'HYPER_BLOOM'>('SOVEREIGN_GLOW');

  const bloomIntensity = propBloomIntensity !== undefined ? propBloomIntensity : localBloomIntensity;
  const setBloomIntensity = setLocalBloomIntensity;
  const bloomThreshold = propBloomThreshold !== undefined ? propBloomThreshold : localBloomThreshold;
  const setBloomThreshold = setLocalBloomThreshold;
  const bloomSmoothing = propBloomSmoothing !== undefined ? propBloomSmoothing : localBloomSmoothing;
  const mipmapBlur = propMipmapBlur !== undefined ? propMipmapBlur : localMipmapBlur;
  const setMipmapBlur = setLocalMipmapBlur;
  const enableVignette = propEnableVignette !== undefined ? propEnableVignette : localEnableVignette;
  const setEnableVignette = setLocalEnableVignette;

  // Preset Applicator
  const applyFXPreset = (preset: 'SOVEREIGN_GLOW' | 'QUANTUM_NEON' | 'SUBTLE' | 'HYPER_BLOOM') => {
    setActiveFXPreset(preset);
    switch (preset) {
      case 'SOVEREIGN_GLOW':
        setBloomIntensity(1.6);
        setBloomThreshold(0.15);
        setLocalBloomSmoothing(0.9);
        setMipmapBlur(true);
        break;
      case 'QUANTUM_NEON':
        setBloomIntensity(2.4);
        setBloomThreshold(0.08);
        setLocalBloomSmoothing(0.95);
        setMipmapBlur(true);
        break;
      case 'SUBTLE':
        setBloomIntensity(0.85);
        setBloomThreshold(0.35);
        setLocalBloomSmoothing(0.7);
        setMipmapBlur(true);
        break;
      case 'HYPER_BLOOM':
        setBloomIntensity(3.2);
        setBloomThreshold(0.02);
        setLocalBloomSmoothing(0.98);
        setMipmapBlur(true);
        break;
    }
  };

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      const node = SATELLITE_ORBS.find((s) => s.id === nodeId);
      if (node) setSelectedNode(node);
      onSelectNode?.(nodeId);
    },
    [onSelectNode]
  );

  const handleHoverNode = useCallback(
    (node: SatelliteNode | null) => {
      setHoveredNode(node);
      onHoverNode?.(node);
    },
    [onHoverNode]
  );

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
    >
      {/* 3D WebGL Canvas with Post-Processing */}
      <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 1.2, 10.5], fov: 45 }}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.25
          }}
        >
          {/* Ambient & Directional Scene Lighting */}
          <ambientLight intensity={1.2} color="#0a192f" />
          <directionalLight position={[5, 8, 5]} intensity={1.4} color="#d4ff00" />
          <directionalLight position={[-5, -3, -5]} intensity={0.9} color="#38bdf8" />

          {/* Central Reactor Core Mesh */}
          <CentralCoreMesh
            systemState={systemState}
            audioLevel={audioLevel}
            tiltX={tiltX}
            tiltY={tiltY}
            autonomousMode={autonomousMode}
            onOrbClick={onOrbClick}
          />

          {/* Orbiting Satellites with Luminous Halos */}
          <SatellitesCollection
            pattern={aiKinematicPattern}
            systemState={systemState}
            hoveredNodeId={hoveredNode?.id || null}
            onSelectNode={handleSelectNode}
            onHoverNode={handleHoverNode}
          />

          {/* Post-Processing Effects Pipeline (Bloom & Vignette) */}
          <SceneFX
            bloomIntensity={bloomIntensity}
            bloomThreshold={bloomThreshold}
            bloomSmoothing={bloomSmoothing}
            mipmapBlur={mipmapBlur}
            enableVignette={enableVignette}
            cameraDistance={cameraDistance}
          />
        </Canvas>
      </div>

      {/* Internal HUD Elements (rendered only in standalone mode or when showInternalHUD is true) */}
      {showInternalHUD && (
        <>
          {/* Top HUD: Autonomous AI Kinematics State & Post-Processing Trigger */}
          <div className="absolute top-4 left-6 z-20 flex flex-wrap items-center gap-2 font-mono-tech text-[10px] pointer-events-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#070c16]/90 border border-[#00e5ff]/40 backdrop-blur-md shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
              <span className="font-bold text-white tracking-wider">3D CORE & SATELLITES</span>
              <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#00e5ff]/20 text-[#00e5ff] font-bold">
                POSTPROCESSING BLOOM // ONLINE
              </span>
            </div>

            <button
              onClick={() => setAutonomousMode(!autonomousMode)}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                autonomousMode
                  ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-[#09101c]/80 border-white/10 text-[#8e8d88] hover:text-white'
              }`}
              title="Toggle AI self-moving kinematics"
            >
              {autonomousMode ? <Play className="w-3 h-3 text-[#00e5ff]" /> : <Pause className="w-3 h-3" />}
              <span>AI SELF-MOVING: {autonomousMode ? 'ACTIVE' : 'MANUAL'}</span>
            </button>

            {autonomousMode && (
              <div className="hidden sm:flex items-center gap-1 bg-[#070c16]/80 p-0.5 rounded-lg border border-white/10">
                {(['HARMONIC', 'SWARM', 'REASONING_SURGE', 'DEFENSE_SHIELD'] as const).map(
                  (pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setAiKinematicPattern(pattern)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                        aiKinematicPattern === pattern
                          ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                          : 'text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      {pattern.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Post-Processing FX Controls Toggle */}
            <button
              onClick={() => setShowFXSettings(!showFXSettings)}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                showFXSettings
                  ? 'bg-[#d4ff00]/20 border-[#d4ff00] text-[#d4ff00] shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                  : 'bg-[#09101c]/80 border-white/10 text-[#8e8d88] hover:text-white'
              }`}
              title="Adjust Post-Processing Bloom & Optics"
            >
              <Sun className="w-3 h-3 text-[#d4ff00]" />
              <span>BLOOM FX: {bloomIntensity.toFixed(1)}x</span>
            </button>
          </div>

          {/* Post-Processing FX Tuner HUD Modal */}
          {showFXSettings && (
            <div className="absolute top-16 left-6 z-30 w-80 rounded-xl bg-[#070c16]/95 border border-[#d4ff00]/40 backdrop-blur-xl p-4 shadow-2xl font-mono-tech flex flex-col gap-3 text-xs text-[#c4c3be] pointer-events-auto">
              <div className="flex items-center justify-between border-b border-[#d4ff00]/20 pb-2">
                <div className="flex items-center gap-2 text-[#d4ff00] font-bold">
                  <Sun className="w-4 h-4" />
                  <span>@REACT-THREE/POSTPROCESSING FX</span>
                </div>
                <button
                  onClick={() => setShowFXSettings(false)}
                  className="text-[#8e8d88] hover:text-white text-[10px]"
                >
                  ✕
                </button>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-[#8e8d88] font-bold uppercase">OPTICAL PRESET</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'SOVEREIGN_GLOW', label: 'SOVEREIGN' },
                      { id: 'QUANTUM_NEON', label: 'QUANTUM NEON' },
                      { id: 'SUBTLE', label: 'SUBTLE' },
                      { id: 'HYPER_BLOOM', label: 'HYPER BLOOM' }
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyFXPreset(preset.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                        activeFXPreset === preset.id
                          ? 'bg-[#d4ff00]/20 border-[#d4ff00] text-[#d4ff00]'
                          : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloom Intensity Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#8e8d88]">Bloom Intensity:</span>
                  <span className="text-[#00e5ff] font-bold">{bloomIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4.0"
                  step="0.1"
                  value={bloomIntensity}
                  onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                  className="w-full accent-[#00e5ff]"
                />
              </div>

              {/* Luminance Threshold Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#8e8d88]">Luminance Cutoff:</span>
                  <span className="text-[#d4ff00] font-bold">{bloomThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={bloomThreshold}
                  onChange={(e) => setBloomThreshold(parseFloat(e.target.value))}
                  className="w-full accent-[#d4ff00]"
                />
              </div>

              {/* Mipmap Blur & Vignette Toggles */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mipmapBlur}
                    onChange={(e) => setMipmapBlur(e.target.checked)}
                    className="accent-[#00e5ff]"
                  />
                  <span>Mipmap Blur</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableVignette}
                    onChange={(e) => setEnableVignette(e.target.checked)}
                    className="accent-[#00e5ff]"
                  />
                  <span>Cinematic Vignette</span>
                </label>
              </div>
            </div>
          )}

          {/* Hovered / Selected Node 3D Telemetry HUD Card */}
          {(hoveredNode || selectedNode) && (
            <div className="absolute bottom-6 left-6 z-20 w-72 rounded-xl bg-[#070c16]/95 border border-[#00e5ff]/50 backdrop-blur-xl p-3.5 shadow-2xl font-mono-tech flex flex-col gap-2 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-[#00e5ff]/30 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                    style={{ backgroundColor: (hoveredNode || selectedNode)?.color }}
                  />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    {(hoveredNode || selectedNode)?.name}
                  </span>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    backgroundColor: `${(hoveredNode || selectedNode)?.color}20`,
                    color: (hoveredNode || selectedNode)?.color
                  }}
                >
                  {(hoveredNode || selectedNode)?.category}
                </span>
              </div>

              <p className="text-[11px] text-[#c4c3be] leading-relaxed">
                {(hoveredNode || selectedNode)?.description}
              </p>

              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/10">
                <span className="text-[#8e8d88]">
                  {(hoveredNode || selectedNode)?.metricLabel}:
                </span>
                <span className="font-bold text-[#00e5ff]">
                  {(hoveredNode || selectedNode)?.metricValue}
                </span>
              </div>

              <button
                onClick={() => {
                  const node = hoveredNode || selectedNode;
                  if (node) {
                    onSelectNode?.(node.id);
                  }
                }}
                className="w-full py-1.5 mt-1 rounded-lg bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-black font-bold text-[10px] tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(0,229,255,0.3)]"
              >
                Inspect Node Telemetry
              </button>
            </div>
          )}

          {/* Depth Zoom Navigation Controller */}
          <div className="absolute right-6 bottom-6 z-20 flex flex-col items-center gap-1.5 font-mono-tech text-[9px] text-[#8e8d88] bg-[#070c16]/80 p-2 rounded-xl border border-white/10 backdrop-blur-md pointer-events-auto">
            <span className="text-[#00e5ff] font-bold">3D DEPTH</span>
            <button
              onClick={() => setCameraDistance((d) => Math.max(6, d - 1.5))}
              className="w-6 h-6 rounded bg-[#111622] hover:bg-[#00e5ff] hover:text-black border border-white/10 text-white font-bold transition-all flex items-center justify-center"
            >
              +
            </button>
            <span className="text-[10px] text-white font-bold">{cameraDistance.toFixed(1)}m</span>
            <button
              onClick={() => setCameraDistance((d) => Math.min(18, d + 1.5))}
              className="w-6 h-6 rounded bg-[#111622] hover:bg-[#00e5ff] hover:text-black border border-white/10 text-white font-bold transition-all flex items-center justify-center"
            >
              -
            </button>
          </div>
        </>
      )}
    </div>
  );
};
