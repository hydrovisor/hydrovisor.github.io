# Recherche Kulturgruppe blattsalat (W0-Probelauf, Issue #184)

Stand 12.11.2026 · Rechercheur blattsalat · Arten `lactuca_sativa` (Kulturform Schnitt, DWC 2.3), `valerianella_locusta` (Kopf, Kratky belüftet 3.1, Direktsaat) · zusätzlich Standardprofil (`ph`, `wassertemp`, `licht_h`).

## Suchweg (Stichworte)

- Cornell CEA Hydroponic Lettuce Handbook (Kopie bei Haifa; Text mit pdftotext gelesen), Cornell-Artikel GPN 2016 «Growing Hydroponic Leafy Greens».
- Merkblätter der Beratung: Oklahoma State HLA-6722, Tennessee/Florida W 844-B, Kentucky CCD-CP-63, Purdue HO-309-W, Florida HS1258, USask «Hydroponic Leafy Greens», Virginia Tech SPES-464, UNH «Hydroponics at Home».
- Keimung Salat: Scientia Agricola 2003 (Thermoinhibition), Kentucky CCD-CP-63 (Lichtkeimer).
- BBCH: JKI-Monografie 2018 (deutsch und englisch) heruntergeladen, Text der Artenkapitel wegen Schriftkodierung nicht lesbar; deshalb 2. Auflage 2001 (BBA, Vorgängerin des JKI) als Quelle, Kapitel «Leaf vegetables (not forming heads)», PDF S. 122 bis 124.
- Nüsslisalat: Plants 2023 (Floating, Steinwolle-Plugs, Kontroll-Nährlösung), Acta Hort 644 (2004), 659 (2004), 807 (2009), 1142 (2016), 267 (1990), Rivista di Agraria 2018; Suche deutsch, italienisch, kroatisch nach pH/EC-Tabellen für Floating.
- Mehrfachschnitt Salat: Agronomy 2020 und 2021 (Floating, zwei Schnitte); Volltext bei MDPI für das Werkzeug gesperrt, nur Titel verwendet.
- Standardprofil: Virginia Tech SPES-464 (pH), Bluelab (Lösungstemperatur), UNH (Lichtstunden).
- GBIF-API für `gbif_key` und deutsche Namen.

## Verworfene oder nicht verwendete Quellen

| Quelle | Grund |
|---|---|
| scaleandstem.pages.dev (Mâche, pH 6–7, EC 1–1.6) | Seite ohne erkennbare Quelle, vermutlich KI-Text |
| hydrogreenspace.pages.dev, home-hydroponics-systems-uk.pages.dev, my-niche-site (vercel) | Seiten ohne erkennbare Quelle |
| nidopro.com, agrowtronics.com, fifthseasongardening.com, toledoindoorgarden.com | Praxisseiten ohne belegte Herkunft der Werte; im Probelauf nicht nötig |
| gardenmyths.com, gardenbetty.com, Reddit | Garten bzw. Forum, nicht hydroponisch |
| SFA Singapur 2025 (Nutrient Management) | nur asiatische Blattgemüse, kein Salat |
| Acta Hort 807 (2009), 1142 (2016) | Abstract ohne Zahlen zu pH, EC oder Dauer |
| Johnny's Seeds (Mâche «Trophy» hydroponisch geeignet) | Katalog einer anderen Sorte, keine Saatmenge |
| Agronomy 2020 (10(9) 1358, zwei Schnitte Salad Bowl) | Volltext nicht abrufbar; nur 2021er Titel als Beleg für Mehrfachernte verwendet |
| USask «pH of 5 to 7 is sufficient to grow greens» | Band 2.0 und unter 5.2; nicht artbezogen genug für `lactuca_sativa`, nicht als Kandidat aufgenommen |
| Virginia Tech «Many leafy greens perform well at EC 1.2 to 2.0» | nicht artbezogen; für das Standardprofil ist EC nicht erlaubt |
| JKI BBCH-Monografie 2018 (PDF) | Text der Kapitel nicht extrahierbar; ersetzt durch Ausgabe 2001 |

## Hinweise für den Koordinator

- `system_quelle = keine` steht bei allgemeinen Hydroponik-Quellen ohne genanntes System (Oklahoma State, Bluelab, UNH); die Aufzählung `system` kennt keinen Wert «Hydroponik allgemein». Der Methodenprüfer sollte das nicht als «nicht hydroponisch» lesen; die Fundstelle sagt es jeweils.
- BBCH für Nüsslisalat: Die Monografie nennt Valerianella nicht; übertragen über Fussnote 1 (Arten mit Rosettenwuchs) der Skala «Leaf vegetables (not forming heads)».
- Phasengrenzen BBCH (eigene Zuordnung aus der Skala): Keimung 00–09, Anzucht 10–13 (Umsetzen bei 3 bis 4 Laubblättern nach Cornell GPN), Wachstum 14–49.
- Keimtemperatur Salat (Scientia Agricola) und Nüsslisalat (Acta Hort 267) stammen aus Keimungsstudien ohne Hydroponik; die Grundregel 9.1 schliesst Nicht-Hydroponik für die Keimtemperatur nicht aus. Evidenzklasse B1 gesetzt, weil «A» eine hydroponische Messung verlangt.
- Saatempfehlung Salat: beide Quellen nennen genau einen Samen je Würfel; `obergrenze_samen = 1` folgt daraus (keine höhere Zahl genannt).
- `ernte_ab_d` Nüsslisalat: #1 (40) zählt ab Saat (Saat direkt in schwimmende Schalen), #2 (29) ab Umsetzen.
- Die Kandidaten für EC und pH des Nüsslisalats (Plants 2023) gelten für die Phase Wachstum im Floating; die Lösung hatte EC 2.47 und pH 5.6 als Einzelwerte (offen).

## Lückenliste (Klasse D, keine Zeile angelegt)

| Art | Phase | Grösse oder Feld | Bemerkung |
|---|---|---|---|
| lactuca_sativa | keimung | dauer | nur offen: Einzelwert Tag 2 (Cornell), 24 bis 48 h (W 844-B) |
| lactuca_sativa | anzucht | dauer | nur offen (Einzelwerte, Bereiche ohne typ, Wochen) |
| lactuca_sativa | wachstum | dauer | nur offen (Einzelwerte 24 und 48 Tage) |
| lactuca_sativa | wachstum | licht_h | kein Hydroponik-Wert für die Wachstumsphase |
| lactuca_sativa | wachstum | wassertemp | nur offen (Cornell-Stellwerte 24/25/26 °C) |
| lactuca_sativa | anzucht | wassertemp | kein Wert |
| lactuca_sativa | – | ak schnitt: ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_typisch_d, kulturdauer_max_d, entspitzen | kein hydroponischer Wert für Mehrfachschnitt gefunden (Agronomy 2020/2021 nicht lesbar) |
| lactuca_sativa | – | systemeignung, photoperiode, pythium, schossen_handlung, standard_keimfaehigkeit, kulturform_vorgabe, wuchshoehe_max_mm | im Probelauf nicht belegt |
| lactuca_sativa | – | kulturformen_erlaubt: keimling | keine hydroponische Quelle für Salat-Microgreens gesucht |
| valerianella_locusta | keimung | dauer, keimart | kein Wert (Keimart auch nicht aus Fachliteratur) |
| valerianella_locusta | keimung | keimtemp | nur offen (5–20 °C, Optimum 15–20 °C ohne typ) |
| valerianella_locusta | anzucht | dauer | nur offen (22 Tage ab Saat inkl. Keimung) |
| valerianella_locusta | anzucht | bbch, wechselmerkmal | keine Quelle für das Ende der Anzucht (Blattzahl beim Umsetzen) |
| valerianella_locusta | anzucht | ph, ec | kein Hydroponik-Wert |
| valerianella_locusta | wachstum | dauer, ph, ec | nur offen (Einzelwerte Plants 2023; EC 2.47 über 2.0) |
| valerianella_locusta | wachstum | bbch | abhängig von der fehlenden Anzucht-Grenze |
| valerianella_locusta | keimung bis wachstum | licht_h, wassertemp | kein Hydroponik-Wert |
| valerianella_locusta | – | Saatempfehlung kopf (Samen je Schwamm, Pflanzen stehen lassen) | keine Quelle nennt Samen je Würfel oder Zelle (Saatmenge D) |
| valerianella_locusta | – | systemeignung (Kratky), liter_je_pflanze, schossen_handlung, photoperiode, umsetzen_ab_d/bis_d | nicht belegt |
| standard | keimung | ph, wassertemp, licht_h | keine allgemeine Quelle für die Keimung im Würfel |
| standard | wachstum | ph #2, wassertemp #2 | nur offen (UNH pH 5.5–7.0 zu breit; Oklahoma State in °F) |

## Runde 2 (Issue #188, 12.11.2026)

### Suchweg (Stichworte)

- frankiesgarten.de (Entscheid 0018, Klasse C): Seite «Salat in Hydroponik», FAQ, «Keimtemperaturen und Keimdauer», Übersicht Gemüseanbau. Keine Seite zu Feldsalat, Babyleaf oder Microgreens (Übersicht geprüft; Websuche ohne Treffer).
- Cornell GPN 2016 neu gelesen (PDF mit pdftotext): Kopfsalat 35 Tage ab Saat, 24 Tage ab Umsetzen; Abschnitt Baby Leaf Greens (6 bis 12 Samen je Zelle, Versuch 'Outredgeous' 3 Tage Keimung plus 10 Tage DWC).
- University of Hawaii CTAHR VC-1 (2010, Kratky-Verfahren für Salat): pH, EC, Anzucht 1 bis 3 Wochen, Ernte 4 bis 6 Wochen nach Umsetzen, ein bis zwei Samen je Zelle.
- Nüsslisalat: Plants 2023 Volltext über Europe PMC (PMC10097257) für Saat, Umsetzen und Ernte; Acta Hort 644 (Abstract), Acta Hort 1377 (Abstract), Rivista di Agraria 2018; Suchen italienisch (floating, alveolo, semi per foro) und englisch (mâche hydroponic rockwool).

### Hinweise für den Koordinator

- `system_quelle` der Salat-Seite von frankiesgarten.de: Keimung im Schaumstoffwürfel = `substrat_inert`; Anzucht in der «Station» mit Luftsprudler Tag und Nacht = `dwc`; Wachstum im HydroFlex Tower (Intervallpumpe 5 min an, 30 min aus, Wurzeln hängen frei) = `nft` als nächster Wert der Aufzählung (A). `umgebung_quelle = indoor_led`, weil die Seite Werte für «Licht drinnen» mit Pflanzenlampe nennt (A).
- Die EC-Werte von frankiesgarten.de stehen in der Tabelle ohne Einheit; die FAQ derselben Seite nennt mS/cm. `ec_basis = unbekannt`. Die Kurzzitate der Dünge-Tabelle (anzucht.ec #3, wachstum.ec #6) sind aus Tabellenzellen zusammengesetzt («…»); der Quellenprüfer möge sie durch den Zellentext ersetzen.
- `kulturdauer_typisch_d` als Summe aus derselben Quelle: Salat Babyleaf 13 = 3 Tage Keimung plus 10 Tage DWC (GPN); Nüsslisalat Kopf 51 = 22 Tage bis Umsetzen plus 29 Tage bis Ernte (Plants 2023, Saat 15.9., Ernte 5.11.2021). Rechnung jeweils in `fundstelle`.
- Babyleaf Salat (GPN): Der Versuch lief in Speedling-Schalen mit Torf/Perlit, schwimmend im DWC; die Methodenprüfung hat in Runde 1 ein gleiches Substrat beim Nüsslisalat verworfen (Acta Hort 659). Die Werte stehen trotzdem als Kandidaten, weil die Wachstumsphase im DWC lief; Entscheid beim Lead.
- `systemeignung` Salat: #1 `kratky` (CTAHR VC-1), #2 `dwc` (GPN); zusammen sprechen sie für `beide`, eine einzelne Quelle mit beiden Systemen fehlt.
- `kulturformen_erlaubt` Salat: #1 (HS1258) nennt alle drei Formen, #2 (GPN) nur `kopf;babyleaf`. Nüsslisalat: #1 `kopf` (Plants 2023), #2 `babyleaf` (Rivista 2018); zusammen `kopf;babyleaf` wie Entscheid 0018.
- `kulturform_vorgabe`: keine Quelle legt eine Vorgabe fest; die Kandidaten belegen nur die Nutzung der Form (Salat `schnitt` mit HS1258, Nüsslisalat `kopf` mit Plants 2023), die Wahl folgt Entscheid 0018.
- `umsetzen_ab_d` Nüsslisalat 22 (Plants 2023) ist ein einzelner Umsetztag; `umsetzen_bis_d` nicht angelegt.
- Saatempfehlung Salat Kopf: frankiesgarten.de (Schaumstoffwürfel, B) neu; Schnitt #3 als Analogie über Pflücksalat (C). CTAHR VC-1 («one or two seeds») und GPN Babyleaf («six to 12 depending on crop») in `saatempfehlung_offen.csv`.

### Verworfene oder nicht verwendete Quellen (Runde 2)

| Quelle | Grund |
|---|---|
| sites.google.com/view/ukybaehydroponics (Capstone-Projekt, Salat in NFT, zwei Samen je Steinwollwürfel, Umsetzen nach 1 bis 2 Wochen) | Projektseite von Studierenden ohne Herkunft der Werte, keine Organisation genannt |
| LWG Bayern, Faltblatt «Salatkultur im Wasserbeet» (2018) | DWC beschrieben, aber keine Zahlen zu pH, EC, Dauer oder Saat |
| Acta Hort 1377 (2023, Valerianella, Gaswechsel) | Abstract ohne pH, EC, Dauer oder Saatmenge |
| Johnny's Seeds, West Coast Seeds, MIgardener, True Leaf Market (Mâche) | Katalog bzw. Erde; Keimdauer 7 bis 21 Tage gilt für Erde, nicht für Sollwerte |
| frankiesgarten.de FAQ «Wie viele Samen kommen in einen Würfel?» | Frage ohne Antwort auf der FAQ-Seite; Antwort nur auf der Salat-Seite (verwendet) |
| Agronomy 2020 und 2021 (Mehrfachschnitt) | Volltext weiter nicht abrufbar; kein Ernteintervall und keine Schnittzahl |

### Lückenliste nach Runde 2 (Klasse D, keine Zeile angelegt)

| Art | Phase | Grösse oder Feld | Bemerkung |
|---|---|---|---|
| lactuca_sativa | keimung | dauer | weiter nur offen: Einzelwerte «etwa 3 Tage» (frankiesgarten.de, zwei Seiten), 24 h (GPN); keine Quelle mit min, typ, max |
| lactuca_sativa | anzucht | dauer | nur offen (neu VC-1 «1-3 weeks», Bereich ohne typ) |
| lactuca_sativa | wachstum | dauer | nur offen (neu 4 bis 6 Wochen, frankiesgarten.de und VC-1) |
| lactuca_sativa | keimung | wassertemp | kein Wert (Keimung ohne Nährlösung) |
| lactuca_sativa | – | name_de, kulturgruppe_id | GBIF nennt «Salat» und die Kulturgruppe nicht; Stammfelder legt der Koordinator nach 4.3.1 und 4.2.1 fest |
| lactuca_sativa | – | standard_keimfaehigkeit, samentyp | keine Hydroponik-Quelle |
| lactuca_sativa | – | ak schnitt: ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, schnitte_max | kein Wert (frankiesgarten.de nennt keinen Erntetakt) |
| lactuca_sativa | – | ak babyleaf: ernteart | kein Wert |
| lactuca_sativa | – | Saatempfehlung babyleaf | nur offen (GPN 6 bis 12, nicht artbezogen) |
| valerianella_locusta | keimung | dauer, keimart | kein Hydroponik-Wert (frankiesgarten.de: Keimtyp «siehe Tüte») |
| valerianella_locusta | keimung | keimtemp | nur offen (neu frankiesgarten.de 15 bis 18 °C ohne typ) |
| valerianella_locusta | anzucht | dauer | nur offen (Plants 2023: 22 Tage ab Saat inkl. Keimung) |
| valerianella_locusta | anzucht | bbch, wechselmerkmal, ph, ec | keine Quelle (Plants 2023 nennt keine Blattzahl beim Umsetzen und keine Anzucht-Lösung) |
| valerianella_locusta | wachstum | dauer, ph, ec | nur offen (Einzelwerte Plants 2023) |
| valerianella_locusta | wachstum | bbch | abhängig von der fehlenden Anzucht-Grenze |
| valerianella_locusta | alle | licht_h, wassertemp | kein Hydroponik-Wert |
| valerianella_locusta | – | umsetzen_bis_d, standard_keimfaehigkeit, samentyp | nicht belegt |
| valerianella_locusta | – | ak babyleaf: ernte_ab_d, ernteart | nicht belegt |
| valerianella_locusta | – | Saatempfehlung kopf und babyleaf | keine Quelle nennt Samen je Würfel oder Zelle (Saatmenge D, Lead nach Entscheid 0018) |

## Runde 3 (12.11.2026, gezielte Pflichtlücken)

### Suchweg

- frankiesgarten.de: Keimtabelle (Feldsalat nur Zusatztabelle ohne Keimdauer, Keimtyp «siehe Tüte»), Sitemap, Seite «EC-Wert» (kein Feldsalat); keine eigene Feldsalat-Seite gefunden.
- Feldsalat: «lamb's lettuce/corn salad floating system pH EC», «Valerianella locusta hydroponic rockwool», «Feldsalat Hydroponik Steinwolle»; Plants 2023 (PMC) erneut auf Samen je Würfel und Anzucht-Lösung geprüft (nicht genannt).
- Salat: «hydroponic lettuce rockwool germinate days transplant»; Alabama ANR-2954, UF/IFAS HS1488 und Rutgers «Lettuce Production» (Floating Hydroponics Greenhouse) ausgewertet.

### Neue Kandidaten (alle in `profilwert_offen.csv`)

| Kandidat | Wert | Quelle | Grund |
|---|---|---|---|
| pw.valerianella_locusta.anzucht.ph#1, wachstum.ph#2 | pH 6 | Acta Hort 242 (1989), PUR-Matten mit fliessender Lösung, Direktsaat | Einzelwert |
| pw.valerianella_locusta.anzucht.ec#1, wachstum.ec#2 | about 1,4 mS/cm | dieselbe | Einzelwert, ec_basis unbekannt |
| pw.lactuca_sativa.keimung.dauer#6 | 3-4 Tage | ANR-2954 Table 2 | Bereich ohne typ |
| pw.lactuca_sativa.anzucht.dauer#6 | 2 weeks old | ANR-2954 | Wochen ab Saat, Einzelwert |
| pw.lactuca_sativa.anzucht.dauer#7, #8 | one to three weeks; about two to three weeks old | HS1488 | Wochen ab Saat, Bereich ohne typ |
| pw.lactuca_sativa.anzucht.dauer#9 | After 12 days | Rutgers | Tage ab Saat ohne Keimdauer derselben Quelle |

Hinweis: ANR-2954 Table 2 gilt allgemein für Jungpflanzen im Gewächshaus; die Sämlinge stehen laut Abschnitt Lettuce in 1-inch Oasis-Würfeln. HS1488 nennt zudem «one to two seeds per grow cube» für Salat (nicht beauftragt, nicht angelegt).

### Verworfen

| Quelle | Grund |
|---|---|
| Hochschule Bochum, «Aussaatanleitung - Feldsalat» (THALES) | Erde und Freiland |
| Horticulturae 11(9) 1076 (2025, Valerianella in Perlit), Biol. Life Sci. Forum 26 (Valerianella im Vertical Farm, Ebbe-Flut, Steinwolle), Iacuzzo et al. (Floating, Fe und Sulfat), J Sci Food Agric (hydroponisch vs. Erde, Feldsalat), Appl. Therm. Eng. 2014 | Volltext nicht abrufbar (403); Werte aus Suchauszügen nicht wörtlich prüfbar, daher keine Kandidaten |
| Haifa «Hydroponic Lettuce Handbook» | Abruf gescheitert (TLS) |
| hortamericas.com «Hydroponic Lettuce Production in Phenolic Foam» | 404 |
| Uni Halle, Bachelorarbeit (Feldsalat) | Bot-Sperre, Inhalt nicht prüfbar |
| scaleandstem.pages.dev, freshroot.pages.dev, plantiary.com | Seiten ohne erkennbare Quelle |

### Lückenliste nach Runde 3 (Klasse D)

| Art | Phase | Grösse oder Feld | Bemerkung |
|---|---|---|---|
| valerianella_locusta | keimung | dauer, keimart | weiter kein Hydroponik-Wert |
| valerianella_locusta | anzucht | ph, ec | nur offen (Einzelwerte Acta Hort 242, Direktsaat ohne getrennte Anzucht) |
| valerianella_locusta | anzucht | bbch, wechselmerkmal | keine Quelle |
| valerianella_locusta | wachstum | ph, ec als Band | nur offen (Einzelwerte Plants 2023 und Acta Hort 242) |
| valerianella_locusta | – | Saatempfehlung kopf, babyleaf | keine Quelle mit Samen je Würfel (Saatmenge D) |
| lactuca_sativa | keimung | dauer mit min, typ, max | nur offen (neu ANR-2954 3-4 Tage ohne typ) |
| lactuca_sativa | anzucht | dauer | nur offen (neu ANR-2954, HS1488, Rutgers; alle ab Saat oder in Wochen) |

## Runde 6 (12.11.2026, nur Nüsslisalat keimung.dauer)

### Suchweg

- «mâche corn salad hydroponic days to germinate Rise Gardens/Gardyn/AeroGarden»; «Valerianella locusta hydroponic rockwool/stone wool/foam days after sowing germination»; «Feldsalat Hydroponik keimt nach Tagen Steinwolle/Anzuchtschwamm/Kratky».

### Ergebnis

- Kein Kandidat. Treffer nur Saatgutkataloge (Johnny's, Fedco, Renee's, Baker Creek, MIgardener: Keimdauer für Erde bzw. Freiland), scaleandstem.pages.dev (ohne erkennbare Quelle), Plants 2023 (MDPI, gesperrt; Keimdauer ohnehin nicht genannt), KTBL-Arbeitsblatt und Uni-Halle-Bachelorarbeit (bereits in Runde 3 verworfen bzw. ohne Feldsalat-Keimdauer im Auszug).

### Lückenliste nach Runde 6

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| valerianella_locusta | keimung | dauer | weiter Klasse D |

## Runde 7 (12.11.2026): Nüsslisalat keimung.dauer und anzucht.dauer

### Suchweg

- frankiesgarten.de: Übersicht `anleitungen/gemueseanbau/` und Sitemap erneut; weiterhin keine Feldsalat-Seite.
- Fork Farms Help Center (`farmative.forkfarms.com/help/plant-guides`, `seed-varieties`): nur Salat, Kräuter, Blüten, Mini-Gurke, -Paprika, -Tomate; kein Feldsalat.
- Websuche «lamb's lettuce Valerianella floating system seedlings emergence days after sowing», «corn salad … germination chamber days»; Horticulture Journal 85(2) 2016 (Floating-Pilotanlage, J-STAGE Volltext).
- Europe PMC (Volltextsuche Valerianella/lamb's lettuce/corn salad mit hydroponic/floating/soilless, Open Access): PMC8706042, PMC10818939, PMC7831921, PMC10457958, PMC12430617, PMC13523218 nach Keim- und Umsetzangaben durchsucht.

### Neue Kandidaten

- profilwert_offen: pw.valerianella_locusta.anzucht.dauer#2 «Fourteen-day-old plants … transferred to 5-liter pots with a nutrient solution» (Plants 10(12) 2733, 2021; Saat in Perlit mit halbstarker Nährlösung, Gewächshaus; Klasse A). Grund: Einzelwert ab Saat, Keimdauer nicht in derselben Quelle.
- quelle: plants-valerianella-selen-2021 (peer_review; `anbaumethode = dwc` (A): Töpfe mit Nährlösung, Belüftung nicht genannt).
- Hinweis, nicht beauftragt: dieselbe Quelle nennt pH 5.6 ± 0.1 und EC 2.1 ± 0.1 dS/m für die Topf-Phase (Wachstum) und Ernte 38, 52 und 66 Tage ab Saat.

### Verworfen

| Quelle | Grund |
|---|---|
| Plants 13(2) 165 (2024, PMC10818939, Röntgen-Priming Valerianella) | Keimung auf Filterpapier in Petrischalen (Keimtest mit 1 mm Radikula, kein Auflaufen im Hydrosystem); Keimzeit nur als Abbildung, Text nennt «100% seed germination within 12 days» für beide Arten zusammen |
| Foods 10(1) 2021 (PMC7831921, Valerianella im Floating, Gewächshaus) | nur «Thirty days after transplanting» (Wachstum, nicht beauftragt); keine Keim- oder Anzuchtdauer |
| Horticulture Journal 85(2) 2016 (Floating-Pilotanlage Babyleaf) | Direktsaat in Styropor-Schalen, keine Keim- oder Umsetztage für Feldsalat |
| PMC10457958, PMC12430617, PMC13523218 | keine Keim- oder Umsetzangaben für Feldsalat im Hydrosystem |
| Fork Farms, frankiesgarten.de | keine Feldsalat-Seite |

### Lückenliste nach Runde 7

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| valerianella_locusta | keimung | dauer | weiter Klasse D (keine Hydroponik-Quelle mit Keimdauer) |
| valerianella_locusta | anzucht | dauer | nur offen (#1 22 Tage ab Saat, #2 14 Tage ab Saat; beide ohne Keimdauer derselben Quelle) |

## Runde 8 (13.11.2026): Nüsslisalat keimung.dauer und anzucht.dauer

### Suchweg

- Websuche «lamb's lettuce Valerianella hydroponic seedlings emergence days rockwool floating transplanted», «corn salad floating system nursery days after sowing», «Valerianella locusta … germination chamber / seedlings emerged … NFT», «Elixir lamb's lettuce vertical farm ebb-and-flow rockwool after germination», deutsch «Feldsalat Hydroponik Steinwolle Tage nach der Aussaat».
- Europe PMC (Volltext, Open Access) Valerianella/lamb's lettuce/corn salad/mache mit hydroponic/floating/soilless/rockwool/vertical farm: PMC9654129, PMC9855646, PMC10084971, PMC10097257, PMC8549008, PMC13577782 durchsucht.
- Horticulture Journal 85(2) 2016 als PDF (J-STAGE) erneut, Tabelle 1 gelesen.
- ISHS Acta Hort. 242_38 (PUR-Matten 1989) und 1164_5 (Bioseedling 2017), SARE «Leafy Greens Hydroponic» (2022), Johnny's Hydroponics Information Guide.
- Biol. Life Sci. Forum 26, 10 (2023): mdpi.com und sciforum HTTP 403, PDF über `mdpi-res.com` (HTTP 200) gelesen.

### Neuer Kandidat (offen)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.valerianella_locusta.anzucht.dauer#3 | blsf-valerianella-vertikalfarm-2023 (A, Vertical Farm mit LED, Ebbe-Flut, Steinwolle; Proceedings-Beitrag) | «transferred in the VF on rockwool 14 days after germination» | Einzelwert; «germination» statt Auflaufen, Anzuchtort vor dem Umsetzen nicht genannt |

Hinweis für die Methodenprüfung: Erster Fund mit Bezug ab Keimung statt ab Saat. Klasse A gesetzt, weil Konferenzbeitrag mit Begutachtung im MDPI-Proceedings-Format (A); falls die Prüfung Proceedings nicht als begutachtet zählt, B1. Dieselbe Quelle nennt pH 5.6 und 16 h Licht in der Vertical Farm (nicht beauftragt).

### Verworfen in Runde 8

| Quelle | Grund |
|---|---|
| Horticulture Journal 85(2) 2016, Tabelle 1 «From sowing to flotation (days)» 15 (Frühling) bzw. 9 (Spätfrühling) für Valerianella olitoria | Torfsubstrat (Neuhaus Huminsubstrat N17) mit Überkopfbewässerung im Anzuchthaus, also nicht hydroponisch; zudem ab Saat einschliesslich Keimung |
| Notulae Bot. Horti Agrobot. 52(2) 2024 (Hydroponik vs. Erde, Salz) | Artikelseite HTTP 403; Abstract ohne Keim- oder Umsetztage |
| ISHS 242_38 (PUR-Matten, 1989) | vorgekeimtes Saatgut, nur «ready for harvesting after about 60 days» |
| ISHS 1164_5 (Bioseedling 2017) | Saatgutqualität, ökologischer Anbau, keine Hydroponik-Zeiten |
| PMC9855646 (Baby-Leaf im Floating) | nur «48 h in the dark» nach Saat und Baby-Leaf «five/six weeks after sowing», kein Auflaufen oder Umsetzen |
| PMC10084971 | Erde bzw. Direktsaat, Gewächshaus und Freiland |
| PMC9654129, PMC8549008, PMC13577782 | keine Valerianella-Keim- oder Umsetztage im Hydrosystem |
| SARE Leafy Greens Hydroponic 2022, Johnny's Hydroponics Guide, USAMV 2022 (NFT-Salat) | kein Feldsalat |
| scaleandstem.pages.dev | Seite ohne erkennbare Quelle |

### Lückenliste nach Runde 8

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| valerianella_locusta | keimung | dauer | weiter Klasse D (keine Hydroponik-Quelle mit Keim- oder Auflaufdauer) |
| valerianella_locusta | anzucht | dauer | kein Kandidat in Validatorform; offen: #1 22 Tage ab Saat, #2 14 Tage ab Saat, neu #3 14 Tage ab Keimung (Einzelwert) |

## Runde 9 (13.11.2026): Nüsslisalat keimung.dauer und anzucht.dauer

Kein neuer Kandidat, keine neue Quelle.

### Suchweg

- Websuche deutsch «Feldsalat Floating-Verfahren/Hydrokultur Versuch Aussaat Auflaufen Tage Pflanzung» (LVG, LWG, Versuchsanstalten); italienisch «valerianella floating system semina emergenza giorni trapianto»; englisch «Gonnella lamb's lettuce floating system sowing emergence».
- Europe PMC (Volltext, Open Access) Valerianella/lamb's lettuce/corn salad/mache mit hydroponic, floating, rockwool, vertical farm, plant factory, NFT, soilless, growth chamber und germination/emergence/transplanted: neu gelesen PMC12197136, PMC12526387, PMC8117335.
- unibz-Repositorium (JSFA 91(2) 2011, Feldsalat im Floating mit Eisen und Sulfat): nur Metadaten.

### Verworfen

| Quelle | Grund |
|---|---|
| Plants 14 (2025, PMC12197136, Valerianella unter Rot-Blau-LED, Klimakammer) | Anzucht in Sand und Perlit 1:1, «cultivated for 36 days from seed sowing»; keine Keim- oder Umsetztage |
| Front. Plant Sci. 2021 (PMC8117335, Floating und Ebbe-Flut, Baby-Leaf) | «At the cotyledon stage (6–8 days after sowing), plantlets were transferred» gilt für Salat und Endivie; Feldsalat nur zitiert (Gonnella) |
| PMC12526387 | kein Feldsalat |
| JSFA 91(2) 2011 (unibz, Floating) | Volltext nicht frei; Repositorium nur Titel |
| Gonnella et al., Acta Hort. 644 (2004), Floating | Volltext nicht frei; Abstracts nur Ernte rund 50 Tage nach Saat |
| Zanin et al. (Padova, Floating mit Saatdichten), CNR-Eintrag | Abstracts ohne Keim- oder Umsetztage |
| oekolandbau.nrw.de (Feldsalat unter Glas, Saat- und Pflanztermine) | Anbau in Erde bzw. Topfballen, nicht hydroponisch; nur Kalenderdaten |
| Uni-Halle-Bachelorarbeit, Horticulture Journal 85(2), BLSF 2023 | schon in früheren Runden geprüft |

### Lückenliste nach Runde 9

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| valerianella_locusta | keimung | dauer | weiter Klasse D (keine Hydroponik-Quelle mit Keim- oder Auflaufdauer) |
| valerianella_locusta | anzucht | dauer | unverändert: kein Kandidat in Validatorform; offen #1 bis #3 (Einzelwerte, ab Saat bzw. ab Keimung) |
