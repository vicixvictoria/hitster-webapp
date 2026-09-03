import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PasswordGate from './components/PasswordGate';
import PlayPage from './pages/PlayPage';
import CallbackPage from './pages/CallbackPage';
import './App.css';

const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const AdminSongsPage = lazy(() => import('./pages/AdminSongsPage'));

export default function App() {
  return (
    <BrowserRouter>
      <PasswordGate>
        <Suspense fallback={<div className="centered-page">Lädt…</div>}>
          <Routes>
            <Route path="/" element={<ScannerPage />} />
            <Route path="/p" element={<PlayPage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/admin" element={<AdminSongsPage />} />
          </Routes>
        </Suspense>
      </PasswordGate>
    </BrowserRouter>
  );
}
