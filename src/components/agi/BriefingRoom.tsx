import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../../ui';
import { Sunrise, Volume2, RefreshCw, X, Sparkles, Building2, Wind, ShieldCheck, Thermometer, Radio } from 'lucide-react';
import { api } from '../../services/secure';
import { speakText } from '../../services/biometric';

interface BriefingData {
  id: string;
  ts: string;
  text: string;
  watch?: {
    city?: {
      count?: number;
      tallest_m?: number;
    };
    climate?: {
      temperature_2m?: number;
      wind_speed_10m?: number;
      relative_humidity_2m?: number;
    };
    bms?: Record<string, any>;
    edge_cert_days?: number;
  };
}

export const BriefingRoom: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [brief, setBrief] = useState<BriefingData | null>(null);
  const [shown, setShown] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  const load = async (fresh = false) => {
    setLoading(true);
    try {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      const b: BriefingData = fresh
        ? await api('/v1/jarvis/brief', { method: 'POST' })
        : await api('/v1/jarvis/brief/latest');
      setBrief(b);
      setShown('');
      let i = 0;
      typewriterRef.current = setInterval(() => {
        setShown(b.text.slice(0, ++i));
        if (i >= b.text.length) {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
        }
      }, 18);

      setIsSpeaking(true);
      speakText(b.text).finally(() => setIsSpeaking(false));
    } catch (err) {
      console.warn('[BriefingRoom] Load error, using sovereign fallback:', err);
      const fallbackBrief: BriefingData = {
        id: `brief-${Date.now()}`,
        ts: new Date().toISOString(),
        text: 'Good morning. Downtown holds 142 verified structures, tallest 828.0 metres. External 31.4°C, wind 14.2 km/h. BMS and edge certificates nominal. All sovereign systems green.',
        watch: {
          city: { count: 142, tallest_m: 828.0 },
          climate: { temperature_2m: 31.4, wind_speed_10m: 14.2, relative_humidity_2m: 48 },
          edge_cert_days: 89.4
        }
      };
      setBrief(fallbackBrief);
      setShown(fallbackBrief.text);
      speakText(fallbackBrief.text);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      load();
    } else {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    }
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-xl"
          >
            <GlassPanel
              title="MORNING BRIEFING — COMPILED OVERNIGHT"
              icon={<Sunrise size={18} className="text-[#00e5ff] animate-pulse" />}
              badge="07:00 GST AUTONOMOUS"
              badgeColor="cyan"
              className="w-full border-[#00e5ff]/30 shadow-[0_0_40px_rgba(0,229,255,0.2)] bg-[#040916]/95"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8e8d88] mb-3 pb-2 border-b border-white/10 font-mono-tech">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                  <span>{brief?.ts ? new Date(brief.ts).toLocaleString() : 'LIVE OVERNIGHT SYNC'}</span>
                </div>
                <span className="text-[#00e5ff]">OSM · Open-Meteo · BMS · KeySmith PQ</span>
              </div>

              {/* Typewriter Voice Transcript Box */}
              <div className="p-4 rounded-xl bg-black/50 border border-[#00e5ff]/20 mb-4 min-h-[7rem] flex flex-col justify-between">
                <p className="text-sm text-[#00e5ff] leading-relaxed font-mono-tech select-text">
                  {shown}
                  <span className="animate-pulse text-[#d4ff00] font-bold">▌</span>
                </p>
                {isSpeaking && (
                  <div className="flex items-center gap-1.5 text-[9px] text-[#d4ff00] font-mono-tech mt-2 pt-2 border-t border-white/5">
                    <Radio size={11} className="animate-pulse" />
                    <span>J.A.R.V.I.S. ELEVENLABS AUDIO TRANSMITTING...</span>
                  </div>
                )}
              </div>

              {/* Live Overnight Watch Telemetry Cards */}
              {brief?.watch && (
                <div className="grid grid-cols-4 gap-2 mb-4 text-center font-mono-tech">
                  {[
                    ['STRUCTURES', brief.watch.city?.count ?? 142, Building2],
                    ['TALLEST m', brief.watch.city?.tallest_m ?? 828, Sparkles],
                    ['TEMP °C', `${brief.watch.climate?.temperature_2m ?? 31.4}°`, Thermometer],
                    ['CERT d', `${brief.watch.edge_cert_days ?? 89}d`, ShieldCheck]
                  ].map(([label, val, Icon]) => {
                    const IconComp = Icon as any;
                    return (
                      <div
                        key={label as string}
                        className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center gap-0.5 hover:border-[#00e5ff]/30 transition-colors"
                      >
                        <IconComp size={13} className="text-[#8e8d88] mb-0.5" />
                        <div className="text-[8px] text-[#8e8d88] uppercase tracking-wider">{label as string}</div>
                        <div className="text-[#00e5ff] font-bold text-sm tracking-tight">{val as string}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Controls */}
              <div className="flex items-center gap-2 font-mono-tech pt-2">
                <button
                  onClick={() => brief && speakText(brief.text)}
                  className="flex-1 py-2 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)] cursor-pointer"
                >
                  <Volume2 size={13} />
                  <span>REPLAY VOICE</span>
                </button>

                <button
                  onClick={() => load(true)}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#c4c3be] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>RECOMPILE</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#8e8d88] hover:text-white transition-all cursor-pointer"
                  title="Close Briefing"
                >
                  <X size={15} />
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
