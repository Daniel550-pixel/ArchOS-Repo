// src/services/voice/elevenlabs.ts
// Sovereign Stream-First Voice Service with Web Audio Analysis & Browser Speech Fallback

import { archOSStoreInstance, useArchOSStore } from '../../store/archosStore';
import { ARCHOS_VOICES, VoiceProfile } from './voiceProfiles';

export { ARCHOS_VOICES, type VoiceProfile };

const getResolvedApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const custom = (window as any).__ELEVENLABS_KEY__ || localStorage.getItem('ARCHOS_ELEVENLABS_KEY');
    if (custom) return custom;
  }
  const envKey = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY;
  if (envKey && envKey !== 'your_api_key_here' && envKey !== '') return envKey;
  return 'sk_e791a555ca9ae278c9671021aa1b0d03b70aa78ab30595ce';
};

const BASE_URL = 'https://api.elevenlabs.io/v1';

// Legacy / Extended Profile Aliases
export const ARCHOS_VOICE = ARCHOS_VOICES.sovereign;
export const SYNTHETIC_VOICE = ARCHOS_VOICES.synthetic;
export const CONSUL_VOICE: VoiceProfile = {
  id: 'VR6AewLTigWG4xSOukaG',
  name: 'CONSUL-FIN',
  stability: 0.78,
  similarityBoost: 0.88,
  styleExaggeration: 0.25,
  useSpeakerBoost: true,
  description: 'Polished diplomatic advisory cadence for executive briefings.'
};
export const SENTINEL_VOICE: VoiceProfile = {
  id: 'onwK4e9ZLuTAKqWW03F9',
  name: 'TACTICAL-DANIEL',
  stability: 0.80,
  similarityBoost: 0.92,
  styleExaggeration: 0.15,
  useSpeakerBoost: true,
  description: 'High-vigilance operational pacing with rapid threat reporting.'
};

export const VOICE_PROFILES = [ARCHOS_VOICE, SYNTHETIC_VOICE, CONSUL_VOICE, SENTINEL_VOICE];

class ElevenLabsService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private activeSource: MediaElementAudioSourceNode | null = null;
  private isInitialized = false;
  private isSpeaking = false;
  private volume = 0.85;
  private isMuted = false;
  private currentVoice: VoiceProfile = ARCHOS_VOICES.sovereign;
  private visualizerDataArray: Uint8Array | null = null;
  private queue: { text: string; profile: VoiceProfile }[] = [];
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          this.visualizerDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
      } catch (e) {
        // audio context initialisation failure handled gracefully
      }
    }
  }

  async initialize(): Promise<boolean> {
    const key = getResolvedApiKey();
    if (!key || key.trim() === '' || key === 'your_api_key_here') {
      console.info('[VOICE] ElevenLabs API key missing or unconfigured. Sovereign browser speech fallback activated.');
      this.isInitialized = true;
      return false;
    }
    this.isInitialized = true;
    return true;
  }

  private initAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.visualizerDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * High-level speak queue method matching ArchOS command specifications
   */
  async speak(text: string, profile: VoiceProfile = this.currentVoice): Promise<void> {
    if (!text || text.trim() === '') return;
    if (this.isMuted) {
      console.log('[VOICE] Speech suppressed (Muted):', text);
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    // Queue management for rapid successive calls
    this.queue.push({ text: text.trim(), profile });
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      await this.synthesize(item.text, item.profile);
    }

    this.isProcessing = false;
  }

  /**
   * Direct streaming alias
   */
  async stream(text: string, profile: VoiceProfile = this.currentVoice): Promise<void> {
    return this.speak(text, profile);
  }

  private async synthesize(text: string, profile: VoiceProfile): Promise<void> {
    const apiKey = getResolvedApiKey();
    const hasKey = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_api_key_here');

    if (!hasKey) {
      this.fallbackBrowserSpeech(text, profile);
      return;
    }

    try {
      this.setSpeakingState('SYNTHESIZING', text);

      const response = await fetch(`${BASE_URL}/text-to-speech/${profile.id}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: profile.stability,
            similarity_boost: profile.similarityBoost,
            style: profile.styleExaggeration,
            use_speaker_boost: profile.useSpeakerBoost ?? true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API returned ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      await this.play(url, text);
    } catch (error) {
      console.warn('[VOICE] ElevenLabs synthesis failed, using Sovereign Browser Speech fallback:', error);
      this.fallbackBrowserSpeech(text, profile);
    }
  }

  private play(url: string, rawText?: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.stop();

      const ctx = this.initAudioContext();
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.volume = this.volume;
      audio.crossOrigin = 'anonymous';

      try {
        if (ctx && this.analyser) {
          this.activeSource = ctx.createMediaElementSource(audio);
          this.activeSource.connect(this.analyser);
          this.analyser.connect(ctx.destination);
        }
      } catch (e) {
        // Direct playback if routing is restricted
      }

      audio.onplay = () => {
        this.isSpeaking = true;
        this.setSpeakingState('SPEAKING', rawText);
      };

      audio.onended = () => {
        this.isSpeaking = false;
        this.setSpeakingState('IDLE');
        URL.revokeObjectURL(url);
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (e) => {
        console.error('[VOICE] Audio playback error:', e);
        this.isSpeaking = false;
        this.setSpeakingState('ERROR');
        this.currentAudio = null;
        resolve();
      };

      audio.play().catch((err) => {
        console.warn('[VOICE] Audio autoplay blocked by browser policy:', err);
        this.fallbackBrowserSpeech(rawText || '', this.currentVoice);
        resolve();
      });
    });
  }

  /**
   * Sovereign Browser Speech API fallback tuned for deep, commanding acoustics
   */
  private fallbackBrowserSpeech(text: string, voice?: VoiceProfile): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setSpeakingState('IDLE');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];

      if (Array.isArray(voices) && voices.length > 0) {
        const selectedVoice =
          voices.find(
            (v) =>
              v &&
              v.lang &&
              v.lang.startsWith('en') &&
              (v.name?.includes('Daniel') ||
                v.name?.includes('Male') ||
                v.name?.includes('George') ||
                v.name?.includes('Oliver') ||
                v.name?.includes('UK'))
          ) ||
          voices.find((v) => v && v.lang && v.lang.startsWith('en')) ||
          voices[0];

        if (selectedVoice && typeof selectedVoice === 'object' && selectedVoice.name) {
          try {
            utterance.voice = selectedVoice;
            if (selectedVoice.lang) {
              utterance.lang = selectedVoice.lang;
            }
          } catch (e) {
            // ignore voice assignment failure on restricted browsers
          }
        }
      }

      const voiceName = voice?.name || '';
      if (voiceName.includes('MARCUS') || voiceName.includes('SOVEREIGN')) {
        utterance.pitch = 0.88;
        utterance.rate = 0.95;
      } else if (voiceName.includes('CALLUM') || voiceName.includes('SYNTHETIC')) {
        utterance.pitch = 0.82;
        utterance.rate = 1.05;
      } else {
        utterance.pitch = 0.94;
        utterance.rate = 0.98;
      }

      utterance.volume = this.volume;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.setSpeakingState('SPEAKING', text);
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.setSpeakingState('IDLE');
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.setSpeakingState('IDLE');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VOICE] Fallback speech error:', err);
      this.isSpeaking = false;
      this.setSpeakingState('IDLE');
    }
  }

  private setSpeakingState(status: 'IDLE' | 'SPEAKING' | 'SYNTHESIZING' | 'ERROR', text?: string) {
    try {
      const state = archOSStoreInstance.getState();
      if (state.setVoiceStatus) {
        state.setVoiceStatus(status, text);
      }
    } catch (e) {
      // Store safety
    }
  }

  /**
   * Retrieves real-time frequency spectrum for UI audio waveforms
   */
  public getVisualizerData(): number[] {
    if (!this.analyser || !this.isSpeaking) {
      return [0.1, 0.15, 0.1, 0.2, 0.1, 0.15, 0.1, 0.12];
    }
    if (this.visualizerDataArray) {
      this.analyser.getByteFrequencyData(this.visualizerDataArray);
      const samples: number[] = [];
      const step = Math.floor(this.visualizerDataArray.length / 12) || 1;
      for (let i = 0; i < 12; i++) {
        const val = this.visualizerDataArray[i * step] / 255.0;
        samples.push(Math.max(0.1, val));
      }
      return samples;
    }
    return [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9];
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isProcessing = false;
    this.isSpeaking = false;
    this.setSpeakingState('IDLE');
  }

  public setVoiceProfile(profile: VoiceProfile): void {
    this.currentVoice = profile;
    const state = archOSStoreInstance.getState();
    if (state.setVoiceProfile) {
      state.setVoiceProfile(profile as any);
    }
  }

  public getVoiceProfile(): VoiceProfile {
    return this.currentVoice;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    const state = archOSStoreInstance.getState();
    if (state.setVoiceVolume) {
      state.setVoiceVolume(this.volume);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
    const state = archOSStoreInstance.getState();
    if (state.setVoiceMuted) {
      state.setVoiceMuted(muted);
    }
  }

  public isVoiceSpeaking(): boolean {
    return this.isSpeaking;
  }

  public hasApiKey(): boolean {
    const key = getResolvedApiKey();
    return Boolean(key && key.trim() !== '' && key !== 'your_api_key_here');
  }
}

export const voiceService = new ElevenLabsService();
