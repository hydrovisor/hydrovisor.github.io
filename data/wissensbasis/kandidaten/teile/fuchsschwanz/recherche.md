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

## Runde 7 (12.11.2026): Mangold anzucht.dauer, anzucht.ph, anzucht.ec; Randen anzucht.dauer, wachstum.dauer

### Suchweg

- frankiesgarten.de: Sitemap und Übersicht `anleitungen/gemueseanbau/` (keine Mangold-Seite); Rote-Bete-Seite erneut auf Umsetztag geprüft (nur Keimung «ca. 3 Tage» in Vermiculite und Kulturdauer 8 bis 10 Wochen, kein Umsetztag).
- Fork Farms Help Center (`plant-guides`, `seed-varieties`, geratene Pfade `swiss-chard`, `beets` u. a. mit HTTP 404): keine Mangold- oder Randen-Seite.
- Europe PMC (Open Access, Swiss chard/Beta vulgaris mit hydroponic/floating/NFT und rockwool/germination; beetroot/red beet mit hydroponic): PMC13230853 (Sci Rep 2026, Mangold), PMC12757539, PMC9605945, PMC10486669 gelesen.
- Websuche «red beet baby leaf floating … days after transplanting» (Treffer Horticultura Brasileira 2014 über SciELO, Volltext gelesen); «acelga hidropônica espuma fenólica … dias após semeadura»; «Swiss chard … phenolic foam/oasis … days after sowing».

### Neue Kandidaten (alle in `profilwert_offen.csv`)

| Kandidat | Wert | Quelle | Grund |
|---|---|---|---|
| pw.beta_vulgaris_cicla.anzucht.dauer#4 | 10 Tage ab gekeimtem Sämling in Steinwollwürfel 2.5 cm bis Umsetzen in Ebbe-Flut | scirep-mangold-zno-2026 (A, Klimakammer HPS, `andere`) | Einzelwert |
| pw.beta_vulgaris_cicla.anzucht.ph#2 | 6.0 | dieselbe | Einzelwert; Satz nennt «the nutrient solution» nach der Ebbe-Flut-Phase, Sämlinge mit «hydroponic solution» gegossen, Geltung für die Anzucht nicht ausdrücklich |
| pw.beta_vulgaris_cicla.anzucht.ec#2 | 1.4 mS/cm, Basis unbekannt | dieselbe | wie pH |
| pw.beta_vulgaris_conditiva.wachstum.dauer#3 | 21 Tage (Tage ab Saat 30 Ernte minus 9 Umsetzen in NFT-Kanäle, beide Zahlen aus derselben Quelle) | hortbras-randen-babyleaf-nft-2014 (A, NFT, Gewächshaus, Babyleaf) | Einzelwert |

Neue Quellen: scirep-mangold-zno-2026 (peer_review, ebbe_flut), hortbras-randen-babyleaf-nft-2014 (peer_review, nft).

Hinweise, nicht beauftragt: Sci Rep 2026 nennt für Mangold 14 Tage Ebbe-Flut bis Babyleaf plus 5 Tage bis Ernte und 18 h Licht (HPS). Horticultura Brasileira 2014 nennt «Four glomeruli for table beet» je Zelle (288er-Schale, Kokosfaser, 5 mL) und als Umsetzmerkmal «when the seedlings started issuing the first true leaf».

### Verworfen

| Quelle | Grund |
|---|---|
| Horticultura Brasileira 32(4) 2014 für Randen anzucht.dauer | Anzucht in Kokosfaser ohne Nährlösung («The seedling fertilization was not done»), also nicht hydroponisch; zudem 9 Tage ab Saat ohne Keimdauer |
| Campo Digit@l 11(1) 2016 (Sorten 'Cultivada', 'Donatella', 'Folha Larga', 'Selecta') | Rucola, nicht Mangold |
| sciforum.net Paper 28265 (Konferenzbeitrag, Mangold in Steinwolle, «seven days after sowing») | HTTP 403, Wortlaut nicht prüfbar; Saat in Vermiculite, Umsetzen ab Saat ohne Keimdauer |
| ASHS 2010 Paper 3740 und 2012 Paper 9829 (Lincoln University, Mangold NFT) | Server HTTP 503; nur «two-week old seedlings» ab Saat |
| NZ J Crop Hortic Sci 2016 (Mikrogrün Mangold, Floating) | Mikrogrün, keine Anzucht im Sinn der Phasen |
| PMC10486669 (Foods 2023, Landsorten Babyleaf) | Topfkultur, nicht hydroponisch |
| PMC12757539, PMC9605945 | keine Mangold- bzw. Randen-Dauern oder Anzuchtwerte |
| Fork Farms, frankiesgarten.de | keine Mangold-Seite; Rote-Bete-Seite ohne Umsetztag |

### Lückenliste nach Runde 7

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| beta_vulgaris_cicla | anzucht | dauer | Entwurf #1 (Runde 6) in Prüfung; neu nur offen #4 (10 Tage, Einzelwert) |
| beta_vulgaris_cicla | anzucht | ph | nur offen #2 (6.0, Einzelwert); kein Band mit ausdrücklicher Geltung für die Anzucht (D) |
| beta_vulgaris_cicla | anzucht | ec | nur offen #1, #2 (Einzelwerte); D für ein Band |
| beta_vulgaris_conditiva | anzucht | dauer | Entwurf #1 (Runde 6) in Prüfung; keine weitere Hydroponik-Quelle mit Keimdauer und Umsetztag (D) |
| beta_vulgaris_conditiva | wachstum | dauer | Entwurf #1 (Runde 6) in Prüfung; neu nur offen #3 (21 Tage, Einzelwert) |

## Runde 8 (13.11.2026): Anzucht-pH und -EC Mangold

### Suchweg

- Websuche englisch: «Swiss chard seedlings rockwool nutrient solution EC transplanting half-strength», «Swiss chard hydroponic seedlings nutrient solution EC pH nursery until transplanting floating», «hydroponic Swiss chard guide seedling stage EC extension», «chard seedlings half-strength Hoagland … hydroponic», «Swiss chard hydroponic grow guide seedlings EC … Freight Farms/Upstart/Fork Farms/Tower Garden», «"Swiss chard" "seedlings were" "nutrient solution" "EC of" transplanted».
- Websuche spanisch und portugiesisch: «acelga … hidropónico plántulas semillero solución nutritiva conductividad eléctrica pH trasplante», «Chapingo huerto hidropónico acelga … plántulas charolas», «acelga … hidroponia mudas espuma fenólica solução nutritiva condutividade elétrica berçário».
- Europe PMC (Open Access): Swiss chard/cicla mit hydroponic/floating/NFT und seedlings bzw. «electrical conductivity»; Volltexte PMC8465728, PMC9605674, PMC12687340, PMC7688993, PMC12610718, PMC12397901, PMC9855646, PMC9657353 nach Sämlingswerten durchsucht.
- frankiesgarten.de: alle deutschen URLs aus `post-sitemap.xml` und `page-sitemap.xml` (157 Einträge) nach «Mangold» durchsucht; Treffer mit Anzuchtwert auf `/hydroponik-ec-wert/` (Tabelle mit Stufen Anzucht, Jungpflanze, Wachstum, Ernte) und gleichlautend `/pflanzen/`. Seiten `/hydroponik/ec-wert/`, `/hydroponik/ph-wert/`, `/hydroponik/anzucht/` nennen Mangold nicht.
- Rise Gardens EC-Leitfaden und Plant Library Mangold erneut: kein Sämlingswert für Mangold (Sämlingswert nur für Salat).

### Neue Kandidaten

| Kandidat | Datei | Wert | Quelle | Grund (offen) |
|---|---|---|---|---|
| pw.beta_vulgaris_cicla.anzucht.ph#3 | profilwert | 5.5 bis 6.5 | frankiesgarten-ec-wert-tabelle (C, Würfel in Anzuchtbox, `substrat_inert`) | – |
| pw.beta_vulgaris_cicla.anzucht.ec#3 | offen | 0.6 mS/cm gesamt, Stufe «Anzucht» (erste Blätter, Anzuchtbox) | frankiesgarten-ec-wert-tabelle (C) | Einzelwert |
| pw.beta_vulgaris_cicla.anzucht.ec#4 | offen | 1.2 mS/cm gesamt, Stufe «Jungpflanze» (bis Umzug in den Tower) | frankiesgarten-ec-wert-tabelle (C) | Einzelwert; Geltung vor dem Umsetzen nicht eindeutig |
| pw.beta_vulgaris_cicla.anzucht.ec#5 | offen | 0.68 mS/cm, Lösung 0.25-fach für die Sämlinge zehn Tage vor dem Umsetzen in Floating-Platten | plants-mangold-durchfluss-2021 (A, Indoor LED) | Einzelwert |
| pw.beta_vulgaris_cicla.anzucht.ph#4 | offen | 6.5, gleiche Lösung | plants-mangold-durchfluss-2021 (A) | Einzelwert |

Neue Quellen: frankiesgarten-ec-wert-tabelle (praxis, Seite «Der EC-Wert von Pflanzen in der Hydroponik», Stand 11.11.2026), plants-mangold-durchfluss-2021 (peer_review, Plants 10(9) 1840, doi:10.3390/plants10091840).

Zuordnungen zur Prüfung:

- ph#3: Die Tabelle hat eine einzige pH-Spalte je Pflanze; in derselben Zeile stehen die EC-Werte der Stufen Anzucht bis Ernte. Die Geltung für die Anzucht folgt aus dieser Zeile, nicht aus einem eigenen Satz (wie Rise Spinat anzucht.ph#1, Angabe für die ganze Kultur). Die Seite `/hydroponik/ph-und-ec-werte/` nennt für Mangold abweichend pH 6,0 bis 6,5 mit EC 1,8 bis 2,3 ohne Stufe; nicht angelegt, weil sie die Anzucht nicht nennt.
- ec#3 und ec#4: zwei Stufen derselben Tabelle vor bzw. bis zum Umsetzen; nach der Grundregel nicht zu einem Band zusammengelegt (bei Randen hat der Lead in Runde 7 aus Keimling und Jungpflanze ein Band gebildet, Entscheid des Lead). Basis `gesamt` laut Seite («Der EC gilt immer für die fertige Nährlösung, also für dein Wasser und den Dünger zusammen.»).
- ec#5 und ph#4: Die Sämlinge stehen nach dem Auflaufen in Vermiculit ab den ersten Laubblättern zehn Tage in stehender Lösung (Belüftung nicht genannt, als `dwc` erfasst), danach Umsetzen in Floating-Platten mit 0.5-facher Lösung (pH 6.5, EC 1.26, nicht beauftragt). Basis `gesamt`, weil die Quelle den Leitungswasser-EC 0.07 getrennt nennt und 0.68 der fertigen Lösung zuschreibt.

### Verworfen

| Quelle | Grund |
|---|---|
| Turkish J Agric Food Sci Technol 7(6) 2019 (Mangold, Salzbewässerung) | Sämlinge vom Produzenten, Kultur in Säcken mit Gewächshauserde |
| UNAM-Tesis «Cultivo hidropónico en mangas verticales de dos variedades de acelga y lechuga» | Anzucht in Flusssand mit Wasser ohne Nährlösung; pH und EC (Einheit «µS/m-2») nur für die Mangas nach dem Umsetzen |
| Agro Productividad (Chapingo, Huerto hidropónico) | Anzucht in Torf-Perlit-Schalen ohne Angabe einer Anzuchtlösung |
| HortScience 60(6) S. 967 (2025) | Volltext erneut HTTP 403; Sämlinge auf Sprühnebelbank, pH 5.5 bis 6.5 und EC 1.5 bis 2.5 laut Suchtreffer für die NFT-Phase |
| KidsGardening «Starting Seeds for Hydroponics» | nennt Mangoldsamen und halbe Düngerstärke, aber keinen pH- oder EC-Wert |
| Agronomy 14 2704 (2024), Scientific Papers USAMV 2022 | Grünkohl/Kohl bzw. Salat, nicht Mangold |
| Europe PMC PMC9605674, PMC12687340, PMC7688993, PMC12610718, PMC12397901, PMC9855646, PMC9657353 | Erde, andere Arten oder kein Sämlingswert für Mangold |
| scaleandstem, dripcanopy, hydrogreenspace, growguru, scribd-Tabelle | Praxisseiten ohne erkennbare Quelle bzw. Blogs |
| Eden Green Ratgeber Rainbow Chard, Johnny's Tech Sheet | HTTP 404 bzw. kein Inhalt abrufbar |

### Lückenliste nach Runde 8

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| beta_vulgaris_cicla | anzucht | ph | neu Entwurf #3 (5.5 bis 6.5, C, Form erfüllt); offen #2, #4 (Einzelwerte 6.0, 6.5) |
| beta_vulgaris_cicla | anzucht | ec | weiter kein Band (D); offen #1, #2 sowie neu #3 (0.6), #4 (1.2), #5 (0.68), alle Einzelwerte |

## Runde 11 (#242)

Auftrag: `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` für Spinat (schnitt; babyleaf und kopf nur `kulturdauer_max_d`), Randen (schnitt) und Mangold (schnitt). Abruf 18.11.2026.

### Suchweg

- Bestehende Quellen erneut gelesen: Cornell CEA Spinat 2005 (Kapitel 3), Horticulturae 2022 Mangold, Rise Gardens Plant Library (Swiss Chard Bright Lights, Spinach Seaside, Beet Touchstone Gold), frankiesgarten Rote Bete, VT SPES-466 (Spinat, Table 1).
- Websuche: «spinach hydroponic regrowth second harvest cut days floating raft», «Swiss chard hydroponic multiple harvests days after transplanting», «beet leaves hydroponic repeated harvest cuts».
- Neu: Agriculture 11(5) 465 (2021), Spinat und Rauke als Babyleaf im Floating-System mit fünf Schnitten (`agriculture-spinat-rauke-floating-2021`, peer_review, dwc; PDF über mdpi-res.com, die HTML-Seite antwortet mit HTTP 403).

### Neue Kandidaten (art.csv)

| zeile_id | Kandidat | Wert | Quelle |
|---|---|---|---|
| ak.spinacia_oleracea.schnitt.ernteintervall_d | #1 | 1 Woche («approximately one-week intervals») | cornell-cea-spinat-2005 (B1) |
| ak.spinacia_oleracea.schnitt.schnitte_max | #2 | 3 (erste, zweite, dritte Ernte) | cornell-cea-spinat-2005 (B1) |
| ak.spinacia_oleracea.schnitt.schnitte_max | #3 | 5 | agriculture-spinat-rauke-floating-2021 (A) |
| ak.spinacia_oleracea.schnitt.kulturdauer_max_d | #1 | 96 (46 + 22 + 10 + 10 + 8) | agriculture-spinat-rauke-floating-2021 (A) |
| ak.spinacia_oleracea.babyleaf.kulturdauer_max_d | #1 | 46 (längster Kontrollzyklus; 46, 43, 28 Tage ab Saat) | agriculture-spinat-rauke-floating-2021 (A) |
| ak.beta_vulgaris_cicla.schnitt.kulturdauer_max_d | #1 | 77 (21 + 56, Versuchsende nach dem 3. Schnitt) | horticulturae-mangold-meerwasser-2022 (A) |

Hinweise für den Lead: Cornell S. 3-2 ist die Stelle, die der Methodenprüfer bei `schnitte_max#1` (Wert 2, verworfen) angeführt hat; #2 stützt sich darauf. In der Agriculture-Studie betragen die Abstände zwischen den Schnitten 22, 10, 10 und 8 Tage (kein Einzelwert für `ernteintervall_d`, nicht erfasst; Text: «only 8 to 10 more days for the third, fourth, and fifth cuts»). Babyleaf 46 ist die Auswahl des längsten von drei gemessenen Zyklen, kein Mittel. Die Studie lief im Winter (Januar bis März, Gewächshaus mit Tageslicht, Wassertemperatur 6 bis 15 °C), die Zyklen sind daher eher lang.

### Verworfen oder ohne Zahl

- Rise Gardens Swiss Chard: «ready to remove when you have gotten 5-10 harvests» (Bereich ohne Einzelwert, nicht erfasst; Kandidat für Mangold `schnitte_max` nur, wenn der Lead die Obergrenze 10 annimmt).
- Rise Gardens Spinat-Blog: «Cutting outer leaves every 7 to 10 days» (Bereich, wie Runde 2). Spinach Seaside und Beet Touchstone Gold: «can only be harvested once».
- VT SPES-466: Spinat «Harvest 42 d» als einmaliger Schnitt auf Packungsgrösse; Kulturform (babyleaf oder kopf) nicht eindeutig, nicht erfasst.
- frankiesgarten Rote Bete: «etwa 8 bis 10 Wochen» gilt für die Knolle (Baby-Bete); Blätter «laufend», keine Zahl für die Blatternte.
- HortScience 60(6) 967 (Mangold-Sorten in NFT): Download liefert HTML statt PDF, nicht gelesen.

### Lückenliste Runde 11 (Klasse D)

| Art | Kulturform | Feld | Stand, was Anbauquellen sagen |
|---|---|---|---|
| spinacia_oleracea | kopf | kulturdauer_max_d | kein Hydroponik-Wert für das Kulturende; vorhanden nur `kulturdauer_typisch_d` 64 (MedAgrSci 2022). UGA C1304 (DWC, B1) nennt nur Bereiche in Wochen: «seedlings needed 2–3 weeks after sowing before transplanting into the DWC system», «The crop was harvested after 3–4 weeks» (also 5 bis 7 Wochen ab Saat, nicht erfasst, Bereich ohne Einzelwert; [UGA C1304](https://fieldreport.caes.uga.edu/publications/C1304/how-to-grow-greenhouse-spinach-during-georgia-summers-using-hydroponics/)). |
| beta_vulgaris_conditiva | schnitt | ernteintervall_d, schnitte_max, kulturdauer_max_d | kein Hydroponik-Wert; frankiesgarten nur «laufend ernten», Rise Gardens nur einmalige Ernte der Knolle; Knollenernte nach 8 bis 10 Wochen ([frankiesgarten Rote Bete](https://frankiesgarten.de/anleitungen/gemueseanbau/rote-bete-hydroponik/)). |
| beta_vulgaris_cicla | schnitt | ernteintervall_d, schnitte_max | nur die Horticulturae-Kandidaten (14 Tage, 3 Schnitte, Versuchsende); weitere Quelle nur Bereich «5-10 harvests» (Rise Gardens). |

## Runde 12 (#250)

Auftrag: Vorrang `ernte_ab_d` und `kulturdauer_max_d`; Spinat (schnitt: `ernte_ab_d`, `kulturdauer_max_d`; babyleaf, kopf: `kulturdauer_max_d`), Randen und Mangold (schnitt: `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`). Abruf 19.11.2026.

### Suchweg

- Bestehende Quellen erneut gelesen: Agriculture 11(5) 465 und Horticulturae 8(7) 638 als PDF über mdpi-res.com (beide HTTP 200, frei abrufbar), Cornell CEA Spinat 2005 (S. 3-1/3-2, Ratooning-Abschnitt), Agriculture 15 1914 (Randen) als PDF über mdpi-res.com, Rise Gardens Plant Library (Swiss Chard Bright Lights, Spinach Seaside, Beet Touchstone Gold), Rise Gardens Spinat-Blog, Horticultura Brasileira 32(4) 426 (SciELO), Plants 10(9) 1840 (PMC8465728), VT SPES-463 und SPES-466.
- Websuche: «Swiss chard hydroponic first harvest days after transplanting», «beet greens hydroponic repeated cuts», «spinach hydroponic first harvest days after transplanting regrowth», «acelga hidroponia cortes sucessivos», «beterraba hidropônica folhas colheita dias após o transplante».
- Europe PMC (nur Open Access): Mangold, Randen und Spinat mit Hydroponik und Ernte bzw. Schnitt.
- frankiesgarten.de Sitemap: nur Rote Bete, keine Seite zu Spinat oder Mangold.

### Neue Kandidaten (art.csv)

| Kandidat | Wert | Quelle | Hinweis |
|---|---|---|---|
| ak.spinacia_oleracea.schnitt.ernte_ab_d#1 | 34 (Tage im Floating-System bis zum 1. Schnitt) | agriculture-spinat-rauke-floating-2021 (A) | 46 Tage ab Saat laut Tabelle 1; Umsetzen der Anzuchtplatten in das Becken beim ersten Laubblatt |
| ak.spinacia_oleracea.babyleaf.kulturdauer_max_d#2 | 46 | agriculture-spinat-rauke-floating-2021 (A) | wie #1 (Methode zugelassen, Quelle nicht erreichbar); jetzt mit freiem PDF-Weg in `fundstelle` |
| ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#2 | 28 | horticulturae-mangold-meerwasser-2022 (A) | wie #1 (Methode zugelassen), wörtlicher Satz aus 2.2 S. 4, freier PDF-Weg |
| ak.beta_vulgaris_cicla.schnitt.ernteintervall_d#2 | 14 | horticulturae-mangold-meerwasser-2022 (A) | wie #1, gleicher Satz |
| ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#3 | 39 (ab Saat, Umsetztag nicht genannt) | risegardens-library-mangold (B2) | Indoor-System mit LED; Umrechnung durch den Lead |
| ak.beta_vulgaris_conditiva.schnitt.ernte_ab_d#1 | 21 (30 DAS minus Umsetzen 9 DAS) | hortbras-randen-babyleaf-nft-2014 (A) | NFT, Gewächshaus; im Versuch einmalige Blatternte als Babyleaf bei etwa 15 cm Blattlänge; ob das als erster Schnitt der Kulturform schnitt gilt, entscheidet der Lead |

Hinweis für den Lead: In `quelle.csv` stehen für agriculture-spinat-rauke-floating-2021 und horticulturae-mangold-meerwasser-2022 DOI-Links, die auf mdpi.com (HTTP 403) führen. Bestehende Zeilen nicht geändert (Auftrag); der freie Weg steht in `fundstelle` der neuen Kandidaten:
- https://mdpi-res.com/d_attachment/agriculture/agriculture-11-00465/article_deploy/agriculture-11-00465.pdf
- https://mdpi-res.com/d_attachment/horticulturae/horticulturae-08-00638/article_deploy/horticulturae-08-00638.pdf

Keine neue Quelle; `quelle.csv` unverändert.

### Verworfen oder ohne Zahl

| Quelle | Grund |
|---|---|
| Cornell CEA Spinat 2005, S. 3-1: «First cutting is 12 to 16 days from seeding» | Bereich ohne typischen Wert (Spinat schnitt `ernte_ab_d`); Ratooning-Abschnitt ohne Tagesangabe zum Kulturende |
| Rise Gardens Spinat-Blog | nur Bereiche: «baby-leaf harvest stage in 25 to 35 days and full-size leaf harvest in 40 to 50 days from germination», «Bolt-tolerant types buy you 2 to 3 extra weeks of harvest time» |
| Rise Gardens Spinach Seaside («Ready to harvest: Day 32») | «can only be harvested once»: nicht Kulturform schnitt; babyleaf und kopf `ernte_ab_d` sind schon freigegeben |
| Rise Gardens Beet Touchstone Gold («Ready to harvest: Day 50») | Knollenernte, einmalig («Rooted plants can only be harvested once»), nicht Blattschnitt |
| Rise Gardens Swiss Chard: «5-10 harvests» | Bereich, schon in Runde 11 genannt; kein Tageswert für das Kulturende |
| Agriculture 15 1914 (Randen, 10 und 17 DAP) | Probenahmen («The plants were sampled at 10 and 17 days after planting»), keine Erntetermine; 17 DAP ist Versuchsende |
| Plants 10(9) 1840 (PMC8465728, Mangold) | «After 21 days, harvested plants were analyzed»: Versuchsende mit Ganzpflanzenernte |
| PMC12757539 (Mangold in Deep-Flow mit organischem Dünger) | nur Daten «In System» und «Harvest» (Tagesdifferenz wäre eigene Rechnung), Ganzpflanzenernte; allgemeiner Satz «Leafy greens will generally take 20–40 days until harvest» ist ein Bereich ohne Art |
| HortScience 60(6) 967 (Mangold-Sorten NFT) | Volltext erneut nur Abwehrseite (HTML 1.4 kB), nicht gelesen |
| VT SPES-463 (NFT) und SPES-466 | keine Angaben zu Mangold oder Randen; Spinat «Harvest 42 d» einmalig (Runde 11) |
| UNESP-TCC 2026 Floating (10 und 13 DATF) | Koriander, nicht Fuchsschwanzgewächs |
| scaleandstem, dripcanopy | Praxisseiten ohne erkennbare Quelle |

### Lückenliste Runde 12 (Klasse D)

| Art | Kulturform | Feld | Stand, was Anbauquellen sagen |
|---|---|---|---|
| spinacia_oleracea | schnitt | kulturdauer_max_d | kein Hydroponik-Wert für das Kulturende; Agriculture 2021 nur Versuchsende (96, verworfen); Rise Gardens nur «2 to 3 extra weeks» für schossfeste Sorten. |
| spinacia_oleracea | kopf | kulturdauer_max_d | unverändert (Runde 11): UGA C1304 nur «2–3 weeks» plus «3–4 weeks» ([UGA C1304](https://fieldreport.caes.uga.edu/publications/C1304/how-to-grow-greenhouse-spinach-during-georgia-summers-using-hydroponics/)). |
| beta_vulgaris_conditiva | schnitt | ernteintervall_d, schnitte_max, kulturdauer_max_d | kein Hydroponik-Wert; Johnny's (Erde, Babyleaf) nennt Nachschnitt nach «5–14 days» ([Johnny's Baby Leaf Beet Greens](https://www.johnnyseeds.com/growers-library/vegetables/beets/baby-leaf-beets-key-growing-information.html)), nicht als Kandidat. |
| beta_vulgaris_cicla | schnitt | schnitte_max, kulturdauer_max_d | nur Horticulturae-Versuchsplan (3 Schnitte, 77 Tage, verworfen) und Rise Gardens «5-10 harvests» (Bereich). |

## Runde 13 (#258)

Auftrag: Randen (Art `umsetzen_ab_d`/`umsetzen_bis_d`; schnitt `ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`), Mangold (Art `umsetzen_ab_d`/`umsetzen_bis_d`; schnitt `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`), Spinat (schnitt `ernte_ab_d`, `kulturdauer_max_d`; babyleaf und kopf `kulturdauer_max_d`); Lesekopien des Koordinators für Horticulturae 8(7) 638 und Agriculture 11(5) 465. Abruf 21.11.2026.

### Suchweg

- Lesekopien gelesen: `horticulturae-mangold-meerwasser-2022.md`, `agriculture-spinat-rauke-floating-2021.md`.
- Horticultura Brasileira 32(4) 426 erneut gelesen (SciELO, HTML frei über die DOI): Umsetztag Randen 9 DAS.
- Websuche: «beet hydroponic seedlings transplanted days after sowing rockwool floating NFT», «beterraba hidroponia NFT transplante dias após a semeadura espuma fenólica», «Swiss chard hydroponic deep water culture transplanted days after seeding regrowth», «Swiss chard floating system successive cuts baby leaf», «red beet baby leaf floating system», «spinach hydroponic DWC harvested days after sowing», «HortScience 60(6) 967 Swiss chard NFT».
- Europe PMC (Open Access): Randen bzw. Mangold mit hydroponic und «days after sowing».

### Kandidaten

| Kandidat | Wert | Quelle | Hinweis |
|---|---|---|---|
| art.beta_vulgaris_cicla.umsetzen_ab_d#2 | 21 (Tage ab Saat) | horticulturae-mangold-meerwasser-2022 (A, Lesekopie) | Steinwollstopfen, dann Floating; Einzelwert, daher kein `umsetzen_bis_d` |
| ak.beta_vulgaris_cicla.schnitt.ernteintervall_d#3 | 14 | horticulturae-mangold-meerwasser-2022 (A, Lesekopie) | Folgeschnitte am selben Bestand, Abschnitt 2.2.2 |
| ak.beta_vulgaris_cicla.schnitt.ernte_ab_d#5 | 28 (ab Umsetzen) | horticulturae-mangold-meerwasser-2022 (A, Lesekopie) | nicht im Vorrang, aber in der Lesekopie belegt; freigegeben ist #4 (19, Rise Gardens, ab Saat) |
| ak.spinacia_oleracea.schnitt.ernte_ab_d#2 | 34 (ab Umsetzen ins Becken; 46 ab Saat) | agriculture-spinat-rauke-floating-2021 (A, Lesekopie) | Revegetation-Becken: echter Schnitt mit Nachwuchs (nicht Babyleaf mit Ersatz); Anzucht in Torfplatten, Winter-Gewächshaus |
| ak.spinacia_oleracea.schnitt.schnitte_max#4 | 5 | agriculture-spinat-rauke-floating-2021 (A, Lesekopie) | gleicher Wert wie #3 (verworfen nur wegen Sperre); Einleitung nennt zusätzlich «four or five successive harvests»; freigegeben ist #2 (3, Cornell) |
| ak.spinacia_oleracea.babyleaf.kulturdauer_max_d#3 | 46 (ab Saat) | agriculture-spinat-rauke-floating-2021 (A, Lesekopie) | Control-Becken: einmalige Ernte, danach Ersatz; längster von drei Zyklen (46, 43, 28), kein Mittel |
| art.beta_vulgaris_conditiva.umsetzen_ab_d#2 | 9 (Tage ab Saat) | hortbras-randen-babyleaf-nft-2014 (A) | frei lesbar auf SciELO; Anzucht in Kokosfaser ohne Nährlösung, Umsetzen in NFT beim ersten Laubblatt; Einzelwert, daher kein `umsetzen_bis_d` |

Neue Quellenzeile: `q.agriculture-spinat-rauke-floating-2021` mit Status `entwurf` und Abrufdatum 21.11.2026 (Lesekopie), Link weiterhin die DOI. Sonst keine neue Quelle.

Hinweise für den Lead:
- Agriculture 11(5) 465: Aus Tabelle 1 liesse sich ein Umsetztag Spinat als Differenz ablesen (46 minus 34 = 12, 43 minus 32 = 11, 28 minus 18 = 10 Tage ab Saat); die Quelle nennt aber nur das Stadium («Upon the first true leaf formation»), daher kein Kandidat (Spinat-Umsetztag ist ohnehin freigegeben, 9).
- Agriculture 11(5) 465, Einleitung: «20 to 60 days after transplanting» ist ein allgemeiner Bereich (Schnitt «above the ground», nicht hydroponisch belegt), nicht erfasst.
- Mangold `schnitte_max` (3) und `kulturdauer_max_d` (77): Die Lesekopie enthält nur den Versuchsplan («harvested trice»), keine Aussage zur Kultur; die Methodenprüfung hat diese Werte in Runde 11 deswegen verworfen. Keine neuen Kandidaten.
- Spinat schnitt `kulturdauer_max_d`: Die Lesekopie nennt nur «in a period of seven weeks» (Versuchsdauer, in Runde 11 verworfen); kein neuer Kandidat.

### Verworfen oder ohne Zahl

| Quelle | Grund |
|---|---|
| Bioscience Journal (Randen in Kokosfaser-Töpfen mit Hoagland-Lösung; https://distantreader.org/stacks/journals/bj/bj-8092.pdf) | Umsetzen «Sete dias após a emergência (DAE)»: Tage ab Auflaufen, nicht ab Saat; Probenahmen 15 bis 65 DAT sind Versuchsplan |
| MedCrave HIJ 2019, Mangold in Sand, Sägemehl, Vermiculit | Setzlinge «Five-weeks old» gekauft und in Kompost angezogen (Anzucht nicht hydroponisch); «harvested 40 days after transplanting» nur Zitat einer Fremdquelle in der Einleitung |
| JOHR 2023 (doi:10.2478/johr-2023-0022), Mangold «floating» | Töpfe mit Ultisol und Hühnermist (Erde); Umsetzen 14 DAS und Ernten 22, 25, 28 DAT gelten nicht |
| PMC10486669 (Foods 2023, Landsorten Mangold und Spinat) | Torf bzw. Topf mit Erde, nicht hydroponisch |
| Hort. J. 85(2) MI-R01 (Floating-Babyleaf, Übersicht, J-STAGE) | Tabelle 1 mit Zyklusdauern nur als Bild; im Text keine Tageswerte für Spinat oder Mangold |
| truleaf.org Swiss Chard | Ratgeberseite 2026 ohne erkennbare Quelle, Erde und Hydroponik gemischt; nur Bereiche («45-58 days», «every 14-21 days») |
| HortScience 35(4) 624 und 56(6) 687 (Spinat NFT bzw. DWC in der Klimakammer) | nur Suchauszug: Ernte 14 DAT bzw. nach 19 bis 20 Tagen ist Versuchsende mit Ganzpflanzenernte, keine Aussage zum Kulturende (kein `kulturdauer_max_d` für kopf) |
| Agriculture 15 1914 (Randen) | MDPI nur PDF; kein anderer Server genutzt (siehe «Nur im Browser lesbar») |

### Lückenliste Runde 13 (Klasse D)

| Art | Kulturform | Feld | Stand, was Anbauquellen sagen |
|---|---|---|---|
| beta_vulgaris_conditiva | Art | umsetzen_bis_d | nur Einzelwerte 14 (Agriculture 2025, ohne Prüfung) und 9 (Hort. Bras. 2014); ein brasilianischer Artikel (Erde) nennt Umsetzen zwischen 20 und 40 Tagen nach der Saat ([UFGD Agrarian 3107](https://ojs.ufgd.edu.br/agrarian/article/download/3107/2401/14364)), nicht hydroponisch. |
| beta_vulgaris_conditiva | schnitt | ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_max_d | kein hydroponischer Mehrfachschnitt für Randen gefunden; Hort. Bras. 2014 nur einmalige Babyleaf-Ernte (30 DAS, Runde 12 verworfen); Johnny's (Erde) «cut again when leaves are at desired size (5–14 days)» ([Johnny's Baby Leaf Beet Greens](https://www.johnnyseeds.com/growers-library/vegetables/beets/baby-leaf-beets-key-growing-information.html)). |
| beta_vulgaris_cicla | Art | umsetzen_bis_d | nur Einzelwert 21 (Horticulturae 2022); Rise Gardens nennt nur das Stadium (zweites Blattpaar). |
| beta_vulgaris_cicla | schnitt | schnitte_max, kulturdauer_max_d | unverändert: nur Versuchsplan Horticulturae (3 Schnitte, 77 Tage) und Rise Gardens «5-10 harvests» (Bereich). |
| spinacia_oleracea | schnitt | kulturdauer_max_d | unverändert: nur Versuchsdauer «seven weeks» (Agriculture 2021) und Rise Gardens «2 to 3 extra weeks». |
| spinacia_oleracea | kopf | kulturdauer_max_d | unverändert: UGA C1304 nur Bereiche «2–3 weeks» plus «3–4 weeks» ([UGA C1304](https://fieldreport.caes.uga.edu/publications/C1304/how-to-grow-greenhouse-spinach-during-georgia-summers-using-hydroponics/)). |

### Nur im Browser lesbar

| Artikelseite | erwartete Fundstelle | gesuchtes Feld |
|---|---|---|
| https://www.mdpi.com/2077-0472/15/18/1914 (Agriculture 15, 1914, Randen-Babyleaf in Steinwolle und Tanks; MDPI nur PDF) | Abschnitt 2.1 Plant Material and Growing Conditions: «Transplantation into 13 L hydroponic tanks occurred on 9 October 2023 (14 days after sowing, two-leaf stage).» | `art.beta_vulgaris_conditiva.umsetzen_ab_d` (#1, Wert 14) |
| https://journals.ashs.org/view/journals/hortsci/60/6/article-p967.xml (HortScience 60(6) 967, doi:10.21273/HORTSCI18556-25, zehn Mangoldsorten in NFT, Oklahoma State; Abruf abgewehrt) | Materials and Methods: Saat, Umsetzen in NFT, Erntetermine bzw. Schnitte | `art.beta_vulgaris_cicla.umsetzen_ab_d`/`umsetzen_bis_d`, Mangold schnitt `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` (erledigt, siehe Nachtrag) |

### Nachtrag: Lesekopie HortScience 60(6) 967

- Neue Quelle `hortsci-mangold-nft-2025` (peer_review, nft, Link Artikelseite), Lesekopie des Koordinators vom 21.11.2026.
- Neuer Kandidat `art.beta_vulgaris_cicla.umsetzen_bis_d#1` = 28 Tage ab Saat (Saat 31 Oct 2023 in Oasis-Würfeln 1.5 cm3, Umsetzen in NFT 28 Nov 2023; Datumsrechnung in `fundstelle`). Als `umsetzen_bis_d` angelegt, weil der Wert später liegt als der Kandidat 21 (Horticulturae, Steinwolle) für `umsetzen_ab_d`; beides sind Einzelwerte aus je einer Quelle, den Konflikt bzw. die Zuordnung entscheidet der Lead.
- Keine Erntewerte: Die Messung «37 d after transplanting» ist eine einmalige Erhebung am Versuchsende (Ganzpflanzen getrennt in Spross und Wurzel), keine Aussage zu Schnitten oder Kulturende. Mangold schnitt `schnitte_max` und `kulturdauer_max_d` bleiben Klasse D.

## Runde 14 (#266)

Auftrag: Vorrang Spinat schnitt `ernte_ab_d` (Schnittkultur bei üblicher Wassertemperatur oder LED); dann Spinat schnitt und kopf `kulturdauer_max_d`, Randen `umsetzen_bis_d` und alle Schnitt-Felder, Mangold schnitt `schnitte_max` und `kulturdauer_max_d`. Neue Bereichsregel (untere Grenze für `ernte_ab_d`, obere für `schnitte_max` und `kulturdauer_max_d`). Abruf 22.11.2026.

### Suchweg

- Bestehende Quellen erneut gelesen: Cornell CEA Spinat 2005 (Kapitel 1 und 3; S. 3-1 jetzt mit Bereichsregel), UGA C1304 (Bereiche jetzt mit Bereichsregel), Rise Gardens Swiss Chard Bright Lights (Stage 7 «Remove plant»).
- Websuche: «spinach hydroponic successive harvests regrowth first cut days after transplanting LED», «spinach regrowth ratooning plant factory», «espinafre hidropônico cortes sucessivos rebrota», «Lettuce Grow spinach first harvest final harvest», «Gardyn spinach», «beterraba hidroponia NFT transplantio dias após a semeadura», «red beet baby leaf floating successive cuts», «hydroponic Swiss chard harvest months replace».
- Europe PMC (Open Access): Spinat mit regrowth, ratoon oder successive harvest und Hydroponik; Randen mit Hydroponik und transplant.
- Herstellerseiten: Lettuce Grow (Giant Spinach), Gardyn (Perpetual Spinach), Rise Gardens (Mangold); Hochschul-PDF CAFRE «Hydroponic production of leafy salads and herbs».

### Kandidaten

| Kandidat | Wert | Quelle | Hinweis |
|---|---|---|---|
| ak.spinacia_oleracea.schnitt.ernte_ab_d#3 | 12 (Bereich 12 bis 16 Tage ab Saat) | cornell-cea-spinat-2005 (B1) | Direktsaat in Endabstand ohne Umsetzen, Deep-flow-Teich; in Runde 12 als Bereich verworfen, jetzt nach der Bereichsregel; Folgeschnitte am selben Bestand im Folgesatz |
| ak.spinacia_oleracea.schnitt.ernte_ab_d#4 | 30 (Tage ab Saat, Direktsaat) | smgardener-spinat-kratky-2022 (C, neu) | Kratky, Saat in Kokosfaser im Netztopf direkt im Behälter (kein Umsetzen); Schnitt aller Blätter mit zwei weiteren Ernten im Abstand von 7 bis 10 Tagen; Praxisbericht mit eigenem Anbau, ohne Angaben zu Licht und Wassertemperatur |
| ak.spinacia_oleracea.schnitt.ernte_ab_d#5 | 3 (Wochen ab Umsetzen) | lettucegrow-giant-spinach (B2, neu) | Herstellerseite zum Hydroponik-Turm Farmstand; «First harvest 3 weeks», gezählt ab Lieferung des bewurzelten Setzlings («From delivery to harvest in about 3 weeks»); Harvest method «Cut and Come Again»; die Produktseite selbst nennt das Wort hydroponisch nicht (nur die Systemseite), Art nur als «Giant Spinach» |
| ak.spinacia_oleracea.kopf.kulturdauer_max_d#1 | 7 (Wochen ab Saat; obere Grenze 3 plus 4) | uga-c1304-spinat-2024 (B1) | «2–3 weeks after sowing before transplanting» plus «harvested after 3–4 weeks», DWC im Gewächshaus; Summe der beiden oberen Grenzen aus demselben Absatz, in `fundstelle` gerechnet; ob die Addition zweier Bereiche zulässig ist, entscheidet der Lead |
| art.beta_vulgaris_conditiva.umsetzen_bis_d#1 | 25 (Tage ab Saat) | actasci-randen-mudas-floating-2005 (A, neu) | Setzlinge in Styroporplatten im Floating mit Nährlösung, Umsetzen 25 DAS; danach Feldanbau (nur die Anzucht ist hydroponisch); Substrat Plantmax-HT (Rinde) bzw. Zuckerrohrbagasse; Einzelwert |
| ak.beta_vulgaris_cicla.schnitt.schnitte_max#2 | 10 (Bereich 5 bis 10 Ernten, obere Grenze) | risegardens-library-mangold (B2) | Stage 7 «Remove plant»: Kulturende nach 5 bis 10 Ernten, danach Ersatz (Aussage zur Kultur, kein Versuchsplan); in Runde 11 und 12 als Bereich nicht erfasst |

Neue Quellen: `smgardener-spinat-kratky-2022` (praxis, kratky), `lettucegrow-giant-spinach` (hersteller, nft; Farmstand ist ein vertikaler Turm mit herabrieselnder Lösung, die Aufzählung kennt kein «aeroponisch», daher nft wie der Hydro-Tower bei frankiesgarten), `actasci-randen-mudas-floating-2005` (peer_review, dwc; Redalyc-PDF frei, die Kopfzeile nennt fälschlich «Biological Sciences», die Seitenfusszeile «Acta Sci. Agron.»).

Hinweise für den Lead:
- Lettuce Grow Giant Spinach nennt auch «Final harvest 6 weeks» und «Week 6+ · replant», gezählt ab Lieferung des Setzlings (Umsetzen). Für `kulturdauer_max_d` (ab Saat) fehlt der Saattag in derselben Quelle, daher kein Kandidat; mit dem freigegebenen Umsetztag 9 könnte der Lead daraus selbst einen Wert ableiten.
- SMgardener Kratky: «two more harvests each at 7-10 day interval» stützt Spinat schnitt `ernteintervall_d` (Bereich 7 bis 10) und `schnitte_max` 3; beide Felder sind schon freigegeben und nicht im Auftrag, daher keine Kandidaten.

### Verworfen oder ohne Zahl

| Quelle | Grund |
|---|---|
| hydroponics360, agrifarming.in, hydroponicplans, dripcanopy, growwithhydroponics, farmergrows, pocketgreenguides, hightechgardening, hydronurture, edengreen, ALTO Garden (Spinat) | Ratgeberseiten ohne eigenen Anbau oder erkennbare Quelle, nur Bereiche («25 to 35 days after transplanting», «2 - 3 additional weeks») |
| SMgardener NFT-Spinat | «re grows so in a couple of days» ohne Zahl; Erntezeit nur allgemeiner Bereich «35-60 days» |
| Gardyn Perpetual Spinach (Help Center und Plant Book) | Lateinname «Beta vulgaris» (Mangold, nicht Spinat); keine Angabe zu Schnitten oder Kulturende; nennt Hydroponik nicht (wie Gardyn Schnittlauch verworfen) |
| Lettuce Grow Bright Lights Swiss Chard | Mangold `ernte_ab_d` schon freigegeben; «Final harvest» ab Lieferung, kein Saattag (siehe Hinweis oben) |
| Horticulturae 5(1) 20 (Babyspinat in DWC, Saatmuster) | einmalige Ernte, keine Folgeschnitte |
| PMC7238427 (Spinat unter LED in der Pflanzenfabrik) | Lichtversuch mit einmaliger Ernte, keine Folgeschnitte |
| CAFRE «Hydroponic production of leafy salads and herbs» | Anhang 2 «Approximate crop time (weeks)» für Mangold nur als Balkengrafik ohne Zahl im Text; kein Spinat, keine Randen |
| UNESP-Dissertation 2024 (Spinat in NFT mit *Pseudomonas*) | Probenahme 30 Tage nach dem Umsetzen als Versuchsende, einmalige Ernte |
| Revista Brasileira de Ciências Agrárias (Behandlung von Phenolschaum) | Salat, nicht Randen |
| UTFPR-Dissertation 2011 (Randen-Setzlinge in Substraten) | Anzucht in Substraten ohne Hydroponik, danach Feld |
| scaleandstem.pages.dev (Mangold «3–6 months») | Praxisseite ohne erkennbare Quelle (wie Runde 12) |

### Lückenliste Runde 14 (Klasse D)

| Art | Kulturform | Feld | Stand, was Anbauquellen sagen |
|---|---|---|---|
| spinacia_oleracea | schnitt | kulturdauer_max_d | kein Hydroponik-Wert ab Saat; Lettuce Grow nur «Week 6+ · replant» ab Lieferung des Setzlings ([Lettuce Grow Giant Spinach](https://www.lettucegrow.com/products/giant-spinach)); Rise Gardens nur «2 to 3 extra weeks» (Runde 12). |
| beta_vulgaris_conditiva | schnitt | ernteintervall_d, schnitte_max, kulturdauer_max_d (dazu weitere Quelle für ernte_ab_d) | kein frei lesbarer hydroponischer Mehrfachschnitt; eine Konferenzarbeit zu Beta vulgaris in vertikaler Hydroponik nennt laut Fachpresse «the leaves are cut about 4–6 times from each container» ([Vertical Farm Daily](https://www.verticalfarmdaily.com/article/9392362/growing-beetroot-microgreens-in-a-vertical-hydroponic-system/)), Volltext gesperrt (siehe unten); Johnny's (Erde) «5–14 days» (Runde 12). |
| beta_vulgaris_cicla | schnitt | kulturdauer_max_d | kein Hydroponik-Wert ab Saat; Rise Gardens nennt nur die Zahl der Ernten, keine Tage; scaleandstem «3–6 months» ohne Quelle. |
| beta_vulgaris_conditiva | Art | umsetzen_bis_d (weitere Quelle) | nur der neue Einzelwert 25 (Floating-Anzucht, danach Feld); Bioscience Journal zählt ab Auflaufen (Runde 13). |

### Nur im Browser lesbar

| Artikelseite | erwartete Fundstelle | gesuchtes Feld |
|---|---|---|
| https://iopscience.iop.org/article/10.1088/1755-1315/954/1/012035 (IOP Conf. Ser.: Earth Environ. Sci. 954, 012035, 2022, Omsk State Agrarian University, «Agrotechnological peculiarities of crop combination in Beta vulgaris subsp. vulgaris cultivation in vertical hydroponics»; PDF-Abruf HTTP 403) | Methods bzw. Results: Keimung «7 days», Schnitt der «Baby greens» (laut Fachpresse nach drei Wochen bzw. «3–4 months»), «the leaves are cut about 4–6 times from each container, after that a turnover is performed»; zu prüfen, ob Randen (Rote Bete) oder Mangold gemeint ist | Randen schnitt `ernte_ab_d`, `ernteintervall_d`, `schnitte_max` (obere Grenze 6), `kulturdauer_max_d` |
