import { getValidAccessToken, logout } from './spotifyAuth';

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('NOT_LOGGED_IN');
  }
  return res;
}

export async function getDevices(): Promise<SpotifyDevice[]> {
  const res = await apiFetch('/me/player/devices');
  if (!res.ok) throw new Error('Konnte Spotify-Geräte nicht laden.');
  const data = await res.json();
  return data.devices as SpotifyDevice[];
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
    throw new Error(`Wiedergabe fehlgeschlagen (${res.status}).`);
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
