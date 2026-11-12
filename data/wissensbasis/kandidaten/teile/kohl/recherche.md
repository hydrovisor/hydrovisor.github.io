# Recherche Kulturgruppe kohl (Probelauf #184)

Stand 12.11.2026 · Art `brassica_rapa_chinensis` (Pak Choi), Kulturform `kopf`, Sorte Misome · nur für den Koordinator.

## Suchweg

- Websuche: «pak choi hydroponic EC», «bok choy hydroponic extension pH EC days to harvest», «pakchoi seedling EC», «pak choi photoperiod LED», «Kratky pak choi CTAHR», «BBCH leafy vegetables forming heads», «pak choi germination temperature».
- Heruntergeladen und gelesen: SFA-Leitfäden (pH 2026, Nährstoffe 2025), PLoS ONE 2018 (PMC), Frontiers 2025 (PDF), Revista Caatinga 2024 (HTML), Oklahoma State HLA-6722 (PDF), BBCH-Monografie 2001 (PDF mit Textschicht); Rise Gardens über WebFetch.
- GBIF über die API (`species/match`, `species/3042702`, `vernacularNames`).

## Hinweise für Koordinator und Prüfer

- **GBIF:** `Brassica rapa subsp. chinensis (L.) Hanelt` (3042702) ist im Backbone ein Synonym von `Brassica rapa L.` (7903057). Ich habe 3042702 eingetragen, weil die `art_id` die Unterart meint; Tim entscheidet, ob der akzeptierte Schlüssel gelten soll.
- **BBCH:** Die JKI-Ausgabe 2018 (julius-kuehn.de, openagrar.de) liess sich nicht als Text lesen (Schrift ohne Zeichentabelle, openagrar mit Bot-Sperre). Verwendet ist die 2. Ausgabe 2001 (BBA, Vorgängerin des JKI) mit lesbarem Text. Der Abschnitt «Leaf vegetables (forming heads)» nennt ausdrücklich «chinese cabbage = Brassica chinensis L.». Zuordnung: Keimung 00–09, Anzucht 10–19, Wachstum 41–49 (Kopfbildung). Die Lücke zwischen 19 und 41 ist eine Eigenheit der Skala (das Blattwachstum läuft weiter). Die Kurzzitate der BBCH-Zeilen verbinden zwei Codezeilen mit «…».
- **Xiao Bai Cai** (SFA 2026) ist ein Pak-Choi-Typ (B. rapa subsp. chinensis). Diese Zuordnung soll der Methodenprüfer bestätigen.
- **Oklahoma State HLA-6722:** Das Merkblatt nennt kein einzelnes System, sondern beschreibt Hydroponik mit oder ohne inertes Substrat. Deshalb steht `system_quelle = substrat_inert` (A). Die pH-Spalte von Table 2 ist im PDF verschoben (am Tabellenende stehen übrige Werte); deshalb ist der pH von Pak Choi nicht übernommen, nur EC 1.5 bis 2.0.
- **Rise Gardens** nennt DWC, NFT und Ebbe-Flut; eingetragen ist `dwc` (zuerst genannt), Umgebung `indoor_led` (Systeme mit LED). Die EC 0.8 bis 1.0 gilt laut Quelle für «Days 1–5: Germination» und steht deshalb in Phase `keimung` (Ebene Art erlaubt; auf Ebene Kulturgruppe nicht übernehmen).
- **Dauern:** Keine Quelle nennt min, typ und max. Alle Dauern stehen in `profilwert_offen.csv`; die Pflichtgrösse `dauer` fehlt deshalb in allen drei Phasen.
- **Wachstum, EC:** Nur Oklahoma State (1.5 bis 2.0) erfüllt die Form. SFA 2025 (2.0 bis 2.5), Rise (1.5 bis 2.5), PLoS ONE (1.8 oder 2.4) und Frontiers (2.3) liegen höher; die Gegenprobe gegen den Düngeplan (Pak Choi Wachstum 1.4) dürfte einen Konflikt melden.
- **Kulturform-Felder:** `ernte_ab_d` aus drei Versuchen (21, 21, 35 Tage ab Umsetzen) und `kulturdauer_typisch_d` 32 aus dem LED-Versuch (Erntetermin des Versuchs, kein Richtwert «typisch»). Für `ernteart`, `kulturdauer_max_d` und `entspitzen` gibt es keinen Beleg. Laut R1.2 bestimmt die Kulturform `kopf` die Ernteart.

## Verworfene Quellen

- SFA «Plant Nutrient Management For Hydroponic Cultivation» (2025, Table 2: Bok choy EC 2.0–2.5 mS/cm, pH 5.5–6.8): Die Quelle nennt kein System. Beide Werte erfüllen die Form ohnehin nicht (EC über 2.0, pH-Band 1.3). Nicht eingetragen; als Konfliktwert für Tim erwähnenswert.
- Thai-Studie DFT/NFT/Tropf (tci-thaijo): EC 1.5–2.5 und pH 5.5–6.5 nur als Versuchseinstellung, Volltext nicht geprüft.
- scaleandstem.pages.dev, dripcanopy.pages.dev, Medium «Heroic Hydro», Blogspot-Tagebuch: Blogs bzw. Seiten ohne erkennbare Quelle.
- Johnny's Selected Seeds, Hydroponic Seed-Starting: keine Werte für Pak Choi (pH 5.8–6.2 allgemein, Licht «at least 14 hours» allgemein).
- Johnny's und Kitchen Garden Seeds, Keimtemperatur 70–75 °F bzw. 75 °F Bodentemperatur: Erde bzw. Tüte, in °F.
- saemereien.ch Misome: keine Keimangaben (nur Freiland-Aussaat); gehört ohnehin zur Sorte (sorten.csv, Tim).
- CTAHR VC-1 (Kratky): nennt Pak Choi nur als möglichen Kultur-Kandidaten, ohne Werte; für `systemeignung` nicht ausreichend.
- Kardinaltemperaturen der Keimung (forage brassicas, B. campestris): keine Empfehlung für einen Keimtemperatur-Bereich, nicht hydroponisch.
- Indonesische NFT-Studien in ppm ohne Faktor (1050, 1200, 1400 ppm): ppm ohne Faktor oder Messgerät, keine Kandidaten.

## Lückenliste (Klasse D, keine Zeile)

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| brassica_rapa_chinensis | keimung | dauer | nur offen (Rise 3–5 Tage, Bereich ohne typ) |
| brassica_rapa_chinensis | keimung | keimart | kein Beleg (Tüte Misome ohne Angabe) |
| brassica_rapa_chinensis | keimung | keimtemp | nur offen (Rise 70–75 °F) |
| brassica_rapa_chinensis | anzucht | dauer | nur offen (SFA 14–16 und Rise 7–10 Tage ab Saat, Frontiers 11 DAS) |
| brassica_rapa_chinensis | anzucht | ec | nur offen (PLoS ONE EC 1.2 als Einzelwert) |
| brassica_rapa_chinensis | anzucht | wassertemp | kein Beleg |
| brassica_rapa_chinensis | wachstum | dauer | nur offen (21, 21, 35 Tage als Einzelwerte) |
| brassica_rapa_chinensis | wachstum | wassertemp | nur offen (Rise 65–72 °F) |
| brassica_rapa_chinensis | Artmerkmale | samentyp, standard_keimfaehigkeit, systemeignung, liter_je_pflanze, wasserbedarf_je_pflanze_l, wuchshoehe_max_mm, kritische_tageslaenge_h, bestaeubung_noetig, pythium, schossen_handlung, kulturformen_erlaubt, kulturform_vorgabe | kein hydroponischer Beleg gesucht oder gefunden (Probelauf) |
| brassica_rapa_chinensis | kopf | ernteart, kulturdauer_max_d, entspitzen | kein Beleg |

Saatempfehlung `se.brassica_rapa_chinensis.kopf`: zwei Kandidaten (B: 1 Samen je Steinwollstopfen; C: 5 Samen je Kokoszelle, 1 stehen lassen). Keine Studie mit Würfel 2 bis 3 cm (Klasse A) gefunden.

## Runde 2 (12.11.2026, Auftrag `auftrag_runde-2.md`)

### Suchweg

- frankiesgarten.de (von Tim als Praxisquelle Klasse C zugelassen): Pak-Choi-Anleitung dreimal über WebFetch gelesen (Werte, Kurzzitate, Aufbau der Anzuchtstation und des Towers); FAQ-Seite gelesen (keine Pak-Choi-Werte, Frage «Wie viele Samen kommen in einen Würfel?» ohne Antwort).
- Websuche: «baby leaf pak choi hydroponic harvest days», «pak choi baby leaf floating system», «Kratky pak choi CTAHR», «hydroponic pak choi rockwool germinate days», Wortlaut «Optimum germination temperatures … 75°F and 83°F».
- Gelesen (PDF mit pdftotext): CTAHR VC-1 (2010), Cornell/GPN «Growing Hydroponic Leafy Greens» (2016), UT/UF W 844-B (2019), ACS Omega 2024 (rote Pak-Choi-Babyblätter).

### Hinweise für Koordinator und Prüfer

- **frankiesgarten.de:** Kein Veröffentlichungsdatum (Fusszeile «© 2025», Bildpfade 2026/11); `jahr` leer, `quelle_id` mit Abrufjahr. Keimung in Schaumstoffwürfeln in einer Anzuchtbox mit Deckel, Anzucht in einer Station (Würfel im 5-cm-Netztopf, Wasserstand wird abgesenkt bis 0.5 bis 1 cm Luft; keine Luftpumpe genannt) → `substrat_inert` (A). Wachstum im «Hydro Tower» (Pumpe fördert die Lösung nach oben, sie läuft durch die Etagen zurück) → `nft` als nächstliegender Wert (A). Lampen seitlich, LED nicht ausdrücklich für die eigene Anlage → `umgebung_quelle = andere`. EC in mS/cm, ob mit Leitungswasser gemessen ist nicht gesagt → `ec_basis = unbekannt`.
- **EC-Stufen frankiesgarten** («Anzucht 0,5, Jungpflanze 0,9, Wachstum 1,4, Ernte 1,8»): Anzucht und Jungpflanze laufen laut Abschnitt 2 in der Anzuchtstation → `anzucht.ec` 0.5 bis 0.9; Wachstum und Ernte im Tower → `wachstum.ec` 1.4 bis 1.8. Die Stufen sind Einzelwerte je Unterphase, die Bandgrenzen sind deren Wortlaut (nichts ergänzt). Methodenprüfer: Zuordnung bitte bestätigen. `wachstum.ec` 1.4 bis 1.8 passt zum Düngeplan (Pak Choi Wachstum 1.4).
- **Licht und Wassertemperatur frankiesgarten:** 14 bis 16 h und «Wasser 18 bis 22 °C» stehen ohne Phasentrennung; je ein Kandidat in `anzucht` und `wachstum`. Keimung im Dunkeln (Deckel) → kein `keimung.licht_h`.
- **Dauern frankiesgarten:** Keimung «meist 4 bis 7 Tage» (Bereich ohne typ), Anzucht «etwa Tag 7 bis 21» (14 Tage, Einzelwert), Tower «etwa ab Tag 21» bis Ernte «etwa ab Tag 35» (14 Tage, Einzelwert): alle nach `profilwert_offen.csv`. Der Zählbeginn «ab Saat» ist nur aus der Beschriftung «Tag 0 bis 7» der Keimphase erschlossen. Keimtemperatur 20 bis 25 °C ohne typ ebenfalls offen (`keimtemp` verlangt `wert_typ`).
- **Cornell/GPN 2016:** Autor ist Extension-Spezialist der Cornell CEA, erschienen in einer Fachzeitschrift → `universitaet_beratung`, B1 (Methodenprüfer bitte bestätigen). Satz «The above method for growing head lettuce can be similarly used for … pak choi» belegt Pak Choi als Kopf im DWC/NFT-Verfahren (Wortlaut mit Tippfehler «grow growing» der Quelle). Baby Leaf nennt die Quelle nur für lettuce, arugula, upland cress, kale, mizuna, mustard → Saatmenge Babyleaf nur als Analogie, Bereich 6 bis 12 → `saatempfehlung_offen.csv`.
- **CTAHR VC-1:** In Runde 1 als «nicht ausreichend» verworfen; jetzt als Kandidat `systemeignung = kratky` eingetragen, weil der Satz Pak Choi ausdrücklich als mögliche Kultur des Kratky-Verfahrens nennt (ohne Versuchswerte). Mit Cornell (`dwc`) entscheidet der Lead, ob `beide` gilt; keine Quelle nennt beide Systeme zusammen.
- **Babyleaf:** Rise Gardens' «baby bok choy» (21 bis 30 Tage ab Keimung) meint kleine Köpfe von Baby-Sorten, nicht Babyleaf; nicht übernommen.

### Verworfene Quellen (Runde 2)

- ACS Omega 2024 (rote Pak-Choi-Babyblätter, Ernte 24 DAS): Anbau in Töpfen mit Vermiculit-Erde, nicht hydroponisch.
- Taylor & Francis, «Hydroponics for the Home Grower», Kapitel «Seeding, Transplanting of Vegetable Crops» (Keimtemperatur 75–83 °F (24–28 °C), ein Samen je Würfel laut Suchauszug): Volltext nicht zugänglich, Wortlaut nicht prüfbar.
- UT/UF W 844-B (2019): nennt «pak choy» nur als geeignete Blattkultur, Babyleaf-Angaben nur für Salat; Keimtemperatur 70–75 °F allgemein und in °F.
- Johnny's, Van Meuwen, Kitchen Garden Seeds (Babyleaf 30 Tage, Keimung 5–10 Tage): Kataloge bzw. Erde, nicht für Dauern zulässig.
- Malaysische Raft-Studie (curly dwarf pak choy, 50 Pflanzen/m², EC 2.2) und indonesische Floating-Raft-Studie: nur Suchauszug, Volltext nicht gelesen; EC 2.2 über Obergrenze.
- frankiesgarten.de FAQ: keine Pak-Choi-Werte.

### Lückenliste nach Runde 2 (Klasse D, keine Zeile)

| Art | Phase/Bereich | Grösse | Stand |
|---|---|---|---|
| brassica_rapa_chinensis | keimung | dauer | nur offen (Rise 3–5, frankiesgarten 4–7 Tage, je Bereich ohne typ) |
| brassica_rapa_chinensis | keimung | keimtemp | nur offen (Rise 70–75 °F, frankiesgarten 20–25 °C ohne typ) |
| brassica_rapa_chinensis | keimung | licht_h, wassertemp | kein Beleg (Keimung im Dunkeln im feuchten Würfel) |
| brassica_rapa_chinensis | anzucht | dauer | nur offen (zusätzlich frankiesgarten 14 Tage als Einzelwert) |
| brassica_rapa_chinensis | wachstum | dauer | nur offen (zusätzlich frankiesgarten 14 Tage als Einzelwert) |
| brassica_rapa_chinensis | Artmerkmale | samentyp, standard_keimfaehigkeit | kein Beleg |
| brassica_rapa_chinensis | Artmerkmale | kulturformen_erlaubt mit `babyleaf` | keine hydroponische Quelle belegt Pak Choi als Babyleaf; Kandidaten nur `kopf` |
| brassica_rapa_chinensis | babyleaf | ernte_ab_d, ernteart, kulturdauer_typisch_d | kein hydroponischer Beleg |
| brassica_rapa_chinensis | babyleaf | Saatempfehlung | nur offen (Cornell 6 bis 12 Samen je Zelle, Analogie) |

Geschlossen in Runde 2 (Kandidat in Form): `keimung.keimart` (dunkel), `anzucht.ec` (0.5 bis 0.9 mS/cm), `anzucht.wassertemp`, `systemeignung` (dwc bzw. kratky), `kulturformen_erlaubt` und `kulturform_vorgabe` (kopf).
