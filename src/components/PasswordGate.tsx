import { useState, type FormEvent, type ReactNode } from 'react';

const SS_KEY = 'hitster_pw_ok';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string;

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SS_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (APP_PASSWORD && input === APP_PASSWORD) {
      sessionStorage.setItem(SS_KEY, 'true');
      setUnlocked(true);
    } else {
      setError('Falsches Passwort.');
    }
  }

  return (
    <div className="centered-page">
      <form onSubmit={handleSubmit} className="card">
        <h1>Hitster Hochzeits-Edition</h1>
        <p>Bitte Passwort eingeben:</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit">Weiter</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
