import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { SovereignGate } from './components/auth/SovereignGate';
import { SovereignVault } from './services/biometric';
import { silentRestore } from './services/session';
import { UltronOneWorld } from './components/layout/UltronOneWorld';
import { UltronMissionReplay } from './components/layout/UltronMissionReplay';

export default function App() {
  const [session, setSession] = useState<{ vault: SovereignVault; jwt: string } | null>(null);
  const [replayOpen, setReplayOpen] = useState(false);

  useEffect(() => {
    silentRestore().then((restored) => {
      if (restored) setSession({ vault: restored.vault, jwt: restored.jwt });
    });
  }, []);

  useEffect(() => {
    const openReplay = () => setReplayOpen(true);
    window.addEventListener('archos:mission-replay', openReplay);
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setReplayOpen(value => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('archos:mission-replay', openReplay);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!session) {
    return (
      <SovereignGate
        onAuthed={(vault, jwt) => setSession({ vault, jwt })}
        onBypass={() => setSession({ vault: new SovereignVault(), jwt: 'operative_readonly_jwt' })}
      />
    );
  }

  return <>
    <UltronOneWorld />
    <button className="archos-replay-launcher" onClick={() => setReplayOpen(true)} aria-label="Open ULTRON Mission Replay" title="Mission Replay · Ctrl+Shift+R"><RotateCcw/><span>REPLAY</span></button>
    <UltronMissionReplay open={replayOpen} onClose={() => setReplayOpen(false)} />
  </>;
}
