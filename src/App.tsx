import React, { useEffect, useState } from 'react';
import { SovereignGate } from './components/auth/SovereignGate';
import { SovereignVault } from './services/biometric';
import { silentRestore } from './services/session';
import { UltronOS } from './components/layout/UltronOS';
import { SystemState, HandGestureState, CommandLogEntry } from './types';
import { INTELLIGENCE_FEED, IntelligenceFeedItem } from './intelligence/briefingData';

export default function App() {
  const [session, setSession] = useState<{ vault: SovereignVault; jwt: string } | null>(null);
  const [systemState, setSystemState] = useState<SystemState>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandLogs] = useState<CommandLogEntry[]>([]);
  const [selectedIntelligenceItem, setSelectedIntelligenceItem] = useState<IntelligenceFeedItem>(INTELLIGENCE_FEED[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMqttModal, setShowMqttModal] = useState(false);
  const [gestureState, setGestureState] = useState<HandGestureState>({
    isCameraActive: false,
    handDetected: false,
    isOpenPalm: false,
    palmHoldProgress: 0,
    isPinching: false,
    rawPinchDistance: 0,
    normalizedDistance: 0,
    smoothedProgress: 0,
    landmarks: null,
    handedness: 'unknown',
    currentGesture: 'IDLE',
    fps: 0,
    error: null,
    debugSkeleton: false,
  });

  useEffect(() => {
    silentRestore().then((restored) => {
      if (restored) setSession({ vault: restored.vault, jwt: restored.jwt });
    });
  }, []);

  if (!session) {
    return (
      <SovereignGate
        onAuthed={(vault, jwt) => setSession({ vault, jwt })}
        onBypass={() => setSession({ vault: new SovereignVault(), jwt: 'operative_readonly_jwt' })}
      />
    );
  }

  return (
    <UltronOS
      systemState={systemState}
      setSystemState={setSystemState}
      isListening={isListening}
      setIsListening={setIsListening}
      isCameraActive={isCameraActive}
      setIsCameraActive={setIsCameraActive}
      isCommandPaletteOpen={isCommandPaletteOpen}
      setIsCommandPaletteOpen={setIsCommandPaletteOpen}
      commandLogs={commandLogs}
      gestureState={gestureState}
      setGestureState={setGestureState}
      selectedIntelligenceItem={selectedIntelligenceItem}
      setSelectedIntelligenceItem={setSelectedIntelligenceItem}
      isSpeaking={isSpeaking}
      setIsSpeaking={setIsSpeaking}
      showMqttModal={showMqttModal}
      setShowMqttModal={setShowMqttModal}
    />
  );
}
