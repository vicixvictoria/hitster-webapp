# Hitster Hochzeits-Edition

Karte scannen → der Song startet auf Spotify genau an der richtigen Sekunde, auf dem Handy, das gerade eingeloggt ist.

## Was die App macht

- Eure gedruckten QR-Codes enthalten den normalen Spotify-Link (`open.spotify.com/track/...`) und bleiben unverändert.
- Pro Song ist eine Startzeit hinterlegt (z. B. `0:45`). Beim Scannen liest die App die Track-ID aus dem Link, schlägt die Startzeit nach und spielt den Song ab dort ab.
- Abgespielt wird über den Spotify-Account, mit dem ihr in der App angemeldet seid (**Premium nötig**).
- Eine einfache Passwortabfrage hält Unbeteiligte von der Seite fern.

## Am Hochzeitstag

Auf dem Handy, das die Musik abspielen soll:

1. Die Adresse der App im Browser öffnen.
2. **Passwort** eingeben.
3. **„Mit Spotify anmelden"** – einmalig mit dem Premium-Account einloggen.
4. Die **Spotify-App auf diesem Handy kurz öffnen** (irgendeinen Song antippen, dann pausieren), damit das Handy als Wiedergabegerät aktiv ist. Dann zurück in den Browser.
5. **„Scanner starten"** tippen und die Karte vor die Kamera halten – der Song startet automatisch am richtigen Punkt.
6. Für die nächste Runde **„Nächste Karte scannen"**.

Der Ton kommt **immer aus diesem Handy** – also über den Handylautsprecher oder eine damit gekoppelte Bluetooth-Box. Andere Spotify-Geräte (Echo, Sonos …) werden bewusst ignoriert. Die Bluetooth-Box also am Handy koppeln, nicht in Spotify auswählen.

### Wenn nichts abspielt

- Meldung „Dieses Handy ist noch nicht als Spotify-Gerät aktiv": Spotify-App öffnen, kurz einen Song antippen und wieder pausieren, dann „Nochmal versuchen".
- Das abspielende Handy muss online bleiben und darf die Spotify-App nicht komplett schließen.
- Wird eine Karte gescannt, für die keine Startzeit hinterlegt ist, startet der Song von Anfang an.

## Songs & Startzeiten verwalten

Unter **`/admin`** (gleiches Passwort) wird die Songliste gepflegt:

- **Einzeln:** Titel, Künstler, Spotify-Link und Startzeit (`M:SS`) eintragen und **„Hinzufügen"**.
- **Auf einmal:** **„CSV-Vorlage herunterladen"**, ausfüllen (Spalten `title, artist, spotifyUrl, startTime`) und **„CSV importieren"**.
- Zwischenstand sichern mit **„CSV exportieren"**.

Wenn die Liste passt: **„Als songs.json exportieren"** und die Datei nach `src/data/songs.json` legen (vorhandene ersetzen). Nur diese Datei zählt beim Scannen – die Eingaben auf `/admin` liegen sonst nur im Browser-Speicher.
