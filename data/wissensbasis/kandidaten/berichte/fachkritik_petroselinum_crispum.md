# Fachkritik Petersilie (`petroselinum_crispum`)

W0-Probelauf, Issue #184, 12.11.2026. Kulturgruppe `kraut_ausdauernd` (Leitkultur), Ordner `data/wissensbasis/kandidaten/teile/kraut_ausdauernd/`. Kulturform im Auftrag: `dauerkultur_blatt`, Büschel (Sorte glatt; DWC).

Grundlage: nur Zeilen mit `status = geprueft` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv` und `quelle.csv`. Regeln: Konzept 9.1, 9.3, 9.4, R1.1; `03_import_w0.md` 4.4, 6, 7, 9; `docs/w0/ablauf.md` Annahmen 5 bis 7.

Ladbar im Sinne des Validators sind für Petersilie nur die vier Stammfelder, `anwendbar` für Keimung, Anzucht und Wachstum sowie `wechselmerkmal` für Keimung und Anzucht. Alle Sollwerte (pH, EC, Wassertemperatur, Licht) und die Saatempfehlung liegen nur als offene Kandidaten vor.

Gesetzt in den Arbeitsdateien (nur Spalte `konflikt_id`): `K-petersilie-01` bis `K-petersilie-04` in `profilwert_offen.csv`, `K-petersilie-05` in `saatempfehlung_offen.csv`.

## 1 Konfliktliste

Fünf Konflikte, alle vom Typ «nur offener Wert» (kein ladbarer Kandidat der `zeile_id`); K-01 und K-02 haben zusätzlich mehrere abweichende Kandidaten. Übernehmen kann einen Wert nur Tim über «eigener Wert» (Annahme 5). Keine Entscheidung, keine Bevorzugung.

### K-petersilie-01: Wachstum, EC (`pw.petroselinum_crispum.wachstum.ec`)

Vier abweichende Kandidaten, alle offen.

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `pw.petroselinum_crispum.wachstum.ec#2` | 1.8 / – / 2.2 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 | Obergrenze über 2.0 (V4) |
| `pw.petroselinum_crispum.wachstum.ec#3` | 0.5 / – / 4.0 | mS/cm | unbekannt | `agronomy-ec-kraeuter-2019` | A | nft | gewaechshaus | 2019 | Band 3.5, Obergrenze 4.0 (V4, V5); Versuchsstufen |
| `pw.petroselinum_crispum.wachstum.ec#4` | – / 2.0 / – | mS/cm | gesamt | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 | Einzelwert (Ziel-EC des Versuchs) |
| `pw.petroselinum_crispum.wachstum.ec#5` | – / 1.56 / – | mS/cm | gesamt | `plos-one-dill-petersilie-2021` | A | dwc | gewaechshaus | 2021 | Einzelwert (Sollwert des Versuchs) |

### K-petersilie-02: Wachstum, pH (`pw.petroselinum_crispum.wachstum.ph`)

Zwei abweichende Kandidaten, beide offen.

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `pw.petroselinum_crispum.wachstum.ph#1` | 5.0 / – / 6.0 | pH | – | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 | Untergrenze 5.0 unter 5.2 (V3) |
| `pw.petroselinum_crispum.wachstum.ph#2` | – / 6.0 / – | pH | – | `plos-one-dill-petersilie-2021` | A | dwc | gewaechshaus | 2021 | Einzelwert (Sollwert des Versuchs) |

### K-petersilie-03: Wachstum, Wassertemperatur (`pw.petroselinum_crispum.wachstum.wassertemp`)

Ein Kandidat, offen (keine Pflichtgrösse; ohne Entscheid gilt das Standardprofil als Prüfauftrag, 03_import_w0.md 9).

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `pw.petroselinum_crispum.wachstum.wassertemp#1` | – / 22 / – | °C | – | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 | Einzelwert (Versuchseinstellung) |

### K-petersilie-04: Wachstum, Lichtstunden (`pw.petroselinum_crispum.wachstum.licht_h`)

Ein Kandidat, offen (keine Pflichtgrösse; sonst Standardprofil als Prüfauftrag).

| `kandidat_id` | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `pw.petroselinum_crispum.wachstum.licht_h#1` | – / 16 / – | h | – | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 | Einzelwert (Versuchseinstellung) |

### K-petersilie-05: Saatempfehlung `dauerkultur_blatt` (`se.petroselinum_crispum.dauerkultur_blatt`)

Ein Kandidat, offen (`saatempfehlung_offen.csv`, Annahme 7). Daneben legt der Koordinator die Klasse-D-Zeile nach Tims Entscheid «15 Samen je Schwamm» an (Annahme 6); sie steht noch nicht in den Dateien und trägt deshalb noch keine `konflikt_id`. Sobald sie angelegt ist, hat die `zeile_id` zwei Kandidaten mit verschiedenem `samen_je_schwamm` (5 gegen 15); die Klasse-D-Zeile sollte dann dieselbe `konflikt_id` erhalten.

| `kandidat_id` | Samen je Schwamm / Obergrenze / stehen lassen | Klasse Saatmenge | Substrat | Quelle | Quellenklasse | System | Umgebung | Jahr | `grund` (offen) |
|---|---|---|---|---|---|---|---|---|---|
| `se.petroselinum_crispum.dauerkultur_blatt#1` | 5 / – / 3 | B | Phenolschaum-Würfel (Grösse nicht genannt) | `isu-ph-kraeuter-2025` | universitaet_beratung | dwc (Anzucht im Würfel, Klimakammer) | – | 2025 | `obergrenze_samen` in der Quelle nicht genannt |

## 2 Plausibilität

Umrechnung nur zur Prüfung: alle EC-Kandidaten sind bereits in mS/cm, Faktor 1. Grenze der Kulturgruppe `kraut_ausdauernd`: EC 0.4 bis 2.0 mS/cm (03_import_w0.md 4.2). Gegenprobe Petersilie, Wachstum: Ziel-EC 1.3 mS/cm, Basis `gesamt` und `unbekannt` ohne Zuschlag ECWasser (Abschnitt 6, Gegenprobe-Tabelle 7).

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `pw.petroselinum_crispum.wachstum.ec#2` | V4 | 1.8 bis 2.2 mS/cm | Die Obergrenze 2.2 liegt über der Validatorgrenze 2.0 für Kräuter. |
| P2 | `pw.petroselinum_crispum.wachstum.ec#2` | Gegenprobe | Bandmitte 2.0 | Die Bandmitte weicht um 0.7 mS/cm von der Ziel-EC 1.3 ab (mehr als 0.4). |
| P3 | `pw.petroselinum_crispum.wachstum.ec#2` | Basis, Phase | unbekannt | Basis `unbekannt` (Seed rechnet als `gesamt` mit «EC-Basis unklar») und die Quelle nennt keine Phase, die Zuordnung zu `wachstum` stammt aus der Recherche. |
| P4 | `pw.petroselinum_crispum.wachstum.ec#3` | V4 | 0.5 bis 4.0 mS/cm | Die Obergrenze 4.0 liegt doppelt so hoch wie die Validatorgrenze 2.0. |
| P5 | `pw.petroselinum_crispum.wachstum.ec#3` | V5 | Band 3.5 | Die Bandbreite 3.5 überschreitet die zulässigen 1.2. |
| P6 | `pw.petroselinum_crispum.wachstum.ec#3` | Gegenprobe | Bandmitte 2.25 | Die Bandmitte weicht um 0.95 mS/cm von der Ziel-EC 1.3 ab. |
| P7 | `pw.petroselinum_crispum.wachstum.ec#3` | Inhalt (9.1) | Versuchsstufen 0.5 bis 4.0 | Das Kurzzitat belegt die geprüften Versuchsstufen und eine Toleranz («can be successfully grown across a range of EC»), keinen empfohlenen Sollbereich; die Basis ist `unbekannt`. |
| P8 | `pw.petroselinum_crispum.wachstum.ec#4` | V5 | Einzelwert 2.0 | Ein Einzelwert hat keine Bandbreite (mindestens 0.2 nötig); 2.0 liegt genau auf der Validatorgrenze und ist dort zulässig. |
| P9 | `pw.petroselinum_crispum.wachstum.ec#4` | Gegenprobe | 2.0 | Der Wert weicht um 0.7 mS/cm von der Ziel-EC 1.3 ab; laut Fundstelle ist Leitungswasser mit EC 0.3 eingerechnet, die Basis `gesamt` passt dazu. |
| P10 | `pw.petroselinum_crispum.wachstum.ec#5` | V5 | Einzelwert 1.56 | Ein Einzelwert hat keine Bandbreite; die Gegenprobe besteht er mit 0.26 mS/cm Abweichung von 1.3. |
| P11 | `pw.petroselinum_crispum.wachstum.ph#1` | V3 | 5.0 bis 6.0 | Die Untergrenze 5.0 liegt unter der Validatorgrenze 5.2; die Bandbreite 1.0 ist zulässig. |
| P12 | `pw.petroselinum_crispum.wachstum.ph#1` | Inhalt (9.1) | 5.0 bis 6.0 | Das Kurzzitat nennt einen tolerierten Bereich aus einem pH-Stufenversuch (4.5 bis 7.0), die Fundstelle verweist auf ein Optimum 5.5; ein Sollbereich ist es nicht wörtlich. |
| P13 | `pw.petroselinum_crispum.wachstum.ph#2` | V5 | Einzelwert 6.0 | Ein Einzelwert hat keine Bandbreite (mindestens 0.2 nötig); V3 hält er ein. |
| P14 | `pw.petroselinum_crispum.wachstum.wassertemp#1` | Form 4.4.1, V7 | Einzelwert 22 °C | Die Grösse verlangt `wert_min` und `wert_max`; 22 °C liegt innerhalb 10 bis 28 °C. |
| P15 | `pw.petroselinum_crispum.wachstum.licht_h#1` | Form 4.4.1, V7 | Einzelwert 16 h | Die Grösse verlangt `wert_min` und `wert_max`; 16 h liegt innerhalb 0 bis 24, im Gewächshaus als Tageslicht mit Zusatzlicht. |
| P16 | `pw.petroselinum_crispum.keimung.wechselmerkmal#1` | V10, Inhalt | «Sind die Keimlinge aufgelaufen?» | Länge zulässig; die Quelle ist allgemein und nicht artspezifisch (Klasse C), Schnittlauch trägt denselben Text aus derselben Quelle. |
| P17 | `pw.petroselinum_crispum.anzucht.wechselmerkmal#1` | V10, Inhalt | «Hat der Sämling echte Blätter und sind Wurzeln aussen am Würfel sichtbar?» | Länge zulässig; die Quelle ist allgemein und nicht artspezifisch (Klasse C), Schnittlauch trägt denselben Text aus derselben Quelle. |
| P18 | `se.petroselinum_crispum.dauerkultur_blatt#1` | 4.5 Pflichtfelder, R12.3 | 5 / – / 3 | `obergrenze_samen` fehlt, und 5 Samen weichen von Tims entschiedenen 15 Samen je Schwamm ab; die Substratgrösse der Quelle ist unbelegt, die Klasse B stützt sich nur auf die gleiche Substratklasse Schaum. |
| P19 | Kulturgruppe (`ec#2` bis `ec#4` gegen `pw.allium_schoenoprasum.wachstum.ec#2`) | Vergleich in der Gruppe | 1.8 bis 4.0 bzw. 2.02 bis 2.44 | Die EC-Kandidaten beider Arten von `kraut_ausdauernd` liegen überwiegend über der Gruppengrenze 2.0 und über der Ziel-EC 1.3 des Düngeplans; nur `ec#5` (1.56) liegt in Grenze und Gegenprobe. |

Vergleich in der Gruppe ohne Befund: pH von Schnittlauch (`pw.allium_schoenoprasum.wachstum.ph#1`, 5.5 bis 6.0, Klasse A) überschneidet sich mit `ph#1` und schliesst `ph#2` (6.0) am Rand ein; Lichtstunden Schnittlauch (offen, mindestens 14 h) und Petersilie (16 h) widersprechen sich nicht. `anwendbar` (Keimung, Anzucht, Wachstum ja) entspricht bei beiden Arten R1.1.

## 3 Lückenliste

### 3.1 Profilwerte, Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Nr. | Art | Phase | Grösse | Bemerkung |
|---|---|---|---|---|
| L1 | Petersilie | keimung | `dauer` | mindestens auf Ebene Art (03_import_w0.md 9); geht vorab mit dem Sortenstamm (8.4) |
| L2 | Petersilie | keimung | `bbch` | |
| L3 | Petersilie | keimung | `keimart` | geht vorab mit dem Sortenstamm (8.4) |
| L4 | Petersilie | keimung | `keimtemp` | geht vorab mit dem Sortenstamm (8.4) |
| L5 | Petersilie | anzucht | `dauer` | mindestens auf Ebene Art; beide Kandidaten (`#1`, `#2`) verworfen |
| L6 | Petersilie | anzucht | `bbch` | |
| L7 | Petersilie | anzucht | `ph` | mindestens auf Ebene Art; Mindestzeile der Kulturgruppe (4.4.2) |
| L8 | Petersilie | anzucht | `ec` | mindestens auf Ebene Art; Mindestzeile der Kulturgruppe (4.4.2) |
| L9 | Petersilie | wachstum | `dauer` | mindestens auf Ebene Art |
| L10 | Petersilie | wachstum | `bbch` | |
| L11 | Petersilie | bluete | `anwendbar` | nach R1.1 und Annahme 2 `entfaellt` mit Quelle; Zeile fehlt |
| L12 | Petersilie | fruchtbildung_reife | `anwendbar` | nach R1.1 und Annahme 2 `entfaellt` mit Quelle; Zeile fehlt |
| L13 | Petersilie | wachstum | `wechselmerkmal` | für die Art entfällt es in der letzten anwendbaren Phase (9); 4.4.2 verlangt es aber als Mindestzeile der Kulturgruppe für jede anwendbare Phase (V13), und die Gruppenzeilen kopieren die Leitkultur |

Keine Lücke, aber ohne ladbaren Kandidaten: `wachstum.ph` (K-petersilie-02) und `wachstum.ec` (K-petersilie-01). Ohne Entscheid zu K-01 und K-02 sind auch die Mindestzeilen `ph` und `ec` der Phase Wachstum für `kraut_ausdauernd` offen. `wassertemp` und `licht_h` in Keimung und Anzucht sind keine Pflichtgrössen; ohne Wert gilt das Standardprofil als Prüfauftrag (R1.4).

### 3.2 Stammfelder

Keine Lücke: `name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` liegen je mit einem geprüften Kandidaten vor.

### 3.3 Artmerkmale (03_import_w0.md 4.3.2)

Ohne geprüften Kandidaten:

| Nr. | Art | Feld | Bemerkung |
|---|---|---|---|
| L14 | Petersilie | `samentyp` | |
| L15 | Petersilie | `standard_keimfaehigkeit` | wird an neue Arten der Gruppe vererbt (4.4.2) |
| L16 | Petersilie | `systemeignung` | wird an neue Arten der Gruppe vererbt (4.4.2) |
| L17 | Petersilie | `liter_je_pflanze` | |
| L18 | Petersilie | `wasserbedarf_je_pflanze_l` | Leitkultur bei Gleichstand (R2.3) |
| L19 | Petersilie | `pflanzen_je_m2` | |
| L20 | Petersilie | `wuchshoehe_max_mm` | |
| L21 | Petersilie | `wuchsform` | |
| L22 | Petersilie | `photoperiode` | |
| L23 | Petersilie | `kritische_tageslaenge_h` | nur bei `langtag` oder `kurztag` |
| L24 | Petersilie | `bestaeubung_noetig` | |
| L25 | Petersilie | `pythium` | |
| L26 | Petersilie | `schossen_handlung` | |
| L27 | Petersilie | `umsetzen_ab_d` | wird an neue Arten der Gruppe vererbt (4.4.2) |
| L28 | Petersilie | `umsetzen_bis_d` | wird an neue Arten der Gruppe vererbt (4.4.2) |
| L29 | Petersilie | `kulturformen_erlaubt` | wird an neue Arten der Gruppe vererbt (4.4.2); `dauerkultur_blatt` müsste darin stehen |
| L30 | Petersilie | `kulturform_vorgabe` | wird an neue Arten der Gruppe vererbt (4.4.2); V11 |

Nicht gezählt: `aussaatfenster_outdoor` (optional), `keimlinge_je_knaeuel` (nur bei Knäuelsaat, hängt an `samentyp`).

### 3.4 Kulturform-Felder `dauerkultur_blatt` (03_import_w0.md 4.3.3)

| Nr. | Art | Kulturform | Feld | Bemerkung |
|---|---|---|---|---|
| L31 | Petersilie | dauerkultur_blatt | `ernte_ab_d` | |
| L32 | Petersilie | dauerkultur_blatt | `ernteart` | |
| L33 | Petersilie | dauerkultur_blatt | `ernteintervall_d` | nur bei `ernteart = mehrfach` |
| L34 | Petersilie | dauerkultur_blatt | `schnitte_max` | nur bei `ernteart = mehrfach` |
| L35 | Petersilie | dauerkultur_blatt | `kulturdauer_max_d` | |
| L36 | Petersilie | dauerkultur_blatt | `kulturdauer_typisch_d` | |
| L37 | Petersilie | dauerkultur_blatt | `entspitzen` | |

Alle `art_kulturform`-Zeilen der Leitkultur werden an neue Arten der Gruppe vererbt (4.4.2).

### 3.5 Saatempfehlung `dauerkultur_blatt`

Keine Lücke dieser Liste: Die Klasse-D-Zeile nach Tims Entscheid (R12.3) legt der Koordinator an. Pflichtfelder nach 4.5, die der Entscheid «15 Samen je Schwamm» nicht nennt und Tim mit den Freigabevorschlägen beantworten muss (Annahme 6):

- `obergrenze_samen` (Ganzzahl ≥ 15)
- `pflanzen_stehen_lassen` (Ganzzahl ≥ 1, Büschel > 1)
- `substrat_passung` (Text zur Passung gegen Würfel 2.2 cm)

`begruendung` gibt Annahme 6 vor, die Herkunftsfelder entfallen bei Klasse D (V9). Hinweis: 03_import_w0.md 4.5 nennt in der Spalte `pflanzen_stehen_lassen` als Beispiel «Petersilie 15», der Absatz darunter und `docs/w0/ablauf.md` sprechen von «15 Samen je Schwamm». Ob 15 für `samen_je_schwamm`, für `pflanzen_stehen_lassen` oder für beide gilt, sollte Tim beim Anlegen der Zeile bestätigen.

### 3.6 Folge für das Laden

Nach 03_import_w0.md 8.4 lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Petersilie erst, wenn alle fünf Phasen `anwendbar` tragen und jede anwendbare Phase ihre Pflichtgrössen hat; heute fehlen L1 bis L12 sowie die Entscheide zu K-01 und K-02. Als Leitkultur trägt Petersilie zugleich die Mindestzeilen von `kraut_ausdauernd` (4.4.2, V13); ohne sie bricht V13 für die Gruppe ab.

## 4 Bestätigungen

Keine: Kein Wert ist durch mehrere unabhängige Quellen mit gleichem Wert belegt.

Teilübereinstimmungen, ohne Wertung: `ph#2` (6.0) liegt am Rand von `ph#1` (5.0 bis 6.0); `ec#4` (2.0) liegt in `ec#2` (1.8 bis 2.2) und `ec#3` (0.5 bis 4.0); `ec#5` (1.56) liegt nur in `ec#3`. Mehrfach genannte Werte aus derselben Quelle (`isu-ph-kraeuter-2025` für `anwendbar` dreier Phasen, `ec#4`, `ph#1`, Wassertemperatur, Licht und Saatempfehlung; `johnnys-hydroponik-anzucht` für die Wechselmerkmale von Petersilie und Schnittlauch) sind keine Bestätigung.

## Runde 2 (12.11.2026)

Issue #188. Grundlage: alle Petersilie-Zeilen mit `status = geprueft` oder `vorgeschlagen` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv` (leer) und `saatempfehlung_offen.csv`, aus Runde 1 und Runde 2. Verworfene Kandidaten bleiben aussen vor (`wachstum.ec#1`, `#6`, `wachstum.ph#5`, `wachstum.licht_h#2`, `anzucht.dauer#1`, `#2`, `anzucht.ec#5`, `keimung.dauer#2`). Die Quelle `frankiesgarten-faq` steht in `quelle.csv` nur wegen des abweichenden Titels auf `verworfen` und gilt hier als geprüft (der Lead korrigiert den Titel). Kulturformen nach Entscheid 0018: `dauerkultur_blatt;schnitt`, Vorgabe `dauerkultur_blatt`; belegt ist nur `dauerkultur_blatt` (siehe P38), `schnitt` entfällt deshalb.

Gesetzt in den Arbeitsdateien (nur Spalte `konflikt_id`, nur Petersilie):

- `profilwert.csv`: K-01 (`wachstum.ec#7`), K-02 (`wachstum.ph#3`, `#4`), K-03 (`wachstum.wassertemp#2`, `#3`), K-07 (`keimung.keimart#1` bis `#3`), K-10 (`anzucht.ph#1`, `#2`), K-11 (`anzucht.ec#1` bis `#3`), K-12 (`anzucht.wassertemp#1`, `#2`).
- `profilwert_offen.csv`: K-01 (`wachstum.ec#8`), K-04 (`wachstum.licht_h#3`), K-06 (`keimung.dauer#1`, `#3`), K-08 (`keimung.keimtemp#1`, `#2`), K-09 (`keimung.licht_h#1`), K-11 (`anzucht.ec#4`).
- `saatempfehlung_offen.csv`: K-05 (`dauerkultur_blatt#3` bis `#5`), K-13 (`schnitt#1`).

Bestehende IDs aus Runde 1 sind unverändert. Die Klasse-D-Zeile `se.petroselinum_crispum.dauerkultur_blatt#2` (Status `entwurf`) trug K-05 schon vorher; sie ist kein geprüfter Kandidat und wird unten nur nachrichtlich genannt.

Spalte «Datei»: `pw` = `profilwert.csv` (ladbar), `offen` = `profilwert_offen.csv` bzw. `saatempfehlung_offen.csv`. Jahr «–» = in `quelle.csv` ohne Jahr.

### R2.1 Konfliktliste

13 offene Konflikte (5 aus Runde 1, 8 neu). «Nur offener Wert» heisst: kein ladbarer Kandidat der `zeile_id`. Keine Entscheidung, keine Bevorzugung.

#### K-petersilie-01: Wachstum, EC (`pw.petroselinum_crispum.wachstum.ec`)

Sechs abweichende Kandidaten, neu mit ladbarem Kandidaten (`#7`).

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.ec#2` | offen | 1.8 / – / 2.2 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |
| `wachstum.ec#3` | offen | 0.5 / – / 4.0 | mS/cm | unbekannt | `agronomy-ec-kraeuter-2019` | A | nft | gewaechshaus | 2019 |
| `wachstum.ec#4` | offen | – / 2.0 / – | mS/cm | gesamt | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 |
| `wachstum.ec#5` | offen | – / 1.56 / – | mS/cm | gesamt | `plos-one-dill-petersilie-2021` | A | dwc | gewaechshaus | 2021 |
| `wachstum.ec#7` | pw | 1.0 / – / 1.3 | mS/cm | unbekannt | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |
| `wachstum.ec#8` | offen | – / 1.2 / – | mS/cm | unbekannt | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |

Gegenprobe (Ziel 1.3 mS/cm, Basis `gesamt`/`unbekannt` ohne Zuschlag ECWasser 0.5): `#2` 2.0 (+0.7), `#3` 2.25 (+0.95), `#4` 2.0 (+0.7) verfehlen; `#5` 1.56 (+0.26), `#7` 1.15 (−0.15), `#8` 1.2 (−0.1) bestehen.

#### K-petersilie-02: Wachstum, pH (`pw.petroselinum_crispum.wachstum.ph`)

Vier abweichende Kandidaten, neu mit zwei ladbaren (`#3`, `#4`).

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.ph#1` | offen | 5.0 / – / 6.0 | pH | – | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 |
| `wachstum.ph#2` | offen | – / 6.0 / – | pH | – | `plos-one-dill-petersilie-2021` | A | dwc | gewaechshaus | 2021 |
| `wachstum.ph#3` | pw | 5.5 / 5.8 / 6.0 | pH | – | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |
| `wachstum.ph#4` | pw | 5.5 / 5.8 / 6.5 | pH | – | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |

#### K-petersilie-03: Wachstum, Wassertemperatur (`pw.petroselinum_crispum.wachstum.wassertemp`)

Drei Kandidaten mit zwei Werten, neu mit zwei ladbaren (`#2`, `#3`, gleicher Wert).

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.wassertemp#1` | offen | – / 22 / – | °C | – | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 |
| `wachstum.wassertemp#2` | pw | 18 / – / 22 | °C | – | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |
| `wachstum.wassertemp#3` | pw | 18 / – / 22 | °C | – | `frankiesgarten-faq` | C | substrat_inert | andere | – |

#### K-petersilie-04: Wachstum, Lichtstunden (`pw.petroselinum_crispum.wachstum.licht_h`)

Zwei abweichende Kandidaten, weiter nur offener Wert.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `wachstum.licht_h#1` | offen | – / 16 / – | h | – | `isu-ph-kraeuter-2025` | B1 | dwc | gewaechshaus | 2025 |
| `wachstum.licht_h#3` | offen | 14 / 18 / – | h | – | `forkfarms-herb-guide-2025` | B2 | substrat_inert | andere | 2025 |

#### K-petersilie-05: Saatempfehlung `dauerkultur_blatt` (`se.petroselinum_crispum.dauerkultur_blatt`)

Vier geprüfte, abweichende Kandidaten, alle offen; nur offener Wert.

| `kandidat_id` | Samen je Schwamm / Obergrenze / stehen lassen | Klasse Saatmenge | Substrat | Quelle | Quellenklasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `dauerkultur_blatt#1` | 5 / – / 3 | B | Phenolschaum-Würfel, Grösse unbelegt | `isu-ph-kraeuter-2025` | universitaet_beratung | dwc | – | 2025 |
| `dauerkultur_blatt#3` | 3 / 6 / – | B | Schaumstoffwürfel, Grösse unbelegt | `frankiesgarten-petersilie` | praxis | substrat_inert | – | – |
| `dauerkultur_blatt#4` | 3 / 5 / – | B | Schaumstoffwürfel, Grösse unbelegt | `frankiesgarten-hydroponik-einstieg` | praxis | substrat_inert | – | – |
| `dauerkultur_blatt#5` | 4 / – / – | B | Steinwollwürfel, Grösse unbelegt | `forkfarms-herb-guide-2025` | hersteller | substrat_inert | – | 2025 |

Nachrichtlich (nicht geprüft, Status `entwurf`): `dauerkultur_blatt#2`, Klasse D, 15 / – / –, ohne Quelle.

#### K-petersilie-06 (neu): Keimung, Dauer (`pw.petroselinum_crispum.keimung.dauer`)

Zwei abweichende Kandidaten, nur offener Wert (Pflichtgrösse, mindestens auf Ebene Art).

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `keimung.dauer#1` | offen | – / 7 / – | d | – | `frankiesgarten-keimtemperaturen` | C | substrat_inert | andere | – |
| `keimung.dauer#3` | offen | – / 14 / – | d | – | `vt-spes-466-2023` | B1 | substrat_inert | andere | 2023 |

#### K-petersilie-07 (neu): Keimung, Keimart (`pw.petroselinum_crispum.keimung.keimart`)

Drei Kandidaten mit zwei Werten, alle ladbar.

| `kandidat_id` | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `keimung.keimart#1` | pw | dunkel | – | – | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |
| `keimung.keimart#2` | pw | dunkel | – | – | `frankiesgarten-keimtemperaturen` | C | substrat_inert | andere | – |
| `keimung.keimart#3` | pw | licht | – | – | `vt-spes-466-2023` | B1 | substrat_inert | andere | 2023 |

#### K-petersilie-08 (neu): Keimung, Keimtemperatur (`pw.petroselinum_crispum.keimung.keimtemp`)

Zwei Kandidaten mit gleichem Wert, aber nur offen (`wert_typ` fehlt); Pflichtgrösse.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `keimung.keimtemp#1` | offen | 15 / – / 20 | °C | – | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |
| `keimung.keimtemp#2` | offen | 15 / – / 20 | °C | – | `frankiesgarten-keimtemperaturen` | C | substrat_inert | andere | – |

#### K-petersilie-09 (neu): Keimung, Lichtstunden (`pw.petroselinum_crispum.keimung.licht_h`)

Ein Kandidat, nur offener Wert (keine Pflichtgrösse).

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `keimung.licht_h#1` | offen | – / 10 / – | h | – | `vt-spes-466-2023` | B1 | substrat_inert | andere | 2023 |

#### K-petersilie-10 (neu): Anzucht, pH (`pw.petroselinum_crispum.anzucht.ph`)

Zwei abweichende Kandidaten, beide ladbar.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `anzucht.ph#1` | pw | 5.5 / 5.8 / 6.0 | pH | – | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |
| `anzucht.ph#2` | pw | 5.5 / 5.8 / 6.5 | pH | – | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |

#### K-petersilie-11 (neu): Anzucht, EC (`pw.petroselinum_crispum.anzucht.ec`)

Vier Kandidaten mit drei Werten, drei ladbar.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `anzucht.ec#1` | pw | 0.4 / – / 0.6 | mS/cm | unbekannt | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |
| `anzucht.ec#2` | pw | 0.6 / – / 0.8 | mS/cm | unbekannt | `frankiesgarten-hydroponik-einstieg` | C | substrat_inert | andere | – |
| `anzucht.ec#3` | pw | 0.4 / – / 0.6 | mS/cm | unbekannt | `frankiesgarten-faq` | C | substrat_inert | andere | – |
| `anzucht.ec#4` | offen | – / 0.4 / – | mS/cm | unbekannt | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |

#### K-petersilie-12 (neu): Anzucht, Wassertemperatur (`pw.petroselinum_crispum.anzucht.wassertemp`)

Zwei abweichende Kandidaten aus derselben Quelle (Anzuchtkarte gegen Fliesstext), beide ladbar.

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `anzucht.wassertemp#1` | pw | 18 / – / 22 | °C | – | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |
| `anzucht.wassertemp#2` | pw | 18 / – / 24 | °C | – | `frankiesgarten-petersilie` | C | substrat_inert | andere | – |

#### K-petersilie-13 (neu): Saatempfehlung `schnitt` (`se.petroselinum_crispum.schnitt`)

Ein Kandidat, nur offener Wert; die Kulturform ist nicht belegt (P39).

| `kandidat_id` | Samen je Schwamm / Obergrenze / stehen lassen | Klasse Saatmenge | Substrat | Quelle | Quellenklasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|
| `schnitt#1` | 3 / 5 / – | B | Schaumstoffwürfel, Grösse unbelegt | `frankiesgarten-hydroponik-einstieg` | praxis | substrat_inert | – | – |

### R2.2 Plausibilität

Umrechnung nur zur Prüfung: alle EC-Kandidaten in mS/cm (Faktor 1). Grenzen `kraut_ausdauernd`: pH 5.2 bis 7.0, EC 0.4 bis 2.0, Bandbreite 0.2 bis 1.2, Wassertemperatur 10 bis 28 °C, Licht 0 bis 24 h. Gegenprobe Petersilie nur Wachstum (1.3 mS/cm); für Anzucht nennt die Tabelle keinen Wert. Die Befunde P1 bis P19 aus Runde 1 gelten weiter. Kurze `kandidat_id` ohne Präfix `pw.petroselinum_crispum.` bzw. `se.petroselinum_crispum.`.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P20 | `anzucht.ph#2`, `wachstum.ph#4`, `anzucht.ec#1`, `anzucht.ec#2`, `wachstum.ec#7` | V1 (Spalten) | Kurzzitat mit Dezimalkomma | Das Kurzzitat enthält Kommas ohne Anführungszeichen (z. B. `5,5 und 6,5`, `0,4 bis 0,6`), dadurch hat die Zeile zwei bzw. drei Spalten zu viel und `konflikt_id`, `status` und die Werte dahinter sind für einen CSV-Leser verschoben. |
| P21 | `anzucht.ph#2`, `wachstum.ph#4` | Inhalt (9.1) | typ 5.8 | Das Kurzzitat «zwischen 5,5 und 6,5» nennt keinen Zielwert, `wert_typ` 5.8 ist an der Fundstelle nicht belegt. |
| P22 | `anzucht.ph#2`, `wachstum.ph#4` | Inhalt (9.1) | 5.5 bis 6.5 | Die Fundstelle gilt laut eigener Angabe für alle Pflanzen und Phasen, sie ist nicht artspezifisch; V3 und V5 (Band 1.0) hält der Wert ein. |
| P23 | `anzucht.ec#1`, `anzucht.ec#2` | Inhalt | 0.4 bis 0.6 und 0.6 bis 0.8 | Beide stammen aus derselben Düngestufen-Tabelle (Stufe «erste Blätter» und «Jungpflanze») und beschreiben nacheinander folgende Stufen der Anzucht, nicht zwei Alternativen; die Tabelle ist allgemein, nicht artspezifisch. |
| P24 | `anzucht.ec#3`, `wachstum.wassertemp#3` | Quelle | `frankiesgarten-faq` | Die Quelle ist in `quelle.csv` nur wegen des Titels verworfen und hier als geprüft behandelt; die Fundstelle ist allgemein («Salat und Kräuter» bzw. ohne Art). |
| P25 | `anzucht.ec#4` | V4, V5, Form 4.4.1 | Einzelwert 0.4 | Der Einzelwert liegt genau auf der Untergrenze 0.4, ein Band fehlt; laut `grund` nennt die Quelle für die Stufe Jungpflanze einen weiteren Einzelwert, der nicht als Kandidat erfasst ist. |
| P26 | `anzucht.ec#1` bis `#4` | Gegenprobe | Bandmitten 0.4 bis 0.7 | Für Petersilie in der Anzucht gibt es keinen Vergleichswert; alle Kandidaten liegen in V4, Bandbreiten 0.2 (V5 am Rand). |
| P27 | `wachstum.ec#7` | Inhalt (9.1) | 1.0 bis 1.3 | V4, V5 (0.3) und Gegenprobe (Bandmitte 1.15, −0.15) eingehalten; die Fundstelle ist eine allgemeine Düngestufen-Tabelle, nicht artspezifisch. |
| P28 | `wachstum.ec#8` | V5, Form 4.4.1 | Einzelwert 1.2 | Ein Band fehlt; die Gegenprobe besteht der Wert (−0.1), laut Fundstelle steigt die EC zur Ernte weiter an. |
| P29 | `anzucht.wassertemp#1`, `#2` | Inhalt | 18 bis 22 und 18 bis 24 °C | Dieselbe Seite nennt in Anzuchtkarte und Fliesstext zwei Obergrenzen; beide liegen in V7. |
| P30 | `wachstum.wassertemp#1` gegen `#2`, `#3` | Inhalt | 22 gegen 18 bis 22 °C | Der Versuchswert 22 °C liegt auf der Obergrenze der beiden ladbaren Kandidaten; `#2` und `#3` sind allgemeine Angaben ohne Artbezug. |
| P31 | `keimung.dauer#1` | V6, Form 4.4.1, Inhalt | Einzelwert 7 d | `wert_min` und `wert_max` fehlen; die Fundstelle nennt eine Eigenmessung bei 21 bis 23 °C, die nicht in `bezugstemperatur_c` steht und über der Keimtemperatur 15 bis 20 °C derselben Tabelle liegt. |
| P32 | `keimung.dauer#3` | V6, Form 4.4.1, 4.4.1 Bezug | Einzelwert 14 d | `wert_min` und `wert_max` fehlen, der Bezugspunkt der Tage (ab Saat oder ab Phasenbeginn) ist in der Quelle nicht genannt; der Wert ist doppelt so hoch wie `#1`. |
| P33 | `keimung.keimtemp#1`, `#2` | Form 4.4.1 | 15 bis 20 °C | `keimtemp` verlangt `wert_typ`, beide Kandidaten haben nur min und max. |
| P34 | `keimung.keimart#3` | Inhalt (9.1) | licht | Das Kurzzitat beschreibt eine bessere Keimung unter Licht im Laborversuch, keine Einordnung als Lichtkeimer; die beiden Praxisquellen nennen ausdrücklich «Dunkelkeimer». |
| P35 | `keimung.licht_h#1` | Form 4.4.1, V7 | Einzelwert 10 h | `wert_min` und `wert_max` fehlen, 10 h liegt in V7; eine Lichtdauer in der Keimung passt nur zu `keimart = licht` (`#3`) und hängt damit an K-07. |
| P36 | `wachstum.licht_h#3` | Form 4.4.1, V7 | 14 / 18 / – | `wert_max` fehlt; 18 h liegt in V7 und über den 16 h von `#1`, die Angabe gilt für alle Kräuter des Leitfadens. |
| P37 | `wachstum.bbch#1` | Inhalt | 14 bis 49 | Die Fundstelle nennt die Stadien 14 bis 19 und 41 bis 49, das Band schliesst die Hauptstadien 2 und 3 mit ein; Schnittlauch nutzt in derselben Gruppe 14 bis 19 (andere BBCH-Tafel). |
| P38 | `art.petroselinum_crispum.kulturformen_erlaubt#1`, `#2` | Entscheid 0018, R1.2 | `dauerkultur_blatt` | Beide Fundstellen vermerken, dass `schnitt` in keiner Quelle belegt ist; nach Entscheid 0018 entfällt die Form, abweichend von der dortigen Tabelle (`dauerkultur_blatt;schnitt`). |
| P39 | `schnitt#1` (Saatempfehlung) | V11 sinngemäss, R1.2 | 3 / 5 / – | Die Saatempfehlung gilt einer Kulturform, die in keinem Kandidaten von `kulturformen_erlaubt` steht, und die Quelle unterscheidet keine Kulturform. |
| P40 | `dauerkultur_blatt#3`, `#4`, `#5` | 4.5 Pflichtfelder | 3/6/–, 3/5/–, 4/–/– | `pflanzen_stehen_lassen` fehlt in allen drei, bei `#5` auch `obergrenze_samen`; `#4` und `#5` gelten für mehrere Kräuter, Klasse B stützt sich nur auf die gleiche Substratklasse, die Würfelgrösse ist unbelegt. |
| P41 | `dauerkultur_blatt#2` (nicht geprüft) | Entscheid 0018 | 15 / – / – | Hinweis: Die Entwurfszeile führt nur 15 Samen, Entscheid 0018 nennt für Petersilie 15 / 15 / 15; die Zeile ist nicht Teil dieser Prüfung. |

Ohne Befund: `anzucht.ph#1` und `wachstum.ph#3` (5.5 / 5.8 / 6.0, V3, V5 0.5, typ an der Fundstelle als Zielwert genannt); `anzucht.licht_h#1` (14 bis 16 h, allgemein); `keimung.bbch#1` (0 bis 9), `anzucht.bbch#1` (10 bis 13); `bluete.anwendbar#1` und `fruchtbildung_reife.anwendbar#1` (`entfaellt` nach R1.1); `kulturform_vorgabe#1` liegt in `kulturformen_erlaubt` (V11); `systemeignung` `dwc`; `ak.…dauerkultur_blatt.ernteart` `mehrfach` (V11 erlaubt dann `ernteintervall_d` und `schnitte_max`).

Vergleich in der Gruppe: Schnittlauch trägt aus denselben frankiesgarten-Seiten dieselben Werte für `anzucht.ph`, `anzucht.ec`, `wachstum.ec` (1.0 bis 1.3), `wassertemp` und `anzucht.licht_h`; die Gruppe ist darin stimmig. Schnittlauch hat für `keimart` nur «dunkel», Petersilie zusätzlich «licht» (K-07). Die Wachstums-EC der Gruppe streut von 1.0 bis 2.44 mS/cm; nur die frankiesgarten-Werte und `ec#5` bestehen die Gegenprobe.

### R2.3 Lückenliste nach Pflichtgrössen

Geschlossen seit Runde 1: `keimung.bbch`, `keimung.keimart` (mit Konflikt K-07), `anzucht.bbch`, `anzucht.ph` (K-10), `anzucht.ec` (K-11), `wachstum.bbch`, `wachstum.ph` und `wachstum.ec` (jetzt mit ladbaren Kandidaten, K-02 und K-01), `bluete.anwendbar`, `fruchtbildung_reife.anwendbar`, `kulturformen_erlaubt`, `kulturform_vorgabe`, `systemeignung`, `ak.dauerkultur_blatt.ernteart`.

**Profilwerte (03_import_w0.md 9), Klasse D, Prüfauftrag:**

| Nr. | Art | Phase | Grösse | Stand |
|---|---|---|---|---|
| L2-1 | Petersilie | keimung | `dauer` | nur offener Wert (K-06); mindestens auf Ebene Art |
| L2-2 | Petersilie | keimung | `keimtemp` | nur offener Wert (K-08) |
| L2-3 | Petersilie | anzucht | `dauer` | kein Kandidat (`#1`, `#2` verworfen); mindestens auf Ebene Art |
| L2-4 | Petersilie | wachstum | `dauer` | kein Kandidat; mindestens auf Ebene Art |
| L2-5 | Petersilie | wachstum | `wechselmerkmal` | entfällt für die Art (letzte anwendbare Phase), fehlt aber als Mindestzeile der Gruppe (4.4.2, V13) |

Keine Pflicht, Standardprofil als Prüfauftrag: `keimung.wassertemp` (kein Kandidat), `keimung.licht_h` (nur offen, K-09), `wachstum.licht_h` (nur offen, K-04). Als Leitkultur fehlen damit für `kraut_ausdauernd` die Mindestzeilen `dauer` in allen drei anwendbaren Phasen und `wechselmerkmal` im Wachstum (V13 bricht ab).

**Stammfelder:** keine Lücke.

**Artmerkmale (4.3.2):**

| Nr. | Art | Feld | Bemerkung |
|---|---|---|---|
| L2-6 | Petersilie | `samentyp` | im Auftrag Runde 2 |
| L2-7 | Petersilie | `standard_keimfaehigkeit` | im Auftrag; an neue Arten vererbt |
| L2-8 | Petersilie | `umsetzen_ab_d` | im Auftrag; an neue Arten vererbt |
| L2-9 | Petersilie | `umsetzen_bis_d` | im Auftrag; an neue Arten vererbt |
| L2-10 | Petersilie | `liter_je_pflanze` | |
| L2-11 | Petersilie | `wasserbedarf_je_pflanze_l` | Leitkultur (R2.3) |
| L2-12 | Petersilie | `pflanzen_je_m2` | |
| L2-13 | Petersilie | `wuchshoehe_max_mm` | |
| L2-14 | Petersilie | `wuchsform` | |
| L2-15 | Petersilie | `photoperiode` | |
| L2-16 | Petersilie | `kritische_tageslaenge_h` | nur bei `langtag` oder `kurztag` |
| L2-17 | Petersilie | `bestaeubung_noetig` | |
| L2-18 | Petersilie | `pythium` | |
| L2-19 | Petersilie | `schossen_handlung` | |

**Kulturform-Felder (4.3.3), erlaubte Form `dauerkultur_blatt`:**

| Nr. | Art | Kulturform | Feld | Bemerkung |
|---|---|---|---|---|
| L2-20 | Petersilie | dauerkultur_blatt | `ernte_ab_d` | |
| L2-21 | Petersilie | dauerkultur_blatt | `ernteintervall_d` | bei `ernteart = mehrfach` |
| L2-22 | Petersilie | dauerkultur_blatt | `schnitte_max` | bei `ernteart = mehrfach` |
| L2-23 | Petersilie | dauerkultur_blatt | `kulturdauer_max_d` | |
| L2-24 | Petersilie | dauerkultur_blatt | `kulturdauer_typisch_d` | |
| L2-25 | Petersilie | dauerkultur_blatt | `entspitzen` | |

`schnitt` ist nicht erlaubt (P38), daher keine Lücken für ihre Felder; der Kandidat `se.petroselinum_crispum.schnitt#1` hängt ohne Kulturform (K-13, P39).

**Saatempfehlungen je erlaubter Kulturform:**

| Nr. | Art | Kulturform | Stand |
|---|---|---|---|
| L2-26 | Petersilie | dauerkultur_blatt | nur offener Wert (K-05); kein ladbarer Kandidat, weil `pflanzen_stehen_lassen` bzw. `obergrenze_samen` fehlen |

Summe: 26 Einträge, davon 23 ohne Kandidat und 3 nur mit offenem Wert (L2-1, L2-2, L2-26). Folge für das Laden (8.4) wie in 3.6: ohne `dauer` in allen anwendbaren Phasen lädt der Seed weder `profilwert` noch Kulturform-Felder noch Saatempfehlung der Petersilie; die Keimungszeilen `keimart` gehen vorab, `keimtemp` und `dauer` erst mit ladbarem Kandidaten.

### R2.4 Bestätigungen

| Wert | Kandidaten | Bemerkung |
|---|---|---|
| `kulturformen_erlaubt` = `dauerkultur_blatt` | `#1` (`vt-spes-466-2023`, B1), `#2` (`frankiesgarten-petersilie`, C) | unabhängige Quellen |
| `systemeignung` = `dwc` | `#1` (`vt-spes-466-2023`, B1), `#2` (`isu-ph-kraeuter-2025`, B1) | unabhängige Quellen |
| `ak.dauerkultur_blatt.ernteart` = `mehrfach` | `#1` (`vt-spes-466-2023`, B1), `#2` (`frankiesgarten-petersilie`, C) | unabhängige Quellen |
| `wachstum.wassertemp` 18 bis 22 °C | `#2`, `#3` (innerhalb K-03) | zwei Seiten derselben Website |
| `anzucht.ec` 0.4 bis 0.6 mS/cm | `#1`, `#3` (innerhalb K-11) | zwei Seiten derselben Website |
| `keimung.keimart` = `dunkel` | `#1`, `#2` (innerhalb K-07) | zwei Seiten derselben Website |
| `keimung.keimtemp` 15 bis 20 °C | `#1`, `#2` (K-08, nur offen) | zwei Seiten derselben Website |

Teilübereinstimmungen ohne Wertung: `wachstum.ec#8` (1.2) liegt in `#7` (1.0 bis 1.3); `anzucht.ec#4` (0.4) ist Untergrenze von `#1` und `#3`; `wachstum.ph#3` liegt innerhalb `#4`, beide teilen min 5.5 und typ 5.8; Saatempfehlung `#3` und `#4` teilen `samen_je_schwamm` 3.
