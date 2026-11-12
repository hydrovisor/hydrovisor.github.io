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
