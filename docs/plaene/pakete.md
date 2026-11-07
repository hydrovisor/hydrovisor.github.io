# Paketplan nach Zeitplan Z3

Stand 1.11.2026 · Auftrag 3 «Arbeitsweise und Plan» · Grundlage: Konzept v1.2 Kapitel 12 und 13 (Termine nur aus 13.1), Use Cases Fassung 4 (AK-Nummern, eingefroren seit der Abnahme der Spezifikation), `docs/spec/`. **Eingefroren am 1.11.2026 mit Tims Abnahme von Auftrag 3** (Frist 13.11.; PT je Paket und Tims Minuten als Vergleichsmassstab, Konzept 12.7). Danach ändern sich nur Status und Ist-Werte; eine neue Schätzung kommt als zusätzliche Spalte im Issue, nicht hier.

**Lesehilfe.** Klasse: R Routine (Kurzplan des Leads, keine Planfreigabe), F Fachlogik (Planer, Testentwickler, `pruefer_fachlogik`; Planfreigabe nur mit Migration), K Kern (Planer `planer_kern` mit Fable 5.1, Planfreigabe immer, zwei Prüfer parallel). Mig.: Migration in `supabase/migrations` (ja, nein, bedingt). PT: Personentage des Agenten, netto (A). Min.: Tims Minuten für Plan, Abnahme und Merge-Bestätigung nach Konzept 13.3 (Routine und Fachlogik ohne Planfreigabe rund 45, mit Planfreigabe rund 75). Termin: Ziel für den Merge. AK der Abläufe mit Präfix (Konzept 12.6); [G] = [Gerät], am Regal mit Label `offen-regal`.

## I0 Grundgerüst und Risikotests (14.11. bis 30.11., Rest bis 6.12.)

| ID | Paket | Kl. | AK und Testfälle | Mig. | PT | Min. | Termin |
|---|---|---|---|---|---|---|---|
| I0-01 | Grundgerüst: Vite, React, TypeScript, ESLint und Prettier, Vitest, Playwright (360 × 640), Hash-Router, Manifest im Hochformat, vite-plugin-pwa «prompt» mit Hinweis «Neue Version», `version.json`, Info-Seite mit Commit, Design System eingebunden, npm-Skripte nach `CLAUDE.md` | R | TO7 [E2E]; Info-Seite zeigt Commit [E2E] | nein | 0.75 | 45 | 17.11. |
| I0-02 | Prüftor und Auslieferung scharf: `scripts/ak-abdeckung.ts`, Rauchtest `playwright.rauchtest.config.ts`, erster Deploy auf `https://hydrovisor.github.io/`, Tag `letzter-guter-stand` | R | Rauchtest mit Rückfall einmal ausgelöst (Beleg im PR) | nein | 0.5 | 45 | 18.11. |
| I0-06 | Anmeldung (E-Mail und Passwort, lang gültige Sitzung), Installation mit Chrome, dauerhafter Speicher | R | UC0-AK7 [G] | nein | 0.5 | 45 | 19.11. |
| I0-03 | **Datenmodell mit Zugriffsregeln** aus `docs/spec/02_datenmodell.sql`, pgTAP, Typen, Bucket `saattueten`; Vergleich Fable gegen Opus (12.7 a) | K | UC0-AK2, UC1-AK7, UC4-AK6 [SQL], C4-AK1, C4-AK3 [SQL]; Fälle aus `docs/spec/pruefung/smoke*.sql` als pgTAP | ja | 1.5 | 75 | 21.11. |
| I0-05 | Seed mit Validator V1 bis V13, Zähltest, Teilfreigabe, Sortenstamm aus `sorten.csv`, Seed-Konstanten (`03_import_w0.md` Abschnitte 7 bis 10) | F | Validator je Regel [Unit]; Umrechnung [Unit]; Zähltest, Idempotenz, Versionierung, Teilfreigabe, Abbruch [SQL] | nein | 1.0 | 45 | 24.11. |
| I0-04 | **Datenpfad `schreiben()` mit Offline-Bündel** (Client-UUID, Upsert, Bündel lesbar, «Stand: hh:mm»); Vergleich Fable gegen Opus (12.7 a) | K | UC9-AK8 [E2E], TO2, TO6, TO8 | nein | 1.0 | 75 | 25.11. |
| I0-07 | Einfache Messung (Felder pH, EC, °C), Kalibrierung erfassen, Fälligkeit «Messung» und «Messgerät kalibrieren» | F | UC9-AK2, UC9-AK6, TZ1 bis TZ4 [Unit] | nein | 0.75 | 45 | 26.11. |
| I0-08 | Push-Test von Ende zu Ende: Abo, VAPID (Tim setzt Schlüssel), pg_cron alle 5 min, Edge Function `push-taeglich`, Quittung, Test-Push (T2) | F | UC0-AK5, TP1 bis TP4 [Unit, Deno test]; UC8-AK8 [G] (M0: 5 Tage in Folge bis 15.12.) | ja | 1.0 | 75 | 28.11. |
| I0-09 | KI-Eval: Edge Function `ki-tuete` mit Schema, Ausweichmodell, `ki_aufruf`, Eval-Skript an 3 Tüten (T3) | F | UC4-AK1, UC4-AK2, UC4-AK5 (TK1 bis TK3) [Unit]; UC4-AK3 [Eval] M0 3 von 3 | nein | 0.5 | 45 | 30.11. |
| I0-10 | Demo-Szenarien S1 bis S9 als Anlage X, Testanlage Y, `npm run demo` mit `datenart_loeschen()` (T6) | R | Demo löschen [SQL] (`06_tests.md` Abschnitt 9) | nein | 0.5 | 45 | 29.11. |
| I0-11 | Backup scharf: Rolle `backup_leser` (Risikotest BYPASSRLS; ohne BYPASSRLS Migration mit den Lese-Policies `backup_lesen`), `scripts/backup-storage.mjs`, Wiederherstellungsprobe-Anleitung (T7) | F | Wiederherstellungsprobe in `hydrovisor-dev` mit Zählvergleich [G] (M0); Prüftor-Ausnahme `backup_lesen` [SQL] | bedingt | 0.5 | 75 | 30.11. |
| | **Summe I0** | | | | **8.5** | **615** | |

**Prüfpunkt 30.11. (13.5).** Bis dahin geplant zusammengeführt: alle I0-Pakete und DS-01, zusammen 9.25 PT (Bedingung «I0 zu zwei Dritteln»: mindestens 5.5 PT). Durchsatz gemessen als zusammengeführte PT netto im Fenster 14.11. bis 30.11. (17 Tage = 2.43 Wochen), hochgerechnet auf eine Woche: geplant 9.25 / 2.43 = 3.8 PT je Woche (Bedingung mindestens 3.6). Die Reserve liegt deshalb erst nach dem Prüfpunkt (1. bis 6.12.); fällt ein Paket bis 30.11. aus, verfehlt schon ein Verzug von rund 0.5 PT die Bedingung (RR13 in `risiken.md`). Gerätetest T5 (14. bis 15.11.) ist Tims Handgriff ohne Paket; seine Ergebnisse setzen u_EC, u_pH, den Honor-Viewport und den Entscheid zur Warteschlange (Q14).

## Design System (vor I0-07 und damit vor I1a)

| ID | Paket | Kl. | Lieferobjekt | Mig. | PT | Min. | Termin |
|---|---|---|---|---|---|---|---|
| DS-01 | **Design System ergänzen** (vor I0-07, weil die einfache Messung schon eine Regal-Maske ist) (Konzept 10, Entscheid R11, `design-system/` im Repository ist die Quelle) | R | `tokens.json` mit Dichte «regal» (`data-density="regal"`, `size-touch-regal` 68 dp) und daraus per Skript `tokens.css` (`npm run tokens`); Bausteine `NumPad.md` (Tastenraster nach Entscheid R3: rechts von oben «leeren», «−0.1», «+0.1», Rücktaste; Prellfilter 80 ms), `Tile.md` (mindestens 72 × 80 dp, Kennung 28 sp), `Checklist.md` (Abhakliste 0 bis 17, Haken in fester Reihenfolge), `LabelSheet.md` (A4, 3 × 7 Felder 70 × 42.3 mm, Startfeld, Versatz X/Y), `Notfallblatt.md` (Stand je Gefäss, Vertretungsblatt); `Label.md` nachgeführt (42.3 mm, 4 mm Innenabstand, QR 30 mm mit Ruhezone, Kennung auf 32 mm Breite, Adresse `https://hydrovisor.github.io/`); `StatusBadge.md` mit «unsicher» nach R10.3 (W11); `bundle.css` ergänzt; Abnahme mit einer Musterseite aller Bausteine in beiden Themen [E2E: Tasten 68 dp, Löcher und Kacheln Mindestmasse] | nein | 0.75 | 45 | 22.11. |

## I1a Anlage, Gefässe, Etiketten, Prüfung, Säen (7.12. bis 18.12.)

| ID | Paket | Kl. | AK und Testfälle | Mig. | PT | Min. | Termin |
|---|---|---|---|---|---|---|---|
| I1a-01 | UC0 Einrichtung mit Checkliste (neun Punkte), Thema «Hell» | R | UC0-AK1, UC0-AK6 [E2E] | nein | 0.5 | 45 | 8.12. |
| I1a-03 | UC2 Vorlagen Box und Deckel mit Deckelgrafik und Lochnummern; **Vergleichspaket Agent Teams** (12.7 b) | F | UC2-AK1, AK2 [Unit]; UC2-AK3 [E2E]; UC2-AK5 [SQL]; UC2-AK4 [G] | nein | 0.75 | 45 | 9.12. |
| I1a-02 | UC1 Anlage, Bereiche, Übersicht als Regalbild (Ebene 4 in drei Gruppen), Maske «Gefäss» mit Verlauf als Zahlenreihe | R | UC1-AK1, AK2, AK4, AK5 [E2E]; UC1-AK6 [Unit]; UC1-AK3 [G] | nein | 1.25 | 45 | 10.12. |
| I1a-04 | UC3 Assistent «Gefäss erfassen» (schreibt `gefaess_erfasst`), Ändern, Entfernen, Prüfablauf Schritte 1 bis 4, Füllzustand | F | UC3-AK1, AK5, AK8 [E2E]; UC3-AK2, AK3, AK4, AK6, AK9 [Unit] | nein | 1.5 | 45 | 12.12. |
| I1a-05 | UC14 Etiketten: QR, Druckansicht 3 × 7 mit Startfeld und Versatz, Auflösung `#/e/<code>`, `etikett_aufruf` | F | UC14-AK1 [Unit]; UC14-AK2, AK3 [E2E]; Inbetriebnahme-AK2 [SQL] gegen S1; UC14-AK4 bis AK7, Inbetriebnahme-AK1 [G] | nein | 1.0 | 45 | 15.12. |
| I1a-06 | Einfaches Säen mit Kapazitätsanzeige (Sorte, Kulturform, Anzuchtbox nach Keimart, Saatmenge R12, Zieltopf wahlweise, Stationsgrenze) | F | UC5-AK1 [E2E]; UC5-AK5, AK9, AK15, Anzucht-AK2 [Unit]; UC5-AK6 [SQL] | nein | 1.25 | 45 | 16.12. |
| I1a-07 | Keimung prüfen (Eingabe je Schwamm, keimt nicht, Wiederherstellen, Keimrate); **Vergleichspaket Subagents** (12.7 b) | F | UC6-AK2, AK10 [Unit]; UC6-AK9 [E2E] | nein | 0.75 | 45 | 17.12. |
| I1a-08 | «Satz duplizieren» mit Freiprüfung der Zieltöpfe | F | UC5-AK16 [Unit] | nein | 0.5 | 45 | 18.12. |
| | **Summe I1a** | | | | **7.5** | **360** | |

## I1b Messen, Düngen, Erinnern (19.12. bis 31.12.)

| ID | Paket | Kl. | AK und Testfälle | Mig. | PT | Min. | Termin |
|---|---|---|---|---|---|---|---|
| I1b-01 | UC9 Messmaske mit Ziffernblock (NumPad), Ergebniszone, Bewertung in Hundertsteln, Trendzeile, «veraltet», Sprung-Rückfrage | F | UC9-AK1 [E2E]; UC9-AK3, AK4, AK5, AK10, AK11, AK12 [Unit]; UC9-AK1 (130 %), AK9, AK13 [G] | nein | 1.5 | 45 | 21.12. |
| I1b-02 | **Aufgaben-Rechnung** (`faelligeAufgaben()` in `src/domain/`, Auslöser-Tabelle R5.2, Morgen, Überspringen, Pegel ok, Füllzustand); Mutation 80 % | K | UC8-AK1 bis AK6, AK10, AK12, AK13, UC3-AK7 [Unit]; TZ9 | nein | 1.75 | 75 | 22.12. |
| I1b-03 | UC7 Rechner: Neuansatz, Teil-Dosis, Restdosis, Nachfüllen, Stationen mit fester Dosis, Direktsaat-Ansätze, Teilwechsel, k-Vorschlag; Referenzdatei; Mutation 80 % | F | UC7-AK1 bis AK15, Loesungswechsel-AK6 [Unit]; RF1 bis RF12; Referenzdatei ±0.5 ml | nein | 2.0 | 45 | 24.12. |
| I1b-04 | Abhakliste Lösungswechsel (Zeilen 0 bis 17, Timer, Wake Lock, Fortsetzen), pH-Korrektur mit Nachmessen | F | Loesungswechsel-AK1, AK4 [Unit]; Loesungswechsel-AK3, AK5, Rundgang-AK3 [E2E]; UC9-AK7 [Unit]; Loesungswechsel-AK2 [G] | nein | 1.0 | 45 | 27.12. |
| I1b-05 | UC8 Heute und Rundgang mit Kurzprüfung, Abschlussliste, Luftpumpe mitmarkieren, «Nach Stromausfall» | F | Rundgang-AK1a, AK1b, AK1c [E2E]; Rundgang-AK2, AK4, AK5 [Unit]; UC8-AK9 [G] | nein | 1.25 | 45 | 29.12. |
| I1b-06 | Sammel-Push und Timer-Push produktiv (Tagesliste, Titel nach Gewicht, Kurzprüfung 20:00, E-Mail-Rückfall, Timer jede Minute) | F | UC8-AK7 [SQL]; UC8-AK11 (TP3) [Unit, Deno test]; TP5 bis TP7; UC8-AK8 EK5 [G] | ja | 0.75 | 75 | 30.12. |
| I1b-07 | Einstellungen (Push-Zeit, Test-Push, Kanne, Messmittel, k, Messgerät, Thema, Pflegebudget, Ruhe, Telefon nur in der Datenbank), Notfall- und Vertretungsblatt, Anleitung «Gerät neu» | R | UC0-AK3, AK4 [Unit]; UC0-AK8 [G] | nein | 0.75 | 45 | 31.12. |
| I1b-08 | Folgepaket #113: R5.6 Verteilung der Ansätze (`vorziehbar`, Vorziehen auf Vortage, «4 Ansätze heute»), Zeile «Offene Aufgaben» in der Maske Gefäss, «Morgen» im Kopf «Messgerät», Rundgang «Jetzt korrigieren» direkt ins Angebot «pH-Minus gegeben» | F | R5.6 und UC8 laut Plan 113 [Unit, E2E] | nein | 0.5 | 30 | 31.12. |
| I1b-09 | Folgepaket #118: Push liest die nach R5.6 verteilte Liste (`verteilteAufgaben()`), Hinweis in den Push-Zeilen, `v_termintreue` je Schlüssel einmal, `v_push_zustellung.vor_faelligkeitstag` | F | UC8-AK10 [Unit, Deno test]; R5.6-AK8, AK10 [Unit]; R5.6-AK9, AK11 [SQL] | ja | 0.25 | 0 | 31.12. |
| | **Summe I1b** | | | | **9.0** | **375** | |

I1b-08 entstand am 7.11.2026 als Folgepaket aus Plan 30 und PR #111 (Issue #113). Es steht nicht in der Summe und in den Summen unten, weil der Paketplan seit dem 13.11. als Vergleichsbasis gilt (A); es zählt als Mehraufwand gegenüber dem Plan. Dasselbe gilt für I1b-09 (Issue #118, Übergabe aus Plan 113 Nachtrag 13).

M1 31.12.; Regalfreigabe 7.1.; M1 am Regal bestätigt 7.1. und 14.1. Die Nachholwoche 1. bis 7.1. arbeitet die `offen-regal`-AK ab (höchstens 20 offen).

## I2 Sorten, Pflanzen, Phasen (8.1. bis 31.1.)

| ID | Paket | Kl. | AK und Testfälle | Mig. | PT | Min. | Termin |
|---|---|---|---|---|---|---|---|
| I2-01 | «Umsetzen einfach»: Wie geplant umsetzen, Zieltopf wählen, Verschieben, Tausch, Station verlassen | F | UC5-AK3, AK7, UC6-AK3, AK8, Anzucht-AK1 [E2E]; UC5-AK4, UC6-AK4 [Unit] | nein | 1.5 | 45 | 19.1. |
| I2-02 | «Ansatz für Umsetzen»: zählende Pflanzungen nach R2.2, Stadium «1. echte Blätter», Wechsel am Umsetztag | F | Konzept R2.2-AK (2.3: 3 Salate, 3 reservierte → EC 1.3 grün) [Unit]; R2.3, R4.3 [Unit] | nein | 1.25 | 45 | 19.1. |
| I2-03 | «Phasen nachführen und Phasenfragen»: Termine R1.5, gebündelte Karte je Ort, Art und Saatdatum, Ausnahme je Satz, Karte «Phasen nachführen» | F | UC6-AK1, AK7 [Unit]; UC6-AK6 [E2E]; TZ5 bis TZ8 | nein | 1.75 | 45 | 26.1. |
| I2-04 | **Passungs-Empfehlung** (R3, Gründe-Codes P1 bis P11, Einstufung beim Setzen); Mutation 80 % für `zielbereich` | K | UC5-AK2, AK8, AK10, AK11, AK14 [Unit]; UC5-AK13 [E2E] | nein | 2.5 | 75 | 31.1. |
| I2-05 | UC4 Saatgut erfassen mit KI und den 22 Tüten (Maske Sorten, Tütenwerte, Katalogmerkmale, Saatempfehlung, Packung, neue Art) | F | UC4-AK4 [SQL]; UC4-AK6 [E2E]; UC4-AK3 [Eval] 22 Tüten, 80 % | nein | 2.0 | 45 | 31.1. |
| I2-06 | UC6 Rest: Pflanzenansicht, Ernte, Schossen, Kultur beenden oder verlängern, Abschluss mit Grund, Wiederherstellen | F | UC6-AK5 [Unit] | nein | 1.25 | 45 | 31.1. |
| I2-07 | Offline-Warteschlange, **nur wenn der Gerätetest schwaches WLAN zeigt** (Q14); sonst Pool | F | TO1, TO3, TO4, TO5 [E2E] | nein | 1.0 | 45 | 31.1. |
| I2-08 | UC12 Phasenwissen (Soll, nach Zeit; Inhalte schreibt Tim) | R | UC12-AK1, AK4 [SQL]; UC12-AK2, AK3 [E2E] | nein | 0.5 | 45 | 31.1. |
| | **Summe I2** | | | | **11.75** | **390** | |

M2 und Umfang-Freeze 31.1.

## Summen und Vergleich mit Konzept 13.4

| Block | PT netto | mit 25 % Zuschlag | Tims Minuten (Pakete) | Konzept 13.4 (A) |
|---|---|---|---|---|
| I0 | 8.5 | 10.6 | 615 | rund 8 |
| DS-01 | 0.75 | 0.9 | 45 | – |
| I1a und I1b | 16.5 | 20.6 | 735 | rund 16 |
| I2 | 11.75 | 14.7 | 390 | rund 14 |
| **Kern gesamt** | **37.5** | **46.9** | **1 785 (29.75 h)** | **rund 38 (47.5)** |

I2 liegt rund 2 PT unter der Konzept-Verteilung, weil das Datenmodell aus I0 alle Tabellen und Sichten liefert und I2-07 bedingt ist.

**Tims Stunden.** Die Minuten je Paket sind die Richtwerte aus 13.3 für Plan, Abnahme und Merge-Bestätigung (45 bzw. 75) und dienen dem Vergleich je Paket (12.7). Sie decken nicht alles, was 13.3 unter «Pakete» budgetiert: Rückfragen und Prüferentscheide, [Gerät]-AK am Gerät, Secrets und Konten (VAPID, Resend, Umgebung `backup`, Repository-Variablen), Eval-Läufe, Statuskommentare lesen. Deshalb liegen 11 h für I0 und DS-01 (November 14 h), 12.25 h für I1 (Dezember 34 h) und 6.5 h für I2 (Januar 24 h) unter dem Budget. **Massstab für den Prüfpunkt (115 %, 13.5) und M0 (110 %) bleibt die Tabelle in Konzept 13.3**; eingefroren werden am 13.11. beide, die Minuten je Paket als Paketplan und die Monatsstunden aus 13.3 als Budget.

## I3 Prüflauf und Pool

- **Einfrieren 1.4.2027:** C4-AK2 [Gerät] (CSV der Auswertungssichten in Excel geöffnet) prüft Tim beim Einfrieren der Auswertung; eigener Posten ohne Paket, weil kein Paket bis dahin offen bleibt.
- **I3 Prüflauf (1.2. bis 31.3.):** Verbesserungspakete aus den PDSA-Zyklen P2 bis P4, in P5 nur Fehlerbehebungen; höchstens 4 PT, höchstens 0.5 PT je Paket, Klasse R oder F; keine Migration nach dem 1.3. ausser `create or replace view` bis 17.3. (Konzept 13.4, 14.6). Pakete entstehen als Issues aus den Zyklusnotizen.
- **Pool (2.0 PT, gedeckelt, Tauschregel):** Wechselblock mit bis zu 3 Abhaklisten (0.5), Passung «Sorte → Gefässe» und «Passt hierhin» (0.5, K mit Planfreigabe), Warteschlange bei gutem WLAN (0.5; bei schwachem WLAN I2-07), eigene wiederkehrende Aufgaben (0.5). **Entscheid 0014 (7.11.2026):** Wechselblock (#139) vor M2 im Tausch gegen I2-07, falls das WLAN am Regal gut ist; die übrigen Posten nach M2.

## Reihenfolge, Abhängigkeiten, Parallelität

- I0-03 vor allen Paketen mit Datenbank; I0-04 vor jeder Erfassung in der App; I0-01 vor allem Code; DS-01 vor I0-07 und I1a; I1b-02 vor I1b-05 und I1b-06; I1b-03 vor I1b-04 und I2-02; I1a-06 vor I2-01 und I2-04.
- Migrationen nie parallel (`db-lock`): I0-03, dann I0-08, dann gegebenenfalls I0-11, dann I1b-06.
- Parallel höchstens 2 Routine-Pakete ohne Migration in eigenen Worktrees (Konzept 12.1), z. B. I0-06 und DS-01 neben dem laufenden Hauptpaket; nie neben einem Paket mit Migration in derselben Datenbank.
- Kern-Pakete, solange höchstens 95 % des Wochenkontingents verbraucht sind (Entscheid 0011); höchstens 4 Fable-Pläne (I0-03, I0-04, I1b-02, I2-04) plus Eskalationen.

## Vergleiche für die Projektarbeit (Konzept 12.7)

- **(a) Fable gegen Opus:** Für I0-03 und I0-04 schreiben `planer_kern` (Fable 5.1) und `planer` (Opus 5.5) je einen Plan in neutral benannte Dateien `docs/plaene/<issue>-plan-a.md` und `-plan-b.md`; der Lead lost die Zuordnung aus und hält sie bis nach Tims verdeckter Bewertung mit der Rubrik nur in einem Issue-Kommentar «Zuordnung (erst nach der Bewertung öffnen)». Danach wird der gewählte Plan als `docs/plaene/<issue>.md` freigegeben.
- **(b) Agent Teams gegen Subagents:** I1a-03 (Teams) und I1a-07 (Subagents), beide Fachlogik mit 0.75 PT.

## Issues

Die Issues entstehen erst nach Tims OK zu diesem Plan, je Zeile ein Issue mit der Vorlage «Arbeitspaket» (Titel `<ID> <Kurztitel>`, AK-Liste aus der Tabelle, Labels nach Klasse). Die Issue-Nummer ersetzt danach die ID im Zweignamen (`paket/<issue>-<kurz>`).
