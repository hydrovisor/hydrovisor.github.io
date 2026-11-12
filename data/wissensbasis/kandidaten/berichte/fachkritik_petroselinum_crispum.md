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
