# SparPilot

Eine minimalistische, lokal-first Spar-App für iPhone. Ziel: in möglichst wenigen Schritten Geld sparen, Ziele verfolgen und Sparroutinen nutzen — ohne Account und ohne Cloud-Zwang.

## Funktionen

- **Klare Navigation:** Start, Ziele, Sparen, Aufgaben und Challenge
- **Geführtes Sparen:** Ziel wählen → Betrag wählen → bestätigen
- **Sparziele** mit Fortschritt und schnellen Einzahlungen
- **Challenges** mit einem klaren nächsten Sparschritt
- **To-Dos** mit Fälligkeit und lokalen Erinnerungen
- **Erinnerungen** für Sparziele und Challenges
- **Lokale SQLite-Datenbank** über `expo-sqlite`
- **Keine Registrierung**, kein Tracking, kein Backend für die Grundfunktionen
- **SideStore-Workflow** mit automatischem Update-Feed

## Warum SQLite statt lokalem PostgreSQL?

PostgreSQL ist eine Server-Datenbank und wird nicht sinnvoll als lokale Datenbank innerhalb einer iPhone-App betrieben. SparPilot verwendet deshalb SQLite direkt auf dem Gerät. Die Datenmodelle sind relational aufgebaut, sodass später optional ein PostgreSQL-/Supabase-Sync ergänzt werden kann.

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

Jeder erfolgreiche Push auf `main` baut eine unsigned IPA, aktualisiert das Release `sidestore-latest` und schreibt die neue sichtbare Version in `sidestore-source.json`.

## Manuelle IPA über GitHub Actions

1. GitHub → **Actions** → **Build SideStore IPA** öffnen.
2. **Run workflow** starten.
3. Nach erfolgreichem Lauf das Artifact **SparPilot-SideStore-IPA** herunterladen.
4. ZIP entpacken und die enthaltene IPA in SideStore importieren.

## Lokale Daten

Die bestehende Datei `sparflow.db` bleibt aus Update-Kompatibilitätsgründen unverändert und enthält unter anderem:

- `goals`
- `challenges`
- `contributions`
- `saving_rules`
- `no_spend_days`
- `app_settings`
- `todo_items`

Einzahlungen werden separat protokolliert. Dadurch bleiben Gesamtstand, Verlauf und Statistiken nachvollziehbar.

## Update-Kompatibilität

Der sichtbare App-Name lautet **SparPilot**. Die bestehende Bundle-ID `com.redshoxx.sparflow`, der interne Scheme-Name und die lokale Datenbank-ID bleiben bewusst erhalten, damit bestehende SideStore-Installationen und lokale Daten als Update weiterverwendet werden können.

## Projektstruktur

```text
app/                  Expo Router Screens
components/           Wiederverwendbare UI-Bausteine
constants/            Farben und Design Tokens
data/                 Challenge- und Spar-Aktions-Vorlagen
db/                   SQLite-Schema, Queries und lokale Einstellungen
store/                App-State und Mutationen
types/                TypeScript-Datenmodelle
utils/                Formatierung und Insights
.github/workflows/     SideStore IPA Build und Auto-Update
```

## Datenschutz

Die App benötigt für ihre Kernfunktionen keine Netzwerkverbindung. Alle Spar-Daten bleiben standardmäßig auf dem Gerät.
