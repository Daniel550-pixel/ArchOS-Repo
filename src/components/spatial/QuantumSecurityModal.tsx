// src/components/spatial/QuantumSecurityModal.tsx
// Full-Screen / Modal Sovereign Quantum Encryption Command Center

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  Shield,
  X,
  RefreshCw,
  Zap,
  CheckCircle2,
  Radio,
  Sliders,
  Terminal,
  Activity,
  Cpu,
  Lock,
  Unlock,
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { QuantumEncryptionVisualizer } from './QuantumEncryptionVisualizer';
import { quantumCryptoService, QuantumAlgorithm } from '../../services/security/quantumCryptoService';
import { speechService } from '../../services/voice/speechService';

interface QuantumSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuantumSecurityModal: React.FC<QuantumSecurityModalProps> = ({ isOpen, onClose }) => {
  const [quantumState, setQuantumState] = useState(quantumCryptoService.getStatus());
  const [activeTab, setActiveTab] = useState<'visualizer' | 'telemetry' | 'ciphers' | 'tenants'>('visualizer');

  useEffect(() => {
    const unsub = quantumCryptoService.subscribe(() => {
      setQuantumState(quantumCryptoService.getStatus());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSpeak = (text: string) => {
    speechService.speak(text);
  };

  const handleSwitchAlgo = (algo: QuantumAlgorithm) => {
    quantumCryptoService.setAlgorithm(algo);
    handleSpeak(`Switched quantum encryption cipher to ${algo}. All sovereign data channels re-encapsulated.`);
  };

  const handleRotateKey = () => {
    quantumCryptoService.rotateKeyPair(false);
    handleSpeak("Manual key rotation committed. New post-quantum lattice fingerprint active.");
  };

  const handleDefendAttack = () => {
    quantumCryptoService.simulateQuantumInterceptDefense();
  };

  return (
    <AnimatePresence>
      <div
        id="quantum-security-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl font-mono-tech select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-[#05080e] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#09101c] border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                <Key className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-cyan-300 tracking-wide">
                    SOVEREIGN QUANTUM CRYPTOGRAPHIC ENCLAVE
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    NIST FIPS 203/204 ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Continuous QKD Stream · ML-KEM-1024 Lattice Hardness · 4096-Bit Photonic Entropy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-black/40 border-b border-white/5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#09101c] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Active Cipher</span>
                <span className="font-bold text-cyan-300 text-xs">{quantumState.activeKey.algorithmName.split(' ')[0]}</span>
              </div>
              <Lock className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="p-2.5 rounded-xl bg-[#09101c] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Qubit Coherence</span>
                <span className="font-bold text-emerald-400 text-xs">{quantumState.activeKey.coherencePct}%</span>
              </div>
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>

            <div className="p-2.5 rounded-xl bg-[#09101c] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Auto-Rekey Epoch</span>
                <span className="font-bold text-[#d4ff00] text-xs">00:{quantumState.activeKey.timeRemainingSec < 10 ? `0${quantumState.activeKey.timeRemainingSec}` : quantumState.activeKey.timeRemainingSec}s</span>
              </div>
              <RefreshCw className="w-4 h-4 text-[#d4ff00]" />
            </div>

            <div className="p-2.5 rounded-xl bg-[#09101c] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Payloads Encrypted</span>
                <span className="font-bold text-white text-xs">{quantumState.encryptedPayloadsCount.toLocaleString()}</span>
              </div>
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          {/* Modal Body: Visualizer Layer */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
            <QuantumEncryptionVisualizer onSpeak={handleSpeak} />

            {/* Post-Quantum NIST Algorithms Selector Cards */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                NIST Post-Quantum Cryptographic Ciphers & Quantum Key Distribution
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {quantumState.supportedAlgorithms.map((algo) => {
                  const isSelected = quantumState.activeKey.algorithm === algo.id;
                  return (
                    <div
                      key={algo.id}
                      onClick={() => handleSwitchAlgo(algo.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                          : 'bg-[#09101c] border-white/10 hover:border-cyan-500/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                            {algo.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                            {algo.standard}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {algo.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                        <span className="text-emerald-400 font-mono font-bold">
                          {algo.securityLevel}
                        </span>
                        {isSelected ? (
                          <span className="text-cyan-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="text-slate-500">Deploy</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
