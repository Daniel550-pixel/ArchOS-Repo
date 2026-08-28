import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

/* =========================================================
   TYPES
   ========================================================= */

export type SystemStatus = "online" | "processing" | "warning" | "offline";

export type Module = {
  id: string;
  label: string;
  description: string;
  status: SystemStatus;
};

export type EventItem = {
  id: number;
  time: string;
  type: string;
  message: string;
  severity: "normal" | "important" | "critical";
};

/* =========================================================
   SYSTEM DATA
   ========================================================= */

const modules: Module[] = [
  {
    id: "world",
    label: "WORLD MODEL",
    description: "Global spatial and temporal state",
    status: "online",
  },
  {
    id: "agents",
    label: "AGENT FABRIC",
    description: "Multi-agent orchestration layer",
    status: "processing",
  },
  {
    id: "reasoning",
    label: "REASONING",
    description: "Analysis and decision systems",
    status: "online",
  },
  {
    id: "simulation",
    label: "SIMULATION",
    description: "Scenario and predictive modelling",
    status: "online",
  },
  {
    id: "verification",
    label: "VERIFICATION",
    description: "Evidence and integrity validation",
    status: "online",
  },
  {
    id: "security",
    label: "SECURITY",
    description: "Trust, policy and system security",
    status: "online",
  },
  {
    id: "memory",
    label: "MEMORY",
    description: "Persistent system knowledge",
    status: "online",
  },
];

const events: EventItem[] = [
  {
    id: 1,
    time: "13:03:42",
    type: "WORLD",
    message: "World model synchronization completed",
    severity: "normal",
  },
  {
    id: 2,
    time: "13:03:39",
    type: "AGENT",
    message: "New reasoning task accepted",
    severity: "normal",
  },
  {
    id: 3,
    time: "13:03:35",
    type: "VERIFY",
    message: "Evidence chain validated",
    severity: "important",
  },
  {
    id: 4,
    time: "13:03:27",
    type: "SYSTEM",
    message: "Experience state updated",
    severity: "normal",
  },
];

/* =========================================================
   3D ENVIRONMENT
   ========================================================= */

function SystemCore() {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (outer.current) {
      outer.current.rotation.x = t * 0.08;
      outer.current.rotation.y = t * 0.15;
    }

    if (inner.current) {
      inner.current.rotation.x = -t * 0.12;
      inner.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={outer}>
        <icosahedronGeometry args={[2.4, 2]} />
        <meshBasicMaterial
          color="#7de8ff"
          wireframe
          transparent
          opacity={0.14}
        />
      </mesh>

      <mesh ref={inner}>
        <octahedronGeometry args={[1.25, 3]} />
        <meshStandardMaterial
          color="#0b1820"
          emissive="#4bdfff"
          emissiveIntensity={3}
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      <mesh scale={3.4}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#38dfff"
          transparent
          opacity={0.035}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        color="#53e8ff"
        intensity={12}
        distance={18}
      />
    </group>
  );
}

function SpatialGrid() {
  return (
    <gridHelper
      args={[40, 40, "#12333d", "#07151b"]}
      position={[0, -4, 0]}
    />
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#020608"]} />

      <ambientLight intensity={0.1} />

      <Stars
        radius={80}
        depth={40}
        count={1800}
        factor={1.5}
        fade
        speed={0.2}
      />

      <SpatialGrid />

      <SystemCore />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={7}
        maxDistance={20}
      />
    </>
  );
}

/* =========================================================
   UI HELPERS
   ========================================================= */

function StatusIndicator({
  status,
}: {
  status: SystemStatus;
}) {
  const classes = {
    online: "bg-cyan-300 shadow-[0_0_10px_#67e8f9]",
    processing:
      "bg-blue-300 shadow-[0_0_10px_#93c5fd] animate-pulse",
    warning:
      "bg-amber-300 shadow-[0_0_10px_#fcd34d]",
    offline: "bg-red-400",
  };

  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${classes[status]}`}
    />
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-[74px] items-center justify-between border-b border-white/[0.06] bg-black/35 px-7 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04]">
          <div className="h-3 w-3 rotate-45 border border-cyan-200 shadow-[0_0_15px_rgba(103,232,249,.5)]" />
        </div>

        <div>
          <div className="text-sm font-medium tracking-[0.35em] text-white">
            ARCHOS
          </div>

          <div className="mt-1 text-[8px] tracking-[0.28em] text-slate-500">
            AUTONOMOUS INTELLIGENCE SYSTEM
          </div>
        </div>
      </div>

      <div className="flex items-center gap-7">
        <div className="text-right">
          <div className="text-[8px] tracking-[0.25em] text-slate-600">
            SYSTEM STATE
          </div>

          <div className="mt-1 flex items-center justify-end gap-2 text-[10px] tracking-[0.15em] text-cyan-200">
            <StatusIndicator status="online" />
            OPERATIONAL
          </div>
        </div>

        <div className="h-7 w-px bg-white/[0.07]" />

        <div className="text-right">
          <div className="text-[8px] tracking-[0.25em] text-slate-600">
            UTC
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-300">
            11:03:42
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   LEFT NAVIGATION
   ========================================================= */

function ModuleNavigation({
  activeModule,
  setActiveModule,
}: {
  activeModule: string;
  setActiveModule: (id: string) => void;
}) {
  return (
    <aside className="absolute bottom-20 left-5 top-[94px] z-20 w-[245px]">
      <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-black/30 p-3 backdrop-blur-xl">
        <div className="px-3 pb-3 pt-2">
          <div className="text-[8px] font-medium tracking-[0.3em] text-slate-600">
            SYSTEM ARCHITECTURE
          </div>
        </div>

        <div className="space-y-1">
          {modules.map((module) => {
            const active = activeModule === module.id;

            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`group w-full rounded-xl px-3 py-3 text-left transition ${
                  active
                    ? "border border-cyan-300/15 bg-cyan-300/[0.06]"
                    : "border border-transparent hover:bg-white/[0.025]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <StatusIndicator status={module.status} />

                  <span
                    className={`text-[10px] tracking-[0.12em] ${
                      active
                        ? "text-cyan-100"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {module.label}
                  </span>

                  <span className="ml-auto text-[9px] text-slate-700">
                    →
                  </span>
                </div>

                {active && (
                  <div className="mt-2 pl-4 text-[8px] leading-4 text-slate-600">
                    {module.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto border-t border-white/[0.05] px-3 pt-4">
          <div className="mb-3 text-[8px] tracking-[0.25em] text-slate-600">
            SYSTEM LOAD
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full w-[37%] rounded-full bg-cyan-300/60" />
          </div>

          <div className="mt-2 flex justify-between text-[8px] text-slate-600">
            <span>CPU</span>
            <span>37%</span>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full w-[54%] rounded-full bg-cyan-300/40" />
          </div>

          <div className="mt-2 flex justify-between text-[8px] text-slate-600">
            <span>MEMORY</span>
            <span>54%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   RIGHT INTELLIGENCE PANEL
   ========================================================= */

function IntelligencePanel({
  activeModule,
}: {
  activeModule: string;
}) {
  const module = modules.find((m) => m.id === activeModule);

  return (
    <aside className="absolute bottom-20 right-5 top-[94px] z-20 w-[300px]">
      <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-black/30 p-4 backdrop-blur-xl">
        <div className="border-b border-white/[0.05] pb-4">
          <div className="text-[8px] tracking-[0.28em] text-slate-600">
            ACTIVE CONTEXT
          </div>

          <div className="mt-2 text-sm tracking-[0.08em] text-white">
            {module?.label}
          </div>

          <div className="mt-1 text-[9px] text-slate-500">
            {module?.description}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Metric
            label="STATE"
            value={module?.status.toUpperCase() ?? "UNKNOWN"}
          />

          <Metric
            label="CONFIDENCE"
            value="94.72%"
          />

          <Metric
            label="LATENCY"
            value="41 MS"
          />

          <Metric
            label="ACTIVE TASKS"
            value="12"
          />

          <Metric
            label="LAST UPDATE"
            value="13:03:42"
          />
        </div>

        <div className="mt-6 border-t border-white/[0.05] pt-5">
          <div className="mb-3 text-[8px] tracking-[0.25em] text-slate-600">
            ACTIVITY
          </div>

          <div className="space-y-3">
            <ActivityLine label="Input" value="Received" />
            <ActivityLine label="Processing" value="Active" />
            <ActivityLine label="Validation" value="Passed" />
            <ActivityLine label="Output" value="Ready" />
          </div>
        </div>

        <div className="mt-auto rounded-xl border border-cyan-300/10 bg-cyan-300/[0.025] p-3">
          <div className="text-[8px] tracking-[0.2em] text-cyan-300/60">
            ARCHOS STATE
          </div>

          <div className="mt-2 text-[9px] leading-5 text-slate-500">
            System state is continuously synchronized with
            the active intelligence and experience layers.
          </div>
        </div>
      </div>
    </aside>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
      <span className="text-[8px] tracking-[0.2em] text-slate-600">
        {label}
      </span>

      <span className="font-mono text-[9px] text-cyan-100">
        {value}
      </span>
    </div>
  );
}

function ActivityLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-[9px]">
      <span className="h-1 w-1 rounded-full bg-cyan-300" />
      <span className="text-slate-600">{label}</span>
      <span className="ml-auto text-slate-400">{value}</span>
    </div>
  );
}

/* =========================================================
   EVENT STREAM
   ========================================================= */

function EventStream() {
  return (
    <div className="absolute bottom-[86px] left-1/2 z-20 w-[420px] -translate-x-1/2">
      <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-[8px] tracking-[0.25em] text-slate-600">
            LIVE EVENT STREAM
          </span>

          <span className="flex items-center gap-2 text-[8px] text-cyan-300/70">
            <StatusIndicator status="online" />
            LIVE
          </span>
        </div>

        <div className="space-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.025]"
            >
              <span className="font-mono text-[8px] text-slate-700">
                {event.time}
              </span>

              <span className="w-12 text-[7px] tracking-[0.15em] text-cyan-300/50">
                {event.type}
              </span>

              <span className="truncate text-[8px] text-slate-500">
                {event.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMMAND BAR
   ========================================================= */

function CommandBar() {
  const [command, setCommand] = useState("");

  const submit = () => {
    if (!command.trim()) return;

    console.log("ARCHOS COMMAND:", command);

    setCommand("");
  };

  return (
    <div className="absolute bottom-5 left-1/2 z-30 w-[min(720px,calc(100%-40px))] -translate-x-1/2">
      <div className="flex items-center rounded-2xl border border-white/[0.09] bg-black/55 px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl">
        <span className="mr-3 text-cyan-300/70">⌁</span>

        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Command ArchOS..."
          className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-700"
        />

        <button
          onClick={submit}
          className="ml-3 rounded-lg border border-cyan-300/10 px-3 py-1.5 text-[8px] tracking-[0.2em] text-cyan-200/70 transition hover:bg-cyan-300/[0.06]"
        >
          EXECUTE
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FOOTER
   ========================================================= */

function Footer() {
  return (
    <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-20">
      <div className="flex items-end justify-between">
        <div className="text-[7px] leading-4 tracking-[0.15em] text-slate-700">
          <div>ARCHOS CORE</div>
          <div>EXPERIENCE ENGINE</div>
          <div>SPATIAL RUNTIME</div>
        </div>

        <div className="text-right text-[7px] leading-4 tracking-[0.15em] text-slate-700">
          <div>SECURE SESSION</div>
          <div>INTEGRITY 99.98%</div>
          <div>BUILD 0.1.0</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN UI
   ========================================================= */

export default function ArchOSSystemUI() {
  const [activeModule, setActiveModule] = useState("world");

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#020608] font-sans text-white">
      {/* 3D environment */}
      <Canvas
        camera={{
          position: [0, 1, 12],
          fov: 48,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>

      {/* Interface */}
      <Header />

      <ModuleNavigation
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      <IntelligencePanel activeModule={activeModule} />

      <EventStream />

      <CommandBar />

      <Footer />

      {/* subtle center reticle */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[260px] w-[260px] rounded-full border border-cyan-300/[0.035]" />
        <div className="absolute inset-[35px] rounded-full border border-cyan-300/[0.025]" />
      </div>
    </main>
  );
}
