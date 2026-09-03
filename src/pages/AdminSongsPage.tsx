import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { loadSongs, saveSongs, type Song } from '../lib/storage';
import { formatSeconds, parseSpotifyTrackId, parseTimeToSeconds } from '../lib/songUtils';

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>(() => loadSongs());
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [link, setLink] = useState('');
  const [time, setTime] = useState('');
  const [formError, setFormError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function persist(next: Song[]) {
    setSongs(next);
    saveSongs(next);
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trackId = parseSpotifyTrackId(link);
    const startSeconds = parseTimeToSeconds(time || '0');
    if (!trackId) {
      setFormError('Ungültiger Spotify-Link.');
      return;
    }
    if (startSeconds === null) {
      setFormError('Ungültige Startzeit (z.B. 0:45).');
      return;
    }
    if (songs.some((s) => s.trackId === trackId)) {
      setFormError('Dieser Song ist schon in der Liste.');
      return;
    }
    const newSong: Song = {
      id: crypto.randomUUID(),
      title: title.trim() || 'Unbenannt',
      artist: artist.trim(),
      trackId,
      startSeconds,
    };
    persist([...songs, newSong]);
    setTitle('');
    setArtist('');
    setLink('');
    setTime('');
    setFormError('');
  }

  function handleDelete(id: string) {
    persist(songs.filter((s) => s.id !== id));
  }

  function getField(row: Record<string, string>, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (value) return value;
    }
    return '';
  }

  function handleImportCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage('');
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[^a-zäöüß0-9]/g, ''),
      complete: (results) => {
        const existingIds = new Set(songs.map((s) => s.trackId));
        const imported: Song[] = [];
        let skipped = 0;
        for (const row of results.data) {
          const linkValue = getField(row, ['spotifyurl', 'spotifylink', 'link', 'url']);
          const timeValue = getField(row, ['starttime', 'start', 'startzeit', 'beginn']);
          const trackId = parseSpotifyTrackId(linkValue);
          const startSeconds = parseTimeToSeconds(timeValue || '0');
          if (trackId && startSeconds !== null && !existingIds.has(trackId)) {
            existingIds.add(trackId);
            imported.push({
              id: crypto.randomUUID(),
              title: getField(row, ['title', 'titel']) || 'Unbenannt',
              artist: getField(row, ['artist', 'künstler', 'kuenstler', 'interpret']),
              trackId,
              startSeconds,
            });
          } else {
            skipped++;
          }
        }
        persist([...songs, ...imported]);
        if (imported.length === 0) {
          setImportMessage(
            'Keine gültigen Zeilen gefunden. Prüfe, ob die Spaltenüberschriften stimmen (z.B. "spotifyUrl" statt "Link") und ob die Links gültige Spotify-Track-Links sind.',
          );
        } else {
          setImportMessage(
            `${imported.length} Song(s) importiert` + (skipped > 0 ? `, ${skipped} Zeile(n) übersprungen.` : '.'),
          );
        }
      },
      error: (err: Error) => {
        setImportMessage(`Fehler beim Lesen der Datei: ${err.message}`);
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDownloadTemplate() {
    const csv = Papa.unparse([
      {
        title: 'Gimme! Gimme! Gimme!',
        artist: 'Abba',
        spotifyUrl: 'https://open.spotify.com/track/3vkQ5DAB1qQMYO4Mr9zJN6',
        startTime: '0:30',
      },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'hitster-songs-vorlage.csv');
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      songs.map((s) => ({
        title: s.title,
        artist: s.artist,
        spotifyUrl: `https://open.spotify.com/track/${s.trackId}`,
        startTime: formatSeconds(s.startSeconds),
      })),
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'hitster-songs.csv');
  }

  function handleExportJson() {
    const data = songs.map((s) => ({
      trackId: s.trackId,
      startSeconds: s.startSeconds,
      title: s.title,
      artist: s.artist,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'songs.json');
  }

  return (
    <div className="admin-page">
      <p className="admin-link">
        <a href="/">&larr; Zurück zum Scanner</a>
      </p>
      <h1>Song-Verwaltung</h1>
      <p>
        Trage hier eure Songs mit Spotify-Link und Startzeitpunkt ein. Eure QR-Codes auf den Karten bleiben
        unverändert – die App schlägt beim Scannen nur die passende Startzeit nach.
      </p>

      <form onSubmit={handleAdd} className="song-form">
        <input placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Künstler" value={artist} onChange={(e) => setArtist(e.target.value)} />
        <input
          placeholder="Spotify-Link (open.spotify.com/track/...)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <input placeholder="Start (z.B. 0:45)" value={time} onChange={(e) => setTime(e.target.value)} />
        <button type="submit">Hinzufügen</button>
        {formError && <p className="error">{formError}</p>}
      </form>

      <div className="toolbar">
        <label className="button-like">
          CSV importieren
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCsv} hidden />
        </label>
        <button onClick={handleDownloadTemplate}>CSV-Vorlage herunterladen</button>
        <button onClick={handleExportCsv} disabled={songs.length === 0}>
          CSV exportieren
        </button>
        <button onClick={handleExportJson} disabled={songs.length === 0}>
          Als songs.json exportieren
        </button>
        <span className="song-count">{songs.length} Songs</span>
      </div>
      {importMessage && <p className="hint">{importMessage}</p>}
      <p className="hint">
        CSV-Spalten: <code>title, artist, spotifyUrl, startTime</code> (startTime z.B. <code>0:45</code>)
      </p>
      <p className="hint">
        Wichtig: Damit die App die Zeitpunkte beim Spiel kennt, muss die exportierte{' '}
        <code>songs.json</code> nach <code>src/data/songs.json</code> im Projekt gelegt und neu deployt
        werden.
      </p>

      <table className="song-table">
        <thead>
          <tr>
            <th>Titel</th>
            <th>Künstler</th>
            <th>Start</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => (
            <tr key={song.id}>
              <td>{song.title}</td>
              <td>{song.artist}</td>
              <td>{formatSeconds(song.startSeconds)}</td>
              <td>
                <button onClick={() => handleDelete(song.id)} className="delete-btn">
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
