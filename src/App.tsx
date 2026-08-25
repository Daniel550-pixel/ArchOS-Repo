import React, { useEffect, useState } from 'react';
import { Bot, RotateCcw } from 'lucide-react';
import { SovereignGate } from './components/auth/SovereignGate';
import { SovereignVault } from './services/biometric';
import { silentRestore } from './services/session';
import { UltronOneWorld } from './components/layout/UltronOneWorld';
import { UltronMissionReplay } from './components/layout/UltronMissionReplay';
import { UltronMissionControl } from './components/layout/UltronMissionControl';
import { UltronModeSwitcher } from './components/layout/UltronModeSwitcher';

type ArchOSMode = 'world' | 'intelligence' | 'agents' | 'replay';

export default function App() {
  const [session, setSession] = useState<{ vault: SovereignVault; jwt: string } | null>(null);
  const [replayOpen, setReplayOpen] = useState(false);
  const [missionControlOpen, setMissionControlOpen] = useState(false);
  const [mode, setMode] = useState<ArchOSMode>('world');

  useEffect(() => {
    silentRestore().then((restored) => {
      if (restored) setSession({ vault: restored.vault, jwt: restored.jwt });
    });
  }, []);

  useEffect(() => {
    const openReplay = () => { setMode('replay'); setReplayOpen(true); };
    const openMissionControl = () => { setMode('agents'); setMissionControlOpen(true); };
    window.addEventListener('archos:mission-replay', openReplay);
    window.addEventListener('archos:mission-control', openMissionControl);
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setMode('replay');
        setReplayOpen(value => !value);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setMode('agents');
        setMissionControlOpen(value => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('archos:mission-replay', openReplay);
      window.removeEventListener('archos:mission-control', openMissionControl);
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
    <UltronModeSwitcher mode={mode} onModeChange={setMode} />
    <div className="fixed bottom-6 right-6 z-50 flex gap-2">
      <button className="archos-replay-launcher" onClick={() => { setMode('agents'); setMissionControlOpen(true); }} aria-label="Open ULTRON Mission Control" title="Mission Control · Ctrl+Shift+M"><Bot/><span>MISSIONS</span></button>
      <button className="archos-replay-launcher" onClick={() => { setMode('replay'); setReplayOpen(true); }} aria-label="Open ULTRON Mission Replay" title="Mission Replay · Ctrl+Shift+R"><RotateCcw/><span>REPLAY</span></button>
    </div>
    <UltronMissionControl open={missionControlOpen} onClose={() => { setMissionControlOpen(false); setMode('world'); }} />
    <UltronMissionReplay open={replayOpen} onClose={() => { setReplayOpen(false); setMode('world'); }} />
  </>;
}
