# Fachkritik Basilikum (`ocimum_basilicum`)

Stand 12.11.2026 · W0-Probelauf, Issue #184 · Rolle Fachkritiker · Kulturgruppe `kraut_einjaehrig` (Leitkultur) · Kulturform im Auftrag `dauerkultur_blatt` mit Entspitzen bei 12 cm (Sorten Genoveser, Pourpre; DWC)

Grundlage: nur Zeilen mit `status = geprueft` in `teile/kraut_einjaehrig/` (`art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `quelle.csv`); `saatempfehlung_offen.csv` gibt es in dieser Gruppe nicht. Geprüfte Zeilen der Art: 10 in `art.csv`, 14 in `profilwert.csv`, 4 in `profilwert_offen.csv`, 1 in `saatempfehlung.csv`. Geschrieben wurde nur die Spalte `konflikt_id` (11 Zeilen).

## 1 Konfliktliste

Sechs Konflikte, davon drei «nur offener Wert» (kein ladbarer Kandidat, nur Zeilen aus `profilwert_offen.csv`). Kein Kandidat ist bevorzugt; die Reihenfolge folgt der `kandidat_id`.

### K-basilikum-01 · Keimung · `keimtemp` · nur offener Wert, verschiedene Werte

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.keimung.keimtemp#1` | 20 / – / 25 | °C | – | `fao-aquaponik-2014` | B1 | `dwc` | `andere` | 2014 | offen, «Bereich ohne typ» |
| `pw.ocimum_basilicum.keimung.keimtemp#2` | – / 20 / – | °C | – | `saemereien-basilikum-pourpre` (Vermerk `tuete`) | C | `keine` | `andere` | – | offen, «Einzelwert» |

### K-basilikum-02 · Anzucht · `wechselmerkmal`

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.anzucht.wechselmerkmal#1` | «Hat der Sämling 4 bis 5 echte Blätter?» | – | – | `fao-aquaponik-2014` | B1 | `dwc` | `andere` | 2014 |
| `pw.ocimum_basilicum.anzucht.wechselmerkmal#2` | «Hat der Sämling 3 bis 5 echte Blätter und sind Wurzeln unten am Würfel sichtbar?» | – | – | `utk-uf-w844b-2019` | B1 | `dwc` | `andere` | 2019 |

### K-basilikum-03 · Wachstum · `ph`

| `kandidat_id` | Wert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.ph#1` | 5.5 – 6.0 | pH | – | `okstate-hla6722-2016` | B1 | `substrat_inert` | `andere` | 2016 |
| `pw.ocimum_basilicum.wachstum.ph#2` | 5.8 – 6.2 | pH | – | `johnnys-basilikum-hydro` | C | `dwc` | `andere` | – |
| `pw.ocimum_basilicum.wachstum.ph#3` | 5.5 – 6.5 | pH | – | `fao-aquaponik-2014` | B1 | `dwc` (Aquaponik) | `andere` | 2014 |

### K-basilikum-04 · Wachstum · `ec`

| `kandidat_id` | Rohwert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.ec#1` | 1.0 – 1.6 | mS/cm | `unbekannt` | `okstate-hla6722-2016` | B1 | `substrat_inert` | `andere` | 2016 |
| `pw.ocimum_basilicum.wachstum.ec#2` | 1.0 – 1.4 | mS/cm | `unbekannt` | `johnnys-basilikum-hydro` | C | `dwc` | `andere` | – |

### K-basilikum-05 · Wachstum · `licht_h` · nur offener Wert

| `kandidat_id` | Wert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.licht_h#1` | 14 – (leer) | h | – | `johnnys-basilikum-hydro` | C | `dwc` | `andere` | – | offen, «nur Untergrenze» |

### K-basilikum-06 · Wachstum · `wassertemp` · nur offener Wert

| `kandidat_id` | Wert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.wassertemp#1` | 21 – (leer) | °C | – | `fao-aquaponik-2014` | B1 | `dwc` (Aquaponik) | `andere` | 2014 | offen, «nur Untergrenze («higher than 21 °C»)» |

## 2 Plausibilität

Geprüft gegen V3 bis V13 (03_import_w0.md 7), die Gegenprobe-Tabelle (Basilikum: Anzucht 1.0, Wachstum 1.4 mS/cm), R1.1 und die Pflichtgrössen (Abschnitt 9). Vergleich mit den übrigen Arten der Kulturgruppe: nicht möglich, weil `kraut_einjaehrig` nur Basilikum führt (4.2.1).

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `pw.ocimum_basilicum.wachstum.ec#1` | Gegenprobe (9.4), V4, V5 | 1.0 – 1.6 mS/cm, `unbekannt` | Innerhalb 0.4 bis 2.0 und Bandbreite 0.6; Bandmitte 1.3 (Basis `unbekannt` rechnet als gesamt) weicht 0.1 von 1.4 ab, kein Gegenprobe-Konflikt; wäre die Basis `zuwachs`, läge die Mitte bei 1.8 und die Abweichung genau an der Grenze 0.4. |
| P2 | `pw.ocimum_basilicum.wachstum.ec#2` | Gegenprobe (9.4), V4, V5 | 1.0 – 1.4 mS/cm, `unbekannt` | Innerhalb der Grenzen und Bandbreite 0.4; Bandmitte 1.2 weicht 0.2 von 1.4 ab (bei Basis `zuwachs` 1.7, Abweichung 0.3), kein Gegenprobe-Konflikt. |
| P3 | `pw.ocimum_basilicum.wachstum.ec#2` | Quervergleich Quelle | 1.0 – 1.4 mS/cm | Das Kurzzitat bindet das Band an die Jahreszeit («during winter, crops need a higher EC than during summer»), der Testbetrieb läuft ab 7.1.2027 im Winter; die Jahreszeit ist in der Zeile nicht abgebildet. |
| P4 | `pw.ocimum_basilicum.wachstum.ec#1`, `#2` | 03_import_w0.md 6 | Basis `unbekannt` | Beide EC-Kandidaten haben Basis `unbekannt`; wer auch gewählt wird, die App zeigt dauerhaft «EC-Basis unklar». |
| P5 | `pw.ocimum_basilicum.wachstum.ph#1`, `#2`, `#3` | V3, V5 | 5.5 – 6.0, 5.8 – 6.2, 5.5 – 6.5 | Alle innerhalb 5.2 bis 7.0, Bandbreiten 0.5, 0.4 und 1.0 zulässig; keine Formverletzung. |
| P6 | `pw.ocimum_basilicum.wachstum.ph#3` | Quervergleich Kandidaten | 5.5 – 6.5 | Die Obergrenze 6.5 liegt über den beiden anderen Kandidaten (6.0, 6.2) und stammt aus Aquaponik; der Kandidat `#2` nennt im eigenen Kurzzitat für aquaponische Systeme leicht höhere pH-Werte. |
| P7 | `pw.ocimum_basilicum.wachstum.ph#1`, `ec#1`, `ph#2`, `ec#2` | Zuordnung Phase | ohne Phasenangabe | Die Quellen nennen die Werte laut Fundstelle ohne Phase; die Zuordnung zu Wachstum ist für `dauerkultur_blatt` naheliegend, für Anzucht gibt es dadurch keinen Wert und die Gegenprobe Anzucht (1.0) ist nicht prüfbar. |
| P8 | `pw.ocimum_basilicum.keimung.keimtemp#1`, `#2` | 4.4.1 (`keimtemp` min, typ, max) | 20 – 25 °C ohne typ; typ 20 °C allein | Keiner der beiden ist ladbar; der Einzelwert 20 liegt an der Untergrenze des Bereichs, ein Zusammensetzen wäre Ergänzen (9.1) und geht nur über Tims «eigener Wert»; Keimungszeilen sollen vorab mit dem Sortenstamm bis 15.12. laden (03_import_w0.md 8 Punkt 4). |
| P9 | `pw.ocimum_basilicum.wachstum.licht_h#1` | V7, 4.4.1 | min 14 h, max leer | 14 h liegt in 0 bis 24, aber ohne `wert_max` nicht ladbar; ohne Entscheid gilt das Standardprofil (Prüfauftrag, R1.4). |
| P10 | `pw.ocimum_basilicum.wachstum.wassertemp#1` | V7, 4.4.1 | min 21 °C, max leer | 21 °C liegt in 10 bis 28, aber ohne `wert_max` nicht ladbar; die Quelle formuliert «higher than 21 °C» (Aquaponik). |
| P11 | `pw.ocimum_basilicum.anzucht.bbch#1` und K-basilikum-02 | Abgleich BBCH und Wechselmerkmal | BBCH 10 – 12 | Laut Fundstelle ist das Ende 12 nach dem Merkmal von `wechselmerkmal#1` (FAO, 4 bis 5 echte Blätter) gewählt; fällt der Entscheid in K-basilikum-02 auf `#2` (ab 3 echten Blättern, Wurzeln sichtbar), ist das BBCH-Ende gegen das Merkmal neu abzustimmen. |
| P12 | `pw.ocimum_basilicum.anzucht.wechselmerkmal#2` | Artbezug | Text | Die Fundstelle nennt das Merkmal allgemein für Blattkulturen, nicht artspezifisch für Basilikum. |
| P13 | `pw.ocimum_basilicum.keimung.bbch#1`, `anzucht.bbch#1`, `wachstum.bbch#1` | 4.4.1 (0 bis 99) | 0 – 9, 10 – 12, 13 – 49 | Lückenlos und ohne Überschneidung; Ende 49 vor BBCH 51 passt zu Blüte als Schossen (R1.7). |
| P14 | `pw.ocimum_basilicum.*.anwendbar#1` (5 Zeilen) | R1.1, 4.4.1 | ja, ja, ja, entfaellt, entfaellt | Je Phase genau eine Zeile; `entfaellt` für Blüte und Fruchtbildung entspricht R1.1 für Kräuter; Wachstum ist letzte anwendbare Phase, dort entfällt das Wechselmerkmal (Abschnitt 9). |
| P15 | `se.ocimum_basilicum.dauerkultur_blatt#1` | R12.3, 4.5 | 2 / 2 / 1, Klasse A | Formal zulässig (Obergrenze ≥ Samen, Würfel 2.5 cm im Bereich 2 bis 3 cm für Klasse A); das Kurzzitat belegt nur «two per cell», das Vereinzeln auf eine Pflanze steht nur in der Begründung, und die Studie verwendet die Sorte 'Nufar' in Steinwolle statt Schaum. |
| P16 | `art.ocimum_basilicum.kulturform_vorgabe#1`, `ak.ocimum_basilicum.dauerkultur_blatt.ernteart#1` | V11 | `dauerkultur_blatt`, `mehrfach` | Vorgabe liegt in `kulturformen_erlaubt`; bei `mehrfach` wären `ernteintervall_d` und `schnitte_max` zulässig, beide fehlen (Lückenliste). |

Ohne Befund: V8 (`einheit_quelle` und `ec_basis` genau bei `ec`; `keimart` und `keimtemp` nur in Keimung), V9 (alle geprüften Zeilen mit Quelle, Fundstelle, Kurzzitat, Klasse; keine Klasse D), V10 (Wechselmerkmale höchstens 81 Zeichen), V12 (Aufzählungswerte gültig). Keine Dauer ist geprüft, V6 entfällt deshalb.

## 3 Lückenliste

### 3.1 Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Art | Phase | Grösse |
|---|---|---|
| `ocimum_basilicum` | `keimung` | `dauer` (mindestens Ebene Art) |
| `ocimum_basilicum` | `anzucht` | `dauer` (mindestens Ebene Art) |
| `ocimum_basilicum` | `anzucht` | `ph` (mindestens Ebene Art) |
| `ocimum_basilicum` | `anzucht` | `ec` (mindestens Ebene Art) |
| `ocimum_basilicum` | `wachstum` | `dauer` (mindestens Ebene Art) |

Pflichtgrösse nur mit offenen Kandidaten: `keimung.keimtemp` (K-basilikum-01). Folge: Ohne diese Werte lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Art nicht (03_import_w0.md 8 Punkt 4), und weil Basilikum Leitkultur ist, fehlen der Kulturgruppe `kraut_einjaehrig` die Mindestzeilen `dauer` (drei Phasen) sowie `ph` und `ec` der Anzucht (4.4.2, V13).

### 3.2 Keine Pflichtgrössen, Prüfauftrag nach R1.4 (Standardprofil)

| Art | Phase | Grösse |
|---|---|---|
| `ocimum_basilicum` | `keimung` | `licht_h`, `wassertemp` |
| `ocimum_basilicum` | `anzucht` | `licht_h`, `wassertemp` |
| `ocimum_basilicum` | `wachstum` | `licht_h`, `wassertemp` nur offen (K-basilikum-05, K-basilikum-06) |

### 3.3 Artmerkmale (4.3.2)

Stammfelder `name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` vollständig. Es fehlen:

| Art | Feld | Hinweis |
|---|---|---|
| `ocimum_basilicum` | `samentyp` | |
| `ocimum_basilicum` | `standard_keimfaehigkeit` | übernimmt eine neue Art der Gruppe von der Leitkultur (4.4.2) |
| `ocimum_basilicum` | `systemeignung` | übernimmt eine neue Art der Gruppe von der Leitkultur |
| `ocimum_basilicum` | `umsetzen_ab_d` | übernimmt eine neue Art der Gruppe von der Leitkultur |
| `ocimum_basilicum` | `umsetzen_bis_d` | übernimmt eine neue Art der Gruppe von der Leitkultur |
| `ocimum_basilicum` | `liter_je_pflanze` | |
| `ocimum_basilicum` | `wasserbedarf_je_pflanze_l` | |
| `ocimum_basilicum` | `pflanzen_je_m2` | |
| `ocimum_basilicum` | `wuchshoehe_max_mm` | |
| `ocimum_basilicum` | `wuchsform` | |
| `ocimum_basilicum` | `photoperiode` | |
| `ocimum_basilicum` | `bestaeubung_noetig` | |
| `ocimum_basilicum` | `kritische_tageslaenge_h` | bedingt, nur bei `langtag` oder `kurztag` |
| `ocimum_basilicum` | `aussaatfenster_outdoor` | optional |

`keimlinge_je_knaeuel` entfällt (keine Knäuelsaat belegt).

### 3.4 Kulturform-Felder `dauerkultur_blatt` (4.3.3)

Vorhanden: `ernteart` (`mehrfach`), `entspitzen` (`ja`). Eine Höhe für das Entspitzen (12 cm im Auftrag) hat kein Feld in 4.3.3. Es fehlen:

| Art | Kulturform | Feld |
|---|---|---|
| `ocimum_basilicum` | `dauerkultur_blatt` | `ernte_ab_d` |
| `ocimum_basilicum` | `dauerkultur_blatt` | `ernteintervall_d` |
| `ocimum_basilicum` | `dauerkultur_blatt` | `schnitte_max` (R1.2: dieses oder `kulturdauer_max_d`) |
| `ocimum_basilicum` | `dauerkultur_blatt` | `kulturdauer_max_d` |
| `ocimum_basilicum` | `dauerkultur_blatt` | `kulturdauer_typisch_d` |

### 3.5 Saatempfehlung

`se.ocimum_basilicum.dauerkultur_blatt` hat einen geprüften Kandidaten; keine Lücke.

## 4 Bestätigungen

| `zeile_id` | Wert | Kandidaten |
|---|---|---|
| `pw.ocimum_basilicum.keimung.keimart` | `licht` | `#1` (`saemereien-basilikum-pourpre`, C, Tüte) und `#2` (`saemereien-basilikum-genoveser`, C, Tüte) |

## 5 Zahlen

Konflikte 6 (davon 3 «nur offener Wert»), Plausibilitätsbefunde 16 (keine Validatorverletzung bei ladbaren Kandidaten, kein Gegenprobe-Konflikt), Lücken 22: 5 Pflichtgrössen, 12 Artmerkmale (dazu 1 bedingt, 1 optional), 5 Kulturform-Felder, 0 Saatempfehlungen; zusätzlich 4 Prüfaufträge `licht_h` und `wassertemp` ohne Pflicht.
