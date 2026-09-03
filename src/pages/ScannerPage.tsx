import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { isLoggedIn, startLogin } from '../lib/spotifyAuth';
import { parseSpotifyTrackId } from '../lib/songUtils';
import HeartPhotos from '../components/HeartPhotos';

const READER_ID = 'qr-reader';

export default function ScannerPage() {
  const navigate = useNavigate();
  const [loggedIn] = useState(isLoggedIn());
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    return () => {
      qrRef.current?.stop().catch(() => {});
    };
  }, []);

  async function startScanning() {
    setError(null);
    handledRef.current = false;
    const qr = new Html5Qrcode(READER_ID);
    qrRef.current = qr;
    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => handleScan(decodedText),
        undefined,
      );
      setScanning(true);
    } catch {
      setError('Kamera konnte nicht gestartet werden. Bitte Kamera-Zugriff im Browser erlauben.');
    }
  }

  async function handleScan(decodedText: string) {
    if (handledRef.current) return;
    handledRef.current = true;
    if (qrRef.current) {
      try {
        await qrRef.current.stop();
        await qrRef.current.clear();
      } catch {
        /* ignore */
      }
    }
    setScanning(false);
    const trackId = parseSpotifyTrackId(decodedText);
    if (!trackId) {
      setError('Dieser QR-Code enthält keinen gültigen Spotify-Link.');
      return;
    }
    navigate(`/p?t=${trackId}`);
  }

  if (!loggedIn) {
    return (
      <>
        <HeartPhotos />
        <div className="centered-page">
          <div className="card">
            <h1>Ingird's und Erich's</h1>
            <h1>Hitster Hochzeits-Edition</h1>
            <p>Zum Scannen und Abspielen bitte mit eurem Spotify-Premium-Account anmelden.</p>
            <button onClick={() => startLogin('/')}>Mit Spotify anmelden</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeartPhotos />
      <div className="centered-page">
        <h1>Hitster Hochzeits-Edition</h1>
        <p>Scanne den QR-Code auf der Karte.</p>
        <div id={READER_ID} className="qr-reader" />
        {!scanning && <button onClick={startScanning}>Scanner starten</button>}
        {error && <p className="error">{error}</p>}
        <p className="admin-link">
          <a href="/admin">Song-Verwaltung (nur für Admins)</a>
        </p>
      </div>
    </>
  );
}
