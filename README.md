# SparFlow

Eine lokal-first Spar-App für iPhone. Schnell sparen, klare Ziele verfolgen, Challenge-Vorlagen starten und eigene Spar-Challenges erstellen — ohne Account und ohne Cloud-Zwang.

## Funktionen

- **iPhone-first Oberfläche** mit Bottom-Navigation und großen Touch-Flächen
- **Sparziele** mit Zielbetrag, Farbe, Symbol und Schnellbuchungen
- **Challenge-Vorlagen** wie „5 € am Tag“, „Kaffee-Tausch“ und „1.000 € Power“
- **Eigene Challenges** mit frei wählbarem Ziel- und Schrittbetrag
- **Gamification ohne Überladung**: Level, XP und Spar-Serie
- **Lokale SQLite-Datenbank** über `expo-sqlite`
- **Keine Registrierung**, kein Tracking, kein Backend für die Grundfunktionen
- **SideStore-Workflow** für eine unsigned iPhone-IPA

## Warum SQLite statt lokalem PostgreSQL?

PostgreSQL ist eine Server-Datenbank und wird nicht sinnvoll als lokale Datenbank innerhalb einer iPhone-App betrieben. SparFlow verwendet deshalb SQLite direkt auf dem Gerät. Die Datenmodelle sind bewusst relational aufgebaut, sodass später optional ein PostgreSQL-/Supabase-Sync ergänzt werden kann.

## Entwicklung

Voraussetzungen:

- Node.js 22+
- npm

```bash
npm install
npx expo start
```

Für den normalen Entwicklungsstart kann Expo verwendet werden. SQLite, Router und Haptics sind bereits eingerichtet.

## SideStore-IPA über GitHub Actions

1. GitHub → **Actions** → **Build SideStore IPA** öffnen.
2. **Run workflow** starten.
3. Nach erfolgreichem Lauf das Artifact **SparFlow-SideStore-IPA** herunterladen.
4. ZIP entpacken und `SparFlow.ipa` in SideStore importieren.

Alternativ wird bei einem Git-Tag wie `v1.0.0` automatisch eine GitHub Release mit `SparFlow.ipa` erstellt.

### Tag erstellen

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Lokale Daten

Die Datei `sparflow.db` enthält:

- `goals`
- `challenges`
- `contributions`

Einzahlungen werden zusätzlich separat protokolliert. Dadurch bleiben Gesamtstand, Verlauf, XP und Serien nachvollziehbar.

## Projektstruktur

```text
app/                  Expo Router Screens
components/           Wiederverwendbare UI-Bausteine
constants/            Farben und Design Tokens
data/                 Challenge-Vorlagen
db/                   SQLite-Schema und Queries
store/                App-State und Mutationen
types/                TypeScript-Datenmodelle
utils/                Formatierung und Hilfsfunktionen
.github/workflows/     SideStore IPA Build
```

## Datenschutz

Die App benötigt für ihre Kernfunktionen keine Netzwerkverbindung. Alle Spar-Daten bleiben standardmäßig auf dem Gerät.
