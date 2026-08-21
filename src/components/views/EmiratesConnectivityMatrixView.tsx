import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Globe,
  Building,
  Activity,
  Zap,
  TrendingUp,
  Shield,
  Volume2,
  CheckCircle2,
  Coins,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';

export interface EmirateProfile {
  id: string;
  nameEn: string;
  nameAr: string;
  capital: string;
  populationMillions: number;
  gdpBillionAed: number;
  cleanEnergyPct: number;
  activeMegaprojects: number;
  digitalTwinReadinessPct: number;
  specialization: string;
  keyAssets: string[];
}

export const EMIRATES_DATA: EmirateProfile[] = [
  {
    id: 'abu-dhabi',
    nameEn: 'Abu Dhabi',
    nameAr: 'أبوظبي',
    capital: 'Abu Dhabi City',
    populationMillions: 3.8,
    gdpBillionAed: 1140,
    cleanEnergyPct: 35,
    activeMegaprojects: 28,
    digitalTwinReadinessPct: 96,
    specialization: 'Energy Sovereignty, Sovereign Wealth, Cultural Heritage & Aerospace',
    keyAssets: ['Barakah Nuclear Plant', 'Saadiyat Cultural District', 'Masdar City', 'ADIO Innovation Hub']
  },
  {
    id: 'dubai',
    nameEn: 'Dubai',
    nameAr: 'دبي',
    capital: 'Dubai City',
    populationMillions: 3.7,
    gdpBillionAed: 520,
    cleanEnergyPct: 24,
    activeMegaprojects: 46,
    digitalTwinReadinessPct: 98,
    specialization: 'Global Trade, FinTech, Autonomous Mobility, Tourism & PropTech',
    keyAssets: ['DIFC Gate', 'Burj Khalifa', 'Jebel Ali Port', 'MBR Solar Park', 'DWC Mega-Hub']
  },
  {
    id: 'sharjah',
    nameEn: 'Sharjah',
    nameAr: 'الشارقة',
    capital: 'Sharjah City',
    populationMillions: 1.8,
    gdpBillionAed: 145,
    cleanEnergyPct: 18,
    activeMegaprojects: 16,
    digitalTwinReadinessPct: 88,
    specialization: 'Education & Research, Islamic Heritage, Light Industry & Publishing',
    keyAssets: ['University City', 'Sharjah Research Technology Park', 'Khorfakkan Port', 'Beeah HQ']
  },
  {
    id: 'ras-al-khaimah',
    nameEn: 'Ras Al Khaimah',
    nameAr: 'رأس الخيمة',
    capital: 'RAK City',
    populationMillions: 0.45,
    gdpBillionAed: 48,
    cleanEnergyPct: 22,
    activeMegaprojects: 12,
    digitalTwinReadinessPct: 84,
    specialization: 'Manufacturing, High-Yield Hospitality, Quarrying & Ecotourism',
    keyAssets: ['Jebel Jais Peak', 'RAK Ports', 'Al Marjan Island', 'RAKEZ Economic Zone']
  },
  {
    id: 'fujairah',
    nameEn: 'Fujairah',
    nameAr: 'الفجيرة',
    capital: 'Fujairah City',
    populationMillions: 0.32,
    gdpBillionAed: 32,
    cleanEnergyPct: 15,
    activeMegaprojects: 9,
    digitalTwinReadinessPct: 80,
    specialization: 'Deep-Water Bunkering, Strategic Oil Storage & Mining Logistics',
    keyAssets: ['Port of Fujairah', 'Habshan-Fujairah Pipeline', 'Etihad Rail Eastern Terminal']
  },
  {
    id: 'ajman',
    nameEn: 'Ajman',
    nameAr: 'عجمان',
    capital: 'Ajman City',
    populationMillions: 0.54,
    gdpBillionAed: 36,
    cleanEnergyPct: 12,
    activeMegaprojects: 7,
    digitalTwinReadinessPct: 78,
    specialization: 'Maritime Repair, Real Estate, SME Logistics & Freezones',
    keyAssets: ['Ajman Free Zone', 'Al Zorah Eco-Reserve', 'Arab Heavy Industries']
  },
  {
    id: 'umm-al-quwain',
    nameEn: 'Umm Al Quwain',
    nameAr: 'أم القيوين',
    capital: 'UAQ City',
    populationMillions: 0.1,
    gdpBillionAed: 18,
    cleanEnergyPct: 28,
    activeMegaprojects: 5,
    digitalTwinReadinessPct: 75,
    specialization: 'Desalination Hub, Blue Economy, Sustainable Mariculture & Leisure',
    keyAssets: ['UAQ 150 MIGD Desalination Plant', 'Al Sinniyah Island Eco-Reserve']
  }
];

export const EmiratesConnectivityMatrixView: React.FC = () => {
  const [emirates, setEmirates] = useState<EmirateProfile[]>(EMIRATES_DATA);
  const [selectedEmirateId, setSelectedEmirateId] = useState<string>('abu-dhabi');

  const activeEmirate = emirates.find((e) => e.id === selectedEmirateId) || emirates[0];

  const totalGdp = emirates.reduce((acc, curr) => acc + curr.gdpBillionAed, 0);
  const totalPop = emirates.reduce((acc, curr) => acc + curr.populationMillions, 0);
  const totalProjects = emirates.reduce((acc, curr) => acc + curr.activeMegaprojects, 0);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#03060d] select-none font-mono-tech">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#00e5ff]/20 bg-[#070c16]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#f5f4f0] uppercase tracking-wider">
                7 EMIRATES SOVEREIGN INTER-CONNECTIVITY MESH
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                PAN-UAE FEDERATION MATRIX
              </span>
            </div>
            <p className="text-[11px] text-[#8e8d88]">
              Cross-Emirate GDP Telemetry · Digital Twin Readiness · High-Speed Transport & Grid Interlinks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              speechService.speak(
                `Pan-UAE Federal Overview. Combined federation GDP stands at ${totalGdp.toLocaleString()} Billion AED across ${totalPop.toFixed(1)} Million residents, with ${totalProjects} active sovereign megaprojects.`
              );
            }}
            className="px-3 py-1.5 rounded-xl bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Volume2 size={14} />
            <span>AUDIBLE FEDERATION BRIEFING</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 7 Emirates List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/30 backdrop-blur-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                7 EMIRATES FEDERATION
              </span>
              <span className="text-[10px] text-[#10b981] font-bold">100% INTERCONNECTED</span>
            </div>

            <div className="flex flex-col gap-2">
              {emirates.map((em) => {
                const isSelected = em.id === selectedEmirateId;
                return (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmirateId(em.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        : 'bg-[#091220] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{em.nameEn}</span>
                        <span className="text-xs text-[#00e5ff] font-arabic">{em.nameAr}</span>
                      </div>
                      <span className="text-xs font-bold text-[#d4ff00]">
                        AED {em.gdpBillionAed}B GDP
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8e8d88]">
                      <span>Pop: {em.populationMillions}M</span>
                      <span className="text-[#10b981] font-bold">{em.activeMegaprojects} Megaprojects</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[#8e8d88] border-t border-white/5 pt-1">
                      <span>Clean Energy: {em.cleanEnergyPct}%</span>
                      <span className="text-[#00e5ff] font-bold">Twin Readiness: {em.digitalTwinReadinessPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Emirate Deep Profile (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-[#00e5ff]/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-3">
              <div>
                <span className="text-[10px] text-[#00e5ff] font-bold uppercase tracking-wider">
                  SOVEREIGN EMIRATE PROFILE
                </span>
                <h2 className="text-base font-bold text-[#f5f4f0]">{activeEmirate.nameEn} ({activeEmirate.nameAr})</h2>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-[#00e5ff]/20 text-[#00e5ff] font-bold border border-[#00e5ff]/40">
                CAPITAL: {activeEmirate.capital.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-[#8e8d88] leading-relaxed">
              <strong className="text-white">Core Specialization:</strong> {activeEmirate.specialization}
            </p>

            {/* Strategic Metric Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Nominal GDP</span>
                <span className="text-base font-bold text-[#d4ff00]">
                  AED {activeEmirate.gdpBillionAed}B
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Population</span>
                <span className="text-base font-bold text-white">
                  {activeEmirate.populationMillions} Million
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-[#8e8d88]">Digital Twin Sync</span>
                <span className="text-base font-bold text-[#00e5ff]">
                  {activeEmirate.digitalTwinReadinessPct}%
                </span>
              </div>
            </div>

            {/* Key Strategic Infrastructure Assets */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <span className="text-[10px] text-[#00e5ff] font-bold uppercase tracking-wider">
                STRATEGIC INFRASTRUCTURE ASSETS
              </span>
              <div className="grid grid-cols-2 gap-2">
                {activeEmirate.keyAssets.map((asset, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-200 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#10b981] shrink-0" />
                    <span className="truncate">{asset}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
