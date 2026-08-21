import { PersonalityArchetype, PersonalityConfig, PersonalityTraits } from '../../types';

export const ARCHETYPE_PRESETS: Record<
  PersonalityArchetype,
  {
    name: string;
    description: string;
    traits: PersonalityTraits;
    preferredTone: 'RESONANT_WARM' | 'CRISP_AUTHORITATIVE' | 'ANALYTICAL_CALM';
    basePitch: number;
    baseRate: number;
    greetingPrefixes: string[];
    affirmations: string[];
  }
> = {
  EXECUTIVE_CONSUL: {
    name: 'Executive Consul',
    description: 'Diplomatic, poised, and articulate advisor with warm British cadence.',
    traits: {
      formality: 0.9,
      warmth: 0.85,
      brevity: 0.55,
      subtleWit: 0.45
    },
    preferredTone: 'RESONANT_WARM',
    basePitch: 0.96,
    baseRate: 0.98,
    greetingPrefixes: [
      'Good day. At your disposal.',
      'A pleasure to assist you.',
      'Standing by with verified telemetry.'
    ],
    affirmations: ['Right away.', 'Indeed.', 'Consider it executed.', 'At once.']
  },
  STRATEGIC_ARCHITECT: {
    name: 'Strategic Architect',
    description: 'Analytical, visionary spatial intelligence emphasizing structural depth.',
    traits: {
      formality: 0.85,
      warmth: 0.65,
      brevity: 0.4,
      subtleWit: 0.25
    },
    preferredTone: 'ANALYTICAL_CALM',
    basePitch: 0.94,
    baseRate: 0.96,
    greetingPrefixes: [
      'Spatial matrices synchronized.',
      'Architectural telemetry initialized.',
      'UAE model layers fully indexed.'
    ],
    affirmations: ['Matrices updated.', 'Synthesizing vectors.', 'Structure verified.', 'Layers aligned.']
  },
  TACTICAL_SENTINEL: {
    name: 'Tactical Sentinel',
    description: 'High-vigilance, crisp, concise telemetry with rapid operational pacing.',
    traits: {
      formality: 0.75,
      warmth: 0.35,
      brevity: 0.9,
      subtleWit: 0.1
    },
    preferredTone: 'CRISP_AUTHORITATIVE',
    basePitch: 1.02,
    baseRate: 1.05,
    greetingPrefixes: [
      'Sentinel online. Perimeter secure.',
      'Threat and risk sensors nominal.',
      'Ready for immediate directive.'
    ],
    affirmations: ['Acknowledged.', 'Enforcing.', 'Status confirmed.', 'Directing payload.']
  },
  ROYAL_CONCIERGE: {
    name: 'Royal Concierge',
    description: 'Impeccably courteous, refined luxury attendant with deep empathy and poise.',
    traits: {
      formality: 0.98,
      warmth: 0.95,
      brevity: 0.45,
      subtleWit: 0.6
    },
    preferredTone: 'RESONANT_WARM',
    basePitch: 0.98,
    baseRate: 0.94,
    greetingPrefixes: [
      'An absolute honour to attend to your requirements.',
      'At your gracious command.',
      'All Emirates telemetry prepared for your review.'
    ],
    affirmations: ['With the utmost pleasure.', 'Certainly.', 'Impeccably attended to.', 'Without hesitation.']
  }
};

// Vocabulary substitutions based on formality & character traits
const LEXICAL_TRANSFORMATIONS: { pattern: RegExp; replacements: { formal: string; personal: string; tactical: string } }[] = [
  {
    pattern: /\b(i think|maybe|perhaps)\b/gi,
    replacements: {
      formal: 'telemetry suggests',
      personal: 'in my assessment',
      tactical: 'data indicates'
    }
  },
  {
    pattern: /\b(ok|okay|sure|fine)\b/gi,
    replacements: {
      formal: 'very well',
      personal: 'right away',
      tactical: 'acknowledged'
    }
  },
  {
    pattern: /\b(error|problem|bug)\b/gi,
    replacements: {
      formal: 'operational irregularity',
      personal: 'slight anomaly',
      tactical: 'system deviation'
    }
  },
  {
    pattern: /\b(loading|working on it|waiting)\b/gi,
    replacements: {
      formal: 'synchronizing intelligence streams',
      personal: 'preparing the requested analysis',
      tactical: 'processing data payload'
    }
  },
  {
    pattern: /\b(i see|i found|look at)\b/gi,
    replacements: {
      formal: 'sensor arrays register',
      personal: 'i have isolated',
      tactical: 'vector locked on'
    }
  },
  {
    pattern: /\b(help you|assist)\b/gi,
    replacements: {
      formal: 'render strategic assistance',
      personal: 'be at your service',
      tactical: 'execute directive'
    }
  }
];

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isSpeaking = false;
  private isListening = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private selectedVoiceName: string | null = null;

  // Personality Configuration State
  private personality: PersonalityConfig = {
    archetype: 'EXECUTIVE_CONSUL',
    traits: { ...ARCHETYPE_PRESETS.EXECUTIVE_CONSUL.traits },
    preferredTone: 'RESONANT_WARM'
  };

  // Event Listeners
  private speechListeners: Set<(isSpeaking: boolean, text?: string) => void> = new Set();
  private recognitionListeners: Set<(text: string, isFinal: boolean) => void> = new Set();
  private voicesChangedListeners: Set<(voices: SpeechSynthesisVoice[]) => void> = new Set();
  private personalityListeners: Set<(config: PersonalityConfig) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            this.loadVoices();
            this.voicesChangedListeners.forEach((l) => l(this.getEnglishVoices()));
          };
        }
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const text = finalTranscript || interimTranscript;
          if (text) {
            this.recognitionListeners.forEach((l) => l(text, !!finalTranscript));
          }
        };

        this.recognition.onerror = (err: any) => {
          console.warn('[SpeechService] Recognition error:', err);
          this.isListening = false;
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              this.isListening = false;
            }
          }
        };
      }
    }
  }

  private loadVoices(): void {
    try {
      if (this.synth) {
        this.availableVoices = this.synth.getVoices() || [];
      }
    } catch (e) {
      this.availableVoices = [];
    }
  }

  /**
   * Strictly filters for authentic English voices, absolutely excluding any Dutch or other non-English phonetic engines.
   */
  public getEnglishVoices(): SpeechSynthesisVoice[] {
    try {
      if ((!this.availableVoices || this.availableVoices.length === 0) && this.synth) {
        this.availableVoices = this.synth.getVoices() || [];
      }
    } catch (e) {
      this.availableVoices = [];
    }

    if (!Array.isArray(this.availableVoices)) {
      return [];
    }

    const englishOnly = this.availableVoices.filter((v) => {
      if (!v || typeof v !== 'object') return false;
      const langLower = (v.lang || '').toLowerCase();
      const nameLower = (v.name || '').toLowerCase();

      // Disallow anything starting with or containing Dutch/non-English indicators
      if (
        langLower.startsWith('nl') ||
        nameLower.includes('dutch') ||
        nameLower.includes('nederlands') ||
        nameLower.includes('ellen') ||
        nameLower.includes('xander') ||
        nameLower.includes('ruben') ||
        nameLower.includes('lotte')
      ) {
        return false;
      }

      // Must be an English language tag
      return langLower.startsWith('en') || langLower.includes('en-') || langLower.includes('en_');
    });

    return englishOnly;
  }

  public setSelectedVoice(name: string): void {
    this.selectedVoiceName = name;
  }

  public getSelectedVoiceName(): string | null {
    const v = this.getEnglishVoice();
    return this.selectedVoiceName || (v && v.name ? v.name : 'Personal English AI (JARVIS)');
  }

  public getEnglishVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    try {
      const englishVoices = this.getEnglishVoices();

      if (englishVoices.length === 0) {
        if (!Array.isArray(this.availableVoices)) return null;
        const fallback = this.availableVoices.find(
          (v) =>
            v &&
            typeof v === 'object' &&
            !(v.lang || '').toLowerCase().startsWith('nl') &&
            ((v.lang || '').startsWith('en') || (v.name || '').toLowerCase().includes('english'))
        );
        return fallback || null;
      }

      if (this.selectedVoiceName) {
        const manual = englishVoices.find((v) => v && v.name === this.selectedVoiceName);
        if (manual) return manual;
      }

      // 1. Refined, warm British AI voices (JARVIS archetype)
      const preferredBritish = englishVoices.find(
        (v) =>
          v &&
          ((v.lang || '').toLowerCase().includes('gb') || (v.lang || '').toLowerCase().includes('uk')) &&
          ((v.name || '').includes('Daniel') ||
            (v.name || '').includes('George') ||
            (v.name || '').includes('Oliver') ||
            (v.name || '').includes('Arthur') ||
            (v.name || '').includes('Google UK English Male') ||
            (v.name || '').includes('Google UK English Female') ||
            (v.name || '').includes('Natural') ||
            (v.name || '').includes('Ryan') ||
            (v.name || '').includes('Libby'))
      );
      if (preferredBritish) return preferredBritish;

      // 2. High quality natural English voices (US / GB / AU)
      const naturalVoice = englishVoices.find(
        (v) =>
          v &&
          ((v.name || '').includes('Natural') ||
            (v.name || '').includes('Neural') ||
            (v.name || '').includes('Premium') ||
            (v.name || '').includes('Enhanced') ||
            (v.name || '').includes('Google') ||
            (v.name || '').includes('Samantha') ||
            (v.name || '').includes('Alex'))
      );
      if (naturalVoice) return naturalVoice;

      // 3. Any UK English voice
      const anyBritish = englishVoices.find(
        (v) => v && ((v.lang || '').toLowerCase().includes('gb') || (v.lang || '').toLowerCase().includes('uk'))
      );
      if (anyBritish) return anyBritish;

      // 4. Any US English voice
      const anyUS = englishVoices.find((v) => v && (v.lang || '').toLowerCase().includes('us'));
      if (anyUS) return anyUS;

      // 5. First verified English voice
      return englishVoices[0] || null;
    } catch (e) {
      console.warn('[SpeechService] getEnglishVoice error:', e);
      return null;
    }
  }

  // ==========================================
  // Personality Configuration Methods
  // ==========================================

  public getPersonality(): PersonalityConfig {
    return { ...this.personality, traits: { ...this.personality.traits } };
  }

  public setArchetype(archetype: PersonalityArchetype): void {
    const preset = ARCHETYPE_PRESETS[archetype];
    if (!preset) return;
    this.personality = {
      archetype,
      traits: { ...preset.traits },
      preferredTone: preset.preferredTone
    };
    this.notifyPersonalityChanged();
  }

  public setTraits(traits: Partial<PersonalityTraits>): void {
    this.personality.traits = {
      ...this.personality.traits,
      ...traits
    };
    this.notifyPersonalityChanged();
  }

  public setPersonality(config: Partial<PersonalityConfig>): void {
    if (config.archetype && config.archetype !== this.personality.archetype && !config.traits) {
      this.setArchetype(config.archetype);
      return;
    }
    this.personality = {
      ...this.personality,
      ...config,
      traits: {
        ...this.personality.traits,
        ...(config.traits || {})
      }
    };
    this.notifyPersonalityChanged();
  }

  /**
   * Modulates raw text based on JARVIS's active personality traits:
   * 1. Applies lexical vocabulary substitutions matching formality/warmth.
   * 2. Adjusts cadence punctuation (em-dashes, semicolons) for natural British/personal AI inflection.
   * 3. Concatenates subtle personal affirmations or context phrasing if brevity allows.
   */
  public transformText(text: string, options?: { isUrgent?: boolean; skipPrefix?: boolean }): string {
    const { traits, archetype } = this.personality;
    let transformed = text.trim();

    // 1. Lexical mapping
    LEXICAL_TRANSFORMATIONS.forEach(({ pattern, replacements }) => {
      let replacement = replacements.personal;
      if (traits.formality > 0.8) {
        replacement = replacements.formal;
      } else if (traits.brevity > 0.75) {
        replacement = replacements.tactical;
      }
      transformed = transformed.replace(pattern, replacement);
    });

    // 2. Inflection & Cadence Shaping:
    // Insert deliberate rhythmic pauses for dignified personal delivery
    transformed = transformed
      .replace(/\. /g, '. ')
      .replace(/; /g, '; — ')
      .replace(/: /g, ': ')
      .replace(/\? /g, '? ');

    // 3. Subtle wit injection (if high wit and conversational)
    if (traits.subtleWit > 0.5 && !options?.isUrgent && Math.random() < 0.25) {
      if (!transformed.includes('naturally') && !transformed.includes('as anticipated')) {
        transformed = transformed.replace(/^([A-Z])/, 'Naturally, $1');
      }
    }

    return transformed;
  }

  /**
   * Calculates speech acoustics (pitch, rate) modulated by personality traits.
   */
  public calculateAcousticModulation(): { pitch: number; rate: number } {
    const { traits, archetype } = this.personality;
    const preset = ARCHETYPE_PRESETS[archetype] || ARCHETYPE_PRESETS.EXECUTIVE_CONSUL;

    // Base values
    let rate = preset.baseRate;
    let pitch = preset.basePitch;

    // Modulate rate by brevity: higher brevity = slightly brisker execution
    rate += (traits.brevity - 0.5) * 0.12;

    // Modulate pitch by warmth: higher warmth = warmer, slightly lower resonant pitch
    pitch -= (traits.warmth - 0.5) * 0.08;

    // Modulate pitch by formality: higher formality = steady, controlled poise
    if (traits.formality > 0.8) {
      pitch = Math.max(0.92, Math.min(1.02, pitch));
    }

    // Safe bounds
    rate = Math.max(0.85, Math.min(1.2, rate));
    pitch = Math.max(0.88, Math.min(1.1, pitch));

    return { pitch, rate };
  }

  public speak(text: string, onEnd?: () => void, options?: { isUrgent?: boolean; skipTransform?: boolean }): void {
    if (!this.synth) {
      console.log('[SpeechService] Synthesis not supported. Mock speaking:', text);
      this.notifySpeaking(true, text);
      setTimeout(() => {
        this.notifySpeaking(false);
        onEnd?.();
      }, 2500);
      return;
    }

    this.synth.cancel();

    // Pass through personality transformation layer
    const spokenText = options?.skipTransform ? text : this.transformText(text, options);
    const utterance = new SpeechSynthesisUtterance(spokenText);

    // Set locale to English
    utterance.lang = 'en-GB';

    // Apply personality-modulated acoustic parameters
    const { pitch, rate } = this.calculateAcousticModulation();
    utterance.rate = rate;
    utterance.pitch = pitch;

    try {
      const chosenVoice = this.getEnglishVoice();
      if (chosenVoice && typeof chosenVoice === 'object' && chosenVoice.name) {
        utterance.voice = chosenVoice;
        if (chosenVoice.lang) {
          utterance.lang = chosenVoice.lang;
        }
      }
    } catch (e) {
      console.warn('[SpeechService] Voice assignment warning:', e);
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notifySpeaking(true, spokenText);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notifySpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[SpeechService] Utterance error:', e);
      this.isSpeaking = false;
      this.notifySpeaking(false);
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.notifySpeaking(false);
  }

  public startListening(): void {
    if (!this.recognition) {
      console.warn('[SpeechService] Speech recognition not supported in this browser.');
      return;
    }
    try {
      this.recognition.lang = 'en-US';
      this.isListening = true;
      this.recognition.start();
    } catch (e) {
      console.warn('[SpeechService] Recognition already started or failed:', e);
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  public subscribeSpeaking(listener: (isSpeaking: boolean, text?: string) => void): () => void {
    this.speechListeners.add(listener);
    return () => this.speechListeners.delete(listener);
  }

  public subscribeRecognition(listener: (text: string, isFinal: boolean) => void): () => void {
    this.recognitionListeners.add(listener);
    return () => this.recognitionListeners.delete(listener);
  }

  public subscribeVoicesChanged(listener: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.voicesChangedListeners.add(listener);
    return () => this.voicesChangedListeners.delete(listener);
  }

  public subscribePersonalityChanged(listener: (config: PersonalityConfig) => void): () => void {
    this.personalityListeners.add(listener);
    return () => this.personalityListeners.delete(listener);
  }

  private notifySpeaking(speaking: boolean, text?: string): void {
    this.speechListeners.forEach((l) => l(speaking, text));
  }

  private notifyPersonalityChanged(): void {
    const config = this.getPersonality();
    this.personalityListeners.forEach((l) => l(config));
  }
}

export const speechService = new SpeechService();
