import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Train,
  Zap,
  Ship,
  Plane,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Crosshair,
  Volume2
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';

export interface InfrastructureProject {
  id: string;
  name: string;
  category: 'TRANSIT' | 'ENERGY' | 'LOGISTICS' | 'AVIATION' | 'WATER';
  emirate: string;
  budgetAed: string;
  completionPct: number;
  status: 'ACTIVE_BUILD' | 'EXPANSION' | 'OPERATIONAL' | 'COMMISSIONING';
  targetYear: string;
  screenPos: { x: number; y: number }; // Relative percentage (0-100) on HUD canvas
  laserOrigin: { x: number; y: number }; // HUD projection source
  description: string;
  metrics: { label: string; value: string }[];
}

export const UAE_INFRASTRUCTURE_PROJECTS: InfrastructureProject[] = [
  {
    id: 'metro-blue-line',
    name: 'Dubai Metro Blue Line Expansion',
    category: 'TRANSIT',
    emirate: 'Dubai',
    budgetAed: 'AED 18.0 Billion',
    completionPct: 42,
    status: 'ACTIVE_BUILD',
    targetYear: '2029',
    screenPos: { x: 58, y: 34 },
    laserOrigin: { x: 50, y: 15 },
    description: '30km rapid transit route featuring 14 stations connecting Dubai Creek Harbour, Academic City, and Mirdif.',
    metrics: [
      { label: 'Daily Ridership', value: '320,000' },
      { label: 'Viaduct Length', value: '15.5 km' },
      { label: 'Tunnel Length', value: '14.5 km' }
    ]
  },
  {
    id: 'etihad-rail',
    name: 'Etihad Rail Sovereign Network',
    category: 'TRANSIT',
    emirate: 'Pan-UAE',
    budgetAed: 'AED 50.0 Billion',
    completionPct: 88,
    status: 'EXPANSION',
    targetYear: '2026',
    screenPos: { x: 38, y: 62 },
    laserOrigin: { x: 20, y: 80 },
    description: '1,200km sovereign rail spine linking Ghuweifat on Saudi border through Abu Dhabi, Dubai to Fujairah port.',
    metrics: [
      { label: 'Freight Capacity', value: '60M Tons/yr' },
      { label: 'Passenger Speed', value: '200 km/h' },
      { label: 'CO2 Reduction', value: '21% Net' }
    ]
  },
  {
    id: 'mbr-solar-park',
    name: 'MBR Solar Park (Phase VI)',
    category: 'ENERGY',
    emirate: 'Dubai',
    budgetAed: 'AED 5.5 Billion',
    completionPct: 76,
    status: 'COMMISSIONING',
    targetYear: '2026',
    screenPos: { x: 68, y: 72 },
    laserOrigin: { x: 80, y: 90 },
    description: 'World’s largest single-site solar park with 5,000 MW planned capacity by 2030, saving 6.5M tons of carbon annually.',
    metrics: [
      { label: 'Phase VI Output', value: '1,800 MW' },
      { label: 'LCOE Rate', value: '$0.0162 /kWh' },
      { label: 'CSP Tower Height', value: '262 meters' }
    ]
  },
  {
    id: 'dwc-airport-mega',
    name: 'Al Maktoum Int Airport Mega-Hub',
    category: 'AVIATION',
    emirate: 'Dubai',
    budgetAed: 'AED 128.0 Billion',
    completionPct: 28,
    status: 'ACTIVE_BUILD',
    targetYear: '2034',
    screenPos: { x: 32, y: 48 },
    laserOrigin: { x: 15, y: 30 },
    description: 'Next-gen global aviation hub spanning 70 sq km with 5 parallel runways and 260M passenger annual capacity.',
    metrics: [
      { label: 'Passenger Cap', value: '260 Million' },
      { label: 'Cargo Throughput', value: '12M Tons' },
      { label: 'Aircraft Gates', value: '400+ Contact' }
    ]
  },
  {
    id: 'boxbay-jebel-ali',
    name: 'DP World BoxBay Automated High-Bay',
    category: 'LOGISTICS',
    emirate: 'Dubai',
    budgetAed: 'AED 3.8 Billion',
    completionPct: 94,
    status: 'OPERATIONAL',
    targetYear: '2026',
    screenPos: { x: 24, y: 55 },
    laserOrigin: { x: 10, y: 65 },
    description: 'High-bay container storage racking system with 100% automated electric cranes and direct quay crane handoffs.',
    metrics: [
      { label: 'Footprint Saved', value: '70% Land' },
      { label: 'Handling Speed', value: '3x Faster' },
      { label: 'Solar Rooftop', value: '100% Net Zero' }
    ]
  },
  {
    id: 'hassyan-desal',
    name: 'Hassyan Sea Water Reverse Osmosis',
    category: 'WATER',
    emirate: 'Dubai',
    budgetAed: 'AED 3.3 Billion',
    completionPct: 62,
    status: 'ACTIVE_BUILD',
    targetYear: '2027',
    screenPos: { x: 26, y: 78 },
    laserOrigin: { x: 20, y: 95 },
    description: 'World’s largest solar-powered RO water desalination project producing 180M imperial gallons per day (MIGD).',
    metrics: [
      { label: 'Daily Output', value: '180 MIGD' },
      { label: 'Energy Demand', value: '< 2.8 kWh/m³' },
      { label: 'Potable Purity', value: '99.98%' }
    ]
  }
];

interface InfrastructureHUDOverlayProps {
  isVisible: boolean;
  onToggleVisible: () => void;
  onSelectProject?: (proj: InfrastructureProject) => void;
}

export const InfrastructureHUDOverlay: React.FC<InfrastructureHUDOverlayProps> = ({
  isVisible,
  onToggleVisible,
  onSelectProject
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('metro-blue-line');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isParticleEngineActive, setIsParticleEngineActive] = useState(true);

  const activeProject = UAE_INFRASTRUCTURE_PROJECTS.find((p) => p.id === selectedProjectId) || UAE_INFRASTRUCTURE_PROJECTS[0];

  const filteredProjects =
    categoryFilter === 'ALL'
      ? UAE_INFRASTRUCTURE_PROJECTS
      : UAE_INFRASTRUCTURE_PROJECTS.filter((p) => p.category === categoryFilter);

  // Dynamic Particle & Laser Beam Animation Loop on HTML5 Canvas
  useEffect(() => {
    if (!isVisible || !canvasRef.current || !isParticleEngineActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: {
      x: number;
      y: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      progress: number;
      speed: number;
      color: string;
      size: number;
    }[] = [];

    // Initialize flowing photon particles between laser origins and project coordinates
    const initParticles = () => {
      const w = canvas.width;
      const h = canvas.height;
      particles = [];

      filteredProjects.forEach((proj) => {
        const startX = (proj.laserOrigin.x / 100) * w;
        const startY = (proj.laserOrigin.y / 100) * h;
        const endX = (proj.screenPos.x / 100) * w;
        const endY = (proj.screenPos.y / 100) * h;

        const count = proj.id === selectedProjectId ? 20 : 8;
        const color =
          proj.category === 'TRANSIT'
            ? '#00e5ff'
            : proj.category === 'ENERGY'
            ? '#f59e0b'
            : proj.category === 'LOGISTICS'
            ? '#10b981'
            : proj.category === 'AVIATION'
            ? '#38bdf8'
            : '#06b6d4';

        for (let i = 0; i < count; i++) {
          particles.push({
            x: startX,
            y: startY,
            startX,
            startY,
            endX,
            endY,
            progress: Math.random(),
            speed: 0.004 + Math.random() * 0.008,
            color,
            size: 1.5 + Math.random() * 2.5
          });
        }
      });
    };

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        initParticles();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw glowing laser lines connecting origins to target reticles
      filteredProjects.forEach((proj) => {
        const startX = (proj.laserOrigin.x / 100) * w;
        const startY = (proj.laserOrigin.y / 100) * h;
        const endX = (proj.screenPos.x / 100) * w;
        const endY = (proj.screenPos.y / 100) * h;
        const isSelected = proj.id === selectedProjectId;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);

        ctx.strokeStyle = isSelected ? '#00e5ff' : 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = isSelected ? 2.2 : 1.0;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = isSelected ? 12 : 4;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -frameCount * 0.5;
        ctx.stroke();
        ctx.restore();

        // Target Reticle Rings
        ctx.save();
        ctx.beginPath();
        ctx.arc(endX, endY, isSelected ? 18 : 10, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#d4ff00' : 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.shadowColor = isSelected ? '#d4ff00' : '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Center Pulsing Core
        ctx.beginPath();
        const pulseSize = (Math.sin(frameCount * 0.1) + 1.2) * (isSelected ? 3.5 : 2);
        ctx.arc(endX, endY, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#d4ff00' : '#00e5ff';
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw moving photon particles along laser lines
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        p.x = p.startX + (p.endX - p.startX) * p.progress;
        p.y = p.startY + (p.endY - p.startY) * p.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, selectedProjectId, categoryFilter, isParticleEngineActive]);

  const handleSelect = (proj: InfrastructureProject) => {
    setSelectedProjectId(proj.id);
    if (onSelectProject) onSelectProject(proj);
    speechService.speak(`Locking HUD laser telemetry on ${proj.name}. Progress at ${proj.completionPct} percent.`);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisible}
        className="absolute top-20 left-4 z-30 px-3 py-1.5 rounded-xl bg-[#060c18]/90 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold font-mono-tech flex items-center gap-2 backdrop-blur-xl shadow-2xl hover:bg-[#00e5ff]/20 hover:scale-105 transition-all cursor-pointer"
      >
        <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
        <span>SHOW INFRASTRUCTURE HUD</span>
      </button>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30 font-mono-tech select-none overflow-hidden">
      {/* Dynamic Glowing HTML5 Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* TOP HUD CONTROLS BAR (Pointer-events-auto) */}
      <div className="absolute top-16 left-4 z-40 flex items-center gap-2 pointer-events-auto">
        <div className="p-2 rounded-xl bg-[#060c18]/95 border border-[#00e5ff]/50 backdrop-blur-xl shadow-2xl flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00e5ff]/15 text-[#00e5ff] text-[11px] font-bold border border-[#00e5ff]/40">
            <Radio size={13} className="animate-pulse" />
            <span>INFRASTRUCTURE LASER HUD</span>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 bg-[#091220] p-0.5 rounded-lg border border-white/10 text-[10px]">
            {(['ALL', 'TRANSIT', 'ENERGY', 'LOGISTICS', 'AVIATION', 'WATER'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded font-bold transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_8px_#00e5ff]'
                    : 'text-[#8e8d88] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Close HUD Button */}
          <button
            onClick={onToggleVisible}
            className="px-2 py-1 rounded text-[10px] text-[#8e8d88] hover:text-[#ec4899] hover:bg-[#ec4899]/10 transition-all font-bold"
          >
            HIDE HUD
          </button>
        </div>
      </div>

      {/* FLOATING INTERACTIVE PROJECT RETICLE LABELS ACROSS SCREEN */}
      {filteredProjects.map((proj) => {
        const isSelected = proj.id === selectedProjectId;
        return (
          <div
            key={proj.id}
            style={{
              left: `${proj.screenPos.x}%`,
              top: `${proj.screenPos.y}%`
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
            onClick={() => handleSelect(proj)}
          >
            {/* Holographic Label Card Tag */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className={`px-2.5 py-1.5 rounded-xl border backdrop-blur-xl transition-all shadow-2xl flex flex-col gap-0.5 ${
                isSelected
                  ? 'bg-[#060c18]/95 border-[#d4ff00] text-[#d4ff00] shadow-[0_0_20px_rgba(212,255,0,0.35)] -translate-y-9'
                  : 'bg-[#060c18]/85 border-[#00e5ff]/40 text-[#00e5ff] hover:border-[#00e5ff] -translate-y-8'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#d4ff00] animate-ping' : 'bg-[#00e5ff]'}`} />
                <span className="truncate max-w-[140px] text-white">{proj.name}</span>
                <span className="text-[9px] opacity-80">{proj.completionPct}%</span>
              </div>
              <div className="flex items-center justify-between text-[8px] text-[#8e8d88] border-t border-white/10 pt-0.5">
                <span>{proj.budgetAed}</span>
                <span className="text-[#00e5ff] font-bold">{proj.status}</span>
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* BOTTOM RIGHT HIGH-TECH PROJECT TELEMETRY CARD */}
      <AnimatePresence>
        {activeProject && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-6 right-6 z-40 w-84 p-4 rounded-2xl bg-[#060c18]/95 border border-[#00e5ff]/50 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,229,255,0.2)] pointer-events-auto flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff]">
                  {activeProject.category === 'TRANSIT' && <Train size={15} />}
                  {activeProject.category === 'ENERGY' && <Zap size={15} />}
                  {activeProject.category === 'LOGISTICS' && <Ship size={15} />}
                  {activeProject.category === 'AVIATION' && <Plane size={15} />}
                  {activeProject.category === 'WATER' && <Activity size={15} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#00e5ff] font-bold tracking-wider uppercase">
                    PROJECT LASER TELEMETRY
                  </span>
                  <span className="text-xs font-bold text-[#f5f4f0] truncate max-w-[190px]">
                    {activeProject.name}
                  </span>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold border border-[#10b981]/40">
                {activeProject.status}
              </span>
            </div>

            {/* Description */}
            <p className="text-[10px] text-[#8e8d88] leading-relaxed">
              {activeProject.description}
            </p>

            {/* Progress Gauge */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#8e8d88]">As-Built Completion:</span>
                <span className="font-bold text-[#d4ff00]">{activeProject.completionPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#111622] overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00e5ff] via-[#10b981] to-[#d4ff00] shadow-[0_0_10px_#00e5ff]"
                  style={{ width: `${activeProject.completionPct}%` }}
                />
              </div>
            </div>

            {/* 3 Key Metrics */}
            <div className="grid grid-cols-3 gap-1.5 text-[9px] pt-1 border-t border-white/10">
              {activeProject.metrics.map((m, idx) => (
                <div key={idx} className="p-1.5 rounded-lg bg-white/5 flex flex-col">
                  <span className="text-[#8e8d88] text-[8px] truncate">{m.label}</span>
                  <span className="font-bold text-white text-[10px] truncate">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Voice Narrative & Action */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  speechService.speak(
                    `${activeProject.name} in ${activeProject.emirate}. Allocated budget of ${activeProject.budgetAed}. Completion is at ${activeProject.completionPct} percent toward ${activeProject.targetYear} commissioning.`
                  );
                }}
                className="flex-1 py-1.5 rounded-lg bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/40 text-[#00e5ff] text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Volume2 size={12} />
                <span>Audible Briefing</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
