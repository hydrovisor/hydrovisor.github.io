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
