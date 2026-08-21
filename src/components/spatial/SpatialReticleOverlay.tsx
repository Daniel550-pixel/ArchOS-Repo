// src/components/spatial/SpatialReticleOverlay.tsx
// High-Fidelity ULTRON Spatial Reticle & Haptic/Visual Feedback HUD

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  hapticFeedbackService,
  gestureEngine,
  spatialRaycaster,
  VisualFeedbackState,
  ReticleVisualState
} from '../../services/spatial';
import {
  Crosshair,
  Hand,
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  Move,
  Menu,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Scan,
  Cpu,
  Lock,
  Unlock,
  Key
} from 'lucide-react';

export const SpatialReticleOverlay: React.FC = () => {
  const [visualState, setVisualState] = useState<VisualFeedbackState>(
    hapticFeedbackService.getVisualState()
  );
  const [showDictionaryGuide, setShowDictionaryGuide] = useState(false);
  const [scanRotationAngle, setScanRotationAngle] = useState(0);

  useEffect(() => {
    const unsub = hapticFeedbackService.subscribeVisuals((newState) => {
      setVisualState(newState);
    });
    return () => unsub();
  }, []);

  // Continuous rotating HUD tick for biometric scanner
  useEffect(() => {
    if (visualState.reticleState.startsWith('BIOMETRIC_')) {
      const interval = setInterval(() => {
        setScanRotationAngle((prev) => (prev + 6) % 360);
      }, 40);
      return () => clearInterval(interval);
    }
  }, [visualState.reticleState]);

  const {
    reticleState,
    screenX,
    screenY,
    hoveredEntityId,
    heldEntityId,
    highlightColor,
    hapticNoticeText,
    targetScale,
    biometricTelemetry
  } = visualState;

  const hoveredEntity = hoveredEntityId
    ? spatialRaycaster.getEntityNode(hoveredEntityId)
    : null;

  const isBiometricActive = reticleState.startsWith('BIOMETRIC_') || !!biometricTelemetry?.isActive;

  // Convert 0..1 coordinates to window percentages
  const leftPercent = `${screenX * 100}%`;
  const topPercent = `${screenY * 100}%`;

  return (
    <div
      id="spatial-reticle-overlay-root"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden font-mono select-none"
    >
      {/* 1. Dynamic Floating Reticle at Fingertip / Pointer Ray / Biometric Target */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
        style={{
          left: leftPercent,
          top: topPercent,
          transition: 'left 0.04s ease-out, top 0.04s ease-out'
        }}
      >
        {/* Biometric Specific Scanning Reticle System */}
        {isBiometricActive ? (
          <div className="relative flex items-center justify-center pointer-events-none">
            {/* Outer Rotating Biometric HUD Rings */}
            <div
              className="w-24 h-24 rounded-full border border-dashed transition-all duration-200 flex items-center justify-center"
              style={{
                borderColor: highlightColor,
                transform: `rotate(${scanRotationAngle}deg)`,
                boxShadow: `0 0 25px ${highlightColor}40`
              }}
            />
            <div
              className="absolute w-16 h-16 rounded-full border transition-all duration-200"
              style={{
                borderColor: `${highlightColor}80`,
                transform: `rotate(-${scanRotationAngle * 1.5}deg)`
              }}
            />

            {/* Corner Brackets around Face Lock */}
            <div className="absolute -inset-4 pointer-events-none">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: highlightColor }} />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: highlightColor }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: highlightColor }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: highlightColor }} />
            </div>

            {/* Laser Sweep Line */}
            {reticleState === 'BIOMETRIC_SCAN' && (
              <motion.div
                animate={{ y: [-36, 36, -36] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                className="absolute w-20 h-0.5"
                style={{
                  background: `linear-gradient(to right, transparent, ${highlightColor}, transparent)`,
                  boxShadow: `0 0 10px ${highlightColor}`
                }}
              />
            )}

            {/* Central Optical Reticle Icon */}
            <div
              className="z-10 p-2 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(7, 12, 22, 0.85)',
                borderColor: highlightColor,
                boxShadow: `0 0 15px ${highlightColor}60`
              }}
            >
              {reticleState === 'BIOMETRIC_VERIFIED' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 animate-bounce" />
              ) : reticleState === 'BIOMETRIC_DENIED' ? (
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              ) : reticleState === 'BIOMETRIC_LOCKED' ? (
                <Eye className="w-5 h-5 text-lime-400 animate-pulse" />
              ) : (
                <Scan className="w-5 h-5 text-cyan-400 animate-spin" />
              )}
            </div>

            {/* Live Biometric Telemetry Floating Card */}
            {biometricTelemetry && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 48, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute left-full top-0 ml-3 whitespace-nowrap bg-black/90 backdrop-blur-xl border px-3.5 py-2.5 rounded-xl shadow-2xl text-left font-mono"
                style={{
                  borderColor: `${highlightColor}80`,
                  boxShadow: `0 0 30px ${highlightColor}33`
                }}
              >
                {/* Header Tag */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: highlightColor }} />
                  <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: highlightColor }}>
                    {biometricTelemetry.targetModule}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                    style={{
                      backgroundColor: `${highlightColor}20`,
                      borderColor: `${highlightColor}60`,
                      color: highlightColor
                    }}
                  >
                    {reticleState.replace('BIOMETRIC_', '')}
                  </span>
                </div>

                {/* Live Diagnostic Metrics */}
                <div className="space-y-1 text-[10px] text-slate-300">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Optical Face Presence:</span>
                    <span className="font-bold text-white">
                      {biometricTelemetry.faceDetected ? `${biometricTelemetry.confidence.toFixed(1)}% (LOCKED)` : 'SEARCHING...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Micro-Liveness Score:</span>
                    <span className="font-bold text-emerald-400">
                      {biometricTelemetry.livenessScore > 0 ? `${biometricTelemetry.livenessScore.toFixed(1)}% (PASS)` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Iridal Triangulation:</span>
                    <span className="font-bold" style={{ color: highlightColor }}>
                      {biometricTelemetry.irisAlignmentPct}%
                    </span>
                  </div>
                  <div className="pt-1 border-t border-white/10 text-[9px] text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-cyan-400" />
                    <span>Clearance: Level 9 // Sovereign</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* Standard ULTRON Spatial Pointer Reticle */
          <motion.div
            animate={{
              scale: targetScale,
              borderColor: highlightColor,
              boxShadow: `0 0 18px ${highlightColor}66`
            }}
            transition={{ duration: 0.15 }}
            className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center ${
              reticleState === 'PINCH_ACTIVE'
                ? 'scale-75 bg-emerald-500/20'
                : reticleState === 'GRAB_DRAGGING'
                ? 'scale-125 border-purple-500 bg-purple-500/20'
                : reticleState === 'ERROR_INVALID'
                ? 'border-red-500 bg-red-500/20 animate-shake'
                : 'border-cyan-400/80'
            }`}
          >
            {/* Inner Center Dot / Crosshair */}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: highlightColor }}
            />
          </motion.div>
        )}

        {/* Hovered Target HUD Anchor */}
        {!isBiometricActive && hoveredEntity && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 28, scale: 1 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full top-0 ml-2 whitespace-nowrap bg-black/85 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-lg shadow-xl shadow-cyan-950/40 text-left"
          >
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-bold tracking-wider text-cyan-300">
                {hoveredEntity.name}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                {hoveredEntity.entityClass}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>CODE: {hoveredEntity.metadata?.canonicalCode || hoveredEntity.id}</span>
              {hoveredEntity.isMovable && (
                <span className="text-purple-400 font-semibold">• MOVABLE</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Transient Haptic Notice Toast */}
        <AnimatePresence>
          {hapticNoticeText && (
            <motion.div
              key={hapticNoticeText}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: -24 }}
              exit={{ opacity: 0, y: -30 }}
              className="absolute -top-6 whitespace-nowrap text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded bg-black/90 border border-white/20"
              style={{ color: highlightColor }}
            >
              {hapticNoticeText}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 2. Top-Right ULTRON Spatial Telemetry & Dictionary Status */}
      <div className="absolute top-20 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setShowDictionaryGuide(!showDictionaryGuide)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs hover:border-cyan-400 hover:bg-cyan-950/40 transition shadow-lg"
        >
          <Hand className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wide">ULTRON GESTURE DICTIONARY</span>
          <span className="text-[10px] px-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            {reticleState}
          </span>
        </button>

        {/* Collapsible Dictionary HUD */}
        <AnimatePresence>
          {showDictionaryGuide && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-80 p-3.5 rounded-xl bg-black/90 backdrop-blur-xl border border-cyan-500/40 shadow-2xl text-slate-200 text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-cyan-300 tracking-wider">
                    GESTURE CONTRACT
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">COMMAND BUS V2</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-cyan-300 font-medium">Index Point / Hover</span>
                  <span className="text-slate-400 text-[10px]">Raycast BVH Entity</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-emerald-400 font-medium">Pinch (Index+Thumb)</span>
                  <span className="text-slate-400 text-[10px]">Primary Select</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-amber-400 font-medium">Double Pinch</span>
                  <span className="text-slate-400 text-[10px]">Secondary Context</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-purple-400 font-medium">Fist Close / Grab</span>
                  <span className="text-slate-400 text-[10px]">Grab & Drag Movable</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-blue-400 font-medium">Fist Open / Release</span>
                  <span className="text-slate-400 text-[10px]">Drop / Snap Object</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-sky-400 font-medium">Palm Hold (&gt;500ms)</span>
                  <span className="text-slate-400 text-[10px]">Summon Menu / Reset</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5">
                  <span className="text-rose-400 font-medium">Wrist Flick</span>
                  <span className="text-slate-400 text-[10px]">Dismiss Panel</span>
                </div>
              </div>

              {/* Live Test Trigger Bar */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Simulation Trigger:</span>
                <button
                  onClick={() => {
                    hapticFeedbackService.triggerFeedback('CLICK');
                    hapticFeedbackService.updateVisualState({
                      reticleState: 'PINCH_ACTIVE',
                      hapticNoticeText: 'TEST: PRIMARY SELECT'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 text-[10px] border border-cyan-600/40"
                >
                  Test Pinch Haptic
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
