import { commandBus } from '../lib/archos/commandBus';
import { voiceService } from '../services/voice/elevenlabs';
import { ARCHOS_VOICES } from '../services/voice/voiceProfiles';
import { useArchOSStore } from '../store/archosStore';
import { speechRecognition } from '../services/voice/speechRecognition';

export interface IntentResult {
  intent: string;
  response: string;
  action?: () => void;
}

export function interpretCommand(transcript: string): IntentResult {
  const t = transcript.toLowerCase();
  const store = useArchOSStore.getState();

  // Navigation intents
  if (t.includes('rsi') || t.includes('agi') || t.includes('ascend') || t.includes('swarm') || t.includes('meta-cognition') || t.includes('cognition') || t.includes('strategic reasoning')) {
    return {
      intent: 'NAV_RSI_AGI',
      response: 'Accessing Real-time Strategic Intelligence and AGI Matrix. Multi-horizon planners and autonomous swarm synchronized.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'rsi_agi' } }, 'voice', transcript),
    };
  }
  if (t.includes('world') || t.includes('map') || t.includes('geospatial') || t.includes('dubai')) {
    return {
      intent: 'NAV_WORLD',
      response: 'Opening the UAE world model. Displaying infrastructure and transaction density.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'world' } }, 'voice', transcript),
    };
  }
  if (t.includes('intelligence') || t.includes('briefing') || t.includes('news') || t.includes('feed')) {
    return {
      intent: 'NAV_INTELLIGENCE',
      response: 'Switching to the intelligence engine. Provenance and correlation graphs active.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'intelligence' } }, 'voice', transcript),
    };
  }
  if (t.includes('experience') || t.includes('tower') || t.includes('explode') || t.includes('3d') || t.includes('bim')) {
    return {
      intent: 'NAV_EXPERIENCE',
      response: 'Decomposing Tower B-4471. Inspect structural core, MEP risers, and curtain wall.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'experience' } }, 'voice', transcript),
    };
  }
  if (t.includes('pulse') || t.includes('carbon') || t.includes('energy') || t.includes('vitality') || t.includes('health')) {
    return {
      intent: 'NAV_PULSE',
      response: 'Current vitality index is eighty-five. Structural at ninety-two, system health nominal, carbon rate four thousand one hundred twenty tons per year.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'pulse' } }, 'voice', transcript),
    };
  }
  if (t.includes('marketplace') || t.includes('hub') || t.includes('academy') || t.includes('procurement')) {
    return {
      intent: 'NAV_MARKETPLACE',
      response: 'Opening ArchOS Ecosystem Hub and Practitioner Academy.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'marketplace' } }, 'voice', transcript),
    };
  }
  if (t.includes('finops') || t.includes('compute') || t.includes('budget') || t.includes('router') || t.includes('token')) {
    return {
      intent: 'NAV_FINOPS',
      response: 'Accessing FinOps and Model Router Studio. Streaming real-time tenant compute telemetry.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'finops' } }, 'voice', transcript),
    };
  }
  if (t.includes('design') || t.includes('parametric') || t.includes('massing') || t.includes('footprint') || t.includes('envelope')) {
    return {
      intent: 'NAV_DESIGN',
      response: 'Opening the Parametric Design Studio. Real-time procedural BIM generation ready.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'design' } }, 'voice', transcript),
    };
  }
  if (t.includes('prove') || t.includes('simulation') || t.includes('sandbox') || t.includes('scenario') || t.includes('simulate')) {
    return {
      intent: 'NAV_PROVE',
      response: 'Opening the ArchOS Simulation Sandbox. Ephemeral digital twin cloned for constraint testing.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'prove' } }, 'voice', transcript),
    };
  }
  if (t.includes('orb') || t.includes('home') || t.includes('core')) {
    return {
      intent: 'NAV_ORB',
      response: 'Returning to central Orb Core. Emirates neural telemetry standing by.',
      action: () => commandBus.dispatch({ type: 'NAVIGATE', payload: { view: 'orb' } }, 'voice', transcript),
    };
  }

  // System status
  if (t.includes('status') || t.includes('system check') || t.includes('diagnostics')) {
    return {
      intent: 'STATUS',
      response: 'Current vitality index is eighty-five. Structural at ninety-two, system health nominal, carbon at four thousand one hundred twenty tons per year.',
    };
  }
  if (t.includes('risk') || t.includes('threat') || t.includes('security') || t.includes('zero trust')) {
    return {
      intent: 'RISK',
      response: 'Sovereign risk index is low zero point one eight. Zero-Trust Security Fabric online. No active threats detected.',
    };
  }

  // Telemetry
  if (t.includes('telemetry') || t.includes('sensors') || t.includes('sensor') || t.includes('live')) {
    return {
      intent: 'TELEMETRY',
      response: 'Streaming live telemetry. Five sensors connected, two drift alerts pending recalibration.',
      action: () => {
        store.setTelemetryPanelOpen(true);
        commandBus.dispatch({ type: 'TOGGLE_TELEMETRY', payload: { on: true } }, 'voice', transcript);
      },
    };
  }

  // Fallback
  return {
    intent: 'UNKNOWN',
    response: `Acknowledged directive regarding ${transcript}. All Emirates systems nominal and standing by.`,
  };
}

// Wire recognition → interpreter → action → voice response
export function bindVoiceLoop() {
  speechRecognition.setHandler((transcript: string, isFinal: boolean) => {
    if (!isFinal) return;
    const result = interpretCommand(transcript);
    if (result.action) {
      result.action();
    }
    voiceService.speak(result.response, ARCHOS_VOICES.sovereign);
  });
}
