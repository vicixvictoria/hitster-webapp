import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isLoggedIn, startLogin } from '../lib/spotifyAuth';
import { getDevices, getTrackInfo, playTrackAt, type SpotifyDevice, type TrackInfo } from '../lib/spotifyApi';
import { formatSeconds } from '../lib/songUtils';
import { lookupSong } from '../lib/songDb';

const LS_DEVICE = 'spotify_device_id';

type Status = 'idle' | 'loading-devices' | 'playing' | 'need-device' | 'error';

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
  const [deviceId, setDeviceId] = useState<string | null>(() => localStorage.getItem(LS_DEVICE));
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);

  const loadDevices = useCallback(async () => {
    setStatus('loading-devices');
    setError(null);
    try {
      const list = await getDevices();
      setDevices(list);
      const active = list.find((d) => d.is_active);
      if (active) {
        localStorage.setItem(LS_DEVICE, active.id);
        setDeviceId(active.id);
      } else {
        if (list.length === 0) {
          setError('Kein Spotify-Gerät gefunden. Öffne die Spotify-App auf deinem Handy.');
        }
        setStatus('need-device');
      }
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  }, []);

  const play = useCallback(async (targetDeviceId: string, currentTrackId: string) => {
    setStatus('idle');
    setError(null);
    try {
      await playTrackAt(targetDeviceId, currentTrackId, startSeconds * 1000);
      setStatus('playing');
      getTrackInfo(currentTrackId).then(setTrackInfo).catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch (e) {
      setError(`${(e as Error).message} Öffne die Spotify-App und wähle unten das Gerät erneut.`);
      setStatus('need-device');
      loadDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSeconds, loadDevices]);

  useEffect(() => {
    if (!loggedIn || !trackId) return;
    if (deviceId) {
      play(deviceId, trackId);
    } else {
      loadDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, trackId]);

  function chooseDevice(id: string) {
    localStorage.setItem(LS_DEVICE, id);
    setDeviceId(id);
    if (trackId) play(id, trackId);
  }

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

      {status === 'loading-devices' && <p>Suche Spotify-Gerät…</p>}

      {status === 'need-device' && (
        <div className="card">
          {error && <p className="error">{error}</p>}
          <p>Wähle ein Gerät:</p>
          <ul className="device-list">
            {devices.map((d) => (
              <li key={d.id}>
                <button onClick={() => chooseDevice(d.id)}>
                  {d.name} ({d.type})
                </button>
              </li>
            ))}
          </ul>
          <button onClick={loadDevices}>Geräte aktualisieren</button>
        </div>
      )}

      {status === 'playing' && (
        <div className="now-playing">
          {trackInfo?.image && <img src={trackInfo.image} alt="" className="album-art" />}
          <p className="song-title">{trackInfo?.name ?? dbEntry?.title ?? '…'}</p>
          <p className="song-artist">{trackInfo?.artists ?? dbEntry?.artist}</p>
          <p className="song-time">ab {formatSeconds(startSeconds)}</p>
          {noDbEntry && (
            <p className="hint">Kein Zeitpunkt hinterlegt – Song startet von vorne.</p>
          )}
        </div>
      )}

      {status === 'error' && error && (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      )}

      <button className="back-button" onClick={() => navigate('/')}>
        Nächste Karte scannen
      </button>
    </div>
  );
}
