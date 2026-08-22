import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Text } from '@react-three/drei';
import { AdditiveBlending, Color, Group, LineBasicMaterial, Mesh } from 'three';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { SPATIAL_MODULES, modulePositionAtTime, normalizedActivity, type SpatialModule } from './SpatialRuntime';

const CORE_RADIUS = .72;

function Core() {
  const group = useRef<Group>(null!);
  const inner = useRef<Mesh>(null!);
  useFrame(({ clock }, dt) => {
    group.current.rotation.y += dt * .055;
    inner.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.7) * .025);
  });
  return <group ref={group}>
    <mesh ref={inner}><sphereGeometry args={[CORE_RADIUS, 64, 64]}/><meshBasicMaterial color="#000000"/></mesh>
    {[.86, .98, 1.13, 1.34].map((r, i) => <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[r, .025 + i * .012, 12, 192]}/>
      <meshBasicMaterial color={i < 2 ? '#ffe5ae' : '#ff7a2f'} transparent opacity={.9 - i * .17} blending={AdditiveBlending}/>
    </mesh>)}
    <pointLight color="#ff9a45" intensity={22} distance={11} decay={2}/>
    <Text position={[0, -1.5, 0]} fontSize={.24} color="#fff2dc" anchorX="center" anchorY="middle" letterSpacing={.12}>ULTRON</Text>
    <Text position={[0, -1.78, 0]} fontSize={.095} color="#9aa4b4" anchorX="center" anchorY="middle" letterSpacing={.18}>AIOS · LIVING WORLD MODEL</Text>
  </group>;
}

function AccretionDisk() {
  const ref = useRef<Group>(null!);
  const points = useMemo(() => Array.from({ length: 2600 }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const r = .98 + Math.pow(Math.random(), .62) * 4.8;
    return { a, r, thickness: (Math.random() - .5) * (.055 + r * .035), size: .006 + Math.random() * .018, seed: i * 1.731 };
  }), []);
  useFrame((_, dt) => { ref.current.rotation.y += dt * .09; });
  return <group ref={ref} rotation={[.13, 0, .07]}>
    {points.map((p, i) => {
      const a = p.a + Math.sin(p.seed) * .015;
      const color = new Color().setHSL(.055 + Math.min(p.r / 6, 1) * .07, .96, .52 + Math.max(0, 1 - p.r / 6) * .23);
      return <mesh key={i} position={[Math.cos(a) * p.r, p.thickness, Math.sin(a) * p.r]} scale={p.size}>
        <sphereGeometry args={[1, 5, 5]}/><meshBasicMaterial color={color} transparent opacity={.28 + Math.max(0, 1 - p.r / 6) * .62} blending={AdditiveBlending}/>
      </mesh>;
    })}
  </group>;
}

function RelativisticJets() {
  return <group>
    {[-1, 1].map((direction) => <group key={direction} position={[0, direction * .8, 0]}>
      <mesh scale={[.22, 3.8, .22]} rotation={[direction < 0 ? Math.PI : 0, 0, 0]}>
        <coneGeometry args={[1, 1, 20, 1, true]}/><meshBasicMaterial color="#6db7ff" transparent opacity={.11} blending={AdditiveBlending}/>
      </mesh>
      <mesh scale={[.06, 4.2, .06]}><cylinderGeometry args={[1, .08, 1, 12]}/><meshBasicMaterial color="#d8edff" transparent opacity={.18} blending={AdditiveBlending}/></mesh>
    </group>)}
  </group>;
}

function ModuleNode({ module, onSelect }: { module: SpatialModule; onSelect?: (id: string) => void }) {
  const group = useRef<Group>(null!);
  const core = useRef<Mesh>(null!);
  useFrame(({ clock }) => {
    const p = modulePositionAtTime(module, clock.elapsedTime);
    group.current.position.lerp(p, .08);
    core.current.scale.setScalar(.7 + normalizedActivity(module, clock.elapsedTime) * .7);
  });
  return <group ref={group} position={modulePositionAtTime(module, 0)}>
    <mesh ref={core} onClick={(e) => { e.stopPropagation(); onSelect?.(module.id); }}>
      <sphereGeometry args={[.14 + module.activity * .045, 18, 18]}/><meshBasicMaterial color={module.color} transparent opacity={.95} blending={AdditiveBlending}/>
    </mesh>
    <mesh><sphereGeometry args={[.32 + module.activity * .1, 12, 12]}/><meshBasicMaterial color={module.color} transparent opacity={.035} blending={AdditiveBlending}/></mesh>
    <Text position={[0, .29, 0]} fontSize={.105} color="#d5dce8" anchorX="center" anchorY="bottom" outlineWidth={.006} outlineColor="#000000">{module.label}</Text>
  </group>;
}

function CoreConnections() {
  const material = useRef<LineBasicMaterial>(null!);
  const positions = useMemo(() => SPATIAL_MODULES.map((m) => modulePositionAtTime(m, 0)), []);
  const vertices = useMemo(() => new Float32Array(positions.flatMap((p) => [0, 0, 0, p.x, p.y, p.z])), [positions]);
  useFrame(({ clock }) => {
    const average = SPATIAL_MODULES.reduce((sum, module) => sum + normalizedActivity(module, clock.elapsedTime), 0) / SPATIAL_MODULES.length;
    material.current.opacity = .07 + average * .18;
  });
  return <lineSegments>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]}/></bufferGeometry>
    <lineBasicMaterial ref={material} color="#8ed8ff" transparent opacity={.15} blending={AdditiveBlending}/>
  </lineSegments>;
}

function OrbitField() {
  return <>{[2.05, 2.65, 3.25, 3.85, 4.45, 5.05].map((r, i) => <mesh key={r} rotation={[Math.PI / 2, 0, i * .08]}>
    <torusGeometry args={[r, i % 2 ? .007 : .004, 6, 220]}/><meshBasicMaterial color={i % 2 ? '#5b8dff' : '#ffb86b'} transparent opacity={.035 + i * .008} blending={AdditiveBlending}/>
  </mesh>)}</>;
}

function DeepField() {
  return <><Sparkles count={2400} scale={[22, 11, 22]} size={1.15} speed={.12} opacity={.52} color="#b9d8ff"/><Sparkles count={600} scale={[13, 6, 13]} size={2.2} speed={.24} opacity={.32} color="#ffcf9a"/></>;
}

export function SpatialWorldScene({ onModuleSelect }: { onModuleSelect?: (id: string) => void }) {
  return <>
    <color attach="background" args={['#010206']}/><ambientLight intensity={.055}/><DeepField/><RelativisticJets/>
    <Float speed={.22} rotationIntensity={.025} floatIntensity={.06}><AccretionDisk/><Core/></Float>
    <OrbitField/><CoreConnections/>{SPATIAL_MODULES.map((module) => <ModuleNode key={module.id} module={module} onSelect={onModuleSelect}/>)}
    <EffectComposer multisampling={0}><Bloom intensity={1.9} luminanceThreshold={.13} luminanceSmoothing={.5} mipmapBlur/><Vignette eskil={false} offset={.18} darkness={.55}/></EffectComposer>
  </>;
}
