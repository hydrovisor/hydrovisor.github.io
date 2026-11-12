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

## Runde 2 (12.11.2026)

Issue #188 · Kulturformen nach Entscheid 0018: `dauerkultur_blatt;schnitt`, Vorgabe `dauerkultur_blatt`. Grundlage: alle Zeilen der Art mit `status = geprueft` oder `vorgeschlagen` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv` und neu `saatempfehlung_offen.csv` (die Datei gibt es seit Runde 2; ihre Zeilen zählen wie die aus `profilwert_offen.csv` als Kandidaten ohne ladbare Form). Zeilen mit `status = verworfen` sind nicht berücksichtigt. Die Quellen `frankiesgarten-basilikum` und `johnnys-hydro-anzucht` sind in `quelle.csv` nur wegen eines abweichenden Titels verworfen und gelten hier als geprüft (Titel korrigiert der Lead); die einzige Zeile mit `johnnys-hydro-anzucht` (`pw.ocimum_basilicum.anzucht.ph#1`) ist selbst methodisch verworfen und entfällt. `risegardens-kraeuter-naehrstoffe-2026` ist methodisch verworfen, ebenso alle ihre Zeilen.

Geschrieben wurde nur die Spalte `konflikt_id` in 15 Zeilen: `profilwert.csv` 4 (`wachstum.ph#5`, `wachstum.ec#4`, `wachstum.licht_h#2`, `wachstum.wassertemp#3`), `profilwert_offen.csv` 5 (`keimung.keimtemp#3`, `keimung.dauer#2`, `anzucht.ec#3`, `anzucht.ec#4`, `anzucht.licht_h#1`), `saatempfehlung.csv` 3, `saatempfehlung_offen.csv` 1, `art.csv` 2. Bestehende IDs aus Runde 1 sind unverändert.

### R2.1 Konfliktliste (alle offenen Konflikte)

Zwölf Konflikte: sechs aus Runde 1, davon fünf mit neuen Kandidaten (K-basilikum-01, -03, -04, -05, -06), und sechs neue (K-basilikum-07 bis -12). «Nur offener Wert» (kein ladbarer Kandidat): K-basilikum-01, -07, -08, -09. K-basilikum-05 und -06 haben seit Runde 2 je einen ladbaren Kandidaten. Kein Kandidat ist bevorzugt; Reihenfolge nach `kandidat_id`. «neu» kennzeichnet Kandidaten der Runde 2.

Hinweis zu K-basilikum-03 und -04: Entscheid 0018 hat beide in Runde 1 entschieden (je `#1`). Die Kandidaten `wachstum.ph#5` und `wachstum.ec#4` sind danach hinzugekommen und tragen deshalb dieselbe ID; ob der Entscheid bestehen bleibt, ist offen.

#### K-basilikum-01 · Keimung · `keimtemp` · nur offener Wert

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.keimung.keimtemp#1` | 20 / – / 25 | °C | – | `fao-aquaponik-2014` | B1 | `dwc` | `andere` | 2014 | offen, «Bereich ohne typ» |
| `pw.ocimum_basilicum.keimung.keimtemp#2` | – / 20 / – | °C | – | `saemereien-basilikum-pourpre` (Vermerk `tuete`) | C | `keine` | `andere` | – | offen, «Einzelwert» |
| `pw.ocimum_basilicum.keimung.keimtemp#3` (neu) | 20 / – / 25 | °C | – | `frankiesgarten-basilikum` | C | `substrat_inert` | `andere` | – | offen, «Bereich ohne typ» |

#### K-basilikum-02 · Anzucht · `wechselmerkmal` (unverändert)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.anzucht.wechselmerkmal#1` | «Hat der Sämling 4 bis 5 echte Blätter?» | – | – | `fao-aquaponik-2014` | B1 | `dwc` | `andere` | 2014 |
| `pw.ocimum_basilicum.anzucht.wechselmerkmal#2` | «Hat der Sämling 3 bis 5 echte Blätter und sind Wurzeln unten am Würfel sichtbar?» | – | – | `utk-uf-w844b-2019` | B1 | `dwc` | `andere` | 2019 |

#### K-basilikum-03 · Wachstum · `ph`

| `kandidat_id` | Wert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.ph#1` | 5.5 – 6.0 | pH | – | `okstate-hla6722-2016` | B1 | `substrat_inert` | `andere` | 2016 |
| `pw.ocimum_basilicum.wachstum.ph#2` | 5.8 – 6.2 | pH | – | `johnnys-basilikum-hydro` | C | `dwc` | `andere` | – |
| `pw.ocimum_basilicum.wachstum.ph#3` | 5.5 – 6.5 | pH | – | `fao-aquaponik-2014` | B1 | `dwc` (Aquaponik) | `andere` | 2014 |
| `pw.ocimum_basilicum.wachstum.ph#5` (neu) | 5.5 – 6.5 | pH | – | `frankiesgarten-basilikum` | C | `nft` (Hydro Tower) | `andere` | – |

#### K-basilikum-04 · Wachstum · `ec`

| `kandidat_id` | Rohwert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.ec#1` | 1.0 – 1.6 | mS/cm | `unbekannt` | `okstate-hla6722-2016` | B1 | `substrat_inert` | `andere` | 2016 |
| `pw.ocimum_basilicum.wachstum.ec#2` | 1.0 – 1.4 | mS/cm | `unbekannt` | `johnnys-basilikum-hydro` | C | `dwc` | `andere` | – |
| `pw.ocimum_basilicum.wachstum.ec#4` (neu) | 1.2 – 1.6 | mS/cm | `unbekannt` | `frankiesgarten-basilikum` | C | `nft` | `andere` | – |

#### K-basilikum-05 · Wachstum · `licht_h`

| `kandidat_id` | Wert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.licht_h#1` | 14 – (leer) | h | – | `johnnys-basilikum-hydro` | C | `dwc` | `andere` | – | offen, «nur Untergrenze» |
| `pw.ocimum_basilicum.wachstum.licht_h#2` (neu) | 14 – 16 | h | – | `frankiesgarten-basilikum` | C | `nft` | `andere` | – | ladbar |

#### K-basilikum-06 · Wachstum · `wassertemp`

| `kandidat_id` | Wert (min – max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.wassertemp#1` | 21 – (leer) | °C | – | `fao-aquaponik-2014` | B1 | `dwc` (Aquaponik) | `andere` | 2014 | offen, «nur Untergrenze («higher than 21 °C»)» |
| `pw.ocimum_basilicum.wachstum.wassertemp#3` (neu) | 18 – 24 | °C | – | `frankiesgarten-basilikum` | C | `nft` | `andere` | – | ladbar |

#### K-basilikum-07 · Keimung · `dauer` · nur offener Wert (neu)

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.keimung.dauer#2` | 5 / – / 14 | Tage | – | `frankiesgarten-basilikum` | C | `substrat_inert` | `andere` | – | offen, «Bereich ohne typ» |

#### K-basilikum-08 · Anzucht · `ec` · nur offener Wert, verschiedene Werte (neu)

| `kandidat_id` | Rohwert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.anzucht.ec#3` | – / 0.4 / – | mS/cm | `unbekannt` | `frankiesgarten-basilikum` | C | `substrat_inert` | `andere` | – | offen, «Einzelwert (Stufe Anzucht)» |
| `pw.ocimum_basilicum.anzucht.ec#4` | – / 0.8 / – | mS/cm | `unbekannt` | `frankiesgarten-basilikum` | C | `substrat_inert` | `andere` | – | offen, «Einzelwert (Stufe Jungpflanze)» |

#### K-basilikum-09 · Anzucht · `licht_h` · nur offener Wert (neu)

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.anzucht.licht_h#1` | – / 16 / – | h | – | `frontiers-basilikum-cea-2021` | A | `substrat_inert` | `indoor_led` | 2021 | offen, «Einzelwert (Versuchsbedingung)» |

#### K-basilikum-10 · Saatempfehlung `dauerkultur_blatt` (neu)

Saatempfehlungen haben keine Spalten System und Umgebung; angegeben ist die Anbaumethode der Quelle aus `quelle.csv` und die Passung aus `substrat_passung`.

| `kandidat_id` | Samen / Obergrenze / Pflanzen | Klasse Saatmenge | Quelle | Anbaumethode Quelle | Substrat laut Passung | Jahr | Status |
|---|---|---|---|---|---|---|---|
| `se.ocimum_basilicum.dauerkultur_blatt#1` | 2 / 2 / 1 | A | `frontiers-basilikum-cea-2021` | `substrat_inert` (Wachstumskammer mit LED) | Steinwollwürfel 2.5 cm | 2021 | vorgeschlagen |
| `se.ocimum_basilicum.dauerkultur_blatt#2` | 1 / 1 / 1 | B | `frankiesgarten-basilikum` | `nft` | Schaumstoffwürfel, Grösse nicht genannt | – | geprueft |

#### K-basilikum-11 · Saatempfehlung `schnitt` (neu)

| `kandidat_id` | Samen / Obergrenze / Pflanzen | Klasse Saatmenge | Quelle | Anbaumethode Quelle | Substrat laut Passung | Jahr | Datei, `grund` |
|---|---|---|---|---|---|---|---|
| `se.ocimum_basilicum.schnitt#1` | 1 / 1 / 1 | C (Analogie) | `frankiesgarten-basilikum` | `nft` | Schaumstoffwürfel, Grösse nicht genannt | – | ladbar |
| `se.ocimum_basilicum.schnitt#2` | 5 / 6 / (leer) | C | `johnnys-basilikum-broschuere-2022` | `substrat_inert` | Würfel oder Topf 2½ Zoll, Substrat nicht genannt | 2022 | offen, «Bereich 5-6 ohne typ (Samen je Pille); pflanzen_stehen_lassen nicht genannt» |

#### K-basilikum-12 · Artmerkmal `kulturformen_erlaubt` (neu)

| `kandidat_id` | Wert | Einheit | Basis | Quelle | Klasse | System (Anbaumethode Quelle) | Umgebung | Jahr | Status |
|---|---|---|---|---|---|---|---|---|---|
| `art.ocimum_basilicum.kulturformen_erlaubt#1` | `dauerkultur_blatt` | – | – | `utk-uf-w844b-2019` | B1 | `dwc` | – | 2019 | vorgeschlagen |
| `art.ocimum_basilicum.kulturformen_erlaubt#2` | `dauerkultur_blatt;schnitt` | – | – | `cafre-blattsalat-kraeuter-2020` | B1 | `dwc` | – | 2020 | geprueft |

`#1` ist eine Teilmenge von `#2`; die Fundstelle von `#2` verweist für `dauerkultur_blatt` auf `#1`. Die Kulturform `schnitt` mit ihren Zeilen (`ak.ocimum_basilicum.schnitt.ernteart#1`, K-basilikum-11) hängt an diesem Konflikt.

### R2.2 Plausibilität

Geprüft gegen V3 bis V13, die Gegenprobe (Basilikum: Anzucht 1.0, Wachstum 1.4 mS/cm; Basis `unbekannt` rechnet als gesamt) und R1.1. Alle EC-Rohwerte sind bereits mS/cm, eine Umrechnung entfällt. Vergleich mit anderen Arten der Kulturgruppe weiterhin nicht möglich (`kraut_einjaehrig` führt nur Basilikum). Die Befunde P1 bis P16 der Runde 1 gelten weiter, ausser P9 und P10 (Licht und Wassertemperatur Wachstum haben jetzt je einen ladbaren Kandidaten, P28 und P29) und P7 (Anzucht hat jetzt einen pH-Kandidaten, P18).

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P17 | `pw.ocimum_basilicum.wachstum.ph#5` | V3, V5 | 5.5 – 6.5 | Innerhalb 5.2 bis 7.0, Bandbreite 1.0 zulässig; gleich wie `#3` (FAO, Aquaponik), das Kurzzitat nennt zusätzlich einen Zielwert 5.8, der nicht als `wert_typ` erfasst ist (optional). |
| P18 | `pw.ocimum_basilicum.anzucht.ph#2` | V3, V5, Zuordnung Phase | 5.5 – 6.5 | Formal zulässig (Bandbreite 1.0); Kurzzitat und Fundstelle sind dieselben wie bei `wachstum.ph#5` ohne Phasenangabe, die Zuordnung zur Anzucht stammt vom Rechercheur und das System ist hier `substrat_inert`, dort `nft`. |
| P19 | `pw.ocimum_basilicum.wachstum.ec#4` | V4, V5, Gegenprobe | 1.2 – 1.6 mS/cm, `unbekannt` | Innerhalb 0.4 bis 2.0, Bandbreite 0.4; Bandmitte 1.4 trifft die Gegenprobe 1.4 genau (bei Basis `zuwachs` 1.9, Abweichung 0.5 und damit über 0.4). |
| P20 | `pw.ocimum_basilicum.wachstum.ec#4` | 9.1 (kein Zusammensetzen) | 1.2 – 1.6 | Die Quelle nennt zwei Stufenwerte («1,2 im Wachstum», «bis 1,6 bei großen Pflanzen»), das Band ist vom Rechercheur aus beiden Stufen gebildet und kein in der Quelle genannter Bereich. |
| P21 | `pw.ocimum_basilicum.wachstum.ec#1`, `#2`, `#4` | 03_import_w0.md 6 | Basis `unbekannt` | Alle drei EC-Kandidaten im Wachstum haben Basis `unbekannt`; jede Wahl führt zu «EC-Basis unklar» (erweitert P4). |
| P22 | `pw.ocimum_basilicum.anzucht.ec#3` | V4, V5, Gegenprobe | typ 0.4 mS/cm | 0.4 liegt genau auf der Untergrenze von V4, als Einzelwert ohne Band ist V5 nicht prüfbar, und die Abweichung von der Gegenprobe Anzucht 1.0 beträgt 0.6 und damit über 0.4. |
| P23 | `pw.ocimum_basilicum.anzucht.ec#4` | V4, V5, Gegenprobe | typ 0.8 mS/cm | Innerhalb V4, Einzelwert ohne Band (V5 nicht prüfbar); Abweichung von der Gegenprobe Anzucht 1.0 beträgt 0.2 (bei Basis `zuwachs` 0.3), kein Gegenprobe-Konflikt. |
| P24 | `pw.ocimum_basilicum.anzucht.ec#3`, `#4` | 9.1, 4.4.1 | 0.4 und 0.8 | Beide Stufen (ab offenen Keimblättern, Jungpflanze bis zum Umsetzen) liegen in der Phase Anzucht und die Quelle nennt sie mit «etwa» als Stufenfolge, nicht als Band; ein Band aus beiden Werten wäre ein Zusammensetzen (Entscheid 0018 Punkt 1, «eigener Wert»). |
| P25 | `pw.ocimum_basilicum.keimung.dauer#2` | V6, 4.4.1 | 5 / – / 14 Tage | min ≤ max und über 0, ohne `wert_typ` nicht ladbar; die Spanne von 9 Tagen ist breit, das Substrat (Schaumstoffwürfel in der Anzuchtbox) entspricht der Substratklasse der Saatempfehlungen (Schaumwürfel 2.2 cm). |
| P26 | `pw.ocimum_basilicum.keimung.keimtemp#3` | 4.4.1 | 20 / – / 25 °C | Gleicher Bereich wie `#1` (FAO), ebenfalls ohne `wert_typ` und nicht ladbar; P8 gilt weiter, die Zeile bleibt «nur offener Wert». |
| P27 | `pw.ocimum_basilicum.wachstum.wassertemp#3` | V7, Quervergleich | 18 – 24 °C | Innerhalb 10 bis 28; der offene Kandidat `#1` (FAO, Aquaponik) verlangt über 21 °C und schliesst damit den unteren Teil 18 bis 21 von `#3` aus. |
| P28 | `pw.ocimum_basilicum.anzucht.wassertemp#1` | V7 | 18 – 22 °C | Innerhalb 10 bis 28, einziger Kandidat (Anzuchtkarte für Anzuchtbox und Anzuchtstation); kein Konflikt, keine Pflichtgrösse. |
| P29 | `pw.ocimum_basilicum.wachstum.licht_h#2` | V7, Quervergleich | 14 – 16 h | Innerhalb 0 bis 24; Untergrenze gleich wie `#1`, die Obergrenze hängt laut Kurzzitat an der Lampenstärke («starke Lampe 14, schwächere 16»), Lampentyp nicht festgelegt. |
| P30 | `pw.ocimum_basilicum.anzucht.licht_h#1` | V7, 4.4.1 | typ 16 h | Innerhalb 0 bis 24, aber eine feste Versuchsbedingung der Studie und keine Empfehlung; als Einzelwert nicht ladbar. |
| P31 | `se.ocimum_basilicum.dauerkultur_blatt#2` | R12.3, 4.5, Entscheid 0018 Punkt 5 | 1 / 1 / 1, Klasse B | Formal zulässig; Klasse B folgt aus gleicher Substratklasse Schaum, die Würfelgrösse nennt die Quelle nicht; gegenüber `#1` (2 Samen, Vereinzeln auf 1) fehlt jede Reserve für nicht keimende Samen. |
| P32 | `se.ocimum_basilicum.schnitt#1` | R12.3, Artbezug Kulturform | 1 / 1 / 1, Klasse C | Kurzzitat und Fundstelle sind dieselben wie bei `se.ocimum_basilicum.dauerkultur_blatt#2`, die Quelle nennt keine Schnittkultur (Analogie); die Übereinstimmung beider Zeilen ist deshalb keine unabhängige Bestätigung. |
| P33 | `se.ocimum_basilicum.schnitt#2` | 4.5 (Pflichtspalten) | 5 / 6 / leer | Obergrenze ≥ Samen erfüllt, aber `pflanzen_stehen_lassen` fehlt (Pflicht); der Wert gilt für eine Mehrsamen-Pille einer bestimmten Sorte (3188P) im 2½-Zoll-Gefäss, die Übertragbarkeit auf nicht pilliertes Saatgut belegt die Zeile nicht. |
| P34 | `art.ocimum_basilicum.kulturformen_erlaubt#2`, `ak.ocimum_basilicum.schnitt.ernteart#1` | Entscheid 0018 (Form nur mit Beleg), R1.2 | `dauerkultur_blatt;schnitt`, `mehrfach` | Das Kurzzitat beschreibt Rückschnitt mit wiederholter Ernte der Seitentriebe, also dieselbe Praxis wie `dauerkultur_blatt` mit `entspitzen`; ob es eine eigene Kulturform `schnitt` belegt, ist offen. |

Ohne Befund: V8 (`einheit_quelle` und `ec_basis` nur bei `ec`; `keimart`, `keimtemp` nur in Keimung), V9 (alle berücksichtigten Zeilen mit Quelle, Fundstelle, Kurzzitat, Klasse; keine Klasse D), V10, V11 (Vorgabe `dauerkultur_blatt` liegt in beiden Kandidaten von K-basilikum-12; `ernteart = mehrfach` bei beiden Kulturformen), V12 (`systemeignung = beide`, `pythium = hoch`, `schossen_handlung = auskneifen` gültig), `pw.ocimum_basilicum.keimung.keimart#3`, `art.ocimum_basilicum.systemeignung#1` (Klasse A, DWC und Kratky im selben Versuch).

### R2.3 Lückenliste

#### Pflichtgrössen (03_import_w0.md 9, mindestens Ebene Art)

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| `ocimum_basilicum` | `keimung` | `dauer` | nur offener Kandidat (K-basilikum-07) |
| `ocimum_basilicum` | `keimung` | `keimtemp` | nur offene Kandidaten (K-basilikum-01) |
| `ocimum_basilicum` | `anzucht` | `dauer` | kein geprüfter Kandidat (Klasse D, Prüfauftrag) |
| `ocimum_basilicum` | `anzucht` | `ec` | nur offene Kandidaten (K-basilikum-08) |
| `ocimum_basilicum` | `wachstum` | `dauer` | kein geprüfter Kandidat (Klasse D, Prüfauftrag) |

Vorhanden: `anwendbar` für alle fünf Phasen (ja, ja, ja, entfaellt, entfaellt nach R1.1), `bbch` der drei anwendbaren Phasen, `keimart`, `wechselmerkmal` Keimung und Anzucht (Anzucht im Konflikt K-basilikum-02; Wachstum ist letzte anwendbare Phase, dort entfällt es), `ph` Anzucht (neu, `anzucht.ph#2`) und Wachstum (K-basilikum-03), `ec` Wachstum (K-basilikum-04). Folge wie in Runde 1: Ohne `dauer` in allen drei Phasen und `ec` der Anzucht lädt der Seed Kulturform-Felder, Saatempfehlungen und `profilwert` der Art nicht (03_import_w0.md 8 Punkt 4), und der Kulturgruppe fehlen die Mindestzeilen der Leitkultur (4.4.2, V13).

Keine Pflicht, Prüfauftrag nach R1.4: `keimung.licht_h` und `keimung.wassertemp` ohne Kandidaten; `anzucht.licht_h` nur offen (K-basilikum-09). `anzucht.wassertemp`, `wachstum.licht_h` und `wachstum.wassertemp` haben jetzt ladbare Kandidaten.

#### Artmerkmale (4.3.2)

Stammfelder `name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` vollständig; neu belegt `systemeignung`. Es fehlen:

| Art | Feld | Hinweis |
|---|---|---|
| `ocimum_basilicum` | `samentyp` | |
| `ocimum_basilicum` | `standard_keimfaehigkeit` | Leitkultur-Merkmal (4.4.2) |
| `ocimum_basilicum` | `umsetzen_ab_d` | Leitkultur-Merkmal |
| `ocimum_basilicum` | `umsetzen_bis_d` | Leitkultur-Merkmal |
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

#### Kulturform-Felder (4.3.3) je erlaubter Kulturform

`dauerkultur_blatt`: vorhanden `ernteart` (`mehrfach`), `entspitzen` (`ja`). `schnitt`: vorhanden `ernteart` (`mehrfach`); die Form hängt an K-basilikum-12.

| Art | Kulturform | Feld |
|---|---|---|
| `ocimum_basilicum` | `dauerkultur_blatt` | `ernte_ab_d` |
| `ocimum_basilicum` | `dauerkultur_blatt` | `ernteintervall_d` |
| `ocimum_basilicum` | `dauerkultur_blatt` | `schnitte_max` (R1.2: dieses oder `kulturdauer_max_d`) |
| `ocimum_basilicum` | `dauerkultur_blatt` | `kulturdauer_max_d` |
| `ocimum_basilicum` | `dauerkultur_blatt` | `kulturdauer_typisch_d` |
| `ocimum_basilicum` | `schnitt` | `ernte_ab_d` |
| `ocimum_basilicum` | `schnitt` | `ernteintervall_d` (das Kurzzitat von `ak.ocimum_basilicum.schnitt.ernteart#1` nennt ein Intervall in Wochen; eine Zeile dazu gibt es nicht) |
| `ocimum_basilicum` | `schnitt` | `schnitte_max` (R1.2: dieses oder `kulturdauer_max_d`) |
| `ocimum_basilicum` | `schnitt` | `kulturdauer_max_d` |
| `ocimum_basilicum` | `schnitt` | `kulturdauer_typisch_d` |
| `ocimum_basilicum` | `schnitt` | `entspitzen` (wirkt nach P5 nur bei `dauerkultur_blatt`) |

#### Saatempfehlungen je erlaubter Kulturform

Keine Lücke: `se.ocimum_basilicum.dauerkultur_blatt` hat zwei ladbare Kandidaten (K-basilikum-10), `se.ocimum_basilicum.schnitt` einen ladbaren und einen offenen (K-basilikum-11).

### R2.4 Bestätigungen

| `zeile_id` | Wert | Kandidaten |
|---|---|---|
| `pw.ocimum_basilicum.keimung.keimart` | `licht` | `#1` (`saemereien-basilikum-pourpre`, C, Tüte), `#2` (`saemereien-basilikum-genoveser`, C, Tüte), `#3` (`frankiesgarten-basilikum`, C) |
| `ak.ocimum_basilicum.dauerkultur_blatt.ernteart` | `mehrfach` | `#1` (`utk-uf-w844b-2019`, B1), `#2` (`frankiesgarten-basilikum`, C) |
| `ak.ocimum_basilicum.dauerkultur_blatt.entspitzen` | `ja` | `#1` (`utk-uf-w844b-2019`, B1), `#2` (`frankiesgarten-basilikum`, C) |

Übereinstimmungen innerhalb eines Konflikts: `keimung.keimtemp#1` und `#3` (20 bis 25 °C, FAO und frankiesgarten, K-basilikum-01); `wachstum.ph#3` und `#5` (5.5 bis 6.5, FAO und frankiesgarten, K-basilikum-03). `se.ocimum_basilicum.dauerkultur_blatt#2` und `se.ocimum_basilicum.schnitt#1` stimmen überein, beruhen aber auf demselben Zitat (P32).

### R2.5 Zahlen

Konflikte 12 offen (6 aus Runde 1, davon 5 mit neuen Kandidaten; 6 neu K-basilikum-07 bis -12; 4 «nur offener Wert»). Plausibilitätsbefunde Runde 2: 18 (P17 bis P34), keine Validatorverletzung bei ladbaren Kandidaten; ein Gegenprobe-Konflikt nur beim offenen `anzucht.ec#3` (0.4 gegen 1.0). Lücken 27: 5 Pflichtgrössen (2 ohne Kandidat, 3 nur offen), 11 Artmerkmale (dazu 1 bedingt, 1 optional), 11 Kulturform-Felder (5 `dauerkultur_blatt`, 6 `schnitt`), 0 Saatempfehlungen; zusätzlich 3 Prüfaufträge `licht_h` und `wassertemp` ohne Pflicht.
