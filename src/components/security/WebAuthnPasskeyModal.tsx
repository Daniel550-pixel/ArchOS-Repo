import React, { useState, useEffect } from 'react';
import { GlassPanel } from '../layout/GlassPanel';
import { Fingerprint, Key, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Lock, Unlock } from 'lucide-react';
import { registerPasskey, unlockPasskey, hasRegisteredPasskey, isWebAuthnSupported } from '../../services/passkey';
import { speechService } from '../../services/voice/speechService';

interface WebAuthnPasskeyModalProps {
  onAuthenticated?: () => void;
}

export const WebAuthnPasskeyModal: React.FC<WebAuthnPasskeyModalProps> = ({ onAuthenticated }) => {
  const [hasPasskey, setHasPasskey] = useState(false);
  const [userName, setUserName] = useState('Sovereign-Operative-UAE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const isSupported = isWebAuthnSupported();

  useEffect(() => {
    setHasPasskey(hasRegisteredPasskey());
  }, []);

  const handleRegister = async () => {
    setIsProcessing(true);
    setStatusMessage('Initiating browser WebAuthn FIDO2 ceremony...');
    try {
      const res = await registerPasskey(userName);
      if (res.success) {
        setHasPasskey(true);
        setAuthSuccess(true);
        setStatusMessage(`Passkey registered successfully for ${res.user}! Cryptographic challenge verified.`);
        speechService.speak('Hardware passkey registered successfully. Sovereign access authorized.');
        onAuthenticated?.();
      } else {
        setStatusMessage(`Registration failed: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    setIsProcessing(true);
    setStatusMessage('Requesting biometric Touch ID / Face ID / Security Key challenge...');
    try {
      const res = await unlockPasskey();
      if (res.success) {
        setAuthSuccess(true);
        setStatusMessage(`Sovereign identity verified: ${res.user}! Access granted.`);
        speechService.speak('Biometric assertion verified. Welcome back, Operative.');
        onAuthenticated?.();
      } else {
        setStatusMessage(`Verification failed: ${res.error}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <GlassPanel
      title="AUTHENTICATION · WEBAUTHN FIDO2 PASSKEYS"
      icon={<Fingerprint size={16} />}
      badge={authSuccess ? 'VERIFIED' : hasPasskey ? 'PASSKEY READY' : 'REGISTRATION NEEDED'}
      badgeColor={authSuccess ? 'green' : hasPasskey ? 'cyan' : 'gold'}
      className="max-w-xl mx-auto font-mono-tech select-none"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
            {authSuccess ? <Unlock size={20} className="text-[#10b981]" /> : <Lock size={20} />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">
              Genuine Hardware-Bound Cryptography
            </h4>
            <p className="text-[10px] text-zinc-400">
              W3C WebAuthn ceremony utilizing device Touch ID, Face ID, Windows Hello, or FIDO2 hardware keys.
            </p>
          </div>
        </div>

        {/* Status Message Display */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              authSuccess
                ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
                : 'bg-[#00e5ff]/10 border-[#00e5ff]/30 text-[#00e5ff]'
            }`}
          >
            {authSuccess ? <CheckCircle2 size={16} /> : <RefreshCw size={16} className="animate-spin" />}
            <span className="text-[11px] leading-tight">{statusMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleRegister}
            disabled={isProcessing || !isSupported}
            className="p-3 rounded-xl bg-[#00e5ff] hover:bg-[#00c5dd] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Key size={16} />
            <span>{isProcessing ? 'PROCESSING...' : 'REGISTER NEW PASSKEY'}</span>
          </button>

          <button
            onClick={handleUnlock}
            disabled={isProcessing || !hasPasskey || !isSupported}
            className="p-3 rounded-xl bg-[#d4ff00] hover:bg-[#b8e600] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,255,0,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Fingerprint size={16} />
            <span>{isProcessing ? 'VERIFYING...' : 'TOUCH ID / UNLOCK PASSKEY'}</span>
          </button>
        </div>

        {!isSupported && (
          <div className="text-[10px] text-[#ef4444] text-center">
            Notice: WebAuthn requires a secure origin (HTTPS or localhost) with supported browser credentials.
          </div>
        )}
      </div>
    </GlassPanel>
  );
};
