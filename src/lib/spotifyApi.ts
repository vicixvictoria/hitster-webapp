import { getValidAccessToken, logout } from './spotifyAuth';

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

async function readSpotifyError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error?.message) return data.error.message as string;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

async function apiFetch(path: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  const token = await getValidAccessToken();
  let res: Response;
  try {
    res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e) {
    // Netzwerkfehler (kein Internet, kurzer Aussetzer) – ein paar Mal neu versuchen.
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 600));
      return apiFetch(path, options, retries - 1);
    }
    throw new Error(`Keine Verbindung zu Spotify. ${(e as Error).message}`);
  }

  if (res.status === 401) {
    logout();
    throw new Error('NOT_LOGGED_IN');
  }
  // 429 = Rate Limit, 5xx = vorübergehende Spotify-Störung → neu versuchen.
  if ((res.status === 429 || res.status >= 500) && retries > 0) {
    const wait = Number(res.headers.get('Retry-After') || '1') * 1000;
    await new Promise((r) => setTimeout(r, Math.min(wait, 3000)));
    return apiFetch(path, options, retries - 1);
  }
  return res;
}

export async function getDevices(): Promise<SpotifyDevice[]> {
  const res = await apiFetch('/me/player/devices');
  if (!res.ok) {
    const detail = await readSpotifyError(res);
    if (res.status === 403) {
      throw new Error(
        'Spotify erlaubt diesem Konto den Zugriff nicht. Ist es in der Spotify-Developer-App als Nutzer freigegeben und hat es Premium?',
      );
    }
    throw new Error(`Konnte Spotify-Geräte nicht laden (${detail}).`);
  }
  const data = await res.json();
  return (data.devices ?? []) as SpotifyDevice[];
}

export async function playTrackAt(deviceId: string, trackId: string, positionMs: number): Promise<void> {
  const res = await apiFetch(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uris: [`spotify:track:${trackId}`],
      position_ms: positionMs,
    }),
  });
  if (!res.ok && res.status !== 204) {
    if (res.status === 404) throw new Error('Kein aktives Spotify-Gerät gefunden.');
    if (res.status === 403) throw new Error('Wiedergabe nicht möglich (Spotify Premium erforderlich).');
    throw new Error(`Wiedergabe fehlgeschlagen (${await readSpotifyError(res)}).`);
  }
}

export interface TrackInfo {
  name: string;
  artists: string;
  image?: string;
}

export async function getTrackInfo(trackId: string): Promise<TrackInfo> {
  const res = await apiFetch(`/tracks/${trackId}`);
  if (!res.ok) throw new Error('Konnte Songinfo nicht laden.');
  const data = await res.json();
  return {
    name: data.name as string,
    artists: (data.artists as { name: string }[]).map((a) => a.name).join(', '),
    image: data.album?.images?.[2]?.url ?? data.album?.images?.[0]?.url,
  };
}
