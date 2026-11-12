# Recherche kraut_einjaehrig (Basilikum, ocimum_basilicum), W0-Probelauf #184

Stand 12.11.2026 · Rechercheur kraut_einjaehrig · Kulturform `dauerkultur_blatt` (Entspitzen bei 12 cm), Sorten Genoveser und Pourpre, System DWC (Platz 2.1). Kein Standardprofil.

## Suchweg (Stichworte)

- Beratung und Universität: «hydroponic basil EC pH extension»; Oklahoma State HLA-6722 (Tabelle EC und pH je Kultur), UT/UF W 844-B (Blattkulturen in Kleinanlagen, Abschnitt Basil, Anzucht in Würfeln), FAO Technical Paper 589 (Aquaponik, Anhang 1 Basil), Ohio State Knowledge Bank (pH-Versuch Basilikum in DWC).
- Studien: Walters/Currey 2018 (EC 0.5 bis 4.0 in NFT, kein Effekt), Ohio State und Arizona (pH 4.0 bis 5.5 in DWC), Arkansas 2020 (Umsetzzeitpunkt 14, 21, 28 Tage), Frontiers 2021 (Basilikum in Steinwollwürfel 2.5 cm, 2 Samen je Zelle).
- Hersteller und Praxis: Johnny's Selected Seeds (Basilikum-Leitfaden Hydroponik, Artikel Anzucht), Rise Gardens (Nährstoffe für Kräuter), Grodan (nichts zu Basilikum).
- BBCH: JKI-Monografie 2018 (Text im PDF nicht auslesbar, Schrift verschlüsselt), daher englische 2. Ausgabe 2001 (inhaltsgleich), allgemeine Skala, weil die Monografie keine Skala für Ocimum führt.
- Tüte: Produktseiten Sämereien.ch Genoveser und Pourpre (nur Keimart und Keimtemperatur verwendet).
- GBIF-API: usageKey 2927096, Ocimum basilicum L., Lamiaceae, deutscher Name Basilikum.

## Annahmen des Rechercheurs (A)

1. Werte ohne Phasenangabe (Oklahoma, Johnny's, FAO, Rise für pH) stehen in der Phase `wachstum`; die Phase `anzucht` erhält nur Werte, die die Quelle für Sämlinge oder junge Pflanzen nennt (Rise «young plants», W 844-B «seedlings», Johnny's Anzucht-Artikel).
2. `system_quelle` bei Quellen ohne System für den Wert: das in der Quelle selbst genannte oder abgebildete System (Oklahoma: Dutch Bucket mit Blähton → `substrat_inert`; W 844-B: Floating-System → `dwc`; Johnny's Basilikum: raft → `dwc`; Rise: Wasserkultur ohne Substrat → `dwc`; FAO: Aquaponik, empfohlen media beds, NFT, DWC → `dwc`). Der Methodenprüfer entscheidet, ob Aquaponik (FAO) als hydroponisch gilt.
3. BBCH-Grenzen sind eine Zuordnung zur allgemeinen Skala: Keimung 00 bis 09, Anzucht 10 bis 12 (Ende nach dem Umsetzmerkmal «4-5 true leaves» der FAO, bei gegenständigen Blättern 2 Blattpaare), Wachstum 13 bis 49 (Ende vor 51, Blütenknospen = Schossen nach R1.7). Der Fachkritiker möge prüfen, ob die Gruppe kohl (Anzucht 10 bis 19) einheitlich sein soll.
4. Pythium `hoch` aus «more susceptible than others» (Ohio State).
5. Saatempfehlung Klasse A: `obergrenze_samen` = 2, weil die Studie keine höhere Obergrenze nennt.

## Verworfene oder nicht verwendete Quellen

- Walters/Currey 2018 (HortScience 53, NFT): nur Versuchsstufen 0.5 bis 4.0 mS/cm ohne Empfehlungsband; Artikel Greenhouse Grower 2016 dazu ebenso (pH «adjusted to 6 daily», 16 h, 72 °F als Versuchseinstellung).
- NC State, HortScience 2023 («recommended EC … 1.2 to 2.2 mS/cm»): Volltext nicht abrufbar (HTTP 403), kein Kurzzitat geprüft.
- Iowa State, Masterarbeit 2025 zum pH von Kräutern (Basilikum 4.5 bis 6.5, Optimum 5.5) und Zusammenfassung producegrower.com: nicht abrufbar (403), ausserdem pH-Band ausserhalb 5.2 bis 7.0.
- UT CEA HERB Teil 2 und 3 (greenhousemag.com, producegrower.com; laut Suchauszug Basilikum 15 bis 20 Samen je Zelle Phenolschaum, Umsetzen 14 Tage nach Saat in DWC): Seiten nicht abrufbar (Bot-Schutz), daher kein Kandidat. Wertvoll für Saatmenge (Schaum, Klasse A oder B) und Anzuchtdauer; Koordinator möge den Abruf von Hand prüfen.
- Begutachtete Studie HortTechnology 2024 (Saatdichte Phenolschaum): nur Petersilie, Koriander, Salbei, kein Basilikum (für kraut_ausdauernd interessant: Petersilie 16 Samen je Zelle).
- Ohio State pH-Versuch (Gillespie): pH 4.0 bis 5.5 ohne Wachstumsunterschied, kein Empfehlungsband; nur für Pythium verwendet.
- Arkansas, HortTechnology 2020: Umsetzen 14, 21, 28 Tage nach Saat als Versuchsstufen, keine Empfehlung.
- Frontiers 2025 (Wachstumsstadien Basilikum per Bild): Töpfe, kein hydroponisches System, keine BBCH-Codes.
- Johnny's Topfkultur («plug tray and after 2–3 weeks», 5 bis 15 Samen je 4-Zoll-Topf): Topfkultur mit Substrat, nicht hydroponisch. Johnny's Multi-Seed-Pellet (5 bis 6 Samen je 2.5-Zoll-Würfel): Würfel 6.4 cm, keine Angabe zu stehen lassen; nicht verwendet.
- Johnny's Temperatur 65 bis 70 °F: Lufttemperatur, keine Wassertemperatur.
- Oklahoma HLA-6722 «Water temperature of 72 to 75 F is optimal»: allgemein für Hydroponik, nicht artspezifisch, °F; dem Rechercheur des Standardprofils überlassen.
- Sämereien.ch Keimdauer (Genoveser 14 bis 20 Tage, Pourpre 6 bis 8 Tage), Ernte «2 Monate nach der Aussaat», Abstände: Tüte bzw. Erde, für Dauern ausgeschlossen.
- Blogs ohne erkennbare Quelle (agrifarming.in, pages.dev-Seiten, letpot, mequoda): ausgeschlossen.

Hinweis zu Rise Gardens: Blogartikel eines Herstellers hydroponischer Indoor-Gärten (2026), ohne Versuch; als B2 geführt, der Methodenprüfer möge die Klasse prüfen.

## Lückenliste (Klasse D, keine Zeile)

| Art | Phase | Grösse | Stand |
|---|---|---|---|
| ocimum_basilicum | keimung | dauer | nur FAO 6 bis 7 Tage ohne typ (offen) |
| ocimum_basilicum | keimung | keimtemp | nur FAO 20 bis 25 °C ohne typ und Tüte 20 °C (offen) |
| ocimum_basilicum | anzucht | dauer | kein artspezifischer Wert; W 844-B 12 bis 18 Tage ab Saat allgemein (offen) |
| ocimum_basilicum | wachstum | dauer | nur FAO 5 bis 6 Wochen bis Erntebeginn und Johnny's 28 Tage Kulturzeit (offen); Dauer bis Kulturende fehlt |
| ocimum_basilicum | anzucht | ph | nur allgemeiner Wert für hydroponische Anzucht (Johnny's), kein artspezifischer |
| ocimum_basilicum | anzucht, wachstum | licht_h | nur Johnny's «Minimum 14 hours» (offen); kein Band |
| ocimum_basilicum | anzucht, wachstum | wassertemp | nur FAO «higher than 21 °C» und Rise 65 bis 72 °F (offen); kein Band in °C |
| ocimum_basilicum | anzucht | wassertemp, licht_h | kein Wert |
| ocimum_basilicum | – | art: standard_keimfaehigkeit, systemeignung, liter_je_pflanze, wasserbedarf_je_pflanze_l, pflanzen_je_m2, wuchshoehe_max_mm, wuchsform, photoperiode, umsetzen_ab_d, umsetzen_bis_d | kein hydroponischer Beleg im Format des Felds (FAO nennt 8 bis 40 Pflanzen/m² und 30 bis 70 cm Höhe nur als Bereich bzw. in cm) |
| ocimum_basilicum | dauerkultur_blatt | ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_max_d, kulturdauer_typisch_d | kein Beleg in Tagen (FAO: Ernte ab 15 cm Höhe, Ernte «continues for 30-50 days») |

Saatmenge: Klasse A vorhanden (Steinwolle 2.5 cm, 2 Samen, 1 Pflanze), keine Lücke. Offene Frage für Tim: Babyleaf als weitere Kulturform (Johnny's nennt «Baby-leaf crop grown in hydroponic raft system»); nicht angelegt, weil der Auftrag nur Dauerkultur Blatt nennt.
