import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Text } from "@react-three/drei";
import * as THREE from "three";

export interface SpatialEntity {
  id: string;
  label: string;
  kind: "world" | "agent" | "verification" | "simulation" | "system";
  position: [number, number, number];
  state: "active" | "ready" | "verified" | "idle";
}

const ENTITIES: SpatialEntity[] = [
  { id: "world", label: "WORLD MODEL", kind: "world", position: [-4.4, 1.2, -1], state: "active" },
  { id: "fabric", label: "AGENT FABRIC", kind: "agent", position: [4.4, 1.1, -1], state: "active" },
  { id: "verification", label: "VERIFICATION", kind: "verification", position: [0, -2.5, -1], state: "verified" },
  { id: "simulation", label: "SIMULATION", kind: "simulation", position: [0, 3.4, -2], state: "ready" },
];

const LINKS: Array<[string, string]> = [
  ["world", "fabric"],
  ["world", "verification"],
  ["fabric", "verification"],
  ["simulation", "world"],
  ["simulation", "fabric"],
];

function entityColor(kind: SpatialEntity["kind"]) {
  switch (kind) {
    case "verification": return "#8be9ff";
    case "simulation": return "#c3b5ff";
    case "agent": return "#74dcff";
    case "world": return "#9be8d5";
    default: return "#ffffff";
  }
}

function Core() {
  const shell = useRef<THREE.Mesh>(null);
  const nucleus = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (shell.current) {
      shell.current.rotation.x = t * 0.08;
      shell.current.rotation.y = t * 0.16;
    }
    if (nucleus.current) {
      nucleus.current.rotation.x = -t * 0.12;
      nucleus.current.rotation.y = t * 0.24;
    }
  });

  return (
    <group>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.85, 2]} />
        <meshBasicMaterial color="#6cecff" wireframe transparent opacity={0.2} />
      </mesh>
      <mesh ref={nucleus}>
        <octahedronGeometry args={[0.88, 3]} />
        <meshStandardMaterial color="#061117" emissive="#43dcff" emissiveIntensity={4.5} metalness={1} roughness={0.14} />
      </mesh>
      <mesh scale={2.65}>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshBasicMaterial color="#4be5ff" transparent opacity={0.045} depthWrite={false} />
      </mesh>
      <pointLight color="#52e6ff" intensity={14} distance={18} decay={2} />
    </group>
  );
}

function EntityNode({ entity, selected, onSelect }: { entity: SpatialEntity; selected: boolean; onSelect: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = entityColor(entity.kind);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.8 + entity.position[0]) * 0.05;
    ref.current.scale.setScalar(pulse * (selected ? 1.18 : 1));
    ref.current.rotation.y += 0.0025;
  });

  return (
    <group position={entity.position}>
      <mesh ref={ref} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
        <icosahedronGeometry args={[0.42, 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 4 : 2} metalness={0.85} roughness={0.18} />
      </mesh>
      <mesh scale={1.8}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.16 : 0.06} depthWrite={false} />
      </mesh>
      <Text position={[0, 0.78, 0]} fontSize={0.16} color="#d8f7ff" anchorX="center" anchorY="middle">
        {entity.label}
      </Text>
    </group>
  );
}

function SpatialScene({ selectedId, setSelectedId }: { selectedId: string | null; setSelectedId: (id: string) => void }) {
  const byId = useMemo(() => new Map(ENTITIES.map((entity) => [entity.id, entity])), []);

  return (
    <>
      <color attach="background" args={["#02070a"]} />
      <ambientLight intensity={0.08} />
      <Stars radius={70} depth={35} count={1800} factor={1.6} saturation={0} fade speed={0.22} />

      <gridHelper args={[36, 36, "#15343e", "#08161c"]} position={[0, -4, 0]} />
      <Core />

      {LINKS.map(([fromId, toId]) => {
        const from = byId.get(fromId);
        const to = byId.get(toId);
        if (!from || !to) return null;
        return <Line key={`${fromId}-${toId}`} points={[from.position, to.position]} color="#53dfff" transparent opacity={0.18} lineWidth={0.7} />;
      })}

      {ENTITIES.map((entity) => (
        <EntityNode key={entity.id} entity={entity} selected={selectedId === entity.id} onSelect={() => setSelectedId(entity.id)} />
      ))}

      <OrbitControls enablePan={false} enableDamping dampingFactor={0.055} minDistance={6.5} maxDistance={17} />
    </>
  );
}

export interface ArchOSSpatialEnvironmentProps {
  className?: string;
}

/**
 * ArchOS-native spatial environment. This is presentation-only: it visualizes
 * system state and does not own orchestration or execution authority.
 */
export const ArchOSSpatialEnvironment: React.FC<ArchOSSpatialEnvironmentProps> = ({ className = "" }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = ENTITIES.find((entity) => entity.id === selectedId);

  return (
    <section className={`relative min-h-[620px] overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#02070a] shadow-2xl ${className}`} aria-label="ArchOS spatial intelligence environment">
      <Canvas camera={{ position: [0, 0.8, 11], fov: 48 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <SpatialScene selectedId={selectedId} setSelectedId={setSelectedId} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(51,217,255,0.07),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.25))]" />

      <div className="pointer-events-none absolute left-5 top-5 rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3 backdrop-blur-md">
        <div className="text-[8px] tracking-[0.3em] text-white/30">ARCHOS / SPATIAL RUNTIME</div>
        <div className="mt-1 text-xs tracking-[0.12em] text-white/75">INTELLIGENCE FIELD</div>
      </div>

      <div className="pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2 text-[8px] tracking-[0.2em] text-cyan-100/65 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" /> LIVE STATE
      </div>

      {selected && (
        <div className="absolute bottom-5 right-5 w-56 rounded-xl border border-white/[0.08] bg-black/55 p-4 backdrop-blur-xl">
          <div className="text-[8px] tracking-[0.25em] text-white/30">SELECTED ENTITY</div>
          <div className="mt-2 text-sm text-white/90">{selected.label}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-cyan-200/60">{selected.kind} · {selected.state}</div>
          <button type="button" onClick={() => setSelectedId("")} className="pointer-events-auto mt-4 text-[8px] tracking-[0.18em] text-white/35 hover:text-white/70">CLEAR</button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 left-5 text-[8px] leading-5 tracking-[0.18em] text-white/20">
        <div>WORLD STATE · LIVE</div>
        <div>SPATIAL GRAPH · SYNCHRONIZED</div>
        <div>EXECUTION AUTHORITY · EXTERNAL</div>
      </div>
    </section>
  );
};

export default ArchOSSpatialEnvironment;
