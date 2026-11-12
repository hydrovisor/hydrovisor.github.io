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
| Masterarbeit Iowa State, Kapitel 1 Literaturübersicht «For parsley, a pH range of 5.5 to 6.0 is recommended» | Sekundärzitat (Morgan 2005), nicht eigene Angabe |
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
