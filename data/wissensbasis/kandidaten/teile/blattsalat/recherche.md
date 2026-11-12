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
