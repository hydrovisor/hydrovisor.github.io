# Recherche kraut_einjaehrig (Basilikum, ocimum_basilicum), W0-Probelauf #184

Stand 12.11.2026 · Rechercheur kraut_einjaehrig · Kulturform `dauerkultur_blatt` (Entspitzen bei 12 cm), Sorten Genoveser und Pourpre, System DWC (Platz 2.1). Kein Standardprofil.

## Suchweg (Stichworte)

- Beratung und Universität: «hydroponic basil EC pH extension»; Oklahoma State HLA-6722 (Tabelle EC und pH je Kultur), UT/UF W 844-B (Blattkulturen in Kleinanlagen, Abschnitt Basil, Anzucht in Würfeln), FAO Technical Paper 589 (Aquaponik, Anhang 1 Basil), Ohio State Knowledge Bank (pH-Versuch Basilikum in DWC).
- Studien: HortScience-Studie 2018 (EC 0.5 bis 4.0 in NFT, kein Effekt), Ohio State und Arizona (pH 4.0 bis 5.5 in DWC), Arkansas 2020 (Umsetzzeitpunkt 14, 21, 28 Tage), Frontiers 2021 (Basilikum in Steinwollwürfel 2.5 cm, 2 Samen je Zelle).
- Hersteller und Praxis: Johnny's Selected Seeds (Basilikum-Leitfaden Hydroponik, Artikel Anzucht), Rise Gardens (Nährstoffe für Kräuter), Grodan (nichts zu Basilikum).
- BBCH: JKI-Monografie 2018 (Text im PDF nicht auslesbar, Schrift verschlüsselt), daher englische 2. Ausgabe 2001 (inhaltsgleich), allgemeine Skala, weil die Monografie keine Skala für Ocimum führt.
- Tüte: Produktseiten Sämereien.ch Genoveser und Pourpre (nur Keimart und Keimtemperatur verwendet).
- GBIF-API: usageKey 2927096, Ocimum basilicum L., Lamiaceae, deutscher Name Basilikum.

## Annahmen des Rechercheurs (A)

1. Werte ohne Phasenangabe (Oklahoma, Johnny's, FAO, Rise für pH) stehen in der Phase `wachstum`; die Phase `anzucht` erhält nur Werte, die die Quelle für Sämlinge oder junge Pflanzen nennt (Rise «young plants», W 844-B «seedlings», Johnny's Anzucht-Artikel).
2. `system_quelle` bei Quellen ohne System für den Wert: das in der Quelle selbst genannte oder abgebildete System (Oklahoma: Dutch Bucket mit Blähton → `substrat_inert`; W 844-B: Floating-System → `dwc`; Johnny's Basilikum: raft → `dwc`; Rise: Wasserkultur ohne Substrat → `dwc`; FAO: Aquaponik, empfohlen media beds, NFT, DWC → `dwc`). Der Methodenprüfer entscheidet, ob Aquaponik (FAO) als hydroponisch gilt.
3. BBCH-Grenzen sind eine Zuordnung zur allgemeinen Skala: Keimung 00 bis 09, Anzucht 10 bis 12 (Ende nach dem Umsetzmerkmal «4-5 true leaves» der FAO, bei gegenständigen Blättern 2 Blattpaare), Wachstum 13 bis 49 (Ende vor 51, Blütenknospen = Schossen nach R1.7). Der Fachkritiker möge prüfen, ob die Gruppe kohl (Anzucht 10 bis 19) einheitlich sein soll.
4. Pythium `hoch` aus «more susceptible than others» (Ohio State).
5. Saatempfehlung Klasse A: `obergrenze_samen` = 2, weil die Studie keine höhere Obergrenze nennt.

## Verworfene oder nicht verwendete Quellen

- HortScience-Studie 2018 (Bd. 53, NFT): nur Versuchsstufen 0.5 bis 4.0 mS/cm ohne Empfehlungsband; Artikel Greenhouse Grower 2016 dazu ebenso (pH «adjusted to 6 daily», 16 h, 72 °F als Versuchseinstellung).
- NC State, HortScience 2023 («recommended EC … 1.2 to 2.2 mS/cm»): Volltext nicht abrufbar (HTTP 403), kein Kurzzitat geprüft.
- Iowa State, Masterarbeit 2025 zum pH von Kräutern (Basilikum 4.5 bis 6.5, Optimum 5.5) und Zusammenfassung producegrower.com: nicht abrufbar (403), ausserdem pH-Band ausserhalb 5.2 bis 7.0.
- UT CEA HERB Teil 2 und 3 (greenhousemag.com, producegrower.com; laut Suchauszug Basilikum 15 bis 20 Samen je Zelle Phenolschaum, Umsetzen 14 Tage nach Saat in DWC): Seiten nicht abrufbar (Bot-Schutz), daher kein Kandidat. Wertvoll für Saatmenge (Schaum, Klasse A oder B) und Anzuchtdauer; Koordinator möge den Abruf von Hand prüfen.
- Begutachtete Studie HortTechnology 2024 (Saatdichte Phenolschaum): nur Petersilie, Koriander, Salbei, kein Basilikum (für kraut_ausdauernd interessant: Petersilie 16 Samen je Zelle).
- Ohio State pH-Versuch (Gillespie): pH 4.0 bis 5.5 ohne Wachstumsunterschied, kein Empfehlungsband; nur für Pythium verwendet.
- Arkansas, HortTechnology 2020: Umsetzen 14, 21, 28 Tage nach Saat als Versuchsstufen, keine Empfehlung.
- Frontiers 2025 (Wachstumsstadien Basilikum per Bild): Töpfe, kein hydroponisches System, keine BBCH-Codes.
- Johnny's Topfkultur («plug tray and after 2–3 weeks», 5 bis 15 Samen je 4-Zoll-Topf): Topfkultur mit Substrat, nicht hydroponisch. Johnny's Multi-Seed-Pellet (5 bis 6 Samen je 2.5-Zoll-Würfel): Würfel 6.4 cm, keine Angabe zu stehen lassen; nicht verwendet.
- Johnny's Temperatur 65 bis 70 °F: Lufttemperatur, keine Wassertemperatur.
- Oklahoma HLA-6722 «Water temperature of 72 to 75 F is optimal»: allgemein für Hydroponik, nicht artspezifisch, °F; dem Rechercheur des Standardprofils überlassen.
- Sämereien.ch Keimdauer (Genoveser 14 bis 20 Tage, Pourpre 6 bis 8 Tage), Ernte «2 Monate nach der Aussaat», Abstände: Tüte bzw. Erde, für Dauern ausgeschlossen.
- Blogs ohne erkennbare Quelle (agrifarming.in, pages.dev-Seiten, letpot, mequoda): ausgeschlossen.

Hinweis zu Rise Gardens: Blogartikel eines Herstellers hydroponischer Indoor-Gärten (2026), ohne Versuch; als B2 geführt, der Methodenprüfer möge die Klasse prüfen.

## Lückenliste (Klasse D, keine Zeile)

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| ocimum_basilicum | keimung | dauer | nur FAO 6 bis 7 Tage ohne typ (offen) |
| ocimum_basilicum | keimung | keimtemp | nur FAO 20 bis 25 °C ohne typ und Tüte 20 °C (offen) |
| ocimum_basilicum | anzucht | dauer | kein artspezifischer Wert; W 844-B 12 bis 18 Tage ab Saat allgemein (offen) |
| ocimum_basilicum | wachstum | dauer | nur FAO 5 bis 6 Wochen bis Erntebeginn und Johnny's 28 Tage Kulturzeit (offen); Dauer bis Kulturende fehlt |
| ocimum_basilicum | anzucht | ph | nur allgemeiner Wert für hydroponische Anzucht (Johnny's), kein artspezifischer |
| ocimum_basilicum | anzucht, wachstum | licht_h | nur Johnny's «Minimum 14 hours» (offen); kein Band |
| ocimum_basilicum | anzucht, wachstum | wassertemp | nur FAO «higher than 21 °C» und Rise 65 bis 72 °F (offen); kein Band in °C |
| ocimum_basilicum | anzucht | wassertemp, licht_h | kein Wert |
| ocimum_basilicum | – | art: standard_keimfaehigkeit, systemeignung, liter_je_pflanze, wasserbedarf_je_pflanze_l, pflanzen_je_m2, wuchshoehe_max_mm, wuchsform, photoperiode, umsetzen_ab_d, umsetzen_bis_d | kein hydroponischer Beleg im Format des Felds (FAO nennt 8 bis 40 Pflanzen/m² und 30 bis 70 cm Höhe nur als Bereich bzw. in cm) |
| ocimum_basilicum | dauerkultur_blatt | ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_max_d, kulturdauer_typisch_d | kein Beleg in Tagen (FAO: Ernte ab 15 cm Höhe, Ernte «continues for 30-50 days») |

Saatmenge: Klasse A vorhanden (Steinwolle 2.5 cm, 2 Samen, 1 Pflanze), keine Lücke. Offene Frage für Tim: Babyleaf als weitere Kulturform (Johnny's nennt «Baby-leaf crop grown in hydroponic raft system»); nicht angelegt, weil der Auftrag nur Dauerkultur Blatt nennt.

## Runde 2 (12.11.2026)

### Suchweg

- frankiesgarten.de Basilikum-Anleitung (Klasse C nach Entscheid 0018): Keimart, Keimdauer, Keimtemperatur, pH, EC-Stufen, Wassertemperatur (Anzuchtkarte und Wachstum), Lichtstunden, Samen je Würfel, Ernte der Triebspitzen. System «Hydro Tower» (Pumpe, Lösung läuft an den Wurzeln vorbei) als `nft` erfasst, Keimung und Anzucht in Schaumstoffwürfeln als `substrat_inert`. Keine Tage bis Umsetzen oder Ernte (Felder der Anzuchtkarte leer).
- frankiesgarten.de FAQ: keine basilikumspezifischen Zahlen; Licht «14 bis 16 Stunden am Tag, egal ob Salat, Kräuter oder Fruchtgemüse» nicht übernommen (allgemein, Basilikum-Seite nennt dasselbe artbezogen).
- CAFRE «Hydroponic production of leafy salads and herbs» (B1): Abschnitt 5.6 Basil belegt Rückschnitt und wiederholte Ernte der Seitentriebe (Kulturform Schnitt). Anhang 2 (Balkengrafiken EC, pH, Lufttemperatur, Kulturzeit in Wochen) ist im Text nicht lesbar, Werte nicht ablesbar, nicht erfasst.
- Acta Horticulturae 1377 (2023, A): Basilikum in DWC und Kratky angebaut → `systemeignung = beide`.
- Johnny's Broschüre (C): Mehrsamen-Pille 5 bis 6 Samen je 2½-Zoll-Würfel → `saatempfehlung_offen.csv`.
- Frontiers 2021 (bereits Quelle): 16 h Licht für Sämlinge in Steinwolle unter LED, Einzelwert → offen.

### Verworfen

- Doty u. a. 2020 (HortTechnology 30(5), Umsetzen 14, 21, 28 Tage nach Saat in NFT): Sämlinge in Torfsubstrat angezogen, für Dauer und Umsetzfenster nicht hydroponisch (Konzept 9.1).
- Corrado u. a. 2020 (Agronomy 10, 830, Schnitte nach 47 und 75 Tagen): Töpfe mit Torf und Perlit, nicht hydroponisch.
- Walters und Currey 2015 (HortTechnology): Volltext gesperrt (HTTP 403), Umsetzen nur «2 weeks after sowing» (Wochen, Umrechnung verboten).
- Alabama Extension ANR-2954, Illinois Extension Handouts: keine Basilikumwerte.
- Johnny's Saatmenge 5 bis 15 Samen je 4-Zoll-Topf: Topf mit Substrat für den Verkauf, nicht hydroponisch belegt.
- Blogs und KI-Seiten aus der Websuche (agrifarming.in, climatebiz, pages.dev-Seiten): ohne erkennbare Quelle.

### Lückenliste nach Runde 2 (Klasse D)

| Art | Phase / Kulturform | Grösse / Feld | Stand |
|---|---|---|---|
| ocimum_basilicum | keimung | dauer | nur offen: FAO 6–7, frankiesgarten 5–14 Tage (je ohne typ) |
| ocimum_basilicum | keimung | keimtemp | nur offen: FAO und frankiesgarten 20–25 °C (ohne typ), Tüte 20 °C |
| ocimum_basilicum | anzucht | dauer | kein Wert in Tagen ab Anzuchtbeginn |
| ocimum_basilicum | anzucht | ec | nur offen: frankiesgarten Einzelwerte 0.4 (Anzucht) und 0.8 (Jungpflanze) |
| ocimum_basilicum | anzucht | ph | Kandidat frankiesgarten 5.5–6.5 ohne Phasenangabe (Methodenprüfung offen) |
| ocimum_basilicum | wachstum | dauer | kein Wert in Tagen ab Phasenbeginn |
| ocimum_basilicum | keimung | licht_h, wassertemp | kein Wert |
| ocimum_basilicum | anzucht | licht_h | nur offen: Frontiers 16 h (Einzelwert) |
| ocimum_basilicum | – | umsetzen_ab_d, umsetzen_bis_d, standard_keimfaehigkeit, samentyp | kein hydroponischer Beleg |
| ocimum_basilicum | dauerkultur_blatt | ernte_ab_d, ernteintervall_d, kulturdauer_typisch_d, kulturdauer_max_d | kein Wert in Tagen (CAFRE: Ernte «at roughly 3 week intervals», Wochen) |
| ocimum_basilicum | schnitt | ernte_ab_d, ernteintervall_d, kulturdauer_typisch_d, schnitte_max | kein Wert in Tagen (CAFRE wie oben) |

## Runde 3 (12.11.2026): Phasendauern Basilikum

Gesucht nur: `pw.ocimum_basilicum.anzucht.dauer`, `pw.ocimum_basilicum.wachstum.dauer`, Kulturform-Felder `ernte_ab_d`, `ernteintervall_d`, `kulturdauer_typisch_d` für `dauerkultur_blatt` und `schnitt`.

### Suchweg

- frankiesgarten.de, Basilikum-Hydroponik (Seite, Anzuchtkarte, FAQ): einzige Zeitangabe mit Zahl ist die Keimdauer 5 bis 14 Tage; die Anzuchtkarte hat nur leere Felder («In den Tower nach:», «Erste Ernte nach:»). Kein Wert für Anzucht, Wachstum oder Ernte.
- Websuche Universitäts-Merkblätter (Cornell, UF/IFAS, Purdue, Penn State, Extension «weeks after transplant»): kein basilikumspezifisches Hydroponik-Merkblatt mit Tagen gefunden.
- Studien in Floating Raft und NFT (Websuche «days after transplant», «days after sowing», Steinwolle, LED):
  - Vazquez u. a. 2013, Adv. Hort. Sci. 27(4) 166-172 (A, NFT, Gewächshaus, Herbst-Winter): erste Ernte 50 Tage nach dem Umsetzen, zwei Ernten mit Rückschnitt dazwischen, «interval of 37 days». → `profilwert_offen.csv` `wachstum.dauer#3` (Einzelwert) und `art.csv` `ak.ocimum_basilicum.schnitt.ernte_ab_d#1` = 50, `ak.ocimum_basilicum.schnitt.ernteintervall_d#1` = 37. Hinweis für den Lead: Die Probe «second harvest» liegt bei 92 Tagen nach dem Umsetzen, die Differenz zur ersten Ernte (42) weicht von den genannten 37 Tagen ab; beide Zahlen stehen so in der Quelle. Die Anzucht lief in Torf-Vermiculit-Perlit-Mischung (nicht hydroponisch), daher nur Werte ab dem Umsetzen erfasst.
  - Ciriello u. a. 2023, Plants 12(3) 486 (A, Floating Raft, Gewächshaus): Probenahme 23 Tage nach dem Umsetzen (Versuchsende) → `wachstum.dauer#4` offen (Einzelwert). Saatdatum bzw. Tage bis zum Umsetzen nicht genannt.
  - Frontiers in Plant Science 2022, 13, «Biostimulatory Action … 'Genovese' Basil» (A, Floating Raft, Gewächshaus): Umsetzen 18 Tage nach Saat → `anzucht.dauer#3` offen (Tage ab Saat, Anzuchtsubstrat nicht genannt). Erntezeitpunkt nicht in Tagen genannt.
  - Puccinelli u. a. 2025, Adv. Hort. Sci. 39(1) 21-30 (A, Klimakammer mit LED, Steinwollstopfen, belüftete Wasserkultur): Umsetzen 41 Tage nach Saat → `anzucht.dauer#2` offen (Tage ab Saat, Keimdauer nicht in derselben Quelle); Versuchsdauer 14 Tage nach dem Umsetzen → `wachstum.dauer#5` offen (Einzelwert, keine Erntereife).
- PDF-Texte mit eigenem Lesekript aus dem Zwischenspeicher gelesen (Ligaturen im Text, Zitate entsprechend wiederhergestellt: «a er» = «after»).

### Verworfen oder nicht verwendet

- Walters und Currey, ASHS 2015 (Abstract Paper21157): Umsetzen «two weeks after sowing», Frischmasse «three weeks after transplanting» nur aus Suchausschnitt (Wochen, Seite nicht erreichbar, HTTP 503); nicht erfasst, Wochen ohnehin nicht umrechnen.
- Doty u. a. 2020 (Arkansas, NFT, Umsetzen 14/21/28 Tage nach Saat, Ernte 35 Tage nach Saat): wie Runde 2 verworfen (Anzucht in Torfsubstrat; Werte ab Saat).
- Pennisi u. a. 2020, Eur. J. Hortic. Sci. 85(5) (Bologna, laut Suchausschnitt Umsetzen 21 Tage nach Saat, 21 Tage bis zur Ernte): Volltext gesperrt (HTTP 403), Zitat nicht prüfbar, nicht erfasst.
- Wageningen/LettUs Grow 2026 (J. Hortic. Sci. Biotechnol.): nur «4–5 weeks after transplanting» im Suchausschnitt, Wochen, nicht erfasst.
- Johnny's «approximately 28 days» (bereits `wachstum.dauer#2` offen), Rise Gardens 28 bis 35 Tage (Blog ohne Methode), hydroponiccalendar.pages.dev (ohne Quelle): nicht neu erfasst.

### Lückenliste nach Runde 3 (Klasse D)

| Art | Phase / Kulturform | Grösse / Feld | Stand |
|---|---|---|---|
| ocimum_basilicum | anzucht | dauer | nur offen: Tage ab Saat 41 (Steinwolle, LED) und 18 (Floating Raft), je Einzelwert ohne Keimdauer; UTK 12 bis 18 Tage ab Saat (allgemein Blattkulturen) |
| ocimum_basilicum | wachstum | dauer | nur offen: Einzelwerte 50 (NFT, erste Ernte), 23 und 14 Tage nach dem Umsetzen (Versuchsende), Johnny's 28, FAO 5 bis 6 Wochen |
| ocimum_basilicum | schnitt | ernte_ab_d, ernteintervall_d | Kandidaten 50 und 37 (Vazquez 2013, Gewächshaus Herbst-Winter) |
| ocimum_basilicum | schnitt | kulturdauer_typisch_d | kein Wert in Tagen ab Saat |
| ocimum_basilicum | dauerkultur_blatt | ernte_ab_d, ernteintervall_d, kulturdauer_typisch_d | kein Wert in Tagen (CAFRE «at roughly 3 week intervals», Wochen) |

## Runde 6 (12.11.2026): Anzuchtdauer Basilikum

Gesucht nur: `pw.ocimum_basilicum.anzucht.dauer`.

### Suchweg

- Websuche «hydroponic basil rockwool seedlings days after sowing germinated transplanted DWC study».
- Rise Gardens Plant Library (keine Basilikum-Seite; `/plants/genovese-basil/` 404), Produktseite «Super Sweet Genovese Basil» (HTTP 429).
- CEA HERB (scri-ceaherb.org) → PLOS ONE 2022 «Basil seedling production environment …» (PDF mit eigenem Lesekript gelesen, Leerzeichen im Zitat wiederhergestellt).

### Neuer Kandidat (offen)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.ocimum_basilicum.anzucht.dauer#4 | plos-one-basilikum-saemlingsumgebung-2022 (A, Steinwolle 2.5 cm, Klimakammer mit LED, danach Deep-Flow) | «Two weeks after sowing, 17 seedlings were transplanted» | Wochen ab Saat, Einzelwert, Keimdauer nicht in derselben Quelle; Umrechnung durch den Lead |

### Verworfen in Runde 6

| Quelle | Grund |
|---|---|
| Doty u. a. 2020 (Arkansas, NFT 14/21/28 Tage nach Saat) | schon Runde 2 und 3 verworfen (Torfsubstrat) |
| Fachartikel CEA HERB Part 2 (greenhousemag.com, producegrower.com; laut Suchausschnitt «10» Keimtage für grünes Basilikum) | Seiteninhalt nicht abrufbar (leer), Zitat nicht prüfbar |
| hydrogreenspace.pages.dev «7-10 days after germination» | Seite ohne erkennbare Quelle |
| Rise Gardens «8 Days to germinate» | Keimdauer, nicht gesucht; Seite nicht abrufbar |

### Lückenliste nach Runde 6

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| ocimum_basilicum | anzucht | dauer | nur offen: 41 und 18 Tage ab Saat, zwei Wochen ab Saat (neu), UTK 12–18 Tage; keine Tage ab Phasenbeginn |

## Runde 7 (12.11.2026): Anzuchtdauer Basilikum mit Keimdauer aus derselben Quelle

Gesucht nur: `pw.ocimum_basilicum.anzucht.dauer`, gezielt Quellen mit Keimdauer und Umsetztag oder mit Dauer ab Keimung.

### Suchweg

- Fork Farms Help Center (`/help/plant-guides`, `/help/herb-grow-guide`, `/help/seed-varieties`): keine Basilikum-Kopfdaten in Tagen; Herb Grow Guide nur «5-7 days» für Kräuter allgemein und Ernte nach Höhe.
- frankiesgarten.de Basilikum-Hydroponik erneut: Keimdauer 5 bis 14 Tage, Zeitplanfelder der Anzuchtkarte weiterhin leer.
- Rise Gardens: Plant library auf den Produktseiten (Shopify-Produktliste, Seiten mit curl gelesen) «Super Sweet Genovese Basil» und «Purple Basil» mit Stufen «Days 0-8 Germination», «Days 8-15 Move to Garden» bzw. 0-7 und 7-14; Blogartikel «How to Grow Hydroponic Basil» (11.2.2025) mit «typically 7-10 days after germination».
- Europe PMC (Volltext-XML): Biology 11(7) 991 (2022, Pflanzenfabrik mit LED, Schwammwürfel 2.3 cm): Keimung «48 h», Umsetzen 20 Tage nach Saat.
- Websuche CEA HERB (Tennessee) Keimung im Dunkeln, Taylor & Francis «Hydroponics for the Home Grower», The Growcer Knowledge Base.

### Neue Kandidaten (alle offen)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.ocimum_basilicum.anzucht.dauer#5 | risegardens-genovese-basilikum (B2, Indoor LED) | «Days 0-8 Germination … Days 8-15 Move to Garden» → 15 minus 8 = 7 | Einzelwert; Umsetztag im Fenster nicht eindeutig |
| pw.ocimum_basilicum.anzucht.dauer#6 | risegardens-purpur-basilikum (B2) | «Days 0-7 Germination … Days 7-14 Move to Garden» → 14 minus 7 = 7 | Einzelwert; wie #5 |
| pw.ocimum_basilicum.anzucht.dauer#7 | risegardens-basilikum-anleitung-2025 (B2) | «typically 7-10 days after germination» (Bezug ab Keimung, passt zur Phase) | Bereich ohne typ |
| pw.ocimum_basilicum.anzucht.dauer#8 | biology-11-991-basilikum-pflanzenfabrik-2022 (A, Schwamm 2.3 cm, LED) | «20 °C for 48 h for germination», «At 20 days after sowing» | Einzelwert; Keimung in Stunden, nicht selbst umgerechnet (Rechnung 20 Tage minus 48 h für den Lead) |

Hinweis für den Lead: #7 ist der einzige Kandidat mit Bezug ab Keimung ohne Rechnung; #5 und #6 stammen aus derselben Vorlage des Herstellers (gleiches Stufenschema für alle Kräuter). Der Blogartikel #7 verweist für die Zahl auf eine Literaturnummer [6], die auf der Seite nicht aufgelöst ist. #8 hat genau Tims Würfelgrösse (Schwamm 2.3 cm) unter LED.

### Verworfen in Runde 7

| Quelle | Grund |
|---|---|
| Europe PMC 2026 «Interactive effects of FR and UV-A … basil and parsley» (PMC13438295) | «After emergence (three weeks after sowing)», keine eigene Keimdauer; Wochen ab Saat |
| Plants 2025 Zitronenbasilikum (PMC12251977) | andere Art (Ocimum × citriodorum), Anzucht in Kokos-Perlit, Keimdauer nicht in Tagen |
| Frontiers 2023 «Italian Large Leaf» (PMC10332322) | Keimung in Torfwürfeln (nicht inert) |
| Vertical Farming 2023 Salat und Basilikum (PMC10130051) | Basilikum in Vermiculit-Töpfen, keine Tage |
| CEA HERB Part 2 und 3 (producegrower.com, greenhousemag.com) | Seiten blockiert (Bot-Schutz), Archivkopie nicht erreichbar; Zitat nicht prüfbar |
| Taylor & Francis «Hydroponics for the Home Grower» (laut Suchausschnitt Basilikum keimt «4 to 5 days», Umsetzen «14-18 days after sowing») | nur Suchausschnitt, Kapitel gesperrt; Umsetzzahl allgemein für Blattkulturen |
| The Growcer Knowledge Base «herbs … seedling area for 21 days» | nicht artspezifisch |
| AeroGarden Blog «What To Expect» | HTTP 403 |
| Johnny's Key Growing Information Basilikum | Erde/Katalog |

### Lückenliste nach Runde 7

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| ocimum_basilicum | anzucht | dauer | weiterhin kein Kandidat mit `wert_min/wert_typ/wert_max`; offen neu: 7 (Rise Genovese), 7 (Rise Purple), 7–10 ab Keimung (Rise Blog), 20 Tage minus 48 h (A, Schwamm 2.3 cm) |
