import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isLoggedIn, startLogin } from '../lib/spotifyAuth';
import { getDevices, getTrackInfo, playTrackAt, type SpotifyDevice, type TrackInfo } from '../lib/spotifyApi';
import { formatSeconds } from '../lib/songUtils';
import { lookupSong } from '../lib/songDb';

const LS_DEVICE = 'spotify_device_id';

type Status = 'idle' | 'loading-devices' | 'playing' | 'need-device' | 'error';

// Welches Spotify-Gerät ohne Nachfrage benutzt wird:
// 1. das gerade aktive, 2. das zuletzt benutzte, 3. das Handy,
// 4. wenn es nur ein Gerät gibt, eben dieses.
function pickDevice(list: SpotifyDevice[]): SpotifyDevice | undefined {
  const stored = localStorage.getItem(LS_DEVICE);
  return (
    list.find((d) => d.is_active) ??
    (stored ? list.find((d) => d.id === stored) : undefined) ??
    list.find((d) => d.type === 'Smartphone') ??
    (list.length === 1 ? list[0] : undefined)
  );
}

export default function PlayPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const trackId = params.get('t');
  const dbEntry = trackId ? lookupSong(trackId) : undefined;
  const fallbackSeconds = params.get('s');
  const startSeconds = dbEntry ? dbEntry.startSeconds : Number(fallbackSeconds || '0');
  const noDbEntry = trackId ? !dbEntry : false;

  const [loggedIn] = useState(isLoggedIn());
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);

  const playOn = useCallback(
    async (deviceId: string, currentTrackId: string) => {
      setStatus('idle');
      setError(null);
      try {
        await playTrackAt(deviceId, currentTrackId, startSeconds * 1000);
        localStorage.setItem(LS_DEVICE, deviceId);
        setStatus('playing');
        getTrackInfo(currentTrackId).then(setTrackInfo).catch(() => {});
      } catch (e) {
        localStorage.removeItem(LS_DEVICE);
        setError(
          `${(e as Error).message} Öffne kurz die Spotify-App auf dem Handy und wähle unten das Gerät.`,
        );
        setStatus('need-device');
      }
    },
    [startSeconds],
  );

  // Geräte laden und – wenn möglich – direkt auf dem Standardgerät starten.
  // Nur wenn kein eindeutiges Gerät gefunden wird, erscheint die Auswahl.
  const start = useCallback(
    async (currentTrackId: string, forcePicker = false) => {
      setStatus('loading-devices');
      setError(null);
      let list: SpotifyDevice[];
      try {
        list = await getDevices();
      } catch (e) {
        setError((e as Error).message);
        setStatus('error');
        return;
      }
      setDevices(list);

      if (list.length === 0) {
        setError(
          'Kein Spotify-Gerät gefunden. Öffne einmal kurz die Spotify-App auf dem Handy (irgendeinen Song antippen), dann zurück und erneut scannen.',
        );
        setStatus('need-device');
        return;
      }

      const chosen = forcePicker ? undefined : pickDevice(list);
      if (chosen) {
        await playOn(chosen.id, currentTrackId);
      } else {
        setStatus('need-device');
      }
    },
    [playOn],
  );

  useEffect(() => {
    if (!loggedIn || !trackId) return;
    void start(trackId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, trackId]);

  if (!trackId) {
    return (
      <div className="centered-page">
        <div className="card">
          <p>Kein gültiger Song-Code in diesem QR-Code.</p>
          <button onClick={() => navigate('/')}>Zurück zum Scanner</button>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="centered-page">
        <div className="card">
          <h1>Hitster Hochzeits-Edition</h1>
          <p>Bitte mit Spotify anmelden, um den Song abzuspielen.</p>
          <button onClick={() => startLogin(`/p${window.location.search}`)}>Mit Spotify anmelden</button>
        </div>
      </div>
    );
  }

  return (
    <div className="centered-page">
      <h1>Hitster Hochzeits-Edition</h1>

      {(status === 'idle' || status === 'loading-devices') && <p>Song wird gestartet…</p>}

      {status === 'need-device' && (
        <div className="card">
          {error && <p className="error">{error}</p>}
          {devices.length > 0 && (
            <>
              <p>Wähle ein Gerät:</p>
              <ul className="device-list">
                {devices.map((d) => (
                  <li key={d.id}>
                    <button onClick={() => playOn(d.id, trackId)}>
                      {d.name} ({d.type})
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button onClick={() => start(trackId)}>Nochmal versuchen</button>
        </div>
      )}

      {status === 'playing' && (
        <div className="now-playing">
          {trackInfo?.image && <img src={trackInfo.image} alt="" className="album-art" />}
          <p className="song-title">{trackInfo?.name ?? dbEntry?.title ?? '…'}</p>
          <p className="song-artist">{trackInfo?.artists ?? dbEntry?.artist}</p>
          <p className="song-time">ab {formatSeconds(startSeconds)}</p>
          {noDbEntry && <p className="hint">Kein Zeitpunkt hinterlegt – Song startet von vorne.</p>}
        </div>
      )}

      {status === 'error' && error && (
        <div className="card">
          <p className="error">{error}</p>
          <button onClick={() => start(trackId)}>Nochmal versuchen</button>
        </div>
      )}

      <button className="back-button" onClick={() => navigate('/')}>
        Nächste Karte scannen
      </button>
    </div>
  );
}
