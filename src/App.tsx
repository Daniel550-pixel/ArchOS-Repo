import React, { useEffect, useState } from 'react';
import { SovereignGate } from './components/auth/SovereignGate';
import { SovereignVault } from './services/biometric';
import { silentRestore } from './services/session';
import { ArchOSUnifiedSpatialCanvas } from './components/spatial/ArchOSUnifiedSpatialCanvas';
import { UltronMissionReplay } from './components/layout/UltronMissionReplay';
import { UltronMissionControl } from './components/layout/UltronMissionControl';

export default function App() {
  const [session, setSession] = useState<{ vault: SovereignVault; jwt: string } | null>(null);
  const [replayOpen, setReplayOpen] = useState(false);
  const [missionControlOpen, setMissionControlOpen] = useState(false);

  useEffect(() => {
    silentRestore().then((restored) => {
      if (restored) setSession({ vault: restored.vault, jwt: restored.jwt });
    });
  }, []);

  useEffect(() => {
    const openReplay = () => setReplayOpen(true);
    const openMissionControl = () => setMissionControlOpen(true);
    window.addEventListener('archos:mission-replay', openReplay);
    window.addEventListener('archos:mission-control', openMissionControl);
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setReplayOpen(value => !value);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
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

  return (
    <div className="archos-app-shell">
      {/* Primary Cinematic Operating Environment */}
      <ArchOSUnifiedSpatialCanvas />

      {/* Discrete Mission Panels available via hotkeys & events */}
      <UltronMissionControl
        open={missionControlOpen}
        onClose={() => setMissionControlOpen(false)}
      />
      <UltronMissionReplay
        open={replayOpen}
        onClose={() => setReplayOpen(false)}
      />
    </div>
  );
}
