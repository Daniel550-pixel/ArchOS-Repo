import { b64uToBuf, bufToB64u, SovereignVault } from './biometric';

export { b64uToBuf, bufToB64u, SovereignVault };

let memoryJwt: string | null = null;

export function setSessionToken(token: string | null) {
  memoryJwt = token;
}

export function getSessionToken(): string | null {
  return memoryJwt;
}

export async function api(endpoint: string, options: RequestInit = {}): Promise<any> {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (memoryJwt) {
    headers['Authorization'] = `Bearer ${memoryJwt}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  });

  if (!res.ok) {
    throw new Error(`API ${url} returned ${res.status}: ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return await res.text();
}
