# Fachkritik Tomate (`solanum_lycopersicum`)

W0-Probelauf, Issue #184, 12.11.2026. Kulturgruppe `fruchtgemuese` (Leitkultur), Ordner `data/wissensbasis/kandidaten/teile/fruchtgemuese/`. Kulturform im Auftrag: `dauerkultur_frucht` (Sorten Vilma F1, Balconi Red, Ampelo Gelb F1, Tumbling Tom, Balconi Yellow; DWC, Anzucht im 8-cm-Topf).

Grundlage: Konzept v1.6 9.1, 9.3, 9.4, R1.1; `docs/spec/03_import_w0.md` 4.4, 6, 7 (V3 bis V13, Gegenprobe), 9. Gesichtet sind nur Zeilen mit `status = geprueft` der Tomate in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv` (keine Tomaten-Zeile) und `quelle.csv`; `saatempfehlung_offen.csv` gibt es in dieser Kulturgruppe nicht. Geschrieben ist nur die Spalte `konflikt_id` (22 Zeilen, 11 Konflikte).

Gegenprobe: Basis `gesamt` und `unbekannt` gerechnet wie gesamt (Konzept 8.3), ECWasser 0.5 nur bei Basis `zuwachs` (kommt bei der Tomate nicht vor); alle Rohwerte sind in mS/cm, eine Umrechnung entfällt. Vergleichswerte Tomate: Anzucht 1.0, Wachstum 1.5, Blüte 1.9, Fruchtbildung 2.1 mS/cm.

## 1 Konfliktliste

Spalte «Datei»: `pw` = `profilwert.csv` (ladbar), `offen` = `profilwert_offen.csv` (belegt, Form des Validators nicht erfüllt; Grund in Klammern). Klasse = Evidenzklasse. Konflikte «nur offener Wert» haben keinen ladbaren Kandidaten; übernehmen kann ihn nur Tim über «eigener Wert» (ablauf.md Annahme 5).

### K-tomate-01 · Tomate · Keimung · `dauer` · nur offener Wert

| kandidat_id | Datei | Wert (Tage) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.keimung.dauer#2` | offen (Einzelwert) | typ 14 | Tage ab Saat bis Auflaufen | – | `ua-tomato-workshop-modul2-2026` | B1 | substrat_inert | gewaechshaus | 2026 |

### K-tomate-02 · Tomate · Keimung · `wechselmerkmal`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.keimung.wechselmerkmal#1` | pw | «Sind die Keimblätter vollständig entfaltet?» (BBCH 10) | – | – | `bbch-monografie-2001` | B1 | keine | andere | 2001 |
| `pw.solanum_lycopersicum.keimung.wechselmerkmal#2` | pw | «Ist das erste echte Laubblatt entfaltet?» (BBCH 11) | – | – | `ua-ceac-kurs-kap6` | B1 | substrat_inert | gewaechshaus | – |

### K-tomate-03 · Tomate · Anzucht · `dauer` · nur offener Wert

| kandidat_id | Datei | Wert (Tage) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.dauer#2` | offen (Einzelwert) | typ 21 (Tag 35 Transplant minus Tag 14 Auflaufen) | Tage ab Phasenbeginn | – | `ua-tomato-workshop-modul2-2026` | B1 | substrat_inert | gewaechshaus | 2026 |

### K-tomate-04 · Tomate · Anzucht · `ec` · nur offener Wert

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.ec#2` | offen (Einzelwert) | typ 2.0 | mS/cm | unbekannt | `osu-hyg1437-2018` | B1 | substrat_inert | gewaechshaus | 2018 |

### K-tomate-05 · Tomate · Anzucht · `wechselmerkmal`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.wechselmerkmal#1` | pw | «Hat die Jungpflanze fünf bis sechs echte Blätter?» | – | – | `aces-anr2954-2023` | B1 | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.anzucht.wechselmerkmal#2` | pw | «Hat der Sämling mehrere echte Blätter und wachsen Wurzeln durch das Substrat?» | – | – | `ua-tomato-workshop-modul2-2026` | B1 | substrat_inert | gewaechshaus | 2026 |

### K-tomate-06 · Tomate · Wachstum · `ph`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.wachstum.ph#1` | pw | 5.8 bis 6.2 | pH | – | `ufifas-hs796-2024` | B1 | substrat_inert | gewaechshaus | 2024 |
| `pw.solanum_lycopersicum.wachstum.ph#2` | pw | 5.8 bis 6.5 | pH | – | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |

### K-tomate-07 · Tomate · Wachstum · `ec`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.wachstum.ec#1` | pw | 1.2 bis 1.4 | mS/cm | gesamt | `johr-singletruss-ec-2023` | A | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.wachstum.ec#2` | offen (Einzelwert) | typ 2.0 | mS/cm | unbekannt | `osu-hyg1437-2018` | B1 | substrat_inert | gewaechshaus | 2018 |
| `pw.solanum_lycopersicum.wachstum.ec#3` | offen (Band 2.0 breit, Obergrenze 4.0 über 2.6) | 2.0 bis 4.0 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |

### K-tomate-08 · Tomate · Blüte · `ph`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.bluete.ph#1` | pw | 5.8 bis 6.2 | pH | – | `ufifas-hs796-2024` | B1 | substrat_inert | gewaechshaus | 2024 |
| `pw.solanum_lycopersicum.bluete.ph#2` | pw | 5.8 bis 6.5 | pH | – | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |

### K-tomate-09 · Tomate · Blüte · `ec`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.bluete.ec#1` | pw | 1.2 bis 1.4 | mS/cm | gesamt | `johr-singletruss-ec-2023` | A | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.bluete.ec#2` | offen (Band 2.0 breit, Obergrenze 4.0 über 2.6) | 2.0 bis 4.0 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |

### K-tomate-10 · Tomate · Fruchtbildung und Reife · `ph`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.fruchtbildung_reife.ph#1` | pw | 5.8 bis 6.2 | pH | – | `ufifas-hs796-2024` | B1 | substrat_inert | gewaechshaus | 2024 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ph#2` | pw | 5.8 bis 6.5 | pH | – | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |

### K-tomate-11 · Tomate · Fruchtbildung und Reife · `ec`

| kandidat_id | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#1` | pw | 1.2 bis 1.4 | mS/cm | gesamt | `johr-singletruss-ec-2023` | A | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#2` | offen (Band 2.0 breit, Obergrenze 4.0 über 2.6) | 2.0 bis 4.0 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#3` | offen (Einzelwert) | typ 2.4 | mS/cm | unbekannt | `osu-hyg1437-2018` | B1 | substrat_inert | gewaechshaus | 2018 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#4` | offen (Obergrenze 3.5 über 2.6) | 2.5 bis 3.5 | mS/cm | unbekannt | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |

Ohne Konflikt (genau ein geprüfter Kandidat): `anwendbar` in allen fünf Phasen (`ja`), `bbch` in allen fünf Phasen, `wechselmerkmal` in Wachstum und Blüte, `keimtemp`, `anzucht.ph#1`, die vier Stammfelder und `ak.solanum_lycopersicum.dauerkultur_frucht.ernteart#1` (`mehrfach`).

## 2 Plausibilität

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P01 | `pw.solanum_lycopersicum.keimung.dauer#2` | V6 (Form) | typ 14, min und max leer | Ohne `wert_min` und `wert_max` ist min ≤ typ ≤ max nicht prüfbar, deshalb steht der Wert offen. |
| P02 | `pw.solanum_lycopersicum.keimung.dauer#2` | Vergleich Kulturgruppe | 14 Tage | Der Wert ist der Rasterpunkt «Woche 2» einer Zeitplanfolie und liegt über dem Chili-Kandidaten 7 bis 10 Tage (Alberta), während Chili aus derselben Folie ebenfalls 14 erhält. |
| P03 | `pw.solanum_lycopersicum.keimung.keimtemp#1` | Format 4.4.1 | 23 bis 25 °C, typ leer | `wert_typ` fehlt (Validator prüft das nicht), und das Zitat «Germination and post-emergence temps» nennt nicht, ob Luft- oder Substrattemperatur gemeint ist; gegen Chili 25 bis 26 °C plausibel. |
| P04 | `pw.solanum_lycopersicum.keimung.wechselmerkmal#2` | Abgleich BBCH | erstes echtes Laubblatt (BBCH 11) | Das Merkmal liegt innerhalb des Anzucht-Bereichs BBCH 10 bis 19 aus `anzucht.bbch#1`, Kandidat #1 (BBCH 10) dagegen genau an dessen Beginn; betrifft K-tomate-02. |
| P05 | `pw.solanum_lycopersicum.anzucht.bbch#1` | Abgleich Wechselmerkmal | BBCH 10 bis 19 | Der Wechsel zu Wachstum liegt laut `anzucht.wechselmerkmal#1` bei fünf bis sechs Blättern (BBCH 15 bis 16), Wachstum beginnt laut `wachstum.bbch#1` bei 21, sodass BBCH 17 bis 20 zwei Phasen oder keiner zugeordnet sind. |
| P06 | `pw.solanum_lycopersicum.anzucht.dauer#2` | V6 (Form) | typ 21, min und max leer | Einzelwert ohne Bereich, deshalb offen. |
| P07 | `pw.solanum_lycopersicum.anzucht.dauer#2` | Herleitung | 21 Tage | Der Wert ist die Differenz zweier Rasterpunkte (Tag 35 minus Tag 14) einer Wochenfolie und für Chili aus derselben Folie gleich; die Umrechnung des Bezugspunkts ist nach 4.4.1 zulässig, ein gemessener Tageswert ist es nicht. |
| P08 | `pw.solanum_lycopersicum.anzucht.ph#1` | V3, V5 | 5.6 bis 5.8 | Innerhalb 5.2 bis 7.0, Bandbreite 0.2 genau an der Untergrenze. |
| P09 | `pw.solanum_lycopersicum.anzucht.ph#1` | Bezug der Fundstelle | 5.6 bis 5.8 | Derselbe Satz beschreibt die einmalige Sättigung der Steinwollblöcke beim Umsetzen; die EC aus diesem Satz (`anzucht.ec#1`) hat der Methodenprüfer als «kein Sollbereich der Nährlösung in der Anzucht» verworfen, der pH aus demselben Satz ist zugelassen (Klasse B2, Hersteller). |
| P10 | `pw.solanum_lycopersicum.anzucht.ec#2` | V5 (Form) | typ 2.0 | Einzelwert ohne Band, deshalb offen. |
| P11 | `pw.solanum_lycopersicum.anzucht.ec#2` | Gegenprobe | Mitte 2.0 gegen 1.0 | Abweichung 1.0 mS/cm, über 0.4. |
| P12 | `pw.solanum_lycopersicum.anzucht.ec#2` | Phasenbezug | Stage 1 | Stage 1 reicht laut Fundstelle vom Auflaufen bis zum zweiten Blütenstand mit offenen Blüten, deshalb trägt derselbe Wert Anzucht (#2) und Wachstum (`wachstum.ec#2`). |
| P13 | `pw.solanum_lycopersicum.wachstum.bbch#1` | Fussnote der Fundstelle | BBCH 21 bis 59 | Hauptstadium 2 gilt laut Fussnote 1 nur für Tomaten mit begrenztem Wuchs; ob die fünf Sorten begrenzt wachsen, steht nicht in den Kandidaten. |
| P14 | `pw.solanum_lycopersicum.wachstum.ec#1` | V4, V5, Gegenprobe, Phasenbezug | 1.2 bis 1.4 gesamt | Innerhalb 0.4 bis 2.6, Band 0.2 an der Grenze, Mitte 1.3 gegen 1.5 (0.2) ohne Gegenprobe-Konflikt; die Quelle empfiehlt das Band für die ganze Kultur im Ein-Fruchtstand-System, es steht deshalb gleich in Wachstum, Blüte und Fruchtbildung, während Tims Kulturform eine Dauerkultur ist. |
| P15 | `pw.solanum_lycopersicum.wachstum.ec#2` | V5 (Form) | typ 2.0 | Einzelwert ohne Band, deshalb offen. |
| P16 | `pw.solanum_lycopersicum.wachstum.ec#2` | Gegenprobe | Mitte 2.0 gegen 1.5 | Abweichung 0.5 mS/cm, über 0.4. |
| P17 | `pw.solanum_lycopersicum.wachstum.ec#3` | V4 | 2.0 bis 4.0 | Obergrenze 4.0 über 2.6 mS/cm. |
| P18 | `pw.solanum_lycopersicum.wachstum.ec#3` | V5 | Band 2.0 | Bandbreite über 1.2. |
| P19 | `pw.solanum_lycopersicum.wachstum.ec#3` | Gegenprobe | Mitte 3.0 gegen 1.5 | Abweichung 1.5 mS/cm, über 0.4; Tabelle ohne Phasenangabe und Umgebung `andere`. |
| P20 | `pw.solanum_lycopersicum.bluete.ec#1` | Gegenprobe | Mitte 1.3 gegen 1.9 | Abweichung 0.6 mS/cm, über 0.4 (ladbarer Kandidat). |
| P21 | `pw.solanum_lycopersicum.bluete.ec#2` | V4 | 2.0 bis 4.0 | Obergrenze 4.0 über 2.6 mS/cm. |
| P22 | `pw.solanum_lycopersicum.bluete.ec#2` | V5 | Band 2.0 | Bandbreite über 1.2. |
| P23 | `pw.solanum_lycopersicum.bluete.ec#2` | Gegenprobe | Mitte 3.0 gegen 1.9 | Abweichung 1.1 mS/cm, über 0.4. |
| P24 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#1` | Gegenprobe | Mitte 1.3 gegen 2.1 | Abweichung 0.8 mS/cm, über 0.4 (ladbarer Kandidat). |
| P25 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#2` | V4 | 2.0 bis 4.0 | Obergrenze 4.0 über 2.6 mS/cm. |
| P26 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#2` | V5 | Band 2.0 | Bandbreite über 1.2. |
| P27 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#2` | Gegenprobe | Mitte 3.0 gegen 2.1 | Abweichung 0.9 mS/cm, über 0.4. |
| P28 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#3` | V5 (Form) | typ 2.4 | Einzelwert ohne Band, deshalb offen; Gegenprobe 2.4 gegen 2.1 (0.3) ohne Konflikt. |
| P29 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#3` | Phasenbezug | Stage 3 | Stage 3 beginnt laut Fundstelle erst nach dem fünften Blütenstand mit offener Blüte und deckt damit nur den späten Teil der Phase ab. |
| P30 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#4` | V4 | 2.5 bis 3.5 | Obergrenze 3.5 über 2.6 mS/cm (Band 1.0 innerhalb V5). |
| P31 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#4` | Gegenprobe | Mitte 3.0 gegen 2.1 | Abweichung 0.9 mS/cm, über 0.4. |
| P32 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#4` | System der Quelle | Drip EC | Der Wert ist die Tropf-EC einer Substratkultur mit Drainage («drain ~1 unit higher») und nicht die EC einer stehenden Lösung wie im DWC. |
| P33 | `pw.solanum_lycopersicum.bluete.ec#1`, `pw.solanum_lycopersicum.fruchtbildung_reife.ec#1` | Vergleich Kulturgruppe | 1.2 bis 1.4 | Das Band liegt in Blüte und Fruchtbildung unter allen geprüften Chili-Kandidaten ausser `okstate-hla6722-2016` (0.8 bis 1.8), die übrigen Chili-Kandidaten liegen bei 2.5 bis 3.5. |

Ohne Befund: `wachstum.ph`, `bluete.ph`, `fruchtbildung_reife.ph` #1 und #2 (innerhalb V3, Bandbreite 0.4 bzw. 0.7 innerhalb V5; Chili 5.8 bis 6.1 vergleichbar); alle `wechselmerkmal` unter 120 Zeichen (V10); `einheit_quelle` und `ec_basis` genau bei `ec` gesetzt (V8); `anwendbar = ja` in allen fünf Phasen entspricht R1.1 für Fruchtgemüse; `bbch` 0 bis 99; `ernteart = mehrfach` mit Quelle zur Ernte über mehrere Monate plausibel. Keine Kandidaten für `wassertemp` und `licht_h`, daher keine Prüfung V7.

## 3 Lückenliste

Klasse D, Prüfauftrag; keine geprüften Kandidaten, auch nicht in `profilwert_offen.csv`.

### 3.1 Pflichtgrössen (03_import_w0.md 9)

| Art | Phase | Grösse |
|---|---|---|
| Tomate | Keimung | `keimart` |
| Tomate | Wachstum | `dauer` |
| Tomate | Blüte | `dauer` |
| Tomate | Fruchtbildung und Reife | `dauer` |

`wechselmerkmal` in Fruchtbildung und Reife entfällt (letzte anwendbare Phase). Folge nach 03_import_w0.md 8.4: Ohne `dauer` in Wachstum, Blüte und Fruchtbildung lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Tomate nicht; Keimung `dauer` hängt an K-tomate-01 (nur offener Wert).

Nicht Pflicht, aber Prüfauftrag ohne Wert auf Art (03_import_w0.md 9): `wassertemp` und `licht_h` fehlen in allen fünf Phasen.

### 3.2 Stammfelder

Keine Lücke (`name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id` geprüft).

### 3.3 Artmerkmale (4.3.2)

| Art | Feld |
|---|---|
| Tomate | `samentyp` |
| Tomate | `standard_keimfaehigkeit` |
| Tomate | `systemeignung` |
| Tomate | `liter_je_pflanze` |
| Tomate | `wasserbedarf_je_pflanze_l` |
| Tomate | `pflanzen_je_m2` |
| Tomate | `wuchshoehe_max_mm` |
| Tomate | `wuchsform` |
| Tomate | `photoperiode` |
| Tomate | `kritische_tageslaenge_h` (nur bei `langtag` oder `kurztag`; offen, solange `photoperiode` fehlt) |
| Tomate | `bestaeubung_noetig` |
| Tomate | `pythium` |
| Tomate | `schossen_handlung` |
| Tomate | `aussaatfenster_outdoor` (optional) |
| Tomate | `umsetzen_ab_d` |
| Tomate | `umsetzen_bis_d` |
| Tomate | `kulturformen_erlaubt` |
| Tomate | `kulturform_vorgabe` |

`keimlinge_je_knaeuel` entfällt (keine Knäuelsaat). Weil die Tomate Leitkultur ist, fehlen `kulturformen_erlaubt`, `kulturform_vorgabe`, `umsetzen_ab_d`, `umsetzen_bis_d`, `systemeignung` und `standard_keimfaehigkeit` auch für die Übernahme durch neue Arten der Gruppe (4.4.2).

### 3.4 Kulturform-Felder `dauerkultur_frucht` (4.3.3)

| Art | Kulturform | Feld |
|---|---|---|
| Tomate | `dauerkultur_frucht` | `ernte_ab_d` |
| Tomate | `dauerkultur_frucht` | `ernteintervall_d` (gilt, da `ernteart = mehrfach`) |
| Tomate | `dauerkultur_frucht` | `schnitte_max` (gilt, da `ernteart = mehrfach`) |
| Tomate | `dauerkultur_frucht` | `kulturdauer_max_d` |
| Tomate | `dauerkultur_frucht` | `kulturdauer_typisch_d` |
| Tomate | `dauerkultur_frucht` | `entspitzen` |

### 3.5 Saatempfehlung `se.solanum_lycopersicum.dauerkultur_frucht` (Hinweis, keine Lücke dieser Liste)

Kein Kandidat in `saatempfehlung.csv`, keine Datei `saatempfehlung_offen.csv`. Die Klasse-D-Zeile nach Tims Entscheid «1 Pflanze je Topf» (R12.3) legt der Koordinator an. Der Entscheid nennt diese Pflichtfelder nicht: `samen_je_schwamm`, `obergrenze_samen`, `substrat_passung`. `pflanzen_stehen_lassen = 1` folgt aus dem Entscheid nur, wenn «Topf» den Anzuchtplatz meint; die Anzucht im 8-cm-Topf statt im Würfel 2.2 cm gehört in `substrat_passung`.

## 4 Bestätigungen

Keine. Kein Wert der Tomate ist durch zwei verschiedene Quellen mit gleichem Wert belegt. `ufifas-hs796-2024` und `ua-ceac-kurs-kap10` stimmen beim pH nur in der Untergrenze 5.8 überein (K-tomate-06, -08, -10). Dieselbe Quelle über mehrere Phasen (`johr-singletruss-ec-2023`, `okstate-hla6722-2016`, `osu-hyg1437-2018` Stage 1) zählt nicht als Bestätigung.

## 5 Zahlen

- Konflikte: 11 (8 mit mehreren Kandidaten, 3 «nur offener Wert»: K-tomate-01, -03, -04).
- Plausibilitätsbefunde: 33 (Validatorverstösse der offenen Kandidaten V4: 4, V5: 6, V6: 2; Gegenprobe über 0.4: 8 Kandidaten, davon ladbar `bluete.ec#1` und `fruchtbildung_reife.ec#1`).
- Lücken: 28 (4 Pflichtgrössen, 18 Artmerkmale davon 2 bedingt oder optional, 6 Kulturform-Felder); dazu `wassertemp` und `licht_h` in allen Phasen als Prüfauftrag ohne Pflicht.

## Runde 2 (12.11.2026)

W0 Runde 2, Issue #188. Kulturform nach Entscheid 0018 nur `dauerkultur_frucht`. Gesichtet sind alle Tomaten-Zeilen mit `status = geprueft` oder `vorgeschlagen` in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv` und ihre Quellen in `quelle.csv`. Die Quelle `frankiesgarten-faq` steht in `quelle.csv` nur wegen eines abweichenden Titels auf `verworfen` und ist auftragsgemäss wie geprüft behandelt (der Lead korrigiert den Titel).

Nicht berücksichtigt, weil der Kandidat selbst `verworfen` oder `entwurf` ist: `wachstum.ec#6`, `bluete.ec#4`, `fruchtbildung_reife.ec#6` (`uh-kratky-tomaten-2005`, Einheit «mS»), `keimung.dauer#1`, `#5`, `anzucht.dauer#1`, `#3`, `anzucht.ec#1`, `#4`, `wachstum.dauer#1`, `bluete.dauer#1`, `fruchtbildung_reife.dauer#1`, `ph#3` in drei Phasen, `art.solanum_lycopersicum.standard_keimfaehigkeit#1` sowie `se.solanum_lycopersicum.dauerkultur_frucht#1` (Klasse D, `entwurf`).

Geschrieben ist nur die Spalte `konflikt_id`: 25 Zeilen (18 in `profilwert.csv`, 7 in `profilwert_offen.csv`). Die IDs aus Runde 1 sind unverändert; neue Kandidaten bestehender Konflikte tragen deren ID, neue Konflikte sind K-tomate-12 bis -16. Gegenprobe wie in Runde 1 (Basis `unbekannt` wie gesamt, Vergleichswerte Anzucht 1.0, Wachstum 1.5, Blüte 1.9, Fruchtbildung 2.1 mS/cm); alle Rohwerte stehen in mS/cm.

### R2.1 Konfliktliste (alle offenen Konflikte)

Spalte «R»: Runde, in der der Kandidat dazukam. Datei wie in Abschnitt 1 (`pw` ladbar, `offen` mit Grund).

#### K-tomate-01 · Tomate · Keimung · `dauer` · nur offener Wert

| kandidat_id | R | Datei | Wert (Tage) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.keimung.dauer#2` | 1 | offen (Einzelwert) | typ 14 | Tage ab Saat bis Auflaufen | – | `ua-tomato-workshop-modul2-2026` | B1 | substrat_inert | gewaechshaus | 2026 |
| `pw.solanum_lycopersicum.keimung.dauer#3` | 2 | offen (Bereich ohne typ) | 6 bis 10 | Tage | – | `frankiesgarten-tomaten` | C | substrat_inert | andere | – |
| `pw.solanum_lycopersicum.keimung.dauer#4` | 2 | offen (Bereich ohne typ) | 6 bis 10 | Tage | – | `frankiesgarten-keimtabelle` | C | substrat_inert | andere | – |

#### K-tomate-02 · Tomate · Keimung · `wechselmerkmal` (unverändert)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.keimung.wechselmerkmal#1` | 1 | pw | «Sind die Keimblätter vollständig entfaltet?» (BBCH 10) | – | – | `bbch-monografie-2001` | B1 | keine | andere | 2001 |
| `pw.solanum_lycopersicum.keimung.wechselmerkmal#2` | 1 | pw | «Ist das erste echte Laubblatt entfaltet?» (BBCH 11) | – | – | `ua-ceac-kurs-kap6` | B1 | substrat_inert | gewaechshaus | – |

#### K-tomate-03 · Tomate · Anzucht · `dauer` · nur offener Wert (unverändert)

| kandidat_id | R | Datei | Wert (Tage) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.dauer#2` | 1 | offen (Einzelwert) | typ 21 (Tag 35 minus Tag 14) | Tage ab Phasenbeginn | – | `ua-tomato-workshop-modul2-2026` | B1 | substrat_inert | gewaechshaus | 2026 |

#### K-tomate-04 · Tomate · Anzucht · `ec` (jetzt mit ladbarem Kandidaten)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.ec#2` | 1 | offen (Einzelwert) | typ 2.0 | mS/cm | unbekannt | `osu-hyg1437-2018` | B1 | substrat_inert | gewaechshaus | 2018 |
| `pw.solanum_lycopersicum.anzucht.ec#3` | 2 | pw | 0.4 bis 1.3 | mS/cm | unbekannt | `frankiesgarten-tomaten` | C | dwc | indoor_led | – |

#### K-tomate-05 · Tomate · Anzucht · `wechselmerkmal` (unverändert)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.wechselmerkmal#1` | 1 | pw | «Hat die Jungpflanze fünf bis sechs echte Blätter?» | – | – | `aces-anr2954-2023` | B1 | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.anzucht.wechselmerkmal#2` | 1 | pw | «Hat der Sämling mehrere echte Blätter und wachsen Wurzeln durch das Substrat?» | – | – | `ua-tomato-workshop-modul2-2026` | B1 | substrat_inert | gewaechshaus | 2026 |

#### K-tomate-06 · Tomate · Wachstum · `ph`

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.wachstum.ph#1` | 1 | pw | 5.8 bis 6.2 | pH | – | `ufifas-hs796-2024` | B1 | substrat_inert | gewaechshaus | 2024 |
| `pw.solanum_lycopersicum.wachstum.ph#2` | 1 | pw | 5.8 bis 6.5 | pH | – | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |
| `pw.solanum_lycopersicum.wachstum.ph#4` | 2 | pw | 5.8 bis 6.2 | pH | – | `frankiesgarten-tomaten` | C | nft | gewaechshaus | – |
| `pw.solanum_lycopersicum.wachstum.ph#5` | 2 | pw | 5.5 bis 6.0 | pH | – | `forkfarms-minitomaten-2026` | B2 | nft | indoor_led | 2026 |

#### K-tomate-07 · Tomate · Wachstum · `ec`

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.wachstum.ec#1` | 1 | pw | 1.2 bis 1.4 | mS/cm | gesamt | `johr-singletruss-ec-2023` | A | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.wachstum.ec#2` | 1 | offen (Einzelwert) | typ 2.0 | mS/cm | unbekannt | `osu-hyg1437-2018` | B1 | substrat_inert | gewaechshaus | 2018 |
| `pw.solanum_lycopersicum.wachstum.ec#3` | 1 | offen (Band 2.0 breit, Obergrenze 4.0 über 2.6) | 2.0 bis 4.0 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |
| `pw.solanum_lycopersicum.wachstum.ec#4` | 2 | pw | 1.4 bis 2.0 | mS/cm | unbekannt | `frankiesgarten-tomaten` | C | nft | gewaechshaus | – |
| `pw.solanum_lycopersicum.wachstum.ec#5` | 2 | offen (Einzelwert) | typ 1.9 | mS/cm | unbekannt | `frankiesgarten-faq` | C | nft | andere | – |

#### K-tomate-08 · Tomate · Blüte · `ph`

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.bluete.ph#1` | 1 | pw | 5.8 bis 6.2 | pH | – | `ufifas-hs796-2024` | B1 | substrat_inert | gewaechshaus | 2024 |
| `pw.solanum_lycopersicum.bluete.ph#2` | 1 | pw | 5.8 bis 6.5 | pH | – | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |
| `pw.solanum_lycopersicum.bluete.ph#4` | 2 | pw | 5.8 bis 6.2 | pH | – | `frankiesgarten-tomaten` | C | nft | gewaechshaus | – |
| `pw.solanum_lycopersicum.bluete.ph#5` | 2 | pw | 5.5 bis 6.0 | pH | – | `forkfarms-minitomaten-2026` | B2 | nft | indoor_led | 2026 |

#### K-tomate-09 · Tomate · Blüte · `ec`

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.bluete.ec#1` | 1 | pw | 1.2 bis 1.4 | mS/cm | gesamt | `johr-singletruss-ec-2023` | A | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.bluete.ec#2` | 1 | offen (Band 2.0 breit, Obergrenze 4.0 über 2.6) | 2.0 bis 4.0 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |
| `pw.solanum_lycopersicum.bluete.ec#3` | 2 | pw | 2.0 bis 2.5 | mS/cm | unbekannt | `frankiesgarten-tomaten` | C | nft | gewaechshaus | – |

#### K-tomate-10 · Tomate · Fruchtbildung und Reife · `ph`

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.fruchtbildung_reife.ph#1` | 1 | pw | 5.8 bis 6.2 | pH | – | `ufifas-hs796-2024` | B1 | substrat_inert | gewaechshaus | 2024 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ph#2` | 1 | pw | 5.8 bis 6.5 | pH | – | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ph#4` | 2 | pw | 5.8 bis 6.2 | pH | – | `frankiesgarten-tomaten` | C | nft | gewaechshaus | – |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ph#5` | 2 | pw | 5.5 bis 6.0 | pH | – | `forkfarms-minitomaten-2026` | B2 | nft | indoor_led | 2026 |

#### K-tomate-11 · Tomate · Fruchtbildung und Reife · `ec`

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#1` | 1 | pw | 1.2 bis 1.4 | mS/cm | gesamt | `johr-singletruss-ec-2023` | A | substrat_inert | gewaechshaus | 2023 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#2` | 1 | offen (Band 2.0 breit, Obergrenze 4.0 über 2.6) | 2.0 bis 4.0 | mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#3` | 1 | offen (Einzelwert) | typ 2.4 | mS/cm | unbekannt | `osu-hyg1437-2018` | B1 | substrat_inert | gewaechshaus | 2018 |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#4` | 1 | offen (Obergrenze 3.5 über 2.6) | 2.5 bis 3.5 | mS/cm | unbekannt | `ua-ceac-kurs-kap10` | B1 | substrat_inert | gewaechshaus | – |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#5` | 2 | pw | 2.0 bis 2.5 | mS/cm | unbekannt | `frankiesgarten-tomaten` | C | nft | gewaechshaus | – |
| `pw.solanum_lycopersicum.fruchtbildung_reife.ec#7` | 2 | offen (Einzelwert) | typ 2.5 | mS/cm | unbekannt | `frankiesgarten-faq` | C | nft | andere | – |

#### K-tomate-12 · Tomate · Keimung · `keimtemp` (neu)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.keimung.keimtemp#1` | 1 | pw | 23 bis 25 (typ leer) | °C | – | `ua-ceac-kurs-kap3` | B1 | substrat_inert | gewaechshaus | – |
| `pw.solanum_lycopersicum.keimung.keimtemp#2` | 2 | pw | 22 bis 28, typ 25 | °C | – | `frankiesgarten-keimtabelle` | C | substrat_inert | andere | – |
| `pw.solanum_lycopersicum.keimung.keimtemp#3` | 2 | pw | 22 bis 26 (typ leer) | °C | – | `frankiesgarten-tomaten` | C | substrat_inert | andere | – |

#### K-tomate-13 · Tomate · Anzucht · `ph` (neu)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.anzucht.ph#1` | 1 | pw | 5.6 bis 5.8 | pH | – | `greenhousecanada-rootzone14-2013` | B2 | substrat_inert | gewaechshaus | 2013 |
| `pw.solanum_lycopersicum.anzucht.ph#2` | 2 | pw | 5.8 bis 6.2 | pH | – | `frankiesgarten-tomaten` | C | dwc | indoor_led | – |

#### K-tomate-14 · Tomate · Wachstum · `licht_h` (neu)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.wachstum.licht_h#1` | 2 | pw | 14 bis 16 | h | – | `frankiesgarten-faq` | C | nft | indoor_led | – |
| `pw.solanum_lycopersicum.wachstum.licht_h#2` | 2 | offen (Einzelwert) | typ 18 | h | – | `forkfarms-minitomaten-2026` | B2 | nft | indoor_led | 2026 |

#### K-tomate-15 · Tomate · Blüte · `licht_h` (neu)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.bluete.licht_h#1` | 2 | pw | 14 bis 16 | h | – | `frankiesgarten-faq` | C | nft | indoor_led | – |
| `pw.solanum_lycopersicum.bluete.licht_h#2` | 2 | offen (Einzelwert) | typ 18 | h | – | `forkfarms-minitomaten-2026` | B2 | nft | indoor_led | 2026 |

#### K-tomate-16 · Tomate · Fruchtbildung und Reife · `licht_h` (neu)

| kandidat_id | R | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.solanum_lycopersicum.fruchtbildung_reife.licht_h#1` | 2 | pw | 14 bis 16 | h | – | `frankiesgarten-faq` | C | nft | indoor_led | – |
| `pw.solanum_lycopersicum.fruchtbildung_reife.licht_h#2` | 2 | offen (Einzelwert) | typ 18 | h | – | `forkfarms-minitomaten-2026` | B2 | nft | indoor_led | 2026 |

Ohne Konflikt (ein Kandidat oder gleiche Werte): `anwendbar` und `bbch` in allen fünf Phasen, `wechselmerkmal` in Wachstum und Blüte, `keimart` (#1 und #2 `dunkel`), `wassertemp` in allen fünf Phasen, `anzucht.licht_h#1`, die vier Stammfelder, `kulturformen_erlaubt` und `kulturform_vorgabe` (je zwei Kandidaten `dauerkultur_frucht`), `umsetzen_ab_d`, `umsetzen_bis_d`, `systemeignung`, `bestaeubung_noetig`, `ak.…dauerkultur_frucht.ernteart#1` und `entspitzen#1`. Die Saatempfehlung `se.solanum_lycopersicum.dauerkultur_frucht` hat einen ladbaren Kandidaten (#2: 1, 2, 1, Klasse B) und einen offenen (#3: `samen_je_schwamm` 1, übrige Felder leer); die Werte widersprechen sich nicht, deshalb kein Konflikt.

### R2.2 Plausibilität (neue Befunde; P01 bis P33 gelten weiter)

| Nr. | kandidat_id | Regel | Wert | Befund |
|---|---|---|---|---|
| P34 | `pw.solanum_lycopersicum.keimung.keimtemp#3` | Format 4.4.1 | 22 bis 26 °C, typ leer | `wert_typ` fehlt wie bei #1 (P03); der Validator prüft das nicht. |
| P35 | `pw.solanum_lycopersicum.keimung.keimtemp#2`, `#3` | Vergleich gleicher Betreiber | 22 bis 28 gegen 22 bis 26 °C | Zwei Seiten desselben Betreibers nennen für die Tomate verschiedene Obergrenzen; gegen Chili (24 bis 30, 25 bis 26 °C) sind alle drei Kandidaten plausibel. |
| P36 | `pw.solanum_lycopersicum.keimung.dauer#3`, `#4` | V6 (Form) | 6 bis 10, typ leer | Bereich ohne `wert_typ`, deshalb offen. |
| P37 | `pw.solanum_lycopersicum.keimung.dauer#2` | Vergleich innerhalb der Art | 14 gegen 6 bis 10 Tage | Der Rasterwert 14 (P02) liegt ausserhalb der beiden neuen Bereiche; die offenen Chili-Kandidaten nennen 7 bis 10 und 7 bis 14 Tage. |
| P38 | `pw.solanum_lycopersicum.anzucht.ph#1`, `#2` | Bezug der Fundstelle | 5.6 bis 5.8 gegen 5.8 bis 6.2 | #1 stammt aus dem Satz zur einmaligen Sättigung der Steinwollblöcke (P09), #2 aus der Kastentabelle der Anzuchtstation im DWC; die Bänder berühren sich nur bei 5.8. |
| P39 | `pw.solanum_lycopersicum.anzucht.ec#3` | V4, V5, Gegenprobe | 0.4 bis 1.3 | Untergrenze genau auf 0.4 mS/cm und damit innerhalb, Band 0.9 innerhalb V5, Mitte 0.85 gegen 1.0 (0.15) ohne Gegenprobe-Konflikt. |
| P40 | `pw.solanum_lycopersicum.anzucht.ec#3` | Bezug der Fundstelle | 0.4 bis 1.3 | Das Kurzzitat ist eine Stufenfolge («Anzucht 0,4 bis 1,3 · Wachstum bis 2,0 …») und die FAQ desselben Betreibers (`wachstum.ec#5`) nennt Anzucht 0,6 und Jungpflanze 1,3, sodass das Band eher einen Anstieg über die Anzucht als einen gleichbleibenden Sollbereich beschreibt. |
| P41 | `pw.solanum_lycopersicum.anzucht.ec#3`, `wachstum.ec#4`, `bluete.ec#3`, `fruchtbildung_reife.ec#5` | Einheit (4.4, 6) | mS/cm | An der Fundstelle steht keine Einheit neben dem Wert; mS/cm ist laut Fundstelle aus der FAQ desselben Betreibers erschlossen. |
| P42 | `pw.solanum_lycopersicum.wachstum.ec#4` | V4, V5, Gegenprobe | 1.4 bis 2.0 | Innerhalb 0.4 bis 2.6, Band 0.6, Mitte 1.7 gegen 1.5 (0.2) ohne Gegenprobe-Konflikt. |
| P43 | `pw.solanum_lycopersicum.wachstum.ec#5` | V5 (Form), Gegenprobe | typ 1.9 | Einzelwert ohne Band, deshalb offen; 1.9 gegen 1.5 weicht genau 0.4 ab und liegt nicht über der Schwelle. |
| P44 | `pw.solanum_lycopersicum.bluete.ec#3`, `fruchtbildung_reife.ec#5` | Phasenbezug | 2.0 bis 2.5 | Die Quelle nennt eine gemeinsame Stufe «Blüte und Frucht», derselbe Wert steht deshalb in beiden Phasen; zur Reife senkt sie auf 2,0, was das Band nur an der Untergrenze abdeckt. |
| P45 | `pw.solanum_lycopersicum.bluete.ec#3` | V4, V5, Gegenprobe | 2.0 bis 2.5 | Innerhalb, Band 0.5, Mitte 2.25 gegen 1.9 (0.35) ohne Gegenprobe-Konflikt. |
| P46 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#5` | V4, V5, Gegenprobe | 2.0 bis 2.5 | Innerhalb, Band 0.5, Mitte 2.25 gegen 2.1 (0.15) ohne Gegenprobe-Konflikt. |
| P47 | `pw.solanum_lycopersicum.fruchtbildung_reife.ec#7` | V5 (Form), Gegenprobe | typ 2.5 | Einzelwert ohne Band, deshalb offen; 2.5 gegen 2.1 weicht genau 0.4 ab und liegt nicht über der Schwelle. |
| P48 | `pw.solanum_lycopersicum.bluete.ec#1`, `fruchtbildung_reife.ec#1` | Vergleich innerhalb der Art | 1.2 bis 1.4 | Auch gegen die neuen Kandidaten (2.0 bis 2.5) liegt das Ein-Fruchtstand-Band in Blüte und Fruchtbildung unter allen übrigen Tomaten-Kandidaten (vgl. P20, P24, P33). |
| P49 | `pw.solanum_lycopersicum.wachstum.ph#5`, `bluete.ph#5`, `fruchtbildung_reife.ph#5` | V3, V5, Vergleich | 5.5 bis 6.0 | Innerhalb 5.2 bis 7.0, Band 0.5; die Untergrenze 5.5 liegt unter allen übrigen Tomaten-Kandidaten (5.8) und gleicht dem Chili-Kandidaten desselben Herstellers (`forkfarms-minipaprika-2026`). |
| P50 | `pw.solanum_lycopersicum.wachstum.licht_h#1`, `bluete.licht_h#1`, `fruchtbildung_reife.licht_h#1` | Artbezug | 14 bis 16 h | V7 eingehalten; die FAQ-Antwort gilt pauschal für Salat, Kräuter und Fruchtgemüse und ist nicht artbezogen. |
| P51 | `pw.solanum_lycopersicum.wachstum.licht_h#2`, `bluete.licht_h#2`, `fruchtbildung_reife.licht_h#2` | Form 4.4.1, V7 | typ 18 h | Einzelwert ohne `wert_min` und `wert_max`, deshalb offen; 18 h liegt innerhalb 0 bis 24 und 2 h über dem Band #1. |
| P52 | Quelle `frankiesgarten-faq` | Quellenstatus | – | Die Quelle steht nur wegen des Titels auf `verworfen` und ist wie geprüft behandelt; daran hängen `wachstum.ec#5`, `fruchtbildung_reife.ec#7` und `licht_h#1` in drei Phasen. |
| P53 | `art.solanum_lycopersicum.umsetzen_ab_d#1`, `umsetzen_bis_d#1` | Abgleich mit Phasen | 10 bis 16 Tage ab Saat | Das Fenster endet vor dem Umsetzen an Tag 35 ab Saat aus K-tomate-03 und vor «fünf bis sechs echte Blätter» (`anzucht.wechselmerkmal#1`); mit 6 bis 10 Tagen Keimung (K-tomate-01) blieben für die Anzucht 0 bis 10 Tage. |
| P54 | `art.solanum_lycopersicum.systemeignung#1` | Konzept 8.1 Regel 8 | `kratky` | «kratky» deckt nur die Betriebsarten `kratky` und `kratky_belueftet`, nicht `dwc`; die Kulturform im Auftrag läuft im DWC (Abschnitt 1), und die Quelle belegt die Eignung für Kratky, nicht eine Nichteignung für DWC. |
| P55 | `ak.solanum_lycopersicum.dauerkultur_frucht.entspitzen#1` | Bezug der Fundstelle | `ja` | Die Quelle kappt Stabtomaten bei 2 m Höhe; für Sorten mit begrenztem Wuchs (vgl. P13) belegt sie nichts. |
| P56 | `se.solanum_lycopersicum.dauerkultur_frucht#2` | 4.5, R12.3 | 1, 2, 1, Klasse B | Pflichtfelder vollständig und `obergrenze_samen` ≥ `samen_je_schwamm`; die Obergrenze 2 stammt aus der bedingten Regel «wenn weniger als die Hälfte keimt», `pflanzen_stehen_lassen` 1 stimmt mit Tims Entscheid «1 Pflanze je Topf» überein, die Würfelgrösse der Quelle ist nicht belegt. |
| P57 | `se.solanum_lycopersicum.dauerkultur_frucht#3` | 4.5 (Form) | `samen_je_schwamm` 1 | `obergrenze_samen` und `pflanzen_stehen_lassen` fehlen, deshalb offen; kein Widerspruch zu #2. |

Ohne Befund: `keimart` #1 und #2 (`dunkel`, Chili ebenfalls `dunkel`); `keimung.wassertemp#1` 20 bis 22 °C, `anzucht.wassertemp#1` und `wassertemp#1` in Wachstum, Blüte und Fruchtbildung 18 bis 24 °C (V7, Chili gleich); `anzucht.licht_h#1` 12 bis 16 h (V7, Chili 14 bis 16); `anzucht.ph#2` und `ph#4` in drei Phasen (V3, Band 0.4); `kulturform_vorgabe` liegt in `kulturformen_erlaubt` (V11); `bestaeubung_noetig = ja`.

### R2.3 Lückenliste

Klasse D, Prüfauftrag. «Nur offener Wert» heisst: belegt nur in `profilwert_offen.csv`, kein ladbarer Kandidat.

**Pflichtgrössen (03_import_w0.md 9)**

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| Tomate | Keimung | `dauer` | nur offener Wert (K-tomate-01) |
| Tomate | Anzucht | `dauer` | nur offener Wert (K-tomate-03) |
| Tomate | Wachstum | `dauer` | kein Kandidat (nur verworfene) |
| Tomate | Blüte | `dauer` | kein Kandidat (nur verworfene) |
| Tomate | Fruchtbildung und Reife | `dauer` | kein Kandidat (nur verworfene) |

Geschlossen seit Runde 1: `keimung.keimart`, `anzucht.ec` (ladbar `#3`, in K-tomate-04). Folge nach 03_import_w0.md 8.4 unverändert: Ohne `dauer` in den Phasen Anzucht bis Fruchtbildung lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Tomate nicht; Keimung `dauer` geht vorab nur mit einem ladbaren Kandidaten.

**Erwünscht, ohne Pflicht (Prüfauftrag)**

| Art | Phase | Grösse |
|---|---|---|
| Tomate | Keimung | `licht_h` |

`wassertemp` liegt jetzt in allen fünf Phasen vor, `licht_h` in Anzucht bis Fruchtbildung.

**Artmerkmale (4.3.2)**

| Art | Feld |
|---|---|
| Tomate | `samentyp` |
| Tomate | `standard_keimfaehigkeit` (einziger Kandidat verworfen) |
| Tomate | `liter_je_pflanze` |
| Tomate | `wasserbedarf_je_pflanze_l` |
| Tomate | `pflanzen_je_m2` |
| Tomate | `wuchshoehe_max_mm` |
| Tomate | `wuchsform` |
| Tomate | `photoperiode` |
| Tomate | `kritische_tageslaenge_h` (bedingt, offen solange `photoperiode` fehlt) |
| Tomate | `pythium` |
| Tomate | `schossen_handlung` |
| Tomate | `aussaatfenster_outdoor` (optional) |

Geschlossen seit Runde 1: `kulturformen_erlaubt`, `kulturform_vorgabe`, `umsetzen_ab_d`, `umsetzen_bis_d`, `systemeignung`, `bestaeubung_noetig`. Für die Übernahme durch neue Arten der Gruppe (4.4.2) fehlt von der Leitkultur nur noch `standard_keimfaehigkeit`.

**Kulturform-Felder `dauerkultur_frucht` (4.3.3)**

| Art | Kulturform | Feld |
|---|---|---|
| Tomate | `dauerkultur_frucht` | `ernte_ab_d` |
| Tomate | `dauerkultur_frucht` | `ernteintervall_d` |
| Tomate | `dauerkultur_frucht` | `schnitte_max` (gilt bei `mehrfach`; im Auftrag Runde 2 nicht genannt) |
| Tomate | `dauerkultur_frucht` | `kulturdauer_max_d` |
| Tomate | `dauerkultur_frucht` | `kulturdauer_typisch_d` |

Geschlossen seit Runde 1: `entspitzen`.

**Saatempfehlung:** `se.solanum_lycopersicum.dauerkultur_frucht` hat mit #2 einen ladbaren Kandidaten; keine Lücke.

### R2.4 Bestätigungen

| Zeile | Wert | Quellen | Hinweis |
|---|---|---|---|
| `pw.solanum_lycopersicum.keimung.keimart` | `dunkel` | `frankiesgarten-tomaten`, `frankiesgarten-keimtabelle` | zwei Seiten desselben Betreibers |
| `pw.solanum_lycopersicum.keimung.dauer` (offen, in K-tomate-01) | 6 bis 10 Tage | `frankiesgarten-tomaten`, `frankiesgarten-keimtabelle` | derselbe Betreiber; beide offen |
| `pw.solanum_lycopersicum.wachstum.ph`, `bluete.ph`, `fruchtbildung_reife.ph` (in K-tomate-06, -08, -10) | 5.8 bis 6.2 | `ufifas-hs796-2024` (#1), `frankiesgarten-tomaten` (#4) | unabhängige Quellen |
| `art.solanum_lycopersicum.kulturformen_erlaubt` | `dauerkultur_frucht` | `frankiesgarten-tomaten`, `ua-ceac-kurs-kap3` | unabhängige Quellen |
| `art.solanum_lycopersicum.kulturform_vorgabe` | `dauerkultur_frucht` | `frankiesgarten-tomaten`, `ua-ceac-kurs-kap3` | unabhängige Quellen |
| `se.solanum_lycopersicum.dauerkultur_frucht`, Feld `samen_je_schwamm` | 1 | `frankiesgarten-keimtabelle` (#2), `frankiesgarten-tomaten` (#3, offen) | derselbe Betreiber |

Derselbe Wert einer Quelle über mehrere Phasen (`wassertemp` 18 bis 24, `licht_h` 14 bis 16 und 18, `ph#4`, `ph#5`) zählt nicht als Bestätigung.

### R2.5 Zahlen

- Konflikte: 16 offen (K-tomate-01 bis -16), davon 5 neu (K-tomate-12 bis -16); «nur offener Wert» noch 2 (K-tomate-01, -03), K-tomate-04 hat jetzt einen ladbaren Kandidaten. 25 Zeilen mit `konflikt_id` neu gesetzt.
- Plausibilitätsbefunde: 24 neu (P34 bis P57), zusammen mit Runde 1 57; keine neue Gegenprobe-Abweichung über 0.4 mS/cm (zwei Kandidaten genau auf 0.4: `wachstum.ec#5`, `fruchtbildung_reife.ec#7`).
- Lücken: 22 (5 Pflichtgrössen davon 2 nur offener Wert, 12 Artmerkmale davon 2 bedingt oder optional, 5 Kulturform-Felder), dazu `keimung.licht_h` als Prüfauftrag ohne Pflicht; Saatempfehlung geschlossen.
- Bestätigungen: 6 (3 mit unabhängigen Quellen).
