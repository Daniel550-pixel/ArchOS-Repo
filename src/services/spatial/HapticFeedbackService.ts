// src/services/spatial/HapticFeedbackService.ts
// Standardized Haptic and Audio-Visual Feedback Dispatcher for ULTRON spatial interactions

import { HapticFeedbackPattern, ReticleVisualState, VisualFeedbackState } from './types';

type FeedbackListener = (state: VisualFeedbackState) => void;

export class HapticFeedbackService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private visualListeners: Set<FeedbackListener> = new Set();
  private rumbleOscillator: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;

  private currentState: VisualFeedbackState = {
    reticleState: 'IDLE_TRACKING',
    screenX: 0.5,
    screenY: 0.5,
    hoveredEntityId: null,
    heldEntityId: null,
    targetScale: 1.0,
    glowIntensity: 0.2,
    highlightColor: '#00f0ff' // Cyan default
  };

  constructor() {
    // Lazy AudioContext initialization upon user gesture
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        if (!this.audioCtx) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            this.audioCtx = new AudioContextClass();
          }
        }
        window.removeEventListener('pointerdown', initAudio);
        window.removeEventListener('keydown', initAudio);
      };
      window.addEventListener('pointerdown', initAudio, { once: true });
      window.addEventListener('keydown', initAudio, { once: true });
    }
  }

  public subscribeVisuals(listener: FeedbackListener): () => void {
    this.visualListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.visualListeners.delete(listener);
    };
  }

  public updateVisualState(partial: Partial<VisualFeedbackState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.visualListeners.forEach(listener => listener(this.currentState));
  }

  public getVisualState(): VisualFeedbackState {
    return { ...this.currentState };
  }

  /**
   * Dispatches deterministic haptic feedback (hardware vibration) and audio synth tone
   */
  public triggerFeedback(pattern: HapticFeedbackPattern): void {
    this.dispatchHapticVibration(pattern);
    this.playSpatialAudioTone(pattern);
  }

  private dispatchHapticVibration(pattern: HapticFeedbackPattern): void {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    try {
      switch (pattern) {
        case 'TICK':
          navigator.vibrate(8); // Subtle 8ms tick
          break;
        case 'CLICK':
          navigator.vibrate([15, 30, 20]); // Sharp 2-pulse click
          break;
        case 'RUMBLE_START':
          navigator.vibrate([40, 20, 40, 20, 40]); // Low rumble
          break;
        case 'RUMBLE_STOP':
          navigator.vibrate(0);
          break;
        case 'THUD':
          navigator.vibrate(45); // Distinct snap thud
          break;
        case 'WHEEL':
          navigator.vibrate(5); // Rolling tick
          break;
        case 'CONFIRM_DOUBLE':
          navigator.vibrate([20, 40, 25]); // Double confirm tap
          break;
        case 'SWIPE_BUZZ':
          navigator.vibrate([30, 30, 30]); // Swipe flick buzz
          break;
        case 'ERROR_BUZZ':
          navigator.vibrate([60, 40, 60, 40, 80]); // Sharp error buzz
          break;
      }
    } catch {
      // Ignore vibration error in restricted iframes
    }
  }

  private playSpatialAudioTone(pattern: HapticFeedbackPattern): void {
    if (this.isMuted) return;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        } else {
          return;
        }
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      switch (pattern) {
        case 'TICK': {
          // 880 Hz crisp soft blip
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'CLICK': {
          // High-tech tactile click (1200Hz to 240Hz punch)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }

        case 'RUMBLE_START': {
          // Low sustained bass frequency (55 Hz)
          if (!this.rumbleOscillator) {
            this.rumbleOscillator = this.audioCtx.createOscillator();
            this.rumbleGain = this.audioCtx.createGain();
            this.rumbleOscillator.type = 'sawtooth';
            this.rumbleOscillator.frequency.setValueAtTime(55, now);
            this.rumbleGain.gain.setValueAtTime(0.06, now);
            this.rumbleOscillator.connect(this.rumbleGain);
            this.rumbleGain.connect(this.audioCtx.destination);
            this.rumbleOscillator.start(now);
          }
          break;
        }

        case 'RUMBLE_STOP': {
          if (this.rumbleOscillator && this.rumbleGain) {
            this.rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
            setTimeout(() => {
              try {
                this.rumbleOscillator?.stop();
                this.rumbleOscillator?.disconnect();
                this.rumbleGain?.disconnect();
              } catch {}
              this.rumbleOscillator = null;
              this.rumbleGain = null;
            }, 60);
          }
          break;
        }

        case 'THUD': {
          // Deep drop resonant thud (110Hz to 35Hz)
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(110, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'WHEEL': {
          // Subtle scrolling wheel tick
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.02);
          break;
        }

        case 'CONFIRM_DOUBLE': {
          // Elegant major-third chime chord (659.25Hz + 830.6Hz)
          [659.25, 830.6].forEach(freq => {
            const osc = this.audioCtx!.createOscillator();
            const gain = this.audioCtx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.audioCtx!.destination);
            osc.start(now);
            osc.stop(now + 0.25);
          });
          break;
        }

        case 'SWIPE_BUZZ': {
          // Swoosh / dismiss sweep
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(700, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'ERROR_BUZZ': {
          // Dissonant low buzz
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }
      }
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  }
}

export const hapticFeedbackService = new HapticFeedbackService();
