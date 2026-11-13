# Recherche Kulturgruppe fruchtgemuese (W0-Probelauf, #184)

Stand 12.11.2026 · Arten: Tomate (`solanum_lycopersicum`, Leitkultur), Chili (`capsicum_annuum`) · Kulturform `dauerkultur_frucht` · kein Standardprofil.

## Suchweg (Stichworte)

- GBIF API `species/match` und `species/<key>/vernacularNames` für beide Arten.
- BBCH: JKI-Ausgabe 2018 (de und en) heruntergeladen, Text aber nicht lesbar (eingebettete Schriften ohne Zeichentabelle); openagrar.de liefert eine Sicherheitsprüfung statt PDF. Verwendet: BBCH-Monografie 2. Auflage 2001 (BBA, heute JKI), gleicher Link wie Gruppe `kohl`; Abschnitt «solanaceous fruits» auf PDF-Seiten 134 bis 136. Die 2018-Ausgabe nennt den Inhalt laut Vorwort unverändert.
- Hochschul- und Beratungsquellen Hydroponik: UF/IFAS HS796 (Tomate, Perlite/Steinwolle/NFT), UF/IFAS HS1274 und HS787, Ohio State HYG-1437 (Tomate, Stufenlösungen), Oklahoma State HLA-6722 (EC/pH-Tabelle je Kultur), University of Arizona CEAC Kursunterlagen Kapitel 3, 6, 10 und Workshop 2026 Modul 2, Alabama ACES ANR-2954 (Jungpflanzen Hydroponik), Alberta «Production of sweet bell peppers» (Steinwolle, Kokos).
- Hersteller: Grodan (6-Phasen-Beratung Tomate), Greenhouse Canada «growing in the rootzone» #14 und #15 (Grodan-Fachberater).
- Peer-reviewed: Suche nach EC-Studien Tomate und Peperoni in DWC/NFT/Substrat; aufgenommen Journal of Horticultural Research 2023 (Einzeltrieb-Tomate, EC 1.2 bis 1.4).
- Praxis: Kursbeitrag «Pimientos hidropónicos» (UNALM Lima, Boletín 46, 2006).
- Saatmenge: Suche nach «one seed per rockwool cube» Tomate/Peperoni, Fork Farms, KidsGardening, UCR-Kursleitfaden, UNALM; keine verwertbare Quelle.

## Annahmen und Hinweise für Koordinator und Prüfrollen

1. Werte ohne Phasenangabe (ganze Kultur nach dem Auspflanzen, z. B. UF HS796 pH, OSU HLA-6722, Einzeltrieb-Studie, UNALM «Riego y nutrición») stehen je als eigener Kandidat in `wachstum`, `bluete` und `fruchtbildung_reife`; die Fundstelle sagt jeweils «ohne Phasenangabe».
2. BBCH-Bereiche je Phase folgen den Hauptstadien der Monografie: Keimung 0–9, Anzucht 10–19, Wachstum 21–59 (Hauptstadien 2 und 5), Blüte 61–69, Fruchtbildung und Reife 71–89. Die Hydroponik-Quellen setzen das Umsetzen bei fünf bis sechs Blättern an (BBCH 15/16); Anzucht 10–19 überlappt damit das Wachstum. Bitte durch den Fachkritiker beurteilen.
3. Wechselmerkmal Blüte nach BBCH 71 («first fruit has reached typical size»); Konzept R1.5 nennt «erste angesetzte Frucht, BBCH 71». Wortlaut der Monografie bleibt im Kurzzitat.
4. Einheiten «mmhos» (Alberta) und «mS» (UNALM) ohne Längenbezug sind als `mS/cm` erfasst, mit Vermerk in der Fundstelle; «dS/m» und «dS m-1» als `mS/cm` nach Rollenvorgabe; «mS / cm2» (Greenhouse Canada, Druckfehler der Quelle) als `mS/cm` mit Vermerk.
5. Einzeltrieb-Studie (JoHR 2023): geschlossenes Hydroponiksystem mit Medium in Rinnen, Medium nicht benannt; `system_quelle = substrat_inert` ist eine Annahme. EC-Basis `gesamt` (gemessene EC der Nährlösung, aus Leitungswasser angesetzt).
6. OSU HYG-1437 schreibt «These EC can be higher when the source water contains measurable amounts of salts»; das deutet auf Zuwachs-EC, ist aber nicht ausdrücklich; `ec_basis = unbekannt`.
7. UNALM-Beitrag als `praxis`/C eingestuft (Kursbeitrag eines Hydroponik-Praktikers im Bulletin der Universität, ohne eigenen Versuch). Der Link enthält im Dateinamen den Nachnamen des Autors; die `quelle_id` ist ohne Namen. Der Koordinator entscheidet, ob der Link so ins Repository darf.
8. `name_de` «Chili» (03_import_w0.md 4.3.1, Entscheid W13) steht nicht in GBIF; GBIF nennt deutsch «Paprika», «Paprika und Pfefferoni», «Peperoni», «Schotenpfeffer», «Spanischer Pfeffer». Keine Zeile angelegt; Entscheid Koordinator/Tim.
9. `keimtemp` ohne `wert_typ` in `profilwert.csv` (Quelle nennt nur einen Bereich; die Tüten-Zeilen aus `sorten.csv` tragen ebenfalls nur min und max). Falls der Validator `wert_typ` verlangt, gehören die drei Zeilen nach `profilwert_offen.csv`.
10. Dauer: Keine Quelle nennt min, typ und max; alle Dauern stehen in `profilwert_offen.csv`. Angaben in Wochen oder Monaten sind nicht in Tage umgerechnet. Die zwei Rechnungen «Tage ab Saat 35 minus Auflaufen 14» stammen beide aus derselben Folie (UA Workshop 2026).

## Verworfene oder nicht aufgenommene Quellen

| Quelle | Grund |
|---|---|
| JKI BBCH-Monografie 2018 (de, en) | Text im PDF nicht maschinenlesbar, openagrar mit Sicherheitsprüfung; Ausgabe 2001 verwendet |
| Mississippi State P1828 Greenhouse Tomato Handbook | PDF nicht abrufbar (nur Archivkopie 2009); Sackkultur teils mit Pinienrinde |
| UF/IFAS HS1274 | EC 1.5 bis 3.5 dS/m allgemein für alle Gewächshausgemüse, nicht artbezogen |
| UF/IFAS HS787 | pH 5.6 bis 6.0 als allgemeine Regel für P-Aufnahme, nicht artbezogen |
| OSU HYG-1437, pH-Satz | «range of pH where most nutrients are highly available is 5.5 to 6.5» ist eine allgemeine Aussage, kein Sollwert |
| OSU HLA-6722, Wassertemperatur | «72 to 75 F» nicht artbezogen und in °F (Umrechnung verboten) |
| Grodan 6-Phasen-Beratung Tomate | EC-Tropfwasser 2.8 bis 4.5 mS/cm für Hochdraht-Steinwolle; Wortlaut nur über Zusammenfassung des Abrufwerkzeugs gesehen, nicht wörtlich geprüft; alle Werte über 2.6 |
| Greenhouse Canada «growing in the rootzone» #15 | Veredelungsanzucht, EC 3.5 bis 5.0 mS; nicht aufgenommen (Veredelung nicht Teil der Anlage) |
| Greenhouse Canada #14, Aussaatstopfen | EC 1.2 bis 1.5 und pH 5.8 für die Keimung; Keimung hat keine pH/EC-Pflicht (03_import_w0.md 9), daher nicht aufgenommen |
| Journal of Horticultural Research 2023, Keimung | «germinated at 28 °C for three days» in Torfsubstrat, Einzelwert, nicht hydroponisch |
| UA Workshop Modul 2, Keimtemperatur | «~86F or 30C» allgemein, nicht artbezogen |
| Alberta, Wurzelraumtemperatur 19 bis 22 °C | Temperatur im Substrat, nicht Wassertemperatur der Nährlösung |
| Sakata Culture Sheets Tomate/Pepper | Saatgutfirma, Anzucht in Torf-Stopfen, nicht hydroponisch |
| scaleandstem.pages.dev | Seite ohne erkennbare Quelle |
| Friariello-Studie NFT (Horticultural Science 2017) | nur Abstract, EC 3.5 bis 4.4, anderer Peperoni-Typ; aus Aufwandsgründen nicht weiter verfolgt (Werte wären über 2.6) |
| Tropical and Subtropical Agroecosystems 2021 (Gemüsepaprika, EC 1.5 bis 3.0) | DOAJ-Seite mit HTTP 403, nicht geprüft |
| Fork Farms «Seeding and labeling» | nur Salat und Kräuter, keine Fruchtgemüse |
| KidsGardening «Starting Seeds for Hydroponics» | «one or two seeds» ohne Artbezug |
| Foren (Stack Exchange, thehotpepper.com) | Foren ausgeschlossen |
| UCR Kursleitfaden 2020 | keine Samenzahl je Würfel |

## Lückenliste (Klasse D, kein Hydroponik-Wert in gültiger Form)

Werte, die nur in `profilwert_offen.csv` stehen, sind mit «offen» markiert (belegt, aber Form des Validators nicht erfüllt; Tim entscheidet).

### Tomate (`solanum_lycopersicum`)

| Phase | Grösse | Stand |
|---|---|---|
| keimung | `dauer` | offen (5 Tage Einzelwert; 14 Tage Einzelwert) |
| keimung | `keimart` | D: keine Hydroponik-Quelle; Tütenwert fehlt in `sorten.csv` |
| anzucht | `dauer` | offen (4 bis 6 Wochen, 4 Wochen, 21 Tage) |
| anzucht | `ec` | offen (2.0 Einzelwert; 2.5 bis 3.0) |
| wachstum | `dauer` | offen (4 bis 6 Wochen) |
| bluete | `dauer` | offen ohne Zahl («4 weeks to 3 months») |
| fruchtbildung_reife | `dauer` | offen (3 bis 9 Monate) |
| alle | `licht_h`, `wassertemp` | D |
| – | Saatempfehlung `dauerkultur_frucht` | keine Quelle A bis C; Tims Entscheid «1 Pflanze je Topf» liegt vor (Koordinator) |
| – | Artmerkmale | D: `samentyp`, `standard_keimfaehigkeit`, `systemeignung`, `liter_je_pflanze`, `wasserbedarf_je_pflanze_l`, `pflanzen_je_m2` (CEAC nur Bereich «2.5-3 plants/m2»), `wuchshoehe_max_mm`, `wuchsform`, `photoperiode`, `bestaeubung_noetig`, `pythium`, `schossen_handlung`, `umsetzen_ab_d`, `umsetzen_bis_d`, `kulturformen_erlaubt`, `kulturform_vorgabe` |
| – | Kulturform-Felder | D: `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`, `kulturdauer_typisch_d`, `entspitzen` |

### Chili (`capsicum_annuum`)

| Phase | Grösse | Stand |
|---|---|---|
| – | `name_de` | «Chili» nicht in GBIF (siehe Hinweis 8) |
| keimung | `dauer` | offen (7 bis 10 Tage, 7 bis 14 Tage, 1 Woche, 14 Tage) |
| keimung | `keimart` | D: keine Hydroponik-Quelle; Tütenwert fehlt in `sorten.csv` |
| anzucht | `dauer` | offen (6 bis 9 Wochen, 6 Wochen, 6 bis 7 Wochen, 5 bis 6 Wochen, 21 Tage, 4 Wochen) |
| anzucht | `ph` | offen (5.8 Einzelwert) |
| anzucht | `ec` | offen (2.5, 2.0 bis 2.5 als Absenkung, 2.3) |
| anzucht | `licht_h` | offen (18 Einzelwert, Absenkung 18 auf 14) |
| wachstum | `dauer` | offen (4 bis 6 Wochen) |
| bluete | `dauer` | offen ohne Zahl |
| fruchtbildung_reife | `dauer` | offen (7 bis 9 Wochen, 7 Wochen, 4 Wochen, 3 bis 9 Monate) |
| wachstum, bluete, fruchtbildung_reife | `licht_h`, `wassertemp` | D |
| – | Saatempfehlung `dauerkultur_frucht` | D: keine Quelle A bis C (UNALM nennt Steinwollwürfel 2.5 x 3.0 cm, aber keine Samenzahl) |
| – | Artmerkmale | D wie Tomate; `pflanzen_je_m2` nur als Bereich (Alberta «3 to 6 plants/m²», CEAC «4-6 plants/m2») |
| – | Kulturform-Felder | D wie Tomate (ausser `ernteart`) |

## Runde 2 (12.11.2026, Auftrag `auftrag_runde-2.md`, Entscheid 0018)

Bestehende Zeilen unverändert; nur neue Kandidaten mit der nächsten freien Nummer je `zeile_id` (über `profilwert.csv` und `profilwert_offen.csv` bzw. beide Saatempfehlungsdateien gezählt). Alle neuen Zeilen `status = entwurf`.

### Suchweg

- frankiesgarten.de (Entscheid 0018 Punkt 5, Klasse C, `praxis`): Tomaten-Seite `/anleitungen/gemueseanbau/tomaten-hydroponik/` (Keimung im Schaumstoffwürfel, Anzuchtstation mit Nährlösung und Luftsprudler unter Lampe, danach HydroFlex-Tower mit Pumpe 5 an/30 aus im Gewächshaus), Paprika-Seite `/anleitungen/gemueseanbau/paprika-hydroponik/` (Schaumstoffwürfel, Anzuchtstation, Hydrotower drinnen), Tabelle `/anleitungen/keimtemperaturen-und-keimdauer/` (Zeilen Tomate, Paprika, Chili; Samen je Würfel), `/faq/`. Eine eigene Chili-Seite gibt es nicht; die Paprika-Seite gilt für `capsicum_annuum`, die Keimtabelle hat eine eigene Zeile Chili.
- Fork Farms Help Center (Hersteller des Indoor-Systems Flex Farm, B2): «Mini Tomatoes», «Mini Peppers» (Keimdauer, Tage bis zum Umsetzen, pH, Licht).
- University of Hawaii, Kratky-Versuch Tomate 2005 (nicht zirkulierend, B1): EC-Stufen, Systemeignung Kratky. PDF über WebFetch geladen und gelesen.
- EU-Richtlinie 2002/55/EG Anhang II (legislation.gov.uk): Mindestkeimfähigkeit Tomate und Paprika für `standard_keimfaehigkeit`.
- Suchen nach Dauer je Phase (Blüte bis Ernte, Tage ab Umsetzen bis Blüte) in Hydroponik-Studien und Beratungsschriften für Tomate und Peperoni: kein Treffer mit Tageswerten min, typ, max.

### Hinweise für Prüfer und Lead

1. `system_quelle`: Den HydroFlex-Tower (Wurzeln hängen in Nährlösung, Pumpe im Intervall) und die Flex Farm habe ich als `nft` erfasst, weil die Aufzählung kein Turmsystem kennt; die Seiten nennen den Begriff NFT nicht. Anzuchtstation mit Luftsprudler (Tomate) als `dwc`, Anzuchtstation mit Schaumstoff im Wasser (Paprika) und Keimbox als `substrat_inert`. Die Methodenprüfung möge das je Zeile bestätigen.
2. EC-Einheit frankiesgarten Tomate: Die Tomaten-Seite nennt neben den EC-Stufen keine Einheit; als `mS/cm` erfasst, weil die FAQ derselben Website für Tomaten «mS/cm» nennt und die Paprika-Seite «EC-Wert (mS/cm)». Kratky 2005 schreibt «mS» ohne Längenbezug.
3. `pw.capsicum_annuum.anzucht.dauer#7` (14/14/28): Rechnung Tage ab Saat minus Beginn der Anzuchtphase (Tag 7), alle Zahlen aus der Paprika-Seite (Unterzeile «etwa Tag 7 bis 21», «Nach etwa 21 Tagen», «Ab Tag 21 bis 35 Tag»). Prüfen, ob «Tag 7» als Phasenbeginn genügt (die Keimdauer derselben Seite ist 7 bis 14 Tage).
4. `standard_keimfaehigkeit`: gesetzliche Mindestkeimfähigkeit für Handelssaatgut (75 % Tomate, 65 % Paprika), als 0.75 bzw. 0.65 geschrieben; keine Hydroponik-Quelle, aber eine Saatguteigenschaft unabhängig vom Anbausystem. Klasse C, Quellenklasse `universitaet_beratung` (amtliche Norm); Lead entscheidet, ob die Grösse so zulässig ist.
5. `art.solanum_lycopersicum.systemeignung#1 = kratky`: Der Versuch füllt die Tanks über ein Schwimmerventil nach und nennt die Methode «has promise», warnt aber vor dem hohen Wasserbedarf langer Kulturen. Für DWC fand ich keine Tomaten- oder Chili-Quelle; `beide` ist daher nicht belegt.
6. `ak.solanum_lycopersicum.dauerkultur_frucht.entspitzen#1 = ja`: Die Quelle beschreibt Stabtomaten bis 2 m; die Sorten im Auftrag sind kompakte Balkon- und Ampeltomaten. Fachlich offen, ob Entspitzen bei ihnen gilt.
7. Saatempfehlung: frankiesgarten-keimtabelle nennt 1 Samen je Würfel für einzeln wachsende Pflanzen (Tomate, Paprika, Chili) und 2 Samen bei Keimkraft unter 50 Prozent; daraus `samen_je_schwamm 1`, `obergrenze_samen 2`, `pflanzen_stehen_lassen 1`, Skala B (Schaumstoffwürfel, Grösse nicht genannt). Die Tomaten- und die Paprika-Seite nennen nur «ein Samen», deshalb in `saatempfehlung_offen.csv`.
8. BBCH: In Runde 2 keine neuen BBCH-Zeilen. Die bestehende Quelle `bbch-monografie-2001` hat in `quelle.csv` noch den Link `reterurale.it`; laut Auftrag gilt https://www.politicheagricole.it/flex/AppData/WebLive/Agrometeo/MIEPFY800/BBCHengl2001.pdf. Die Zeile habe ich nicht geändert (Runde 1 abgeschlossen); Korrektur durch den Koordinator.

### Verworfene Quellen (Runde 2)

- scaleandstem.pages.dev, freshroot.pages.dev, mds.oandg.co.uk, my-niche-site-web-gmpz.vercel.app, mayfairfarms.com: ohne erkennbare Quelle bzw. Produkt-Vergleichsseiten.
- greenwaybiotech.com (Blog eines Düngerhändlers ohne eigene Versuchsangaben, nicht geöffnet), greenhousegrower.com Royalstar («eight weeks after transplanting», Wochenangabe, Erde oder Substrat nicht genannt).
- cales.arizona.edu/hydroponictomatoes: Seite nicht mehr erreichbar (404).
- University of Arizona, Workshop-Modul 5 (Tomato Morphology and Steering): PDF über 10 MB, nicht lesbar.
- EUR-Lex konsolidierte Fassung: Seite lieferte keinen Text; ersatzweise legislation.gov.uk (Fassung 31.12.2020).
- Studien zu Peperoni in NFT (Kolumbien, Indien) und zu schwimmender Kultur (BMC Plant Biology 2024): nur Messzeitpunkte nach dem Umsetzen, keine Phasendauern.
- frankiesgarten Tomaten-Seite, Termine (Aussaat ab 20. März, Umzug Mitte Mai, Ernte Anfang Juli bis Mitte Oktober): Kalenderdaten, keine Tage; nicht umgerechnet.
- Fork Farms «Days to Harvest: 50-55 Days» (Tomate) und «75-90 Days» (Peperoni): Bezugspunkt nicht eindeutig (ab Saat oder ab Umsetzen) und nur Bereich; nicht als `ernte_ab_d` erfasst.
- Kratky 2005, Daten Saat 5. Mai, Umsetzen 18. Juni, Ernte 18. August bis 29. Oktober 1999: Kalenderdaten, nicht in Tage umgerechnet; Erntedauer «72 day harvest period» ist ein Einzelwert der Sorte Big Beef und nicht als `kulturdauer` erfasst (Bezug ab Saat fehlt).

### Lückenliste nach Runde 2 (ohne ladbaren Kandidaten, Klasse D)

#### Tomate (`solanum_lycopersicum`)

| Phase | Grösse | Stand nach Runde 2 |
|---|---|---|
| keimung | `dauer` | weiter nur offen (6 bis 10 Tage zweimal, 2 bis 4 Tage; alle ohne typ) |
| keimung | `keimart` | geschlossen: `dunkel` (#1, #2, Klasse C) |
| anzucht | `dauer` | weiter nur offen; keine neue Quelle mit Tagen |
| anzucht | `ec` | neuer Kandidat #3 0.4 bis 1.3 mS/cm (C); dazu offen #4 (Einzelwerte) |
| wachstum, bluete, fruchtbildung_reife | `dauer` | D: keine Hydroponik-Quelle mit Tagen min, typ, max |
| keimung, anzucht | `licht_h` | keimung D; anzucht #1 12 bis 16 h |
| alle | `wassertemp` | Kandidaten für alle fünf Phasen (C) |
| wachstum, bluete, fruchtbildung_reife | `licht_h` | #1 14 bis 16 h (FAQ, C), offen #2 18 h |
| – | Artmerkmale | D: `samentyp`, `liter_je_pflanze`, `wasserbedarf_je_pflanze_l`, `pflanzen_je_m2`, `wuchshoehe_max_mm`, `wuchsform`, `photoperiode`, `pythium`, `schossen_handlung`; `systemeignung` nur `kratky` |
| – | Kulturform `dauerkultur_frucht` | D: `ernte_ab_d`, `ernteintervall_d`, `kulturdauer_typisch_d`, `kulturdauer_max_d` |

#### Chili (`capsicum_annuum`)

| Phase | Grösse | Stand nach Runde 2 |
|---|---|---|
| keimung | `dauer` | weiter nur offen (7 bis 14 Tage, 4 bis 7 Tage; ohne typ) |
| keimung | `keimart` | geschlossen: `dunkel` (#1, #2, Klasse C) |
| anzucht | `dauer` | neuer Kandidat #7 14/14/28 Tage (C, Rechnung siehe Hinweis 3) |
| anzucht | `ph` | neuer Kandidat #2 5.5/5.8/6.0 (C) |
| anzucht | `ec` | weiter nur offen (neu #4 Einzelwerte 0.5 und 1.0) |
| wachstum, bluete | `dauer` | D |
| fruchtbildung_reife | `dauer` | weiter nur offen (neu #5 3 bis 6 Wochen) |
| keimung | `licht_h`, `wassertemp` | D |
| anzucht bis fruchtbildung_reife | `licht_h`, `wassertemp` | Kandidaten 14 bis 16 h und 18 bis 24 °C (C) |
| – | Artmerkmale | D: `samentyp`, `systemeignung` (keine DWC- oder Kratky-Quelle), übrige wie Tomate |
| – | Kulturform `dauerkultur_frucht` | D: `ernte_ab_d`, `ernteintervall_d`, `kulturdauer_typisch_d`, `kulturdauer_max_d`, `entspitzen` |

## Runde 3 (12.11.2026): Phasendauern Wachstum, Blüte, Fruchtbildung und Kulturform `dauerkultur_frucht`

### Suchweg

- frankiesgarten.de Tomaten- und Paprika-Seite erneut gelesen: Tomate nennt für Wachstum, Blüte und Frucht nur Pflanzenhöhen und Kalenderdaten (Anfang Juli bis Mitte Oktober), Druckkarte mit leeren Feldern «Erste Blüte nach: _ Tagen»; Paprika nur «Ab Tag 21 bis 35» (Umsetzen, schon Kandidat anzucht #7) und «3 bis 6 Wochen» Reife (schon offen #5). Keine neuen Werte.
- Suche «days to first flowering» / «days after transplanting» Hydroponik Tomate und Chili, englisch und spanisch («días después del trasplante», «etapa vegetativa», Tezontle).
- Fund Chili: Revista Mexicana de Ciencias Agrícolas 13(1) 2022, Chilhuacle negro im offenen Hydroponiksystem auf Tezontle (Gewächshaus), Phasendauern ab Umsetzen gemessen (Klasse A): Wachstum 29 Tage, Blütenknospe bis Fruchtansatz 11 Tage, Fruchtbildung 184 Tage. Alle Einzelwerte, daher `profilwert_offen.csv`.
- Fund Tomate: CIGR Journal 27(2) 2025, NFT aus Reifenschläuchen im Folien-Gewächshaus (Klasse A): erste Blüte 43 Tage ab Saat (offen, Tage ab Saat), Erntebeginn 71 Tage nach dem Umsetzen (`ernte_ab_d` #1 in `art.csv`).

### Hinweise für den Lead

- Chilhuacle: Die Quelle widerspricht sich bei der Fruchtbildung (Ergebnisteil «duración de 184 días», Methodik «inició a los 41 ddt [...] finalizó a los 184 ddt»). Umsetzen bei 74 Tagen ab Saat (S. 157) und Ende der Ernte bei 184 ddt stehen in derselben Quelle; eine `kulturdauer_max_d` daraus wäre eine Rechnung, daher nicht angelegt. Die Phasen beginnen bzw. enden an der ersten Blütenknospe, nicht an der offenen Blüte.
- CIGR 2025: Im selben Methodenabsatz steht auch «Tomatoes were harvested after 85 days from sowing»; das widerspricht 71 DAT bei einem Umsetzen nach Anzucht. Ernteende 91 DAT ist Versuchsende, keine Kulturdauer.

### Verworfen

- Explora: Environment and Resource 2(3) 2025, «Evaluation of yield performance of Capsicum annuum (chili) cultivated using a low-cost, sustainable hydroponic system» (erste Blüte 58 Tage, erste Frucht 82 Tage): Artikel zurückgezogen (Retraction Notice), Bezugspunkt nicht genannt.
- Adams et al. 2001, Annals of Botany 88, «Effect of Temperature on the Growth and Development of Tomato Fruits» (Reife 95, 65, 46, 42 Tage nach Blühbeginn bei 14 bis 26 °C): Anbausystem auf der Seite nicht belegbar (nur «controlled environmental conditions»), Volltext nicht zugänglich.
- Alabama ACES ANR-2955, MSU P2364 (Glossar), MSU P1828 (404), UT Morgan 2003, Journal of Horticultural Research 2023 (Single Truss, nur Kalenderdaten): keine Phasendauern in Tagen.
- Revista Chapingo Serie Horticultura (Cherry-Tomate auf Tezontle, Tage bis Blüte und Reife): Server nicht erreichbar (Verbindungsabbruch), Werte nicht gelesen.
- INIFAP-Server cienciasagricolas.inifap.gob.mx nicht erreichbar (DNS); Chilhuacle-Artikel über Dialnet gelesen.
- University of Arizona Workshop-Modul 7 (Tomato Flowers and Fruit): PDF über 10 MB; WUR-Dissertation de Koning 1994: gescannt, ohne Text.
- Blogs und Händlerseiten (Rise Gardens, scaleandstem, Alibaba «spice basics»): ohne Versuch und Belege.

### Lückenliste nach Runde 3

| Art | Phase / Feld | Stand |
|---|---|---|
| Tomate | `wachstum.dauer` | nur offen (#1 4 bis 6 Wochen, #2 43 Tage ab Saat) |
| Tomate | `bluete.dauer`, `fruchtbildung_reife.dauer` | D für Tage; nur offen #1 (Wochen bzw. ohne Wert) |
| Tomate | `ernte_ab_d` | neu #1 71 Tage (A) |
| Tomate | `kulturdauer_typisch_d`, `kulturdauer_max_d` | D |
| Chili | `wachstum.dauer` | nur offen (#2 29 Tage, Einzelwert) |
| Chili | `bluete.dauer` | nur offen (#2 11 Tage, Einzelwert) |
| Chili | `fruchtbildung_reife.dauer` | nur offen (#1 bis #6, neu #6 184 Tage) |
| Chili | `ernte_ab_d`, `kulturdauer_typisch_d`, `kulturdauer_max_d` | D (Chilhuacle-Daten nur über Rechnung) |

## Runde 4 (12.11.2026): letzte gezielte Suche Phasendauern Tomate und Chili

### Suchweg

- Englisch: «days after anthesis» / «days from flowering» / «weeks after pollination» / «fruit growth period» mit rockwool, perlite, NFT, DWC; «days to first flowering» «after transplanting» hydroponic (MDPI Horticulturae, Agronomy).
- Spanisch: «días después del trasplante» mit floración, fructificación, inicio de cosecha, primer corte; Tezontle, hidroponía, jitomate, pimiento morrón, chile jalapeño/serrano/habanero.
- Rund 15 Treffer geöffnet (PDF lokal mit eigenem Textauszug gelesen, wo WebFetch nur Binärdaten lieferte). Kein neuer Kandidat: keine Quelle mit hydroponischem Anbausystem und Phasendauer ab Phasenbeginn, die sich wörtlich belegen liess.

### Verworfen

- University of Kentucky «Greenhouse Tomatoes» (2018): nur «harvested two to three times per week», keine Phasendauern.
- Advances in Horticultural Science 39(4) 2025, Cherry-Tomate Hydroponik (Perlit:Kokos) gegen Erde: keine Tage bis Blüte oder Reife.
- Horticulturae 11 (2025) 454, Tomaten- und Paprika-Jungpflanzen im Indoor Vertical Farm: nur Anzucht (30 bzw. 40 Tage ab Saat), nicht gesucht.
- Revista Chapingo Serie Horticultura 16(3) 2010, Pimiento morrón auf Tezontle (offenes Hydroponiksystem): nur Gesamtzyklus «de trasplante a fin de cosecha duró 110 a 120 días» (keine Phasendauer; allenfalls Kulturdauer, nicht Auftrag dieser Runde).
- Revista Chapingo Serie Horticultura 17(2) 2011, «Fenología y rendimiento de híbridos de pimiento morrón (Capsicum annuum L.) cultivados en hidroponía» (laut Suchauszug Floración 33, Fructificación 44, Cambio de color 93, Inicio de cosecha 102 ddt): Redalyc nicht erreichbar (ECONNREFUSED), Scribd-Kopie ohne Text; Werte nicht wörtlich gelesen, daher kein Kandidat. Empfehlung: bei erreichbarem Server nachlesen, Kandidaten für Chili `wachstum`, `bluete`, `fruchtbildung_reife` wahrscheinlich (Klasse A).
- Revista Mexicana de Ciencias Agrícolas 11(3) 2020, Fenología Chile im Gewächshaus: Substrat Torf, Perlit und «tierra de monte» (Erde), ausgeschlossen.
- UAM Xochimilco, Servicio-social-Bericht Jitomate (2023): studentischer Bericht, Textstelle «50-60 días después de la apertura floral» im Auszug nicht auffindbar, Substrat unklar.
- Horticultural Research (Japan) 17(3) 2018: Anbausystem nicht genannt, Abstract ohne Tageszahlen.
- Hydro Environment «Guía de Cultivo del Jitomate» (HTTP 403), NMBU-Masterarbeit (DNS), Massey-Dissertation (über 10 MB), SARE «tomato hydroponics» und UT W844-C (Text nicht extrahierbar): nicht gelesen.
- Blogs und Händlerseiten (Rise Gardens, scaleandstem, hydrobuilder, a-z-animals, Alibaba): ohne Versuch und Belege.

### Lückenliste nach Runde 4

Unverändert gegenüber Runde 3: Tomate `wachstum.dauer`, `bluete.dauer`, `fruchtbildung_reife.dauer` und Chili `wachstum.dauer`, `bluete.dauer`, `fruchtbildung_reife.dauer` ohne Kandidat in gültiger Form (nur Einträge in `profilwert_offen.csv`).

## Runde 5 (12.11.2026): Phasendauern Chili (Revista Chapingo 2011) und Tomate

### Suchweg

- Revista Chapingo Serie Horticultura 17(2) 2011 über Redalyc (PDF 60949936002) geladen und mit eigenem Textauszug gelesen: 13 Paprika-Hybride, Gewächshaus Chapingo 2007, Umsetzen bei 67 dds in Beete mit Tropfbewässerung und Nährlösung (Substrat der Beete im Methodenteil nicht genannt, Titel «cultivados en hidroponía»). Werte ab Umsetzen (ddt): Blüte 33 (Hybride 30 bis 45), Fruchtansatz 44, Farbwechsel 93, Erntebeginn 102 (Giacomo 91, Grandísimo 117).
- Neu Chili: `wachstum.dauer` #3 (30/33/45, `profilwert.csv`), `bluete.dauer` #3 (11 = 44 − 33, offen, Einzelwert), `fruchtbildung_reife.dauer` #7 (58 = 102 − 44, offen, Einzelwert), `ernte_ab_d` #1 (102, `art.csv`).
- Tomate spanisch («fenología jitomate hidroponía», «días a floración», «antesis», Tezontle, Despunte), portugiesisch («dias após o transplante», «início da floração», NFT) und englisch («days after transplanting» «first flowering» hydroponic): kein Treffer mit wörtlich lesbaren Tagen ab Umsetzen bis Blüte, Fruchtansatz oder Reife im hydroponischen System.

### Hinweise für den Lead

- Chapingo 2011: Das Substrat der Produktionsbeete ist nicht genannt (Anzucht in Torf und Perlit 2:1); `system_quelle = substrat_inert` stützt sich auf den Titel und die Bewässerung mit Nährlösung, Methodenprüfung bitte prüfen. Die Spannweite 30 bis 45 sind Mittel einzelner Hybride (Cuadro 3, DFL 30.0 bis 45.3), der typische Wert 33 das Gesamtmittel (Text; Cuadro 3 «Media gral.» 33.4).
- Der erste Fruchtansatz wurde entfernt («se eliminó el primer fruto»); Fruchtansatz 44 ddt bezieht sich laut Text auf «fructificación».

### Verworfen

- Revista Chapingo 18(2) 2012, sieben native Cherry-Tomaten auf Tezontle («días a floración», «días a madurez» des ersten Racimo): Server aramara.uan.mx nicht erreichbar (Socket geschlossen), Werte nicht gelesen.
- Revista Chapingo 27(2) 2021 (Containervolumen und Spättransplantation, Tezontle) und 15(1) 2009 (Treppen-Dosel, Tezontle): keine Tage bis Blüte, Fruchtansatz oder Reife.
- Revista Chapingo 31 (2025) e24011 und e25012: Feigen bzw. Text nicht extrahierbar, nicht einschlägig.
- Semina Ciências Agrárias 2011 (Raísa in NFT): DOAJ HTTP 403; Probenahmen nur zu festen DAT.
- Agrolink, agroportal.pt, Greenhouse Grower, UT W844-C: keine Hydroponik-Versuche oder nur allgemeine Angaben.

### Lückenliste nach Runde 5

| Art | Phase / Feld | Stand |
|---|---|---|
| Tomate | `wachstum.dauer`, `bluete.dauer`, `fruchtbildung_reife.dauer` | unverändert: nur offen, keine gültige Form (D für gültige Kandidaten) |
| Chili | `wachstum.dauer` | neu #3 30/33/45 Tage (A) |
| Chili | `bluete.dauer` | nur offen (#2 11, neu #3 11, Einzelwerte) |
| Chili | `fruchtbildung_reife.dauer` | nur offen (neu #7 58, Einzelwert) |
| Chili | `ernte_ab_d` | neu #1 102 Tage (A) |

## Runde 7 (12.11.2026): Phasendauern Tomate

Nur `pw.solanum_lycopersicum.wachstum.dauer`, `bluete.dauer` und `fruchtbildung_reife.dauer` (Ebene Art). Alle neuen Zeilen in `profilwert_offen.csv`, `status = entwurf`; kein Kandidat erfüllt die Form des Validators.

### Suchweg

- Revista Chapingo 18(2) 2012 (native Cherry-Tomaten auf Tezontle, in Runde 5 nicht erreichbar): aramara.uan.mx weiter unerreichbar; über die DOI-Weiterleitung `revistas.chapingo.mx` als PDF geladen und gelesen. Neu `wachstum.dauer#6`, `fruchtbildung_reife.dauer#4` (Tage ab Saat).
- Europe PMC (REST-Suche, Volltext-XML): «tomato» mit hydroponic, rockwool, nutrient film, coir und «days after transplanting», «first flower», «anthesis», «first harvest», «days after anthesis», «fruit set». Gelesen: Frontiers in Plant Science 2016 (NFT, Bari), New Phytologist 2020 (Steinwolle, Wageningen), Frontiers in Plant Science 2023 (Kokos-Tanks, Guangzhou). Neu `wachstum.dauer#3` bis `#5`, `fruchtbildung_reife.dauer#2`, `#3`.
- Portugiesisch («dias após o transplantio», florescimento, início da colheita, NFT): Treffer gefunden, aber alle brasilianischen Server (unicamp, ifto, ifmg, confea, Embrapa, scielo.br, redalyc 4457) lieferten keine Datei.
- Spanisch («ddt», «inicio de cosecha», «amarre de fruto», «primer corte», Tezontle, Despunte): Treffer geöffnet, ohne Tomaten-Phasendauern ab Umsetzen.
- UF/IFAS (Florida Greenhouse Vegetable Production Handbook HS785, HS940, Bericht 97-14 Perlite): nur Kalenderdaten.
- Fork Farms «Mini Tomatoes» und frankiesgarten.de Tomaten-Seite erneut gelesen: keine Tage oder Wochen bis Blüte, Fruchtansatz oder Ernte ab Umsetzen.

### Hinweise für den Lead

1. Keine Quelle nennt den Fruchtansatz als eigenen Zeitpunkt. Die drei Kandidaten für `fruchtbildung_reife` messen ab Blüte bzw. Anthese und umfassen damit Blüte und Fruchtbildung; für `bluete.dauer` allein gibt es keinen Wert.
2. Frontiers 2016 Table 3 ist eine Tabelle zur Planung der Nährlösung mit Phänologie je DAT (28 Blühbeginn erste Rispe, 117 erste Ernte); der Text nennt Erntebeginn 121 und 115 DAT für die zwei Versuche (Wintersatz Januar/Februar, Apulien).
3. New Phytologist 2020: Umsetzen erst mit 11 sichtbaren Blättern (rund 6 Wochen ab Saat, Anzucht 2 Wochen in Topferde, dann Steinwolle); Blüte 21.4 bis 22.6 Tage ab Umsetzen, Reife 67.0 bis 71.7 Tage nach Anthese.
4. Frontiers 2023: Umsetzen nach 15 Tagen Anzucht unter LED; erste Blüte 15.87 bis 16.80 Tage (Spalte «Time to first flower (day)», Bezug Umsetzen aus Zusammenhang).
5. Chapingo 2012: Saat 16. März, Umsetzen 15. April 2007 (Kalenderdaten, nicht umgerechnet); Text und Cuadro 1 widersprechen sich bei 109.6 dds (JCPRV-71 im Text, JCPRV-76 in der Tabelle).

### Verworfen

- Scientific Reports 9 (2019) (Perlit, NFT, DFT, Murcia): nur Probenahmen 25, 50, 101 DAT, keine Phänologie.
- Plants 2023 (PMC10097077, Blüte 20 und 27 Tage nach Umsetzen): Anbau in Erde.
- Plants 2026 (PMC13610534, Indien, geschlossene Hydroponik, Blüte 34.33 bis 52.33 DAT): Blattdüngung mit Zink-Nanopartikeln, Kontrollwert im Text (52.33) und in der Tabelle (T1 55.67) nicht eindeutig zuordenbar.
- PMC11375428 (2024, Micro-Tom, Pflanzenfabrik, Blüte 36.6 DAT): Steinwollwürfel 5 cm, Nährlösung im Text nicht eindeutig; genomeditierte Linien.
- PMC7753909 (Abwasser-Hydroponik, Ernte 72 bis 106 DAT): Nährlösung aus teilgereinigtem Abwasser, kein Blühtermin.
- PMC7961429, PMC10312241, PMC10628543: Probenahmen nach Anthese (DAA), keine Phasendauern.
- Hydroenv «Guía de Cultivo del Jitomate» (Cloudflare-Sperre), Revista Fitotecnia Mexicana 26(4) und INIFAP (keine Datei), UNAM-Lizentiatsarbeit (Fallstudie ohne Versuch).
- Fork Farms «support around weeks 6-8, right before fruit production»: Zeitpunkt der Stütze, keine Phasengrenze.

### Lückenliste nach Runde 7

| Art | Phase / Feld | Stand |
|---|---|---|
| Tomate | `wachstum.dauer` | nur offen: neu #3 28 DAT (Einzelwert, A), #4 21.4 bis 22.6 DAP (A), #5 15.87 bis 16.80 Tage (A), #6 42.4 bis 46.7 dds (A) |
| Tomate | `bluete.dauer` | D: keine Hydroponik-Quelle mit Tagen Blüte bis Fruchtansatz |
| Tomate | `fruchtbildung_reife.dauer` | nur offen: neu #2 89 Tage Blühbeginn bis erste Ernte (A), #3 67.0 bis 71.7 DAA (A), #4 96.0 bis 117.9 dds (A); alle ab Blüte, nicht ab Fruchtansatz |

## Runde 8 (13.11.2026): Blüte und Fruchtbildung Tomate

Nur `pw.solanum_lycopersicum.bluete.dauer` (Blüte bis Fruchtansatz) und `pw.solanum_lycopersicum.fruchtbildung_reife.dauer` (Fruchtansatz bis erste reife Frucht), Ebene Art. Alle neuen Zeilen in `profilwert_offen.csv`, `status = entwurf`; kein Kandidat erfüllt die Form des Validators (Dezimalwerte oder Einzelwerte). Neue Quellen: `unalm-tomate-mnb-tesis-2019` (B1), `frontiers-mo-genotyp-tomate-2018` (A), `sensors-cherry-greenhouse-ai-2020` (A).

### Suchweg

- Europe PMC (REST, Volltext-XML): tomato mit hydroponic, rockwool, soilless, perlite, coir, NFT und «fruit set» «days after transplanting», «from fruit set to», «anthesis to fruit set», «fruit set stage», «days after fruit set», «days to first fruit set», «fruit development period», «fruit growth period», «fruit set was determined» «days after anthesis». Gelesen u. a. PMC6328480, PMC7698269, PMC6515393, PMC11255863, PMC6403137, PMC13164892, PMC11882041, PMC12646150, PMC10319911.
- Beratung englisch: Alabama Extension (Greenhouse Tomato Production), UGA B1182, UF/IFAS HS169, Grodan-Whitepaper (Fruchtqualität), Tower Garden Tomaten: keine Tage Fruchtansatz bis Ernte.
- Japanisch («養液栽培» «着果から収穫まで»): Berichte der Präfekturen Akita, Ibaraki, Yamaguchi, Hokkaido: keine Tage ab Fruchtansatz.
- Spanisch («amarre de fruto» «ddt» Tezontle, «desde el cuajado hasta la recolección», «de cuajado a cosecha» hidropónico): Treffer Masterarbeit UNALM 2019 (CIHNM Lima) mit «Días a floración», «Días a fructificación», «Días a cosecha» ab Umsetzen; über die DSpace-REST-Schnittstelle als PDF geladen und gelesen.
- Portugiesisch («início da frutificação» «dias após o transplantio» hidropônico): Revista Ciência Agronômica, PAB 2007 (NFT Viçosa), Nativa, Embrapa: Fruchtansatz nur als Nährlösungsphase, ohne Tage.

### Neue Kandidaten (alle offen)

| kandidat_id | Wert | Quelle | grund |
|---|---|---|---|
| `bluete.dauer#2` | 14.00 bis 14.67 Tage (Fruchtansatz 28.00 bis 28.67 DDT minus Blüte 14.00 DDT) | UNALM-Tesis 2019, Cuadro 5 | Dezimalwerte, Bereich ohne typ |
| `fruchtbildung_reife.dauer#5` | 58.46 bis 59.13 Tage (erste Ernte 86.60 bis 87.13 DDT minus Fruchtansatz) | UNALM-Tesis 2019, Cuadro 5 | Dezimalwerte, Bereich ohne typ |
| `fruchtbildung_reife.dauer#6` | 35 Tage ab Markierung beim Fruchtansatz bis Handelsreife | Frontiers 2018 (Perlit) | Einzelwert, Probenahmeprotokoll |
| `fruchtbildung_reife.dauer#7` | 35 Tage Fruchtwachstum (Beginn sichtbares Fruchtwachstum bis Ernte der Rispe) | Sensors 2020 (Steinwolle) | Einzelwert, Rechenannahme der Autoren |

### Hinweise für den Lead

1. UNALM-Tesis 2019 ist die einzige Quelle mit Fruchtansatz als eigenem Zeitpunkt in Tagen ab Umsetzen («fructificación (desarrollo de primeros frutos)»). Blüte ist dort als «comenzaron a desarrollar el primer ramo floral» definiert, also Beginn der ersten Rispe und nicht ausdrücklich offene Blüte; alle Pflanzen 14 DDT.
2. UNALM-Tesis: Text und Cuadro 5 widersprechen sich bei der Spaltenzuordnung des Fruchtansatzes (28.67 laut Tabelle ConMNB Ar, laut Text ConMNB CAr) und bei der Ernte SinMNB Ar (Tabelle 87.13, Text 88.73; dann 60.20 Tage). Die Spanne der Kandidaten folgt der Tabelle. Substrat Ar ist Sand (inert), CAr Sand und Reisspelzen 1:1 (organischer Anteil); Anlage im CIHNM mit Schattennetz, Wetterstation mit Niederschlag, daher `umgebung_quelle = andere`. Masterarbeit ohne Begutachtung: Klasse B1 (Universität mit eigenen Hydroponik-Angaben), `quelle_klasse = universitaet_beratung`.
3. Frontiers 2018 und Sensors 2020 nennen je 35 Tage ab Fruchtansatz; beide sind Protokoll- bzw. Rechenwerte, keine gemessene Phasendauer. Sensors 2020 zeigt gemessene Fruchtwachstumsdauern nur in Abbildungen (nicht wörtlich lesbar).

### Verworfen

- PMC6403137 (2019, Phasen «flowering stage, first blossom to first fruit set» mit Datumsangaben): Anbau in Erde mit Salzzugabe in Containern und Freiland.
- PMC6515393 (Autonomous Greenhouse Challenge 2018): mittlere Fruchtwachstumsdauer 17.3 Tage gilt für Gurke, nicht Tomate.
- PMC11255863 (Kirschtomate, Kokos/Perlit, Palermo): keine Dauer ab Fruchtansatz.
- PMC12646150, PMC10319911 (Micro-Tom auf Steinwolle): Fruchtknotenwachstum 2 bis 4 DAA, kein Fruchtansatz als Phasengrenze.
- BUAP-Masterarbeit (Puebla, Bioles): Anbau in Erde (Bodenlösung mit Lysimetern).
- Revista Chapingo/Terra Latinoamericana (Redalyc 263119723001, 57311101006), MAPA-Hortícolas-Hefte (Galicien, Lorca, Almería): keine Hydroponik oder keine Tage ab Fruchtansatz.
- Costa Rica MAG F01-9820 (Phasen 31 bis 40 und 41 bis 79 DDT): laut Suchauszug Freiland, nicht geöffnet.
- Grodan-Whitepaper «Improving tomato fruit quality»: nur Risikofenster 10 bis 14 Tage nach Blüte (Blütenendfäule), keine Phasengrenze.
- Portalfrutícola «Manual de Producción de Tomate Bajo Invernadero» (60 bis 70 Tage Antesis bis Ernte, laut Suchauszug): Gewächshaus ohne Hydroponik-Angabe, zählt ab Antesis; nicht geöffnet.
- UNSM-Tesis 2023 (San Martín): Literaturarbeit ohne eigenen Versuch, zitiert die UNALM-Tesis.
- repositoriotec.tec.ac.cr (Costa Rica, Alter der Setzlinge), UTN Ecuador: keine Datei geladen.

### Lückenliste nach Runde 8

| Art | Phase / Feld | Stand |
|---|---|---|
| Tomate | `bluete.dauer` | nur offen: neu #2 14.00 bis 14.67 Tage (B1); kein gültiger Kandidat (D für gültige Form) |
| Tomate | `fruchtbildung_reife.dauer` | nur offen: neu #5 58.46 bis 59.13 Tage (B1), #6 35 Tage (A), #7 35 Tage (A); dazu #2 bis #4 aus Runde 7 (ab Blüte, verworfen); kein gültiger Kandidat |

## Runde 9 (13.11.2026): Blütedauer Tomate

Nur `pw.solanum_lycopersicum.bluete.dauer` (offene Blüte, BBCH 60/61, bis Fruchtansatz, BBCH 71), Ebene Art. Kein neuer Kandidat, keine neue Quelle.

### Suchweg

- Europe PMC (REST, Volltext-XML): tomato mit hydroponic, rockwool, soilless und «BBCH» mit anthesis/«fruit set»; «days to fruiting», «days to fruit setting», «days to 50% fruit set», «days to first fruiting», «first fruit setting»; «fruit set was (recorded|scored|determined)» mit «after anthesis»/«DAA». Gelesen: PMC12328372, PMC4235429, PMC13274057, PMC10142461, PMC12432177, PMC13360295, PMC10009779, PMC6211714, PMC6339924, PMC8777011.
- Websuche englisch «days from anthesis to fruit set», «from flowering to fruit set» mit hydroponic/rockwool/plant factory; türkisch («topraksız domates» «ilk çiçeklenme» «meyve tutumu»); chinesisch («番茄 基质栽培 始花期 坐果期 定植后»).
- University of Arizona CEAC, Workshop «Module 7 Tomato Flowers and Fruit» (2026, PDF) gelesen.
- Rise Gardens Blog (zwei Tomatenartikel) mit curl gelesen.

### Verworfen

| Quelle | Grund |
|---|---|
| Arizona CEAC Module 7 (2026): «Open flowers are ready for pollination (anthesis)» «After ~2 days, petals close and then fall off» | Lebensdauer der Einzelblüte (Schliessen der Kronblätter), nicht Blühbeginn bis Fruchtansatz; Fruchtansatz nur «visually confirm fruit set», ohne Tage |
| Frontiers 2014 PMC4235429 (Leitfaden Tomate in Klimakammern): «between 6 and 8 weeks after flowering fruits will reach the (red) ripe stage» | Blüte bis Reife, kein Fruchtansatz; zitiert Literatur ohne Systemangabe |
| PMC13274057, PMC12432177, PMC8777011, PMC10319911 und weitere Treffer zu «fruit set» mit DAA | Probenahmen oder Pflanzenmarkierung an festen Tagen nach Anthese (Protokoll), keine gemessene Dauer bis Fruchtansatz; PMC13274057 ist Peperoni |
| Rise Gardens Blog (Kirschtomaten, Hydroponik) | nur erste Ernte 55 bis 70 Tage ab Umsetzen, keine Blüte- oder Fruchtansatztage |
| JASHS (Scribd-Kopie, Klimakammer, 'Azes'): Tage Anthese bis Reife | laut Suchauszug Klimakammer ohne Hydroponik, ab Anthese bis Reife; Scribd-Kopie nicht geöffnet |
| Turkish Journal of Agriculture, Dergipark-Treffer (Kokopit, Perlit) | Auszüge nur Tage bis Blüte bzw. EC je Phase, kein Fruchtansatz in Tagen |
| Chinesische Treffer (casb.org.cn, napstic), Taiwan MOA A02_2 (PDF, Text nicht extrahierbar) | Erde bzw. ohne Phasentage; Taiwan-Merkblatt allgemeine Kulturübersicht |

### Lückenliste nach Runde 9

| Art | Phase / Feld | Stand |
|---|---|---|
| Tomate | `bluete.dauer` | unverändert D für gültige Form: keine Hydroponik-Quelle mit Tagen Blühbeginn bis Fruchtansatz; offen nur #1 (UA CEAC, verworfen) und #2 (UNALM 2019, verworfen) |

## Runde 10 (13.11.2026): Blütedauer Tomate nach Entscheid 0022

Nur `pw.solanum_lycopersicum.bluete.dauer` (offene Blüte, BBCH 60/61, bis Fruchtansatz, BBCH 71), Ebene Art. Nach Entscheid 0022 auch Anbauquellen (Erde, Gewächshaus, Beratung, Hersteller) mit höchstens Klasse C. Vier neue Kandidaten `#3` bis `#6`, alle in `profilwert_offen.csv` (Einzelwerte bzw. zwei Zeitpunkte ohne Bereich), `status = entwurf`. Vier neue Quellen.

### Suchweg

- Bisherige Verwerfungen geprüft: #1 (UA CEAC) und #2 (UNALM 2019) wurden nicht wegen fehlender Hydroponik verworfen, also nicht wiederholt. PMC6403137 (Runde 8, nur wegen Erde verworfen) nennt nur Kalenderdaten; nicht wieder aufgenommen, weil der Lead dann Daten statt Tagen umrechnen müsste. Plants 2023 PMC10097077 (Runde 7) nennt nur Tage bis Blüte, keinen Fruchtansatz.
- Websuche englisch: «fruit set» «days after anthesis», «days to first flowering» «days to first fruit set» (cherry, polyhouse, cocopeat, fertigation), «flowering truss» «setting truss», BBCH 61/71 tomato days after transplanting.
- Websuche deutsch («Tage nach der Blüte» Fruchtansatz) und spanisch («días a floración» «días al cuajado» invernadero cherry).
- Gelesen: Rev. Colomb. Cienc. Hortic. 2018 (PDF), Resumen-Folien Tesis La Molina (Tomate miniatura, Valle de Mala, PDF), Vegetos 2024 (Abstract-Seite), Haifa Crop Guide Tomate (curl), AHDB Knowledge Library «Tomato flower structure and fertilisation».

### Neue Kandidaten (alle offen)

| kandidat_id | Wert | Quelle | Klasse | grund |
|---|---|---|---|---|
| `bluete.dauer#3` | 30 Tage «De flor a fruto de tamaño típico» (BBCH 601 bei 44 ddt bis 701 bei 74 ddt) | Rev. Colomb. Cienc. Hortic. 2018, Figuras 1 bis 3 | C | Einzelwert; Bezug BBCH 61 bis 71 passt genau zum Wechselmerkmal; Medium nicht genannt |
| `bluete.dauer#4` | Blüte 42.3 DDT, Fruchtansatz 57.2 DDT (Mittel 11 Cherry-Cultivare) | Tesis La Molina, Valle de Mala (Folien) | C | zwei Einzelwerte, Dezimal; Erde; Differenz bildet der Lead |
| `bluete.dauer#5` | erste Blüte 20.00 Tage, erster Fruchtansatz 24.37 Tage (beste Behandlung) | Vegetos 2024 (Abstract) | C | zwei Einzelwerte, Dezimal; Zählbeginn nicht genannt; nur Abstract |
| `bluete.dauer#6` | Stufe «flowering» 10 Tage (Schätzung) | Haifa Crop Guide Tomate, Düngeplan Israel | C | Einzelwert; Stufe nicht als Blüte bis Fruchtansatz definiert; Erde |

### Hinweise für den Lead

1. `#3` ist die einzige Quelle, die die Phase nach der BBCH-Skala für Solanaceen abgrenzt (601 Floración, 701 Formación del fruto) und die Dauer selbst nennt («30 d» für alle drei Genotypen). Einschränkung: Blütenstände zwischen 22 und 36 ddt wurden entfernt, die Blüte bei 44 ddt betrifft also nicht den ersten angelegten Blütenstand; Gewächshaus Bogotá 14 bis 30 °C (kühl).
2. `#4` und `#5` liefern je zwei Zeitpunkte derselben Quelle; die Differenzen (nicht eingetragen) liegen weit auseinander. In `#4` ist der PDF-Text spaltenverschoben, nur die Zeile PROMEDIO ist eindeutig.
3. `#6` ist schwach (Düngeplan-Stufe, Schätzung); aufgenommen nur als weitere Quelle.

### Verworfen

| Quelle | Grund |
|---|---|
| AHDB Knowledge Library «Tomato flower structure and fertilisation» | nur Narbenempfängnis, Pollenschlauch und Befruchtung in Stunden; kein Fruchtansatz in Tagen |
| Agronomy 14(3):556 (2024, Cherry-Tomate Gewächshaus, Stadien Anthese bis Fruchtansatz je Blütenstand) | MDPI und DOAJ liefern 403, Europe PMC ohne Eintrag; nicht gelesen |
| SARE «tomato hydroponics» (PDF) | Link liefert HTML statt PDF |
| Frontiers 2023 (Tsukuba, Bestäubung), Springer-Kapitel «Fruit Set and Temperature Stress» | nur Stunden nach Bestäubung bzw. empfindliche Tage vor Anthese |
| SKUAST-K Cherry-Genotypen 2018, IJCMAS 2018, Madras Agric. J. 2017 | laut Auszug nur Tage bis Blüte, kein Fruchtansatz in Tagen |
| Blogs und Ratgeber (tomatodirt, freshroot, scaleandstem, mundohuerto, gardeningknowhow) | keine Gartenbau-, Beratungs- oder Herstellerquelle im Sinn von Entscheid 0022 |
| Artikel 2018 zur Phänologie von Cherrytomaten (Horticultura Argentina, Tage und Wärmesumme bis Blüte und Fruchtbildung) | nicht mehr abgerufen (Zeitbudget); Kandidat für eine weitere Runde |

### Lückenliste nach Runde 10

| Art | Phase / Feld | Stand |
|---|---|---|
| Tomate | `bluete.dauer` | kein Kandidat in Validatorform; offen neu #3 (30 Tage, BBCH 61 bis 71), #4 (42.3 und 57.2 DDT), #5 (20.00 und 24.37 Tage), #6 (10 Tage); Entscheid durch den Lead nach 0018 und 0022 (eigener Wert) |
