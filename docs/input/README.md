# Beilagen für Auftrag 1 (Stand 31.10.2026)

Der Agent liest nur, was im Repository liegt (Konzept Kapitel 16). Fakten stehen nur in diesen Dateien. Bei Widerspruch gilt die Rangfolge der Geltungsregel (Konzept Zeile 5): (1) Konzept v1.0, (2) Use Cases (Fassung 4, bis dahin Fassung 3), (3) Düngeplan TriPart V1.6, (4) Vorgehen Wissensbasis W0 mit der Datenvorlage aus Kapitel 9. Was unten unter «Bekannte Abweichungen» steht, ist bereits entschieden: Es gilt das Konzept; diese Punkte sind keine Rückfragen.

## Dateien und Herkunft

| Datei | Quelle | Stand der Quelle | Übernahme |
|---|---|---|---|
| `konzept_v1.0.md` | «Hydrovisor – Definitives Fachkonzept v1.0.md» | Kopf 29.10.2026, Errata E1 bis E5 bis 31.10.2026 | 1:1 bis auf die Anonymisierung (siehe unten) |
| `use_cases_f3.md` | Google Doc «Hydrovisor – Vorschläge Use Cases, Fassung 3» | 23.10.2026, Nachträge bis 28.10.2026 | 1:1 als Markdown exportiert |
| `duengeplan_v1.6.md` | «Düngeplan TriPart V1.6.md» | 29.10.2026 | 1:1 bis auf die Anonymisierung (siehe unten) |
| `w0_vorgehen.md` | Google Doc «Hydrovisor – Vorgehen Wissensbasis W0» | 27.10.2026 | 1:1 als Markdown exportiert |
| `w0_datenvorlage.csv` | abgeleitet aus Konzept Kapitel 9.2 | 31.10.2026 | Entwurf, **nur die profilwert-Kandidatenzeile** (eine Zeile je Grösse, inkl. `text_wert`) mit zwei Beispielzeilen **ohne Werte**; die Vorlagen für Artmerkmale, Kulturform, Saatempfehlung, Kulturgruppe/Standard und Quelle (9.2) fehlen noch und entstehen mit Schritt 1 in 9.5. Die Schreibweise `art_id` (wissenschaftlich, wie `solanum_lycopersicum` in 8.2) ist ein Vorschlag |
| `TriPart_hydro_coco.csv` | Düngeplan V1.6 Abschnitt 2 | 29.10.2026 | Zahlen 1:1; `zeile_id` ergänzt; Herkunft «abgeleitet» bei «Reife» (R4.3), sonst «hersteller»; EC-Basis «unbekannt» (5.6) |
| `../../data/stammdaten/sorten.csv` | Konzept 5.5 | 31.10.2026 | Entwurf, nur Spalten der Tabelle sorte (8.2, 9.2) plus `zeile_id`: 22 Sorten mit Name, Art (deutscher Name; die Zuordnung zu `art_id` erfolgt in W0) und Kulturtyp (abgeleitet aus der Kulturform in 5.5; Mangold und Randen offen). Tüten- und Katalogwerte leer, von Tim bis 15.11. (13.1) |
| `sorten_notizen.csv` | Konzept 5.5, Errata E2 und E3 | 31.10.2026 | **Arbeitshilfe, wird nicht geladen:** erste Runde (18 ja, Balconi Yellow Reserve, 3 nein), Gefäss der ersten Runde, Hinweise. Die Belegung gehört nach 8.2 zu Satz und Reservierung, nicht zur Sorte |
| `../../design-system/` | Artefakt «Hydrovisor – CI» | 23.10.2026 | Export, siehe `design-system/README.md`; `fonts/OFL.txt` ist die Lizenz der Schrift Manrope (SIL OFL 1.1) |

## Anonymisierung (öffentliches Repository)

In `konzept_v1.0.md` und `duengeplan_v1.6.md` sind Nachname, Wohngemeinde und Name des Wasserversorgers ersetzt («Tim», «am Wohnort», «Wasserversorger»); sonst sind beide Dateien unverändert. Die Wasserwerte (Calcium, Magnesium, Härte) bleiben, weil der Düngerrechner sie braucht. Die Originale liegen bei Tim.

## Bewusst nicht übernommen

| Unterlage | Grund |
|---|---|
| Konzept v0.2 und v0.3, Kapiteldateien `00_Kopf.md` bis `18_Quellen_Glossar.md`, `A1`, `A2` | durch Konzept v1.0 ersetzt; die Kapiteldateien sind Teile von v1.0 und dort vollständig enthalten |
| Use Cases Fassung 1 und 2 | durch Fassung 3 ersetzt |
| Düngeplan TriPart (ohne Version) und V1.5 | durch V1.6 ersetzt |
| Recherche Saatgut- und Hydroponikdaten (18.10.2026), Ordner «wissenschaftliche Artikel» | Vorarbeiten auf Stand Konzept v0.2; die verwendeten Quellen stehen in Konzept Kapitel 18 und werden in W0 je Wert neu belegt |
| Lösungsvorschlag Phasenmodell, Vorschlag Anlagen und QR-Etiketten, Marktvergleich, Projektteam, Projektmemory, Übergabe-Entwürfe, Archiv (u. a. Dispositiv) | Vorarbeiten; ihre Entscheide stehen im Konzept v1.0 (Anhang A und B) |
| Prüfberichte v0.3 (Durchgang 1 und 2, Einzelbefunde), Unterlage Erstbesprechung 31.10., Entwurf Zeitplan Z3 | im Konzept v1.0 entschieden (Anhang A); Z3 als Erratum E5 |
| Prüfbericht Agenten-Setup (27.10.2026) | Vorarbeit für Kapitel 12 |
| Hardware: Artefakt «Hardware 3D-Modell» V12.10, Aufbauplan, Einkaufsliste | verbindlich übertragen in Konzept Kapitel 5 (Erratum E2) |
| Visualisierungen, Filme, Hologramm, Grafiken, «Belege CI» | keine Fachinhalte; Logos und App-Icons folgen mit dem Manifest-Paket aus dem Artefakt «Hydrovisor – CI», nicht aus «Belege CI» (ältere Dateien) |

## Bekannte Abweichungen (entschieden: es gilt das Konzept v1.0)

### 1 Use Cases Fassung 3 (`use_cases_f3.md`)

Fassung 4 fehlt; nach Kapitel 17 gilt Fassung 3 mit dem Konzept als Rangfolge 1. Fassung 3 beruht auf Konzept v0.3.

- Ihre eigene Geltungsregel «Bei Widerspruch gilt das Konzept v0.3» (Zeile 5 und Nachtrag Zeile 559) ist **aufgehoben**; es gilt die Rangfolge oben.
- Zahlen in Akzeptanzkriterien aus Fassung 3 gelten nur, wenn das Konzept nicht widerspricht. Bekannt sind:
  - UC0 «Einrichtung und Einstellungen» fehlt; UC10, UC11 und UC13 sind beschrieben, entfallen aber in Etappe A (Konzept 6).
  - «11 Gefässe» und «3 Anzuchtorte» (Zeilen 158, 172, 329, 332, 565): Konzept 13 Gefässe, Stationen 4.1 bis 4.5, Anzuchtboxen A1 bis A4 (5.3, Erratum E2).
  - Anzuchtbox A und B, Zusatzbox R-Z, Jungpflanzenstation 4.2 mit Deckel D6 (Zeilen 190, 219): entfallen mit E2.
  - Teil-Dosis «zuerst 85 %», «zwei bis drei Ansätze» (Zeilen 23, 242, 248, 256): Konzept 75 % bis zum Becherversuch, danach 85 % bis k stabil; stabil = drei Ansätze (R4.7, 5.6).
  - Etikett 70 × 42 mm und 62-mm-Band (Zeilen 309, 315): Konzept 70 × 42.3 mm, Band gestrichen (UC14, Kapitel 10).
  - QR-Adresse `<konto>.github.io/hydrovisor/` (Zeile 313): Konzept `https://hydrovisor.github.io/` (E4).
  - «22 Tabellen» (Zeile 381): massgebend ist das Datenmodell in Konzept 8.
  - Gerätetest «im Dezember» (Zeilen 11, 100): Konzept 14. und 15.11. (13.1); Zeitplan Z2 statt Z3 (E5).

### 2 W0-Vorgehen (`w0_vorgehen.md`, 27.10.)

Gilt nur mit den Änderungen aus Konzept Kapitel 9.

- DLI als Sollwert ist mit Erratum E1 gestrichen (ebenso Luftfeuchte und Lufttemperatur). **Lichtstunden bleiben** (Grösse `licht_h`, 8.2, Validator 9.4); «Bezugs-DLI der Dauer» bleibt als Angabe aus der Quelle (9.2).
- EC: W0 verlangt Gesamt-EC in mS/cm und lässt den Methodenprüfer vereinheitlichen (Zeilen 28, 44, 84). Konzept: Rohwert mit Einheit und Basis speichern, der Methodenprüfer rechnet nicht um, das Seed-Skript rechnet Einheiten um, die Gesamt-EC entsteht erst zur Laufzeit (9.2, 9.3, 9.5).
- Evidenzklassen: Konzept unterscheidet B1 und B2; Klasse D erzeugt keine Zeile (9.1).
- «Schema bildet sie 1:1 ab» (Zeile 22): «1:1» entfällt (9.2).
- Mix je Gefäss (Zeile 65): Tim bestätigt den Mix der ersten Runde bis 20.12. anhand der Passungsmatrix; die Passungs-Empfehlung der App gilt ab den Folgesätzen (5.5, 9.6).
- Probelauf (Zeile 72): acht Arten nach 9.5, nicht Pourpre und Paprika.
- «Gepflanzt wird erst, wenn die App produktiv läuft» (Zeile 77): Aussaat bleibt am 7.1. unabhängig vom Softwarestand (13.1).

### 3 Düngeplan V1.6 (`duengeplan_v1.6.md`)

- Abschnitt 4 und 5 stehen auf dem Hardware-Stand vor Erratum E2: 4.1 «Basilikum + Pourpre, Kratky 7 l», 4.2 «Jungpflanzenstation Kratky 3 l» mit pH 5.5–6.0, 4.3 «Mangold + Randen» (Zeilen 66–68), «Anzuchtboxen A/B» (Zeile 77), «Kratky (Ebene 3 + 4)» (Zeile 82). Massgebend sind Konzept 5.3 bis 5.5 und R4 (Stationen 4.1 bis 4.5 mit Konstantpegel, pH-Band nach R4.14).
- Pflegerhythmus (Zeilen 85–87): massgebend sind 5.3 und 5.7 (u. a. Kratky belüftet ohne Wechsel).
- Messmittel (Zeile 42: Spritzen 5, 20, 60 ml): Konzept 1, 5, 20, 60 ml (5.6).
- EC-Basis der Herstellertabelle (Abschnitt 2 «Zuwachs über dem Ausgangswasser»): nach 5.6 nicht belegt; Hydrovisor rechnet mit gemessenem k. R4.5 verwendet für die Stationen trotzdem Bänder «Leitungswasser + 0.3 bis 0.6» und «+ 0.8 bis 1.2»; das ist eine Festlegung des Konzepts, kein Widerspruch zur CSV.
- **Offene Rückfrage für Auftrag 1:** R4.12 nimmt «die 19 Zeilen aus Düngeplan V1.6, Abschnitt 4» in die Referenzdatei des Düngerrechners auf; die Zeilen 4.1 bis 4.3 beschreiben die Hardware vor E2. Ob sie in die Referenzdatei gehören, entscheidet Tim.

### 4 Design System (`design-system/`)

- Etikett: Design System 70 × 42 mm, 3 mm Innenrand, Kennung fest 20 mm, Beispiel-Kennung «A», `bundle.css` mit 42 mm und `padding-top: 1.5mm`, Adresse `<konto>.github.io/hydrovisor/`, Gerätetest «im Dezember» (`components/Label.md`). Konzept 10: 70 × 42.3 mm, 4 mm Innenabstand, Kennung rechts auf 32 mm Breite mit berechneter Schriftgrösse, Kennungen A1 bis A4, Adresse `https://hydrovisor.github.io/`, Gerätetest November. Das Etikett 55 × 25 mm für die Anzuchtboxen (5.4) fehlt im Design System.
- Messanzeige: `components/Gauge.md` nennt eine eigene Toleranz («ein Viertel des Sollbereichs») und die Funktion `Hydrovisor.gaugeStatus()`. **Bewertet wird nur nach R10** (Hundertstel, Knapp-Zone nach R10.1 und R10.2); `tolerance` und `gaugeStatus` nicht verwenden. `bundle.js` ist nicht exportiert.
- Die Ergänzungen aus Konzept 10 (Dichte «regal», LabelSheet 42.3 mm, Notfallblatt, NumPad, Checklist, Tile) sind im Design System noch offen (vor I1a).

### 5 Weiteres

- Dateiname: Kapitel 16 nennt `use_cases_f4.md`; bis zur Nachführung liegt `use_cases_f3.md` vor.
- Links auf Google Docs, Drive und claude.ai in den Beilagen sind privat und für den Agenten nicht erreichbar; massgebend ist nur der Inhalt im Repository.
