import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plane,
  Radio,
  Shield,
  Activity,
  Zap,
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Volume2,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Box,
  Fuel,
  Cpu
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';

export interface DroneCorridor {
  id: string;
  name: string;
  altitudeBand: string;
  activeDrones: number;
  maxCapacity: number;
  status: 'CLEAR' | 'CONGESTED' | 'MAINTENANCE' | 'EMERGENCY_CORRIDOR';
  origin: string;
  destination: string;
  averageSpeedKmh: number;
  throughputHourly: number;
}

export interface VertiportHub {
  id: string;
  name: string;
  district: string;
  emirate: string;
  padsTotal: number;
  padsOccupied: number;
  chargingRateKw: number;
  nextDeparture: string;
  batteryStatusPct: number;
}

export const DRONE_CORRIDORS: DroneCorridor[] = [
  {
    id: 'corridor-alpha',
    name: 'DIFC to Palm Jumeirah Sky-Express',
    altitudeBand: '120m - 180m AGL',
    activeDrones: 18,
    maxCapacity: 30,
    status: 'CLEAR',
    origin: 'DIFC Gate Vertiport',
    destination: 'Palm West Beach Hub',
    averageSpeedKmh: 110,
    throughputHourly: 140
  },
  {
    id: 'corridor-bravo',
    name: 'Dubai South (DWC) to Jebel Ali Logistics Corridor',
    altitudeBand: '200m - 350m AGL',
    activeDrones: 44,
    maxCapacity: 50,
    status: 'CONGESTED',
    origin: 'DWC Cargo Sky-Gate',
    destination: 'BoxBay Automated Terminal',
    averageSpeedKmh: 135,
    throughputHourly: 280
  },
  {
    id: 'corridor-charlie',
    name: 'Downtown to Creek Harbour Autonomous Shuttle',
    altitudeBand: '150m - 220m AGL',
    activeDrones: 12,
    maxCapacity: 25,
    status: 'CLEAR',
    origin: 'Burj Khalifa North Pad',
    destination: 'Creek Marina Vertiport',
    averageSpeedKmh: 95,
    throughputHourly: 110
  },
  {
    id: 'corridor-delta',
    name: 'Abu Dhabi Yas Island to Saadiyat Cultural Transit',
    altitudeBand: '100m - 160m AGL',
    activeDrones: 8,
    maxCapacity: 20,
    status: 'CLEAR',
    origin: 'Yas Marina Pad 4',
    destination: 'Louvre Abu Dhabi Pier',
    averageSpeedKmh: 120,
    throughputHourly: 90
  }
];

export const VERTIPORT_HUBS: VertiportHub[] = [
  {
    id: 'vp-difc',
    name: 'DIFC Financial Skyport',
    district: 'DIFC',
    emirate: 'Dubai',
    padsTotal: 6,
    padsOccupied: 4,
    chargingRateKw: 350,
    nextDeparture: '2 MIN (Flight DXB-041)',
    batteryStatusPct: 98
  },
  {
    id: 'vp-palm',
    name: 'Palm Jumeirah Central Hub',
    district: 'Palm Jumeirah',
    emirate: 'Dubai',
    padsTotal: 8,
    padsOccupied: 5,
    chargingRateKw: 400,
    nextDeparture: '4 MIN (Flight DXB-088)',
    batteryStatusPct: 94
  },
  {
    id: 'vp-dwc',
    name: 'DWC Heavy Logistics Sky-Port',
    district: 'Dubai South',
    emirate: 'Dubai',
    padsTotal: 16,
    padsOccupied: 14,
    chargingRateKw: 600,
    nextDeparture: '1 MIN (Cargo DXB-902)',
    batteryStatusPct: 91
  },
  {
    id: 'vp-saadiyat',
    name: 'Saadiyat Autonomous Vertiport',
    district: 'Saadiyat Island',
    emirate: 'Abu Dhabi',
    padsTotal: 4,
    padsOccupied: 2,
    chargingRateKw: 300,
    nextDeparture: '6 MIN (Flight AUH-112)',
    batteryStatusPct: 96
  }
];

export const SkywayDroneDispatchView: React.FC = () => {
  const [corridors, setCorridors] = useState<DroneCorridor[]>(DRONE_CORRIDORS);
  const [vertiports, setVertiports] = useState<VertiportHub[]>(VERTIPORT_HUBS);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-alpha');
  const [isAutoRerouting, setIsAutoRerouting] = useState(false);
  const [rerouteMessage, setRerouteMessage] = useState<string | null>(null);

  const activeCorridor = corridors.find((c) => c.id === selectedCorridorId) || corridors[0];

  const handleTriggerDeconfliction = () => {
    setIsAutoRerouting(true);
    setRerouteMessage('Executing real-time AI trajectory deconfliction across Corridor Bravo...');
    speechService.speak('Autonomous Skyway dispatcher initiated. Dynamic flight altitude reassignment in progress.');

    setTimeout(() => {
      setCorridors((prev) =>
        prev.map((c) =>
          c.id === 'corridor-bravo'
            ? { ...c, activeDrones: 28, status: 'CLEAR', averageSpeedKmh: 140 }
            : c
        )
      );
      setIsAutoRerouting(false);
      setRerouteMessage('Deconfliction complete. Traffic density normalized to 56% across all skyway sectors.');
      setTimeout(() => setRerouteMessage(null), 5000);
    }, 2000);
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#03060d] select-none font-mono-tech">
      {/* Header Banner */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#00e5ff]/20 bg-[#070c16]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Plane className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#f5f4f0] uppercase tracking-wider">
                AUTONOMOUS SKYWAY & VERTIPORT DISPATCH
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                UAE GCAA U-SPACE CERTIFIED
              </span>
            </div>
            <p className="text-[11px] text-[#8e8d88]">
              Airspace Sector Control · Real-Time Deconfliction · 400V/800V Ultra-Fast Vertiport Grid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerDeconfliction}
            disabled={isAutoRerouting}
            className="px-3 py-1.5 rounded-xl bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/50 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutoRerouting ? 'animate-spin' : ''}`} />
            <span>AI DECONFLICTION REROUTE</span>
          </button>
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Corridor Manager (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/30 backdrop-blur-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#00e5ff]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  ACTIVE AIRSPACE CORRIDORS
                </span>
              </div>
              <span className="text-[10px] text-[#8e8d88]">4 SECTORS MONITORED</span>
            </div>

            <div className="flex flex-col gap-2">
              {corridors.map((c) => {
                const isSelected = c.id === selectedCorridorId;
                const capacityPct = Math.round((c.activeDrones / c.maxCapacity) * 100);
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCorridorId(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[240px]">
                        {c.name}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          c.status === 'CLEAR'
                            ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                            : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 animate-pulse'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8e8d88]">
                      <span>{c.origin} ➔ {c.destination}</span>
                      <span className="font-bold text-[#00e5ff]">{c.altitudeBand}</span>
                    </div>

                    {/* Capacity Bar */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[9px]">
                        <span>Airspace Load: {c.activeDrones}/{c.maxCapacity} Drones</span>
                        <span className="font-bold text-zinc-300">{capacityPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capacityPct > 80 ? 'bg-[#f59e0b]' : 'bg-[#00e5ff]'
                          }`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deconfliction Status Notification */}
          {rerouteMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/50 text-[#10b981] text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{rerouteMessage}</span>
            </motion.div>
          )}
        </div>

        {/* Center/Right Column: Corridor Telemetry & Vertiports (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Selected Corridor Holographic HUD */}
          <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-3">
              <div>
                <span className="text-[10px] text-[#00e5ff] font-bold uppercase tracking-wider">
                  SELECTED FLIGHT VECTOR TELEMETRY
                </span>
                <h2 className="text-base font-bold text-[#f5f4f0]">{activeCorridor.name}</h2>
              </div>
              <button
                onClick={() => {
                  speechService.speak(
                    `${activeCorridor.name} currently tracking ${activeCorridor.activeDrones} autonomous drones at an average velocity of ${activeCorridor.averageSpeedKmh} kilometers per hour.`
                  );
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-[#00e5ff]/20 text-[#00e5ff] border border-white/10 transition-all cursor-pointer"
              >
                <Volume2 size={15} />
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Average Velocity</span>
                <span className="text-lg font-bold text-[#00e5ff]">{activeCorridor.averageSpeedKmh} km/h</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Throughput Index</span>
                <span className="text-lg font-bold text-[#d4ff00]">{activeCorridor.throughputHourly} units/hr</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Altitude Window</span>
                <span className="text-sm font-bold text-white mt-1">{activeCorridor.altitudeBand}</span>
              </div>
            </div>
          </div>

          {/* Vertiport Infrastructure Hubs */}
          <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#d4ff00]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  SOVEREIGN VERTIPORT CHARGING GRID
                </span>
              </div>
              <span className="text-[10px] text-[#10b981] font-bold">100% SOLAR BACKED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vertiports.map((vp) => (
                <div
                  key={vp.id}
                  className="p-3.5 rounded-xl bg-[#091220] border border-white/5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[160px]">
                      {vp.name}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-zinc-300">
                      {vp.emirate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8e8d88]">
                    <span>Pad Occupancy:</span>
                    <span className="font-bold text-[#00e5ff]">{vp.padsOccupied} / {vp.padsTotal} Pads</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8e8d88]">
                    <span>Charger Output:</span>
                    <span className="font-bold text-[#d4ff00]">{vp.chargingRateKw} kW Ultra-DC</span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-[#8e8d88] border-t border-white/5 pt-1.5">
                    <span>Next Flight:</span>
                    <span className="text-emerald-400 font-bold">{vp.nextDeparture}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
