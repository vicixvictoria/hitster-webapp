# Hitster Hochzeits-Edition – Webapp

Scannt den QR-Code einer Karte und startet den Song auf Spotify exakt an der gewünschten Sekunde – auf dem Handy, das gerade eingeloggt ist.

## Wie es funktioniert

- Eure bereits gedruckten QR-Codes bleiben **unverändert** – sie enthalten weiterhin einfach den normalen Spotify-Link (`open.spotify.com/track/...`).
- In der App hinterlegt ihr pro Song nur den gewünschten Startzeitpunkt (`/admin`). Diese Liste ist Teil der App (`src/data/songs.json`).
- Beim Scannen einer Karte liest die App die Track-ID aus dem Spotify-Link, schlägt dazu die Startzeit in der Songliste nach und startet den Song auf Spotify exakt dort.
- Wer die Seite öffnet, meldet sich einmalig mit dem eigenen Spotify-Premium-Account an (nötig, weil Spotify Wiedergabe an einer bestimmten Stelle nur über die Web API mit Login erlaubt, nicht über einen einfachen Link).
- Danach steuert die App die Wiedergabe auf dem Handy (per Spotify Connect – die Spotify-App muss einmal geöffnet worden sein, damit sie als Gerät erkannt wird).
- Eine einfache Passwortsperre verhindert, dass Unbeteiligte die Seite einfach im Internet finden und benutzen (keine hohe Sicherheit, wie gewünscht).

## Einmalige Einrichtung

### 1. Spotify-App registrieren (kostenlos)

1. Auf https://developer.spotify.com/dashboard einloggen (mit dem Spotify-Account, der auch am Hochzeitstag zum Abspielen genutzt wird – braucht **Premium**).
2. "Create app" klicken.
3. App Name z.B. `Hitster Hochzeit`, Beschreibung beliebig.
4. **Redirect URI**: `https://<eure-domain>/callback` eintragen (die Domain bekommt ihr in Schritt 2 von Vercel). Für lokales Testen zusätzlich `http://localhost:5183/callback` hinzufügen.
5. API-Häkchen: "Web API" auswählen.
6. Speichern, dann in den App-Settings die **Client ID** kopieren (kein Client Secret nötig).

### 2. Deployen (z.B. mit Vercel, kostenlos)

1. Projekt zu GitHub pushen (oder direkt den Ordner `hitster-webapp` per `vercel` CLI deployen).
2. Bei [vercel.com](https://vercel.com) das Repo importieren.
3. Als Umgebungsvariablen setzen (Vercel Project Settings → Environment Variables):
   - `VITE_APP_PASSWORD` – das Passwort, das eure Gäste/ihr beim Öffnen eingeben müsst
   - `VITE_SPOTIFY_CLIENT_ID` – die Client ID aus Schritt 1
4. Deployen. Die `vercel.json` sorgt dafür, dass alle Unterseiten (`/p`, `/admin`, `/callback`) funktionieren.
5. Die fertige URL (z.B. `https://hitster-hochzeit.vercel.app`) als Redirect URI `https://hitster-hochzeit.vercel.app/callback` in der Spotify-App ergänzen (Schritt 1.4).

### 3. Songs & Startzeitpunkte eintragen

1. `https://<eure-domain>/admin` öffnen (Passwort eingeben).
2. Für jeden der 140 Songs: Titel, Künstler, Spotify-Link (z.B. `https://open.spotify.com/track/...` – derselbe Link, der schon in euren QR-Codes steckt) und Startzeitpunkt (z.B. `0:45`) eintragen – oder alle auf einmal per CSV-Import (Spalten: `title, artist, spotifyUrl, startTime`).
3. "Als songs.json exportieren" klicken.
4. Die heruntergeladene `songs.json` nach `src/data/songs.json` im Projekt kopieren (vorhandene Datei ersetzen).
5. Änderung committen & pushen (bzw. erneut deployen) – bei Vercel + GitHub passiert das automatisch bei jedem Push, auch wenn ihr die Datei direkt im GitHub-Webinterface bearbeitet.

Hinweis: Die Eingabe-Liste auf `/admin` wird nur lokal im Browser zwischengespeichert (localStorage), damit ihr nicht bei jeder Änderung neu anfangen müsst. Die eigentliche "Quelle der Wahrheit" fürs Spiel ist aber `src/data/songs.json` im Projekt – nur diese Datei wird beim Scannen tatsächlich verwendet. Am besten regelmäßig per "CSV exportieren" sichern.

## Am Hochzeitstag

1. `https://<eure-domain>` auf dem Handy öffnen, das die Musik abspielen soll.
2. Passwort eingeben.
3. Mit Spotify anmelden (einmalig).
4. Spotify-App kurz öffnen (damit das Handy als Gerät erkannt wird), dann zurück zur Hitster-Webapp.
5. "Scanner starten" tippen, Karte scannen – Song startet automatisch am richtigen Punkt.
6. "Nächste Karte scannen" für die nächste Runde.

## Lokal entwickeln

```bash
npm install
cp .env.example .env   # Passwort + Client ID eintragen
npm run dev
```

## Sicherheitshinweis

Das Passwort wird beim Bauen der Seite mit ins JavaScript eingebettet (rein clientseitige App, kein eigener Server) – es schützt also nur vor zufälligem Finden, nicht vor gezieltem Auslesen. Für den Zweck (Familie/Freunde von einer öffentlichen URL fernhalten) reicht das.
