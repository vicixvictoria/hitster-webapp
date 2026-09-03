import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isLoggedIn, startLogin } from '../lib/spotifyAuth';
import { getDevices, getTrackInfo, playTrackAt, type TrackInfo } from '../lib/spotifyApi';
import { formatSeconds } from '../lib/songUtils';
import { lookupSong } from '../lib/songDb';

type Status = 'idle' | 'loading' | 'playing' | 'no-phone' | 'error';

const OPEN_SPOTIFY_HINT =
  'Öffne kurz die Spotify-App auf diesem Handy (irgendeinen Song antippen und wieder pausieren), dann zurück und erneut scannen.';

export default function PlayPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const trackId = params.get('t');
  const dbEntry = trackId ? lookupSong(trackId) : undefined;
  const fallbackSeconds = params.get('s');
  const startSeconds = dbEntry ? dbEntry.startSeconds : Number(fallbackSeconds || '0');
  const noDbEntry = trackId ? !dbEntry : false;

  const [loggedIn] = useState(isLoggedIn());
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);

  // Immer nur dieses Handy als Wiedergabegerät – nie einen anderen
  // Spotify-Lautsprecher (Echo Dot o.ä.).
  const start = useCallback(
    async (currentTrackId: string) => {
      setStatus('loading');
      setError(null);
      try {
        const devices = await getDevices();
        const phones = devices.filter((d) => d.type === 'Smartphone');
        const phone = phones.find((d) => d.is_active) ?? phones[0];

        if (!phone) {
          setStatus('no-phone');
          return;
        }

        await playTrackAt(phone.id, currentTrackId, startSeconds * 1000);
        setStatus('playing');
        getTrackInfo(currentTrackId).then(setTrackInfo).catch(() => {});
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === 'NOT_LOGGED_IN') {
          setStatus('error');
          setError('Anmeldung abgelaufen. Bitte neu laden und erneut mit Spotify anmelden.');
          return;
        }
        setStatus('error');
        setError(`${msg} ${OPEN_SPOTIFY_HINT}`);
      }
    },
    [startSeconds],
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

      {(status === 'idle' || status === 'loading') && <p>Song wird gestartet…</p>}

      {status === 'no-phone' && (
        <div className="card">
          <p>Dieses Handy ist noch nicht als Spotify-Gerät aktiv.</p>
          <p className="hint">{OPEN_SPOTIFY_HINT}</p>
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
