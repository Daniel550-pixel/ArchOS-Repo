import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  Radio,
  Zap,
  Cpu,
  Globe,
  Sliders,
  X,
  Server,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  ScanFace
} from 'lucide-react';
import { speechService } from '../../services/voice/speechService';
import { BiometricVerificationModal } from './BiometricVerificationModal';
import { biometricAuthService } from '../../services/security/biometricAuthService';

interface SokoviaProtocolPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SokoviaProtocolPanel: React.FC<SokoviaProtocolPanelProps> = ({
  isOpen,
  onClose
}) => {
  // Sovereign authorization status derived from BiometricAuthService
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    biometricAuthService.isModuleUnlocked('SOKOVIA')
  );
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = biometricAuthService.subscribe((state) => {
      setIsUnlocked(state.unlockedModules.SOKOVIA);
    });
    return () => unsub();
  }, []);

  // Protected settings state
  const [defconLevel, setDefconLevel] = useState<number>(1);
  const [sovereignComputeOverride, setSovereignComputeOverride] = useState<boolean>(true);
  const [satelliteGridReassignment, setSatelliteGridReassignment] = useState<boolean>(false);
  const [autonomousDroneInterception, setAutonomousDroneInterception] = useState<boolean>(false);
  const [quantumEncryptionEnforced, setQuantumEncryptionEnforced] = useState<boolean>(true);
  const [airspaceBubbleRadiusKm, setAirspaceBubbleRadiusKm] = useState<number>(45);

  const handleOpenBiometricModal = () => {
    setShowBiometricModal(true);
  };

  const handleBiometricSuccess = () => {
    biometricAuthService.unlockModuleManually('SOKOVIA');
    speechService.speak(
      'Sokovia Protocol parameters unlocked. You now possess full root-level executive authority over Emirates sovereign defense networks.'
    );
  };

  const handleRelock = () => {
    biometricAuthService.lockModule('SOKOVIA');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono-tech select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#070c16] border-2 border-[#ec4899]/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#ec4899]/30"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ec4899]/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#ec4899]/20 border border-[#ec4899] text-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.4)]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wider text-white">
                    SOKOVIA PROTOCOL CONTROLS
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/50">
                    RESTRICTED // DEFCON-1
                  </span>
                </div>
                <span className="text-[10px] text-[#8e8d88]">
                  Autonomous Strategic Defense, Sovereign Grid Isolation & Counter-Threat Override
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isUnlocked && (
                <button
                  onClick={handleRelock}
                  className="px-2.5 py-1 rounded bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-[#ec4899] text-[10px] flex items-center gap-1 transition-all"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Protocol</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Locked State Banner vs Unlocked Authority Banner */}
          {!isUnlocked ? (
            <div className="p-4 rounded-xl bg-[#130716] border border-[#ec4899]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-[#ec4899]/20 text-[#ec4899] animate-pulse">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#ec4899] tracking-wider uppercase">
                    AUTHORITY LOCKED
                  </span>
                  <span className="text-[10px] text-[#8e8d88]">
                    Biometric optical retina or sovereign voice-print verification required to modify root parameters.
                  </span>
                </div>
              </div>

              <button
                onClick={handleOpenBiometricModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ec4899] hover:bg-[#ec4899]/90 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(236,72,153,0.5)] transition-all shrink-0"
              >
                <KeyRound className="w-4 h-4" />
                <span>Verify Biometrics</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#091a18] border border-[#10b981]/50 flex items-center justify-between text-[#10b981]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    BIOMETRIC AUTHORITY VERIFIED // CLEARANCE LVL 9
                  </span>
                  <span className="text-[10px] text-[#8e8d88]">
                    Principal: Salden Daan · Full Sovereign Execution Enabled
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#10b981]/20 border border-[#10b981]/50">
                ACTIVE
              </span>
            </div>
          )}

          {/* Configurable Protocol Directives (Disabled when locked) */}
          <div className={`space-y-3 transition-opacity ${!isUnlocked ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {/* DEFCON Slider */}
            <div className="p-3.5 rounded-xl bg-[#09101c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#ec4899]" />
                  <span>Strategic Alert Status:</span>
                </span>
                <span className="px-2 py-0.5 rounded font-bold text-xs bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/40">
                  DEFCON {defconLevel}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={defconLevel}
                onChange={(e) => setDefconLevel(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#ec4899]"
              />
              <div className="flex justify-between text-[9px] text-[#8e8d88]">
                <span className="text-[#ec4899] font-bold">1: Maximum Readiness</span>
                <span>3: Heightened</span>
                <span>5: Nominal Peace</span>
              </div>
            </div>

            {/* Airspace Bubble Range */}
            <div className="p-3.5 rounded-xl bg-[#09101c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#00e5ff]" />
                  <span>Active Sovereign Airspace Bubble:</span>
                </span>
                <span className="text-[#00e5ff] font-bold">{airspaceBubbleRadiusKm} km radius</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={airspaceBubbleRadiusKm}
                onChange={(e) => setAirspaceBubbleRadiusKm(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#111622] rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
              />
            </div>

            {/* Toggle Directives */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => setSovereignComputeOverride(!sovereignComputeOverride)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  sovereignComputeOverride
                    ? 'bg-[#ec4899]/15 border-[#ec4899]/60 text-white'
                    : 'bg-[#09101c] border-white/5 text-[#8e8d88]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Sovereign TPU Preemption</span>
                  <span className="text-[9px] text-[#8e8d88]">Prioritize defense model loads</span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    sovereignComputeOverride
                      ? 'bg-[#ec4899] border-[#ec4899] text-white'
                      : 'border-white/20'
                  }`}
                >
                  {sovereignComputeOverride && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>

              <div
                onClick={() => setAutonomousDroneInterception(!autonomousDroneInterception)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  autonomousDroneInterception
                    ? 'bg-[#00e5ff]/15 border-[#00e5ff]/60 text-white'
                    : 'bg-[#09101c] border-white/5 text-[#8e8d88]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Autonomous Interception</span>
                  <span className="text-[9px] text-[#8e8d88]">Real-time kinematic neutralization</span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    autonomousDroneInterception
                      ? 'bg-[#00e5ff] border-[#00e5ff] text-black'
                      : 'border-white/20'
                  }`}
                >
                  {autonomousDroneInterception && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>

              <div
                onClick={() => setSatelliteGridReassignment(!satelliteGridReassignment)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  satelliteGridReassignment
                    ? 'bg-[#d4ff00]/15 border-[#d4ff00]/60 text-white'
                    : 'bg-[#09101c] border-white/5 text-[#8e8d88]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Recon Satellite Constellation</span>
                  <span className="text-[9px] text-[#8e8d88]">Lock optical synthetic aperture</span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    satelliteGridReassignment
                      ? 'bg-[#d4ff00] border-[#d4ff00] text-black'
                      : 'border-white/20'
                  }`}
                >
                  {satelliteGridReassignment && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>

              <div
                onClick={() => setQuantumEncryptionEnforced(!quantumEncryptionEnforced)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  quantumEncryptionEnforced
                    ? 'bg-[#10b981]/15 border-[#10b981]/60 text-white'
                    : 'bg-[#09101c] border-white/5 text-[#8e8d88]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Post-Quantum Cryptography</span>
                  <span className="text-[9px] text-[#8e8d88]">Kyber-1024 mesh isolation</span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    quantumEncryptionEnforced
                      ? 'bg-[#10b981] border-[#10b981] text-black'
                      : 'border-white/20'
                  }`}
                >
                  {quantumEncryptionEnforced && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-[#8e8d88]">
              Emergency Protocol Override · JARVIS Core Security Aegis
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-white font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={handleBiometricSuccess}
      />
    </>
  );
};
