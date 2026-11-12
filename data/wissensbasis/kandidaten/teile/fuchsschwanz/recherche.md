# Recherche Kulturgruppe `fuchsschwanz` (Runde 2, 12.11.2026)

Arten: `spinacia_oleracea` (Spinat Butterfly, Leitkultur), `beta_vulgaris_cicla` (Mangold Bright Lights), `beta_vulgaris_conditiva` (Randen Bull's Blood, Blattnutzung nach W6).

## Suchweg

- frankiesgarten.de (Praxis, Klasse C, Entscheid 0018): Seite Rote Bete (Werte für Hydro-Tower, Keimung in Vermiculite), FAQ (nur allgemeine Werte, keine Spinat- oder Mangoldseite), Seite Keimtemperaturen (Tabelle mit Spinat, Mangold, Rote Bete; Keimung in Schaumstoffwürfeln). `…/spinat-hydroponik/` gibt 404; eine Mangoldseite gibt es laut FAQ-Linkliste nicht.
- Cornell CEA: Schlussbericht «Commercially Viable CEA Spinach Production System» (2005, für NYSERDA; Teich/DWC, Babyleaf, Pythium), GPN-Artikel «Growing Hydroponic Leafy Greens» (2016; Babyleaf-Spinat in DWC, Head-Lettuce-Methode laut Quelle auch für Swiss chard).
- Oklahoma HLA-6722, Tabelle 2 (Spinach).
- Studien: Floating-Spinat im Gewächshaus (Mediterranean Agricultural Sciences 2022); Mangold im Floating-System mit drei Schnitten (Horticulturae 2022); Randen Bull's Blood als Babyleaf im Floating-System (Agriculture 2025, genau Tims Sorte).
- Hersteller: Rise Gardens, Spinat-Leitfaden (2026).
- GBIF-API (species/match, vernacularNames), BBCH-Monografie 2001 (PDF S. 41 Beet, S. 122 bis 123 Leaf vegetables not forming heads).

## Zuordnungen des Rechercheurs (zur Prüfung)

1. BBCH Beta: Monografie «Beet (Beta vulgaris L. ssp. vulgaris)»; Mangold und Randen gehören zu ssp. vulgaris. Wachstum endet bei Code 39 (Hauptstadium 4 «Beet root» betrifft die Rübe, nicht die Blattnutzung). Anzucht Mangold 10 bis 14 (Umsetzmerkmal «three to four true leaves» der Cornell-Methode), Randen 10 bis 12 (Umsetzen im «two-leaf stage» der Bull's-Blood-Studie). Spinat Anzucht 10 bis 13 wie Salat in derselben Monografie-Tabelle; kein hydroponisches Umsetzmerkmal für Spinat gefunden, daher Wechselmerkmal aus Code 13.
2. Cornell GPN 2016: pH 5.5 bis 6.0 und das Umsetzmerkmal stehen bei der Head-Lettuce-Methode; die Quelle sagt, die Methode gelte auch für Swiss chard. Der Methodenprüfer möge entscheiden, ob das für Mangold reicht. Die EC-Angabe derselben Stelle («about 1.5 mhos/cm2») ist wegen der unklaren Einheit nicht erfasst.
3. frankiesgarten Rote Bete: Hydro-Tower als `nft` erfasst (wie frankiesgarten Salat in der Gruppe blattsalat), Keimung in Vermiculite bzw. Schaumwürfeln als `substrat_inert`. Die deutsche Seite nennt 20 bis 21 °C und rund 3 Tage, die englische Anzuchtkarte 18 bis 20 °C und 4 bis 7 Tage (Widerspruch innerhalb der Quelle). Die Seite beschreibt Knollenanbau; Blattwerte gelten nur sinngemäss.
4. Cornell 2005: Teich mit Schaumstoffschalen und torfhaltigem Medium (Peatlite) als `dwc`; Keimart «dunkel» aus dem Protokoll «in the dark» (keine Aussage über Lichtbedarf). Rise Gardens sagt «don't require light» (`indifferent`) – echter Konflikt zur Keimart.
5. Mediterranean 2022: EC 1.5 bis 1.7 ohne Einheit (passt zur Gegenprobe 1.6 mS/cm, aber Einheit fehlt) – nur offen.
6. `umsetzen_ab_d` je ein Einzelwert (Spinat 9, Mangold 21, Randen 14); `umsetzen_bis_d` fehlt überall.
7. `kulturdauer_typisch_d` Mangold 77 = 21 Tage bis Umsetzen plus 56 Tage bis zum 3. Schnitt; Randen Babyleaf 31 = 14 plus 17 (je dieselbe Quelle).

## Verworfene Quellen

- Google-Docs-Leitfaden Spinat (ohne Herkunft), agrowtronics, agrifarming.in, hydrobuilder, scaleandstem, dripcanopy: Praxisseiten ohne erkennbare Quelle bzw. Blogs.
- SARE «Leafy Greens & Herbs Hydroponics for Beginners» (2022): keine artspezifischen Werte.
- HortScience 2025 (zehn Mangoldsorten in NFT, EC 1.5 bis 2.5, pH 5.5 bis 6.5): Volltext gesperrt (HTTP 403), Wert nur aus Suchtreffer – nicht erfasst.
- FAO Technical Paper 589 (Swiss chard in Anhang 1): PDF zu gross bzw. gesperrt (HTTP 403), nicht erfasst.
- Scientific Reports 2023 (LED-Versuch): Treffer betraf Salat, nicht Spinat.
- Puccinelli-Studien: Licht 12 h im Gewächshaus nur Zusatzlicht, keine Photoperiode – nicht erfasst.

## Lückenliste (Klasse D, kein Hydroponik-Wert in Form des Validators)

| Art | Phase/Kulturform | Grösse/Feld | Stand |
|---|---|---|---|
| spinacia_oleracea | keimung | dauer | nur offen (Cornell 2 Tage Einzelwert, Rise 5 bis 10 ohne typ) |
| spinacia_oleracea | keimung | keimtemp | nur offen (Cornell 25 und 26 Einzelwerte, Rise 7 bis 24 °C ohne typ, frankiesgarten 15 bis 20 ohne typ) |
| spinacia_oleracea | anzucht | dauer | nur offen (Cornell 7, Einzelwert aus zwei Protokollen) |
| spinacia_oleracea | anzucht | ph | kein Wert |
| spinacia_oleracea | anzucht | wassertemp, licht_h | kein Wert |
| spinacia_oleracea | wachstum | dauer | nur offen (Cornell 12 bis 14 ohne typ) |
| spinacia_oleracea | wachstum | ec | nur offen (OSU und Rise 1.8 bis 2.3 über 2.0; Cornell 1200 und 1300 µS/cm Einzelwerte; Mediterranean ohne Einheit) |
| spinacia_oleracea | keimung | licht_h, wassertemp | kein Wert |
| spinacia_oleracea | art | standard_keimfaehigkeit, samentyp, schossen_handlung, umsetzen_bis_d | kein Hydroponik-Beleg |
| spinacia_oleracea | babyleaf | ernteart | kein ausdrücklicher Beleg (Rise nennt Ernte nach 3 bis 4 Wochen nur als Bereich) |
| spinacia_oleracea | kopf | ernteart | kein ausdrücklicher Beleg |
| spinacia_oleracea | schnitt | ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d | kein Einzelwert (Rise: alle 7 bis 10 Tage, nur Bereich) |
| beta_vulgaris_cicla | art | name_de | GBIF führt keinen deutschen Volksnamen (nur «mangold» schwedisch) |
| beta_vulgaris_cicla | art | samentyp, keimlinge_je_knaeuel, standard_keimfaehigkeit, pythium, schossen_handlung, photoperiode, kulturformen_erlaubt, umsetzen_bis_d | kein Hydroponik-Beleg (kulturformen_erlaubt: keine Quelle belegt schnitt und babyleaf zusammen) |
| beta_vulgaris_cicla | keimung | dauer, keimtemp | nur offen (Studie 5 Tage bei 25 °C Einzelwerte; frankiesgarten 15 bis 20 ohne typ) |
| beta_vulgaris_cicla | anzucht | dauer | nur offen (16, Einzelwert) |
| beta_vulgaris_cicla | anzucht | ph, ec | kein Wert |
| beta_vulgaris_cicla | wachstum | dauer | nur offen (56, Einzelwert) |
| beta_vulgaris_cicla | wachstum | ec | nur offen (3.10 dS/m Einzelwert, über 2.0) |
| beta_vulgaris_cicla | alle | licht_h, wassertemp | kein Wert |
| beta_vulgaris_cicla | babyleaf | ernte_ab_d, ernteart, kulturdauer_typisch_d; Saatempfehlung | kein Beleg |
| beta_vulgaris_cicla | schnitt | Saatempfehlung | Studie nennt keine Samen je Stopfen |
| beta_vulgaris_conditiva | art | name_de | GBIF führt keinen Volksnamen |
| beta_vulgaris_conditiva | art | keimlinge_je_knaeuel | nur Bereich «2 bis 4» (frankiesgarten), Feld verlangt eine Zahl |
| beta_vulgaris_conditiva | art | standard_keimfaehigkeit, pythium, schossen_handlung, photoperiode, kulturformen_erlaubt, umsetzen_bis_d | kein Hydroponik-Beleg (kulturformen_erlaubt: babyleaf aus der Studie, schnitt nur aus frankiesgarten, keine gemeinsame Quelle) |
| beta_vulgaris_conditiva | keimung | dauer, keimtemp | nur offen (frankiesgarten 3 Tage und 20 bis 21 °C; Studie 4 Tage bei 25 °C; Tabelle 15 bis 20 °C) |
| beta_vulgaris_conditiva | anzucht | dauer | nur offen (10, Einzelwert) |
| beta_vulgaris_conditiva | wachstum | dauer | nur offen (17, Einzelwert) |
| beta_vulgaris_conditiva | wachstum | ec | nur offen (2.4 Einzelwert; frankiesgarten 1.8 Einzelwert und 1.8 bis 2.2 über 2.0) |
| beta_vulgaris_conditiva | alle | licht_h, wassertemp | kein Wert |
| beta_vulgaris_conditiva | babyleaf | ernteart; Saatempfehlung | Studie nennt keine Samen je Würfel |
| beta_vulgaris_conditiva | schnitt | ernte_ab_d, kulturdauer_typisch_d, ernteintervall_d, schnitte_max; Saatempfehlung | nur offen (frankiesgarten: 1 Pflanze stehen lassen, Samenzahl fehlt) |
| spinacia_oleracea | schnitt | Saatempfehlung | kein Beleg |

## Runde 3 (12.11.2026, gezielte Pflichtlücken)

### Suchweg

- Mangold: «hydroponic swiss chard EC pH seedlings transplant»; Rise Gardens Plant Library (Bright Lights, `?p=972`); Salve Regina «Bright Lights Swiss Chard Hydroponic Grow Guide» (PDF HTTP 403); Iowa State Thesis zu EC bei Spezialblattgemüse (Repositorium HTTP 403) und Fachartikel desselben Autors in Produce Grower 2021; HortScience 60(6) S. 967 Swiss-chard-Sorten (HTTP 403); UF/IFAS HS1279 (keine Werte); Cornell GPN 2016 erneut als Text gelesen (Kopfsalat-Methode laut Quelle für Swiss chard übertragbar).
- Spinat: UGA Extension C1304 (DWC, Gewächshaus); Cornell-Schlussbericht 2005 nach Anzucht-pH durchsucht (nur Keimversuch pH 4 bis 8, kein Sollwert); Rise Gardens «Nutrient Solution EC Levels for Different Plants» (Zeile Spinach & Kale, Gesamt-EC); Rise Plant Library Spinach Seaside; HortScience 56(6) S. 687 (HTTP 403).
- Randen: frankiesgarten.de Rote-Bete-Seite erneut (Anzuchtkarte), FAQ (keine artbezogenen Angaben), Mangold-Seite (HTTP 404); Rise Plant Library Beet Touchstone Gold; Suche «hydroponic beet greens baby leaf Bull's Blood».
- MDPI-Studien (horticulturae-mangold-meerwasser-2022, agriculture-randen-babyleaf-2025) nach Auftrag nicht erneut verwendet.

### Neue Kandidaten

- profilwert (Form erfüllt): Spinat wachstum.ec#6 1.4 bis 2.0 mS/cm gesamt (Rise, B2; System nicht genannt, daher `keine`/`andere`); Randen anzucht.ec#2 0.8 bis 1.2 mS/cm gesamt (frankiesgarten, C, ersetzt den wegen `ec_basis` verworfenen #1); Randen anzucht.wechselmerkmal#2 «zwei Blattpaare» (Rise, B2).
- profilwert_offen: Spinat anzucht.dauer#2 (2 bis 3 Wochen ab Saat, UGA), wachstum.dauer#2 bis #4 (UGA 3 bis 4 Wochen, Cornell GPN 10 bis 14 Tage, Rise Tag 32 ab Saat); Mangold keimung.dauer#2 (Rise 0 bis 7), anzucht.dauer#2 (GPN etwa Tag 11 ab Saat, Kopfsalat übertragen), wachstum.dauer#2 und #3 (GPN 24 Tage, Rise Tag 39 ab Saat), wachstum.ec#2 bis #4 (Produce Grower 2.0 Einzelwert und 0.5 bis 2.0 zu breit, GPN 1.5 «mhos/cm2»); Randen anzucht.ec#3 (0.5 Keimling), wachstum.ec#4 (1.8 Tower, gesamt), wachstum.dauer#2 (8 bis 10 Wochen, Knolle).
- art: kulturformen_erlaubt Mangold `schnitt` (Rise, mehrfache Ernte der äusseren Blätter) und Randen `schnitt` (frankiesgarten, laufende Blattentnahme); babyleaf für beide ohne Hydroponik-Beleg.
- saatempfehlung_offen: Mangold schnitt#1 (Rise, 1 Pflanze stehen lassen, Samenzahl fehlt), schnitt#2 (Produce Grower, 1 Samen je Zelle, Kulturform nicht zugeordnet).

### Verworfen

- library.risegardens.com: Suchseite enthält zahlreiche Spam-Seiten (Casino); die Pflanzenseiten selbst wirken echt, Quellenprüfer bitte Seitenstand prüfen.
- Gardyn «How to Grow Swiss Chard Indoors»: belegt Jungblatt- und Schnitternte, Methode aber nicht ausdrücklich hydroponisch (Pflanzabstand 6 Zoll, «whether you're using a hydroponic system or starting from scratch»).
- truleaf.org, hydromakers.com, growai.shop, dripcanopy, scaleandstem.pages.dev, seechuragro.com, krishijagran.com: keine erkennbare Quelle oder Versuch.
- SARE «Leafy Greens & Herbs Hydroponics for Beginners», Hort Americas «Organic Hydroponic Leafy Greens»: keine Angaben zu Spinat, Mangold oder Randen.
- Johnny's Seeds Bull's Blood (Microgreen-Saatgut): Katalog, keine Hydroponik-Sollwerte.

### Lückenliste nach Runde 3 (Klasse D bzw. nur offen)

| Art | Phase/Feld | Stand |
|---|---|---|
| spinacia_oleracea | anzucht.dauer | nur offen (Cornell 7, UGA 2 bis 3 Wochen ab Saat) |
| spinacia_oleracea | wachstum.dauer | nur offen (Cornell 12 bis 14, GPN 10 bis 14, UGA 3 bis 4 Wochen, Rise Tag 32) |
| spinacia_oleracea | anzucht.ph | kein Wert (D) |
| spinacia_oleracea | wachstum.ec | neu ladbar: Rise 1.4 bis 2.0 mS/cm gesamt (#6) |
| beta_vulgaris_cicla | keimung.dauer, anzucht.dauer, wachstum.dauer | nur offen |
| beta_vulgaris_cicla | anzucht.ph, anzucht.ec | kein Wert (D) |
| beta_vulgaris_cicla | wachstum.ec | nur offen (3.10, 2.0, 0.5 bis 2.0, 1.5) |
| beta_vulgaris_cicla | kulturformen_erlaubt | nur `schnitt` belegt; babyleaf D |
| beta_vulgaris_cicla | Saatempfehlung schnitt, babyleaf | schnitt nur offen; babyleaf D |
| beta_vulgaris_conditiva | anzucht.dauer, wachstum.dauer | nur offen |
| beta_vulgaris_conditiva | anzucht.ec | neu ladbar: frankiesgarten 0.8 bis 1.2 mS/cm gesamt (#2) |
| beta_vulgaris_conditiva | wachstum.ec | nur offen (2.4, 1.8 gesamt) |
| beta_vulgaris_conditiva | anzucht.wechselmerkmal | neuer Kandidat Rise (#2) |
| beta_vulgaris_conditiva | kulturformen_erlaubt | nur `schnitt` belegt; babyleaf nur aus MDPI-Studie |
| beta_vulgaris_conditiva | Saatempfehlung babyleaf, schnitt | D |

## Runde 6 (12.11.2026, letzte Pflichtlücken)

### Suchweg

- Mangold: «hydroponic swiss chard seedlings transplant days rockwool pH EC»; Lettuce Grow «Bright Lights Swiss Chard» (HTTP 429); Tower Garden «Growing a top superfood: Swiss chard» (HTTP 403); AeroGarden-FAQ (keine Artangaben); «Swiss chard … were transplanted … days after sowing»; ASHS-Kongressabstract 2010 Paper 3740 (NFT, Steinwolle, «two-week old seedlings»; Server HTTP 503, daher nicht wörtlich geprüft); HortScience 60(6) S. 967 (erneut HTTP 403); Journal of Horticultural Research 27(1) 2019 (Volltext gelesen); Cornell GPN 2016 erneut auf Anzucht-Lösung geprüft; CAFRE «Hydroponic production of leafy salads and herbs», Appendix 2 (S. 34 bis 35).
- Randen: «beet/beetroot leaves hydroponic floating transplanted days after sowing» (nur die gesperrte MDPI-Studie agriculture-randen-babyleaf-2025).
- Spinat: UGA C1304 erneut (kein pH); Rise-Spinat-Leitfaden (pH für die ganze Kultur); OSU HLA-6722 Table 2 erneut.

### Neue Kandidaten

- profilwert: Mangold anzucht.ph#1 5.5 bis 6.0 (Cornell GPN, Düngerabsatz gilt laut Sämlingsabsatz ab Tag 0, B1); Spinat anzucht.ph#1 6.0/6.5/7.0 (Rise, Angabe für die ganze Kultur, B2).
- profilwert_offen: Mangold anzucht.ec#1 (GPN «about 1.5 mhos/cm2», Einzelwert), anzucht.dauer#3 (JOHR 2019: Saat 2.2.2017 in Steinwollwürfeln, Umsetzen 6.3.2017 bei zwei Laubblättern; Datumsangaben ab Saat, nicht umgerechnet), wachstum.dauer#4 (JOHR 2019: «harvested 30 days after transplanting», Einzelwert, Versuchsende).
- quelle: johr-ph-modifier-blattgemuese-2019 (Klasse A, Ebbe-Flut, Gewächshaus).
- Nicht beauftragt, nur Hinweis: JOHR 2019 nennt für die Ebbe-Flut-Phase pH 5.5 bis 6.5 und EC 1.5 bis 2.5 ds·m-1 (Mangold wachstum.ph bzw. wachstum.ec); nicht angelegt.

### Verworfen

- CAFRE Appendix 2 (EC, pH, Kulturzeit in Wochen für Chard): Balkendiagramm ohne Zahlen im Text; Werte nur ablesbar, nicht wörtlich zitierbar.
- OSU HLA-6722 Table 2 für Spinat anzucht.ph: Textebene zeigt «5.5 to 6.0», die Quellenprüfung las in der Bildansicht «6.0 to 7.0» (Spalten verschoben); ohne eindeutige Stelle kein Kandidat.
- ASHS 2010 Paper 3740: Server nicht erreichbar, Wortlaut nicht prüfbar. Tower Garden, Lettuce Grow: Abruf gesperrt. scaleandstem.pages.dev, krishijagran.com, hydrogreenspace.pages.dev: ohne erkennbare Quelle.
- Ernteangaben 45 bis 60 Tage (Scotts, Tower Garden in Suchauszügen): ab Saat bzw. Erde, nicht verwendbar.

### Lückenliste nach Runde 6

| Art | Feld | Stand |
|---|---|---|
| beta_vulgaris_cicla | anzucht.dauer, wachstum.dauer | nur offen (neu JOHR 2019) |
| beta_vulgaris_cicla | anzucht.ph | neu ladbar: Cornell GPN 5.5 bis 6.0 (#1) |
| beta_vulgaris_cicla | anzucht.ec | nur offen (GPN 1.5 Einzelwert) |
| beta_vulgaris_conditiva | anzucht.dauer, wachstum.dauer (Blatt) | kein neuer Hydroponik-Wert (D bzw. nur offen) |
| spinacia_oleracea | anzucht.ph | neu ladbar: Rise 6.0/6.5/7.0 (#1, Angabe für die ganze Kultur) |
