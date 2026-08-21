import { useArchOSStore } from '../../store/archosStore';

type RecognitionResult = (transcript: string, isFinal: boolean) => void;

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private onResult: RecognitionResult | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t;
            else interim += t;
          }
          if (this.onResult) {
            this.onResult(final || interim, !!final);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              this.isListening = false;
              useArchOSStore.getState().setListeningStatus(false);
            }
          } else {
            this.isListening = false;
            useArchOSStore.getState().setListeningStatus(false);
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn('[STT] Speech recognition event/error:', e.error);
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            this.isListening = false;
            useArchOSStore.getState().setListeningStatus(false);
          }
        };
      }
    }
  }

  setHandler(cb: RecognitionResult) {
    this.onResult = cb;
  }

  start(): boolean {
    if (!this.recognition) {
      console.warn('[STT] Speech recognition not supported in this browser.');
      return false;
    }
    if (this.isListening) return true;
    try {
      this.isListening = true;
      this.recognition.start();
      useArchOSStore.getState().setListeningStatus(true);
      return true;
    } catch (e) {
      this.isListening = false;
      return false;
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      useArchOSStore.getState().setListeningStatus(false);
    }
  }

  toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognitionService();
