import songsData from '../data/songs.json';

export interface SongDbEntry {
  trackId: string;
  startSeconds: number;
  title: string;
  artist: string;
}

const songs = songsData as SongDbEntry[];

const byTrackId = new Map<string, SongDbEntry>(songs.map((s) => [s.trackId, s]));

export function lookupSong(trackId: string): SongDbEntry | undefined {
  return byTrackId.get(trackId);
}

export function allSongs(): SongDbEntry[] {
  return songs;
}
