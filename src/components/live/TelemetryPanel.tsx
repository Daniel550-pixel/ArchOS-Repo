import React, { useState } from 'react';
import { useArchOSStore } from '../../store/archosStore';
import { Activity, Radio, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { startSonify, stopSonify, isSonifying } from '../../services/sonify';

interface TelemetryPanelProps {
  className?: string;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ className = '' }) => {
  const { sensors, isTelemetryPanelOpen, setTelemetryPanelOpen } = useArchOSStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sonifyOn, setSonifyOn] = useState(isSonifying());

  const toggleSonify = () => {
    if (sonifyOn) {
      stopSonify();
      setSonifyOn(false);
    } else {
      startSonify(() => {
        const strain = sensors.find(s => s.id === 's1')?.value ?? 142;
        const power = sensors.find(s => s.id === 's2')?.value ?? 8.4;
        const accel = sensors.find(s => s.id === 's3')?.value ?? 0.012;
        return { strain_mpa: strain, power_mw: power, accel_ms2: accel };
      });
      setSonifyOn(true);
    }
  };

  if (!isTelemetryPanelOpen) return null;

  return (
    <div
      className={`rounded-xl border border-[#00e5ff]/30 bg-[#070d18]/90 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.15)] font-mono-tech select-none overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0a1222]/80 border-b border-[#00e5ff]/20">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e5ff]"></span>
          </div>
          <Activity className="w-4 h-4 text-[#00e5ff]" />
          <h3 className="text-xs font-bold tracking-wider text-[#00e5ff]">DIGITAL TWIN TELEMETRY</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSonify}
            title={sonifyOn ? 'Mute Sonification' : 'Sonify Urban Telemetry'}
            className={`text-[9px] px-2 py-0.5 rounded border flex items-center gap-1 font-bold transition-all cursor-pointer ${
              sonifyOn
                ? 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/50 shadow-[0_0_8px_rgba(212,255,0,0.3)] animate-pulse'
                : 'bg-white/5 text-zinc-400 hover:text-white border-white/20'
            }`}
          >
            {sonifyOn ? <Volume2 size={10} /> : <VolumeX size={10} />}
            <span>{sonifyOn ? 'SONIFYING' : 'SONIFY'}</span>
          </button>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00e5ff]/30 text-[#00e5ff] bg-[#00e5ff]/10">
            1 Hz LIVE
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-white/10 text-[#8e8d88] hover:text-[#f5f4f0] transition-colors"
            title={isCollapsed ? 'Expand Telemetry Panel' : 'Collapse Telemetry Panel'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-3 space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-2">
            {sensors.map((s) => {
              const isWarning = s.status === 'warning';
              const isCritical = s.status === 'critical';
              const strokeColor = isCritical ? '#ff006e' : isWarning ? '#ff6b35' : '#00e5ff';
              const min = Math.min(...s.history);
              const max = Math.max(...s.history);
              const range = max - min || 1;

              return (
                <div
                  key={s.id}
                  className="border border-white/10 rounded-lg p-2.5 bg-[#09101c]/80 hover:border-[#00e5ff]/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isWarning ? (
                        <AlertTriangle className="w-3 h-3 text-[#ff6b35]" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-[#00e5ff]" />
                      )}
                      <span className="text-[11px] font-semibold text-[#f5f4f0]">{s.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold font-mono tracking-wide ${
                          isCritical
                            ? 'text-[#ff006e]'
                            : isWarning
                            ? 'text-[#ff6b35]'
                            : 'text-[#00e5ff]'
                        }`}
                      >
                        {typeof s.value === 'number' && s.value < 1 ? s.value.toFixed(3) : s.value.toLocaleString()}{' '}
                        <span className="text-[10px] font-normal text-[#8e8d88]">{s.unit}</span>
                      </span>
                    </div>
                  </div>

                  {/* Realtime Vector Sparkline */}
                  <div className="relative h-6 w-full bg-[#05080e]/60 rounded border border-white/5 px-1 py-0.5 flex items-center">
                    <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
                      <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={s.history
                          .map((v, i) => {
                            const y = 20 - ((v - min) / range) * 16;
                            const x = (i / Math.max(1, s.history.length - 1)) * 100;
                            return `${x.toFixed(1)},${y.toFixed(1)}`;
                          })
                          .join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-[9px] text-[#8e8d88]">
            <span className="flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-[#00e5ff] animate-pulse" />
              Sovereign Twin Sync
            </span>
            <span>B-4471 Tower Core</span>
          </div>
        </div>
      )}
    </div>
  );
};
