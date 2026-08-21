import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Camera,
  CameraOff,
  RotateCcw,
  Sparkles,
  Zap,
  Hand,
  ChevronDown,
  ChevronUp,
  Info,
  Check
} from 'lucide-react';
import { visionService, VisionConfig } from '../../services/vision/handLandmarks';
import { HandGestureState } from '../../types';

interface GestureSensitivityControlProps {
  gestureState?: HandGestureState;
  onToggleCamera?: () => void;
}

const PRESETS = [
  { label: '0.5x Damped', value: 0.5, desc: 'High smoothing, large motions' },
  { label: '1.0x Nominal', value: 1.0, desc: 'Standard balanced detection' },
  { label: '1.5x Agile', value: 1.5, desc: 'Fast response, tight pinch' },
  { label: '2.0x Hyper', value: 2.0, desc: 'Ultra-low latency, micro-motions' }
];

export const GestureSensitivityControl: React.FC<GestureSensitivityControlProps> = ({
  gestureState,
  onToggleCamera
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(() => visionService.getConfig().sensitivity);
  const [effectiveConfig, setEffectiveConfig] = useState<VisionConfig>(() => visionService.getEffectiveConfig());
  const [simulatedPinch, setSimulatedPinch] = useState<number>(0.5);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    const unsub = visionService.subscribeConfig((cfg, effective) => {
      setSensitivity(cfg.sensitivity);
      setEffectiveConfig(effective);
    });
    return () => unsub();
  }, []);

  const handleSensitivityChange = (val: number) => {
    const clamped = Math.max(0.2, Math.min(2.5, val));
    setSensitivity(clamped);
    visionService.setSensitivity(clamped);
  };

  const handleReset = () => {
    visionService.resetSensitivity();
    setCopiedNotification('Reset to 1.00x Nominal');
    setTimeout(() => setCopiedNotification(null), 1800);
  };

  // Color gradient based on sensitivity level
  const getSensitivityColor = (val: number) => {
    if (val < 0.8) return '#38bdf8'; // Cyan-Blue
    if (val <= 1.25) return '#00e5ff'; // Pure Cyan
    if (val <= 1.75) return '#d4ff00'; // Lime Tech
    return '#ec4899'; // Magenta Hyper
  };

  const activeColor = getSensitivityColor(sensitivity);
  const isCameraActive = gestureState?.isCameraActive ?? false;
  const isHandDetected = gestureState?.handDetected ?? false;
  const currentProgress = isCameraActive && isHandDetected ? gestureState.smoothedProgress : simulatedPinch;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-8 bottom-8 z-30 font-mono-tech select-none"
    >
      <div className="w-80 sm:w-88 rounded-xl border border-[#00e5ff]/30 bg-[#070c16]/95 backdrop-blur-xl shadow-2xl p-3.5 flex flex-col gap-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#00e5ff]/20 pb-2">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff]"
              style={{ borderColor: `${activeColor}60`, color: activeColor }}
            >
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono-tech text-[11px] font-bold tracking-wider text-[#f5f4f0] uppercase flex items-center gap-1.5">
                GESTURE SENSITIVITY
                <span
                  className="px-1.5 py-0.2 rounded text-[9px] font-bold"
                  style={{
                    backgroundColor: `${activeColor}20`,
                    color: activeColor,
                    border: `1px solid ${activeColor}50`
                  }}
                >
                  {sensitivity.toFixed(2)}x
                </span>
              </span>
              <span className="text-[9px] text-[#8e8d88]">
                {sensitivity < 0.8
                  ? 'Damped Stability Mode'
                  : sensitivity <= 1.25
                  ? 'Nominal Calibration'
                  : sensitivity <= 1.75
                  ? 'Agile Response Mode'
                  : 'Hyper Kinetic Response'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Camera Quick Toggle */}
            {onToggleCamera && (
              <button
                onClick={onToggleCamera}
                title={isCameraActive ? 'Turn Off Hand Tracking' : 'Turn On Hand Tracking'}
                className={`p-1.5 rounded border transition-all text-[10px] flex items-center gap-1 ${
                  isCameraActive
                    ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                    : 'bg-[#111622] border-white/10 text-[#8e8d88] hover:text-white'
                }`}
              >
                {isCameraActive ? <Camera className="w-3 h-3 animate-pulse" /> : <CameraOff className="w-3 h-3" />}
              </button>
            )}

            {/* Expand / Collapse Details */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-[#00e5ff] transition-all"
              title={isExpanded ? 'Collapse telemetry view' : 'Expand precision parameters'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Primary Precision Range Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#8e8d88] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00e5ff]" />
              <span>Sensitivity Multiplier:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f5f4f0] font-bold text-xs">
                {Math.round(sensitivity * 100)}%
              </span>
              <span className="text-[#8e8d88] text-[9px]">
                ({sensitivity.toFixed(2)}x)
              </span>
            </div>
          </div>

          {/* Slider Element */}
          <div className="relative w-full flex items-center py-1">
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={sensitivity}
              onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff] transition-all"
              style={{
                accentColor: activeColor
              }}
            />
          </div>

          {/* Ticks Range Labels */}
          <div className="flex justify-between text-[8px] text-[#545350] font-mono px-0.5">
            <span>0.2x (Calm)</span>
            <span>1.0x (Nominal)</span>
            <span>1.8x</span>
            <span>2.5x (Hyper)</span>
          </div>
        </div>

        {/* Quick-Select Presets */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {PRESETS.map((preset) => {
            const isSelected = Math.abs(sensitivity - preset.value) < 0.04;
            return (
              <button
                key={preset.value}
                onClick={() => handleSensitivityChange(preset.value)}
                title={preset.desc}
                className={`py-1 px-1 rounded text-[9px] font-bold transition-all truncate text-center ${
                  isSelected
                    ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.25)]'
                    : 'bg-[#09101c] text-[#8e8d88] border border-white/5 hover:border-[#00e5ff]/40 hover:text-white'
                }`}
              >
                {preset.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Real-time Pinch & Response Feedback Bar */}
        <div className="p-2.5 rounded-lg bg-[#09101c] border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-[#8e8d88] flex items-center gap-1">
              <Hand className="w-3 h-3 text-[#00e5ff]" />
              <span>
                {isCameraActive
                  ? isHandDetected
                    ? `${gestureState?.handedness.toUpperCase()} HAND: ${gestureState?.isOpenPalm ? 'OPEN PALM' : gestureState?.isPinching ? 'PINCHING' : 'TRACKING'}`
                    : 'AWAITING HAND IN CAMERA...'
                  : 'SIMULATED RESPONSIVENESS:'}
              </span>
            </span>
            <span
              className="font-bold"
              style={{ color: activeColor }}
            >
              {(currentProgress * 100).toFixed(0)}%
            </span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full h-1.5 bg-[#111622] rounded-full overflow-hidden relative">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${currentProgress * 100}%`,
                background: `linear-gradient(to right, #004488, ${activeColor})`
              }}
            />
          </div>

          {!isCameraActive && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={simulatedPinch}
              onChange={(e) => setSimulatedPinch(parseFloat(e.target.value))}
              className="w-full h-1 bg-transparent opacity-40 hover:opacity-100 cursor-pointer accent-[#00e5ff]"
              title="Drag to test gesture interpolation responsiveness"
            />
          )}
        </div>

        {/* Expanded Telemetry & Mathematical Diagnostics */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2 border-t border-[#00e5ff]/15 flex flex-col gap-2 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <div className="p-1.5 rounded bg-[#09101c] border border-white/5 flex flex-col">
                  <span className="text-[#8e8d88]">EMA Smoothing (α):</span>
                  <span className="text-[#f5f4f0] font-bold">
                    {(effectiveConfig.smoothingAlpha * 100).toFixed(1)}% / frame
                  </span>
                </div>

                <div className="p-1.5 rounded bg-[#09101c] border border-white/5 flex flex-col">
                  <span className="text-[#8e8d88]">Palm Hold Threshold:</span>
                  <span className="text-[#f5f4f0] font-bold">
                    {effectiveConfig.palmHoldDurationMs} ms
                  </span>
                </div>

                <div className="p-1.5 rounded bg-[#09101c] border border-white/5 flex flex-col">
                  <span className="text-[#8e8d88]">Min Pinch Baseline:</span>
                  <span className="text-[#f5f4f0] font-bold">
                    {effectiveConfig.minPinchThreshold.toFixed(3)}
                  </span>
                </div>

                <div className="p-1.5 rounded bg-[#09101c] border border-white/5 flex flex-col">
                  <span className="text-[#8e8d88]">Max Pinch Span:</span>
                  <span className="text-[#f5f4f0] font-bold">
                    {effectiveConfig.maxPinchThreshold.toFixed(3)} (Δ {(effectiveConfig.maxPinchThreshold - effectiveConfig.minPinchThreshold).toFixed(3)})
                  </span>
                </div>
              </div>

              {/* Reset to Nominal */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-[#00e5ff] text-[9px] flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset 1.00x Nominal</span>
                </button>

                {copiedNotification && (
                  <span className="text-[9px] text-[#00e5ff] flex items-center gap-1 animate-pulse">
                    <Check className="w-3 h-3" />
                    {copiedNotification}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
