# Fachkritik Chili (`capsicum_annuum`)

W0-Probelauf, Issue #184, 12.11.2026. Kulturgruppe `fruchtgemuese` (Leitkultur Tomate), Ordner `data/wissensbasis/kandidaten/teile/fruchtgemuese/`. Kulturform im Auftrag: `dauerkultur_frucht` (Sorten Basket of Fire F1, Prairie Fire, Sweet Pickle, Sibirischer Hauspaprika; DWC, Anzucht im 8-cm-Topf).

Gesichtet: nur Zeilen mit `status = geprueft` der Art in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv` (keine Zeile) und die zugehörigen Quellen in `quelle.csv`. `saatempfehlung_offen.csv` gibt es in diesem Ordner nicht. Geändert wurde nur die Spalte `konflikt_id`.

Zusammenfassung: 9 Konflikte (7 mit verschiedenen Werten, 4 «nur offener Wert», 2 davon in beiden Gruppen), 24 Plausibilitätsbefunde, 32 Lücken (5 Pflichtgrössen, 4 Nicht-Pflichtgrössen als Prüfauftrag, 16 Artmerkmale, 6 Kulturform-Felder, 1 Saatempfehlung), 3 Bestätigungen.

Kurzzeichen der Quellen (aus `quelle.csv`):

| `quelle_id` | Klasse der Quelle | Jahr |
|---|---|---|
| `bbch-monografie-2001` | universitaet_beratung | 2001 |
| `alberta-sweet-bell-peppers` | universitaet_beratung | ohne Jahr |
| `aces-anr2954-2023` | universitaet_beratung | 2023 |
| `unalm-pimientos-hidroponicos-2006` | praxis | 2006 |
| `okstate-hla6722-2016` | universitaet_beratung | 2016 |
| `ua-tomato-workshop-modul2-2026` | universitaet_beratung | 2026 |

## 1 Konfliktliste

Datei: `pw` = `profilwert.csv` (ladbar), `pw_offen` = `profilwert_offen.csv` (belegt, aber nicht in Validatorform; Spalte `grund`). Werte als Rohwert der Datei; EC-Einheit `einheit_quelle`, Basis `ec_basis`.

### K-chili-01 – Chili, Keimung, `wechselmerkmal`

| `kandidat_id` | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.keimung.wechselmerkmal#1` | pw | «Sind die Keimblätter vollständig entfaltet?» | – | – | bbch-monografie-2001 | B1 | keine | andere | 2001 |
| `pw.capsicum_annuum.keimung.wechselmerkmal#2` | pw | «Sind die ersten echten Laubblätter sichtbar?» | – | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |

### K-chili-02 – Chili, Keimung, `dauer` (verschiedene Werte und nur offener Wert)

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.keimung.dauer#1` | pw_offen (Bereich ohne typ) | 7 / – / 10 | Tage | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.keimung.dauer#4` | pw_offen (Einzelwert) | – / 14 / – | Tage | – | ua-tomato-workshop-modul2-2026 | B1 | substrat_inert | gewaechshaus | 2026 |

Kein ladbarer Kandidat: Pflichtgrösse der Keimung (Abschnitt 9, mindestens auf Ebene Art) hängt allein an offenen Werten.

### K-chili-03 – Chili, Anzucht, `wechselmerkmal`

| `kandidat_id` | Datei | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.wechselmerkmal#1` | pw | «Hat die Jungpflanze fünf bis sechs echte Blätter?» | – | – | aces-anr2954-2023 | B1 | substrat_inert | gewaechshaus | 2023 |
| `pw.capsicum_annuum.anzucht.wechselmerkmal#2` | pw | «Hat die Jungpflanze sechs Blätter am Haupttrieb?» | – | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

Die Werte überschneiden sich (sechs Blätter), sind aber nicht gleich.

### K-chili-04 – Chili, Anzucht, `dauer` (nur offener Wert)

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.dauer#5` | pw_offen (Einzelwert) | – / 21 / – | Tage | – | ua-tomato-workshop-modul2-2026 | B1 | substrat_inert | gewaechshaus | 2026 |

Einziger geprüfter Kandidat; Pflichtgrösse ohne ladbaren Wert.

### K-chili-05 – Chili, Anzucht, `ec` (verschiedene Werte und nur offener Wert)

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.ec#1` | pw_offen (Einzelwert) | – / 2.5 / – | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.anzucht.ec#3` | pw_offen (Einzelwert) | – / 2.3 / – | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

Kein ladbarer Kandidat: Pflichtgrösse der Anzucht (mindestens auf Ebene Art) hängt allein an offenen Werten.

### K-chili-06 – Chili, Anzucht, `licht_h` (nur offener Wert)

| `kandidat_id` | Datei | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.licht_h#1` | pw_offen (Einzelwert) | – / 18 / – | h | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.anzucht.licht_h#3` | pw_offen (Einzelwert) | – / 18 / – | h | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

Gleiche Werte (Bestätigung, Abschnitt 4), aber beide nur als Einzelwert in `wert_typ`; `licht_h` verlangt `wert_min` und `wert_max`. Keine Pflichtgrösse.

### K-chili-07 – Chili, Wachstum, `ec`

| `kandidat_id` | Datei | Wert (min / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.wachstum.ec#1` | pw | 0.8 / 1.8 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| `pw.capsicum_annuum.wachstum.ec#2` | pw_offen (Obergrenze über 2.6) | 2.5 / 3.5 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.wachstum.ec#3` | pw_offen (Obergrenze über 2.6) | 2.5 / 3.5 | mS/cm (Quelle «mS») | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.wachstum.ec#4` | pw_offen (Obergrenze über 2.6) | 2.5 / 3.0 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.wachstum.ec#5` | pw_offen (Obergrenze über 2.6) | 2.6 / 3.0 | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

Bezug der Kandidaten: #1 ohne Phasenangabe (Tabelle über Kulturen), #2 und #3 erste ein bis zwei Wochen nach dem Auspflanzen, #4 und #5 ohne Phasenangabe (Bewässerung, #5 Sommer).

### K-chili-08 – Chili, Blüte, `ec`

| `kandidat_id` | Datei | Wert (min / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.bluete.ec#1` | pw | 0.8 / 1.8 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| `pw.capsicum_annuum.bluete.ec#2` | pw_offen (Obergrenze über 2.6) | 2.5 / 3.0 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.bluete.ec#3` | pw_offen (Obergrenze über 2.6) | 2.6 / 3.0 | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

### K-chili-09 – Chili, Fruchtbildung und Reife, `ec`

| `kandidat_id` | Datei | Wert (min / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.fruchtbildung_reife.ec#1` | pw | 0.8 / 1.8 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| `pw.capsicum_annuum.fruchtbildung_reife.ec#2` | pw_offen (Obergrenze über 2.6) | 2.5 / 3.0 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.fruchtbildung_reife.ec#3` | pw_offen (Obergrenze über 2.6) | 2.6 / 3.0 | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

## 2 Plausibilität

Geprüft gegen V3 bis V7 (Validatorgrenzen, Fruchtgemüse EC 0.4 bis 2.6), Gegenprobe Düngeplan (Chili: Anzucht 1.1, Wachstum 1.7, Blüte 1.9, Fruchtbildung 2.1; Basis `unbekannt` rechnet als `gesamt`, also ohne Zuschlag für ECWasser) und gegen die geprüften Werte der Tomate. Alle Rohwerte sind bereits mS/cm; nur zum Prüfen umgerechnet, in der Datei unverändert.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P1 | `pw.capsicum_annuum.wachstum.ec#1` | Gegenprobe | 0.8–1.8, Mitte 1.3 | Abweichung zu 1.7 genau 0.4 mS/cm, also kein Gegenprobe-Konflikt, aber an der Grenze. |
| P2 | `pw.capsicum_annuum.bluete.ec#1` | Gegenprobe | 0.8–1.8, Mitte 1.3 | Abweichung zu 1.9 beträgt 0.6 mS/cm und löst bei Freigabe einen Gegenprobe-Konflikt aus. |
| P3 | `pw.capsicum_annuum.fruchtbildung_reife.ec#1` | Gegenprobe | 0.8–1.8, Mitte 1.3 | Abweichung zu 2.1 beträgt 0.8 mS/cm und löst bei Freigabe einen Gegenprobe-Konflikt aus. |
| P4 | `pw.capsicum_annuum.anzucht.ec#1` | V5, Gegenprobe, Inhalt | typ 2.5 | Einzelwert ohne Bandbreite (V5 nicht prüfbar), 1.4 mS/cm über 1.1, und das Zitat beschreibt das einmalige Tränken der Steinwollblöcke vor dem Umsetzen, nicht ein Sollband der Anzucht. |
| P5 | `pw.capsicum_annuum.anzucht.ec#3` | V5, Gegenprobe, Inhalt | typ 2.3 | Einzelwert ohne Bandbreite, 1.2 mS/cm über 1.1, und das Zitat beschreibt wie P4 das Tränken der Blöcke vor dem Umsetzen. |
| P6 | `pw.capsicum_annuum.wachstum.ec#2` | V4, Gegenprobe | 2.5–3.5, Mitte 3.0 | Obergrenze 3.5 über 2.6 und Mitte 1.3 mS/cm über 1.7; Bandbreite 1.0 innerhalb V5. |
| P7 | `pw.capsicum_annuum.wachstum.ec#3` | V4, Gegenprobe | 2.5–3.5, Mitte 3.0 | Wie P6: Obergrenze 3.5 über 2.6, Mitte 1.3 mS/cm über 1.7. |
| P8 | `pw.capsicum_annuum.wachstum.ec#4` | V4, Gegenprobe | 2.5–3.0, Mitte 2.75 | Obergrenze 3.0 über 2.6, Mitte 1.05 mS/cm über 1.7; das Zitat ist eine Tropf-Speiselösung für eine Wurzelzone von 3.5 bis 4.0 in Matten, also ein Substratwert mit Drain. |
| P9 | `pw.capsicum_annuum.wachstum.ec#5` | V4, Gegenprobe | 2.6–3.0, Mitte 2.8 | Obergrenze 3.0 über 2.6 (Untergrenze genau auf 2.6), Mitte 1.1 mS/cm über 1.7, laut Fundstelle Sommerbedingungen. |
| P10 | `pw.capsicum_annuum.bluete.ec#2` | V4, Gegenprobe | 2.5–3.0, Mitte 2.75 | Obergrenze 3.0 über 2.6, Mitte 0.85 mS/cm über 1.9; Zitat ohne Phasenangabe auf Blüte übertragen. |
| P11 | `pw.capsicum_annuum.bluete.ec#3` | V4, Gegenprobe | 2.6–3.0, Mitte 2.8 | Obergrenze 3.0 über 2.6, Mitte 0.9 mS/cm über 1.9; Zitat ohne Phasenangabe auf Blüte übertragen. |
| P12 | `pw.capsicum_annuum.fruchtbildung_reife.ec#2` | V4, Gegenprobe | 2.5–3.0, Mitte 2.75 | Obergrenze 3.0 über 2.6, Mitte 0.65 mS/cm über 2.1. |
| P13 | `pw.capsicum_annuum.fruchtbildung_reife.ec#3` | V4, Gegenprobe | 2.6–3.0, Mitte 2.8 | Obergrenze 3.0 über 2.6, Mitte 0.7 mS/cm über 2.1. |
| P14 | alle EC-Kandidaten der Chili | EC-Basis | `unbekannt` | Keine Quelle nennt die Basis; jeder freigegebene Wert zeigt «EC-Basis unklar» und rechnet als Gesamt-EC. |
| P15 | `…anzucht.ec#1`, `…wachstum.ec#2`, `…wachstum.ec#4`, `…bluete.ec#2`, `…fruchtbildung_reife.ec#2`, `…wachstum.ec#3` | Einheit | «mmhos» bzw. «mS» ohne Längenbezug | Als mS/cm erfasst und vom Methodenprüfer zugelassen; die Grössenordnung passt zu mS/cm, die Einheit steht aber nicht wörtlich in der Quelle. |
| P16 | `pw.capsicum_annuum.keimung.dauer#1` | V6 | 7 / – / 10 | min ≤ max und über 0 erfüllt, `wert_typ` fehlt (Grund der Ablage in `profilwert_offen.csv`). |
| P17 | `pw.capsicum_annuum.keimung.dauer#4` | V6, Vergleich | – / 14 / – | Nur `wert_typ`; der Wert stammt aus einem Wochenraster (Woche 2) mit identischer Spalte für Tomate und Peperoni und liegt über dem Bereich 7 bis 10 von K-chili-02. |
| P18 | `pw.capsicum_annuum.anzucht.dauer#5` | V6, Vergleich | – / 21 / – | Nur `wert_typ`, gerechnet als 35 minus 14 Tage (Umrechnung des Bezugspunkts nach 9.2) aus demselben Wochenraster, das für Tomate denselben Wert 21 liefert; eine artspezifische Anzuchtdauer der Chili belegt es nicht. |
| P19 | `pw.capsicum_annuum.anzucht.licht_h#1`, `#3` | V7 | – / 18 / – | 18 h liegt in 0 bis 24, aber als Einzelwert in `wert_typ` statt `wert_min`/`wert_max`; #1 ist Zusatzlicht im Gewächshaus, nicht die gesamte Lichtdauer unter LED. |
| P20 | `pw.capsicum_annuum.keimung.wechselmerkmal#2` | BBCH-Abgleich | «Sind die ersten echten Laubblätter sichtbar?» | Das Merkmal liegt nach BBCH 10, also schon im Bereich der Anzucht (BBCH 10 bis 19), während #1 genau BBCH 10 trifft. |
| P21 | `pw.capsicum_annuum.anzucht.wechselmerkmal#1`, `#2` | BBCH-Abgleich | fünf bis sechs bzw. sechs Blätter | Beide Merkmale entsprechen etwa BBCH 15 bis 16, die geprüfte BBCH-Spanne der Anzucht reicht aber bis 19 und das Wachstum beginnt bei 21. |
| P22 | `pw.capsicum_annuum.wachstum.ph#1`, `bluete.ph#1`, `fruchtbildung_reife.ph#1` | V3, V5, Vergleich | 5.8–6.1 | Innerhalb 5.2 bis 7.0, Bandbreite 0.3 in V5; ein Zitat ohne Phasenangabe trägt drei Phasen, passt zur Tomate (5.8–6.2 und 5.8–6.5). |
| P23 | `pw.capsicum_annuum.wachstum.ec#1` (und Blüte, Fruchtbildung) | Gruppenvergleich | 0.8–1.8 | Dieselbe Tabelle (okstate) gibt der Tomate 2.0–4.0, Peperoni also deutlich tiefer; der Düngeplan setzt Chili dagegen in jeder Phase gleich hoch oder höher als Tomate (1.1/1.7/1.9/2.1 gegen 1.0/1.5/1.9/2.1). |
| P24 | `art.capsicum_annuum.name_de#1` | 03_import_w0.md 4.3 (Stammfelder) | Chili | Herkunft ist die Seite der Universität Potsdam statt der GBIF-Seite, die 4.3 für die Stammfelder vorsieht; der Wert selbst passt zu `sorten.csv` und Tabelle 4.3.1. |

Ohne Befund: `anwendbar` aller fünf Phasen (`ja`, passend zu Fruchtgemüse nach R1.1), `bbch` aller Phasen (0–9, 10–19, 21–59, 61–69, 71–89, je in 0 bis 99 und ohne Überlappung), `wechselmerkmal` von Wachstum (BBCH 61) und Blüte (BBCH 71) passend zum Beginn der Folgephase, `keimtemp` 25–26 °C (keine Validatorregel; 1 bis 2 °C über der Tomate mit 23–25 °C, plausibel). Allgemein: Kein Chili-Kandidat stammt aus DWC; alle Sollwerte kommen aus inertem Substrat (Steinwolle, Kokos) im Gewächshaus oder ohne Umgebungsangabe.

## 3 Lückenliste

### 3.1 Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Art | Phase | Grösse |
|---|---|---|
| Chili | `keimung` | `keimart` |
| Chili | `anzucht` | `ph` |
| Chili | `wachstum` | `dauer` |
| Chili | `bluete` | `dauer` |
| Chili | `fruchtbildung_reife` | `dauer` |

Pflichtgrössen mit geprüftem Kandidaten nur in `profilwert_offen.csv` (keine Lücke im Sinn «ohne geprüften Kandidaten», aber ohne ladbaren Wert; als Konflikt «nur offener Wert» geführt): `keimung.dauer` (K-chili-02), `anzucht.dauer` (K-chili-04), `anzucht.ec` (K-chili-05). Damit fehlen der Art für die Teilfreigabe (03_import_w0.md 8.4) acht ladbare Pflichtwerte. `wechselmerkmal` der Phase `fruchtbildung_reife` entfällt als letzte anwendbare Phase.

### 3.2 Nicht-Pflichtgrössen ohne Wert auf Ebene Art (Prüfauftrag nach R1.4, Standardprofil liefert)

| Art | Phase | Grösse |
|---|---|---|
| Chili | alle fünf Phasen | `wassertemp` |
| Chili | `wachstum` | `licht_h` |
| Chili | `bluete` | `licht_h` |
| Chili | `fruchtbildung_reife` | `licht_h` |

(`anzucht.licht_h` nur offen, K-chili-06.) Gezählt als 4 Einträge.

### 3.3 Stammfelder

Alle vier vorhanden (`name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id`); zur Herkunft von `name_de` siehe P24.

### 3.4 Artmerkmale (03_import_w0.md 4.3.2)

| Art | Feld |
|---|---|
| Chili | `samentyp` |
| Chili | `standard_keimfaehigkeit` |
| Chili | `systemeignung` |
| Chili | `liter_je_pflanze` |
| Chili | `wasserbedarf_je_pflanze_l` |
| Chili | `pflanzen_je_m2` |
| Chili | `wuchshoehe_max_mm` |
| Chili | `wuchsform` |
| Chili | `photoperiode` |
| Chili | `bestaeubung_noetig` |
| Chili | `pythium` |
| Chili | `schossen_handlung` |
| Chili | `umsetzen_ab_d` |
| Chili | `umsetzen_bis_d` |
| Chili | `kulturformen_erlaubt` |
| Chili | `kulturform_vorgabe` |

Nicht als Lücke gezählt, weil bedingt oder optional: `keimlinge_je_knaeuel` (nur Knäuelsaat), `kritische_tageslaenge_h` (nur bei `langtag` oder `kurztag`, hängt an der fehlenden `photoperiode`), `aussaatfenster_outdoor` (optional).

### 3.5 Kulturform-Felder `dauerkultur_frucht` (03_import_w0.md 4.3.3)

Vorhanden: `ernteart` = `mehrfach` (`ak.capsicum_annuum.dauerkultur_frucht.ernteart#1`, alberta, B1).

| Art | Kulturform | Feld |
|---|---|---|
| Chili | `dauerkultur_frucht` | `ernte_ab_d` |
| Chili | `dauerkultur_frucht` | `ernteintervall_d` (nötig, weil `ernteart` = `mehrfach`) |
| Chili | `dauerkultur_frucht` | `schnitte_max` (nötig, weil `ernteart` = `mehrfach`) |
| Chili | `dauerkultur_frucht` | `kulturdauer_max_d` |
| Chili | `dauerkultur_frucht` | `kulturdauer_typisch_d` |
| Chili | `dauerkultur_frucht` | `entspitzen` |

### 3.6 Saatempfehlung

| Art | Kulturform | Zeile |
|---|---|---|
| Chili | `dauerkultur_frucht` | `se.capsicum_annuum.dauerkultur_frucht` (weder auf Ebene Art noch für eine der vier Sorten ein Kandidat; keine `saatempfehlung_offen.csv`) |

## 4 Bestätigungen

| Phase | Grösse | Wert | Kandidaten (Quelle, Klasse) | Bemerkung |
|---|---|---|---|---|
| `keimung` | `keimtemp` | 25–26 °C | `pw.capsicum_annuum.keimung.keimtemp#1` (alberta, B1), `#2` (unalm, C) | beide ladbar, kein Konflikt |
| `anzucht` | `licht_h` | 18 h | `pw.capsicum_annuum.anzucht.licht_h#1` (alberta, B1), `#3` (unalm, C) | beide offen, deshalb K-chili-06 «nur offener Wert» |
| `wachstum` | `ec` | 2.5–3.5 mS/cm | `pw.capsicum_annuum.wachstum.ec#2` (alberta, B1), `#3` (unalm, C) | beide offen und Teil von K-chili-07; je Bezug die ersten ein bis zwei Wochen nach dem Auspflanzen |

## Runde 2 (12.11.2026)

W0 Runde 2, Issue #188. Kulturform nach Entscheid 0018 nur `dauerkultur_frucht`. Gesichtet: alle Zeilen der Art mit `status` = `geprueft` oder `vorgeschlagen` (auch aus Runde 1) in `art.csv`, `profilwert.csv`, `profilwert_offen.csv`, `saatempfehlung.csv`, `saatempfehlung_offen.csv` (neu vorhanden) und die zugehörigen Quellen in `quelle.csv`; Zeilen mit `verworfen` oder `entwurf` zählen nicht. `frankiesgarten-faq` ist in `quelle.csv` nur wegen des Titels verworfen und gilt hier als geprüft; kein Chili-Kandidat stützt sich darauf. Geändert wurde nur die Spalte `konflikt_id` (Chili-Zeilen in `profilwert.csv`, `profilwert_offen.csv`, `art.csv`); Konflikt-IDs der Tomate sind unberührt.

Zusammenfassung Runde 2: 18 offene Konflikte (K-chili-01 bis -09 aus Runde 1, davon 7 mit neuen Kandidaten; neu K-chili-10 bis -18), davon noch 2 «nur offener Wert» (K-chili-02, K-chili-05); K-chili-04 und K-chili-06 haben jetzt einen ladbaren Kandidaten. 15 neue Plausibilitätsbefunde (P25 bis P39), P1 bis P24 gelten weiter. 22 Lücken (3 Pflichtgrössen, 2 Nicht-Pflichtgrössen, 11 Artmerkmale, 6 Kulturform-Felder, 0 Saatempfehlungen), dazu 2 Pflichtgrössen nur mit offenem Wert. 7 Bestätigungen.

Neue Quellen dieser Runde (aus `quelle.csv`):

| `quelle_id` | Klasse der Quelle | Jahr |
|---|---|---|
| `frankiesgarten-paprika` | praxis | ohne Jahr |
| `frankiesgarten-keimtabelle` | praxis | ohne Jahr |
| `forkfarms-minipaprika-2026` | hersteller | 2026 |

### R2.1 Konfliktliste (alle offenen Konflikte)

Datei: `pw` = `profilwert.csv`, `pw_offen` = `profilwert_offen.csv`, `art` = `art.csv`. Status `g` = `geprueft`, `v` = `vorgeschlagen`. «neu» kennzeichnet Kandidaten aus Runde 2. Hinweis für den Lead: Mehrere Kandidaten mit Status `vorgeschlagen` aus Runde 1 stehen in offenen Konflikten (K-chili-01, -03, -07 bis -13); die neuen Kandidaten machen K-chili-10 bis -13 erst strittig.

#### K-chili-01 – Chili, Keimung, `wechselmerkmal` (unverändert)

| `kandidat_id` | Datei | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.keimung.wechselmerkmal#1` | pw | v | «Sind die Keimblätter vollständig entfaltet?» | – | – | bbch-monografie-2001 | B1 | keine | andere | 2001 |
| `pw.capsicum_annuum.keimung.wechselmerkmal#2` | pw | g | «Sind die ersten echten Laubblätter sichtbar?» | – | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |

#### K-chili-02 – Chili, Keimung, `dauer` (verschiedene Werte und nur offener Wert)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.keimung.dauer#1` | pw_offen (Bereich ohne typ) | g | 7 / – / 10 | Tage | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.keimung.dauer#4` | pw_offen (Einzelwert) | g | – / 14 / – | Tage | – | ua-tomato-workshop-modul2-2026 | B1 | substrat_inert | gewaechshaus | 2026 |
| `pw.capsicum_annuum.keimung.dauer#5` (neu) | pw_offen (Bereich ohne typ) | g | 7 / – / 14 | Tage | – | frankiesgarten-paprika | C | substrat_inert | andere | – |

Weiterhin kein ladbarer Kandidat; Pflichtgrösse der Keimung (mindestens auf Ebene Art) hängt allein an offenen Werten.

#### K-chili-03 – Chili, Anzucht, `wechselmerkmal` (unverändert)

| `kandidat_id` | Datei | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.wechselmerkmal#1` | pw | v | «Hat die Jungpflanze fünf bis sechs echte Blätter?» | – | – | aces-anr2954-2023 | B1 | substrat_inert | gewaechshaus | 2023 |
| `pw.capsicum_annuum.anzucht.wechselmerkmal#2` | pw | g | «Hat die Jungpflanze sechs Blätter am Haupttrieb?» | – | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |

#### K-chili-04 – Chili, Anzucht, `dauer` (jetzt verschiedene Werte, ladbarer Kandidat vorhanden)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.dauer#5` | pw_offen (Einzelwert) | g | – / 21 / – | Tage | – | ua-tomato-workshop-modul2-2026 | B1 | substrat_inert | gewaechshaus | 2026 |
| `pw.capsicum_annuum.anzucht.dauer#7` (neu) | pw | g | 14 / 14 / 28 | Tage | – | frankiesgarten-paprika | C | substrat_inert | indoor_led | – |

#### K-chili-05 – Chili, Anzucht, `ec` (verschiedene Werte und nur offener Wert)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.ec#1` | pw_offen (Einzelwert) | g | – / 2.5 / – | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.anzucht.ec#3` | pw_offen (Einzelwert) | g | – / 2.3 / – | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.anzucht.ec#4` (neu) | pw_offen (Einzelwerte je Teilstufe) | g | – / 0.5 / – | mS/cm | unbekannt | frankiesgarten-paprika | C | substrat_inert | indoor_led | – |

Weiterhin kein ladbarer Kandidat; Pflichtgrösse der Anzucht hängt allein an offenen Werten.

#### K-chili-06 – Chili, Anzucht, `licht_h` (jetzt verschiedene Werte, ladbarer Kandidat vorhanden)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.anzucht.licht_h#1` | pw_offen (Einzelwert) | g | – / 18 / – | h | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.anzucht.licht_h#3` | pw_offen (Einzelwert) | g | – / 18 / – | h | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.anzucht.licht_h#4` (neu) | pw | g | 14 / – / 16 | h | – | frankiesgarten-paprika | C | substrat_inert | indoor_led | – |

#### K-chili-07 – Chili, Wachstum, `ec`

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.wachstum.ec#1` | pw | v | 0.8 / – / 1.8 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| `pw.capsicum_annuum.wachstum.ec#2` | pw_offen (Obergrenze über 2.6) | g | 2.5 / – / 3.5 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.wachstum.ec#3` | pw_offen (Obergrenze über 2.6) | g | 2.5 / – / 3.5 | mS/cm (Quelle «mS») | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.wachstum.ec#4` | pw_offen (Obergrenze über 2.6) | g | 2.5 / – / 3.0 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.wachstum.ec#5` | pw_offen (Obergrenze über 2.6) | g | 2.6 / – / 3.0 | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.wachstum.ec#6` (neu) | pw_offen (Einzelwert) | g | – / 1.5 / – | mS/cm | unbekannt | frankiesgarten-paprika | C | nft | indoor_led | – |

#### K-chili-08 – Chili, Blüte, `ec`

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.bluete.ec#1` | pw | v | 0.8 / – / 1.8 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| `pw.capsicum_annuum.bluete.ec#2` | pw_offen (Obergrenze über 2.6) | g | 2.5 / – / 3.0 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.bluete.ec#3` | pw_offen (Obergrenze über 2.6) | g | 2.6 / – / 3.0 | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.bluete.ec#4` (neu) | pw_offen (Einzelwert) | g | – / 2.0 / – | mS/cm | unbekannt | frankiesgarten-paprika | C | nft | indoor_led | – |

#### K-chili-09 – Chili, Fruchtbildung und Reife, `ec`

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.fruchtbildung_reife.ec#1` | pw | v | 0.8 / – / 1.8 | mS/cm | unbekannt | okstate-hla6722-2016 | B1 | substrat_inert | andere | 2016 |
| `pw.capsicum_annuum.fruchtbildung_reife.ec#2` | pw_offen (Obergrenze über 2.6) | g | 2.5 / – / 3.0 | mS/cm (Quelle «mmhos») | unbekannt | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.fruchtbildung_reife.ec#3` | pw_offen (Obergrenze über 2.6) | g | 2.6 / – / 3.0 | mS/cm (Quelle dS/m) | unbekannt | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.fruchtbildung_reife.ec#4` (neu) | pw_offen (Einzelwert) | g | – / 2.0 / – | mS/cm | unbekannt | frankiesgarten-paprika | C | nft | indoor_led | – |

#### K-chili-10 – Chili, Keimung, `keimtemp` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.keimung.keimtemp#1` | pw | v | 25 / – / 26 | °C | – | alberta-sweet-bell-peppers | B1 | substrat_inert | gewaechshaus | – |
| `pw.capsicum_annuum.keimung.keimtemp#2` | pw | g | 25 / – / 26 | °C | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.keimung.keimtemp#3` (neu) | pw | g | 24 / – / 30 | °C | – | frankiesgarten-paprika | C | substrat_inert | andere | – |
| `pw.capsicum_annuum.keimung.keimtemp#4` (neu) | pw | g | 24 / – / 30 | °C | – | frankiesgarten-keimtabelle | C | substrat_inert | andere | – |

In Runde 1 Bestätigung (#1 = #2); mit #3 und #4 jetzt zwei verschiedene Bänder.

#### K-chili-11 – Chili, Wachstum, `ph` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.wachstum.ph#1` | pw | v | 5.8 / – / 6.1 | pH | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.wachstum.ph#3` (neu) | pw | g | 5.5 / 5.8 / 6.0 | pH | – | frankiesgarten-paprika | C | nft | indoor_led | – |
| `pw.capsicum_annuum.wachstum.ph#4` (neu) | pw | g | 5.5 / – / 6.0 | pH | – | forkfarms-minipaprika-2026 | B2 | nft | indoor_led | 2026 |

#### K-chili-12 – Chili, Blüte, `ph` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.bluete.ph#1` | pw | v | 5.8 / – / 6.1 | pH | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.bluete.ph#3` (neu) | pw | g | 5.5 / 5.8 / 6.0 | pH | – | frankiesgarten-paprika | C | nft | indoor_led | – |
| `pw.capsicum_annuum.bluete.ph#4` (neu) | pw | g | 5.5 / – / 6.0 | pH | – | forkfarms-minipaprika-2026 | B2 | nft | indoor_led | 2026 |

#### K-chili-13 – Chili, Fruchtbildung und Reife, `ph` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.fruchtbildung_reife.ph#1` | pw | v | 5.8 / – / 6.1 | pH | – | unalm-pimientos-hidroponicos-2006 | C | substrat_inert | gewaechshaus | 2006 |
| `pw.capsicum_annuum.fruchtbildung_reife.ph#3` (neu) | pw | g | 5.5 / 5.8 / 6.0 | pH | – | frankiesgarten-paprika | C | nft | indoor_led | – |
| `pw.capsicum_annuum.fruchtbildung_reife.ph#4` (neu) | pw | g | 5.5 / – / 6.0 | pH | – | forkfarms-minipaprika-2026 | B2 | nft | indoor_led | 2026 |

In K-chili-11 bis -13 haben #3 und #4 dasselbe Band 5.5–6.0; #3 nennt zusätzlich `wert_typ` 5.8.

#### K-chili-14 – Chili, Wachstum, `licht_h` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.wachstum.licht_h#1` | pw | g | 14 / – / 16 | h | – | frankiesgarten-paprika | C | nft | indoor_led | – |
| `pw.capsicum_annuum.wachstum.licht_h#2` | pw_offen (Einzelwert) | g | – / 18 / – | h | – | forkfarms-minipaprika-2026 | B2 | nft | indoor_led | 2026 |

#### K-chili-15 – Chili, Blüte, `licht_h` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.bluete.licht_h#1` | pw | g | 14 / – / 16 | h | – | frankiesgarten-paprika | C | nft | indoor_led | – |
| `pw.capsicum_annuum.bluete.licht_h#2` | pw_offen (Einzelwert) | g | – / 18 / – | h | – | forkfarms-minipaprika-2026 | B2 | nft | indoor_led | 2026 |

#### K-chili-16 – Chili, Fruchtbildung und Reife, `licht_h` (neu)

| `kandidat_id` | Datei | Status | Wert (min / typ / max) | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `pw.capsicum_annuum.fruchtbildung_reife.licht_h#1` | pw | g | 14 / – / 16 | h | – | frankiesgarten-paprika | C | nft | indoor_led | – |
| `pw.capsicum_annuum.fruchtbildung_reife.licht_h#2` | pw_offen (Einzelwert) | g | – / 18 / – | h | – | forkfarms-minipaprika-2026 | B2 | nft | indoor_led | 2026 |

#### K-chili-17 – Chili, Artmerkmal `umsetzen_ab_d` (neu)

`art.csv` hat keine Spalten für System und Umgebung; angegeben ist die Anbaumethode der Quelle aus `quelle.csv` und die Umgebung laut Fundstelle.

| `kandidat_id` | Datei | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `art.capsicum_annuum.umsetzen_ab_d#1` | art | g | 10 | Tage ab Saat | – | forkfarms-minipaprika-2026 | B2 | nft (Flex Farm) | indoor_led (laut Fundstelle) | 2026 |
| `art.capsicum_annuum.umsetzen_ab_d#2` | art | g | 21 | Tage ab Saat | – | frankiesgarten-paprika | C | nft (Tower) | – | – |

#### K-chili-18 – Chili, Artmerkmal `umsetzen_bis_d` (neu)

| `kandidat_id` | Datei | Status | Wert | Einheit | Basis | Quelle | Klasse | System | Umgebung | Jahr |
|---|---|---|---|---|---|---|---|---|---|---|
| `art.capsicum_annuum.umsetzen_bis_d#1` | art | g | 20 | Tage ab Saat | – | forkfarms-minipaprika-2026 | B2 | nft (Flex Farm) | indoor_led (laut Fundstelle) | 2026 |
| `art.capsicum_annuum.umsetzen_bis_d#2` | art | g | 35 | Tage ab Saat | – | frankiesgarten-paprika | C | nft (Tower) | – | – |

### R2.2 Plausibilität (neue Befunde)

Geprüft wie in Runde 1 gegen V3 bis V7 und V11 (Fruchtgemüse EC 0.4 bis 2.6), die Gegenprobe Chili (Anzucht 1.1, Wachstum 1.7, Blüte 1.9, Fruchtbildung 2.1 mS/cm gesamt mit ECWasser 0.5; Basis `unbekannt` rechnet als `gesamt`, also ohne Zuschlag) und gegen die Tomate. Alle neuen EC-Rohwerte sind bereits mS/cm. P1 bis P24 gelten weiter; P19 betrifft jetzt K-chili-06 mit dem ladbaren Kandidaten #4.

| Nr. | `kandidat_id` | Regel | Wert | Befund |
|---|---|---|---|---|
| P25 | `pw.capsicum_annuum.anzucht.ec#4` | V5, Gegenprobe, Inhalt | typ 0.5 | Einzelwert ohne Bandbreite, 0.6 mS/cm unter 1.1 (bei Freigabe Gegenprobe-Konflikt), und dieselbe Fundstelle nennt für die Jungpflanze 1.0, worauf sich der Vergleichswert «1. echte Blätter bzw. Jungpflanze» der Gegenprobe bezieht. |
| P26 | `pw.capsicum_annuum.wachstum.ec#6` | V5, Gegenprobe | typ 1.5 | Einzelwert ohne Bandbreite (Grund der Ablage), Abweichung zu 1.7 nur 0.2 mS/cm und damit ohne Gegenprobe-Konflikt. |
| P27 | `pw.capsicum_annuum.bluete.ec#4` | V5, Gegenprobe, Einheit | typ 2.0 | Einzelwert, Abweichung zu 1.9 nur 0.1 mS/cm; die Einheit steht nicht an der Fundstelle («EC steigt auf 2,0»), sondern im Steckbrief derselben Seite. |
| P28 | `pw.capsicum_annuum.fruchtbildung_reife.ec#4` | V5, Gegenprobe | typ 2.0 | Einzelwert, Abweichung zu 2.1 nur 0.1 mS/cm, ohne Gegenprobe-Konflikt. |
| P29 | `pw.capsicum_annuum.anzucht.dauer#7` | V6, Umrechnung, Vergleich | 14 / 14 / 28 | V6 erfüllt (typ gleich min); die Umrechnung auf den Anzuchtbeginn Tag 7 derselben Quelle ist nachvollziehbar und passt mit `keimung.dauer#5` (7–14) zu `umsetzen_ab_d#2`/`bis_d#2` (21 und 35 Tage ab Saat), weicht aber vom Wochenraster-Wert 21 aus #5 ab. |
| P30 | `pw.capsicum_annuum.keimung.keimtemp#3`, `#4` | Vergleich | 24–30 °C | Keine Validatorregel; das Band ist 6 °C breit, schliesst 25–26 °C aus #1/#2 ein, liegt über der Tomate (22–28 bzw. 22–26 °C) und stammt aus zwei Seiten desselben Betreibers. |
| P31 | `pw.capsicum_annuum.anzucht.ph#2` | V3, V5, Vergleich | 5.5 / 5.8 / 6.0 | Innerhalb 5.2 bis 7.0, Bandbreite 0.5; ein Steckbriefwert ohne Phasenangabe, für die Anzucht mit `substrat_inert`, für die übrigen Phasen mit `nft` erfasst; vergleichbar mit Tomate Anzucht 5.8–6.2. |
| P32 | `pw.capsicum_annuum.{wachstum,bluete,fruchtbildung_reife}.ph#3`, `#4` | V3, V5, Vergleich | 5.5–6.0 | Innerhalb 5.2 bis 7.0, Bandbreite 0.5; gleiches Band wie Tomate aus Fork Farms (5.5–6.0), Untergrenze 0.3 unter #1 (5.8–6.1). |
| P33 | `pw.capsicum_annuum.anzucht.licht_h#4` | V7, Phasenzuordnung | 14–16 h | In 0 bis 24; die Fundstelle liegt im Abschnitt «1 Keimphase», betrifft aber die Keimlinge nach dem Auflaufen, also den Beginn der Anzucht (BBCH 10), und weicht von 18 h Zusatzlicht im Gewächshaus (#1, #3) ab. |
| P34 | `pw.capsicum_annuum.{wachstum,bluete,fruchtbildung_reife}.licht_h#1` | V7, Vergleich | 14–16 h | In 0 bis 24; ein Steckbriefwert ohne Phasenangabe für drei Phasen, gleich wie Tomate (14–16 h aus `frankiesgarten-faq`). |
| P35 | `pw.capsicum_annuum.{wachstum,bluete,fruchtbildung_reife}.licht_h#2` | V7, Form | typ 18 | 18 h liegt in 0 bis 24, steht aber als Einzelwert in `wert_typ` statt `wert_min`/`wert_max`; die Tomate trägt denselben Fork-Farms-Wert (K-tomate-14 bis -16). |
| P36 | `pw.capsicum_annuum.{anzucht,wachstum,bluete,fruchtbildung_reife}.wassertemp#1` | V7, Vergleich | 18–24 °C | In 10 bis 28 °C, ein Steckbriefwert ohne Phasenangabe für vier Phasen, gleich wie Tomate (18–24 °C). |
| P37 | `art.capsicum_annuum.umsetzen_ab_d#1`, `umsetzen_bis_d#1` | Vergleich mit dem Profil | 10–20 Tage ab Saat | Umsetzen ab Tag 10 liegt vor dem frühesten Ende von Keimung und Anzucht nach den übrigen Kandidaten (7 + 14 = 21 Tage) und bezeichnet laut Fundstelle das Umsetzen in die Flex Farm. |
| P38 | `…ec#4`/`#6` von `frankiesgarten-paprika` | Gruppenvergleich | 0.5 / 1.0 / 1.5 / 2.0 | Wie bei okstate (P23) liegt die Chili in derselben Quellenfamilie unter der Tomate (frankiesgarten-tomaten 0.4–1.3 / 1.4–2.0 / 2.0–2.5), während der Düngeplan die Chili gleich hoch oder höher setzt. |
| P39 | `se.capsicum_annuum.dauerkultur_frucht#1` | 4.5 | 1 / 2 / 1, Klasse B | `obergrenze_samen` ≥ `samen_je_schwamm` und `pflanzen_stehen_lassen` ≥ 1 erfüllt; die `substrat_passung` vermerkt selbst, dass die Würfelgrösse der Quelle nicht belegt ist. |

Ohne Befund: `keimart` #1 und #2 (`dunkel`, nur Phase `keimung`, V8 erfüllt; Tomate ebenfalls `dunkel`); `kulturformen_erlaubt#1` und `kulturform_vorgabe#1` (`dauerkultur_frucht`, V11 erfüllt; Beleg ist Mehrfachernte über Monate in Steinwolle bzw. Kokos); `bestaeubung_noetig#1` (`ja`, gleich wie Tomate); `umsetzen_ab_d#2`/`bis_d#2` (stimmig mit dem Profil derselben Quelle, siehe P29); `keimung.dauer#5` (7 ≤ 14, über 0; abgelegt wegen fehlendem typ). Allgemein bleibt: kein Chili-Kandidat stammt aus DWC; die neuen Sollwerte kommen aus NFT-Tower bzw. Flex Farm unter LED oder aus Schaumstoffwürfeln.

### R2.3 Lückenliste nach Pflichtgrössen (03_import_w0.md 9)

#### Pflichtgrössen ohne geprüften Kandidaten (Klasse D, Prüfauftrag)

| Art | Phase | Grösse |
|---|---|---|
| Chili | `wachstum` | `dauer` |
| Chili | `bluete` | `dauer` |
| Chili | `fruchtbildung_reife` | `dauer` |

Pflichtgrössen nur mit offenem Wert (kein ladbarer Kandidat, als Konflikt «nur offener Wert» geführt): `keimung.dauer` (K-chili-02), `anzucht.ec` (K-chili-05).

Seit Runde 1 geschlossen (ladbarer Kandidat vorhanden): `keimung.keimart` (#1, #2), `anzucht.ph` (#2), `anzucht.dauer` (#7, in K-chili-04). Ladbar, aber in offenem Konflikt: `keimung.keimtemp` (K-chili-10), `keimung.wechselmerkmal` (K-chili-01), `anzucht.wechselmerkmal` (K-chili-03), `anzucht.dauer` (K-chili-04), `ec` von Wachstum bis Fruchtbildung (K-chili-07 bis -09), `ph` von Wachstum bis Fruchtbildung (K-chili-11 bis -13). Ohne Konflikt vollständig: `anwendbar` und `bbch` aller fünf Phasen, `wechselmerkmal` von Wachstum und Blüte (`fruchtbildung_reife` entfällt als letzte anwendbare Phase), `anzucht.ph`, `keimung.keimart`. Für die Teilfreigabe (8.4) fehlen damit noch 5 ladbare Pflichtwerte.

#### Nicht-Pflichtgrössen ohne Wert auf Ebene Art (Prüfauftrag nach R1.4)

| Art | Phase | Grösse |
|---|---|---|
| Chili | `keimung` | `licht_h` |
| Chili | `keimung` | `wassertemp` |

`licht_h` und `wassertemp` von Anzucht bis Fruchtbildung haben jetzt ladbare Kandidaten (`licht_h` in K-chili-06, -14 bis -16).

#### Stammfelder

Alle vier vorhanden (`name_de`, `name_wiss`, `gbif_key`, `kulturgruppe_id`, Status `vorgeschlagen`); P24 gilt weiter.

#### Artmerkmale (03_import_w0.md 4.3.2)

| Art | Feld |
|---|---|
| Chili | `samentyp` |
| Chili | `standard_keimfaehigkeit` (einziger Kandidat verworfen) |
| Chili | `systemeignung` |
| Chili | `liter_je_pflanze` |
| Chili | `wasserbedarf_je_pflanze_l` |
| Chili | `pflanzen_je_m2` |
| Chili | `wuchshoehe_max_mm` |
| Chili | `wuchsform` |
| Chili | `photoperiode` |
| Chili | `pythium` |
| Chili | `schossen_handlung` |

Seit Runde 1 vorhanden: `kulturformen_erlaubt`, `kulturform_vorgabe`, `bestaeubung_noetig`, `umsetzen_ab_d` und `umsetzen_bis_d` (beide in Konflikt, K-chili-17 und -18). Nicht als Lücke gezählt wie in Runde 1: `keimlinge_je_knaeuel`, `kritische_tageslaenge_h`, `aussaatfenster_outdoor`.

#### Kulturform-Felder `dauerkultur_frucht` (03_import_w0.md 4.3.3)

Vorhanden: `ernteart` = `mehrfach` (`ak.capsicum_annuum.dauerkultur_frucht.ernteart#1`, Status `vorgeschlagen`).

| Art | Kulturform | Feld |
|---|---|---|
| Chili | `dauerkultur_frucht` | `ernte_ab_d` |
| Chili | `dauerkultur_frucht` | `ernteintervall_d` |
| Chili | `dauerkultur_frucht` | `schnitte_max` (nach V11 nur bei `mehrfach` zulässig; im Auftrag Runde 2 nicht genannt) |
| Chili | `dauerkultur_frucht` | `kulturdauer_max_d` |
| Chili | `dauerkultur_frucht` | `kulturdauer_typisch_d` |
| Chili | `dauerkultur_frucht` | `entspitzen` |

#### Saatempfehlung

Keine Lücke mehr: `se.capsicum_annuum.dauerkultur_frucht#1` (`saatempfehlung.csv`, `frankiesgarten-keimtabelle`, 1 / 2 / 1, Klasse B, Status `geprueft`) ist ladbar. Daneben `#2` in `saatempfehlung_offen.csv` (`frankiesgarten-paprika`, nur `samen_je_schwamm` = 1); kein Widerspruch, siehe Bestätigungen.

### R2.4 Bestätigungen

| Grösse bzw. Feld | Wert | Kandidaten (Quelle, Klasse) | Bemerkung |
|---|---|---|---|
| `keimung.keimart` | `dunkel` | `pw.capsicum_annuum.keimung.keimart#1` (frankiesgarten-paprika, C), `#2` (frankiesgarten-keimtabelle, C) | beide ladbar, kein Konflikt; beide Seiten desselben Betreibers |
| `keimung.keimtemp` | 25–26 °C | `#1` (alberta, B1), `#2` (unalm, C) | jetzt Teil von K-chili-10 |
| `keimung.keimtemp` | 24–30 °C | `#3` (frankiesgarten-paprika, C), `#4` (frankiesgarten-keimtabelle, C) | Teil von K-chili-10; desselben Betreibers |
| `ph` Wachstum, Blüte, Fruchtbildung | 5.5–6.0 | je `#3` (frankiesgarten-paprika, C, typ 5.8), `#4` (forkfarms-minipaprika-2026, B2) | Teil von K-chili-11 bis -13 |
| `anzucht.licht_h` | 18 h | `#1` (alberta, B1), `#3` (unalm, C) | beide offen, Teil von K-chili-06 |
| `wachstum.ec` | 2.5–3.5 mS/cm | `#2` (alberta, B1), `#3` (unalm, C) | beide offen, Teil von K-chili-07 |
| Saatempfehlung `samen_je_schwamm` | 1 | `se.capsicum_annuum.dauerkultur_frucht#1` (frankiesgarten-keimtabelle), `#2` offen (frankiesgarten-paprika) | #2 nennt nur diesen Wert, kein Konflikt |
