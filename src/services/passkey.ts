// src/services/passkey.ts
// Genuine WebAuthn FIDO2 / Passkey Cryptographic Ceremony in Browser

const KEY_ID_STORAGE = 'archos_webauthn_passkey_id';
const USER_HANDLE_STORAGE = 'archos_webauthn_user_handle';

export interface PasskeyAuthResult {
  success: boolean;
  credentialId?: string;
  user?: string;
  error?: string;
  authenticatorType?: 'touch_id_face_id_windows_hello' | 'security_key' | 'fallback_pin';
}

/**
 * Check if WebAuthn is supported on the client device
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && !!window.navigator?.credentials && !!window.PublicKeyCredential;
}

/**
 * Register a real hardware WebAuthn passkey using standard W3C WebAuthn ceremony
 */
export async function registerPasskey(userName: string = 'Sovereign-Operative-UAE'): Promise<PasskeyAuthResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported in this browser environment.' };
  }

  try {
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const userId = window.crypto.getRandomValues(new Uint8Array(16));

    const createOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'JARVIS / ARCHOS UAE Sovereign AI',
        id: window.location.hostname || 'localhost'
      },
      user: {
        id: userId,
        name: userName,
        displayName: `${userName} (Sovereign Operative)`
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256 (ECDSA w/ SHA-256)
        { type: 'public-key', alg: -257 }  // RS256 (RSA w/ SHA-256)
      ],
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = (await navigator.credentials.create({
      publicKey: createOptions
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Passkey registration cancelled by user.' };
    }

    const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    localStorage.setItem(KEY_ID_STORAGE, credIdBase64);
    localStorage.setItem(USER_HANDLE_STORAGE, userName);

    return {
      success: true,
      credentialId: credIdBase64,
      user: userName,
      authenticatorType: 'touch_id_face_id_windows_hello'
    };
  } catch (err: any) {
    console.warn('WebAuthn registration error:', err);
    return {
      success: false,
      error: err?.message || 'Passkey ceremony failed or was dismissed.'
    };
  }
}

/**
 * Perform genuine WebAuthn authentication ceremony
 */
export async function unlockPasskey(): Promise<PasskeyAuthResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn not supported.' };
  }

  try {
    const storedCredId = localStorage.getItem(KEY_ID_STORAGE);
    const storedUser = localStorage.getItem(USER_HANDLE_STORAGE) || 'Sovereign-Operative-UAE';

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));

    const getOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'preferred',
      rpId: window.location.hostname || 'localhost'
    };

    if (storedCredId) {
      const rawId = Uint8Array.from(atob(storedCredId), (c) => c.charCodeAt(0));
      getOptions.allowCredentials = [{ type: 'public-key', id: rawId }];
    }

    const assertion = (await navigator.credentials.get({
      publicKey: getOptions
    })) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Verification assertion rejected.' };
    }

    return {
      success: true,
      credentialId: assertion.id,
      user: storedUser,
      authenticatorType: 'touch_id_face_id_windows_hello'
    };
  } catch (err: any) {
    console.warn('WebAuthn assertion error:', err);
    return {
      success: false,
      error: err?.message || 'Passkey verification cancelled.'
    };
  }
}

export function hasRegisteredPasskey(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(KEY_ID_STORAGE);
}
