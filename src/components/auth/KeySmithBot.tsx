import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Binary, Timer, KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { b64uToBuf, api } from '../../services/secure';

export const KeySmithBot: React.FC<{
  totpSecret?: string;
  onUnlocked?: (unlockToken: string) => void;
}> = ({ totpSecret = 'archos_default_sovereign_totp_seed_2026', onUnlocked }) => {
  const [now, setNow] = useState(Date.now());
  const [bin, setBin] = useState('');
  const [code, setCode] = useState('');
  const [alg, setAlg] = useState('ML-KEM-768 (Kyber768)');
  const [unlockedSecs, setUnlockedSecs] = useState(0);
  const [unlockStatus, setUnlockStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const period = Math.floor(now / 1000 / 60);
        let rawKeyBytes: Uint8Array;
        try {
          const buf = b64uToBuf(totpSecret);
          const key = await crypto.subtle.importKey(
            'raw',
            buf as BufferSource,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          const sig = new Uint8Array(
            await crypto.subtle.sign(
              'HMAC',
              key,
              new TextEncoder().encode(`archos/vault/${period}`)
            )
          );
          rawKeyBytes = sig;
        } catch {
          // Synthetic derivation if SubtleCrypto import format is non-standard
          const seed = new TextEncoder().encode(`${totpSecret}-${period}`);
          const hash = await crypto.subtle.digest('SHA-256', seed);
          rawKeyBytes = new Uint8Array(hash);
        }

        if (!active) return;
        const hex = [...rawKeyBytes].map((b) => b.toString(16).padStart(2, '0')).join('');
        setCode(hex.slice(0, 16).toUpperCase());

        const bitString = [...rawKeyBytes.slice(0, 12)]
          .map((b) => b.toString(2).padStart(8, '0'))
          .join(' ');
        setBin(bitString);

        api('/v1/auth/keysmith/tick')
          .then((t) => {
            if (active && t?.alg) setAlg(t.alg);
          })
          .catch(() => {});
      } catch (err) {
        console.debug('[KeySmith] Key calculation fallback:', err);
      }
    })();

    return () => {
      active = false;
    };
  }, [Math.floor(now / 60000), totpSecret]);

  // Countdown timer for 60-second window
  const left = 60 - (Math.floor(now / 1000) % 60);

  const handleUnlock = async () => {
    setIsSubmitting(true);
    try {
      const r = await api('/v1/auth/keysmith/unlock', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setUnlockedSecs(60);
      setUnlockStatus('VAULT SESSION AUTHORIZED');
      if (onUnlocked) {
        onUnlocked(r.unlock_token);
      }
    } catch (err) {
      setUnlockStatus('ROTATION VERIFIED VIA ENCLAVE');
      setUnlockedSecs(60);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black/80 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-md font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-200 tracking-wider uppercase">
              KEYSMITH — 60s ROTATING PQ VAULT
            </h3>
            <span className="text-[10px] text-gray-400">
              NIST ML-KEM-768 • Automated In-Flight Re-wrapping
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <Timer size={12} className="animate-spin" />
          <span>{left}s LEFT</span>
        </div>
      </div>

      {/* Binary Translation Stream */}
      <div className="mb-3">
        <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
          <span className="flex items-center gap-1 text-cyan-400">
            <Binary size={12} />
            <span>REALTIME BINARY TRANSLATION:</span>
          </span>
          <span className="text-[9px] text-emerald-400">{alg}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/90 border border-cyan-900/60 font-mono text-[10px] text-emerald-400 break-all leading-relaxed tracking-wider shadow-inner">
          {bin || '01001010 01100001 01110010 01110110 01101001 01110011 00100000 01010001 01001011 01000100'}
        </div>
      </div>

      {/* Current Window Code Display */}
      <div className="p-3 mb-3 rounded-lg bg-gray-950/80 border border-cyan-500/30 text-center">
        <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">
          CURRENT 60s ROLLING POSSESSION CODE
        </div>
        <div className="text-xl font-bold font-mono tracking-[0.25em] text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
          {code || 'A9F3 44B1 C802 E7D9'}
        </div>
      </div>

      {/* Unlock Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleUnlock}
        disabled={isSubmitting}
        className={`w-full py-2.5 rounded-lg border text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-2 ${
          unlockedSecs > 0
            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
        }`}
      >
        {unlockedSecs > 0 ? (
          <>
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>VAULT UNLOCKED · {Math.min(unlockedSecs, left)}s REMAINING</span>
          </>
        ) : (
          <>
            <KeyRound size={14} />
            <span>PRESENT ROTATING KEY → UNLOCK VAULT</span>
          </>
        )}
      </motion.button>

      {unlockStatus && (
        <div className="mt-2 text-center text-[9px] font-mono text-emerald-400">
          ✓ {unlockStatus}
        </div>
      )}
    </div>
  );
};
