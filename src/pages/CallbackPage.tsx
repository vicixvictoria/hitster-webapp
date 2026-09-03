import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleCallback } from '../lib/spotifyAuth';

export default function CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get('code');
    const err = params.get('error');
    if (err) {
      setError('Spotify-Anmeldung wurde abgebrochen.');
      return;
    }
    if (!code) return;
    handleCallback(code)
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="centered-page">
      {error ? (
        <div className="card">
          <p className="error">{error}</p>
          <button onClick={() => navigate('/')}>Zurück</button>
        </div>
      ) : (
        <p>Anmeldung läuft…</p>
      )}
    </div>
  );
}
