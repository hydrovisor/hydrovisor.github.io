# Freigabevorschläge W0, Runde 1

Stand 12.11.2026 · W0-Probelauf, Issue #184 · Rolle Redaktor · Grundlage: die acht Fachkritik-Berichte in `data/wissensbasis/kandidaten/berichte/fachkritik_<art_id>.md` (Tomate, Chili, Salat mit Standardprofil, Nüsslisalat, Pak Choi, Basilikum, Petersilie, Schnittlauch), die Kandidatenzeilen in `data/wissensbasis/kandidaten/teile/*/` und `quelle.csv`. `recherche.md` wurde nicht gelesen.

Entscheidungsregel Konzept 9.3: (1) höhere Evidenzklasse vor tieferer, nie mitteln; (2) bei gleicher Klasse Indoor mit LED vor Gewächshaus, gleiches System wie die Anlage (DWC, Kratky) vor anderem, jüngere vor älterer Quelle; (3) bei gleichwertigen Quellen die Schnittmenge, ist sie schmaler als 0.3 bei Blattgemüse, Kräutern, Keimung, Anzucht und Kratky der Bereich mit der tieferen EC, pH immer der Bereich näher bei 6.0; (4) kein Hydroponik-Wert: Klasse D, Prüfauftrag.

Kandidaten aus `profilwert_offen.csv` und `saatempfehlung_offen.csv` erfüllen die Form des Validators nicht. Du kannst sie nur über «eigener Wert» übernehmen; sie stehen hier als Alternative mit Quelle und `grund`, ohne ergänzten oder gekürzten Wert. Konflikte, die nur offene Werte haben, bekommen keinen Vorschlag mit Status.

Gesamtbild: 61 Konflikte über acht Arten und das Standardprofil, davon 28 «nur offener Wert». In den Arbeitsdateien steht bei 31 Konflikten der gewählte ladbare Kandidat auf `status = vorgeschlagen` (vier davon in dieser Runde, die übrigen für die nächsten Runden, Abschnitt 2). Nur die Spalte `status` wurde geändert.

Auswahl dieser Runde: pH und EC der Phasen Anzucht und Wachstum haben Vorrang. Von diesen Konflikten haben nur fünf mehr als einen ladbaren Kandidaten (K-salat-08, K-pakchoi-08, K-basilikum-03, K-basilikum-04, K-tomate-06); bei K-tomate-06 ist die Schnittmenge gleich dem Kandidaten #1, der Entscheid ist deshalb kaum strittig und steht in Abschnitt 2. Die übrigen pH- und EC-Konflikte haben genau einen ladbaren Kandidaten (Vorschlag mechanisch, offene Werte als Alternative) oder gar keinen (nur «eigener Wert»).

---

## 1 Runde 1: vier Konflikte

### 1.1 K-salat-08 · Salat (`lactuca_sativa`) · Wachstum · `ph`

| Kandidat | Wert | Quelle | Klasse | System | Umgebung | Jahr | Datei |
|---|---|---|---|---|---|---|---|
| `pw.lactuca_sativa.wachstum.ph#1` | 5.6 / typ 5.8 / 6.0 | `cornell-cea-lettuce-handbook` | B1 | dwc | gewaechshaus | ohne Jahr | ladbar |
| `pw.lactuca_sativa.wachstum.ph#2` | 5.5 bis 6.0 | `cornell-gpn-leafy-greens-2016` | B1 | dwc | gewaechshaus | 2016 | ladbar |

**Vorschlag:** `#1`, 5.6 bis 6.0 (typ 5.8). Begründung: Gleiche Klasse, gleiches System und gleiche Umgebung, Regel 2 (Jahr) ist nicht anwendbar, weil `cornell-cea-lettuce-handbook` kein Jahr trägt (Befund P26); nach Regel 3 ist die Schnittmenge 5.6 bis 6.0 (Breite 0.4, nicht schmaler als 0.3), und sie ist identisch mit Kandidat #1.

**Alternative 1:** `#2`, 5.5 bis 6.0 (`cornell-gpn-leafy-greens-2016`, B1, 2016).
**Alternative 2:** keine weitere (nur zwei Kandidaten; der Nüsslisalat-Einzelwert 5.6 aus `plants-valerianella-salinity-2023` liegt in beiden Bändern, ist aber eine andere Art).
**Eigener Wert:** ____ bis ____ (pH, 5.2 bis 7.0, Band 0.2 bis 1.2)

Hinweis: Beide Kandidaten tragen Basis-unabhängige pH-Werte aus DWC im Gewächshaus; ein Indoor-LED-Wert fehlt. Standardprofil 5.5 bis 6.2 schliesst beide ein.

### 1.2 K-pakchoi-08 · Pak Choi (`brassica_rapa_chinensis`) · Wachstum · `ph`

| Kandidat | Wert | Quelle | Klasse | System | Umgebung | Jahr | Datei |
|---|---|---|---|---|---|---|---|
| `pw.brassica_rapa_chinensis.wachstum.ph#3` | 5.5 bis 6.5 | `caatinga-pakchoi-ec-2024` | A | nft | gewaechshaus | 2024 | ladbar |
| `pw.brassica_rapa_chinensis.wachstum.ph#1` | 6.0 bis 7.0 | `sfa-ph-blattgemuese-2026` | B1 | nft | gewaechshaus | 2026 | ladbar |
| `pw.brassica_rapa_chinensis.wachstum.ph#2` | 6.0 / typ 6.5 / 7.0 | `risegardens-bok-choy-2026` | B2 | dwc | indoor_led | 2026 | ladbar |
| `pw.brassica_rapa_chinensis.wachstum.ph#4` | typ 5.8 | `plosone-pakchoi-ec-2018` | A | ebbe_flut | gewaechshaus | 2018 | offen: Einzelwert |
| `pw.brassica_rapa_chinensis.wachstum.ph#5` | typ 5.7 | `frontiers-pakchoi-photoperiode-2025` | A | ebbe_flut | indoor_led | 2025 | offen: Einzelwert |

**Vorschlag:** `#3`, 5.5 bis 6.5. Begründung: Regel 1, Klasse A vor B1 und B2; `#3` ist der einzige ladbare Kandidat der Klasse A (die beiden anderen A-Werte sind Einzelwerte und offen).

**Alternative 1:** `#1`, 6.0 bis 7.0 (`sfa-ph-blattgemuese-2026`, B1, NFT, Gewächshaus, 2026), bestätigt durch `#2` (B2, DWC, Indoor-LED, typ 6.5). Die Versuchsquelle von `#1` fand bei 6.0, 6.5 und 7.0 keinen Unterschied; Obergrenze 7.0 liegt genau an der Validatorgrenze.
**Alternative 2:** eigener Wert gestützt auf `#4` (5.8, A, 2018) oder `#5` (5.7, A, Indoor-LED, 2025); beide liegen im Vorschlag `#3` und wären je ein eigenes Band um den Einzelwert (`grund`: Einzelwert).
**Eigener Wert:** ____ bis ____ (pH, 5.2 bis 7.0, Band 0.2 bis 1.2)

Hinweis: Alle drei A-Quellen liegen bei 5.5 bis 6.5 oder darin; die beiden B-Quellen beginnen erst bei 6.0. Der Düngeplan hat für Pak Choi kein pH-Fenster, das gegen eine der Varianten spräche.

### 1.3 K-basilikum-03 · Basilikum (`ocimum_basilicum`) · Wachstum · `ph`

| Kandidat | Wert | Quelle | Klasse | System | Umgebung | Jahr | Datei |
|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.ph#3` | 5.5 bis 6.5 | `fao-aquaponik-2014` | B1 | dwc (Aquaponik) | andere | 2014 | ladbar |
| `pw.ocimum_basilicum.wachstum.ph#1` | 5.5 bis 6.0 | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 | ladbar |
| `pw.ocimum_basilicum.wachstum.ph#2` | 5.8 bis 6.2 | `johnnys-basilikum-hydro` | C | dwc | andere | ohne Jahr | ladbar |

**Vorschlag:** `#3`, 5.5 bis 6.5. Begründung: Regel 1 lässt die beiden B1-Kandidaten `#1` und `#3`; Regel 2 entscheidet beim System, `#3` trägt `system_quelle = dwc` wie die Anlage, `#1` inertes Substrat (Umgebung bei beiden `andere`, das Jahr kommt nicht mehr zum Zug).

**Alternative 1:** `#1`, 5.5 bis 6.0 (`okstate-hla6722-2016`, B1, Substrat, 2016). Sie ist jünger und stammt aus reiner Hydroponik ohne Fische; die Obergrenze 6.5 von `#3` ist ein Aquaponik-Wert, und `#2` nennt für aquaponische Systeme ausdrücklich «slightly higher» pH (Befund P6).
**Alternative 2:** `#2`, 5.8 bis 6.2 (`johnnys-basilikum-hydro`, C, DWC, ohne Jahr).
**Eigener Wert:** ____ bis ____ (pH, 5.2 bis 7.0, Band 0.2 bis 1.2)

Hinweis für Deinen Entscheid: Der Vorschlag folgt der Regel strikt; fachlich spricht der Aquaponik-Bezug für Alternative 1. Die Schnittmenge aller drei Kandidaten wäre 5.8 bis 6.0 (Breite 0.2); sie kommt nach Regel 3 nicht zum Zug, weil Regel 2 bereits entscheidet, und ist hier nur der Vollständigkeit halber genannt.

### 1.4 K-basilikum-04 · Basilikum (`ocimum_basilicum`) · Wachstum · `ec`

| Kandidat | Wert | Basis | Quelle | Klasse | System | Umgebung | Jahr | Datei |
|---|---|---|---|---|---|---|---|---|
| `pw.ocimum_basilicum.wachstum.ec#1` | 1.0 bis 1.6 mS/cm | unbekannt | `okstate-hla6722-2016` | B1 | substrat_inert | andere | 2016 | ladbar |
| `pw.ocimum_basilicum.wachstum.ec#2` | 1.0 bis 1.4 mS/cm | unbekannt | `johnnys-basilikum-hydro` | C | dwc | andere | ohne Jahr | ladbar |

**Vorschlag:** `#1`, 1.0 bis 1.6 mS/cm (Basis unbekannt). Begründung: Regel 1, B1 vor C.

**Alternative 1:** `#2`, 1.0 bis 1.4 mS/cm (`johnnys-basilikum-hydro`, C, DWC). Die Quelle bindet das Band an die Jahreszeit («during winter, crops need a higher EC»), der Testbetrieb läuft im Winter (Befund P3).
**Alternative 2:** keine weitere.
**Eigener Wert:** ____ bis ____ mS/cm, Basis ____ (0.4 bis 2.0, Band 0.2 bis 1.2)

Hinweis: Gegenprobe Düngeplan Basilikum Wachstum 1.4 mS/cm; Bandmitte `#1` 1.3 (Abweichung 0.1), `#2` 1.2 (0.2), beide ohne Gegenprobe-Konflikt. Beide Kandidaten haben Basis `unbekannt`, die App zeigt dauerhaft «EC-Basis unklar» (Befund P4).

---

## 2 Weitere Konflikte (nächste Runden)

Vorschlag in einem Satz. «Status gesetzt» heisst: der genannte Kandidat steht in den Arbeitsdateien auf `vorgeschlagen`. Bei «nur offen» gibt es keinen ladbaren Kandidaten; Du kannst nur über «eigener Wert» übernehmen, der genannte Kandidat ist dann Deine Stütze.

### 2.1 pH und EC der Phasen Anzucht und Wachstum (ein ladbarer Kandidat oder nur offen)

| Konflikt | Art · Phase · Grösse | Vorschlag | Status gesetzt |
|---|---|---|---|
| K-tomate-06 | Tomate · Wachstum · pH | `#1` 5.8–6.2 (`ufifas-hs796-2024`, B1, 2024); Regel 2 nicht anwendbar (`ua-ceac-kurs-kap10` ohne Jahr), Regel 3: Schnittmenge 5.8–6.2 ist gleich `#1`; Alternative 1 `#2` 5.8–6.5. | ja |
| K-tomate-07 | Tomate · Wachstum · EC | `#1` 1.2–1.4 gesamt (`johr-singletruss-ec-2023`, A); Regel 1; Alternativen nur offen: `#2` typ 2.0 (`osu-hyg1437-2018`, B1, Einzelwert), `#3` 2.0–4.0 (`okstate-hla6722-2016`, B1, Band 2.0 und Obergrenze über 2.6). Hinweis Befund P14: Ein-Fruchtstand-System, Tims Kulturform ist Dauerkultur. | ja |
| K-tomate-04 | Tomate · Anzucht · EC | nur offen: `#2` typ 2.0 (`osu-hyg1437-2018`, B1, Einzelwert; Gegenprobe 1.0 um 1.0 verfehlt, Stage 1 reicht bis zum zweiten Blütenstand). Ohne eigenen Wert Klasse D. | nein |
| K-chili-05 | Chili · Anzucht · EC | nur offen: `#1` typ 2.5 (`alberta-sweet-bell-peppers`, B1), `#3` typ 2.3 (`unalm-pimientos-hidroponicos-2006`, C); beide beschreiben das Tränken der Steinwollblöcke, nicht ein Sollband (Befunde P4, P5). Ohne eigenen Wert Klasse D. | nein |
| K-chili-07 | Chili · Wachstum · EC | `#1` 0.8–1.8 unbekannt (`okstate-hla6722-2016`, B1, einziger ladbarer); Alternativen offen: `#2`/`#3` 2.5–3.5 (alberta B1 und unalm C, bestätigt, erste ein bis zwei Wochen nach Auspflanzen), `#4` 2.5–3.0, `#5` 2.6–3.0 (alle Obergrenze über 2.6). Gegenprobe 1.7: Mitte 1.3, Abweichung genau 0.4. | ja |
| K-salat-05 | Salat · Anzucht · EC | `#1` 0.5–1.0 unbekannt (`utk-ufl-w844b-2019`, B1, einziger ladbarer); Alternative offen `#2` typ 1200 µS/cm zuwachs (`cornell-cea-lettuce-handbook`, Einzelwert; als Gesamt-EC 1.7 gegen Gegenprobe 1.0). Hinweis P4: `#1` gilt laut Zitat nur «for the first few days». | ja |
| K-salat-09 | Salat · Wachstum · EC | `#2` 1.5–2.0 unbekannt (`utk-ufl-w844b-2019`, B1, DWC, einziger ladbarer); Alternativen offen `#3` 1150–1250 µS/cm zuwachs (Cornell, Band 0.1), `#4` typ 1.3 (`purdue-ho-309-2020`, NFT). Achtung P1: Bandmitte 1.75 gegen 1.2, Gegenprobe-Konflikt 0.55 bei Freigabe. | ja |
| K-salat-04 | Salat · Anzucht · pH | nur offen: `#2` typ 5.8 (`cornell-cea-lettuce-handbook`, B1, Einzelwert). Pflichtgrösse; ohne eigenen Wert Klasse D. | nein |
| K-nuesslisalat-04 | Nüsslisalat · Wachstum · pH | nur offen: `#1` typ 5.6 (`plants-valerianella-salinity-2023`, A, DWC, Einzelwert). Pflichtgrösse. | nein |
| K-nuesslisalat-05 | Nüsslisalat · Wachstum · EC | nur offen: `#1` typ 2.47 gesamt (`plants-valerianella-salinity-2023`, A; Kontrolllösung einer Salzstress-Studie, über Validatorgrenze 2.0, Gegenprobe 1.0 um 1.47 verfehlt). Ein eigener Wert darüber bricht V4 ab. | nein |
| K-pakchoi-05 | Pak Choi · Anzucht · pH | `#1` 6.0–7.0 (`sfa-ph-blattgemuese-2026`, B1, einziger ladbarer); Alternative offen `#2` typ 5.8 (`plosone-pakchoi-ec-2018`, A, Einzelwert, höhere Klasse, aber nicht ladbar). | ja |
| K-pakchoi-06 | Pak Choi · Anzucht · EC | nur offen: `#1` typ 1.2 gesamt (`plosone-pakchoi-ec-2018`, A, Einzelwert; V4 und Gegenprobe 1.0 eingehalten). Pflichtgrösse. | nein |
| K-pakchoi-09 | Pak Choi · Wachstum · EC | `#1` 1.5–2.0 unbekannt (`okstate-hla6722-2016`, B1, einziger ladbarer, Obergrenze genau 2.0); Alternativen offen `#2` 1.8–2.4 gesamt (A, 2018), `#3` typ 2.3 (A, Indoor-LED, 2025), `#4` 1.5–2.5 (B2, DWC, LED), alle über Validatorgrenze 2.0. Gegenprobe 1.4: Mitte 1.75, Abweichung 0.35. | ja |
| K-petersilie-01 | Petersilie · Wachstum · EC | nur offen: `#5` typ 1.56 gesamt (`plos-one-dill-petersilie-2021`, A, DWC; einziger Kandidat, der V4 und Gegenprobe 1.3 einhält), daneben `#4` typ 2.0 (ISU, B1), `#2` 1.8–2.2 (okstate, B1), `#3` 0.5–4.0 (Versuchsstufen). Regel 1 stützt `#5`. | nein |
| K-petersilie-02 | Petersilie · Wachstum · pH | nur offen: `#2` typ 6.0 (`plos-one-dill-petersilie-2021`, A, DWC, Einzelwert), `#1` 5.0–6.0 (`isu-ph-kraeuter-2025`, B1, Untergrenze unter 5.2). Regel 1 stützt `#2`; Düngeplan Box 2.2 hat pH 6.0–6.2. | nein |
| K-schnittlauch-01 | Schnittlauch · Wachstum · EC | nur offen: `#2` 2.02–2.44 gesamt (`hortic-bras-schnittlauch-2022`, A, NFT; ganzes Band über 2.0, Gegenprobe 1.3 um 0.93 verfehlt, gemessene Versuchswerte). Ein eigener Wert darüber bricht V4 ab. | nein |

### 2.2 Dauer und Umsetzfenster

| Konflikt | Art · Phase · Grösse | Vorschlag | Status gesetzt |
|---|---|---|---|
| K-tomate-01 | Tomate · Keimung · dauer | nur offen: `#2` typ 14 Tage (`ua-tomato-workshop-modul2-2026`, B1; Rasterpunkt «Woche 2», gleicher Wert für Chili). | nein |
| K-tomate-03 | Tomate · Anzucht · dauer | nur offen: `#2` typ 21 Tage (dieselbe Folie, 35 minus 14). | nein |
| K-chili-02 | Chili · Keimung · dauer | nur offen: `#1` 7–10 Tage ohne typ (`alberta-sweet-bell-peppers`, B1) gegen `#4` typ 14 (Wochenraster); Regel 2 nicht anwendbar (alberta ohne Jahr), die Alberta-Spanne ist artspezifisch, das Raster nicht (Befund P17). | nein |
| K-chili-04 | Chili · Anzucht · dauer | nur offen: `#5` typ 21 Tage (Wochenraster, Befund P18). | nein |
| K-salat-03 | Salat · Anzucht · dauer | nur offen: `#4` 11 Tage ab Saat inkl. Keimung (`cornell-cea-lettuce-handbook`, B1); Umrechnung auf Phasenbeginn braucht `keimung.dauer`, die fehlt. | nein |
| K-salat-07 | Salat · Wachstum · dauer | nur offen: `#1` und `#3` typ 24 Tage ab Umsetzen bei DLI 17 (Cornell, zwei Quellen, bestätigt) gegen `#2` 48 Tage bei DLI 8.5; alle drei für Kopfernte, nicht Schnitt (Befund P10). | nein |
| K-salat-11 | Salat · Artmerkmal `umsetzen_ab_d` | `#1` 12 Tage (`utk-ufl-w844b-2019`, B1); Regel 2 nicht anwendbar (Cornell ohne Jahr), `#1` bildet mit `umsetzen_bis_d#1` ein Fenster aus demselben Satz; Alternative `#2` 11 (Cornell, passt zu K-salat-03). | ja |
| K-salat-12 | Salat · Artmerkmal `umsetzen_bis_d` | `#1` 18 Tage (`utk-ufl-w844b-2019`, B1, 2019); Regel 2 jünger als `#2` 22 (2016), das zudem nur bei halbem DLI gilt. | ja |
| K-nuesslisalat-02 | Nüsslisalat · Anzucht · dauer | nur offen: `#1` 22 Tage ab Saat inkl. Keimung (`plants-valerianella-salinity-2023`, A; Steinwoll-Plugs, nicht Direktsaat). | nein |
| K-nuesslisalat-03 | Nüsslisalat · Wachstum · dauer | nur offen: `#1` typ 29 Tage ab Umsetzen (dieselbe Quelle, A). Siehe Befund P6 zu `ernte_ab_d`. | nein |
| K-pakchoi-01 | Pak Choi · Artmerkmal `umsetzen_ab_d` | `#1` 14 Tage (`sfa-ph-blattgemuese-2026`, B1); Regel 1 vor `#2` 7 (B2). | ja |
| K-pakchoi-02 | Pak Choi · Artmerkmal `umsetzen_bis_d` | `#1` 16 Tage (`sfa-ph-blattgemuese-2026`, B1); Regel 1 vor `#2` 10 (B2). | ja |
| K-pakchoi-03 | Pak Choi · Kulturform `kopf` · `ernte_ab_d` | `#2` 21 Tage ab Umsetzen (`frontiers-pakchoi-photoperiode-2025`, A, Indoor-LED); Regel 1 vor `#1` (B1, gleicher Wert, Bestätigung), Regel 2 Indoor-LED vor `#3` 35 (A, Gewächshaus, 2024). | ja |
| K-pakchoi-07 | Pak Choi · Wachstum · dauer | nur offen: `#1`/`#2` min 21 Tage (B1 und A, bestätigt) gegen `#3` min 35 (A); alle nur `wert_min`. | nein |

### 2.3 Übriges (Wechselmerkmale, Keimtemperatur, Licht, Wassertemperatur, Saatempfehlung)

| Konflikt | Art · Phase · Grösse | Vorschlag | Status gesetzt |
|---|---|---|---|
| K-tomate-02 | Tomate · Keimung · wechselmerkmal | `#1` «Sind die Keimblätter vollständig entfaltet?» (`bbch-monografie-2001`, B1); Regel 2 nicht entscheidend (`ua-ceac-kurs-kap6` ohne Jahr), `#1` trifft BBCH 10 und damit den Beginn von `anzucht.bbch` 10–19, `#2` (erstes echtes Blatt) liegt schon in der Anzucht (Befund P04). | ja |
| K-tomate-05 | Tomate · Anzucht · wechselmerkmal | `#2` «mehrere echte Blätter, Wurzeln durch das Substrat» (`ua-tomato-workshop-modul2-2026`, B1, 2026); Regel 2 jünger als `#1` (2023). | ja |
| K-tomate-08, -10 | Tomate · Blüte und Fruchtbildung · pH | `#1` 5.8–6.2 (`ufifas-hs796-2024`), wie K-tomate-06. | ja |
| K-tomate-09, -11 | Tomate · Blüte und Fruchtbildung · EC | `#1` 1.2–1.4 gesamt (`johr-singletruss-ec-2023`, A), Regel 1; Achtung Gegenprobe 1.9 und 2.1 um 0.6 und 0.8 verfehlt (Befunde P20, P24), offene Alternativen 2.0–4.0, typ 2.4, 2.5–3.5 alle über 2.6. | ja |
| K-chili-01 | Chili · Keimung · wechselmerkmal | `#1` BBCH 10 (`bbch-monografie-2001`, B1), wie K-tomate-02. | ja |
| K-chili-03 | Chili · Anzucht · wechselmerkmal | `#1` «fünf bis sechs echte Blätter» (`aces-anr2954-2023`, B1); Regel 1 vor `#2` (C). | ja |
| K-chili-08, -09 | Chili · Blüte und Fruchtbildung · EC | `#1` 0.8–1.8 (`okstate-hla6722-2016`, B1, einziger ladbarer); Gegenprobe 1.9 und 2.1 um 0.6 und 0.8 verfehlt; offene Alternativen 2.5–3.0, 2.6–3.0. | ja |
| K-chili-06 | Chili · Anzucht · licht_h | nur offen: `#1` und `#3` typ 18 h (alberta B1, unalm C, bestätigt; Zusatzlicht im Gewächshaus). | nein |
| K-salat-01 | Salat · Keimung · keimtemp | `#1` 5 / 20 / 33 °C (`sci-agric-lettuce-thermoinhibition-2003`, B1, einziger ladbarer); Vorbehalt P15: min und max sind Keimgrenzen einzelner Genotypen, kein Zielband; offene Alternativen `#2` typ 20, `#3` 64–68 °F, `#4` 70–75 °F. | ja |
| K-salat-02 | Salat · Anzucht · wechselmerkmal | `#2` «drei bis fünf echte Blätter und Wurzeln sichtbar» (`utk-ufl-w844b-2019`, B1, 2019); Regel 2 jünger als `#1` (2016). Folge P17: `anzucht.bbch` Ende 13 wurde nach `#1` gewählt und wäre neu abzustimmen. | ja |
| K-salat-06 | Salat · Anzucht · licht_h | nur offen: `#2` typ 24 h (Cornell, Einzelwert). | nein |
| K-salat-10 | Salat · Wachstum · wassertemp | nur offen: `#1` Stellwerte 24/25/26 °C (Cornell). | nein |
| K-standard-01 | Standard · Wachstum · wassertemp | nur offen: `#2` 72–75 °F (`okstate-hla-6722-2016`, B1; umgerechnet 22.2–23.9 °C, in °F nicht ladbar). | nein |
| K-nuesslisalat-01 | Nüsslisalat · Keimung · keimtemp | nur offen: `#1` 5–20 °C ohne typ (`acta-hort-267-valerianella-germination-1990`, B1). | nein |
| K-pakchoi-04 | Pak Choi · Anzucht · wechselmerkmal | `#1` «4 bis 5 echte Laubblätter» (`caatinga-pakchoi-ec-2024`, A, 2024); Regel 1 vor `#2` (B2), Regel 2 jünger als `#3` (A, 2018). | ja |
| K-pakchoi-10 | Pak Choi · Saatempfehlung `kopf` | `#1` 1 / 1 / 1 (`frontiers-pakchoi-photoperiode-2025`, Saatmengen-Klasse B, Indoor-LED, Steinwollstopfen); Regel 1 vor `#2` 5 / 5 / 1 (Klasse C, Kokosfaser). | ja |
| K-basilikum-01 | Basilikum · Keimung · keimtemp | nur offen: `#1` 20–25 °C ohne typ (`fao-aquaponik-2014`, B1) vor `#2` typ 20 (Tüte, C); Regel 1. | nein |
| K-basilikum-02 | Basilikum · Anzucht · wechselmerkmal | `#2` «3 bis 5 echte Blätter und Wurzeln sichtbar» (`utk-uf-w844b-2019`, B1, 2019); Regel 2 jünger als `#1` (2014). Folge P11: `anzucht.bbch` Ende 12 neu abzustimmen. | ja |
| K-basilikum-05 | Basilikum · Wachstum · licht_h | nur offen: `#1` min 14 h (`johnnys-basilikum-hydro`, C). | nein |
| K-basilikum-06 | Basilikum · Wachstum · wassertemp | nur offen: `#1` min 21 °C (`fao-aquaponik-2014`, B1). | nein |
| K-petersilie-03 | Petersilie · Wachstum · wassertemp | nur offen: `#1` typ 22 °C (`isu-ph-kraeuter-2025`, B1). | nein |
| K-petersilie-04 | Petersilie · Wachstum · licht_h | nur offen: `#1` typ 16 h (`isu-ph-kraeuter-2025`, B1). | nein |
| K-petersilie-05 | Petersilie · Saatempfehlung `dauerkultur_blatt` | nur offen: `#1` 5 Samen / Obergrenze fehlt / 3 Pflanzen (`isu-ph-kraeuter-2025`, Klasse B); siehe Abschnitt 5.1. | nein |
| K-schnittlauch-02 | Schnittlauch · Wachstum · licht_h | nur offen: `#1` min 14 h (`cafre-salate-kraeuter-2020`, B1; Schwelle, kein Sollband). | nein |

---

## 3 Klasse-D-Lücken (Prüfaufträge)

Keine geprüften Kandidaten, auch nicht offen. Zusammengefasst je Art; Einzelfelder stehen in den Lückenlisten der Fachkritik-Berichte (Abschnitt 3). «Pflicht» heisst Pflichtgrösse nach `03_import_w0.md` 9; ohne sie lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Art nicht (8.4). Zählung nach den Fachkritikern.

| Art | Pflichtgrössen (Phase · Grösse) | Stammfelder | Artmerkmale | Kulturform-Felder | Saatempfehlung | Summe |
|---|---|---|---|---|---|---|
| Tomate | 4: Keimung keimart; Wachstum, Blüte, Fruchtbildung dauer | 0 | 18 (davon 2 bedingt oder optional) | 6 (`dauerkultur_frucht`) | Klasse-D-Zeile nach R12.3, Abschnitt 5.1 | 28 |
| Chili | 5: Keimung keimart; Anzucht ph; Wachstum, Blüte, Fruchtbildung dauer | 0 | 16 | 6 (`dauerkultur_frucht`) | 1 (`se.capsicum_annuum.dauerkultur_frucht`, kein Kandidat, kein Entscheid) | 32 (mit 4 Nicht-Pflicht) |
| Salat | 3: Keimung dauer; Blüte und Fruchtbildung anwendbar (Abschnitt 5.2) | 2: `name_de`, `kulturgruppe_id` (Kandidaten verworfen) | 11 (dazu 1 bedingt, 1 optional), darunter `kulturformen_erlaubt` und `kulturform_vorgabe` | 6 (`schnitt`) | 1 (`se.lactuca_sativa.schnitt`, beide Kandidaten verworfen) | 23 |
| Standardprofil | `ph` Keimung; `wassertemp` und `licht_h` in allen Phasen (Wachstum `wassertemp` nur offen) | – | – | – | – | 10 |
| Nüsslisalat | 9: Keimung dauer, keimart; Anzucht bbch, ph, ec, wechselmerkmal; Wachstum bbch; Blüte und Fruchtbildung anwendbar | 1: `kulturgruppe_id` | 14 (dazu 1 bedingt, 1 optional), darunter `systemeignung` (Kratky) und `wasserbedarf_je_pflanze_l` | 3 (`kopf`) | 1 (`se.valerianella_locusta.kopf`) | 28 |
| Pak Choi | 6: Keimung dauer, keimart, keimtemp; Anzucht dauer; Blüte und Fruchtbildung anwendbar | 0 | 12, darunter `kritische_tageslaenge_h` (nötig, `photoperiode = langtag`) | 2 (`kopf`) | 0 | 20 |
| Basilikum | 5: Keimung dauer; Anzucht dauer, ph, ec; Wachstum dauer | 0 | 12 (dazu 1 bedingt, 1 optional) | 5 (`dauerkultur_blatt`) | 0 | 22 |
| Petersilie | 13: Keimung dauer, bbch, keimart, keimtemp; Anzucht dauer, bbch, ph, ec; Wachstum dauer, bbch, wechselmerkmal (nur als Gruppen-Mindestzeile); Blüte und Fruchtbildung anwendbar | 0 | 17 | 7 (`dauerkultur_blatt`, alle) | Klasse-D-Zeile nach R12.3, Abschnitt 5.1 | 37 |
| Schnittlauch | 13: Keimung anwendbar, dauer, bbch, keimart, keimtemp; Anzucht dauer, bbch, ph, ec; Wachstum dauer, bbch; Blüte und Fruchtbildung anwendbar | 0 | 17 | 6 (`dauerkultur_blatt`) | 1 (`se.allium_schoenoprasum.dauerkultur_blatt`, kein Kandidat, kein Entscheid) | 37 |

Summe: 58 Pflichtgrössen-Lücken auf Ebene Art (ohne Standardprofil), insgesamt rund 237 Prüfaufträge. Dazu `wassertemp` und `licht_h` in fast allen Phasen aller Arten ohne Pflicht (Standardprofil liefert, dort fehlen aber alle `licht_h`-Werte, Befund S5).

Folgen, die Du kennen musst:

- Keine der acht Arten ist zurzeit vollständig ladbar; bei allen fehlt mindestens eine `dauer`. Für den Vorab-Lauf der Keimungszeilen bis 15.12. fehlt `keimung.dauer` bei allen acht Arten (Tomate und Chili nur offen).
- Ebene `kulturgruppe` (V13): Für `kohl`, `blattsalat`, `kraut_einjaehrig`, `kraut_ausdauernd` und `fruchtgemuese` fehlen die Mindestzeilen, weil die Leitkulturen ihre Pflichtgrössen nicht vollständig haben.
- Chili und Schnittlauch haben keine Saatempfehlung und keinen Entscheid nach R12.3.

---

## 4 Plausibilitätsbefunde, die Du kennen musst

1. **Gegenprobe-Konflikte bei ladbaren Kandidaten** (Konzept 9.4, Abweichung über 0.4 mS/cm): Tomate Blüte und Fruchtbildung EC 1.2–1.4 (A) gegen 1.9 und 2.1; Chili Blüte und Fruchtbildung EC 0.8–1.8 gegen 1.9 und 2.1; Salat Wachstum EC 1.5–2.0 gegen 1.2 (0.55). Bei Freigabe dieser Werte zeigt die App den Konflikt zum Düngeplan.
2. **Tomate und Chili EC**: Die einzige A-Quelle der Tomate (`johr-singletruss-ec-2023`) empfiehlt 1.2–1.4 für die ganze Kultur im Ein-Fruchtstand-System, Deine Kulturform ist eine Dauerkultur (P14). Alle höheren Werte (2.0–4.0, 2.5–3.5) sind offen, teils Tropf-EC aus Substratkultur mit Drain (P32, Chili P8). Dieselbe okstate-Tabelle setzt Peperoni mit 0.8–1.8 deutlich unter Tomate 2.0–4.0, der Düngeplan umgekehrt gleich oder höher (Chili P23).
3. **EC-Basis unbekannt**: Fast alle ladbaren EC-Kandidaten (Salat, Pak Choi, Basilikum, Chili) haben Basis `unbekannt`; die App zeigt dauerhaft «EC-Basis unklar» und rechnet als Gesamt-EC.
4. **Kein Kandidat aus DWC unter Indoor-LED** für pH oder EC bei Tomate, Chili, Salat, Nüsslisalat und den Kräutern; nur Pak Choi hat Indoor-LED-Werte (B2 und offen A).
5. **Nüsslisalat**: Alle hydroponischen Werte stammen aus einer einzigen Floating-Studie im Gewächshaus mit Steinwoll-Plugs; `ernte_ab_d` 29 Tage ab Umsetzen würde bei Deiner Direktsaat im Kratky rund drei Wochen zu früh «Ernte möglich» melden (P6). Die EC der Kontrolllösung 2.47 liegt über der Validatorgrenze.
6. **Salat Kulturform**: Die Dauer-Kandidaten (24 und 48 Tage) und `pflanzen_je_m2` 38 gelten für Kopfsalat, nicht für Schnitt (P10, P22); die BBCH-Skala gilt für nicht kopfbildenden Salat, Eissalat Roxette ist eine Kopfsorte als Schnittsalat geführt (P18).
7. **Wechselmerkmal und BBCH**: Fällt Dein Entscheid bei Salat (K-salat-02) und Basilikum (K-basilikum-02) wie vorgeschlagen auf den jüngeren Kandidaten, passt das BBCH-Ende der Anzucht (13 bzw. 12) nicht mehr zum Merkmal; bei Tomate und Chili sind BBCH 17 bis 20 keiner Phase zugeordnet (Tomate P05, Chili P21).
8. **Anzucht-Werte sind oft keine Sollbereiche**: Tomate `anzucht.ph#1` 5.6–5.8 (ohne Konflikt, B2) beschreibt das einmalige Sättigen der Steinwollblöcke (P09); Chili `anzucht.ec` beschreibt das Tränken der Blöcke; Salat `anzucht.ec#1` gilt nur «for the first few days» (P4).
9. **Zeitplan-Raster**: Keim- und Anzuchtdauer von Tomate und Chili (14 und 21 Tage) stammen aus einer Wochenfolie mit gleicher Spalte für beide Arten, nicht aus artspezifischen Messungen (Tomate P02, P07; Chili P17, P18).
10. **Quellen ohne Jahr**: `cornell-cea-lettuce-handbook`, `ua-ceac-kurs-kap6`, `ua-ceac-kurs-kap10`, `alberta-sweet-bell-peppers`, `johnnys-basilikum-hydro` tragen in `quelle.csv` kein Jahr; Regel 2 (jünger vor älter) ist mit ihnen nicht anwendbar.
11. **Koordinator-Hinweise aus den Berichten**: `q.ufl-hs1258-2015` ist `geprueft` ohne `methodenpruefung` (Salat P27); `art.capsicum_annuum.name_de#1` stammt nicht von GBIF (Chili P24); Salat `keimung.ph#1` darf nicht in die Gruppenzeilen kopiert werden (V13, P9).

---

## 5 Zwei Punkte ausserhalb der Konfliktregel

### 5.1 Saatempfehlungen Klasse D nach Deinem Entscheid R12.3

Der Koordinator legt diese Zeilen in `saatempfehlung_offen.csv` an (Annahme 6 und 7 in `docs/w0/ablauf.md`). Dein Entscheid nennt nicht alle Pflichtfelder nach `03_import_w0.md` 4.5; bitte beantworte je Zeile die offenen Felder.

**`se.petroselinum_crispum.dauerkultur_blatt#2`** (Klasse D, 15 Samen je Schwamm, Begründung «entschieden von Tim, Konzept R12.3»)

- `obergrenze_samen`: Wie viele Samen je Schwamm höchstens? (Ganzzahl, mindestens 15)
- `pflanzen_stehen_lassen`: Wie viele Pflanzen bleiben im Büschel stehen? (Ganzzahl, mindestens 1; der Fachkritiker weist darauf hin, dass `03_import_w0.md` 4.5 in der Spalte `pflanzen_stehen_lassen` «Petersilie 15» als Beispiel nennt, der Text aber von 15 Samen spricht; gilt 15 für die Samen, für die Pflanzen oder für beides?)
- `substrat_passung`: Text zur Passung gegen den Würfel 2.2 cm.
- Konkurrenz K-petersilie-05: Kandidat `#1` aus `isu-ph-kraeuter-2025` (Klasse B) nennt 5 Samen je Schwamm und 3 Pflanzen stehen lassen, `obergrenze_samen` fehlt. Bleibt es bei 15 Samen, oder übernimmst Du 5 / 3 über «eigener Wert»? Sobald die Klasse-D-Zeile steht, trägt sie dieselbe `konflikt_id` K-petersilie-05.

**`se.solanum_lycopersicum.dauerkultur_frucht#1`** (Klasse D, 1 Pflanze stehen lassen, Begründung «entschieden von Tim, Konzept R12.3»)

- `samen_je_schwamm`: Wie viele Samen säst Du je Anzuchtplatz? (Ganzzahl, mindestens 1)
- `obergrenze_samen`: Höchstens wie viele? (Ganzzahl, mindestens `samen_je_schwamm`)
- `substrat_passung`: Text; die Anzucht erfolgt laut Auftrag im 8-cm-Topf statt im Würfel 2.2 cm, das gehört in dieses Feld.
- Rückfrage des Fachkritikers: `pflanzen_stehen_lassen = 1` folgt aus «1 Pflanze je Topf» nur, wenn «Topf» den Anzuchtplatz meint. Stimmt das?

Kein Entscheid liegt vor für Chili (`se.capsicum_annuum.dauerkultur_frucht`) und Schnittlauch (`se.allium_schoenoprasum.dauerkultur_blatt`); beide bleiben Klasse-D-Lücken, bis Du eine Saatmenge nennst.

### 5.2 `anwendbar = entfaellt` für Blüte und Fruchtbildung bei Blattgemüse und Kräutern

Annahme 2 in `docs/w0/ablauf.md` sieht vor, dass `anwendbar = entfaellt` für Blüte und Fruchtbildung bei Blattgemüse und Kräutern aus Konzept R1.1 folgt und als Quelle die BBCH-Monografie mit der Fundstelle der Art trägt. Die Quellenprüfer haben diese Zeilen verworfen, weil «entfaellt» nicht wörtlich in der Monografie steht (sie führt die Stadien Blüte und Fruchtbildung); der Wert folgt aus R1.1, nicht aus der Quelle. Die Fachkritiker melden das als Widerspruch der Prüfregeln (Salat P19, Pak Choi L5 und L6, Nüsslisalat P14, Petersilie L11 und L12, Schnittlauch L12 und L13).

Betroffen: **Salat** (Kandidaten verworfen), **Pak Choi** (Kandidaten verworfen), **Nüsslisalat**, **Petersilie** und **Schnittlauch** (keine Zeile vorhanden). Nur **Basilikum** hat beide `entfaellt`-Zeilen geprüft und ladbar (P14 im Basilikum-Bericht).

Folge: Ohne diese zwei Zeilen je Art lädt der Seed Kulturform-Felder, Saatempfehlung und `profilwert` der Art nicht (`03_import_w0.md` 8 Punkt 4), auch wenn alle übrigen Werte entschieden sind; den Kulturgruppen `blattsalat`, `kohl` und `kraut_ausdauernd` fehlen damit die Mindestzeilen (V13).

**Frage an Dich:** Soll `anwendbar = entfaellt` für Blüte und Fruchtbildung bei Blattgemüse und Kräutern als Regelwert nach Konzept R1.1 gelten, also ohne Beleg in der Quelle gültig sein (Quelle und Fundstelle wie in Annahme 2: BBCH-Monografie mit der Fundstelle der Art, oder eine eigene Kennzeichnung als Konzeptwert)? Wenn ja, kann der Koordinator die Zeilen für Salat, Pak Choi, Nüsslisalat, Petersilie und Schnittlauch anlegen oder die verworfenen wieder zulassen; wenn nein, bleibt jede dieser Arten bis zu einem anderen Beleg nicht ladbar.
