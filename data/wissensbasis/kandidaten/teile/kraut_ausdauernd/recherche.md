# Recherche kraut_ausdauernd (W0-Probelauf, Issue #184)

Stand 12.11.2026 · Rechercheur kraut_ausdauernd · Arten: Petersilie (`petroselinum_crispum`, Leitkultur, Sorte glatt), Schnittlauch (`allium_schoenoprasum`, Sorte Twiggy); Kulturform `dauerkultur_blatt`, System DWC (Platz 2.2). Kein Standardprofil.

## Suchweg (Stichworte)

- Websuche: «parsley hydroponic EC pH DWC», «chives Allium schoenoprasum hydroponic EC pH», «nutrient solution pH basil dill parsley sage», «hydroponic herb seedlings propagation EC», «chives seeds per rockwool cube», «BBCH Monografie Petersilie Schnittlauch».
- Iowa State University Digital Repository (DSpace-API): Masterarbeit zur pH-Wirkung bei Kräutern in DFT, Volltext als Textauszug (Abstract, Kapitel 2 Methoden).
- Europe PMC Volltext: PLOS ONE 2021 (Dill, Petersilie, Brunnenkresse in Deep-flow-Systemen).
- Semantic Scholar API: Abstracts Agronomy 2019 (Petersilie in NFT, EC-Stufen) und Agriculture 2023 (Schnittlauch, Salzstress).
- SciELO: Horticultura Brasileira 2022 (Schnittlauch in NFT).
- Oklahoma State HLA-6722 (PDF), CAFRE-Leitfaden (PDF), Rise Gardens (zwei Artikel), Johnny's Hydroponik-Anzucht, GBIF-API (Taxon und deutsche Namen).

## Annahmen (A)

1. (A) Deep-flow technique (DFT) mit belüfteter, stehender Lösung und schwimmenden oder aufliegenden Platten ist als `dwc` erfasst.
2. (A) Phasenangaben ohne Stadium (Rise Gardens, Oklahoma State) sind `wachstum` zugeordnet, weil die Dauerkultur dort ihre Hauptzeit hat; die Fundstelle sagt das jeweils.
3. (A) Masterarbeit Iowa State als B1 (`universitaet_beratung`), nicht A: keine Zeitschriften-Begutachtung. Der Methodenprüfer kann sie als A werten (Messwerte für Art und Phase in DFT).
4. (A) GBIF als Quellenklasse `katalog`, Anbaumethode `keine`, Evidenzklasse C, Vermerk `keine` (Rollenvorgabe); die Aufzählung `quelle_klasse` kennt keine Taxonomie-Datenbank.
5. (A) Oklahoma State HLA-6722 nennt kein einzelnes System; `substrat_inert` nach Abbildung 1 (Dutch Bucket mit Blähton). Die Zeile steht ohnehin in `profilwert_offen.csv`.
6. (A) Wechselmerkmale Keimung und Anzucht aus der allgemeinen Hydroponik-Anzucht von Johnny's (Klasse C, nicht artspezifisch), für beide Arten gleich formuliert.

## Hinweise für Koordinator und Prüfrollen

- Tower Garden (`tower-garden-schnittlauch`): Die Seite lieferte beim Abruf HTTP 403. Das Kurzzitat stammt aus dem Suchindex der Seite; der Quellenprüfer muss es bestätigen. Davon hängen drei Zeilen ab (Keimart dunkel, Keimung anwendbar, Saatmenge 4 Samen).
- Rise Gardens: Herstellertexte mit SEO-Charakter (Hinweise auf Studien ohne Beleg). Die Werte sind als B2 erfasst; der Methodenprüfer entscheidet, ob die Quelle die Grundregel erfüllt (Ausschluss «KI-Texte ohne Beleg»).
- Saatempfehlungen: In beiden Zeilen nennt die Quelle die Obergrenze nicht, beim Schnittlauch auch «Pflanzen stehen lassen» nicht. Die Pflichtfelder bleiben leer (nichts ergänzt); Tim entscheidet. Die Klasse-D-Zeile Petersilie (15 Samen, R12.3) legt der Koordinator an; meine Zeile trägt `#1`.
- Wochenangaben (Anzucht Petersilie drei bzw. fünf Wochen ab Saat) sind nicht in Tage umgerechnet; sie stehen ohne Zahlen in `profilwert_offen.csv` mit Grund.

## Verworfene Quellen

| Quelle | Grund |
|---|---|
| Agriculture 2023, 13(7) 1346 (Schnittlauch, EC 1 bis 5 dS/m mit H2O2-Priming) | Salzstress-Versuch, kein Sollbereich; Volltext bei MDPI gesperrt |
| Produce Grower (pH-Optima, Nährstoffe Kräuter) | Abruf blockiert (Incapsula); Primärquelle Iowa State stattdessen verwendet |
| ASHS 2025 Konferenz-Abstract (pH Kräuter) | nur Optimum 5.5 als Einzelwert; dieselbe Studie wie die Masterarbeit |
| Masterarbeit Iowa State, Kapitel 1 Literaturübersicht «For parsley, a pH range of 5.5 to 6.0 is recommended» | Sekundärzitat (Arbeit von 2005), nicht eigene Angabe |
| Oklahoma State HLA-6722, pH-Spalte Petersilie | Spaltenzuordnung im PDF-Text uneindeutig (Layout- und Rohtext ergeben 7.0 bzw. 6.0 to 6.5) |
| CAFRE Anhang 2 (EC, pH, Lufttemperatur, Kulturzeit Schnittlauch) | nur Balkengrafik ohne Zahlen im Text, nicht wörtlich zitierbar |
| Singapore Food Agency, Leitfaden Nährstoffe 2025 | nur asiatische Blattgemüse |
| Johnny's Tabelle EC (Lettuce, Basil …) | keine Werte für Petersilie oder Schnittlauch |
| AeroGarden (Keimdauer Petersilie 21 Tage) | Seiten nicht abrufbar (Cloudflare, Weiterleitung), Wert nur aus Suchtreffer |
| Fork Farms (3 bis 5 Kräutersamen je Würfel) | nicht artspezifisch, «Pflanzen stehen lassen» fehlt |
| scaleandstem, dripcanopy, pocketgreenguides, gardenmyths, Scribd-Tabellen, LetPot (Knoblauch-Schnittlauch) | Seiten ohne erkennbare Quelle oder andere Art |
| JKI BBCH-Monografie 2018 (de und en) | Petersilie und Schnittlauch sind keine eigenen Kulturen (Abschnitte 2.3.19 Zwiebelgemüse: Zwiebel, Knoblauch, Schalotte; 2.3.22 Blattgemüse nicht kopfbildend: Pflücksalat, Spinat, Grünkohl); Textebene der Seiten ab S. 14 im PDF nicht lesbar (Schriften ohne Unicode-Zuordnung), daher kein wörtliches Zitat der allgemeinen Skala; OpenAgrar-Fassung hinter Sicherheitsprüfung |

## Lückenliste (Klasse D, keine Zeile angelegt)

| Art | Phase | Grösse | Bemerkung |
|---|---|---|---|
| Petersilie, Schnittlauch | bluete, fruchtbildung_reife | anwendbar (`entfaellt`) | folgt aus R1.1; Annahme 2 verlangt die JKI-Monografie mit Fundstelle der Art, die Arten fehlen dort. Entscheid Koordinator/Tim |
| Petersilie, Schnittlauch | keimung, anzucht, wachstum | bbch | keine Quelle (JKI ohne die Arten, Text nicht lesbar; keine Hydroponik-Quelle mit BBCH) |
| Petersilie, Schnittlauch | keimung | dauer | keine Hydroponik-Quelle mit Keimdauer |
| Petersilie, Schnittlauch | keimung | keimtemp | keine Quelle mit min, typ, max |
| Petersilie | keimung | keimart | keine Quelle |
| Petersilie | anzucht | dauer | nur Wochen ab Saat inkl. Keimung (offen, 2 Kandidaten) |
| Schnittlauch | anzucht | dauer | Sämlinge zugekauft (25 Tage ab Saat, Gärtnerei), keine Hydroponik-Dauer |
| Petersilie, Schnittlauch | anzucht | ph, ec | keine Zahlen; Quellen nennen nur «verdünnte Lösung» bzw. «~50 % der Produktionslösung» |
| Petersilie, Schnittlauch | wachstum | dauer | Dauerkultur, keine Phasendauer in Hydroponik-Quellen (nur Versuchsdauer 4 Wochen bzw. 40 Tage) |
| Petersilie | wachstum | wassertemp, licht_h | nur Einzelwerte (offen) |
| Schnittlauch | alle | wassertemp | keine Quelle |
| Schnittlauch | wachstum | licht_h | nur Untergrenze 14 h (offen) |
| Petersilie | – | ernte_ab_d, ernteart, ernteintervall_d, schnitte_max, kulturdauer_* | nur «harvested … four weeks after transplant» (Wochen, Versuchsernte) |
| Schnittlauch | – | ernteintervall_d, schnitte_max, kulturdauer_* | keine Quelle |
| Petersilie, Schnittlauch | – | Artmerkmale 4.3.2 (systemeignung, photoperiode, pythium, umsetzen_ab_d …) | keine Hydroponik-Quelle gefunden (Probelauf, Aufwand begrenzt) |
| Petersilie | Saatmenge | obergrenze_samen | Quelle nennt sie nicht (Feld leer) |
| Schnittlauch | Saatmenge | obergrenze_samen, pflanzen_stehen_lassen | Quelle nennt sie nicht (Felder leer) |
| alle | EC | ppm ohne Faktor | kein Fall aufgetreten |

## Runde 2 (12.11.2026)

### Suchweg

- frankiesgarten.de (Entscheid 0018, Klasse C): Seite Petersilie (Tower, Schaumstoffwürfel), Übersicht `/anleitungen/gemueseanbau/` (keine Schnittlauch-Seite, «kommt noch»; `/schnittlauch-hydroponik/` liefert 404), Tabelle Keimtemperaturen und Keimdauer (Zeilen Petersilie und Schnittlauch), Einstieg «Hydroponik für Anfänger» (pH, EC-Stufen, Licht, Wassertemperatur, Samen je Würfel), FAQ.
- BBCH-Monografie 2001 (englisch, PDF S. 111 Bulb vegetables, S. 122 bis 123 Leaf vegetables not forming heads); Petersilie und Schnittlauch nicht namentlich, Zuordnung über Rosettenwuchs (Fussnote 1) bzw. Gattung Allium.
- Suche «parsley chives hydroponic propagation rockwool days»: Simply Hydroponics «Hydroponic Chives» (Praxisartikel, Klasse C), Fork Farms Herb Grow Guide (Hersteller, B2), Virginia Cooperative Extension SPES-466NP (B1, Petersilie in vier Hydroponiksystemen).
- Suche Kardinaltemperaturen Keimung Petersilie: keine Studie gefunden.

### Ergebnis

- Ladbar neu: Keimart beider Arten, Keimtemperatur Schnittlauch (16/21/22 °C), BBCH aller drei Phasen beider Arten, pH und EC Anzucht beider Arten, pH und EC Wachstum beider Arten (u. a. Petersilie 1.6–1.8 mS/cm B1, Schnittlauch 1.8–2.0 mS/cm C), Licht und Wassertemperatur Anzucht und Wachstum, Keimung anwendbar Schnittlauch.
- Konflikt zu entscheiden: Keimart Petersilie `dunkel` (frankiesgarten, C) gegen `licht` (Virginia Tech, B1: «performed better when placed under light»).
- Wassertemperatur Petersilie Anzucht: frankiesgarten nennt auf derselben Seite 18–22 °C (Anzuchtkarte) und 18–24 °C (Text); beide als Kandidaten. Kurzzitate der frankiesgarten-Seiten stammen aus einer Zusammenfassung des Abrufwerkzeugs; der Quellenprüfer ersetzt sie durch den wörtlichen Satzteil.

### Verworfene Quellen (Runde 2)

| Quelle | Grund |
|---|---|
| Virginia Tech Table 2 Wassertemperatur «66 – 79°F» | °F, Umrechnung verboten |
| Virginia Tech Table 1 «True Leaves 28 d», «Harvest 49-84 d» | Bezugspunkt der Tage nicht genannt; Anzuchtdauer nicht ableitbar |
| Fork Farms «6-8 weeks before … first harvest», «harvested weekly, bi-weekly» | Wochen, nicht artspezifisch; Umrechnung verboten |
| Fork Farms «Herb seeds on average take 5-7 days to germinate» | nicht artspezifisch |
| frankiesgarten Petersilie «2 bis 4 Wochen» Keimdauer, «alle zwei bis drei Wochen» nachsäen | Wochen |
| frankiesgarten Einstieg «oft rund um den 21. Tag» umsetzen | allgemein für alle Pflanzen, nicht artspezifisch |
| Simply Hydroponics «replacing plants every two years» | Jahre, Umrechnung verboten |
| Johnny's Chives Key Growing Information (7–14 Tage bei 65–70 °F, 3–4 Sämlinge je Plug) | Erde/Anzuchtplugs, nicht hydroponisch |
| Ball Australia Cultural Notes Chives, UC Davis Parsley, Rutgers/UMD Parsley | Freiland oder Erde |
| scaleandstem, dripcanopy, uvammicah, hydroponics-central, agrifarming | Seiten ohne erkennbare Quelle |

### Lückenliste nach Runde 2 (Klasse D oder nur offen)

| Art | Phase | Grösse | Bemerkung |
|---|---|---|---|
| Petersilie | keimung | dauer | nur offen (etwa 7 Tage; 7–14 Tage; 14 d) |
| Petersilie | keimung | keimtemp | nur offen (15–20 °C ohne typ) |
| Schnittlauch | keimung | dauer | nur offen (8–10 Tage ohne typ) |
| Petersilie, Schnittlauch | anzucht | dauer | keine Tage ab Phasenbeginn (nur Wochen ab Saat) |
| Petersilie, Schnittlauch | wachstum | dauer | keine Quelle (Dauerkultur) |
| Petersilie, Schnittlauch | keimung | wassertemp | keine Quelle |
| Schnittlauch | anzucht | wassertemp | keine Quelle |
| Petersilie | keimung | licht_h | nur offen (10 h Einzelwert) |
| Petersilie | – | kulturformen_erlaubt `schnitt` | keine Quelle belegt Schnittnutzung; Kandidaten nur `dauerkultur_blatt` |
| Petersilie, Schnittlauch | – | standard_keimfaehigkeit, samentyp, umsetzen_ab_d, umsetzen_bis_d | keine Quelle mit Tagen ab Saat |
| Schnittlauch | – | systemeignung | nur NFT belegt, kein DWC oder Kratky |
| Petersilie, Schnittlauch | – | ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_typisch_d, kulturdauer_max_d, entspitzen | nur Wochen oder unbestimmt («several weeks», «weekly») |
| Petersilie | schnitt | ernteart | keine Quelle |
| Petersilie, Schnittlauch | Saatmenge | pflanzen_stehen_lassen, typischer Wert | Quellen nennen 3–5 bzw. 3–6 oder 4 Samen, nie die Zahl stehender Pflanzen (nur offen) |
| Petersilie, Schnittlauch | bluete, fruchtbildung_reife | anwendbar `entfaellt` | nicht neu angelegt; Regelwert nach Entscheid 0018 legt der Lead an |

## Runde 3 (12.11.2026): Phasendauern ohne Kandidaten

Gesucht nur: Petersilie `anzucht.dauer`, `wachstum.dauer`; Schnittlauch `keimung.dauer`, `anzucht.dauer`, `wachstum.dauer`. Alle neuen Kandidaten stehen in `profilwert_offen.csv` (keiner hat die Form des Validators).

### Suchweg

- frankiesgarten.de: Petersilie-Seite (Phasenkarten, Zeitplan, FAQ der Seite), Keimtabelle, FAQ, Übersicht `anleitungen/gemueseanbau/`
- Websuche «hydroponic parsley days after transplanting», «Petroselinum crispum hydroponic days after sowing transplanting», «chives hydroponic days after transplanting rockwool», «Salve Regina hydroponic chives»
- Volltexte: PLOS ONE 2021 (Dill, Petersilie, Brunnenkresse), Virginia Tech SPES-466 Table 1, Horticultura Brasileira 2022 (Schnittlauch NFT), Upstart University Petersilie, Salve Regina Growing Guide Schnittlauch (Beschreibungsseite)

### Neue Kandidaten (alle offen)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.petroselinum_crispum.wachstum.dauer#1 | upstart-petersilie-2016 (B2) | «5–6 weeks after that» (nach dem Umsetzen) | Wochen, Bereich ohne typ |
| pw.petroselinum_crispum.wachstum.dauer#2 | plos-one-dill-petersilie-2021 (A) | «two, three, or four weeks after transplant» (Petersilie = four) | Wochen, Einzelwert, Zuordnung über Reihenfolge |
| pw.petroselinum_crispum.wachstum.dauer#3 | vt-spes-466-2023 (B1) | Harvest «49-84 d» | Bezugspunkt nicht genannt, Bereich ohne typ |
| pw.allium_schoenoprasum.anzucht.dauer#2 | salve-regina-schnittlauch-2023 (B1) | «propagate under grow lights in approximately 15 days» | Einzelwert, Bezugspunkt unklar |
| pw.allium_schoenoprasum.wachstum.dauer#1 | hortic-bras-schnittlauch-2022 (A) | «40 days after transplanting (DAT)» | Einzelwert, Versuchsernte |

### Verworfen in Runde 3

| Quelle | Grund |
|---|---|
| frankiesgarten Petersilie: Phasen «nach dem Auflaufen», «mehrere echte Blätter», Ernte «laufend»; Zeitplan nur Leerfelder («In den Tower nach: … Tagen») | keine Dauer in Zahlen; Keimung «1 bis 4 Wochen» gehört nicht zu den gesuchten Grössen |
| frankiesgarten Keimtabelle Schnittlauch «siehe Tüte» | kein Wert |
| frankiesgarten: keine Schnittlauch-Seite («Schnittlauch, Rucola und weitere Kräuter kommen dazu»); FAQ nur Salat «4 bis 6 Wochen im Tower» | nicht artspezifisch |
| Upstart University Petersilie «ready to transplant a few weeks later» | keine Zahl |
| Horticultura Brasileira 2022 «seedlings … from a local nursery at 25 days after sowing» | Anzucht in Gärtnerei, nicht hydroponisch belegt |
| Salve Regina Growing Guide (PDF) | PDF nicht abrufbar (HTTP 403); nur Beschreibungsseite gelesen. Suchmaschinen-Zusammenfassung «transferred day 15, first harvest day 52» nicht an der Quelle geprüft, daher kein Kandidat |
| Rootless Farm «70–90 days to first harvest», Agrotonomy, gardeningtips.in, agrowtronics, dripcanopy, scaleandstem | Seiten ohne erkennbare Quelle oder Praxis ohne nachvollziehbare Methode |
| BrightAgrotech (Medium) Schnittlauch «six to eight weeks» nach Umsetzen | nicht abrufbar (HTTP 403), nicht geprüft |
| Agronomy 2019 (MDPI) Petersilie | nicht abrufbar (HTTP 403) |
| Lettuce Grow, Rise Gardens Schnittlauch | nicht abrufbar (HTTP 429) |
| Johnny's Chives 7–14 Tage | Erde/Anzuchtplugs (schon Runde 2) |

### Lückenliste nach Runde 3

| Art | Phase | Grösse | Bemerkung |
|---|---|---|---|
| Petersilie | anzucht | dauer | weiterhin nur Wochen ab Saat (Runde 2), keine neue Quelle |
| Schnittlauch | keimung | dauer | keine hydroponische Quelle (Klasse D); Simply Hydroponics 8–10 Tage verworfen |
| Schnittlauch | anzucht | dauer | nur offen (15 Tage, Bezugspunkt unklar) |
| Petersilie, Schnittlauch | wachstum | dauer | nur offen (Wochen, Einzelwerte, Bezugspunkt unklar) |

## Runde 6 (12.11.2026): Anzucht- und Keimdauer

Gesucht nur: `pw.petroselinum_crispum.anzucht.dauer`, `pw.allium_schoenoprasum.anzucht.dauer`, `pw.allium_schoenoprasum.keimung.dauer`.

### Suchweg

- Websuche «chives rockwool germination days transplanted days after sowing», «parsley hydroponic NFT floating seedlings days after sowing», «CEA HERB sowing density parsley».
- Rise Gardens Plant Library (keine Petersilie- oder Schnittlauch-Seite gefunden), Rise-Gardens-Produktseiten (HTTP 429).
- CEA HERB (scri-ceaherb.org, Publikationsliste) → PDF HortTechnology 34(3) 2024 «Optimizing Sowing Density …», Text mit eigenem Lesekript aus dem Zwischenspeicher gelesen (Leerzeichen im Zitat wiederhergestellt).

### Neuer Kandidat (offen)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.petroselinum_crispum.anzucht.dauer#3 | horttech-34-saatdichte-petersilie-2024 (A, Phenolschaum 2.2 cm, Ebbe-Flut, danach DWC, Gewächshaus) | «21 (parsley, sage) days after sowing» | Tage ab Saat, Keimdauer nicht in derselben Quelle; Einzelwert. Für den Lead: mit der Keimdauer der Art umrechnen |

### Verworfen in Runde 6

| Quelle | Grund |
|---|---|
| HortTechnology 2024, «28 (parsley) days» in DWC | Wachstumsdauer, nicht gesucht (Hinweis für den Lead) |
| Fachartikel greenhousemag.com und producegrower.com zur Saatdichte (CEA HERB Part 2, laut Suchausschnitt Keimtage je Art) | Seiteninhalt nicht abrufbar (leer), Zitat nicht prüfbar |
| Johnny's Staro Chives 7–14 Tage, 75–85 Tage | Katalog/Erde, schon verworfen |
| Simply Hydroponics Schnittlauch 4–6 Wochen | schon offen (#1) |
| growwithhydroponics.com Petersilie 14–21 Tage | Seite ohne erkennbare Quelle |

### Lückenliste nach Runde 6

| Art | Phase | Grösse | Bemerkung |
|---|---|---|---|
| Petersilie | anzucht | dauer | nur offen: 21 Tage ab Saat (A), drei bzw. fünf Wochen ab Saat (Runde 2); Umrechnung durch den Lead |
| Schnittlauch | keimung | dauer | weiterhin keine hydroponische Quelle (Klasse D) |
| Schnittlauch | anzucht | dauer | keine neue Quelle; nur offen (15 Tage, 4–6 Wochen) |

## Runde 7 (12.11.2026): Anzuchtdauer Petersilie, Keim- und Anzuchtdauer Schnittlauch

Gesucht nur: `pw.petroselinum_crispum.anzucht.dauer`, `pw.allium_schoenoprasum.keimung.dauer`, `pw.allium_schoenoprasum.anzucht.dauer`; gezielt Quellen mit Keimdauer und Umsetztag oder Dauer ab Keimung.

### Suchweg

- Fork Farms Help Center (`/help/plant-guides`, `/help/herb-grow-guide`, `/help/seed-varieties`): Petersilie und Schnittlauch nur Ernte nach Höhe («at least 6 inches»), Keimung «5-7 days» für Kräuter allgemein.
- frankiesgarten.de: Übersicht weiterhin ohne Schnittlauch-Seite; Petersilie-Seite erneut: Keimung «1 bis 4 Wochen», Zeitplanfelder leer.
- Rise Gardens Plant library (Produktseiten, mit curl gelesen): «Darki Parsley» und «Forest Green Parsley» mit «Days 0-8 Germination», «Days 8-15 Move to Garden»; in der Produktliste keine Schnittlauch-Sorte (nur «Red Baron Bunching», Allium fistulosum).
- Gardyn Help Center «Chives»: «Days to Sprout: 7-21».
- Salve Regina Digital Commons, Sammlung «hydroponic_center»: PDF «Dolores Chive» weiterhin HTTP 403; keine Basilikum- oder Petersilie-Anleitung in der Sammlung.
- Europe PMC (Volltext-XML): Schnittlauch mit Hydroponik (Heliyon 2019, PMC6928240), Petersilie und Basilikum unter FR und UV-A (PMC13438295).
- Websuche Schnittlauch Hydroponik Steinwolle (deutsch), Upstart Farmers Schnittlauch, AeroGarden, The Growcer.

### Neue Kandidaten (alle offen)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.petroselinum_crispum.anzucht.dauer#4 | risegardens-darki-petersilie (B2, Indoor LED) | «Days 0-8 Germination … Days 8-15 Move to Garden» → 15 minus 8 = 7 | Einzelwert; Umsetztag im Fenster nicht eindeutig |
| pw.petroselinum_crispum.anzucht.dauer#5 | risegardens-forest-green-petersilie (B2) | wie #4 (0-8, 8-15) → 7 | Einzelwert; wie #4 |
| pw.allium_schoenoprasum.keimung.dauer#2 | gardyn-schnittlauch (B2, Hydroponik auf der Seite nicht ausdrücklich) | «Days to Sprout: 7-21» | Bereich ohne typ |

Hinweise für den Lead: Rise Gardens nennt für Petersilie 8 Keimtage, frankiesgarten «1 bis 4 Wochen», die Studien drei bis fünf Wochen bis zum Umsetzen; die Rise-Stufen sind ein einheitliches Schema für Kräuter und wirken knapp. Gardyn «Days to Maturity: 75-85» gleicht Johnny's Katalog; die Keimangabe stammt vermutlich ebenfalls nicht aus eigenem Versuch (Methodenprüfung).

### Verworfen in Runde 7

| Quelle | Grund |
|---|---|
| PMC13438295 (2026, Basilikum und Petersilie, Steinwolle 1.2 Zoll, Deep Flow) | «After emergence (three weeks after sowing)», Wochen ab Saat, keine eigene Keimdauer |
| Heliyon 2019 Schnittlauch mit Beauveria (PMC6928240) | Jungpflanzen aus Gärtnerei, Töpfe mit Sand-Vermiculit-Perlit |
| Salve Regina «Dolores Chive» (PDF) | HTTP 403, nicht prüfbar |
| The Growcer «herbs … seedling area for 21 days» | nicht artspezifisch |
| AeroGarden Blog (Kräuter 5-15 Tage) | HTTP 403, nicht artspezifisch |
| Johnny's Chives 7–14 Tage, Ball Australia, Eden Brothers, gartenjournal, guterboden | Erde, Katalog oder Seiten ohne Hydroponik |
| BrightAgrotech (Medium), agrowtronics, dripcanopy, scaleandstem, letpot | nicht abrufbar oder ohne erkennbare Quelle |
| CEA HERB Part 2 (producegrower.com) | Bot-Schutz, Archivkopie nicht erreichbar |

### Lückenliste nach Runde 7

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| Petersilie | anzucht | dauer | kein Kandidat mit `wert_min/wert_typ/wert_max`; offen neu: 7 (Rise Darki, Rise Forest Green, je Einzelwert aus Rechnung) |
| Schnittlauch | keimung | dauer | kein Kandidat mit Typwert; offen neu: Gardyn 7–21 (Bereich ohne typ, Hydroponik nicht ausdrücklich) |
| Schnittlauch | anzucht | dauer | keine neue Quelle (Klasse D); nur offen: Salve Regina 15 Tage, Simply Hydroponics 4–6 Wochen |

## Runde 8 (13.11.2026): Keim- und Anzuchtdauer Schnittlauch

Gesucht nur: `pw.allium_schoenoprasum.keimung.dauer`, `pw.allium_schoenoprasum.anzucht.dauer`.

### Suchweg

- Salve Regina Digital Commons `hydroponic_center/4`: Landingpage mit Cookie geladen, danach PDF-Link der Seite (`viewcontent.cgi?article=1004&context=hydroponic_center`, nicht 1003) mit Referer abgerufen (HTTP 200, PDF), Text mit pdftotext gelesen.
- Websuche «chives hydroponic rockwool days after sowing transplanted», «hydroponic herb production extension chives germination days transplant», «Allium schoenoprasum hydroponic were sown transplanted».
- Alabama Extension ANR-2954 (Transplant Production for Hydroponic and Greenhouse Systems), Fork Farms Herb Grow Guide (PDF März 2025), Florida State Hort. Soc. 114 (Kräuter im Turmsystem), Europe PMC (Volltextsuche Schnittlauch mit hydroponic/NFT/rockwool), SciELO Horticultura Brasileira (Schnittlauch NFT mit Magnesiumsulfat).

### Befund Salve Regina (PDF Seite 2)

Wörtlich: «Propagation: 5-10 seeds planted in rockwool cubes size small in a seed tray.» und im Block «Propagation»: «Days Dark: 8 / Days under Light: 7 / Transferred to Grow System on day 15 / First Harvest Day: Day 52 in the Tower 3 System». Lampen: Sun Blaze T5HO-48 mit T5-Röhren 6500 K (keine LED, daher `umgebung_quelle = andere`). Die Quelle sagt nicht ausdrücklich, dass die Sämlinge nach der Dunkelphase aufgelaufen sind; die Reihenfolge Dunkel → Licht → Umsetzen legt es nahe (Lesart für die Methodenprüfung).

### Neue Kandidaten (alle offen, Einzelwerte)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| pw.allium_schoenoprasum.keimung.dauer#3 | salve-regina-schnittlauch-2023 (B1, Steinwollwürfel, T5) | «Days Dark: 8» | Einzelwert; Auflaufen nicht ausdrücklich |
| pw.allium_schoenoprasum.anzucht.dauer#3 | salve-regina-schnittlauch-2023 | «Days under Light: 7»; Gegenrechnung «Transferred … on day 15» minus 8 = 7 | Einzelwert; Lichtbeginn als Auflaufen gelesen |

Keine neue Quelle in `quelle.csv` (Salve Regina schon vorhanden).

### Verworfen in Runde 8

| Quelle | Grund |
|---|---|
| Alabama Extension ANR-2954 | Tabelle 2 nur Tomate, Peperoni, Gurke, Salat; kein Schnittlauch |
| Fork Farms Herb Grow Guide (2025) | «Herb seeds on average take 5-7 days to germinate», nicht artspezifisch; Umsetzen nach Höhe, ohne Tage |
| Florida State Hort. Soc. 114 (2001), Kräuter im Turm | Schnittlauch aus dem Versuch genommen, keine Zeiten |
| EDEN ISS 2018 (PMC7264257) | Schnittlauch direkt auf Baumwollmatten gesät, kein Umsetzen, keine Keimdauer |
| SciELO Horticultura Brasileira (Schnittlauch NFT, Magnesiumsulfat) | Jungpflanzen aus Gärtnerei «at 25 days after sowing», Anzucht nicht hydroponisch |
| PMC9016137 (Chinese chives, Methyljasmonat) | Allium tuberosum, Substrattöpfe |
| Horticulturae 2021 (DOAJ-Treffer) | Zwiebel (Allium cepa), nicht Schnittlauch |
| letpot.com (Garlic Chives), scaleandstem | Allium tuberosum bzw. Seite ohne erkennbare Quelle |

### Lückenliste nach Runde 8

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| Schnittlauch | keimung | dauer | kein Kandidat in Validatorform; offen: Salve Regina 8 (Einzelwert), Gardyn 7–21 (verworfen) |
| Schnittlauch | anzucht | dauer | kein Kandidat in Validatorform; offen: Salve Regina 7 (Einzelwert, aus 15 minus 8) |
