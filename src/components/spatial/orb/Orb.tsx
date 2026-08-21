import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemState } from '../../../types';
import { Activity, Mic, Brain, Volume2, Sparkles, ShieldCheck } from 'lucide-react';

export interface OrbProps {
  state?: SystemState;
  audioLevel?: number; // 0.0 to 1.0
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  onClick?: () => void;
  interactive?: boolean;
  showStateLabel?: boolean;
  className?: string;
  tiltX?: number;
  tiltY?: number;
  isViewHovered?: boolean;
}

const STATE_CONFIG: Record<
  SystemState,
  {
    label: string;
    coreColor: string;
    ringColor: string;
    glowColor: string;
    accentColor: string;
    pulseDuration: number;
    pulseScale: number[];
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  IDLE: {
    label: 'JARVIS // ONLINE',
    coreColor: '#00e5ff',
    ringColor: 'rgba(0, 229, 255, 0.4)',
    glowColor: 'rgba(0, 229, 255, 0.35)',
    accentColor: '#d4ff00',
    pulseDuration: 4.2,
    pulseScale: [1, 1.06, 1],
    icon: Activity
  },
  LISTENING: {
    label: 'AUDIO SENSING // ACTIVE',
    coreColor: '#d4ff00',
    ringColor: 'rgba(212, 255, 0, 0.6)',
    glowColor: 'rgba(212, 255, 0, 0.45)',
    accentColor: '#00e5ff',
    pulseDuration: 1.8,
    pulseScale: [1, 1.12, 1],
    icon: Mic
  },
  THINKING: {
    label: 'NEURAL REASONING // PROCESSING',
    coreColor: '#a855f7',
    ringColor: 'rgba(168, 85, 247, 0.6)',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    accentColor: '#00e5ff',
    pulseDuration: 1.4,
    pulseScale: [1, 1.15, 0.98, 1],
    icon: Brain
  },
  SPEAKING: {
    label: 'ACOUSTIC SYNTHESIS // BROADCASTING',
    coreColor: '#d4ff00',
    ringColor: 'rgba(212, 255, 0, 0.7)',
    glowColor: 'rgba(212, 255, 0, 0.5)',
    accentColor: '#00e5ff',
    pulseDuration: 0.9,
    pulseScale: [1, 1.22, 1.04, 1.18, 1],
    icon: Volume2
  },
  NAVIGATING: {
    label: 'SPATIAL CONTEXT // TRAVERSING',
    coreColor: '#38bdf8',
    ringColor: 'rgba(56, 189, 248, 0.5)',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    accentColor: '#d4ff00',
    pulseDuration: 2.0,
    pulseScale: [1, 1.08, 1],
    icon: Sparkles
  },
  VISUALIZING: {
    label: 'SPATIAL DECOMPOSITION // ACTIVE',
    coreColor: '#00e5ff',
    ringColor: 'rgba(0, 229, 255, 0.6)',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    accentColor: '#d4ff00',
    pulseDuration: 2.2,
    pulseScale: [1, 1.1, 1],
    icon: Sparkles
  },
  ANALYZING: {
    label: 'INTELLIGENCE // SYNTHESIZING',
    coreColor: '#818cf8',
    ringColor: 'rgba(129, 140, 248, 0.5)',
    glowColor: 'rgba(129, 140, 248, 0.35)',
    accentColor: '#00e5ff',
    pulseDuration: 1.6,
    pulseScale: [1, 1.12, 1],
    icon: Brain
  },
  SIMULATING: {
    label: 'SCENARIO ENGINE // RUNNING',
    coreColor: '#ec4899',
    ringColor: 'rgba(236, 72, 153, 0.6)',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    accentColor: '#d4ff00',
    pulseDuration: 1.5,
    pulseScale: [1, 1.14, 1],
    icon: Sparkles
  },
  EXECUTING: {
    label: 'GOVERNED PIPELINE // EXECUTING',
    coreColor: '#f59e0b',
    ringColor: 'rgba(245, 158, 11, 0.7)',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    accentColor: '#00e5ff',
    pulseDuration: 1.1,
    pulseScale: [1, 1.18, 1],
    icon: ShieldCheck
  },
  VERIFYING: {
    label: 'INTEGRITY CHECK // VERIFYING',
    coreColor: '#10b981',
    ringColor: 'rgba(16, 185, 129, 0.6)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#d4ff00',
    pulseDuration: 1.4,
    pulseScale: [1, 1.1, 1],
    icon: ShieldCheck
  },
  WARNING: {
    label: 'SYSTEM ADVISORY // ATTENTION',
    coreColor: '#f97316',
    ringColor: 'rgba(249, 115, 22, 0.7)',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    accentColor: '#ef4444',
    pulseDuration: 1.0,
    pulseScale: [1, 1.16, 1],
    icon: Activity
  },
  ERROR: {
    label: 'DIAGNOSTIC FAULT // ACTIVE',
    coreColor: '#ef4444',
    ringColor: 'rgba(239, 68, 68, 0.8)',
    glowColor: 'rgba(239, 68, 68, 0.55)',
    accentColor: '#f59e0b',
    pulseDuration: 0.7,
    pulseScale: [1, 1.2, 1],
    icon: Activity
  },
  OFFLINE: {
    label: 'SYSTEM DORMANT // STANDBY',
    coreColor: '#545350',
    ringColor: 'rgba(84, 83, 80, 0.3)',
    glowColor: 'rgba(84, 83, 80, 0.1)',
    accentColor: '#8e8d88',
    pulseDuration: 6.0,
    pulseScale: [1, 1.02, 1],
    icon: Activity
  }
};

export const Orb: React.FC<OrbProps> = ({
  state = 'IDLE',
  audioLevel = 0,
  size = 'lg',
  onClick,
  interactive = true,
  showStateLabel = true,
  className = '',
  tiltX = 0,
  tiltY = 0,
  isViewHovered = false
}) => {
  const [isOrbHovered, setIsOrbHovered] = useState(false);

  // Derive pixel dimension from size prop
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 120
      : size === 'md'
      ? 180
      : size === 'lg'
      ? 260
      : 360;

  const currentConfig = STATE_CONFIG[state] || STATE_CONFIG.IDLE;
  const StateIcon = currentConfig.icon;

  // Reactivity to real-time audio level or hover
  const dynamicScaleBoost = state === 'SPEAKING' ? 1 + audioLevel * 0.25 : isOrbHovered ? 1.08 : isViewHovered ? 1.03 : 1;

  return (
    <motion.div
      id="jarvis-central-orb"
      onClick={onClick}
      onMouseEnter={() => setIsOrbHovered(true)}
      onMouseLeave={() => setIsOrbHovered(false)}
      role={interactive ? 'button' : 'presentation'}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      animate={{
        rotateX: -tiltY * 18,
        rotateY: tiltX * 18,
        scale: dynamicScaleBoost
      }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 24
      }}
      style={{
        width: pixelSize,
        height: pixelSize,
        perspective: 1000,
        transformStyle: 'preserve-3d'
      }}
      className={`relative flex flex-col items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Outer Volumetric Corona Glow with Hover Surge */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none filter blur-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${currentConfig.glowColor} 0%, rgba(0, 229, 255, 0.1) 40%, rgba(8,8,10,0) 70%)`
        }}
        animate={{
          scale: isOrbHovered ? [1.2, 1.4, 1.2] : [1, 1.25, 1],
          opacity: isOrbHovered ? 0.95 : state === 'SPEAKING' ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: isOrbHovered ? 2.0 : currentConfig.pulseDuration * 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Interactive Radial Light Sweep Beam */}
      <motion.div
        className="absolute -inset-8 rounded-full pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${currentConfig.coreColor} 45deg, transparent 90deg, ${currentConfig.accentColor} 220deg, transparent 270deg)`
        }}
        animate={{
          rotate: [0, 360],
          scale: isOrbHovered ? 1.15 : 1
        }}
        transition={{
          rotate: {
            duration: isOrbHovered ? 6 : 16,
            repeat: Infinity,
            ease: 'linear'
          },
          scale: { duration: 0.3 }
        }}
      />

      {/* Layer 1: Outermost Orbital Dashed Ring */}
      <motion.div
        className="absolute inset-1 rounded-full border border-dashed pointer-events-none transition-colors duration-300"
        style={{
          borderColor: isOrbHovered ? currentConfig.coreColor : currentConfig.ringColor,
          opacity: isOrbHovered ? 0.9 : 0.5
        }}
        animate={{
          rotate: state === 'THINKING' ? 360 : [0, 360],
          scale: isOrbHovered ? [1.02, 1.06, 1.02] : [0.98, 1.02, 0.98]
        }}
        transition={{
          rotate: {
            duration: state === 'THINKING' ? 6 : isOrbHovered ? 12 : 28,
            repeat: Infinity,
            ease: 'linear'
          },
          scale: {
            duration: currentConfig.pulseDuration,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        }}
      />

      {/* Layer 2: Counter-Rotating Equatorial Ring with Node Beacons */}
      <motion.div
        className="absolute inset-6 rounded-full border pointer-events-none"
        style={{
          borderColor: currentConfig.ringColor,
          borderWidth: isOrbHovered ? 2 : 1.5
        }}
        animate={{
          rotate: state === 'THINKING' ? -360 : [360, 0]
        }}
        transition={{
          duration: state === 'THINKING' ? 8 : isOrbHovered ? 14 : 34,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        {/* Orbital Node Glyphs with luminous trail */}
        <span
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: currentConfig.accentColor,
            boxShadow: `0 0 ${isOrbHovered ? '16px' : '10px'} ${currentConfig.accentColor}`
          }}
        />
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all duration-300"
          style={{
            backgroundColor: currentConfig.coreColor,
            boxShadow: `0 0 ${isOrbHovered ? '14px' : '8px'} ${currentConfig.coreColor}`
          }}
        />
        {isOrbHovered && (
          <span
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-ping"
            style={{ backgroundColor: currentConfig.coreColor }}
          />
        )}
      </motion.div>

      {/* Layer 3: Nested Geometric Ring Array */}
      <motion.div
        className="absolute inset-12 rounded-full border border-dotted pointer-events-none transition-opacity duration-300"
        style={{
          borderColor: currentConfig.coreColor,
          opacity: isOrbHovered ? 0.9 : 0.6
        }}
        animate={{
          rotate: 360,
          scale: currentConfig.pulseScale
        }}
        transition={{
          rotate: { duration: isOrbHovered ? 8 : 18, repeat: Infinity, ease: 'linear' },
          scale: { duration: currentConfig.pulseDuration, repeat: Infinity, ease: 'easeInOut' }
        }}
      />

      {/* Layer 4: Acoustic / Interaction Resonance Shockwaves */}
      <AnimatePresence>
        {(state === 'SPEAKING' || state === 'THINKING' || state === 'LISTENING' || isOrbHovered) && (
          <motion.div
            key="acoustic-wave"
            className="absolute inset-4 rounded-full border pointer-events-none"
            style={{
              borderColor: isOrbHovered ? currentConfig.coreColor : currentConfig.accentColor,
              borderWidth: 1.5
            }}
            initial={{ scale: 0.8, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: state === 'SPEAKING' ? 0.9 : isOrbHovered ? 1.4 : 1.6,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        )}
      </AnimatePresence>

      {/* Layer 5: Central Luminous Core Reactor */}
      <motion.div
        className="relative rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xs transition-shadow duration-300"
        style={{
          width: pixelSize * 0.48,
          height: pixelSize * 0.48,
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentConfig.coreColor} 45%, #08080a 95%)`,
          boxShadow: isOrbHovered
            ? `0 0 50px ${currentConfig.glowColor}, inset 0 0 25px rgba(255,255,255,0.7)`
            : `0 0 35px ${currentConfig.glowColor}, inset 0 0 20px rgba(255,255,255,0.4)`
        }}
        animate={{
          scale: currentConfig.pulseScale.map((s) => s * (isOrbHovered ? 1.05 : 1))
        }}
        transition={{
          duration: isOrbHovered ? 2.0 : currentConfig.pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {/* Core Lattice Overlay */}
        <div
          className="absolute inset-0 rounded-full opacity-35 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px), radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 6px 6px'
          }}
        />

        {/* Dynamic Light Specular Highlight */}
        <motion.div
          className="absolute top-2 left-3 w-8 h-4 rounded-full bg-white/40 filter blur-xs -rotate-45 pointer-events-none"
          animate={{
            opacity: isOrbHovered ? [0.6, 0.9, 0.6] : [0.3, 0.5, 0.3],
            x: tiltX * 10,
            y: tiltY * 10
          }}
          transition={{
            opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            x: { duration: 0.1 },
            y: { duration: 0.1 }
          }}
        />

        {/* Central State Glyph */}
        <motion.div
          className="relative z-10 text-[#08080a] flex items-center justify-center p-2.5 rounded-full bg-white/45 backdrop-blur-md shadow-inner transition-all duration-300"
          animate={{
            rotate: state === 'THINKING' ? [0, 180, 360] : 0,
            scale: state === 'SPEAKING' ? [1, 1.2, 1] : isOrbHovered ? [1, 1.1, 1] : [1, 1.04, 1]
          }}
          transition={{
            duration: state === 'THINKING' ? 3 : 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <StateIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#08080a]" />
        </motion.div>
      </motion.div>

      {/* Layer 6: Dynamic State & Telemetry HUD Label */}
      {showStateLabel && (
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 whitespace-nowrap pointer-events-none"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-all duration-300 ${
              isOrbHovered
                ? 'bg-[#09101c] border border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                : 'bg-[#111115]/90 border border-[#f5f4f0]/10'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: currentConfig.coreColor }}
            />
            <span className="font-mono-tech text-[10px] font-bold tracking-wider uppercase text-[#f5f4f0]">
              {currentConfig.label}
            </span>
          </div>
          {interactive && (
            <span
              className={`font-mono-tech text-[8px] tracking-widest uppercase transition-all duration-200 ${
                isOrbHovered ? 'text-[#00e5ff] font-bold opacity-100' : 'text-[#8e8d88] opacity-70'
              }`}
            >
              {isOrbHovered ? 'CLICK TO ENGAGE' : 'CLICK TO INTERACT'}
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Orb;
