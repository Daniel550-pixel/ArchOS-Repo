export interface VoiceProfile {
  id: string;
  name: string;
  stability: number;
  similarityBoost: number;
  styleExaggeration: number;
  useSpeakerBoost: boolean;
  description: string;
}

export const ARCHOS_VOICES: Record<string, VoiceProfile> = {
  sovereign: {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'SOVEREIGN-COMMAND',
    stability: 0.88,
    similarityBoost: 0.82,
    styleExaggeration: 0.10,
    useSpeakerBoost: true,
    description: 'Deep, authoritative, calm. Optimized for technical briefings and command interfaces.'
  },
  synthetic: {
    id: 'XB0fDUnXU5powFXD5Cwa',
    name: 'SYNTHETIC-ANALYTICAL',
    stability: 0.92,
    similarityBoost: 0.75,
    styleExaggeration: 0.05,
    useSpeakerBoost: true,
    description: 'Crisp, precise, slightly artificial. Ideal for data readouts and system alerts.'
  }
};
