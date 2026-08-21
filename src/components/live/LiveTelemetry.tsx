import React, { useState, useRef, useEffect } from 'react';
import { GlassPanel } from '../layout/GlassPanel';
import {
  Radio,
  Lock,
  ShieldCheck,
  Key,
  Sliders,
  CheckCircle2,
  Cpu,
  Zap,
  Activity,
  Server,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';
import { useMqttTelemetry, TelemetrySample } from '../../hooks/useMqtt';
import { MqttTlsSecurityModal } from './MqttTlsSecurityModal';
import { startSonify, stopSonify, isSonifying } from '../../services/sonify';

const CHANNELS = [
  { key: 'strain_mpa' as keyof TelemetrySample, label: 'Core Strain (MPa)', max: 160, unit: 'MPa', color: '#00e5ff' },
  { key: 'accel_ms2' as keyof TelemetrySample, label: 'Spire Accel (m/s²)', max: 0.02, unit: 'm/s²', color: '#d4ff00' },
  { key: 'chiller_dt_c' as keyof TelemetrySample, label: 'Chiller ΔT (°C)', max: 7, unit: '°C', color: '#10b981' },
  { key: 'power_mw' as keyof TelemetrySample, label: 'Power Draw (MW)', max: 10, unit: 'MW', color: '#ec4899' },
];

export const LiveTelemetry: React.FC = () => {
  const [hist, setHist] = useState<Record<string, number[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sonifyOn, setSonifyOn] = useState(isSonifying());
  const latestSampleRef = useRef<TelemetrySample | null>(null);

  const {
    isConnected,
    isUsingFallback,
    tlsInfo,
    packetStats,
    config,
    updateConfig
  } = useMqttTelemetry((sample) => {
    latestSampleRef.current = sample;
    setHist((h) => {
      const next = { ...h };
      for (const ch of CHANNELS) {
        const val = sample[ch.key];
        if (typeof val === 'number') {
          next[ch.key] = [...(next[ch.key] || []).slice(-35), val];
        }
      }
      return next;
    });
  });

  const toggleSonify = () => {
    if (sonifyOn) {
      stopSonify();
      setSonifyOn(false);
    } else {
      startSonify(() => latestSampleRef.current);
      setSonifyOn(true);
    }
  };

  useEffect(() => {
    return () => {
      stopSonify();
    };
  }, []);

  return (
    <>
      <GlassPanel
        title="LIVE TELEMETRY BUS (MQTT OVER WSS · TLS 1.3 ENCRYPTED)"
        icon={<Lock size={16} className="text-[#00e5ff]" />}
        badge={isConnected ? (config.protocol === 'wss' ? '🔒 WSS TLS 1.3' : 'WS UNSECURED') : 'CONNECTING...'}
        badgeColor={isConnected ? (config.protocol === 'wss' ? 'green' : 'gold') : 'gold'}
        className="h-full font-mono-tech select-none"
      >
        {/* Top Security & Protocol Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[#00e5ff] font-bold">
              <ShieldCheck size={13} className="text-[#10b981]" />
              <span>CIPHER: {config.cipherSuite.split(' ')[0]}</span>
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              AUTH: <strong className="text-[#ffd700]">{config.authMode.replace('_', ' ')}</strong>
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              PACKETS: <strong className="text-white">{packetStats.packetsReceived}</strong> (HMAC-Verified: <strong className="text-[#10b981]">{packetStats.hmacVerified}</strong>)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              Latency: <strong className="text-[#00e5ff]">{packetStats.averageLatencyMs.toFixed(1)}ms</strong>
            </span>
            <button
              onClick={toggleSonify}
              title={sonifyOn ? 'Mute City Audio Sonification' : 'Sonify Live City Telemetry (Audio Synthesizer)'}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                sonifyOn
                  ? 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/50 shadow-[0_0_12px_rgba(212,255,0,0.3)] animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/20'
              }`}
            >
              {sonifyOn ? <Volume2 size={12} className="text-[#d4ff00]" /> : <VolumeX size={12} />}
              <span>{sonifyOn ? '🔊 SONIFYING' : '🔊 SONIFY CITY'}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#00e5ff]/15 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40 flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.2)]"
            >
              <Sliders size={12} />
              <span>TLS & AUTH CONFIG</span>
            </button>
          </div>
        </div>

        {/* Live Channel Visualizers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHANNELS.map((ch) => {
            const series = hist[ch.key] || [];
            const last = series[series.length - 1];

            return (
              <div
                key={ch.key}
                className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-zinc-400">{ch.label}</span>
                  <span className="font-bold text-sm" style={{ color: ch.color }}>
                    {last !== undefined ? `${last} ${ch.unit}` : '—'}
                  </span>
                </div>

                {/* Real-time bar sparkline */}
                <div className="flex items-end gap-[2px] h-12 mt-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
                  {series.map((v, i) => {
                    const barHeight = Math.min(100, Math.max(8, (v / ch.max) * 100));
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-xs transition-all duration-300"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: ch.color,
                          opacity: 0.35 + (i / series.length) * 0.65
                        }}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-2">
                  <span>Min: {series.length ? Math.min(...series).toFixed(2) : '0'}</span>
                  <span>Max: {series.length ? Math.max(...series).toFixed(2) : ch.max}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Integrity Signature Bar */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between text-[9px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Lock size={11} className="text-[#10b981]" />
            <span>Transport: <strong className="text-white">WSS (TLS 1.3)</strong> · Topic: <strong className="text-white">{config.topic}</strong></span>
          </div>
          <div className="text-zinc-500">
            SHA256 Fingerprint: {tlsInfo.serverCert.fingerprintSha256.slice(0, 23)}...
          </div>
        </div>
      </GlassPanel>

      {/* Security & TLS Configuration Modal */}
      {isModalOpen && (
        <MqttTlsSecurityModal
          config={config}
          tlsInfo={tlsInfo}
          onUpdateConfig={updateConfig}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
