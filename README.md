# SparFlow

Eine lokal-first Spar-App für iPhone. Schnell sparen, klare Ziele verfolgen, Challenges starten und spielerisch sparen — ohne Account und ohne Cloud-Zwang.

## Funktionen

- **iPhone-first Oberfläche** mit Bottom-Navigation und großen Touch-Flächen
- **Sparziele** mit Zielbetrag, Farbe, Symbol, Meilensteinen und Prognose
- **Spar-Aktionen**, No-Spend-Days und Spar-Roulette
- **Challenge-Vorlagen** plus eigene tägliche, wöchentliche, Aktions- und Zufalls-Challenges
- **Gamification** mit Level, XP, Erfolgen und Spar-Serie
- **Wochen-/Monatsstatistiken**, Verlauf und Was-wäre-wenn-Rechner
- **Lokale Sparregeln** für wiederkehrende Sparroutinen
- **Lokale SQLite-Datenbank** über `expo-sqlite`
- **Keine Registrierung**, kein Tracking, kein Backend für die Grundfunktionen
- **SideStore-Workflow** mit automatischem Update-Feed

## Warum SQLite statt lokalem PostgreSQL?

PostgreSQL ist eine Server-Datenbank und wird nicht sinnvoll als lokale Datenbank innerhalb einer iPhone-App betrieben. SparFlow verwendet deshalb SQLite direkt auf dem Gerät. Die Datenmodelle sind relational aufgebaut, sodass später optional ein PostgreSQL-/Supabase-Sync ergänzt werden kann.

## Entwicklung

Voraussetzungen:

- Node.js 22+
- npm

```bash
npm install
npx expo start
```

## SideStore installieren und Updates erhalten

Die App-Source muss nur einmal in SideStore hinzugefügt werden:

```text
https://raw.githubusercontent.com/redshoxx/SaveMoney/main/sidestore-source.json
```

Direkter SideStore-Link:

```text
sidestore://source?url=https://raw.githubusercontent.com/redshoxx/SaveMoney/main/sidestore-source.json
```

Danach erkennt SideStore neue SparFlow-Builds über diese Source. Jeder erfolgreiche Push auf `main`:

1. erzeugt automatisch eine neue iOS-Buildnummer,
2. baut eine unsigned `SparFlow.ipa`,
3. aktualisiert das GitHub-Release `sidestore-latest`,
4. aktualisiert `sidestore-source.json` mit Version, Buildnummer, Datum, Dateigröße und Download-URL.

SideStore zeigt danach ein Update für SparFlow an. Die tatsächliche Installation des Updates wird weiterhin in SideStore bestätigt; iOS erlaubt hier kein vollständig unsichtbares Silent-Update einer sideloaded App.

## Manuelle IPA über GitHub Actions

1. GitHub → **Actions** → **Build SideStore IPA** öffnen.
2. **Run workflow** starten.
3. Nach erfolgreichem Lauf das Artifact **SparFlow-SideStore-IPA** herunterladen.
4. ZIP entpacken und `SparFlow.ipa` in SideStore importieren.

Bei einem Git-Tag wie `v2.0.0` wird zusätzlich eine versionierte GitHub Release mit `SparFlow.ipa` erstellt.

## Lokale Daten

Die Datei `sparflow.db` enthält unter anderem:

- `goals`
- `challenges`
- `contributions`
- `saving_rules`
- `no_spend_days`

Einzahlungen werden separat protokolliert. Dadurch bleiben Gesamtstand, Verlauf, XP, Serien und Statistiken nachvollziehbar.

## Projektstruktur

```text
app/                  Expo Router Screens
components/           Wiederverwendbare UI-Bausteine
constants/            Farben und Design Tokens
data/                 Challenge- und Spar-Aktions-Vorlagen
db/                   SQLite-Schema und Queries
store/                App-State und Mutationen
types/                TypeScript-Datenmodelle
utils/                Formatierung und Insights
.github/workflows/     SideStore IPA Build und Auto-Update
```

## Datenschutz

Die App benötigt für ihre Kernfunktionen keine Netzwerkverbindung. Alle Spar-Daten bleiben standardmäßig auf dem Gerät.
