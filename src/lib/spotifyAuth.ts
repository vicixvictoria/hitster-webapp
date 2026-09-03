import { generateCodeChallenge, generateRandomString } from './pkce';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

const LS_ACCESS = 'spotify_access_token';
const LS_REFRESH = 'spotify_refresh_token';
const LS_EXPIRES = 'spotify_expires_at';
const SS_VERIFIER = 'spotify_code_verifier';
const SS_RETURN_TO = 'spotify_return_to';

function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(LS_REFRESH);
}

export async function startLogin(returnTo: string): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID ist nicht konfiguriert.');
  }
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem(SS_VERIFIER, verifier);
  sessionStorage.setItem(SS_RETURN_TO, returnTo);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

function storeTokens(data: TokenResponse): void {
  localStorage.setItem(LS_ACCESS, data.access_token);
  if (data.refresh_token) localStorage.setItem(LS_REFRESH, data.refresh_token);
  localStorage.setItem(LS_EXPIRES, String(Date.now() + data.expires_in * 1000 - 10_000));
}

export async function handleCallback(code: string): Promise<string> {
  const verifier = sessionStorage.getItem(SS_VERIFIER);
  if (!verifier) throw new Error('Anmeldung abgelaufen. Bitte erneut versuchen.');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Spotify-Anmeldung fehlgeschlagen.');
  const data = (await res.json()) as TokenResponse;
  storeTokens(data);

  const returnTo = sessionStorage.getItem(SS_RETURN_TO) || '/';
  sessionStorage.removeItem(SS_VERIFIER);
  sessionStorage.removeItem(SS_RETURN_TO);
  return returnTo;
}

export async function getValidAccessToken(): Promise<string> {
  const access = localStorage.getItem(LS_ACCESS);
  const expiresAt = Number(localStorage.getItem(LS_EXPIRES) || 0);
  if (access && Date.now() < expiresAt) return access;

  const refreshToken = localStorage.getItem(LS_REFRESH);
  if (!refreshToken) throw new Error('NOT_LOGGED_IN');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    logout();
    throw new Error('NOT_LOGGED_IN');
  }
  const data = (await res.json()) as TokenResponse;
  storeTokens(data);
  return data.access_token;
}

export function logout(): void {
  localStorage.removeItem(LS_ACCESS);
  localStorage.removeItem(LS_REFRESH);
  localStorage.removeItem(LS_EXPIRES);
  localStorage.removeItem('spotify_device_id');
}
