import { SovereignVault } from './biometric';
import { setSessionToken } from './secure';

export interface SessionData {
  vault: SovereignVault;
  jwt: string;
  totpSecret?: string;
}

export async function silentRestore(): Promise<SessionData | null> {
  try {
    const r = await fetch('/api/v1/auth/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (r.ok) {
      const j = await r.json();
      if (j.vault_key && j.jwt) {
        const vault = new SovereignVault();
        await vault.init(j.vault_key);
        setSessionToken(j.jwt);

        return {
          vault,
          jwt: j.jwt,
          totpSecret: j.totp_secret,
        };
      }
    }
  } catch (err) {
    console.debug('[Session] Server silent restore inactive, checking local enclave storage:', err);
  }

  try {
    const localVaultKey = sessionStorage.getItem('archos_client_vault');
    const localJwt = sessionStorage.getItem('archos_client_jwt');
    if (localVaultKey && localJwt) {
      const vault = new SovereignVault();
      await vault.init(localVaultKey);
      setSessionToken(localJwt);
      return {
        vault,
        jwt: localJwt,
      };
    }
  } catch (e) {
    console.debug('[Session] Client storage read error:', e);
  }

  return null;
}

export async function logout(): Promise<boolean> {
  try {
    sessionStorage.removeItem('archos_client_vault');
    sessionStorage.removeItem('archos_client_jwt');
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    setSessionToken(null);
    return true;
  } catch (err) {
    console.warn('[Session] Logout cleanup error:', err);
    setSessionToken(null);
    return true;
  }
}
