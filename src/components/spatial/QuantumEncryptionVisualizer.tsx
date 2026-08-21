// src/components/spatial/QuantumEncryptionVisualizer.tsx
// Quantum Encryption & Post-Quantum Cryptographic Key Visualizer for ArchOS Sovereign FinOps

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  Radio,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  Terminal,
  Volume2
} from 'lucide-react';

export interface QuantumKeyInfo {
  id: string;
  algorithm: 'KYBER_1024' | 'QKD_BB84' | 'DILITHIUM_5' | 'FALCON_1024';
  algorithmName: string;
  fingerprint: string;
  entropySource: string;
  coherencePct: number;
  qubitsCount: number;
  rotationIntervalSec: number;
  timeRemainingSec: number;
  status: 'ACTIVE_ENCRYPTED' | 'ROTATING' | 'INTERCEPT_DEFLECTED';
  tenantChannel: string;
  securityRating: string;
}

interface QuantumEncryptionVisualizerProps {
  onSpeak?: (text: string) => void;
}

const INITIAL_KEY_DATA: QuantumKeyInfo = {
  id: 'UAE-QKEY-9942-SVR',
  algorithm: 'KYBER_1024',
  algorithmName: 'NIST ML-KEM / Kyber-1024 (Module-Lattice)',
  fingerprint: 'e8f2-9b41-ca07-3d12-88f1-ae90-77cb-419a',
  entropySource: 'Abu Dhabi Quantum Research Center QRNG (Photonic)',
  coherencePct: 99.98,
  qubitsCount: 4096,
  rotationIntervalSec: 20,
  timeRemainingSec: 18,
  status: 'ACTIVE_ENCRYPTED',
  tenantChannel: 'ALL SOVEREIGN & ENTERPRISE CHANNELS',
  securityRating: 'DEFCON-1 POST-QUANTUM RESISTANT'
};

const SECURITY_CHANNELS = [
  {
    tenant: 'Dubai Government Media Office (DGM)',
    tier: 'DEFCON-1 Sovereign',
    cipher: 'QKD BB84 + ML-KEM-1024',
    keyId: 'QKD-DGM-001',
    status: 'OPTIMAL',
    coherence: '99.99%',
    latency: '0.4ms'
  },
  {
    tenant: 'DEWA Smart Grid Intelligence',
    tier: 'Critical Infrastructure',
    cipher: 'Kyber-1024 Lattice Shield',
    keyId: 'KYB-DEWA-419',
    status: 'OPTIMAL',
    coherence: '99.96%',
    latency: '0.8ms'
  },
  {
    tenant: 'RTA Dubai Autonomous Mobility',
    tier: 'Civic Enterprise',
    cipher: 'Hybrid AES-256 + Dilithium-5',
    keyId: 'DIL-RTA-882',
    status: 'OPTIMAL',
    coherence: '99.92%',
    latency: '1.2ms'
  },
  {
    tenant: 'DAMAC Strategic Twin Development',
    tier: 'Civic Enterprise',
    cipher: 'Zero-Knowledge Kyber Vault',
    keyId: 'KYB-DAM-104',
    status: 'OPTIMAL',
    coherence: '99.88%',
    latency: '1.6ms'
  },
  {
    tenant: 'Public Sandbox Developer Cohort',
    tier: 'Community Sandbox',
    cipher: 'FIPS-140-3 Hardware Enclave',
    keyId: 'ENC-SBX-012',
    status: 'GATED',
    coherence: '99.50%',
    latency: '3.1ms'
  }
];

export const QuantumEncryptionVisualizer: React.FC<QuantumEncryptionVisualizerProps> = ({ onSpeak }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [keyInfo, setKeyInfo] = useState<QuantumKeyInfo>(INITIAL_KEY_DATA);
  const [selectedAlgo, setSelectedAlgo] = useState<'KYBER_1024' | 'QKD_BB84' | 'DILITHIUM_5' | 'FALCON_1024'>('KYBER_1024');
  const [isRotating, setIsRotating] = useState(false);
  const [attackSimulation, setAttackSimulation] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<string | null>(null);
  const [entropyWaveform, setEntropyWaveform] = useState<number[]>(() =>
    Array.from({ length: 32 }, () => Math.random() * 0.4 + 0.6)
  );

  const [logs, setLogs] = useState<Array<{ id: string; time: string; msg: string; type: 'info' | 'secure' | 'warn' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), msg: 'Quantum Key Distribution (QKD) continuous channel online', type: 'secure' },
    { id: '2', time: new Date().toLocaleTimeString(), msg: 'QRNG entropy seed initialized with 4096-bit photonic pool', type: 'info' },
    { id: '3', time: new Date().toLocaleTimeString(), msg: 'Post-Quantum Lattice parameters verified against NIST FIPS 203', type: 'secure' }
  ]);

  // Generate random hash fingerprint
  const generateNewFingerprint = () => {
    const chars = '0123456789abcdef';
    const parts: string[] = [];
    for (let p = 0; p < 8; p++) {
      let segment = '';
      for (let i = 0; i < 4; i++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      parts.push(segment);
    }
    return parts.join('-');
  };

  // Trigger Key Rotation
  const triggerKeyRotation = useCallback(() => {
    setIsRotating(true);
    setKeyInfo((prev) => ({
      ...prev,
      status: 'ROTATING',
      fingerprint: generateNewFingerprint(),
      qubitsCount: Math.floor(Math.random() * 1024) + 4096,
      coherencePct: Number((99.94 + Math.random() * 0.05).toFixed(2)),
      timeRemainingSec: prev.rotationIntervalSec
    }));

    const newLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      msg: `Quantum cryptographic key rotated: Fingerprint refreshed to [${generateNewFingerprint().slice(0, 14)}...]`,
      type: 'secure' as const
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 8)]);

    setTimeout(() => {
      setIsRotating(false);
      setKeyInfo((prev) => ({ ...prev, status: 'ACTIVE_ENCRYPTED' }));
    }, 1200);
  }, []);

  // Countdown timer for automatic re-keying
  useEffect(() => {
    const interval = setInterval(() => {
      setKeyInfo((prev) => {
        if (prev.timeRemainingSec <= 1) {
          triggerKeyRotation();
          return { ...prev, timeRemainingSec: prev.rotationIntervalSec };
        }
        return { ...prev, timeRemainingSec: prev.timeRemainingSec - 1 };
      });

      // Update entropy jitter
      setEntropyWaveform((prev) => {
        const next = [...prev.slice(1)];
        next.push(Math.random() * 0.3 + 0.7);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [triggerKeyRotation]);

  // Handle Algorithm Switch
  const handleAlgorithmChange = (algo: 'KYBER_1024' | 'QKD_BB84' | 'DILITHIUM_5' | 'FALCON_1024') => {
    setSelectedAlgo(algo);
    let name = 'NIST ML-KEM / Kyber-1024 (Module-Lattice)';
    if (algo === 'QKD_BB84') name = 'QKD BB84 Protocol (Entangled Photon Wave)';
    if (algo === 'DILITHIUM_5') name = 'NIST ML-DSA / Dilithium-5 (Lattice Signature)';
    if (algo === 'FALCON_1024') name = 'Falcon-1024 (Fast-Fourier Ring-LWE)';

    setKeyInfo((prev) => ({
      ...prev,
      algorithm: algo,
      algorithmName: name,
      fingerprint: generateNewFingerprint(),
      timeRemainingSec: prev.rotationIntervalSec
    }));

    const newLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      msg: `Cryptographic cipher switched to ${name}`,
      type: 'info' as const
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 8)]);

    if (onSpeak) {
      onSpeak(`Switched quantum encryption cipher to ${name}. All tenant data streams re-keyed.`);
    }
  };

  // Simulate Quantum Intercept Attack
  const handleSimulateAttack = () => {
    setAttackSimulation(true);
    setAttackResult('Simulating Shor / Grover quantum superposition intercept...');

    const attackLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      msg: 'WARN: Quantum state perturbation detected on channel #3. Wavefunction collapsing.',
      type: 'warn' as const
    };
    setLogs((prev) => [attackLog, ...prev.slice(0, 8)]);

    setTimeout(() => {
      setKeyInfo((prev) => ({ ...prev, status: 'INTERCEPT_DEFLECTED' }));
      setAttackResult('ATTACK DEFLECTED: Quantum Observer Effect triggered automatic photon state collapse. Compromised basis discarded, instant zero-loss re-keying executed.');

      const successLog = {
        id: (Date.now() + 1).toString(),
        time: new Date().toLocaleTimeString(),
        msg: 'DEFLECTED: Quantum lattice structure unbroken. Instant re-keying verified.',
        type: 'secure' as const
      };
      setLogs((prev) => [successLog, ...prev.slice(0, 8)]);
      triggerKeyRotation();

      if (onSpeak) {
        onSpeak('Quantum intercept attempt deflected. Observer effect triggered automatic basis re-generation. Sovereign data integrity preserved.');
      }

      setTimeout(() => {
        setAttackSimulation(false);
      }, 3500);
    }, 1800);
  };

  // 2D/3D Canvas rendering loop for Rotating Cryptographic Key & Lattice Rings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    const particles: Array<{ x: number; y: number; angle: number; dist: number; speed: number; size: number; color: string }> = [];

    // Initialize photonic particles
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: 0,
        y: 0,
        angle: Math.random() * Math.PI * 2,
        dist: 70 + Math.random() * 110,
        speed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2 + 1.2,
        color: Math.random() > 0.3 ? '#00e5ff' : '#d4ff00'
      });
    }

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Background ambient gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(w, h) * 0.6);
      bgGrad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      bgGrad.addColorStop(0.5, 'rgba(9, 16, 28, 0.4)');
      bgGrad.addColorStop(1, 'rgba(5, 8, 14, 0.85)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 1. Draw Outer Hexadecimal Key Entropy Ring (Clockwise)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.4);

      ctx.strokeStyle = isRotating ? '#d4ff00' : 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 160, 0, Math.PI * 2);
      ctx.stroke();

      // Ring Notch indicators
      const notchCount = 36;
      for (let i = 0; i < notchCount; i++) {
        const rad = (i / notchCount) * Math.PI * 2;
        const innerR = 155;
        const outerR = i % 4 === 0 ? 168 : 162;
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(0, 229, 255, 0.8)' : 'rgba(0, 229, 255, 0.3)';
        ctx.lineWidth = i % 4 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * innerR, Math.sin(rad) * innerR);
        ctx.lineTo(Math.cos(rad) * outerR, Math.sin(rad) * outerR);
        ctx.stroke();
      }

      // Draw Rotating Hex Characters along the rim
      ctx.fillStyle = 'rgba(0, 229, 255, 0.65)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const hexChars = ['0xAE', '0xF4', 'QKD', 'LATTICE', '0x99', '0x12', 'KYBER', 'ENTROPY', '0x88', 'AES-256', 'SOVEREIGN', '0xBB'];
      for (let i = 0; i < hexChars.length; i++) {
        const rad = (i / hexChars.length) * Math.PI * 2;
        const tx = Math.cos(rad) * 142;
        const ty = Math.sin(rad) * 142;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rad + Math.PI / 2);
        ctx.fillText(hexChars[i], 0, 0);
        ctx.restore();
      }
      ctx.restore();

      // 2. Draw Middle Counter-Rotating Post-Quantum Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 0.7);

      ctx.strokeStyle = attackSimulation ? '#ec4899' : 'rgba(212, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 18, 4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 115, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cryptographic Node Interconnects
      const nodeCount = 8;
      for (let i = 0; i < nodeCount; i++) {
        const rad = (i / nodeCount) * Math.PI * 2;
        const nx = Math.cos(rad) * 115;
        const ny = Math.sin(rad) * 115;

        ctx.fillStyle = attackSimulation ? '#ec4899' : '#d4ff00';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();

        // Connect cross lines
        if (i % 2 === 0) {
          ctx.strokeStyle = 'rgba(212, 255, 0, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(-nx, -ny);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 3. Draw Photonic Entangled Particles Orbiting
      ctx.save();
      ctx.translate(cx, cy);
      particles.forEach((p) => {
        p.angle += p.speed;
        const px = Math.cos(p.angle) * p.dist;
        const py = Math.sin(p.angle) * p.dist * 0.75; // Isometric tilt

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.restore();

      // 4. Central 3D Rotating Quantum Key Lattice (Octahedron / Polyhedron Wireframe)
      ctx.save();
      ctx.translate(cx, cy);

      const rotX = angle * 0.8;
      const rotY = angle * 1.1;

      // 3D vertices of a dual-pyramid lattice octahedron
      const s = isRotating ? 52 + Math.sin(angle * 12) * 6 : 46;
      const vertices3D = [
        { x: 0, y: -s * 1.3, z: 0 }, // Top Apex
        { x: s, y: 0, z: 0 },
        { x: 0, y: 0, z: s },
        { x: -s, y: 0, z: 0 },
        { x: 0, y: 0, z: -s },
        { x: 0, y: s * 1.3, z: 0 }  // Bottom Apex
      ];

      // Project 3D -> 2D with isometric yaw/pitch
      const projected = vertices3D.map((v) => {
        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = v.x * cosY + v.z * sinY;
        const z1 = -v.x * sinY + v.z * cosY;

        // Rotate around X
        const cosX = Math.cos(rotX * 0.5);
        const sinX = Math.sin(rotX * 0.5);
        const y2 = v.y * cosX - z1 * sinX;
        const z2 = v.y * sinX + z1 * cosX;

        return { x: x1, y: y2, z: z2 };
      });

      // Draw Polyhedron Edges
      const edges = [
        [0, 1], [0, 2], [0, 3], [0, 4], // Top edges
        [5, 1], [5, 2], [5, 3], [5, 4], // Bottom edges
        [1, 2], [2, 3], [3, 4], [4, 1]  // Equator
      ];

      ctx.strokeStyle = attackSimulation
        ? 'rgba(236, 72, 153, 0.85)'
        : isRotating
        ? 'rgba(212, 255, 0, 0.95)'
        : 'rgba(0, 229, 255, 0.85)';
      ctx.lineWidth = 1.8;

      edges.forEach(([i1, i2]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i1].x, projected[i1].y);
        ctx.lineTo(projected[i2].x, projected[i2].y);
        ctx.stroke();
      });

      // Central Quantum Core Node
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, attackSimulation ? '#ec4899' : '#00e5ff');
      coreGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Core Key Glyph
      ctx.fillStyle = '#05080e';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QK', 0, 0);

      ctx.restore();

      angle += 0.015;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRotating, attackSimulation]);

  return (
    <div
      id="quantum-encryption-visualizer-root"
      className="w-full flex flex-col bg-[#05080e] border border-cyan-500/20 rounded-2xl overflow-hidden font-mono-tech select-none"
    >
      {/* Visualizer Header */}
      <div className="px-5 py-3.5 bg-[#09101c] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-cyan-300 tracking-wide">
                QUANTUM ENCRYPTION VISUALIZER
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                POST-QUANTUM RESISTANT
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Lattice-Based Key Distribution · Live Qubit Coherence · NIST FIPS 203/204 Active Protocol
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Algorithm Selector */}
          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => handleAlgorithmChange('KYBER_1024')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedAlgo === 'KYBER_1024'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kyber-1024
            </button>
            <button
              onClick={() => handleAlgorithmChange('QKD_BB84')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedAlgo === 'QKD_BB84'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              QKD BB84
            </button>
            <button
              onClick={() => handleAlgorithmChange('DILITHIUM_5')}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                selectedAlgo === 'DILITHIUM_5'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dilithium-5
            </button>
          </div>

          {/* Trigger Re-key */}
          <button
            onClick={triggerKeyRotation}
            disabled={isRotating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span>Rotate Key Pair</span>
          </button>

          {/* Test Quantum Attack Defense */}
          <button
            onClick={handleSimulateAttack}
            disabled={attackSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-300 text-xs font-bold transition shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Test Intercept Defense</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-white/5">
        {/* Left Side: 3D Rotating Cryptographic Key Canvas (Col 1-7) */}
        <div className="lg:col-span-7 relative h-[380px] bg-black flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
          <canvas
            ref={canvasRef}
            width={480}
            height={380}
            className="w-full h-full object-contain"
          />

          {/* Real-time Overlay Top-Left */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded-xl text-xs space-y-1 z-10 shadow-xl">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-bold text-cyan-300">ACTIVE CIPHER PROTOCOL:</span>
            </div>
            <div className="text-[11px] text-white font-mono font-bold">
              {keyInfo.algorithmName}
            </div>
            <div className="text-[10px] text-slate-400">
              Entropy Seed: {keyInfo.entropySource}
            </div>
          </div>

          {/* Real-Time Key Rotation Timer Badge Top-Right */}
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-[#d4ff00]/40 px-3 py-2 rounded-xl text-xs space-y-0.5 z-10 text-right shadow-xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Auto-Rekey Countdown
            </span>
            <div className="text-sm font-bold text-[#d4ff00] font-mono">
              00:{keyInfo.timeRemainingSec < 10 ? `0${keyInfo.timeRemainingSec}` : keyInfo.timeRemainingSec}s
            </div>
            <div className="text-[9px] text-slate-400">
              Interval: {keyInfo.rotationIntervalSec}s periodic epoch
            </div>
          </div>

          {/* Live Qubit Coherence Bar Bottom-Left */}
          <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-white/10 p-2.5 rounded-xl z-10 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Qubit Coherence</span>
                <span className="font-bold text-emerald-400">{keyInfo.coherencePct}%</span>
              </div>
            </div>

            {/* Waveform graphic */}
            <div className="flex items-end gap-0.5 h-6 flex-1 max-w-[180px]">
              {entropyWaveform.map((val, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400/70 rounded-t"
                  style={{ height: `${val * 100}%` }}
                />
              ))}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Key Fingerprint</span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">
                {keyInfo.fingerprint.slice(0, 19)}...
              </span>
            </div>
          </div>

          {/* Attack Alert Overlay */}
          <AnimatePresence>
            {attackSimulation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pink-950/40 backdrop-blur-sm border-2 border-pink-500 flex flex-col items-center justify-center p-6 text-center z-20"
              >
                <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500 flex items-center justify-center text-pink-400 mb-3 animate-bounce">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-base font-bold text-pink-300 mb-1">
                  QUANTUM INTERCEPT SIMULATION
                </div>
                <p className="text-xs text-slate-200 max-w-md">
                  {attackResult}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Data Security Status & Tenant Encryption Matrix (Col 8-12) */}
        <div className="lg:col-span-5 p-4 flex flex-col justify-between bg-[#09101c]/50 text-xs space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                TENANT CHANNEL ENCRYPTION STATUS
              </span>
              <span className="text-[10px] text-slate-400">
                5 Active Sovereign Streams
              </span>
            </div>

            {/* Channels List */}
            <div className="space-y-2 mt-3">
              {SECURITY_CHANNELS.map((ch) => (
                <div
                  key={ch.tenant}
                  className="p-2.5 rounded-xl bg-[#05080e] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5 max-w-[210px]">
                    <div className="font-bold text-white truncate text-[11px]">{ch.tenant}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{ch.cipher}</div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {ch.status}
                    </span>
                    <div className="text-[9px] text-slate-400">Coherence: {ch.coherence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Event Log Stream */}
          <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                LIVE AUDIT STREAM
              </span>
              <span>AES-256-GCM + ML-KEM</span>
            </div>

            <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[10px]">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'secure'
                        ? 'text-emerald-300'
                        : log.type === 'warn'
                        ? 'text-pink-400'
                        : 'text-cyan-300'
                    }
                  >
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
