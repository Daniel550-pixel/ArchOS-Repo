import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from '../layout/HeaderBar';

interface HolographicTransitionOverlayProps {
  currentTab: ActiveTab;
}

export const HolographicTransitionOverlay: React.FC<HolographicTransitionOverlayProps> = ({
  currentTab
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionKey, setTransitionKey] = useState<string>(currentTab);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setTransitionKey(currentTab);
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [currentTab]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
        >
          {/* Holographic Laser Sweep Beam */}
          <motion.div
            initial={{ top: '-10%', opacity: 0.9 }}
            animate={{ top: '110%', opacity: 0 }}
            transition={{ duration: 0.42, ease: 'linear' }}
            className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[#00e5ff]/35 to-transparent blur-sm border-y border-[#00e5ff]/60"
          />

          {/* Secondary Reverse Laser Sweep */}
          <motion.div
            initial={{ bottom: '-10%', opacity: 0.7 }}
            animate={{ bottom: '110%', opacity: 0 }}
            transition={{ duration: 0.38, ease: 'linear' }}
            className="absolute left-0 right-0 h-16 bg-gradient-to-t from-transparent via-[#d4ff00]/25 to-transparent blur-xs"
          />

          {/* Matrix Lattice Dissolve Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: [0, 0.4, 0], scale: 1 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, rgba(0, 229, 255, 0.15) 0%, transparent 70%),
                linear-gradient(rgba(0, 229, 255, 0.12) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 229, 255, 0.12) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 32px 32px, 32px 32px'
            }}
          />

          {/* Holographic Scanlines */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 229, 255, 0.15) 0px, rgba(0, 229, 255, 0.15) 1px, transparent 1px, transparent 3px)'
            }}
          />

          {/* Center Holographic Telemetry Reticle & View Transition Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 1, 0], scale: [0.95, 1, 1.05] }}
            transition={{ duration: 0.4 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 select-none"
          >
            {/* Holographic Reticle Frame */}
            <div className="relative p-3 rounded-2xl bg-[#040915]/80 border border-[#00e5ff]/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#00e5ff] animate-ping" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono-tech font-bold text-[#00e5ff] tracking-widest uppercase">
                  HOLOGRAPHIC DISSOLVE
                </span>
                <span className="text-[9px] font-mono-tech text-white tracking-wider">
                  SYNCING SECTOR: <strong className="text-[#d4ff00]">{currentTab.toUpperCase()}</strong>
                </span>
              </div>
            </div>

            {/* Corner Targeting Accents */}
            <div className="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-[#00e5ff]" />
            <div className="absolute -top-4 -right-4 w-6 h-6 border-t-2 border-r-2 border-[#00e5ff]" />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 border-b-2 border-l-2 border-[#00e5ff]" />
            <div className="absolute -bottom-4 -right-4 w-6 h-6 border-b-2 border-r-2 border-[#00e5ff]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
