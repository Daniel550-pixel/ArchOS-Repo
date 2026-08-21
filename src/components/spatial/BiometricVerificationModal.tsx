import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Mic,
  Fingerprint,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  X,
  Volume2,
  Cpu,
  Terminal,
  KeyRound,
  Sparkles,
  CheckCircle2,
  Sliders,
  Camera,
  ScanFace,
  Scan,
  Check,
  Play
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';
import { biometricAuthService, ProtectedModule, BiometricAuthState } from '../../services/security/biometricAuthService';
import { hapticFeedbackService } from '../../services/spatial/HapticFeedbackService';

export interface BiometricVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetModule?: ProtectedModule;
  targetProtocolName?: string;
  requiredSecurityClearance?: string;
}

type VerificationModality = 'FACE_CAMERA' | 'RETINA' | 'VOICEPRINT' | 'QUANTUM_PIN';

export const BiometricVerificationModal: React.FC<BiometricVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetModule = 'SOKOVIA',
  targetProtocolName = 'SOKOVIA PROTOCOL (DEFCON-1 / EMIRATES SOVEREIGN OVERRIDE)',
  requiredSecurityClearance = 'CLEARANCE LEVEL 9 // STRATEGIC COMMAND'
}) => {
  const [modality, setModality] = useState<VerificationModality>('FACE_CAMERA');
  const [bioState, setBioState] = useState<BiometricAuthState>(biometricAuthService.getState());
  const [pinInput, setPinInput] = useState<string>('');
  const [scanAngles, setScanAngles] = useState<number>(0);
  const [audioFreqs, setAudioFreqs] = useState<number[]>([12, 45, 80, 65, 90, 40, 75, 55, 95, 30, 60, 85]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Subscribe to biometric auth engine state
  useEffect(() => {
    const unsub = biometricAuthService.subscribe((newState) => {
      setBioState(newState);
      if (newState.status === 'AUTHENTICATED' && isOpen) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    });
    return () => unsub();
  }, [isOpen, onSuccess, onClose]);

  // Optical retina scan rotating angle
  useEffect(() => {
    if (isOpen && (modality === 'RETINA' || modality === 'FACE_CAMERA')) {
      const interval = setInterval(() => {
        setScanAngles((prev) => (prev + 6) % 360);
      }, 40);
      return () => clearInterval(interval);
    }
  }, [isOpen, modality]);

  // Camera start when opened with FACE_CAMERA
  useEffect(() => {
    if (isOpen && modality === 'FACE_CAMERA') {
      if (videoRef.current) {
        biometricAuthService.startVerification(targetModule, videoRef.current);
      } else {
        biometricAuthService.startVerification(targetModule);
      }
    }

    return () => {
      if (!isOpen) {
        biometricAuthService.stopVerification();
      }
    };
  }, [isOpen, modality, targetModule]);

  // Audio frequency oscillator animation for voiceprint
  useEffect(() => {
    if (isOpen && modality === 'VOICEPRINT' && bioState.status === 'SCANNING_OPTICAL') {
      const interval = setInterval(() => {
        setAudioFreqs(
          Array.from({ length: 16 }, () => Math.floor(Math.random() * 80) + 15)
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen, modality, bioState.status]);

  const handleStartCameraVerification = () => {
    if (videoRef.current) {
      biometricAuthService.startVerification(targetModule, videoRef.current);
    } else {
      biometricAuthService.startVerification(targetModule);
    }
  };

  const handleSimulateInstantPass = () => {
    biometricAuthService.simulateInstantSuccess();
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1000);
  };

  const handleQuantumPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) return;

    biometricAuthService.unlockModuleManually(targetModule);
    hapticFeedbackService.triggerFeedback('CONFIRM_DOUBLE');
    speechService.speak('Quantum 256-bit hash confirmed. Sovereign override granted.');

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  const isScanning = bioState.status === 'SCANNING_OPTICAL' || bioState.status === 'ACQUIRING_CAMERA' || bioState.status === 'FACE_DETECTED' || bioState.status === 'LIVENESS_VERIFYING';
  const isVerified = bioState.status === 'AUTHENTICATED';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl font-mono-tech select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl rounded-2xl border-2 border-[#ec4899]/60 bg-[#070c16]/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(236,72,153,0.3),0_0_20px_rgba(0,0,0,0.9)] p-6 flex flex-col gap-4 overflow-hidden text-[#f5f4f0]"
        >
          {/* Top Holographic Laser Edge */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5ff] via-[#ec4899] to-[#d4ff00]" />

          {/* Header Warning Bar */}
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ec4899]/20 border border-[#ec4899] text-[#ec4899] shadow-[0_0_15px_rgba(236,72,153,0.4)] animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-widest text-[#ec4899] uppercase">
                    RESTRICTED SOVEREIGN BOUNDARY
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/40">
                    CLEARANCE 9
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  BIOMETRIC OPTICAL FACE & IRIS VERIFICATION
                </h2>
                <span className="text-[10px] text-[#8e8d88]">
                  Target Module:{' '}
                  <span className="text-[#00e5ff] font-semibold">
                    {targetModule === 'SOKOVIA' ? 'SOKOVIA PROTOCOL DEFCON-1' : 'FINOPS SOVEREIGN AUTHORITY'}
                  </span>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                biometricAuthService.stopVerification();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modality Selector Tabs */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                setModality('FACE_CAMERA');
                handleStartCameraVerification();
              }}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs ${
                modality === 'FACE_CAMERA'
                  ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:text-white'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              <span className="font-bold tracking-wider text-[11px]">OPTICAL FACE</span>
              <span className="text-[8px] text-[#8e8d88]">Camera Presence</span>
            </button>

            <button
              onClick={() => {
                setModality('RETINA');
                handleStartCameraVerification();
              }}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs ${
                modality === 'RETINA'
                  ? 'bg-[#d4ff00]/20 border-[#d4ff00] text-[#d4ff00] shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                  : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="font-bold tracking-wider text-[11px]">RETINA LOCK</span>
              <span className="text-[8px] text-[#8e8d88]">Iris Vascular Grid</span>
            </button>

            <button
              onClick={() => {
                setModality('VOICEPRINT');
                speechService.speak('State sovereign verbal elevation code.');
              }}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs ${
                modality === 'VOICEPRINT'
                  ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#ec4899] shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                  : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span className="font-bold tracking-wider text-[11px]">VOICEPRINT</span>
              <span className="text-[8px] text-[#8e8d88]">Vocal Harmonics</span>
            </button>

            <button
              onClick={() => {
                setModality('QUANTUM_PIN');
              }}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs ${
                modality === 'QUANTUM_PIN'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-[#09101c] border-white/10 text-[#8e8d88] hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span className="font-bold tracking-wider text-[11px]">QUANTUM PIN</span>
              <span className="text-[8px] text-[#8e8d88]">256-bit Hash</span>
            </button>
          </div>

          {/* Interactive Scanning HUD Stage */}
          <div className="relative p-4 rounded-xl bg-[#05080e] border border-white/10 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
            {/* Live Camera Stream Feed for Face/Retina */}
            {(modality === 'FACE_CAMERA' || modality === 'RETINA') && (
              <div className="relative w-full max-w-sm h-52 rounded-xl overflow-hidden border border-cyan-500/40 bg-black/60 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover filter contrast-125 brightness-95"
                />

                {/* Overlaid Optical Target Brackets & Rotating HUD */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Outer Scan Rings */}
                  <div
                    className="w-36 h-36 rounded-full border-2 border-dashed border-cyan-400/70 transition-transform duration-300"
                    style={{ transform: `rotate(${scanAngles}deg)` }}
                  />
                  <div
                    className="absolute w-24 h-24 rounded-full border border-lime-400/80"
                    style={{ transform: `rotate(-${scanAngles * 1.5}deg)` }}
                  />

                  {/* Corner Locking Brackets */}
                  <div className="absolute inset-4 pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                  </div>

                  {/* Sweeping Laser Scan Line */}
                  {isScanning && (
                    <motion.div
                      animate={{ y: [-75, 75, -75] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                      className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00e5ff]"
                    />
                  )}

                  {/* Face Box Indicator if detected */}
                  {bioState.faceBox && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute border-2 border-lime-400 rounded-lg bg-lime-400/10 shadow-[0_0_20px_rgba(212,255,0,0.4)] flex flex-col items-center justify-between p-1"
                      style={{
                        width: `${Math.max(30, bioState.faceBox.width * 100)}%`,
                        height: `${Math.max(40, bioState.faceBox.height * 100)}%`
                      }}
                    >
                      <span className="text-[8px] font-bold text-lime-300 bg-black/80 px-1 rounded">
                        SUBJECT: {bioState.faceConfidence.toFixed(0)}%
                      </span>
                      <span className="text-[8px] font-bold text-cyan-300 bg-black/80 px-1 rounded">
                        LIVENESS: {bioState.livenessScore.toFixed(0)}%
                      </span>
                    </motion.div>
                  )}

                  {/* Verified Overlay */}
                  {isVerified && (
                    <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="w-12 h-12 text-emerald-400 animate-bounce" />
                      <span className="text-xs font-bold tracking-widest text-emerald-300 bg-black/80 px-3 py-1 rounded-full border border-emerald-500/50">
                        BIOMETRIC IDENTITY CONFIRMED
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage 2: VOICEPRINT ANALYZER */}
            {modality === 'VOICEPRINT' && (
              <div className="relative flex flex-col items-center gap-4 w-full max-w-xs py-4">
                <div className="flex items-center justify-center gap-1.5 h-20 w-full px-4 bg-[#09101c] rounded-xl border border-white/5">
                  {audioFreqs.map((val, idx) => (
                    <motion.div
                      key={idx}
                      className="w-2.5 rounded-full transition-all duration-100"
                      style={{
                        height: `${val}%`,
                        backgroundColor:
                          idx % 3 === 0 ? '#00e5ff' : idx % 3 === 1 ? '#d4ff00' : '#ec4899',
                        boxShadow: '0 0 8px currentColor'
                      }}
                    />
                  ))}
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xs font-bold tracking-wider text-[#d4ff00] flex items-center justify-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>SOVEREIGN HARMONIC VOICELOCK</span>
                  </div>
                  <div className="text-[10px] text-[#8e8d88]">
                    Say: <span className="text-white font-bold">"JARVIS, ELEVATE SOKOVIA AUTHORITY"</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3: QUANTUM PIN ENCRYPTOR */}
            {modality === 'QUANTUM_PIN' && (
              <form onSubmit={handleQuantumPinSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs py-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold tracking-widest text-purple-300">
                    256-BIT QUANTUM HASH KEY
                  </span>
                </div>
                <input
                  type="password"
                  maxLength={12}
                  value={pinInput}
                  placeholder="Enter Passcode (e.g. 7701-UAE)"
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-2 text-center text-sm font-mono tracking-widest rounded-lg bg-[#09101c] border border-purple-500/40 text-white focus:outline-none focus:border-purple-400 shadow-inner"
                />
                <span className="text-[9px] text-[#8e8d88]">
                  Sandbox Override: Any 4+ character sequence
                </span>
              </form>
            )}

            {/* Diagnostic Message Bar & Telemetry */}
            <div className="w-full mt-3 space-y-1.5 border-t border-white/10 pt-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#8e8d88] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span className="text-[#c4c3be]">{bioState.stepMessage}</span>
                </span>
                <span
                  className="font-bold font-mono"
                  style={{
                    color: isVerified ? '#10b981' : '#00e5ff'
                  }}
                >
                  {isVerified ? '100% (AUTHORIZED)' : `${bioState.irisAlignmentPct}%`}
                </span>
              </div>

              {/* Multi-tier Diagnostics bar */}
              <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-400 pt-1">
                <div className="bg-black/40 p-1.5 rounded border border-white/5 flex flex-col">
                  <span>Confidence:</span>
                  <span className="font-bold text-cyan-300">
                    {bioState.faceConfidence > 0 ? `${bioState.faceConfidence.toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="bg-black/40 p-1.5 rounded border border-white/5 flex flex-col">
                  <span>Liveness:</span>
                  <span className="font-bold text-lime-300">
                    {bioState.livenessScore > 0 ? `${bioState.livenessScore.toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="bg-black/40 p-1.5 rounded border border-white/5 flex flex-col">
                  <span>Reticle Status:</span>
                  <span className="font-bold text-emerald-300">
                    {bioState.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Footer Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateInstantPass}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold tracking-wider flex items-center gap-1.5 transition"
                title="Bypass camera requirement for test environments"
              >
                <Play className="w-3 h-3 text-cyan-400" />
                <span>SIMULATE BIOMETRIC PASS</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  biometricAuthService.stopVerification();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-xs text-[#8e8d88] hover:text-white transition-colors"
              >
                Cancel
              </button>

              {modality === 'QUANTUM_PIN' ? (
                <button
                  type="button"
                  onClick={handleQuantumPinSubmit}
                  disabled={isVerified}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50"
                >
                  Authorize Token
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCameraVerification}
                  disabled={isVerified}
                  className="px-5 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-black font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning Face...</span>
                    </>
                  ) : isVerified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                      <span>Unlocked</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Scan Presence</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
