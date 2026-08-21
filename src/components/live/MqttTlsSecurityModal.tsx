import React, { useState } from 'react';
import { GlassPanel } from '../layout/GlassPanel';
import {
  Lock,
  ShieldCheck,
  Key,
  Server,
  FileCode,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sliders,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  MqttTlsConfig,
  TlsHandshakeInfo,
  MqttAuthMode,
  generateMosquittoTlsConfig,
  generateAclConfig,
  generatePythonTlsPublisher
} from '../../services/mqttTlsSecurity';

interface MqttTlsSecurityModalProps {
  config: MqttTlsConfig;
  tlsInfo: TlsHandshakeInfo;
  onUpdateConfig: (newConfig: Partial<MqttTlsConfig>) => void;
  onClose: () => void;
}

export const MqttTlsSecurityModal: React.FC<MqttTlsSecurityModalProps> = ({
  config,
  tlsInfo,
  onUpdateConfig,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'CERTS' | 'DEPLOYMENT_SCRIPTS'>('CONFIG');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [formHost, setFormHost] = useState(config.host);
  const [formPort, setFormPort] = useState(config.port);
  const [formProtocol, setFormProtocol] = useState<'wss' | 'ws'>(config.protocol);
  const [formAuthMode, setFormAuthMode] = useState<MqttAuthMode>(config.authMode);
  const [formUsername, setFormUsername] = useState(config.username || '');
  const [formPassword, setFormPassword] = useState(config.password || '');
  const [formToken, setFormToken] = useState(config.bearerToken || '');
  const [formVerifyCert, setFormVerifyCert] = useState(config.verifyServerCert);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApply = () => {
    onUpdateConfig({
      host: formHost,
      port: Number(formPort),
      protocol: formProtocol,
      authMode: formAuthMode,
      username: formUsername,
      password: formPassword,
      bearerToken: formToken,
      verifyServerCert: formVerifyCert
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#070e1c] border border-[#00e5ff]/30 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.25)] flex flex-col overflow-hidden font-mono-tech select-none">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>MQTT OVER WSS (TLS 1.3) SECURITY ARCHITECTURE</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                  PRODUCTION-GRADE
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                End-to-end cryptographic encryption and sovereign role-based authentication.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/40 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`px-4 py-2 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'CONFIG'
                ? 'bg-[#070e1c] text-[#00e5ff] border-t border-x border-[#00e5ff]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            <span>SECURITY PARAMETERS</span>
          </button>
          <button
            onClick={() => setActiveTab('CERTS')}
            className={`px-4 py-2 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'CERTS'
                ? 'bg-[#070e1c] text-[#10b981] border-t border-x border-[#10b981]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            <span>X.509 CERTIFICATE INSPECTOR</span>
          </button>
          <button
            onClick={() => setActiveTab('DEPLOYMENT_SCRIPTS')}
            className={`px-4 py-2 rounded-t-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'DEPLOYMENT_SCRIPTS'
                ? 'bg-[#070e1c] text-[#d4ff00] border-t border-x border-[#d4ff00]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileCode size={14} />
            <span>BROKER & GATEWAY CODE</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'CONFIG' && (
            <div className="space-y-4 text-xs">
              {/* Transport Protocol & Host */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                    PROTOCOL
                  </label>
                  <select
                    value={formProtocol}
                    onChange={(e) => setFormProtocol(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-2 text-white focus:border-[#00e5ff] focus:outline-none"
                  >
                    <option value="wss">WSS (WebSocket Secure TLS 1.3)</option>
                    <option value="ws">WS (Unsecured Plaintext WebSocket)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                    BROKER HOST / IP
                  </label>
                  <input
                    type="text"
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-2 text-white focus:border-[#00e5ff] focus:outline-none"
                    placeholder="localhost or broker.archos.ae"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                    WSS PORT
                  </label>
                  <input
                    type="number"
                    value={formPort}
                    onChange={(e) => setFormPort(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/20 rounded-xl p-2 text-white focus:border-[#00e5ff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Authentication Mode */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-2">
                    <Key size={14} className="text-[#00e5ff]" />
                    <span>AUTHENTICATION CREDENTIALS</span>
                  </span>
                  <span className="text-[9px] text-[#00e5ff] font-bold">SOVEREIGN ENCLAVE ENFORCED</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'TOKEN_BEARER', label: 'JWT Sovereign Token' },
                    { id: 'SOVEREIGN_CREDENTIALS', label: 'Username & Key' },
                    { id: 'MTLS_CERTIFICATE', label: 'Mutual TLS (mTLS)' },
                    { id: 'ANONYMOUS', label: 'Anonymous (Dev Only)' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFormAuthMode(mode.id as MqttAuthMode)}
                      className={`p-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        formAuthMode === mode.id
                          ? 'bg-[#00e5ff] text-black border-[#00e5ff] shadow-[0_0_10px_#00e5ff]'
                          : 'bg-black/40 text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {formAuthMode === 'TOKEN_BEARER' && (
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      BEARER JWT TOKEN (HMAC-SHA256 / Ed25519)
                    </label>
                    <textarea
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value)}
                      rows={2}
                      className="w-full bg-black/80 border border-white/20 rounded-xl p-2 font-mono text-[10px] text-[#00e5ff] focus:border-[#00e5ff] focus:outline-none"
                    />
                  </div>
                )}

                {formAuthMode === 'SOVEREIGN_CREDENTIALS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">OPERATIVE USERNAME</label>
                      <input
                        type="text"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="w-full bg-black/80 border border-white/20 rounded-xl p-2 text-white focus:border-[#00e5ff] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">SECURITY SECRET KEY</label>
                      <input
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-black/80 border border-white/20 rounded-xl p-2 text-white focus:border-[#00e5ff] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TLS Ciphers & Handshake Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-zinc-400">ACTIVE CIPHER SUITE</span>
                  <p className="text-xs font-bold text-[#10b981]">{config.cipherSuite}</p>
                  <span className="text-[10px] text-zinc-500 block">
                    Protocol: {config.tlsVersion} · Key Exchange: Curve25519 (253-bit ECDHE)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-zinc-400">SERVER CERTIFICATE VERIFICATION</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Strict X.509 Validation</span>
                    <input
                      type="checkbox"
                      checked={formVerifyCert}
                      onChange={(e) => setFormVerifyCert(e.target.checked)}
                      className="w-4 h-4 accent-[#00e5ff] cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    Rejects unauthorized or mismatched broker certificates in production.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CERTS' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 text-[#10b981] font-bold">
                    <ShieldCheck size={16} />
                    <span>ACTIVE BROKER TLS CERTIFICATE (X.509v3)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                    VALID & TRUSTED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">SUBJECT:</span>
                    <span className="text-white font-medium">{tlsInfo.serverCert.subject}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">ISSUER CA:</span>
                    <span className="text-white font-medium">{tlsInfo.serverCert.issuer}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">VALIDITY PERIOD:</span>
                    <span className="text-zinc-300">
                      {tlsInfo.serverCert.validFrom} → {tlsInfo.serverCert.validTo}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">SUBJECT ALT NAMES (SAN):</span>
                    <span className="text-[#00e5ff]">{tlsInfo.serverCert.san.join(', ')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-zinc-400 block text-[10px] mb-1">SHA-256 FINGERPRINT:</span>
                  <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-[#ffd700] break-all border border-white/10">
                    {tlsInfo.serverCert.fingerprintSha256}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DEPLOYMENT_SCRIPTS' && (
            <div className="space-y-4 text-xs">
              {/* Mosquitto TLS Conf */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00e5ff] text-[11px]">
                    1. mosquitto.conf (TLS 1.3 + WSS Port 8884)
                  </span>
                  <button
                    onClick={() => handleCopy(generateMosquittoTlsConfig(), 'mosq_conf')}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'mosq_conf' ? <CheckCircle2 size={12} className="text-[#10b981]" /> : <Copy size={12} />}
                    <span>{copiedKey === 'mosq_conf' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded bg-black/80 font-mono text-[10px] text-zinc-300 overflow-x-auto border border-white/10 max-h-40">
                  {generateMosquittoTlsConfig()}
                </pre>
              </div>

              {/* ACL Conf */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ffd700] text-[11px]">
                    2. /etc/mosquitto/acl.conf (Role-Based Access Control)
                  </span>
                  <button
                    onClick={() => handleCopy(generateAclConfig(), 'acl_conf')}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'acl_conf' ? <CheckCircle2 size={12} className="text-[#10b981]" /> : <Copy size={12} />}
                    <span>{copiedKey === 'acl_conf' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded bg-black/80 font-mono text-[10px] text-zinc-300 overflow-x-auto border border-white/10 max-h-32">
                  {generateAclConfig()}
                </pre>
              </div>

              {/* Python TLS Publisher */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#10b981] text-[11px]">
                    3. backend/telemetry_pub_tls.py (Production TLS 1.3 Ingestion Script)
                  </span>
                  <button
                    onClick={() => handleCopy(generatePythonTlsPublisher(), 'py_pub')}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'py_pub' ? <CheckCircle2 size={12} className="text-[#10b981]" /> : <Copy size={12} />}
                    <span>{copiedKey === 'py_pub' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded bg-black/80 font-mono text-[10px] text-zinc-300 overflow-x-auto border border-white/10 max-h-40">
                  {generatePythonTlsPublisher()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Cipher: AES-256-GCM / SHA384 · WSS Port 8884</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-[#00e5ff] hover:bg-[#00c5dd] text-black text-xs font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lock size={14} />
              <span>APPLY TLS CONFIGURATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
