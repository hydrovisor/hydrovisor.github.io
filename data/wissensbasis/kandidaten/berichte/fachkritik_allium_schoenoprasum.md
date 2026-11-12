# Fachkritik Schnittlauch (`allium_schoenoprasum`)

W0-Probelauf, Issue #184, 12.11.2026. Kulturgruppe `kraut_ausdauernd` (Leitkultur Petersilie), Ordner `data/wissensbasis/kandidaten/teile/kraut_ausdauernd/`. Kulturform im Auftrag: `dauerkultur_blatt`, Büschel (Sorte Twiggy; DWC).

Grundlage: nur Zeilen mit `status = geprueft` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv` und `quelle.csv`. Regeln: Konzept 9.1, 9.3, 9.4, R1.1; `03_import_w0.md` 4.4, 6, 7, 9; `docs/w0/ablauf.md` Annahmen 5 bis 7; Vergleich mit Düngeplan V1.6 Abschnitt 4 (Box 2.2 Petersilie glatt + Schnittlauch, DWC 4 l, Wachstum, pH 6.0–6.2, Ziel-EC gesamt 1.3).

Geprüft und ladbar im Sinne des Validators sind für Schnittlauch: die vier Stammfelder, `ernteart` der Kulturform `dauerkultur_blatt`, `anwendbar` für Anzucht und Wachstum, `wechselmerkmal` für Keimung und Anzucht sowie `ph` der Phase Wachstum. EC und Lichtstunden der Phase Wachstum liegen nur als offene Kandidaten vor. Für die Saatempfehlung gibt es keinen geprüften Kandidaten (der offene Kandidat `se.allium_schoenoprasum.dauerkultur_blatt#1` ist verworfen).

Gesetzt in den Arbeitsdateien (nur Spalte `konflikt_id`): `K-schnittlauch-01` und `K-schnittlauch-02` in `profilwert_offen.csv`.

## 1 Konfliktliste

Zwei Konflikte, beide vom Typ «nur offener Wert» (genau ein geprüfter Kandidat der `zeile_id`, und dieser ist offen; der zweite Kandidat `pw.allium_schoenoprasum.wachstum.ec#1` ist verworfen und zählt nicht). Übernehmen kann einen Wert nur Tim über «eigener Wert» (Annahme 5). Keine Entscheidung, keine Bevorzugung.

### K-schnittlauch-01: Wachstum, EC (`pw.allium_schoenoprasum.wachstum.ec`)

Ein Kandidat, offen. EC der Phase Wachstum ist Pflichtgrösse mindestens auf Ebene Art (03_import_w0.md 9).

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `pw.allium_schoenoprasum.wachstum.ec#2` | 2.02 / – / 2.44 | mS/cm | gesamt | `hortic-bras-schnittlauch-2022` | A | nft | gewaechshaus | 2022 | EC-Band über Validatorgrenze 2.0 (V4); gemessener Bereich im Versuch |

### K-schnittlauch-02: Wachstum, Lichtstunden (`pw.allium_schoenoprasum.wachstum.licht_h`)

Ein Kandidat, offen (keine Pflichtgrösse; ohne Entscheid gilt das Standardprofil als Prüfauftrag, 03_import_w0.md 9).

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `pw.allium_schoenoprasum.wachstum.licht_h#1` | 14 / – / – | h | – | `cafre-salate-kraeuter-2020` | B1 | nft | gewaechshaus | 2020 | Nur Untergrenze; keine Obergrenze |

## 2 Plausibilität

Umrechnung nur zur Prüfung: Der EC-Kandidat ist bereits in mS/cm, Faktor 1; Basis `gesamt`, daher ohne Zuschlag ECWasser. Grenze der Kulturgruppe `kraut_ausdauernd`: EC 0.4 bis 2.0 mS/cm. Gegenprobe Schnittlauch, Wachstum: Ziel-EC 1.3 mS/cm (03_import_w0.md 7).

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `pw.allium_schoenoprasum.wachstum.ec#2` | V4 | 2.02 bis 2.44 mS/cm | Das ganze Band liegt über der Validatorgrenze 2.0 für Kräuter (Bandbreite 0.42 nach V5 zulässig). |
| P2 | `pw.allium_schoenoprasum.wachstum.ec#2` | Gegenprobe | Bandmitte 2.23 | Die Bandmitte weicht um 0.93 mS/cm von der Ziel-EC 1.3 des Düngeplans ab (mehr als 0.4). |
| P3 | `pw.allium_schoenoprasum.wachstum.ec#2` | Inhalt (9.1), Phase | 2.02 bis 2.44 | Laut Fundstelle sind es gemessene Werte eines Versuchs mit gestuften Magnesiumsulfat-Konzentrationen (Titel der Quelle), also möglicherweise die Spanne der Versuchsglieder und kein empfohlener Sollbereich; die Phase nennt das Kurzzitat nicht. |
| P4 | `pw.allium_schoenoprasum.wachstum.licht_h#1` | Form 4.4.1, V7 | nur `wert_min` 14 h | Die Grösse verlangt `wert_min` und `wert_max`; 14 h liegt innerhalb 0 bis 24. |
| P5 | `pw.allium_schoenoprasum.wachstum.licht_h#1` | Inhalt (9.1) | 14 h | Das Kurzzitat beschreibt eine Tageslänge im Gewächshaus, unter der das Wachstum stocken kann, also eine Schwelle und keinen Sollbereich der Beleuchtungsdauer. |
| P6 | `pw.allium_schoenoprasum.wachstum.ph#1` | Düngeplan (Hinweis, keine Validatorregel) | 5.5 bis 6.0 | V3 und V5 sind eingehalten (Band 0.5); das Band berührt das pH-Fenster 6.0–6.2 der Box 2.2 im Düngeplan nur im Punkt 6.0. |
| P7 | `pw.allium_schoenoprasum.anzucht.anwendbar#1` | Herkunft (`system_quelle`, `umgebung_quelle`) | ja | Der Wert `ja` ist nach R1.1 und Annahme 2 plausibel, das Kurzzitat belegt aber eine Anzucht in einer Gärtnerei vor dem Versuch, sodass `nft` und `gewaechshaus` für die Phase Anzucht nicht aus dem Zitat folgen. |
| P8 | `pw.allium_schoenoprasum.keimung.wechselmerkmal#1` | Vollständigkeit, Inhalt | «Sind die Keimlinge aufgelaufen?» | Die Phase Keimung hat kein geprüftes `anwendbar` (Kandidat `#1` verworfen), das Wechselmerkmal hängt also an einer Phase ohne Anwendbarkeitszeile; die Quelle ist allgemein und nicht artspezifisch (Klasse C, gleicher Text bei Petersilie). |
| P9 | `pw.allium_schoenoprasum.anzucht.wechselmerkmal#1` | V10, Inhalt | «Hat der Sämling echte Blätter und sind Wurzeln aussen am Würfel sichtbar?» | Länge zulässig; die Quelle ist allgemein und nicht artspezifisch (Klasse C, gleicher Text bei Petersilie). |
| P10 | Kulturgruppe (`ec#2` gegen `pw.petroselinum_crispum.wachstum.ec#2` bis `#5`) | Vergleich in der Gruppe | 2.02 bis 2.44 gegen 1.56 bis 2.2 (ohne Versuchsstufen 0.5 bis 4.0) | Der Schnittlauch-Kandidat liegt höher als alle Sollwert-Kandidaten der Leitkultur Petersilie; beide Arten liegen überwiegend über der Gruppengrenze 2.0 und der Ziel-EC 1.3. |
| P11 | alle Sollwert-Kandidaten (`ph#1`, `ec#2`, `licht_h#1`) | System der Quelle (Hinweis) | nft, gewaechshaus | Alle Sollwerte für Schnittlauch stammen aus NFT im Gewächshaus, die Box 2.2 im Düngeplan ist DWC. |

Ohne Befund: Stammfelder (`name_de` Schnittlauch, `name_wiss` Allium schoenoprasum, `gbif_key` 2855860, `kulturgruppe_id` `kraut_ausdauernd` nach 03_import_w0.md 4.2.1); `pw.allium_schoenoprasum.wachstum.anwendbar#1` (ja, R1.1); `ak.allium_schoenoprasum.dauerkultur_blatt.ernteart#1` (`mehrfach`, passt zu einer Dauerkultur; nach V11 sind damit `ernteintervall_d` und `schnitte_max` zulässig). Vergleich mit Petersilie ohne Befund: pH Schnittlauch (5.5 bis 6.0) liegt innerhalb der offenen Petersilie-Kandidaten (5.0 bis 6.0, 6.0); Lichtstunden (mindestens 14 h gegen 16 h) widersprechen sich nicht.

## 3 Lückenliste

### 3.1 Profilwerte, Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Nr. | Art | Phase | Grösse | Bemerkung |
|---|---|---|---|---|
| L1 | Schnittlauch | keimung | `anwendbar` | Kandidat `#1` verworfen |
| L2 | Schnittlauch | keimung | `dauer` | mindestens auf Ebene Art (03_import_w0.md 9); geht vorab mit dem Sortenstamm (8.4) |
| L3 | Schnittlauch | keimung | `bbch` | |
| L4 | Schnittlauch | keimung | `keimart` | Kandidat `#1` verworfen; `sorten.csv` (Twiggy) hat `keimart_tuete` leer |
| L5 | Schnittlauch | keimung | `keimtemp` | `sorten.csv` (Twiggy) hat `keimtemperatur_tuete` leer |
| L6 | Schnittlauch | anzucht | `dauer` | mindestens auf Ebene Art |
| L7 | Schnittlauch | anzucht | `bbch` | |
| L8 | Schnittlauch | anzucht | `ph` | mindestens auf Ebene Art |
| L9 | Schnittlauch | anzucht | `ec` | mindestens auf Ebene Art |
| L10 | Schnittlauch | wachstum | `dauer` | mindestens auf Ebene Art |
| L11 | Schnittlauch | wachstum | `bbch` | |
| L12 | Schnittlauch | bluete | `anwendbar` | nach R1.1 und Annahme 2 `entfaellt` mit Quelle; Zeile fehlt |
| L13 | Schnittlauch | fruchtbildung_reife | `anwendbar` | nach R1.1 und Annahme 2 `entfaellt` mit Quelle; Zeile fehlt |

Keine Lücke, aber ohne ladbaren Kandidaten: `wachstum.ec` (K-schnittlauch-01). `wachstum.wechselmerkmal` entfällt als letzte anwendbare Phase (03_import_w0.md 9); Schnittlauch ist nicht Leitkultur, die Mindestzeilen der Gruppe (4.4.2) hängen an Petersilie. `wassertemp` (alle Phasen) und `licht_h` (Keimung, Anzucht) sind keine Pflichtgrössen; ohne Wert gilt das Standardprofil als Prüfauftrag (R1.4).

### 3.2 Stammfelder

Keine Lücke: `name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` liegen je mit einem geprüften Kandidaten vor.

### 3.3 Artmerkmale (03_import_w0.md 4.3.2)

Ohne geprüften Kandidaten:

| Nr. | Art | Feld | Bemerkung |
|---|---|---|---|
| L14 | Schnittlauch | `samentyp` | |
| L15 | Schnittlauch | `standard_keimfaehigkeit` | |
| L16 | Schnittlauch | `systemeignung` | |
| L17 | Schnittlauch | `liter_je_pflanze` | |
| L18 | Schnittlauch | `wasserbedarf_je_pflanze_l` | |
| L19 | Schnittlauch | `pflanzen_je_m2` | |
| L20 | Schnittlauch | `wuchshoehe_max_mm` | `sorten.csv` (Twiggy) leer |
| L21 | Schnittlauch | `wuchsform` | `sorten.csv` (Twiggy) leer |
| L22 | Schnittlauch | `photoperiode` | |
| L23 | Schnittlauch | `kritische_tageslaenge_h` | nur bei `langtag` oder `kurztag` |
| L24 | Schnittlauch | `bestaeubung_noetig` | |
| L25 | Schnittlauch | `pythium` | |
| L26 | Schnittlauch | `schossen_handlung` | |
| L27 | Schnittlauch | `umsetzen_ab_d` | Hinweis ohne Wert: das Kurzzitat von `anzucht.anwendbar#1` nennt das Alter der zugekauften Setzlinge; ob es als Beleg taugt, klärt die Recherche |
| L28 | Schnittlauch | `umsetzen_bis_d` | |
| L29 | Schnittlauch | `kulturformen_erlaubt` | `dauerkultur_blatt` müsste darin stehen |
| L30 | Schnittlauch | `kulturform_vorgabe` | V11 |

Nicht gezählt: `aussaatfenster_outdoor` (optional), `keimlinge_je_knaeuel` (nur bei Knäuelsaat).

### 3.4 Kulturform-Felder `dauerkultur_blatt` (03_import_w0.md 4.3.3)

| Nr. | Art | Kulturform | Feld | Bemerkung |
|---|---|---|---|---|
| L31 | Schnittlauch | dauerkultur_blatt | `ernte_ab_d` | Kandidat `#1` verworfen |
| L32 | Schnittlauch | dauerkultur_blatt | `ernteintervall_d` | zulässig, weil `ernteart = mehrfach` geprüft vorliegt |
| L33 | Schnittlauch | dauerkultur_blatt | `schnitte_max` | zulässig, weil `ernteart = mehrfach` geprüft vorliegt |
| L34 | Schnittlauch | dauerkultur_blatt | `kulturdauer_max_d` | |
| L35 | Schnittlauch | dauerkultur_blatt | `kulturdauer_typisch_d` | |
| L36 | Schnittlauch | dauerkultur_blatt | `entspitzen` | |

### 3.5 Saatempfehlung `dauerkultur_blatt`

| Nr. | Art | Kulturform | Feld | Bemerkung |
|---|---|---|---|---|
| L37 | Schnittlauch | dauerkultur_blatt | Saatempfehlung (`se.allium_schoenoprasum.dauerkultur_blatt`) | kein geprüfter Kandidat (der offene Kandidat `#1` ist verworfen); anders als bei Petersilie und Tomate liegt kein Entscheid Tims nach R12.3 vor, es fehlen alle Pflichtfelder nach 4.5 |

### 3.6 Folge für das Laden

Nach 03_import_w0.md 8.4 lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` des Schnittlauchs erst, wenn alle fünf Phasen `anwendbar` tragen und jede anwendbare Phase ihre Pflichtgrössen hat; heute fehlen L1 bis L13 sowie der Entscheid zu K-schnittlauch-01. Die Stammfelder lädt der Seed unabhängig davon.

## 4 Bestätigungen

Keine: Kein Wert ist durch mehrere unabhängige Quellen mit gleichem Wert belegt. Mehrfach genannte Quellen (`hortic-bras-schnittlauch-2022` für `anwendbar` zweier Phasen, `ph#1` und `ec#2`; `cafre-salate-kraeuter-2020` für `ernteart` und `licht_h#1`; `johnnys-hydroponik-anzucht` für die Wechselmerkmale von Schnittlauch und Petersilie) sind keine Bestätigung.

## Runde 2 (12.11.2026)

Issue #188. Grundlage: alle Schnittlauch-Zeilen mit `status = geprueft` oder `vorgeschlagen` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv` (leer) und `saatempfehlung_offen.csv`, aus Runde 1 und Runde 2. Verworfene Kandidaten bleiben aussen vor (`keimung.anwendbar#1`, `keimung.keimart#1`, `keimung.dauer#1`, `anzucht.dauer#1`, `wachstum.ec#1`, `wachstum.licht_h#3`, `ak.…dauerkultur_blatt.ernte_ab_d#1`, Saatempfehlung `dauerkultur_blatt#1` und `#3`). Die Quelle `frankiesgarten-faq` steht in `quelle.csv` nur wegen des abweichenden Titels auf `verworfen` und gilt hier als geprüft (der Lead korrigiert den Titel). Kulturformen nach Entscheid 0018: `dauerkultur_blatt;schnitt`, Vorgabe `dauerkultur_blatt`; beide Formen sind in `kulturformen_erlaubt#1` und `#2` belegt (zur Trennschärfe siehe P24), keine Form entfällt.

Gesetzt in den Arbeitsdateien (nur Spalte `konflikt_id`, nur Schnittlauch):

- `profilwert.csv`: K-01 (`wachstum.ec#3`, `#4`), K-02 (`wachstum.licht_h#2`), K-03 (`keimung.keimtemp#1`), K-04 (`anzucht.ec#1` bis `#3`), K-05 (`wachstum.ph#1` bis `#3`).
- `profilwert_offen.csv`: K-02 (`wachstum.licht_h#4`), K-03 (`keimung.keimtemp#2`); K-01 (`wachstum.ec#2`) und K-02 (`wachstum.licht_h#1`) unverändert aus Runde 1.
- `saatempfehlung_offen.csv`: K-06 (`dauerkultur_blatt#2`, `#4`), K-07 (`schnitt#1`).

Spalte «Datei»: `pw` = `profilwert.csv` (ladbar), `offen` = `profilwert_offen.csv` bzw. `saatempfehlung_offen.csv`. Jahr «–» = in `quelle.csv` ohne Jahr. Kurze `kandidat_id` ohne Präfix `pw.allium_schoenoprasum.` bzw. `se.allium_schoenoprasum.`.

### R2.1 Konfliktliste

Sieben offene Konflikte (2 aus Runde 1, 5 neu). «Nur offener Wert» heisst: kein ladbarer Kandidat der `zeile_id`. Keine Entscheidung, keine Bevorzugung.

#### K-schnittlauch-01: Wachstum, EC (`pw.allium_schoenoprasum.wachstum.ec`)

Drei abweichende Kandidaten, neu mit zwei ladbaren (`#3`, `#4`); Pflichtgrösse, mindestens auf Ebene Art.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.ec#2` | offen | 2.02 / – / 2.44 | mS/cm | gesamt | `hortic-bras-schnittlauch-2022` | A | nft | gewaechshaus | 2022 |
| `wachstum.ec#3` | pw | 1.8 / – / 2.0 | mS/cm | unbekannt | `simplyhydro-schnittlauch` | C | nft | andere | – |
| `wachstum.ec#4` | pw | 1.0 / – / 1.3 | mS/cm | unbekannt | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |

Gegenprobe (Ziel 1.3 mS/cm gesamt; Basis `gesamt` und `unbekannt` ohne Zuschlag ECWasser, 03_import_w0.md 6): `#2` Bandmitte 2.23 (+0.93) und `#3` 1.9 (+0.6) verfehlen, `#4` 1.15 (−0.15) besteht.

#### K-schnittlauch-02: Wachstum, Lichtstunden (`pw.allium_schoenoprasum.wachstum.licht_h`)

Drei abweichende Kandidaten, neu mit einem ladbaren (`#2`); keine Pflichtgrösse.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.licht_h#1` | offen | 14 / – / – | h | – | `cafre-salate-kraeuter-2020` | B1 | nft | gewaechshaus | 2020 |
| `wachstum.licht_h#2` | pw | 14 / – / 16 | h | – | `frankiesgarten-faq` | C | substrat_inert | andere | – |
| `wachstum.licht_h#4` | offen | 14 / 18 / – | h | – | `forkfarms-herb-guide-2025` | B2 | substrat_inert | andere | 2025 |

#### K-schnittlauch-03 (neu): Keimung, Keimtemperatur (`pw.allium_schoenoprasum.keimung.keimtemp`)

Zwei abweichende Kandidaten, einer ladbar (`#1`); Pflichtgrösse.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `keimung.keimtemp#1` | pw | 16 / 21 / 22 | °C | – | `simplyhydro-schnittlauch` | C | nft | andere | – |
| `keimung.keimtemp#2` | offen | 15 / – / 20 | °C | – | `frankiesgarten-keimtemperaturen` | C | substrat_inert | andere | – |

#### K-schnittlauch-04 (neu): Anzucht, EC (`pw.allium_schoenoprasum.anzucht.ec`)

Drei Kandidaten mit zwei Werten, alle ladbar; Pflichtgrösse, mindestens auf Ebene Art.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `anzucht.ec#1` | pw | 0.4 / – / 0.6 | mS/cm | unbekannt | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |
| `anzucht.ec#2` | pw | 0.6 / – / 0.8 | mS/cm | unbekannt | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |
| `anzucht.ec#3` | pw | 0.4 / – / 0.6 | mS/cm | unbekannt | `frankiesgarten-faq` | C | substrat_inert | andere | – |

Gegenprobe: Für Schnittlauch in der Anzucht nennt die Tabelle keinen Vergleichswert.

#### K-schnittlauch-05 (neu): Wachstum, pH (`pw.allium_schoenoprasum.wachstum.ph`)

Drei abweichende Kandidaten, alle ladbar; Pflichtgrösse, mindestens auf Ebene Art.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.ph#1` | pw (vorgeschlagen) | 5.5 / – / 6.0 | pH | – | `hortic-bras-schnittlauch-2022` | A | nft | gewaechshaus | 2022 |
| `wachstum.ph#2` | pw | 6.0 / – / 6.5 | pH | – | `simplyhydro-schnittlauch` | C | nft | andere | – |
| `wachstum.ph#3` | pw | 5.5 / 5.8 / 6.5 | pH | – | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |

#### K-schnittlauch-06 (neu): Saatempfehlung `dauerkultur_blatt` (`se.allium_schoenoprasum.dauerkultur_blatt`)

Zwei abweichende Kandidaten, beide offen; nur offener Wert.

| `kandidat_id` | Samen je Schwamm / Obergrenze / stehen lassen | Klasse Saatmenge | Substrat | Quelle | Quellenklasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `dauerkultur_blatt#2` | 3 / 5 / – | B | Schaumstoffwürfel, Grösse unbelegt | `frankiesgarten-hydroponik-einstieg` | praxis | substrat_inert | – | – |
| `dauerkultur_blatt#4` | 4 / – / – | B | Steinwollwürfel, Grösse unbelegt | `forkfarms-herb-guide-2025` | hersteller | substrat_inert | – | 2025 |

#### K-schnittlauch-07 (neu): Saatempfehlung `schnitt` (`se.allium_schoenoprasum.schnitt`)

Ein Kandidat, nur offener Wert.

| `kandidat_id` | Samen je Schwamm / Obergrenze / stehen lassen | Klasse Saatmenge | Substrat | Quelle | Quellenklasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `schnitt#1` | 3 / 5 / – | B | Schaumstoffwürfel, Grösse unbelegt | `frankiesgarten-hydroponik-einstieg` | praxis | substrat_inert | – | – |

### R2.2 Plausibilität

Umrechnung nur zur Prüfung: alle EC-Kandidaten in mS/cm (Faktor 1). Grenzen `kraut_ausdauernd`: pH 5.2 bis 7.0, EC 0.4 bis 2.0, Bandbreite 0.2 bis 1.2, Wassertemperatur 10 bis 28 °C, Licht 0 bis 24 h. Gegenprobe Schnittlauch nur Wachstum (1.3 mS/cm gesamt, ECWasser 0.5). Die Befunde P1 bis P7 und P9 bis P11 aus Runde 1 gelten weiter; P8 ist zum Teil erledigt, weil `keimung.anwendbar` jetzt geprüfte Kandidaten hat (`#2`, `#3`), offen bleibt die allgemeine, nicht artspezifische Quelle des Wechselmerkmals.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P12 | `keimung.keimtemp#1` | Herkunft (`system_quelle`) | nft | Derselbe Unterabschnitt «Propagation» von `simplyhydro-schnittlauch` wurde für `keimung.dauer#1` verworfen, weil er die Keimung nicht hydroponisch beschreibt; `system_quelle = nft` ist damit auch für die Keimtemperatur nicht belegt. |
| P13 | `keimung.keimtemp#1`, `#2` | Form 4.4.1, Inhalt | 16 / 21 / 22 gegen 15 / – / 20 °C | `#2` fehlt der von `keimtemp` verlangte `wert_typ`; der typische Wert 21 °C von `#1` liegt ausserhalb des Bereichs von `#2`, die Bänder überlappen nur von 16 bis 20 °C. |
| P14 | `keimung.bbch#1`, `anzucht.bbch#1`, `wachstum.bbch#1`, `keimung.anwendbar#3` | Inhalt (9.1) | 0–9, 10–13, 14–19 | Die BBCH-Tafel gilt für Zwiebelgemüse (A. cepa, porrum, sativum, ascalonicum), Schnittlauch ist nicht genannt (Gattungsanalogie); das Ende der Anzucht bei 13 ist laut Fundstelle analog `lactuca_sativa` gesetzt und nicht aus der Quelle; die Bänder sind lückenlos und liegen in 0 bis 99. |
| P15 | `anzucht.ph#1`, `wachstum.ph#3` | Inhalt (9.1) | typ 5.8 | Das Kurzzitat «zwischen 5,5 und 6,5» nennt keinen Zielwert, `wert_typ` 5.8 ist an der Fundstelle nicht belegt; die Angabe gilt laut Fundstelle für alle Pflanzen und Phasen (V3, V5 mit Band 1.0 eingehalten). |
| P16 | `wachstum.ph#1` bis `#3` | V3, V5; Düngeplan (Hinweis) | 5.5–6.0, 6.0–6.5, 5.5–6.5 | Alle drei halten V3 und V5 ein (Bänder 0.5, 0.5, 1.0); `#1` und `#2` berühren sich nur im Punkt 6.0, das pH-Fenster 6.0–6.2 der Box 2.2 liegt ganz in `#2` und `#3`, in `#1` nur im Punkt 6.0. |
| P17 | `anzucht.ec#1` bis `#3` | V4, V5, Inhalt | 0.4–0.6, 0.6–0.8 | `#1` und `#3` liegen mit 0.4 auf der Untergrenze von V4, alle drei mit Bandbreite 0.2 auf der Untergrenze von V5; `#1` und `#2` sind aufeinander folgende Stufen derselben Düngestufen-Tabelle («erste Blätter», «Jungpflanze»), keine Alternativen, und die Tabelle ist nicht artspezifisch. |
| P18 | `wachstum.ec#3` | V4, V5, Gegenprobe | 1.8–2.0 | Obergrenze 2.0 genau auf der Validatorgrenze, Bandbreite 0.2 auf der Untergrenze von V5; die Bandmitte 1.9 verfehlt die Ziel-EC 1.3 um 0.6 mS/cm (Konflikt der Gegenprobe). |
| P19 | `wachstum.ec#4` | Gegenprobe, Inhalt (9.1) | 1.0–1.3 | V4, V5 (0.3) und Gegenprobe (−0.15; als `zuwachs` gelesen 1.65, +0.35) eingehalten; die Fundstelle ist eine allgemeine Düngestufen-Tabelle zu einer Dosis von 2 ml/l, nicht artspezifisch. |
| P20 | `wachstum.ec#2` bis `#4` | Gegenprobe, Gruppe | 1.0 bis 2.44 | Die Kandidaten streuen über 1.44 mS/cm; nur die allgemeine Praxisangabe `#4` besteht die Gegenprobe, beide artspezifischen Quellen (`#2` A, `#3` C) liegen 0.6 bis 0.93 darüber. |
| P21 | `anzucht.licht_h#1`, `wachstum.licht_h#2`, `wachstum.licht_h#4` | Herkunft (`umgebung_quelle`) | 14–16, 14–16, 14 / 18 / – | Die Fundstellen sprechen von Beleuchtung bzw. Licht-Timer, also von Kunstlicht, während `umgebung_quelle = andere` gesetzt ist (vgl. den aus diesem Grund verworfenen `pw.petroselinum_crispum.wachstum.licht_h#2`); alle drei gelten allgemein für Kräuter, Salat oder Fruchtgemüse. |
| P22 | `wachstum.licht_h#4` | Form 4.4.1, V7 | 14 / 18 / – | `wert_max` fehlt; 18 h liegt in V7, aber über der Obergrenze 16 h von `#2`. |
| P23 | `anzucht.ec#3`, `wachstum.licht_h#2`, `wachstum.wassertemp#2` | Quelle | `frankiesgarten-faq` | Die Quelle ist in `quelle.csv` nur wegen des Titels verworfen und hier als geprüft behandelt; alle drei Fundstellen sind allgemein (Salat und Kräuter, ohne Art). |
| P24 | `art.…kulturformen_erlaubt#1`, `#2`; `ak.…schnitt.ernteart#1` | Entscheid 0018, R1.2 | `dauerkultur_blatt;schnitt` | Die Trennung der beiden Formen stützt sich nur auf `simplyhydro-schnittlauch` (C: Teilschnitt 1/3 bis 2/3 gegen Schnitt ganzer Horste); `cafre-salate-kraeuter-2020` (B1) belegt mit «left in place and treated as a CCA crop» die mehrfache Ernte, unterscheidet aber nicht zwischen `schnitt` und `dauerkultur_blatt`. |
| P25 | `dauerkultur_blatt#2`, `#4` (Saatempfehlung) | 4.5 Pflichtfelder | 3/5/–, 4/–/– | `pflanzen_stehen_lassen` fehlt in beiden, bei `#4` auch `obergrenze_samen`; `#4` gilt für alle Kräuter des Leitfadens, und Klasse B stützt sich nur auf die gleiche Substratklasse bei unbelegter Würfelgrösse; anders als bei Petersilie nennt Entscheid 0018 für Schnittlauch keine Klasse-D-Werte. |
| P26 | `schnitt#1` (Saatempfehlung) | 4.5, R1.2 | 3 / 5 / – | Gleiche Quelle, Fundstelle und Kurzzitat wie `dauerkultur_blatt#2`; die Quelle unterscheidet keine Kulturform, und `pflanzen_stehen_lassen` fehlt. |

Ohne Befund: Stammfelder; `keimung.anwendbar#2` (ja, Seite zur Hydroponik); `keimung.keimart#2` (`dunkel`); `anzucht.licht_h#1` und `wachstum.licht_h#2` in V7; `wachstum.wassertemp#1`, `#2` (18 bis 22 °C, V7, allgemein); `bluete.anwendbar#1` und `fruchtbildung_reife.anwendbar#1` (`entfaellt` nach R1.1 und Entscheid 0018); `kulturform_vorgabe#1` liegt in `kulturformen_erlaubt` (V11); `ak.…dauerkultur_blatt.ernteart#1`, `#2` und `ak.…schnitt.ernteart#1` (`mehrfach`, V11 erlaubt damit `ernteintervall_d` und `schnitte_max`).

Vergleich in der Gruppe: Schnittlauch trägt aus denselben frankiesgarten-Seiten dieselben Werte wie Petersilie für `anzucht.ph` (5.5 / 5.8 / 6.5), `anzucht.ec` (K-04 wie K-petersilie-11), `wachstum.ec#4` (1.0 bis 1.3, wie `pw.petroselinum_crispum.wachstum.ec#7`), `wachstum.wassertemp` und `anzucht.licht_h`; das ist stimmig, aber keine artspezifische Bestätigung. `wachstum.ph#2` (6.0 bis 6.5) liegt höher als alle artspezifischen Petersilie-Kandidaten (bis 6.0). Keimtemperatur und Keimart decken sich mit Petersilie (15 bis 20 °C, `dunkel`), `keimtemp#1` reicht mit 22 °C höher. Wachstum-BBCH 14 bis 19 gegen Petersilie 14 bis 49 (andere BBCH-Tafel, P14).

### R2.3 Lückenliste nach Pflichtgrössen

Geschlossen seit Runde 1: L1 (`keimung.anwendbar`), L3 (`keimung.bbch`), L4 (`keimung.keimart`), L5 (`keimung.keimtemp`, mit K-03), L7 (`anzucht.bbch`), L8 (`anzucht.ph`), L9 (`anzucht.ec`, mit K-04), L11 (`wachstum.bbch`), L12 und L13 (`anwendbar = entfaellt` für Blüte und Fruchtbildung), L29 (`kulturformen_erlaubt`), L30 (`kulturform_vorgabe`); `wachstum.ec` hat jetzt ladbare Kandidaten (K-01).

**Profilwerte (03_import_w0.md 9), Klasse D, Prüfauftrag:**

| Nr. | Art | Phase | Grösse | Stand |
|---|---|---|---|---|
| L2-1 | Schnittlauch | keimung | `dauer` | kein Kandidat (`#1` verworfen); mindestens auf Ebene Art, geht vorab mit dem Sortenstamm (8.4) |
| L2-2 | Schnittlauch | anzucht | `dauer` | kein Kandidat (`#1` verworfen); mindestens auf Ebene Art |
| L2-3 | Schnittlauch | wachstum | `dauer` | kein Kandidat; mindestens auf Ebene Art |

`wachstum.wechselmerkmal` entfällt als letzte anwendbare Phase. Keine Pflicht, Standardprofil als Prüfauftrag: `keimung.licht_h`, `keimung.wassertemp`, `anzucht.wassertemp` (kein Kandidat).

**Stammfelder:** keine Lücke.

**Artmerkmale (4.3.2):**

| Nr. | Art | Feld | Bemerkung |
|---|---|---|---|
| L2-4 | Schnittlauch | `samentyp` | im Auftrag Runde 2 |
| L2-5 | Schnittlauch | `standard_keimfaehigkeit` | im Auftrag Runde 2 |
| L2-6 | Schnittlauch | `systemeignung` | im Auftrag Runde 2 |
| L2-7 | Schnittlauch | `umsetzen_ab_d` | im Auftrag Runde 2; Hinweis ohne Wert wie L27 (Kurzzitat von `anzucht.anwendbar#1`) |
| L2-8 | Schnittlauch | `umsetzen_bis_d` | im Auftrag Runde 2 |
| L2-9 | Schnittlauch | `liter_je_pflanze` | |
| L2-10 | Schnittlauch | `wasserbedarf_je_pflanze_l` | |
| L2-11 | Schnittlauch | `pflanzen_je_m2` | |
| L2-12 | Schnittlauch | `wuchshoehe_max_mm` | `sorten.csv` (Twiggy) leer |
| L2-13 | Schnittlauch | `wuchsform` | `sorten.csv` (Twiggy) leer |
| L2-14 | Schnittlauch | `photoperiode` | Hinweis ohne Wert: `wachstum.licht_h#1` und der verworfene `#3` nennen 14 h Tageslänge als Schwelle für Wachstumsstopp bzw. Ruhe; ob das als Beleg taugt, klärt die Recherche |
| L2-15 | Schnittlauch | `kritische_tageslaenge_h` | nur bei `langtag` oder `kurztag`; Hinweis wie L2-14 |
| L2-16 | Schnittlauch | `bestaeubung_noetig` | |
| L2-17 | Schnittlauch | `pythium` | |
| L2-18 | Schnittlauch | `schossen_handlung` | |

**Kulturform-Felder (4.3.3), erlaubte Form `dauerkultur_blatt`** (`ernteart` vorhanden):

| Nr. | Art | Kulturform | Feld | Bemerkung |
|---|---|---|---|---|
| L2-19 | Schnittlauch | dauerkultur_blatt | `ernte_ab_d` | `#1` verworfen |
| L2-20 | Schnittlauch | dauerkultur_blatt | `ernteintervall_d` | bei `ernteart = mehrfach` |
| L2-21 | Schnittlauch | dauerkultur_blatt | `schnitte_max` | bei `ernteart = mehrfach`; nach R1.2 «oder» `kulturdauer_max_d` |
| L2-22 | Schnittlauch | dauerkultur_blatt | `kulturdauer_max_d` | |
| L2-23 | Schnittlauch | dauerkultur_blatt | `kulturdauer_typisch_d` | |
| L2-24 | Schnittlauch | dauerkultur_blatt | `entspitzen` | |

**Kulturform-Felder (4.3.3), erlaubte Form `schnitt`** (`ernteart` vorhanden):

| Nr. | Art | Kulturform | Feld | Bemerkung |
|---|---|---|---|---|
| L2-25 | Schnittlauch | schnitt | `ernte_ab_d` | |
| L2-26 | Schnittlauch | schnitt | `ernteintervall_d` | bei `ernteart = mehrfach` |
| L2-27 | Schnittlauch | schnitt | `schnitte_max` | bei `ernteart = mehrfach`; nach R1.2 «oder» `kulturdauer_max_d` |
| L2-28 | Schnittlauch | schnitt | `kulturdauer_max_d` | |
| L2-29 | Schnittlauch | schnitt | `kulturdauer_typisch_d` | |
| L2-30 | Schnittlauch | schnitt | `entspitzen` | |

**Saatempfehlungen je erlaubter Kulturform:**

| Nr. | Art | Kulturform | Stand |
|---|---|---|---|
| L2-31 | Schnittlauch | dauerkultur_blatt | nur offener Wert (K-06); `pflanzen_stehen_lassen` bzw. `obergrenze_samen` fehlen |
| L2-32 | Schnittlauch | schnitt | nur offener Wert (K-07); `pflanzen_stehen_lassen` fehlt |

Summe: 32 Einträge, davon 30 ohne Kandidat und 2 nur mit offenem Wert (L2-31, L2-32). Folge für das Laden (8.4): ohne `dauer` in den drei anwendbaren Phasen lädt der Seed weder `profilwert` noch Kulturform-Felder noch Saatempfehlungen des Schnittlauchs; vorab mit dem Sortenstamm gehen die Keimungszeilen `keimart` und `keimtemp` (nach Entscheid zu K-03), `keimung.dauer` fehlt. Die Artmerkmale (Stammfelder, `kulturformen_erlaubt`, `kulturform_vorgabe`) lädt der Seed unabhängig davon.

### R2.4 Bestätigungen

| Wert | Kandidaten | Bemerkung |
|---|---|---|
| `keimung.anwendbar` = `ja` | `#2` (`frankiesgarten-keimtemperaturen`, C), `#3` (`bbch-monografie-2001`, B1) | unabhängige Quellen |
| `kulturformen_erlaubt` = `dauerkultur_blatt;schnitt` | `#1` (`simplyhydro-schnittlauch`, C), `#2` (`cafre-salate-kraeuter-2020`, B1) | unabhängige Quellen (Trennschärfe P24) |
| `ak.dauerkultur_blatt.ernteart` = `mehrfach` | `#1` (`cafre-salate-kraeuter-2020`, B1), `#2` (`simplyhydro-schnittlauch`, C) | unabhängige Quellen |
| `wachstum.wassertemp` 18 bis 22 °C | `#1`, `#2` | zwei Seiten derselben Website, kein Konflikt |
| `anzucht.ec` 0.4 bis 0.6 mS/cm | `#1`, `#3` (innerhalb K-04) | zwei Seiten derselben Website |

Teilübereinstimmungen ohne Wertung: 14 h als untere Lichtgrenze im Wachstum bei `#1`, `#2` und `#4` (drei Quellen, K-02); `wachstum.ph#1` und `#2` liegen je innerhalb `#3` (K-05); `wachstum.ec#3` (Obergrenze 2.0) grenzt an `#2` (Untergrenze 2.02); `keimtemp#1` und `#2` überlappen von 16 bis 20 °C; Saatempfehlung `dauerkultur_blatt#2` und `schnitt#1` sind derselbe Beleg für zwei `zeile_id` (keine Bestätigung).
