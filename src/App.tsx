import React, { useEffect, useState } from 'react';
import { SovereignGate } from './components/auth/SovereignGate';
import { SovereignVault } from './services/biometric';
import { silentRestore } from './services/session';
import { UltronOneWorld } from './components/layout/UltronOneWorld';

export default function App() {
  const [session, setSession] = useState<{ vault: SovereignVault; jwt: string } | null>(null);

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

  return <UltronOneWorld />;
}
