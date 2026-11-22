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

## Runde 9 (13.11.2026): Keim- und Anzuchtdauer Schnittlauch

Gesucht nur: `pw.allium_schoenoprasum.keimung.dauer`, `pw.allium_schoenoprasum.anzucht.dauer`. Kein neuer Kandidat, keine neue Quelle.

### Suchweg

- Websuche Hersteller: «chives hydroponic days to germinate transplant» mit Tower Garden, Lettuce Grow, Aerospring, Click and Grow; «Tower Garden chives rockwool transplant after sprouting».
- Websuche Beratung: «hydroponic herb production guide table chives days to germination days to transplant extension».
- Europe PMC (Volltext, Open Access): Schnittlauch/chives mit rockwool, hydroponic, vertical farm, plant factory, NFT, DWC, ebb and flow und sown/transplanted/emergence; gelesen PMC5894456 (Sci. Hortic. 2018, Weltraum-Gewächshaus, Steinwollplugs), PMC10724622, PMC13088466, PMC9818334.
- Japanisch («チャイブ 水耕栽培 播種 発芽 定植»), NCSU Plants for Human Health «Starting Seeds for a Tower Garden».

### Verworfen

| Quelle | Grund |
|---|---|
| Tower Garden «How to Grow Chives and Bring Your Meals Alive» (us.towergarden.com) | Cloudflare-Sperre (curl «Just a moment», WebFetch HTTP 403), keine Archivkopie; laut Suchauszug «ready to transplant about two weeks after sprouting» (wäre Einzelwert für `anzucht.dauer`). Nicht prüfbar, kein Kandidat. Hinweis für den Lead: Tim könnte die Seite im Browser öffnen und das Zitat bestätigen |
| Sci. Hortic. 2018 (PMC5894456, EDEN-ISS-Vorversuch, Steinwollplugs 2 cm) | Schnittlauch nur Ernte nach 42 Tagen und Nachwuchs 8 Tage; keine Keim- oder Umsetztage |
| PMC10724622, PMC13088466, PMC9818334 | kein Schnittlauch mit Keim- oder Umsetzangaben (PMC9818334 Allium tuberosum) |
| NCSU «Starting Seeds for a Tower Garden» | keine Art, keine Tage (Umsetzen bei ersten echten Blättern) |
| Rise Gardens «Red Baron Bunching» (10 Tage Keimung) | Allium fistulosum, schon verworfen |
| Johnny's, Fork Farms Herb Grow Guide, Alabama ANR-2954, The Growcer, dripcanopy, letpot, scaleandstem | schon in Runden 6 bis 8 verworfen |
| Japanische Treffer (Präfektur Hiroshima, Nichias) | Negi (Allium fistulosum) im Wasserkultur-Verfahren, kein Schnittlauch |

### Lückenliste nach Runde 9

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| Schnittlauch | keimung | dauer | unverändert: kein Kandidat in Validatorform; offen Salve Regina 8 (Einzelwert) |
| Schnittlauch | anzucht | dauer | unverändert: kein Kandidat in Validatorform; offen Salve Regina 7 (Einzelwert); Tower Garden «about two weeks after sprouting» nicht prüfbar (Cloudflare) |

## Runde 10 (13.11.2026)

Gesucht nur: `pw.allium_schoenoprasum.keimung.dauer`, `pw.allium_schoenoprasum.anzucht.dauer`, nach Entscheid 0022 auch aus Anbauquellen (Tüte, Katalog, Kulturanleitung, Beratung, Erde oder Substrat), Klasse höchstens C. Alle neuen Zeilen in `profilwert_offen.csv` (keine Quelle nennt einen typischen Wert neben dem Bereich), neue Quellen in `quelle.csv` mit `anbaumethode = keine`.

### Suchweg

- Websuche deutsch: «Schnittlauch Aussaat Keimdauer Tage Pflanzung Wochen nach Aussaat Kulturanleitung», «Schnittlauch Twiggy Saatgut Keimdauer», Bingenheimer, Sativa, Zollinger, «Topfkräuter Schnittlauch Kulturdauer … LWG».
- Websuche englisch: «chives transplants weeks from seeding to transplant days to emergence extension», «chives culture sheet plug crop time weeks germination days», «chives seedlings ready to transplant weeks after sowing extension».
- Gelesen (curl und pdftotext bzw. WebFetch): DLR Rheinhessen-Nahe-Hunsrück Merkblatt Schnittlauch 2024/2025 (PDF), Saatgutbibliothek Hohenheim «Schnittlauch fertig» (PDF), Ball «Vegetable & Herb Plug Growing Chart» (PDF 2009, Zeile Chives mit `-raw` gelesen, Fussnoten Stage 1 bis 4), Ball Australia GrowerFacts «Chives Onion» (PDF 2020), Johnny's «Chives – Key Growing Information», Fruition Seeds «Organic Chives», PlantVillage (Penn State) «Chives», Hornbach Schweiz Kiepenkerl «Staro», Sativa «Polyvit», Simply Hydroponics (Absatz «Propagation» erneut gelesen, Zitat ergänzt bis «small pots»).

### Neue Kandidaten (alle `profilwert_offen.csv`, Klasse C)

| zeile_id | Quelle | Wert wörtlich | grund |
|---|---|---|---|
| keimung.dauer#4 | simplyhydro-schnittlauch | «usually within eight to ten days» | Bereich ohne typ (früher #1, nur wegen Hydroponik verworfen) |
| keimung.dauer#5 | gardyn-schnittlauch | «Days to Sprout: 7-21» | Bereich ohne typ (früher #2, verworfen wegen fehlender Hydroponik und Katalogähnlichkeit, beides nach 0022 zulässig) |
| keimung.dauer#6 | dlr-rnh-schnittlauch-2024 | «Keimdauer 10-25 Tage» | Bereich ohne typ |
| keimung.dauer#7 | hohenheim-saatgutbibliothek-schnittlauch | «Die Keimung dauert in der Regel 10–20 Tage» | Bereich ohne typ |
| keimung.dauer#8 | johnnys-schnittlauch-key-growing (katalog) | «7-14 days at 65–70°F» | Bereich ohne typ |
| keimung.dauer#9 | kiepenkerl-staro-hornbach (katalog) | «Keimdauer 14 Tage - 21 Tage» | Bereich ohne typ |
| keimung.dauer#10 | fruition-schnittlauch (katalog) | «Days to Germination: 7-14» | Bereich ohne typ |
| keimung.dauer#11 | plantvillage-psu-schnittlauch | «emerging after about 7 days» | Einzelwert |
| keimung.dauer#12 | ball-growerfacts-schnittlauch-2020 | «After Stem and cotyledon emergence (7 days)» | Einzelwert |
| keimung.dauer#13 | ball-plugchart-2009 (Tray 2-2.5 cm) | Stage 1 «4-8», Stage 2 «5-7» Tage | Stufen nicht deckungsgleich mit Auflaufen |
| anzucht.dauer#4 | simplyhydro-schnittlauch | «eight to ten days» … «After four to six weeks the young plants» | Wochen ab Saat und Keimdauer je ohne typ |
| anzucht.dauer#5 | dlr-rnh-schnittlauch-2024 | ET Aussaat 15.01. Pflanzung 20.03. «64» Tage, 15.02./15.04. «59» Tage; Keimdauer 10-25 | Tage ab Saat (Winteranzucht), Keimdauer ohne typ |
| anzucht.dauer#6 | dlr-rnh-schnittlauch-2024 | «Dauer 4-8 Wochen» (Erdpresstopf) | Wochen ab Saat, ohne typ |
| anzucht.dauer#7 | ball-plugchart-2009 | Stage 3 «21-35», Stage 4 «7» Tage, Total «7-8» Wochen | Stufensumme bzw. Wochen ab Saat, ohne typ |
| anzucht.dauer#8 | plantvillage-psu-schnittlauch | «emerging after about 7 days» … «about 4 weeks old» | Einzelwerte |
| anzucht.dauer#9 | fruition-schnittlauch | «Indoors, ~4 weeks before last frost» | Bezug Frosttermin, Keimdauer 7-14 |
| anzucht.dauer#10 | johnnys-schnittlauch-key-growing | «Start seeds in flats 6-8 weeks before the last frost» | Bezug Frosttermin, Keimdauer 7-14 |

Hinweise für den Lead: Die Keimangaben liegen zwischen 7 und 25 Tagen; die meisten Kataloge nennen 7-14 oder 14-21 Tage. Für die Anzucht nennen Ball (Tray 2-2.5 cm, also Würfelgrösse) 7-8 Wochen ab Saat, Simply Hydroponics 4-6 Wochen, PlantVillage etwa 4 Wochen, DLR 4-8 Wochen bzw. 59-64 Tage (Winter). Die Differenz zur Keimdauer derselben Quelle bildet der Lead. Die Quellenzeile `gardyn-schnittlauch` in `quelle.csv` steht noch auf `verworfen` (zweimal vorhanden); der Koordinator muss sie für #5 neu prüfen lassen.

### Verworfen in Runde 10

| Quelle | Grund |
|---|---|
| gartenjournal.net «Schnittlauch säen» («nach etwa 14 Tagen») | Ratgeberseite ohne erkennbare Quelle, schon in Runde 7 verworfen |
| Sativa «Schnittlauch Polyvit» | nur Monatsbalken (Anzucht, Pflanzung), keine Tage |
| Bingenheimer Saatgut (Schnittlauch-Seite) | Bot-Schutz (Anubis, «Access Denied») |
| Renee's Garden über gertens.com («14 – 21 days» laut Suchauszug) | HTTP 403, nicht prüfbar |
| Lettuce Grow «Purly Chives» | verkauft Jungpflanzen, keine Keim- oder Anzuchtdauer auf der Seite |
| UMass «seedcropchart_ball-ua» | Datei ist HTML statt PDF, nicht lesbar |
| Harvest to Table, The Garden Shop (Irland), NParks Singapur (nur Suchauszüge) | Ratgeberseiten ohne erkennbare Quelle bzw. Umsetzen nur nach Höhe |
| Salve Regina, Tower Garden | nicht prüfbar (Quellenprüfung «nicht_gefunden» bzw. Cloudflare), nicht wiederholt |
| Zollinger, Hild | keine Schnittlauch-Kulturangaben gefunden |

### Lückenliste nach Runde 10

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| Schnittlauch | keimung | dauer | kein Kandidat in Validatorform (keine Quelle mit typischem Wert); 10 neue offene Kandidaten (7-25 Tage) für den Entscheid des Lead nach 0018 und 0022 |
| Schnittlauch | anzucht | dauer | kein Kandidat in Validatorform; 7 neue offene Kandidaten (Wochen oder Tage ab Saat mit Keimdauer derselben Quelle) |

## Runde 11 (#242)

Auftrag: `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` für Schnittlauch (dauerkultur_blatt, schnitt) und Petersilie (dauerkultur_blatt). Abruf 18.11.2026.

### Suchweg

- Bestehende Quellen erneut gelesen: VT SPES-466 (Text und Table 1), CAFRE 2020 (Abschnitt 5.9 Chives, Anhang 2), Simply Hydroponics «Hydroponic Chives», frankiesgarten Petersilie, Fork Farms Herb Grow Guide 2025, Rise Gardens Plant Library (Parsley Darki, Chives Staro).
- Websuche: «chives hydroponic repeated harvests cuts days interval», «parsley hydroponic floating system successive cuts harvest interval», «Allium schoenoprasum hydroponic harvests cuts days».
- Neu: Proc. Fla. State Hort. Soc. 114:332-334 (2001), Kräuter in Verti-Gro-Türmen mit Perlit (`fshs-kraeuter-vertikal-2001`, peer_review, substrat_inert). Gelesen, nicht erfasst: Horticultura Brasileira, Schnittlauch in NFT mit Magnesiumsulfat (nur eine Ernte 40 Tage nach Umsetzen).

### Neue Kandidaten (art.csv)

| zeile_id | Kandidat | Wert | Quelle |
|---|---|---|---|
| ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d | #1 | 1 Woche («weekly») | vt-spes-466-2023 (B1) |
| ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d | #2 | 1 Woche («weekly») | fshs-kraeuter-vertikal-2001 (A) |
| ak.petroselinum_crispum.dauerkultur_blatt.kulturdauer_max_d | #1 | 84 Tage ab Saat (Table 1, Harvest 49-84 d, Obergrenze) | vt-spes-466-2023 (B1) |
| ak.allium_schoenoprasum.dauerkultur_blatt.kulturdauer_max_d | #1 | 2 Jahre («replacing plants every two years») | simplyhydro-schnittlauch (C) |

Hinweise für den Lead: «weekly» ist als 1 Woche eingetragen (Wochenwert, Regel D4); der Schnittlauch-Wert steht in Jahren, die Umrechnung macht der Lead. Petersilie 84: Die Tabelle nennt nur den Bereich 49-84 d der Ernten; 84 ist die letzte Ernte des Versuchs (sechs Wochen wöchentliche Ernte), ein Abbruchgrund der Pflanze ist nicht genannt.

### Verworfen oder ohne Zahl

- CAFRE 5.9 Chives: «best harvested young and replanted» bzw. CCA-Kultur, keine Zahl; Anhang 2 (Kulturzeit in Wochen als Balken) im Text nicht lesbar.
- Simply Hydroponics: «regeneration time is several weeks» (keine Zahl); «every three to eight weeks» gilt für Knoblauch-Schnittlauch (Allium tuberosum), nicht für Allium schoenoprasum.
- Fork Farms Herb Grow Guide 2025 (B2, Steinwolle, Indoor-Turm): «Mature plants can be harvested weekly, bi-weekly or when necessary» (kein Einzelwert) und «herbs can remain in the Flex Farm and be continuously harvested up to four months before replanting» (Monate ab Umsetzen; Keimung nur als Bereich 5-7 Tage, Saatbezug nicht rechenbar). Nicht erfasst, Hinweis für den Lead für beide Arten.
- Rise Gardens Parsley Darki, Chives Staro: nur «can be harvested multiple times», Entfernen bei Blüte, keine Zahl.
- frankiesgarten Petersilie: «über Monate», «monatelang», keine Zahl; Nachsaat «alle zwei bis drei Wochen» ist kein Ernteintervall.
- Proc. FSHS 2001: Schnittlauch wurde wegen Problemen aus dem Versuch genommen (keine Werte); Petersilie: Kulturende «mid-June» ohne genaues Datum, Kulturdauer nicht ohne Schätzung rechenbar.

### Lückenliste Runde 11 (Klasse D)

| Art | Kulturform | Feld | Stand, was Anbauquellen sagen |
|---|---|---|---|
| allium_schoenoprasum | dauerkultur_blatt | ernteintervall_d | kein Hydroponik-Wert in Zahlen; Simply Hydroponics nur «several weeks», Fork Farms «weekly, bi-weekly» (Bereich). Gärtnerische Anleitungen (Erde) nennen wiederholten Rückschnitt über die Saison ([Johnny's Chives Key Growing Information](https://www.johnnyseeds.com/growers-library/herbs/chives/chives-key-growing-information.html)). |
| allium_schoenoprasum | dauerkultur_blatt | schnitte_max | kein Wert; Simply Hydroponics nur «after many harvests». |
| allium_schoenoprasum | schnitt | ernteintervall_d, schnitte_max, kulturdauer_max_d | kein Wert; CAFRE nur «harvested young and replanted» (NFT); Fork Farms bis vier Monate ab Umsetzen (Hinweis oben). |
| petroselinum_crispum | dauerkultur_blatt | schnitte_max | kein Einzelwert; VT: wöchentlich über sechs Wochen bzw. «until yields begin to diminish». frankiesgarten (hydroponisch, ohne Zahl): zweijährig, Blütenstiel im zweiten Jahr ([frankiesgarten Petersilie](https://frankiesgarten.de/anleitungen/gemueseanbau/petersilie-hydroponik/)). |

## Runde 12 (#250)

Gesucht: Petersilie `dauerkultur_blatt` **ernte_ab_d**, schnitte_max, kulturdauer_max_d; Schnittlauch `dauerkultur_blatt` **ernte_ab_d**, ernteintervall_d, schnitte_max; Schnittlauch `schnitt` **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d. Abruf 19.11.2026.

### Suchweg

- Bekannte Quellen erneut gelesen: VT SPES-466 (Text, Table 1), Proc. FSHS 114 (2001, Table 1 als Bild geprüft), PLOS ONE 2021 (Dill, Petersilie, Brunnenkresse), Salve Regina Growing Guide Dolores Chive (PDF), Horticultura Brasileira 2022, Fork Farms Herb Grow Guide 2025, CAFRE 2020.
- Websuche: «chives hydroponic days after transplanting harvest regrowth», «parsley hydroponic floating first harvest days after transplanting», «Allium schoenoprasum floating NFT soilless cuts harvests», «chives hydroponic salinity priming». Neu gelesen: Agronomy 9(7):389 (2019) über mdpi-res.com, Chilean J. Agric. Res. 81(3) 2021 (Schnittlauch in NFT, Salz und H2O2), agrowtronics.com «Hydroponic Chives: The Grow Guide», Rise Gardens Blog «Best Herbs to Grow Indoors Hydroponically». Lettuce Grow (Purly Chives, Italian Parsley) lieferte HTTP 429, nicht gelesen. HortTechnology 34 (Saatdichte Petersilie) liefert ohne JavaScript keinen Text, nicht gelesen.

### Neue Kandidaten (art.csv)

| kandidat_id | Wert | Quelle | Klasse |
|---|---|---|---|
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#1` | 21 Tage ab Umsetzen (Table 1: Harvest ab 49 d minus True Leaves 28 d; Umsetzen nach den echten Blättern laut Text) | vt-spes-466-2023 | B1 |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#2` | 21 Tage ab Umsetzen (Parsley und Italian Parsley) | fshs-kraeuter-vertikal-2001 | A |
| `ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d#3` | 4 Wochen ab Umsetzen (Ernte bei Marktreife; Umrechnung D4 durch den Lead) | plos-one-dill-petersilie-2021 | A |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#2` | 37 Tage ab Umsetzen (Tag 52 minus Umsetzen Tag 15) | salve-regina-schnittlauch-2023 | B1 |
| `ak.allium_schoenoprasum.schnitt.ernte_ab_d#1` | 37 Tage ab Umsetzen (gleicher Beleg) | salve-regina-schnittlauch-2023 | B1 |

Hinweise für den Lead: VT Table 1 nennt keinen ausdrücklichen Bezugspunkt; die Spalten Germination, True Leaves, Harvest sind wie in Runde 11 (`kulturdauer_max_d#1`) als Tage ab Saat gelesen. Salve Regina: «First Harvest Day: Day 52 in the Tower 3 System» kann auch Tage im Turm bedeuten (dann 52); die Zeile «Transferred to Grow System on day 15» zählt ab Saat, deshalb 37 eingetragen. Der Wert steht bei beiden Kulturformen, weil die Quelle 5 bis 10 Samen je Würfel setzt und am Grund für Nachwuchs schneidet.

### Offene Werte (Form passt nicht, kein Kandidat)

| Art | Feld | Wortlaut | Quelle | grund |
|---|---|---|---|---|
| Schnittlauch | `ernte_ab_d` | «Wait about a month or a little less before you make the first cut. Three to four weeks is usually a safe bet.» | agrowtronics.com (C) | Bereich ohne typischen Wert |
| Schnittlauch | `ernteintervall_d` | «Chives grow back to be harvested again within two to three weeks.» | agrowtronics.com (C) | Bereich ohne typischen Wert |
| Kräuter allgemein | `ernte_ab_d` | «it will take about 6-8 weeks before they are ready for the first harvest» | Fork Farms Herb Grow Guide 2025 (B2) | Bereich ohne typischen Wert; nicht artspezifisch |
| Petersilie | `ernte_ab_d` | «Slower to start (21–28 days to first harvest)» | Rise Gardens Blog 2026 (C, System nicht genannt) | Bereich ohne typischen Wert |
| Petersilie | `ernteintervall_d` | «Slower herbs like parsley and thyme typically yield a harvest every 14–21 days» | Rise Gardens Blog 2026 | Bereich; Feld ist mit 7 Tagen freigegeben |

### Verworfen oder ohne geeignete Zahl

| Quelle | Grund |
|---|---|
| Horticultura Brasileira 2022, Messung 40 DAT | gleicher Grund wie `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#1` (Erntezeitpunkt aus der Literatur übernommen, nicht gemessen); nicht erneut eingereicht |
| Agronomy 9(7):389 (2019), Petersilie «4 weeks after transplanting» in NFT | festes Versuchsende, ganze Pflanze abgeschnitten, ohne Bezug zur Erntereife |
| Chilean J. Agric. Res. 81(3) 2021, Schnittlauch «after 90 d of cultivation» | Versuchsende für Analysen, keine Ernteangabe |
| agrowtronics.com «Common chives can live for up to three years» | Lebensdauer der Pflanze allgemein, kein Kulturende in Hydroponik |
| Fork Farms «continuously harvested up to four months before replanting» | Monate ab Umsetzen, Kräuter allgemein; Saat bis Umsetzen nur als Bereich (5-7 Tage plus «a day or two»), Bezug ab Saat nicht rechenbar |
| VT SPES-466 «weekly over a course of six weeks» | keine wörtliche Zahl der Schnitte, nur Versuchsdauer |

### Lückenliste nach Runde 12 (Klasse D)

| Art | Kulturform | Feld | Stand und was Anbauquellen sagen |
|---|---|---|---|
| allium_schoenoprasum | dauerkultur_blatt | ernteintervall_d | nur Bereiche (agrowtronics «two to three weeks», Fork Farms «weekly, bi-weekly»); Freiland: Johnny's «3-4 times per year» ([Johnny's Chives](https://www.johnnyseeds.com/growers-library/herbs/chives/chives-key-growing-information.html)) |
| allium_schoenoprasum | dauerkultur_blatt | schnitte_max | kein Wert; Simply Hydroponics nur «after many harvests» |
| allium_schoenoprasum | schnitt | ernteintervall_d, schnitte_max, kulturdauer_max_d | kein Wert; CAFRE nur «best harvested young and replanted» (NFT) |
| petroselinum_crispum | dauerkultur_blatt | schnitte_max, kulturdauer_max_d | kein Einzelwert; VT «until yields begin to diminish», FSHS Kulturende «mid-June» ohne Datum, frankiesgarten «über Monate» ([frankiesgarten Petersilie](https://frankiesgarten.de/anleitungen/gemueseanbau/petersilie-hydroponik/)) |

## Runde 13 (#258)

Gesucht: Petersilie `umsetzen_ab_d` (Vorrang), `umsetzen_bis_d`, `dauerkultur_blatt` `schnitte_max`, `kulturdauer_max_d`; Schnittlauch `umsetzen_ab_d` (Vorrang), `umsetzen_bis_d`, `dauerkultur_blatt` `ernte_ab_d` (Vorrang), `ernteintervall_d`, `schnitte_max`, `schnitt` `ernte_ab_d` (Vorrang), `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d`. Abruf 21.11.2026.

### Suchweg

- Bekannte Quellen erneut auf den Umsetztag gelesen: PLOS ONE 2021 (Dill, Petersilie, Brunnenkresse), Masterarbeit Iowa State 2025 (pH, Bitstream-PDF über die DSpace-Schnittstelle frei), Proc. FSHS 114 (Table 1), VT SPES-466, Simply Hydroponics «Hydroponic Chives», Horticultura Brasileira 2022, Salve Regina (Artikelseite frei, PDF HTTP 403), Gardyn-Hilfeseite Schnittlauch, Upstart University Petersilie, frankiesgarten Petersilie, CAFRE 2020.
- Iowa State Digital Repository: Dissertation Licht-Kräuter 2019 (Kapitel 3 Basilikum, Dill, Petersilie in DFT).
- Websuche: «chives Allium schoenoprasum hydroponic seedlings transplanted weeks after sowing», «chives hydroponic LED days after sowing transplanted», «Allium schoenoprasum hydroponic cuts regrowth harvest days after floating», «AeroGarden chives days to first harvest», «extension hydroponic culinary herbs weeks after sowing transplant deep flow». Neu gelesen: Hydroponics for the Home Grower (CRC Press 2015, Kapitel 22, Leseprobe der Kapitelseite), Projektbericht Lettland (laukutikls.lv, NFT im Container).

### Kandidaten

| kandidat_id | Wert | Quelle | Klasse |
|---|---|---|---|
| `art.petroselinum_crispum.umsetzen_ab_d#1` | 5 Wochen ab Saat (D4) | plos-one-dill-petersilie-2021 (Steinwolle 2.5 cm, Deep-Flow) | A |
| `art.petroselinum_crispum.umsetzen_ab_d#2` | 3 Wochen ab Saat (D4) | isu-ph-kraeuter-2025 (Phenolschaum, DFT) | B1 |
| `art.petroselinum_crispum.umsetzen_ab_d#3` | 3 Wochen ab Saat (D4) | isu-diss-kraeuter-licht-2019 (Phenolschaum, DFT; neu) | B1 |
| `art.petroselinum_crispum.umsetzen_ab_d#4` | 47 Tage ab Saat | fshs-kraeuter-vertikal-2001 (Perlit-Türme) | A |
| `art.petroselinum_crispum.umsetzen_ab_d#5` | 28 Tage ab Saat (Spalte True Leaves, Umsetzen nach den echten Blättern) | vt-spes-466-2023 | B1 |
| `ak.petroselinum_crispum.dauerkultur_blatt.kulturdauer_max_d#2` | 1 Jahr ab Saat (Direktsaat; «easily last a year between crop changes») | crc-hydroponik-heimgaertner-2015 (Perlit-Türme; neu) | C |
| `art.allium_schoenoprasum.umsetzen_ab_d#1` | 15 Tage («propagate … in approximately 15 days», Artikelseite) | salve-regina-schnittlauch-2023 (Steinwolle, Turm, innen) | B1 |
| `art.allium_schoenoprasum.umsetzen_ab_d#2` | 4 Wochen ab Saat (D4) | simplyhydro-schnittlauch | C |
| `art.allium_schoenoprasum.umsetzen_bis_d#1` | 6 Wochen ab Saat (D4) | simplyhydro-schnittlauch | C |
| `art.allium_schoenoprasum.umsetzen_ab_d#3` | 25 Tage ab Saat (zugekaufte Setzlinge) | hortic-bras-schnittlauch-2022 (NFT) | A |

Hinweise für den Lead: Petersilie streut von 3 Wochen (Phenolschaum in der Klimakammer) über 28 Tage (VT) und 5 Wochen (Steinwolle im Gewächshaus) bis 47 Tage (FSHS, Herbst in Florida). VT nennt ein Stadium mit Tageszahl in derselben Tabelle; nach der Auftragsregel «Stadium ist kein Kandidat» entscheidet der Lead, ob 28 Tage gelten. Schnittlauch: Salve Regina sagt «propagate … in approximately 15 days» ohne ausdrücklichen Bezug ab Saat; der Wortlaut «Transferred to Grow System on day 15» steht nur im PDF (siehe «Nur im Browser lesbar»). Hortic. Bras.: die Setzlinge stammen aus einer Gärtnerei (Substrat nicht genannt), nur der Tag ist belegt. CRC Petersilie: «easily last a year» ist eher eine Mindest- als eine Höchstangabe.

### Offene Werte (Form passt nicht, kein Kandidat)

| Art | Feld | Wortlaut | Quelle | grund |
|---|---|---|---|---|
| Schnittlauch | `ernte_ab_d` (Direktsaat, ab Saat) | «They take 75-85 days from sowing to first harvest.» (Pflanztürme mit Perlit, Direktsaat) | crc-hydroponik-heimgaertner-2015, Kapitel 22 (C) | Bereich ohne typischen Wert |
| Schnittlauch | `kulturdauer_max_d` | «If properly maintained by frequent harvests, thereafter they will continue producing for almost a year.» | crc-hydroponik-heimgaertner-2015, Kapitel 22 (C) | keine bestimmte Zahl («almost a year»), Bezug erste Ernte |
| Schnittlauch | `ernte_ab_d` (Direktsaat, ab Saat) | «Days to Maturity: 75-85» | gardyn-schnittlauch (B2, Indoor-Turm mit LED) | Bereich ohne typischen Wert |
| Petersilie | `umsetzen_ab_d` | «Seedlings are ready to transplant a few weeks later when they display their true leaves» | upstart-petersilie-2016 (B2) | keine Zahl |

### Verworfen oder ohne geeignete Zahl

| Quelle | Grund |
|---|---|
| Projektbericht Lettland «The Impact of Luminaire Type and Light Intensity on Herb Yield and Uniformity in Hydroponic Systems» (laukutikls.lv, Projekt 22-00-A01612-000018; alle Kräuter «45 days in nursery shelves before transplanting», NFT im Container mit LED) | keine Organisation oder Autorenschaft erkennbar; Einleitung mit nicht prüfbaren Literaturangaben (Verdacht auf KI-Text); Anzucht in «jiffy (25mm)» ohne Angabe des Materials; einheitlicher Tag für alle Arten ist Versuchsplan |
| Frontiers in Nutrition 2022 (Allium tuberosum, «2-month-old seedlings», DFT mit LED) | Knoblauch-Schnittlauch, andere Art (Regel 4) |
| frankiesgarten Petersilie | Anzuchtkarte nur mit leeren Feldern («In den Tower nach: Tagen»), Keimung «1 bis 4 Wochen» |
| CAFRE 2020 (5.9 Chives, Anhang 2) | keine Tage, nur Balkendiagramm |
| AeroGarden-Blog «What to expect from AeroGarden plants» | HTTP 403; nach Suchauszug nur Kräuter allgemein (Keimung 5-15 Tage, Ernte im Mittel 21 Tage), nicht artspezifisch, daher nicht unter «Nur im Browser» |
| Johnny's Chives, PlantVillage (Penn State) | Freiland bzw. Erde; «about 4 weeks old» (PlantVillage) nur als Hinweis |

### Lückenliste Runde 13 (Klasse D)

| Art | Kulturform | Feld | Stand und was Anbauquellen sagen |
|---|---|---|---|
| petroselinum_crispum | Art | `umsetzen_bis_d` | keine hydroponische Quelle nennt einen spätesten Tag; Upstart nur «a few weeks later» ([Upstart Parsley](https://university.upstartfarmers.com/blog/growing-hydroponic-parsley)) |
| petroselinum_crispum | `dauerkultur_blatt` | `schnitte_max` | keine Zahl; CRC «Harvest them regularly every few weeks», VT «until yields begin to diminish» |
| allium_schoenoprasum | `dauerkultur_blatt`, `schnitt` | `ernte_ab_d` | nur Bereiche (CRC und Gardyn 75-85 Tage ab Saat, agrowtronics «Three to four weeks») oder nicht prüfbar (Salve Regina «Day 52», PDF gesperrt) |
| allium_schoenoprasum | `dauerkultur_blatt`, `schnitt` | `ernteintervall_d` | nur Bereiche (agrowtronics «two to three weeks»); Simply Hydroponics «every three to eight weeks» gilt für Allium tuberosum; Freiland: Johnny's «3-4 times per year» ([Johnny's Chives](https://www.johnnyseeds.com/growers-library/herbs/chives/chives-key-growing-information.html)) |
| allium_schoenoprasum | `dauerkultur_blatt`, `schnitt` | `schnitte_max` | keine Zahl; Simply Hydroponics «after many harvests» |
| allium_schoenoprasum | `schnitt` | `kulturdauer_max_d` | keine Zahl für Schnittkultur; CRC «continue producing for almost a year» (Dauerkultur, ohne bestimmte Zahl) |

### Nur im Browser lesbar

| Artikelseite | erwartete Fundstelle | gesuchtes Feld |
|---|---|---|
| Salve Regina Hydroponic Growing Guide: Dolores Chive, https://digitalcommons.salve.edu/hydroponic_center/4 (Artikelseite frei, PDF über «Download» liefert HTTP 403) | PDF S. 2, Abschnitt «Propagation»: «Transferred to Grow System on day 15», «First Harvest Day: Day 52 in the Tower 3 System», allenfalls Folgeernten | `art.allium_schoenoprasum.umsetzen_ab_d` (Bestätigung), `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d`, `ak.allium_schoenoprasum.schnitt.ernte_ab_d`, `ernteintervall_d` |
| Agronomy 9(7):389 (2019), https://www.mdpi.com/2073-4395/9/7/389 (MDPI, HTTP 403) | Materials and Methods, Pflanzenmaterial: Saat und Umsetzen in NFT (Tage oder Wochen nach Saat) für Petersilie | `art.petroselinum_crispum.umsetzen_ab_d` |
| HortTechnology 34 (2024), Saatdichte Petersilie, https://doi.org/10.21273/HORTTECH05381-23 (ASHS, Seite lädt nur mit JavaScript) | Materials and Methods: Saat- und Umsetztermin sowie Ernten für Petersilie (Ebbe-Flut) | `art.petroselinum_crispum.umsetzen_ab_d`, `ak.petroselinum_crispum.dauerkultur_blatt.schnitte_max` |

### Nachtrag Runde 13: Lesekopien des Koordinators

| kandidat_id | Wert | Quelle | Klasse |
|---|---|---|---|
| `art.petroselinum_crispum.umsetzen_ab_d#6` | 3 Wochen ab Saat (D4) | agronomy-ec-kraeuter-2019 (Phenolschaum, NFT; Lesekopie) | A |
| `art.petroselinum_crispum.umsetzen_ab_d#7` | 21 Tage ab Saat | horttech-34-saatdichte-petersilie-2024 (Phenolschaum 2.2 cm, DWC; Lesekopie) | A |

Nicht erfasst: Ernte «Four weeks after transplanting» (Agronomy) und Standzeit «28 (parsley) days» im DWC (HortTechnology) sind feste Versuchsenden mit Abschneiden der ganzen Pflanze, keine Zahl für `schnitte_max` oder `kulturdauer_max_d`. Salve Regina bleibt ohne Kandidat (PDF auch im Browser nicht lesbar).

## Runde 14 (#266)

Gesucht: Schnittlauch `dauerkultur_blatt` **ernte_ab_d**, ernteintervall_d, schnitte_max; Schnittlauch `schnitt` **ernte_ab_d**, ernteintervall_d, schnitte_max, kulturdauer_max_d; Petersilie `dauerkultur_blatt` schnitte_max, kulturdauer_max_d. Neue Bereichsregel angewendet (ein Kandidat je Bereich, untere Grenze bei Ernte und Intervall, obere bei Kulturdauer). Abruf 22.11.2026.

### Suchweg

- Bekannte Quellen erneut gelesen: CRC Kapitel 22 (Leseprobe der Kapitelseite; dabei der Absatz zu Direktsaat und Ersatz in den Pflanztürmen), agrowtronics «Hydroponic Chives: The Grow Guide» (in Runde 12 nur offen, jetzt mit Bereichsregel).
- Tower Garden: Seite «Growing Guidance» der Schulen (schools.towergarden.com) verlinkt die Pflanzenleitfäden als PDF auf dem Shopify-Speicher des Herstellers; Schnittlauch-Leitfaden frei lesbar (der Blogartikel `tower-garden-schnittlauch` bleibt gesperrt).
- Websuche: «chives hydroponic first harvest weeks transplant», «Allium schoenoprasum hydroponic LED harvest days after transplanting regrowth», «hydroponic chives harvests before replanting», «hydroponic parsley how long productive months replace», «AeroGarden chives days harvest». Europe PMC: «Allium schoenoprasum» mit hydroponic, soilless, NFT, floating, aeroponic.
- Neu gelesen: IGWorks «Growing Hydroponic Chives» (Hersteller iHarvest), Tower Garden Chives Plant Guide, Tower Garden «General Guidelines – Harvesting» und «The Best Herbs to Grow», Rise Gardens «How Long Do Hydroponic Plants Live Before You Replant?», Heliyon 2019 (Schnittlauch mit *Beauveria*).

### Kandidaten

| kandidat_id | Wert | Quelle | Klasse |
|---|---|---|---|
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#3` | 75 (Bereich 75 bis 85 Tage ab Saat, Direktsaat, Umsetztag nicht genannt) | crc-hydroponik-heimgaertner-2015 (Perlit-Türme) | C |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#4` | 3 (Bereich 3 bis 4 Wochen ab Umsetzen) | agrowtronics-schnittlauch-2021 (neu) | C |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#5` | 4 (Bereich 4 bis 5 Wochen, als ab Saat gelesen) | igworks-schnittlauch (neu) | B2 |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#6` | 2 (Bereich 2 bis 3 Wochen, ab Umsetzen aus dem Zusammenhang) | tower-garden-schnittlauch-leitfaden (neu) | B2 |
| `ak.allium_schoenoprasum.schnitt.ernte_ab_d#2` bis `#5` | wie `dauerkultur_blatt` #3 bis #6 (75, 3, 4, 2) | dieselben | C, C, B2, B2 |
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d#1` | 2 (Bereich 2 bis 3 Wochen) | agrowtronics-schnittlauch-2021 | C |
| `ak.allium_schoenoprasum.schnitt.ernteintervall_d#1` | 2 (Bereich 2 bis 3 Wochen) | agrowtronics-schnittlauch-2021 | C |
| `ak.allium_schoenoprasum.schnitt.kulturdauer_max_d#1` | 1 Jahr ab Saat (Direktsaat; «continue growing well for a year provided they are frequently cut back») | crc-hydroponik-heimgaertner-2015 | C |
| `ak.petroselinum_crispum.dauerkultur_blatt.kulturdauer_max_d#3` | 1 Jahr ab Saat (gleicher Satz, gilt für «parsleys») | crc-hydroponik-heimgaertner-2015 | C |

Hinweise für den Lead:
- CRC: Der Absatz «Sow the others directly into the substrate of the plant tower pot corners» belegt Direktsaat für Schnittlauch, Petersilie und Basilikum in den Türmen (nur Lavendel, Rosmarin, Thymian werden umgesetzt). Damit zählen «75-85 days from sowing» und die Ersatzangaben ab Saat; D7 zieht für `ernte_ab_d` den Umsetztag 28 ab.
- CRC-Kulturdauer: Der neue Satz steht im selben Absatz wie die Ersatzregel («Replace thyme after 6 months, and basils … after 3-4 months»), anders als `petroselinum_crispum…kulturdauer_max_d#2` («easily last a year», verworfen). Ob «for a year» als Kulturende gilt, prüft die Methodenprüfung. Für Schnittlauch `dauerkultur_blatt` ist `kulturdauer_max_d` schon freigegeben (730); den Satz habe ich dort nicht angelegt.
- IGWorks: Der Bezug von «4-5 weeks» steht nicht ausdrücklich da. Weil die Keimlinge «after only a few days» umgesetzt werden, habe ich nach der Regel im Auftrag «ab Saat, Umsetztag nicht genannt» eingetragen. Das System iHarvest (vertikal, Wurzeln in Nährlösung) ist als `substrat_inert` erfasst, das Medium nennt die Seite nicht.
- Tower Garden: «TIME TO HARVEST 2-3 weeks» ist eine Kopfangabe ohne Bezug; ab Saat ist sie unmöglich (davor Keimung «roughly 1-2 weeks» und Umsetzen «about 1-2 weeks»), deshalb als ab Umsetzen gelesen. Die Methodenprüfung kann sie wegen des fehlenden ausdrücklichen Bezugs verwerfen.
- Die Werte streuen ab Umsetzen von 2 bis 4 Wochen (Tower Garden 2-3, agrowtronics 3-4, IGWorks 4-5) und ab Saat 75 bis 85 Tage (CRC, Perlit-Türme, Gewächshaus).

### Offene Werte (Form passt nicht, kein Kandidat)

| Art | Feld | Wortlaut | Quelle | grund |
|---|---|---|---|---|
| Schnittlauch | `ernteintervall_d` | «Then, in two to three weeks, you can start harvesting» | agrowtronics (C) | gilt für Pflanzung aus geteilten Horsten, nicht für Folgeschnitte; nicht erfasst |

### Verworfen oder ohne geeignete Zahl

| Quelle | Grund |
|---|---|
| Tower Garden «General Guidelines – Harvesting» | Ersatz «once the plant bolts», keine Zahl; «Repeat every 2-3 days» gilt für Blattsalate |
| Rise Gardens «How Long Do Hydroponic Plants Live Before You Replant?» | nur Kräuter allgemein («30 days (herbs and greens)», «start new seed pods for herbs every 3 weeks»), kein Schnittlauch, keine Petersilie |
| Bright Agrotech (Medium, 2015) «Growing Chives in Hydroponics» | HTTP 403; laut Suchauszug Pflanzung aus Teilung, «after a couple of weeks» ohne Zahl; nicht unter «Nur im Browser», weil keine Zahl erwartet wird |
| Heliyon 2019 (PMC6928240) | Töpfe mit Sand, Vermiculit, Perlit; Versuchsende drei Wochen nach Impfung, keine Ernteangabe |
| AeroGarden (Scotts Miracle-Gro) Blog und FAQ | Kräuter allgemein (Ernte im Mittel 21 Tage, Kit «Harvest in 4-6 Weeks»), kein Schnittlauch |
| dripcanopy, hydroponicsup, urbanhydrospace, scaleandstem, lanitexhydrogarden, hydroleopard, hortivinyl, growwithhydroponics, rootlessfarm, urbangrownhome, lifetips.alibaba | Seiten ohne erkennbare Quelle, Verdacht auf KI-Texte (Konzept 9.1) |
| letpot «hydroponic garlic chives», Simply Hydroponics «every three to eight weeks» | *Allium tuberosum*, andere Art (Regel 4) |

### Lückenliste Runde 14 (Klasse D)

| Art | Kulturform | Feld | Stand und was Anbauquellen sagen |
|---|---|---|---|
| allium_schoenoprasum | `dauerkultur_blatt`, `schnitt` | `schnitte_max` | keine hydroponische Quelle nennt eine Zahl der Schnitte; Simply Hydroponics «after many harvests», CRC Ersatz nach einem Jahr ohne Schnittzahl; Freiland: Johnny's «3-4 times per year» ([Johnny's Chives](https://www.johnnyseeds.com/growers-library/herbs/chives/chives-key-growing-information.html)) |
| petroselinum_crispum | `dauerkultur_blatt` | `schnitte_max` | keine Zahl; CRC «Harvest them regularly every few weeks», VT «until yields begin to diminish» ([VT SPES-466](https://www.pubs.ext.vt.edu/content/pubs_ext_vt_edu/en/SPES/spes-466/spes-466.html)) |

### Nur im Browser lesbar

| Artikelseite | erwartete Fundstelle | gesuchtes Feld |
|---|---|---|
| Lettuce Grow «Purly Chives», https://www.lettucegrow.com/products/purly-chives (HTTP 429 bei jedem Abruf, auch in Runde 12) | Kasten zur Sorte: Tage bis zur Ernte bzw. Zeit im Farmstand, Ernteintervall, Ersatz der Pflanze (aeroponischer Turm, Hersteller B2) | `ak.allium_schoenoprasum.*.ernte_ab_d`, `ernteintervall_d`, `schnitte_max`, `kulturdauer_max_d` |

### Nachtrag Runde 14: Lesekopie des Koordinators (Lettuce Grow)

| kandidat_id | Wert | Quelle | Klasse |
|---|---|---|---|
| `ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d#7` | 4 Wochen ab Umsetzen (Lieferung des bewurzelten Setzlings, «From delivery to harvest in about 4 weeks») | lettucegrow-schnittlauch (neu) | B2 |
| `ak.allium_schoenoprasum.schnitt.ernte_ab_d#6` | 4 Wochen ab Umsetzen (gleicher Beleg) | lettucegrow-schnittlauch | B2 |

Hinweise: Die Seite nennt das System nicht; Klasse B2 (Hersteller) und `anbaumethode = substrat_inert` stammen aus meiner Kenntnis des Farmstand-Systems (vertikaler Turm, Nährlösung rieselt über die Wurzeln, Setzlinge im Anzuchtpfropfen), analog zu Tower Garden. Ab Saat ist nichts ableitbar, weil das Alter der gelieferten Setzlinge unbekannt ist. Nicht angelegt: «Week 7+ · replant» (`kulturdauer_max_d` verlangt Tage ab Saat; der Wert zählt ab Lieferung) und «Weeks 4–7 · peak freshness» (kein Ernteintervall, keine Schnittzahl). «Growing details» liess sich nicht aufklappen.
