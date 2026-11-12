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
