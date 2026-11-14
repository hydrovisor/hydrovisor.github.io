# Beilagen für Auftrag 1 (Stand 31.10.2026)

Der Agent liest nur, was im Repository liegt (Konzept Kapitel 16). Fakten stehen nur in diesen Dateien. Bei Widerspruch gilt die Rangfolge der Geltungsregel (Konzept Zeile 5): (1) Konzept v1.1, (2) Use Cases Fassung 4, (3) Düngeplan TriPart V1.6, (4) Vorgehen Wissensbasis W0 mit der Datenvorlage aus Kapitel 9. Was unten unter «Bekannte Abweichungen» steht, ist bereits entschieden: Es gilt das Konzept; diese Punkte sind keine Rückfragen.

## Dateien und Herkunft

| Datei | Quelle | Stand der Quelle | Übernahme |
|---|---|---|---|
| `konzept_v1.7.md` | «Hydrovisor – Definitives Fachkonzept v1.0.md», im Repository zu v1.1 bis v1.7 fortgeschrieben | Kopf 29.10.2026, Errata E1 bis E5 bis 31.10.2026; v1.1 mit Erratum E6 und v1.2 mit Erratum E7 vom 1.11.2026; v1.3 mit Erratum E8 vom 4.11.2026; v1.4 mit Erratum E9 vom 5.11.2026; v1.5 mit Erratum E10 vom 6.11.2026; v1.6 mit Erratum E11 vom 11.11.2026 (Usability U1 bis U4, Befragung im Chat, Entscheid 0016); v1.7 mit Errata E12 bis E15 vom 14.11.2026 (von Tim am 14.11.2026 bestätigt: Saatgut, Säen, Deckelwahl, Navigation, Anlagen, Produktions-Migration durch den Lead, Planfreigabe im Chat, Demo und W0-Ausnahme, keine Karbonathärte) | v1.0 1:1 bis auf die Anonymisierung (siehe unten); v1.1 mit Tims Entscheiden vom 1.11.2026 in Text und Anhang B.2, Zeilennummern wie v1.0; v1.0 liegt im Git-Verlauf |
| `use_cases_f4.md` | aus Fassung 3 (Google Doc, 23.10.2026, Nachträge bis 28.10.2026) auf Konzept v1.0 nachgeführt | 31.10.2026 | von einem Agenten nachgeführt und unabhängig geprüft; jede Änderung mit Beleg im Konzept (Tabelle «Änderungen gegenüber Fassung 3»). **10 offene Entscheide** sind im Text als «Entscheid Tim offen» (E-F4-1 bis E-F4-10) markiert |
| `use_cases_f4_bericht.md` | Bericht zur Nachführung | 31.10.2026 | Umfang der Änderungen, Status der Prüfbefunde, Unsicherheiten im Konzept selbst (mit Zeilen), Liste der Entscheide E-F4-1 bis E-F4-10. Verweist auf Fassung 3; diese liegt nur noch im Git-Verlauf (Commit 9e6cecc) |
| `duengeplan_v1.6.md` | «Düngeplan TriPart V1.6.md» | 29.10.2026 | 1:1 bis auf die Anonymisierung (siehe unten) |
| `w0_vorgehen.md` | Google Doc «Hydrovisor – Vorgehen Wissensbasis W0» | 27.10.2026 | 1:1 als Markdown exportiert |
| `w0_datenvorlage.csv` | abgeleitet aus Konzept Kapitel 9.2 | 31.10.2026 | Entwurf, **nur die profilwert-Kandidatenzeile** (eine Zeile je Grösse, inkl. `text_wert`) mit zwei Beispielzeilen **ohne Werte**; die Vorlagen für Artmerkmale, Kulturform, Saatempfehlung, Kulturgruppe/Standard und Quelle (9.2) fehlen noch und entstehen mit Schritt 1 in 9.5. Die Schreibweise `art_id` (wissenschaftlich, wie `solanum_lycopersicum` in 8.2) ist ein Vorschlag |
| `TriPart_hydro_coco.csv` | Düngeplan V1.6 Abschnitt 2 | 29.10.2026 | Zahlen 1:1; `zeile_id` ergänzt; Herkunft «abgeleitet» bei «Reife» (R4.3), sonst «hersteller»; EC-Basis «unbekannt» (5.6) |
| `../../data/stammdaten/sorten.csv` | Konzept 5.5; Bestellung bei Botanik Sämereien AG (saemereien.ch) vom 17.10.2026 | 31.10.2026 | Spalten der Tabelle sorte (8.2, 9.2) plus `zeile_id`: 22 Sorten mit Name, Art (deutscher Name; Zuordnung zu `art_id` in W0), Kulturtyp (abgeleitet aus der Kulturform in 5.5; Mangold und Randen offen), Shop-Link (21 von 22, je an Artikelnummer und Produkttitel geprüft; Schnittlauch Twiggy wird vom Shop nicht mehr geführt) und Kaufdatum. **Bewusst leer** (Entscheid Tim 31.10.2026): Keimart und Keimtemperatur laut Tüte, Wuchshöhe, Wuchsform, Frühzeitigkeit, Keimfähigkeit und Bestand; Angaben auf Tüten und Shopseiten beziehen sich meist auf Erde, nicht auf Hydroponik. Sie kommen aus W0 mit Hydroponik-Quellen oder werden im Testbetrieb erfasst |
| `sorten_notizen.csv` | Konzept 5.5, Errata E2 und E3, 3D-Modell V12.10, Bestellung 17.10.2026 | 31.10.2026 | **Arbeitshilfe, wird nicht geladen:** botanischer Name und Artikelnummer laut Shop, Anzahl Packungen, erste Runde (18 ja, Balconi Yellow Reserve, 3 nein), Gefäss der ersten Runde (mit dem 3D-Modell V12.10 abgeglichen), Hinweise. Die Belegung gehört nach 8.2 zu Satz und Reservierung, nicht zur Sorte |
| `../../design-system/` | Artefakt «Hydrovisor – CI» | 23.10.2026 | Export, siehe `design-system/README.md`; `fonts/OFL.txt` ist die Lizenz der Schrift Manrope (SIL OFL 1.1) |

## Anonymisierung (öffentliches Repository)

In `konzept_v1.7.md` und `duengeplan_v1.6.md` sind Nachname, Wohngemeinde und Name des Wasserversorgers ersetzt («Tim», «am Wohnort», «Wasserversorger»); sonst sind beide Dateien unverändert. Die Wasserwerte (Calcium, Magnesium, Härte) bleiben, weil der Düngerrechner sie braucht. Die Originale liegen bei Tim.

## Bewusst nicht übernommen

| Unterlage | Grund |
|---|---|
| Konzept v0.2 und v0.3, Kapiteldateien `00_Kopf.md` bis `18_Quellen_Glossar.md`, `A1`, `A2` | durch Konzept v1.0 ersetzt; die Kapiteldateien sind Teile von v1.0 und dort vollständig enthalten |
| Use Cases Fassung 1, 2 und 3 | durch Fassung 4 ersetzt; Fassung 3 bleibt im Git-Verlauf |
| Düngeplan TriPart (ohne Version) und V1.5 | durch V1.6 ersetzt |
| Recherche Saatgut- und Hydroponikdaten (18.10.2026), Ordner «wissenschaftliche Artikel» | Vorarbeiten auf Stand Konzept v0.2; die verwendeten Quellen stehen in Konzept Kapitel 18 und werden in W0 je Wert neu belegt |
| Lösungsvorschlag Phasenmodell, Vorschlag Anlagen und QR-Etiketten, Marktvergleich, Projektteam, Projektmemory, Übergabe-Entwürfe, Archiv (u. a. Dispositiv) | Vorarbeiten; ihre Entscheide stehen im Konzept v1.0 (Anhang A und B) |
| Prüfberichte v0.3 (Durchgang 1 und 2, Einzelbefunde), Unterlage Erstbesprechung 31.10., Entwurf Zeitplan Z3 | im Konzept v1.0 entschieden (Anhang A); Z3 als Erratum E5 |
| Prüfbericht Agenten-Setup (27.10.2026) | Vorarbeit für Kapitel 12 |
| Hardware: Artefakt «Hardware 3D-Modell» V12.10, Aufbauplan, Einkaufsliste | verbindlich übertragen in Konzept Kapitel 5 (Erratum E2) |
| Visualisierungen, Filme, Hologramm, Grafiken, «Belege CI» | keine Fachinhalte; Logos und App-Icons folgen mit dem Manifest-Paket aus dem Artefakt «Hydrovisor – CI», nicht aus «Belege CI» (ältere Dateien) |

## Bekannte Abweichungen (entschieden: es gilt das Konzept v1.1)

### 1 Use Cases Fassung 4 (`use_cases_f4.md`)

Fassung 4 ist auf Konzept v1.0 nachgeführt; ihre Geltungsregel entspricht der Rangfolge oben. Wo das Konzept selbst offen oder widersprüchlich ist, steht «Entscheid Tim offen» mit einer Nummer E-F4-1 bis E-F4-10 (Liste im Bericht, Abschnitt «Entscheide für Tim»). Diese Punkte sind entschieden: E-F4-1, E-F4-2 und E-F4-8 am 31.10.2026, die übrigen am 1.11.2026 nach `docs/spec/00_rueckfragen.md`. Werte mit (A) sind Annahmen aus Fassung 3 ohne Beleg im Konzept.

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
- **Entschieden 1.11.2026:** Die Referenzdatei des Düngerrechners nimmt 17 Zeilen aus Düngeplan V1.6, Abschnitt 4 auf (ohne 4.1 und 4.3, 4.2 als Station 4.1), je mit Tims Zielbereich (Konzept v1.1, R4.12).

### 4 Design System (`design-system/`)

- Etikett: Design System 70 × 42 mm, 3 mm Innenrand, Kennung fest 20 mm, Beispiel-Kennung «A», `bundle.css` mit 42 mm und `padding-top: 1.5mm`, Adresse `<konto>.github.io/hydrovisor/`, Gerätetest «im Dezember» (`components/Label.md`). Konzept 10: 70 × 42.3 mm, 4 mm Innenabstand, Kennung rechts auf 32 mm Breite mit berechneter Schriftgrösse, Kennungen A1 bis A4, Adresse `https://hydrovisor.github.io/`, Gerätetest November. Das Etikett 55 × 25 mm für die Anzuchtboxen (5.4) fehlt im Design System.
- Messanzeige: `components/Gauge.md` nennt eine eigene Toleranz («ein Viertel des Sollbereichs») und die Funktion `Hydrovisor.gaugeStatus()`. **Bewertet wird nur nach R10** (Hundertstel, Knapp-Zone nach R10.1 und R10.2); `tolerance` und `gaugeStatus` nicht verwenden. `bundle.js` ist nicht exportiert.
- Die Ergänzungen aus Konzept 10 (Dichte «regal», LabelSheet 42.3 mm, Notfallblatt, NumPad, Checklist, Tile) sind im Design System noch offen (vor I1a).

### 5 Weiteres

- Links auf Google Docs, Drive und claude.ai in den Beilagen sind privat und für den Agenten nicht erreichbar; massgebend ist nur der Inhalt im Repository.
