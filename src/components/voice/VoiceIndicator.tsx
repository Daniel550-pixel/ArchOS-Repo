import React from 'react';
import { useArchOSStore } from '../../store/archosStore';
import { Volume2, VolumeX, AlertTriangle, Radio } from 'lucide-react';
import { voiceService } from '../../services/voice/elevenlabs';

interface VoiceIndicatorProps {
  className?: string;
  onClick?: () => void;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ className = '', onClick }) => {
  const { voiceStatus, isVoiceMuted } = useArchOSStore();

  const isSpeaking = voiceStatus === 'SPEAKING';
  const isSynthesizing = voiceStatus === 'SYNTHESIZING';
  const isError = voiceStatus === 'ERROR';

  const icon = isSpeaking
    ? Volume2
    : isSynthesizing
    ? Radio
    : isError
    ? AlertTriangle
    : isVoiceMuted
    ? VolumeX
    : Volume2;

  const color = isSpeaking
    ? '#00e5ff'
    : isSynthesizing
    ? '#d4ff00'
    : isError
    ? '#ff006e'
    : isVoiceMuted
    ? '#ff3b30'
    : '#5a6478';

  const label = isSpeaking
    ? 'J.A.R.V.I.S. ACTIVE'
    : isSynthesizing
    ? 'SYNTHESIZING'
    : isError
    ? 'AUDIO FAULT'
    : isVoiceMuted
    ? 'AUDIO MUTED'
    : 'AUDIO STANDBY';

  return (
    <div
      onClick={onClick}
      title="Sovereign Voice Synthesis Status (Click to test/inspect)"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00e5ff]/30 bg-[#0c0c0c]/80 backdrop-blur-sm transition-all cursor-pointer hover:border-[#00e5ff]/60 select-none ${className}`}
    >
      {React.createElement(icon, {
        className: `w-4 h-4 ${isSpeaking ? 'animate-pulse' : isSynthesizing ? 'animate-spin' : ''}`,
        style: { color }
      })}
      <span className="text-xs font-mono tracking-wider font-semibold" style={{ color: '#f0f4f4' }}>
        {label}
      </span>
      {isSpeaking && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5ff]"></span>
        </span>
      )}
    </div>
  );
};
