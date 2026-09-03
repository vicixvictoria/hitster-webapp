export interface Song {
  id: string;
  title: string;
  artist: string;
  trackId: string;
  startSeconds: number;
}

const KEY = 'hitster_songs';

export function loadSongs(): Song[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
}

export function saveSongs(songs: Song[]): void {
  localStorage.setItem(KEY, JSON.stringify(songs));
}
