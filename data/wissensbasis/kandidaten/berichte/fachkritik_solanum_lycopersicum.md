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
