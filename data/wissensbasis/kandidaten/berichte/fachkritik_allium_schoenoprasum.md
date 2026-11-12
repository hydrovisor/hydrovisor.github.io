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
