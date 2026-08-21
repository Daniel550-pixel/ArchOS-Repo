import { speechService } from './voice/speechService';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel / Sovereign Voice

export async function speakText(text: string): Promise<void> {
  // If ElevenLabs API key is present, stream from ElevenLabs API
  if (ELEVENLABS_API_KEY) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        await audio.play();
        return;
      }
    } catch (error) {
      console.warn('ElevenLabs API direct fetch error, falling back to sovereign Web Speech synthesizer:', error);
    }
  }

  // Graceful sovereign fallback using Web Speech API synthesis
  speechService.speak(text);
}
