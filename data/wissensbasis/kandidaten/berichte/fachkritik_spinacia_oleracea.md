# Fachkritik Spinat (`spinacia_oleracea`)

W0-Hauptlauf, Issue #188, 12.11.2026. Kulturgruppe `fuchsschwanz`, Spinat ist ihre Leitkultur. Kulturformen im Auftrag nach Entscheid 0018: `babyleaf;kopf;schnitt`, Vorgabe `babyleaf`; eine Form ohne belegte Quelle entfällt. Grundlage: alle Zeilen der Art mit `status = geprueft` oder `vorgeschlagen` in `data/wissensbasis/kandidaten/teile/fuchsschwanz/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv`) und die zugehörigen Zeilen in `quelle.csv`. Zeilen mit `status = entwurf` (MDPI-Studien ohne Zugang) und `verworfen` zählen nicht. Regeln: Konzept 9.1, 9.3, 9.4, R1.1; `03_import_w0.md` 4.4, 6, 7, 9.

Alle Spinat-Zeilen stehen auf `geprueft`; Zeilen mit `vorgeschlagen` gibt es für die Art nicht. Alle Quellen der Spinat-Kandidaten sind in `quelle.csv` geprüft. Die einzige wegen des Titels verworfene Quelle (`frankiesgarten-rote-bete-hydroponik`) betrifft nur Randen; im Vergleich mit der Kulturgruppe ist sie wie geprüft behandelt.

Zusammenfassung: 8 Konflikte (davon 3 «nur offener Wert»), 28 Plausibilitätsbefunde, 26 Lücken der Art (3 Pflichtgrössen, 10 Artmerkmale, 12 Kulturform-Felder, 1 Saatempfehlung), dazu der Befund V13 der Kulturgruppe (18 Pflichtzeilen fehlen, aus der Leitkultur heute 12 belegbar), 6 Bestätigungen.

Hinweis an den Koordinator: Konzept 9.3 nennt höchstens vier Konflikte je Runde; Spinat allein hat acht, davon zwei ohne Pflichtgrösse (K-spinat-06, K-spinat-07).

## 1 Konfliktliste

Konflikt-IDs sind in den Arbeitsdateien in der Spalte `konflikt_id` gesetzt, nur bei geprüften Kandidaten (verworfene Zeilen derselben `zeile_id` ohne ID). Kein Kandidat ist bevorzugt; die Reihenfolge folgt der Datei. «(offen: …)» steht für Zeilen aus `profilwert_offen.csv` bzw. `saatempfehlung_offen.csv` mit dem Grund aus Spalte `grund`.

Spalten «System» und «Umgebung»: bei `profilwert` aus `system_quelle` und `umgebung_quelle`; bei `saatempfehlung` gibt es diese Spalten nicht, dort steht `anbaumethode` der Quelle mit dem Substrat aus `substrat_passung`, die Umgebung nur, soweit die Fundstelle sie nennt.

### K-spinat-01 – Phase `keimung`, `keimart`

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.keimung.keimart#1 | dunkel | – | – | cornell-cea-spinat-2005 | B1 | keine | andere | 2005 |
| pw.spinacia_oleracea.keimung.keimart#2 | dunkel | – | – | frankiesgarten-keimtemperaturen | C | substrat_inert | andere | – |
| pw.spinacia_oleracea.keimung.keimart#3 | indifferent | – | – | risegardens-spinat-2026 | B2 | dwc | indoor_led | 2026 |

#1 und #2 stimmen überein (Bestätigung); zu #1 siehe P7.

### K-spinat-02 – Phase `keimung`, `dauer` – nur offener Wert

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.keimung.dauer#2 (offen: Bereich ohne typ) | 5 bis 10 | d | – | risegardens-spinat-2026 | B2 | dwc | indoor_led | 2026 |

Kein ladbarer Kandidat (`keimung.dauer#1` verworfen). Pflichtgrösse auf Ebene Art; betrifft die Vorabladung der Keimung (03_import_w0.md 8 Nr. 4) und die Mindestzeile der Kulturgruppe (Abschnitt 3.6).

### K-spinat-03 – Phase `keimung`, `keimtemp` – nur offene Werte, Wertkonflikt

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.keimung.keimtemp#1 (offen: Einzelwert) | typ 25 | °C | – | cornell-cea-spinat-2005 | B1 | keine | andere | 2005 |
| pw.spinacia_oleracea.keimung.keimtemp#2 (offen: Einzelwert) | typ 26 | °C | – | cornell-cea-spinat-2005 | B1 | keine | andere | 2005 |
| pw.spinacia_oleracea.keimung.keimtemp#3 (offen: Bereich ohne typ, typ nur in °F) | 7 bis 24 | °C | – | risegardens-spinat-2026 | B2 | dwc | indoor_led | 2026 |
| pw.spinacia_oleracea.keimung.keimtemp#4 (offen: Bereich ohne typ) | 15 bis 20 | °C | – | frankiesgarten-keimtemperaturen | C | substrat_inert | andere | – |

Kein ladbarer Kandidat; zusätzlich weichen die Werte voneinander ab, #1 und #2 auch innerhalb derselben Quelle (Summary gegen Kapitel 6).

### K-spinat-04 – Phase `wachstum`, `ph`

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.wachstum.ph#3 | 6.0 bis 7.0, typ 6.5 | pH | – | risegardens-spinat-2026 | B2 | dwc | indoor_led | 2026 |
| pw.spinacia_oleracea.wachstum.ph#4 (offen: Einzelwert) | 5.8 | pH | – | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |

`wachstum.ph#1` (okstate) und `#2` (medagrsci) sind verworfen und zählen nicht. 5.8 liegt ausserhalb des Bereichs von #3.

### K-spinat-05 – Phase `wachstum`, `ec` – nur offene Werte, Wertkonflikt

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.wachstum.ec#1 (offen: Einzelwert) | 1200 | µS/cm | unbekannt | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |
| pw.spinacia_oleracea.wachstum.ec#2 (offen: Einzelwert) | 1300 | µS/cm | unbekannt | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |
| pw.spinacia_oleracea.wachstum.ec#3 (offen: über Obergrenze 2.0) | 1.8 bis 2.3 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| pw.spinacia_oleracea.wachstum.ec#5 (offen: über Obergrenze 2.0) | 1.8 bis 2.3 | mS/cm | unbekannt | risegardens-spinat-2026 | B2 | dwc | indoor_led | 2026 |

Kein ladbarer Kandidat (`wachstum.ec#4` medagrsci verworfen). Pflichtgrösse auf Ebene Art. Zur Prüfung umgerechnet: #1 1.2, #2 1.3 mS/cm. #3 und #5 stimmen überein (Bestätigung).

### K-spinat-06 – Phase `wachstum`, `wassertemp` (keine Pflichtgrösse)

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.wachstum.wassertemp#1 | 20 bis 25 | °C | – | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |
| pw.spinacia_oleracea.wachstum.wassertemp#2 (offen: Einzelwert) | 18 | °C | – | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |
| pw.spinacia_oleracea.wachstum.wassertemp#3 (offen: Einzelwert) | 25 | °C | – | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |

Alle drei aus derselben Quelle, aber aus verschiedenen Protokollen: #1 Babyspinat (Summary), #2 Large-leaf gegen Pythium (Kapitel 1), #3 Versuchseinstellung (Kapitel 3).

### K-spinat-07 – Phase `wachstum`, `licht_h` (keine Pflichtgrösse)

| kandidat_id | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| pw.spinacia_oleracea.wachstum.licht_h#1 | 12 bis 14 | h | – | risegardens-spinat-2026 | B2 | dwc | indoor_led | 2026 |
| pw.spinacia_oleracea.wachstum.licht_h#2 (offen: Einzelwert, Versuchseinstellung) | 16 | h | – | cornell-cea-spinat-2005 | B1 | dwc | gewaechshaus | 2005 |

### K-spinat-08 – Saatempfehlung `se.spinacia_oleracea.babyleaf`

| kandidat_id | Wert (Samen je Schwamm / Obergrenze / stehen lassen) | Einheit | Basis | Quelle | Klasse Saatmenge | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| se.spinacia_oleracea.babyleaf#1 | 1 / 1 / 1 | Samen, Pflanzen | – | cornell-gpn-leafy-greens-2016 | C (Quelle B1) | dwc, Speedling-Zellen mit Torf/Perlit oder Kokos | nicht angegeben | 2016 |
| se.spinacia_oleracea.babyleaf#2 (offen: Versuchsstufen 1, 2 oder 3 Samen je Zelle, keine Empfehlung; stehen lassen nicht genannt) | leer / leer / leer (Versuch: 1 bis 3 Samen je Zelle, ohne Vereinzeln) | Samen, Pflanzen | – | cornell-cea-spinat-2005 | C (Quelle B1) | dwc, Speedling 242 Zellen mit Peatlite | nicht angegeben | 2005 |

#1 ist ladbar; #2 steht nur in `saatempfehlung_offen.csv` und weicht bei Samenzahl und Obergrenze ab.

## 2 Plausibilität

Umrechnung nur zur Prüfung (03_import_w0.md 6): µS/cm durch 1000, sonst mS/cm Faktor 1. Alle EC-Zeilen haben Basis `unbekannt` und rechnen als `gesamt`; keine Zeile hat Basis `zuwachs`. Gegenprobe Spinat (03_import_w0.md 7): Wachstum 1.6 mS/cm gesamt mit ECWasser 0.5; für Anzucht nennt die Tabelle keinen Vergleichswert. EC-Obergrenze der Kulturgruppe `fuchsschwanz`: 2.0 mS/cm (`kulturgruppe.csv`, Zeile `fuchsschwanz#1`).

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | pw.spinacia_oleracea.keimung.dauer#2 | Form 4.4.1 (min, typ, max), V6 | 5 bis 10 d | `wert_typ` fehlt; min ≤ max und alle Werte über 0 sind erfüllt. |
| P2 | pw.spinacia_oleracea.keimung.keimtemp#1 | Form 4.4.1 (min, typ, max) | typ 25 °C | Nur `wert_typ` belegt, `wert_min` und `wert_max` fehlen. |
| P3 | pw.spinacia_oleracea.keimung.keimtemp#2 | Form 4.4.1 (min, typ, max) | typ 26 °C | Nur `wert_typ` belegt, `wert_min` und `wert_max` fehlen. |
| P4 | pw.spinacia_oleracea.keimung.keimtemp#3 | Form 4.4.1 (min, typ, max) | 7 bis 24 °C | `wert_typ` fehlt, weil die Quelle den typischen Wert nur in °F nennt und Umrechnen verboten ist. |
| P5 | pw.spinacia_oleracea.keimung.keimtemp#4 | Form 4.4.1 (min, typ, max) | 15 bis 20 °C | `wert_typ` fehlt; der Bereich selbst ist geordnet. |
| P6 | pw.spinacia_oleracea.keimung.keimtemp#1, #2 gegen #3, #4 | Vergleich mit den übrigen Kandidaten der Art | 25 und 26 °C gegen 7 bis 24 und 15 bis 20 °C | Die Cornell-Werte sind Einstellungen des Keimschranks und liegen über beiden Obergrenzen (24 und 20 °C) der anderen Quellen, ohne Validatorverstoss. |
| P7 | pw.spinacia_oleracea.keimung.keimart#1 | Abgleich Wert und Kurzzitat | dunkel | «in the dark» beschreibt die gestapelten Schalen im Keimschrank, also das Verfahren, und nicht ausdrücklich ein Lichtbedürfnis der Samen; `dunkel` ist daraus abgeleitet. |
| P8 | pw.spinacia_oleracea.anzucht.ec#1 | Gegenprobe Düngeplan, Vergleich | 1.6 bis 1.8 mS/cm, Bandmitte 1.7 | Für Spinat-Anzucht fehlt ein Vergleichswert, die Bandmitte 1.7 liegt aber über dem Wachstumswert 1.6 der Art und deutlich über den Anzucht-Vergleichswerten 1.0 bis 1.1 aller übrigen Arten (V4 eingehalten, V5 mit 0.2 genau an der Untergrenze). |
| P9 | pw.spinacia_oleracea.wachstum.ph#4 | V5 Bandbreite pH 0.2 bis 1.2 | 5.8 | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2. |
| P10 | pw.spinacia_oleracea.wachstum.ph#3 | Vergleich mit der Kulturgruppe | 6.0 bis 7.0 | Mangold (`wachstum.ph#1`, cornell-gpn, B1) hat 5.5 bis 6.0, sodass sich die Bereiche nur im Punkt 6.0 berühren; Randen 6.0 bis 6.5 liegt innerhalb (V3 mit Obergrenze genau 7.0 eingehalten). |
| P11 | pw.spinacia_oleracea.wachstum.ec#1 | V5 Bandbreite EC 0.2 bis 1.2 | 1200 µS/cm = 1.2 mS/cm | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2; die Gegenprobe weicht mit 0.4 genau um die Grenze ab (nicht darüber). |
| P12 | pw.spinacia_oleracea.wachstum.ec#2 | V5 Bandbreite EC | 1300 µS/cm = 1.3 mS/cm | Einzelwert ohne Bereich, Bandbreite 0 liegt unter 0.2 (Gegenprobe Abweichung 0.3, V4 eingehalten). |
| P13 | pw.spinacia_oleracea.wachstum.ec#2 | Artbezug des Kurzzitats | 1300 µS/cm | Die Lösung ist laut Kurzzitat die Empfehlung von Sonneveld «for lettuce production», also eine für Salat empfohlene Versuchseinstellung im Spinatversuch. |
| P14 | pw.spinacia_oleracea.wachstum.ec#3 | V4 EC 0.4 bis 2.0 | 1.8 bis 2.3 mS/cm | Obergrenze 2.3 liegt 0.3 über der Validatorgrenze 2.0 der Kulturgruppe `fuchsschwanz`. |
| P15 | pw.spinacia_oleracea.wachstum.ec#3 | Gegenprobe Düngeplan | Bandmitte 2.05 mS/cm | Bandmitte 2.05 weicht um 0.45 vom Vergleichswert 1.6 ab (über 0.4). |
| P16 | pw.spinacia_oleracea.wachstum.ec#5 | V4 EC 0.4 bis 2.0 | 1.8 bis 2.3 mS/cm | Obergrenze 2.3 liegt 0.3 über der Validatorgrenze 2.0. |
| P17 | pw.spinacia_oleracea.wachstum.ec#5 | Gegenprobe Düngeplan | Bandmitte 2.05 mS/cm | Bandmitte 2.05 weicht um 0.45 vom Vergleichswert 1.6 ab (über 0.4). |
| P18 | pw.spinacia_oleracea.wachstum.wassertemp#2 | Form 4.4.1 (`wert_min`, `wert_max`) | 18 °C | Einzelwert ohne Bereich; V7 (10 bis 28 °C) eingehalten. |
| P19 | pw.spinacia_oleracea.wachstum.wassertemp#3 | Form 4.4.1 | 25 °C | Einzelwert ohne Bereich; V7 eingehalten. |
| P20 | pw.spinacia_oleracea.wachstum.wassertemp#1, #3 gegen art.pythium#1, #2 und wassertemp#2 | Vergleich mit den Artmerkmalen | bis 25 °C | Die Art ist zweifach als `pythium` = `hoch` belegt, und dieselbe Cornell-Quelle kühlt im Large-leaf-Protokoll gegen Pythium auf 18 °C, während #1 und #3 bis 25 °C gehen; ohne Validatorverstoss. |
| P21 | pw.spinacia_oleracea.wachstum.licht_h#2 | Form 4.4.1 (`wert_min`, `wert_max`) | 16 h | Einzelwert ohne Bereich (Versuchseinstellung); V7 (0 bis 24 h) eingehalten. |
| P22 | pw.spinacia_oleracea.wachstum.licht_h#2 | Vergleich mit `photoperiode` und `kritische_tageslaenge_h` | 16 h | 16 h liegen über der kritischen Tageslänge 14 h der Langtagsart (`art.kritische_tageslaenge_h#1`) und lösen damit Schossen aus, was Cornell laut `art.photoperiode#2` für Babyleaf bewusst nutzt. |
| P23 | art.spinacia_oleracea.umsetzen_ab_d#1 | Vergleich mit den Kulturformen | 9 d ab Saat | Der Wert stammt aus dem Large-leaf-Protokoll, während dieselbe Quelle die Vorgabe `babyleaf` als Direktsaat ohne Umsetzen führt (`ak.babyleaf.ernte_ab_d#1`) und auch `kopf` (medagrsci) direkt gesät ist; das Artmerkmal gilt aber für alle Kulturformen. |
| P24 | pw.spinacia_oleracea.anzucht.wechselmerkmal#1, anzucht.bbch#1 | Herkunft des Phasenendes | BBCH 13, drittes Laubblatt | Das Ende der Anzucht ist laut Fundstelle eine Zuordnung des Rechercheurs ohne hydroponisches Umsetzmerkmal für Spinat, und keine Quelle belegt, dass BBCH 13 zum Umsetzen nach 9 Tagen passt. |
| P25 | art.spinacia_oleracea.kulturformen_erlaubt#1 | Abgleich Wert und Kurzzitat (R1.2) | babyleaf;kopf;schnitt | Das Kurzzitat belegt `babyleaf` und den Nachwuchs nach dem Schnitt; `kopf` steht nur in der Fundstelle (Large-leaf-Spinat als ganze Pflanze), weil Spinat keinen Kopf bildet. |
| P26 | ak.spinacia_oleracea.kopf.ernte_ab_d#1, kopf.kulturdauer_typisch_d#1 | Vergleich mit den übrigen Kandidaten der Art | 64 d ab Saat | Der Wert stammt aus ungeheiztem Winteranbau im Gewächshaus (Saat 21. Dezember) und ist viermal so lang wie Babyleaf (16 d); für Indoor-LED ist er nicht belegt, ohne Validatorverstoss. |
| P27 | ak.spinacia_oleracea.kopf.kulturdauer_typisch_d#1 | Abgleich Wert und Kurzzitat | 64 d | Das Kurzzitat nennt 64 Tage als früheste Ernte («earliest harvest»), sodass `kulturdauer_typisch_d` gleich `ernte_ab_d` ist und eine typische Kulturdauer nicht eigens belegt. |
| P28 | se.spinacia_oleracea.babyleaf#2 | 4.5 Pflichtfelder, R12.3 | leer / leer / leer | `samen_je_schwamm`, `obergrenze_samen` und `pflanzen_stehen_lassen` fehlen, weil die Quelle nur Versuchsstufen mit 1 bis 3 Samen je Zelle ohne Vereinzeln nennt. |

**Ohne Befund geprüft:** `anwendbar` für alle fünf Phasen (`ja` für Keimung, Anzucht, Wachstum; `entfaellt` für Blüte und Fruchtbildung aus `#2` mit Fundstelle der Art, R1.1 Blattgemüse); BBCH `keimung` 0 bis 9, `anzucht` 10 bis 13, `wachstum` 14 bis 49 (0 bis 99, lückenlos); Wechselmerkmale `keimung` und `anzucht` unter 120 Zeichen und als Frage (V10), `wachstum` als letzte anwendbare Phase ohne Wechselmerkmal; `keimart` nur in `keimung` (V8), Werte gültig (V12); `anzucht.ec#1` 1.6 bis 1.8 mS/cm (V4, V5; Basis `unbekannt` ergibt zur Laufzeit den Hinweis «EC-Basis unklar»); `wachstum.ph#3` 6.0 bis 7.0, typ 6.5 (V3, V5 Bandbreite 1.0, typ im Bereich); `wachstum.wassertemp#1` 20 bis 25 °C (V7); `wachstum.licht_h#1` 12 bis 14 h (V7; Obergrenze genau auf der kritischen Tageslänge 14 h, die Quelle nennt «more than 14 hours» als Auslöser); `photoperiode` `langtag` mit `kritische_tageslaenge_h` 14 (4.3.2 erfüllt); `systemeignung` `dwc` (V12); `kulturform_vorgabe` `babyleaf` liegt in `kulturformen_erlaubt` (V11); `schnitt.ernteart` `mehrfach` (V12); `babyleaf.ernte_ab_d` 14 und `kulturdauer_typisch_d` 16 d ab Saat (Direktsaat; Ernte laut Quelle Tag 14 bis 17, Summary 14 bis 16 Tage); `se.babyleaf#1` 1 / 1 / 1 und `se.kopf#1` 1 / 1 / 1 (Obergrenze ≥ Samen, stehen lassen ≥ 1; Klasse C bei abweichendem Substrat Torf/Kokos, Klasse B bei Steinwolle als gleicher Substratklasse, R12.3 und Entscheid 0018 Punkt 5); Stammfelder mit GBIF-Quelle, Klasse C, Vermerk `keine` (4.3).

**Vergleich mit der Kulturgruppe** (geprüfte Zeilen von Mangold und Randen; Randen-Zeilen der Quelle `frankiesgarten-rote-bete-hydroponik` wie geprüft behandelt): `keimart` `dunkel` bei Mangold und Randen wie Spinat #1 und #2, `indifferent` (#3) steht allein; `keimtemp` 15 bis 20 °C aus `frankiesgarten-keimtemperaturen` gleich für alle drei Arten, Randen zusätzlich 20 bis 21 °C, die Cornell-Werte 25 und 26 °C liegen über allen (P6); `wachstum.ph` siehe P10; für `ec`, `dauer` und `anzucht.ph` haben Mangold und Randen keine geprüften Kandidaten, ein Vergleich ist nicht möglich. BBCH-Grenzen weichen ab (Spinat Skala «Leaf vegetables», Beta Skala «Beet»), was den getrennten Monografie-Skalen entspricht.

## 3 Lückenliste

Klasse D, Prüfauftrag. Pflichtgrössen nach `03_import_w0.md` 9; verworfene und Entwurfszeilen zählen nicht. Offene Kandidaten zählen als Kandidaten (keine Lücke), sind aber ohne Entscheid nicht ladbar.

### 3.1 Phasen und Pflichtgrössen (3)

| Nr. | Art | Phase | Grösse | Bemerkung |
|---|---|---|---|---|
| L1 | spinacia_oleracea | anzucht | dauer | Pflicht auf Ebene Art; einziger Kandidat `anzucht.dauer#1` verworfen |
| L2 | spinacia_oleracea | anzucht | ph | Pflicht auf Ebene Art; kein Kandidat |
| L3 | spinacia_oleracea | wachstum | dauer | Pflicht auf Ebene Art; einziger Kandidat `wachstum.dauer#1` verworfen |

Pflichtzeilen ohne ladbaren Kandidaten (nur offene Werte, 3): `keimung.dauer` (K-spinat-02), `keimung.keimtemp` (K-spinat-03), `wachstum.ec` (K-spinat-05). Ohne Entscheid und ohne Schliessen von L1 bis L3 fehlen damit `dauer`, `ph` und `ec` auf Ebene Art, und der Seed lädt Kulturform-Felder, Saatempfehlungen und `profilwert` der Art nicht (8 Nr. 4); die Vorabladung der Keimung fehlt ohne Entscheid zu K-spinat-02 und K-spinat-03.

Vorhanden: alle fünf `anwendbar`, `bbch` in den drei anwendbaren Phasen, `wechselmerkmal` in `keimung` und `anzucht`, `keimart` (K-spinat-01), `anzucht.ec`, `wachstum.ph` (K-spinat-04). Nicht gezählt (Standardprofil, R1.4): `wassertemp` und `licht_h` in `keimung` und `anzucht`.

### 3.2 Stammfelder (0)

`name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` liegen vor.

### 3.3 Artmerkmale (10)

| Nr. | Art | Feld |
|---|---|---|
| L4 | spinacia_oleracea | samentyp |
| L5 | spinacia_oleracea | standard_keimfaehigkeit |
| L6 | spinacia_oleracea | liter_je_pflanze |
| L7 | spinacia_oleracea | wasserbedarf_je_pflanze_l |
| L8 | spinacia_oleracea | pflanzen_je_m2 |
| L9 | spinacia_oleracea | wuchshoehe_max_mm |
| L10 | spinacia_oleracea | wuchsform |
| L11 | spinacia_oleracea | bestaeubung_noetig |
| L12 | spinacia_oleracea | schossen_handlung (bei `langtag` mit 14 h kritischer Tageslänge fachlich wichtig) |
| L13 | spinacia_oleracea | umsetzen_bis_d |

Vorhanden: `pythium`, `photoperiode`, `kritische_tageslaenge_h`, `systemeignung`, `umsetzen_ab_d`, `kulturformen_erlaubt` (alle drei Formen im Auftrag belegt, keine entfällt; zu `kopf` siehe P25), `kulturform_vorgabe`. Nicht gezählt: `keimlinge_je_knaeuel` (nur bei Knäuelsaat), `aussaatfenster_outdoor` (optional).

### 3.4 Kulturform-Felder (12)

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L14 | spinacia_oleracea | babyleaf | ernteart |
| L15 | spinacia_oleracea | babyleaf | kulturdauer_max_d |
| L16 | spinacia_oleracea | babyleaf | entspitzen |
| L17 | spinacia_oleracea | kopf | ernteart |
| L18 | spinacia_oleracea | kopf | kulturdauer_max_d |
| L19 | spinacia_oleracea | kopf | entspitzen |
| L20 | spinacia_oleracea | schnitt | ernte_ab_d |
| L21 | spinacia_oleracea | schnitt | kulturdauer_typisch_d |
| L22 | spinacia_oleracea | schnitt | kulturdauer_max_d |
| L23 | spinacia_oleracea | schnitt | entspitzen |
| L24 | spinacia_oleracea | schnitt | ernteintervall_d (nötig, weil `ernteart` = `mehrfach`) |
| L25 | spinacia_oleracea | schnitt | schnitte_max (nötig, weil `ernteart` = `mehrfach`; einziger Kandidat verworfen) |

Vorhanden: `babyleaf.ernte_ab_d`, `babyleaf.kulturdauer_typisch_d`, `kopf.ernte_ab_d`, `kopf.kulturdauer_typisch_d`, `schnitt.ernteart`. Bedingt: Wird `ernteart` bei `babyleaf` oder `kopf` als `mehrfach` belegt, fehlen dort zusätzlich `ernteintervall_d` und `schnitte_max`.

### 3.5 Saatempfehlungen (1)

| Nr. | Art | Kulturform | Feld |
|---|---|---|---|
| L26 | spinacia_oleracea | schnitt | se.spinacia_oleracea.schnitt (kein Kandidat; nach Entscheid 0018 Punkt 4 wäre eine Zeile Klasse D möglich) |

`babyleaf`: zwei Kandidaten (K-spinat-08), einer ladbar. `kopf`: ein geprüfter Kandidat (`se.kopf#1`), keine Lücke.

### 3.6 V13, Ebene Kulturgruppe `fuchsschwanz` (Leitkultur Spinat)

In `teile/fuchsschwanz/profilwert.csv` und in `kandidaten/profilwert.csv` steht keine Zeile mit `ebene = kulturgruppe` und `bezug = fuchsschwanz`; die Kulturgruppe selbst steht in `kandidaten/kulturgruppe.csv` erst als `entwurf`. V13 bricht so ab. Mindestzeilen nach 4.4.2 und ihre Grundlage in der Leitkultur:

| Phase | Grösse | Zeile Kulturgruppe | Grundlage Spinat (Ebene Art) |
|---|---|---|---|
| keimung | anwendbar | fehlt | vorhanden (`ja`) |
| anzucht | anwendbar | fehlt | vorhanden (`ja`) |
| wachstum | anwendbar | fehlt | vorhanden (`ja`) |
| bluete | anwendbar | fehlt | vorhanden (`entfaellt`, #2) |
| fruchtbildung_reife | anwendbar | fehlt | vorhanden (`entfaellt`, #2) |
| keimung | dauer | fehlt | nur offener Wert (K-spinat-02) |
| keimung | bbch | fehlt | vorhanden (0 bis 9) |
| keimung | wechselmerkmal | fehlt | vorhanden |
| anzucht | dauer | fehlt | keine Grundlage (L1) |
| anzucht | bbch | fehlt | vorhanden (10 bis 13) |
| anzucht | wechselmerkmal | fehlt | vorhanden (Zuordnung, P24) |
| anzucht | ph | fehlt | keine Grundlage (L2) |
| anzucht | ec | fehlt | vorhanden (1.6 bis 1.8 mS/cm, P8) |
| wachstum | dauer | fehlt | keine Grundlage (L3) |
| wachstum | bbch | fehlt | vorhanden (14 bis 49) |
| wachstum | wechselmerkmal | fehlt | keine Grundlage (Art braucht es als letzte Phase nicht, 9; 4.4.2 verlangt es für jede anwendbare Phase) |
| wachstum | ph | fehlt | ladbarer Kandidat #3, aber Konflikt K-spinat-04 |
| wachstum | ec | fehlt | nur offene Werte (K-spinat-05) |

Ergebnis: 18 Mindestzeilen fehlen; aus der Leitkultur sind heute 12 belegbar (davon `wachstum.ph` erst nach Entscheid zu K-spinat-04), 2 hängen an offenen Werten, 3 haben keine Grundlage, und für `wachstum.wechselmerkmal` widersprechen sich 4.4.2 und 9 (letzte anwendbare Phase). `ph` und `ec` der Phase `keimung` dürfen auf Ebene Kulturgruppe nicht stehen; die Leitkultur hat dort auch keine.

Für `art_neu` (4.4.2) übernimmt eine neue Art der Gruppe von Spinat: `kulturformen_erlaubt`, `kulturform_vorgabe`, `umsetzen_ab_d`, `systemeignung` sind vorhanden; `umsetzen_bis_d` (L13) und `standard_keimfaehigkeit` (L5) fehlen; `art_kulturform` liefert heute nur die fünf vorhandenen Felder aus 3.4.

## 4 Bestätigungen

| Zeile | Wert | Übereinstimmende Kandidaten |
|---|---|---|
| art.spinacia_oleracea.pythium | hoch | #1 cornell-gpn-leafy-greens-2016 (B1, DWC), #2 cornell-cea-spinat-2005 (B1, DWC) |
| art.spinacia_oleracea.photoperiode | langtag | #1 risegardens-spinat-2026 (B2, DWC), #2 cornell-cea-spinat-2005 (B1, DWC) |
| art.spinacia_oleracea.systemeignung | dwc | #1 cornell-gpn-leafy-greens-2016 (B1), #2 medagrsci-spinat-floating-2022 (A, Floating im Gewächshaus) |
| ak.spinacia_oleracea.schnitt.ernteart | mehrfach | #1 cornell-cea-spinat-2005 (B1), #2 risegardens-spinat-2026 (B2) |
| pw.spinacia_oleracea.keimung.keimart | dunkel | #1 cornell-cea-spinat-2005 (B1), #2 frankiesgarten-keimtemperaturen (C); Gegenwert #3 in K-spinat-01 |
| pw.spinacia_oleracea.wachstum.ec | 1.8 bis 2.3 mS/cm | #3 okstate-hla6722-2016 (B1, inertes Substrat), #5 risegardens-spinat-2026 (B2, DWC, LED); beide offen und über der Obergrenze 2.0 (P14, P16), Gegenwerte #1, #2 in K-spinat-05 |
